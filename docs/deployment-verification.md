# RAG deployment verification — 19 November 2026 UTC

## Running services and configuration

- Public frontend: `https://edusphere.live/ai/study`; the served bundle includes PDF
  and pasted-text input methods.
- Public API: `https://api.edusphere.live/health` returned HTTP 200.
- Existing system service `edus-backend.service`: active.
- Persistent user services `edus-study-embeddings.service` and
  `edus-study-worker.service`: enabled and active; user lingering is enabled.
- Embedding HTTP service listens only on `127.0.0.1:8091` and requires its internal token.
- Four study migrations applied to the configured PostgreSQL database, with pgvector.
- `npm run study:check`: all reported configuration/schema/embedding checks pass.
- Existing storage/Groq credentials were reused. A new internal secret was generated
  and saved only in server configuration; no secret values are committed here.
- Operator explicitly confirmed the Groq organization is Free with paid billing disabled.
- Pinned local model weights, Python environment, and OCR runtime are on persistent disk.

See [the host runbook](../backend/study-worker/deploy/README.md) for paths, service
commands, resource limits, and update/rollback behavior.

## Live acceptance results

Tests used temporary synthetic accounts/documents and the real HTTPS API, production
database, private object storage, local model, and Groq endpoints. Test material and
accounts were removed after each run, including failed/interrupted runs.

| Behavior | Result |
| --- | --- |
| Authenticated private workspace listing/creation | Passed |
| Seventh subject rejected at six active subjects | Passed |
| Other account cannot open a private subject | Passed |
| Pasted source storage, indexing, and idempotent submission | Passed |
| Selectable PDF upload, object storage, extraction, and indexing | Passed |
| Printed scan through real Tesseract | Passed |
| Vision-routed page through actual Groq worker and indexing | Passed with the host's bounded output setting |
| Owner-only original PDF download | Passed |
| Browser CORS access to signed PDF source | Passed |
| Hybrid retrieval and cited Groq answer | Passed |
| Groq flashcard and multiple-choice generation | Passed |
| Durable deletion and synthetic account cleanup | Passed |

The vision sample was a synthetic printed page deliberately sent through the handwriting
path. This verifies routing/transcription/indexing, **not handwritten-note accuracy**.
Real handwriting, equations, tables, and representative course documents still need a
labeled quality benchmark. The host uses `STUDY_VISION_MAX_OUTPUT=512` and instruct mode;
the previous larger output budget received provider token-limit 429 responses. Dense
pages may remain partial. No paid-model fallback was added.

A real Chromium check against the hosted frontend also passed: authentication refresh,
mixed pasted syllabus/PDF notes, processing completion, live cited answer, actual PDF
preview, and a 390-pixel mobile viewport without horizontal overflow. It used synthetic
credentials only. An initial harness failure was caused by Snap Chromium's isolated
view of `/tmp`; passing the fixture in memory resolved it without application changes.

Live tests identified timestamp serialization differences in the real shared
postgres.js/Drizzle client that the original isolated adapter did not reproduce. Those
paths now use explicit timestamp encoding; the regression adapter rejects raw Date
parameters. UUID-array retrieval parameters are encoded explicitly as well. Backend
tests passed after these fixes; worker tests passed, including actual printed OCR.

## Public deployment recheck — 19 November 2026, 04:11 UTC

The current public deployment was tested again after the study UI update, using actual
HTTPS requests rather than mocked services. All backend/RAG checks below passed:

- API, embedding service, and ingestion worker active with zero service restarts.
- `npm run study:check`: configuration, study migrations, pgvector, pasted text,
  and authenticated local embedding readiness all passed.
- Public frontend, health, subjects, resources, announcements, professor directory,
  and syllabus branch routes returned HTTP 200 with the expected frontend API CORS.
- Unauthenticated study, profile, saved items, admin analytics, and AI requests were
  rejected with HTTP 401.
- Temporary authenticated subjects: six-subject ceiling, owner isolation, pasted-text
  idempotency, native PDF indexing, real Tesseract OCR, and actual Groq vision routing
  passed. The vision fixture is printed text marked for handwriting routing; it does
  not measure recognition accuracy on handwriting.
- Private original PDF download, storage CORS, indexed embeddings, cited Groq chat,
  flashcards, and multiple-choice generation passed through the public API.
- Synthetic accounts, documents, and storage objects were removed through the deletion
  lifecycle, followed by removal of the temporary account records.
- The real hosted browser loaded the retained owner demo, generated an answer stating
  Wednesday office hours from 7:30 PM to 9:30 PM via Blackboard, and opened the cited
  syllabus page 2 of 7. The updated workspace CSS and custom select arrow are live.

### Current proxy and upload limit

The earlier Nginx warning described an old configuration file. On this recheck,
**Nginx is inactive and Caddy is active**; public DNS and response headers identify
Cloudflare at the edge. The readable Nginx site is not evidence of the active public
request-size ceiling. No proxy configuration was changed during this recheck.

Actual public uploads of 3,240,944 bytes and exactly **20 MiB (20,971,520 bytes)**
returned HTTP 201. Reserving a notes PDF one byte above 20 MiB returned HTTP 413.
The largest fixture was a small valid PDF padded to the byte limit: this tests public
transport, application size validation, object storage, and deletion, not OCR/indexing
of a dense 20 MiB course document. Smaller native/scanned fixtures separately passed
indexing. All size-test accounts and documents were removed.

There is no current requirement to run the old Nginx helper on this Caddy deployment.
Its instructions are relevant only if a future deployment actually uses Nginx.
Long-running proxy timeouts were not measured by these checks.

These results establish the exercised behavior at the stated time. External OAuth
login/provider redirects, every administrative write, sustained load, daily quota
exhaustion, and representative handwriting accuracy were not exhaustively tested.

## Retained university-document recruiter demo

The subsequent [Operating Systems demo](rag-recruiter-demo.md) used two original,
small university PDFs rather than synthetic fixtures. Both indexed successfully: 12
PDF pages, 17 chunks, 384-dimensional vectors. Four answer/reference/abstention cases
passed through the public API, and the hosted browser displayed the actual answer and
matching syllabus page. The owner explicitly requested keeping this private subject,
so these two source documents are retained for demonstration. Temporary acceptance
accounts from the initial deployment tests remain removed.
