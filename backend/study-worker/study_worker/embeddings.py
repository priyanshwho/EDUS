"""One CPU E5 model per process; exact prefix and token accounting."""
import math
import threading
from .core import TOKEN_LIMIT, TOKEN_OVERLAP, chunk_id


class Embedder:
    dimension = 384

    def __init__(self, settings, model=None):
        self.settings = settings
        if model is None:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(settings.embedding_model, revision=settings.embedding_revision,
                                        device="cpu", trust_remote_code=False)
        self.model = model
        self.tokenizer = model.tokenizer
        self.model.max_seq_length = 512
        self.lock = threading.Lock()

    def tokens(self, text, kind="passage"):
        return len(self.tokenizer.encode(f"{kind}: {text}", add_special_tokens=True))

    def embed(self, texts, kind="passage"):
        if kind not in ("query", "passage") or not 1 <= len(texts) <= 32:
            raise ValueError("Expected 1–32 texts and kind query or passage")
        if any(not isinstance(t, str) or not t.strip() or self.tokens(t, kind) > TOKEN_LIMIT for t in texts):
            raise ValueError(f"Each text must fit {TOKEN_LIMIT} tokens including its E5 prefix")
        with self.lock:
            vectors = self.model.encode([f"{kind}: {t}" for t in texts], batch_size=16,
                                        normalize_embeddings=True, show_progress_bar=False)
        result = vectors.tolist() if hasattr(vectors, "tolist") else vectors
        if len(result) != len(texts) or any(
            len(v) != self.dimension or any(not math.isfinite(float(x)) for x in v)
            or not 0.98 <= math.sqrt(sum(float(x) ** 2 for x in v)) <= 1.02 for v in result
        ):
            raise ValueError("Embedding model returned invalid or unnormalized vectors")
        return result

    def chunks(self, document_id, pages):
        chunks = []
        for page in pages:
            text = page.text if page.indexable_text is None else page.indexable_text
            if not text.strip():
                continue
            offsets = self.tokenizer(text, add_special_tokens=False, return_offsets_mapping=True,
                                     truncation=False)["offset_mapping"]
            capacity = TOKEN_LIMIT - self.tokens("") - 4
            start, index = 0, 0
            while start < len(offsets):
                end = min(start + capacity, len(offsets))
                piece = text[offsets[start][0]:offsets[end - 1][1]].strip()
                while end > start and self.tokens(piece) > TOKEN_LIMIT:
                    end -= 1
                    piece = text[offsets[start][0]:offsets[end - 1][1]].strip() if end > start else ""
                if not piece:
                    start += 1
                    continue
                chunks.append({"id": chunk_id(document_id, page.number, index, piece,
                                              self.settings.embedding_model, self.settings.embedding_revision),
                               "page_number": page.number, "chunk_index": index,
                               "text": piece, "tokens": self.tokens(piece)})
                index += 1
                if end >= len(offsets):
                    break
                start = max(start + 1, end - TOKEN_OVERLAP)
        return chunks
