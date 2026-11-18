"""Page-bounded PDF extraction, printed OCR, and explicit handwriting uncertainty."""
import csv
import io
import math
from pathlib import Path
import re
import subprocess
import tempfile
from .core import (Page, ExtractionError, BudgetExceeded, MAX_PAGE_CHARS, MAX_DOCUMENT_CHARS,
                   MAX_IMAGE_BYTES, merge_ocr, normalize_text, reliable_lines)


def has_images(page):
    """Inspect resource dictionaries without decoding potentially enormous embedded images."""
    def inspect(resources, depth=0):
        if not resources or depth > 3:
            return False
        resources = resources.get_object()
        objects = resources.get("/XObject", {})
        objects = objects.get_object() if hasattr(objects, "get_object") else objects
        for value in list(objects.values())[:100]:
            obj = value.get_object()
            if obj.get("/Subtype") == "/Image":
                return True
            if obj.get("/Subtype") == "/Form" and inspect(obj.get("/Resources"), depth + 1):
                return True
        return False
    return inspect(page.get("/Resources"))


def bounded_jpeg(image):
    image = image.convert("RGB")
    image.thumbnail((1800, 1800))
    for quality in (85, 75, 60, 45):
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=quality, optimize=True)
        if output.tell() <= MAX_IMAGE_BYTES:
            return output.getvalue()
    raise ExtractionError("Page image could not fit the OCR image limit")


def printed_ocr(image):
    """Tesseract TSV confidence is an OCR signal, not an answer confidence score."""
    with tempfile.TemporaryDirectory(prefix="edus-ocr-") as folder:
        path = Path(folder) / "page.png"
        image.save(path, "PNG")
        try:
            result = subprocess.run(["tesseract", str(path), "stdout", "-l", "eng", "--psm", "3", "tsv"],
                                    stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30, check=True)
        except (OSError, subprocess.SubprocessError):
            return "", False
    if len(result.stdout) > 2 * 1024 * 1024:
        return "", False
    lines, scores = {}, []
    for row in csv.DictReader(io.StringIO(result.stdout.decode("utf-8", "replace")), delimiter="\t"):
        text = (row.get("text") or "").strip()
        try:
            confidence = float(row.get("conf", "-1"))
        except ValueError:
            continue
        if text and confidence >= 0:
            key = tuple(row.get(k) for k in ("page_num", "block_num", "par_num", "line_num"))
            lines.setdefault(key, []).append(text)
            scores.append(confidence)
    text = normalize_text("\n".join(" ".join(words) for words in lines.values()))[:MAX_PAGE_CHARS]
    good = bool(scores) and sum(scores) / len(scores) >= 70 and len(text) >= 20
    return text, good


class Extractor:
    def __init__(self, vision, native_factory=None, render_factory=None, ocr=None):
        self.vision = vision
        self.native_factory = native_factory
        self.render_factory = render_factory
        self.ocr = ocr or printed_ocr

    def extract(self, path, job, check):
        if self.native_factory is None:
            from pypdf import PdfReader
            native = PdfReader(path, strict=True)
        else:
            native = self.native_factory(path)
        if native.is_encrypted:
            raise ExtractionError("Password-protected PDFs are not supported")
        count = len(native.pages)
        limit = 30 if job["document_kind"] == "syllabus" else 150
        if not 1 <= count <= limit:
            raise ExtractionError(f"PDF must contain 1–{limit} pages")
        if self.render_factory is None:
            import pypdfium2
            render = pypdfium2.PdfDocument(path)
        else:
            render = self.render_factory(path)
        total = 0
        try:
            for index, pdf_page in enumerate(native.pages):
                check()
                try:
                    contents = pdf_page.get_contents()
                    if contents and len(contents.get_data()) > 8 * 1024 * 1024:
                        raise ExtractionError("Page content stream exceeds the extraction limit")
                    text = normalize_text(pdf_page.extract_text() or "")
                    if len(text) > MAX_PAGE_CHARS:
                        raise ExtractionError("Page exceeds the extracted text limit")
                except ExtractionError:
                    raise
                except Exception:
                    text = ""
                handwritten = bool(job["contains_handwriting"])
                # A native heading can accompany a scanned body: inspect image resources too.
                needs_image = handwritten or len(text) < 100 or has_images(pdf_page)
                if not needs_image:
                    page = Page(index + 1, text, "native")
                else:
                    rendered = render[index]
                    bitmap = None
                    try:
                        width, height = rendered.get_size()
                        if not math.isfinite(width + height) or min(width, height) <= 0:
                            raise ExtractionError("Invalid PDF page dimensions")
                        # PDFium rounds dimensions upward; leave a small margin.
                        scale = min(2.5, 1798 / max(width, height), math.sqrt(2990000 / (width * height)))
                        bitmap = rendered.render(scale=scale)
                        image = bitmap.to_pil().convert("RGB")
                        jpeg = bounded_jpeg(image)
                        ocr_text, good_ocr = self.ocr(image)
                        local_text = merge_ocr(text, ocr_text)
                        page = Page(index + 1, local_text, "native+tesseract" if text else "tesseract",
                                    "good" if good_ocr else "needs_review", jpeg)
                        from PIL import ImageStat
                        blank = not local_text and max(ImageStat.Stat(image.convert("L")).stddev) < 2
                        if blank:
                            page.quality = "blank"
                            page.image = None
                        elif handwritten or not good_ocr:
                            check()
                            try:
                                vision_text, truncated = self.vision.transcribe(jpeg, job["owner_id"], job=job, page_number=index + 1)
                                # Vision covers the full page; avoid mixing contradictory OCR guesses.
                                page.text = vision_text
                                page.method = "groq-vision-handwriting" if handwritten else "groq-vision-ocr"
                                uncertain = bool(re.search(r"\[(unclear|illegible|unreadable)[^\]]*\]", vision_text, re.I))
                                page.quality = "needs_review" if uncertain or truncated or not vision_text else "good"
                                page.indexable_text = reliable_lines(vision_text)
                                if truncated:
                                    # The last line may be an unfinished equation; omit it from retrieval.
                                    page.indexable_text = "\n".join(page.indexable_text.splitlines()[:-1])
                            except BudgetExceeded:
                                page.quality = "quota_limited"
                                page.indexable_text = text  # Only native text is reliable without handwriting OCR.
                            except RuntimeError:
                                page.quality = "vision_unavailable"
                                page.indexable_text = text
                        if not handwritten and page.method in ("tesseract", "native+tesseract") and not good_ocr:
                            page.indexable_text = text
                    finally:
                        if bitmap is not None:
                            bitmap.close()
                        rendered.close()
                total += len(page.text)
                if total > MAX_DOCUMENT_CHARS:
                    raise ExtractionError("Document exceeds the extracted text limit")
                yield page
        finally:
            render.close()
