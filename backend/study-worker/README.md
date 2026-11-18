# EDUS private study worker

This service ingests private syllabus/notes PDFs and runs the local semantic embedding
model used by the Express study API. It never reads existing public Edu AI syllabuses.
Run two processes from this directory, one for ingestion and one for query embeddings:

```sh
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m study_worker work
.venv/bin/python -m study_worker serve
```

Python 3.11/3.12 is supported; the host's Python 3.14 is not an ML deployment target.
Install the system `tesseract-ocr`, `tesseract-ocr-eng`, and `libgomp1` packages or use the
Dockerfile. Build for the actual Linux amd64/arm64 host. The image installs CPU PyTorch
from its official CPU wheel index. In Docker override the command to
`python -m study_worker serve` for the embedding process. Keep port 8091 internal.
Allow approximately 2 GiB RAM per process initially, cap container CPU/memory/PIDs and
temporary disk, and measure with representative PDFs before increasing concurrency.
Model weights are downloaded on first use; mount the Hugging Face cache persistently.

## Configuration

Supply environment variables through the deployment secret manager; this package does
not load `.env` files or contain credentials. Database tables come from the backend's
private study migration. Both processes must use the same embedding revision.

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL` | PostgreSQL with pgvector, required by `work` |
| `AWS_BUCKET_NAME` | Existing private Tigris/S3 bucket |
| `AWS_ENDPOINT_URL_S3`, `AWS_REGION` | Same endpoint/region as Express (`auto` default) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Existing AWS SDK credentials, no public ACL |
| `STUDY_INTERNAL_TOKEN` | At least 16 random characters, shared with Express; required by `serve` |
| `STUDY_EMBEDDING_HOST`, `STUDY_EMBEDDING_PORT` | Default `127.0.0.1:8091`; Docker binds `0.0.0.0` internally |
| `STUDY_EMBEDDING_REVISION` | Immutable commit SHA, default `614241f622f53c4eeff9890bdc4f31cfecc418b3`; must match Express |
| `STUDY_STORE_PAGE_IMAGES` | Default false: images stay transient; citations use the original PDF |
| `GROQ_API_KEY` | Optional existing free-plan Groq key for difficult pages |
| `STUDY_GROQ_FREE_PLAN_CONFIRMED` | Must be exactly `true` before any vision call |
| `STUDY_VISION_MODEL` | Only allowlisted `qwen/qwen3.8-27b`; no paid fallback |
| `STUDY_GROQ_RPM/RPD/TPM/TPD` | Shared conservative ceilings: 30/1000/8000/200000; only lower values accepted |
| `STUDY_VISION_PAGES_PER_DAY` | Per-owner handwriting/vision cap, default and maximum 10 |
| `STUDY_LEASE_SECONDS`, `STUDY_HEARTBEAT_SECONDS` | Defaults 180/20 seconds |
| `STUDY_MAX_ATTEMPTS` | Automatic attempts, default 3, maximum 5 |

The application cannot discover an account's billing plan. Keep billing disabled in
Groq and confirm the free plan explicitly. Provider preview models and free quotas may
change; failure becomes a visible partial extraction, never an alternate paid call.
One image is sent per request (below the provider's three-image bound). Input estimate
3500 plus maximum output 3500 tokens is reserved **before** each request. Shared UTC
minute/day counters and owner page counters are updated atomically in lexical key
order. Reservations are not refunded, including provider failures. These are conservative
application reservations, not an assertion that image token usage is exact; provider
free-plan enforcement remains authoritative. A 429 leaves that page `quota_limited`.

## Pipeline and lifecycle

Jobs use `FOR UPDATE SKIP LOCKED`, a fresh lease UUID on each claim, independent heartbeat
connections, capped attempts/backoff, and crash recovery. Heavy extraction/network/model
work occurs outside transactions. Publication locks and verifies the job, document and
workspace; a deleted workspace/document or expired/replaced job lease cannot publish.
`documents.expires_at` is only the upload lease, not document retention. Completed notes
remain available until deletion. Pending uploads defer physical deletion until their
server upload lease expires, because a late PUT must not recreate a deleted original.

Each PDF is streamed to a private temporary folder with a 20 MiB/checksum check. Syllabuses
allow 30 pages; notes allow 150. pypdf extracts native text; PDFium renders one bounded
page at a time, at most 1800 pixels on its longest edge and 3 million pixels. Pages with
images are OCR'd even if they contain selectable headings. Tesseract reads printed
English scans. The upload handwriting flag or poor local OCR routes a page to free
vision, which is instructed to transcribe literally, preserve equations and mark
`[unclear]`. These instructions do not guarantee handwriting accuracy.

Page numbers, method, quality and original transcription are stored. Lines containing
unclear markers and incomplete output endings are omitted from the retrieval index.
Unavailable vision indexes only reliable native text; it does not index local OCR
guesses from handwriting. A document becomes `partial` when pages need review or no
reliable text can be indexed. OCR results never expose fabricated confidence scores.
Review the original PDF/page when an equation or handwriting is ambiguous.
Complete, unambiguous vision readings are cached per immutable document/page/model and
OCR prompt version. Retrying a partial file reuses them before reserving more free
capacity. Unclear or truncated readings are eligible for another attempt. The API shows
which original pages need review. A manual correction editor is not included.

Local `intfloat/multilingual-e5-small` embeddings are 384-dimensional and normalized,
with `query: ` / `passage: ` prefixes. Fast-tokenizer offsets produce deterministic
UUID5 chunks capped at 450 tokens **including prefix and special tokens**, with 50-token
overlap. The model/revision is persisted per document. Reindex all documents when the
revision changes; do not mix embedding identities in retrieval.

Optional persisted image previews are disabled by default. When enabled, they are
private JPEGs, each at most 600 KB, under the exact
`study-derived/<workspace UUID>/<document UUID>/<attempt UUID>/` prefix. Their combined
artifact budget is 40 MiB per attempt; pages beyond it still cite the original PDF.
Maximum extracted text is 60,000 characters/page, 2 million/document, and 6,000 chunks.
Database publication replaces existing chunks/pages atomically. Failed/stale attempts
clean only their own preview prefix. Delete jobs remove the original, every derived
attempt prefix, chunks and pages idempotently. S3 and PostgreSQL cannot share a
transaction: retain a periodic orphan-object reconciliation/lifecycle policy for
hard-killed processes, including a PUT that finishes after a delete sweep. Tombstones
continue to prevent those orphan objects from becoming accessible/indexed.

## Internal embedding API

Both routes require `X-Study-Token`; health includes the loaded model identity.

```text
GET /health
POST /embed
{"texts":["What is entropy?"],"kind":"query"}
=> {"embeddings":[[...384 normalized numbers...]],"model":"intfloat/multilingual-e5-small","revision":"..."}
```

Requests are bounded to 128 KiB, 32 nonempty texts and 450 tokens/text including prefix.
There are two admitted requests and one model encoding lock; busy responses are 429.
The server does not log text or keys. Health is a model readiness check; it does not
claim that the ingestion worker or external database/storage is available.

## Verification

```sh
python3.12 -m unittest discover -s tests -v
```

The tests use stdlib mocks, fake tokenizers, temporary files and a local HTTP listener.
They make no Groq/S3/database calls and do not download a model. Install the PDF/Pillow
dependencies and Tesseract to include real generated PDF parsing/rendering/printed OCR
checks. For an optional real CPU embedding smoke check, run
`python3.12 scripts/smoke_embeddings.py`; this downloads the public pinned weights.
See [the deployment guide](../../docs/private-study.md) for the complete application.
Before deployment,
run an isolated PostgreSQL/S3 integration check and a ground-truth PDF benchmark covering
selectable text, mixed native headings/scanned bodies, clear/poor English handwriting,
equations, rotated scans, quota exhaustion, retries, cancellation/deletion and restart.
Measure critical transcription errors, retrieval recall and cited-answer correctness;
handwriting support is not a promise to read every page accurately.
