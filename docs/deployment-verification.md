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

## Remaining root-level proxy step

**The application's full advertised PDF size is not yet enabled at the public proxy.**
The existing Nginx site has no explicit request-size override, so its default ceiling
is below the application's 5 MiB syllabus / 20 MiB notes limits. The `priyanshu` account's
sudo policy permits managing the backend service but not changing/reloading Nginx.

Connect as an authorized admin (the existing `ubuntu` account is in the sudo group),
review the script, and run:

```sh
sudo python3 /home/priyanshu/EDUS/backend/study-worker/deploy/configure-nginx.py
```

The script backs up the API site, sets a 21 MiB request ceiling and 300-second upstream
timeouts, validates Nginx, and reloads it. After it succeeds, perform an actual public
PDF upload larger than 1 MiB and check indexing/deletion before marking this step done.
Until then, smaller PDFs and pasted text work, but do not describe all advertised file
sizes as fully deployed.

The existing container template was not used for this host deployment; systemd user
services are the verified runtime. No large-scale load test or production availability
guarantee is implied by these acceptance results.

## Retained university-document recruiter demo

The subsequent [Operating Systems demo](rag-recruiter-demo.md) used two original,
small university PDFs rather than synthetic fixtures. Both indexed successfully: 12
PDF pages, 17 chunks, 384-dimensional vectors. Four answer/reference/abstention cases
passed through the public API, and the hosted browser displayed the actual answer and
matching syllabus page. The owner explicitly requested keeping this private subject,
so these two source documents are retained for demonstration. Temporary acceptance
accounts from the initial deployment tests remain removed.
