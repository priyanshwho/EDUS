"""No HTTP request waits for OCR. Heavy work happens outside database transactions."""
import logging
from pathlib import Path
import signal
import tempfile
import threading
import time
from .core import LeaseLost, ExtractionError, MAX_ARTIFACT_BYTES, MAX_CHUNKS

log = logging.getLogger(__name__)


class Lease:
    def __init__(self, database, job, seconds):
        self.database, self.job, self.seconds = database, job, seconds
        self.stopped = threading.Event()
        self.lost = threading.Event()
        self.thread = threading.Thread(target=self.run, daemon=True)

    def run(self):
        while not self.stopped.wait(self.seconds):
            try:
                self.database.heartbeat(self.job)
            except Exception:
                self.lost.set()
                return

    def check(self):
        if self.lost.is_set():
            raise LeaseLost("Worker lost its document lease")
        self.database.assert_live(self.job)

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *args):
        self.stopped.set()
        self.thread.join(timeout=1)


class Worker:
    def __init__(self, settings, database, storage, extractor, embedder):
        self.settings, self.database, self.storage = settings, database, storage
        self.extractor, self.embedder = extractor, embedder
        self.stop = threading.Event()

    def process(self, job):
        published = False
        try:
            with Lease(self.database, job, self.settings.heartbeat_seconds) as lease:
                lease.check()
                if job["kind"] == "delete":
                    self.storage.delete_document(job, lease.check)
                    lease.check()
                    self.database.complete_delete(job)
                    return
                with tempfile.TemporaryDirectory(prefix="edus-study-") as folder:
                    path = Path(folder) / "source.pdf"
                    self.storage.download(job["s3_key"], path, job.get("sha256"))
                    pages, artifact_bytes = [], 0
                    for page in self.extractor.extract(str(path), job, lease.check):
                        lease.check()
                        if page.image and self.settings.store_page_images:
                            artifact_bytes += len(page.image)
                            if artifact_bytes <= MAX_ARTIFACT_BYTES:
                                page.image_key = self.storage.put_page(job, page)
                                # Cancellation can occur during an S3 PUT; failed attempts clean their own prefix.
                                lease.check()
                        page.image = None
                        pages.append(page)
                    self.database.stage(job, "embedding")
                    chunks = self.embedder.chunks(job["document_id"], pages)
                    if len(chunks) > MAX_CHUNKS:
                        raise ExtractionError("Document exceeds the index chunk limit")
                    for start in range(0, len(chunks), 16):
                        lease.check()
                        batch = chunks[start:start + 16]
                        vectors = self.embedder.embed([c["text"] for c in batch], "passage")
                        for chunk, vector in zip(batch, vectors):
                            chunk["embedding"] = vector
                    message = None
                    incomplete = [p for p in pages if p.quality not in ("good", "blank")]
                    if incomplete:
                        message = f"{len(incomplete)} page(s) need review or a later free OCR retry. See page status."
                    if not chunks:
                        message = "No reliable text could be indexed. Review the original PDF or retry OCR later."
                    lease.check()
                    self.database.publish(job, pages, chunks, message)
                    published = True
        except LeaseLost:
            log.info("Study job %s was cancelled or its lease expired", job["id"])
        except Exception as exc:
            log.error("Study job %s failed (%s)", job["id"], type(exc).__name__)
            message = str(exc) if isinstance(exc, ExtractionError) else "Document processing failed; retry is available."
            try:
                self.database.fail(job, message)
            except Exception:
                log.error("Could not record failure for study job %s", job["id"])
        finally:
            if job["kind"] == "ingest" and not published:
                try:
                    self.storage.delete_attempt(job)
                except Exception:
                    # The eventual document-delete job also sweeps every attempt prefix.
                    log.error("Artifact cleanup needs reconciliation for study job %s", job["id"])

    def run(self):
        signal.signal(signal.SIGTERM, lambda *_: self.stop.set())
        signal.signal(signal.SIGINT, lambda *_: self.stop.set())
        last_reap = 0
        while not self.stop.is_set():
            try:
                if time.monotonic() - last_reap >= 60:
                    self.database.reap_exhausted()
                    last_reap = time.monotonic()
                job = self.database.claim()
                if job:
                    self.process(job)
                else:
                    self.stop.wait(3)
            except Exception as exc:
                log.error("Study worker polling failed (%s)", type(exc).__name__)
                self.stop.wait(5)

