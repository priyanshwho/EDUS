"""Pure helpers and deterministic indexing rules."""
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import re
import uuid

MAX_FILE_BYTES = 20 * 1024 * 1024
MAX_PAGE_CHARS = 60000
MAX_DOCUMENT_CHARS = 2000000
MAX_CHUNKS = 6000
MAX_IMAGE_BYTES = 600000
MAX_ARTIFACT_BYTES = 40 * 1024 * 1024
TOKEN_LIMIT = 450
TOKEN_OVERLAP = 50


class LeaseLost(RuntimeError):
    pass


class BudgetExceeded(RuntimeError):
    def __init__(self, message, retry_after=None, short_window=False):
        super().__init__(message)
        self.retry_after = retry_after
        self.short_window = short_window


class ExtractionError(RuntimeError):
    pass


@dataclass
class Page:
    number: int
    text: str
    method: str
    quality: str = "good"
    image: bytes | None = None
    image_key: str | None = None
    indexable_text: str | None = None


def normalize_text(text):
    text = text.replace("\x00", "").replace("\r\n", "\n")
    return "\n".join(re.sub(r"[ \t]+", " ", line).rstrip() for line in text.splitlines()).strip()


def merge_ocr(native, ocr):
    """Retain native text and append OCR lines not already represented in it."""
    native, ocr = normalize_text(native), normalize_text(ocr)
    normalized_native = " ".join(native.casefold().split())
    seen, additional = set(), []
    for line in ocr.splitlines():
        key = " ".join(line.casefold().split())
        if key and key not in seen and key not in normalized_native:
            additional.append(line)
            seen.add(key)
    return normalize_text(native + "\n" + "\n".join(additional))


def reliable_lines(text):
    return normalize_text("\n".join(
        line for line in text.splitlines()
        if not re.search(r"\[(?:unclear|illegible|unreadable)(?:[^\]]*)\]", line, re.I)
    ))


def chunk_id(document_id, page, index, text, model, revision):
    digest = hashlib.sha256(text.encode()).hexdigest()
    return str(uuid.uuid5(uuid.NAMESPACE_URL,
                          f"edus-study:{document_id}:{page}:{index}:{digest}:{model}:{revision}"))


def derived_prefix(workspace_id, document_id):
    return f"study-derived/{uuid.UUID(str(workspace_id))}/{uuid.UUID(str(document_id))}/"


def quota_reservations(settings, owner_id, now=None):
    now = now or datetime.now(timezone.utc)
    minute = now.replace(second=0, microsecond=0)
    day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    scope = "groq:" + settings.vision_model
    tokens = settings.vision_input_reserve + settings.vision_max_output
    reservations = [
        (scope, "groq_requests_minute", minute, 1, settings.groq_rpm),
        (scope, "groq_requests_day", day, 1, settings.groq_rpd),
        (scope, "groq_tokens_minute", minute, tokens, settings.groq_tpm),
        (scope, "groq_tokens_day", day, tokens, settings.groq_tpd),
        ("user:" + str(owner_id), "vision_pages_day", day, 1, settings.vision_pages_day),
    ]
    return sorted(reservations, key=lambda r: (r[0], r[1], r[2]))
