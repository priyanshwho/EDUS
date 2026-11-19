# Private syllabus and notes in EDU AI

Open **EDU AI → My Study Subjects** (`/ai/study`). Every authenticated student,
professor and admin has their own six subject slots. Upload a syllabus, notes or both
to a subject. Each syllabus and notes section also accepts pasted text, and PDF/text methods can be mixed. Private material never enters the shared syllabus catalog or public
resources. There is no sharing or approval workflow in this release.

For architecture rationale and interview preparation, see the
[complete interview guide](edus-interview-guide.md).

## Data flow

```mermaid
flowchart LR
  UI[Private subject and PDF upload] --> API[Express authentication and owner checks]
  API --> Admission[Atomic quota and upload reservation]
  Admission --> S3[Private immutable original PDF]
  Admission --> DB[(Postgres and pgvector)]
  DB --> Jobs[Leased ingestion jobs]
  S3 --> Jobs
  Jobs --> Extract[Native text or Tesseract OCR]
  Extract --> Vision[Groq free vision for difficult pages]
  Extract --> Embed[Local E5 embeddings]
  Vision --> Embed
  Embed --> DB
  API --> Search[Owner-scoped vector and full-text search]
  DB --> Search
  Search --> Tutor[Groq free text model]
  Tutor --> Citations[Answers and practice with PDF page references]
```

Local parsing, OCR and embeddings have no hosted model charges. Groq supplies text
answers and difficult-page/handwriting OCR. The application enforces an allowlist,
requires explicit Free-plan confirmation and has no alternate paid provider. **Free
models do not make storage, database or server resources unlimited or necessarily
free.** Groq billing status and provider limits remain account settings outside the
application. Check the [Groq models](https://console.groq.com/docs/models) and
[rate limits](https://console.groq.com/docs/rate-limits) before enabling a deployment.

Native English text and printed scans are the first reliable target. Handwriting,
equations, unusual layouts and diagrams require checking against the original.
The vision prompt transcribes literally and marks uncertainty; this is not a guarantee
of transcription accuracy or a manual OCR correction editor.

## Limits

| Resource | Limit |
| --- | --- |
| Active subject workspaces | 6 per account, including notes-only subjects |
| Sources in one subject | 1 syllabus and 5 notes sources (PDF or pasted text) |
| Each pasted text block | 50,000 characters and 64 KiB UTF-8; counts toward admission and storage limits |
| Syllabus | 5 MiB, 30 pages |
| Notes PDF | 20 MiB, 150 pages |
| Original storage | 50 MiB per subject; 300 MiB per account |
| Upload admission | 12 attempts/10 minutes, 24/day, 100 MiB/day |
| Simultaneous upload reservations | 2 per account; expire after 15 minutes |
| Study mutation requests | 60/10 minutes per account; 500/10 minutes per IP |
| AI text generations | At most 20/day per account, also shared provider quotas |
| Vision OCR | At most 10 pages/day per account, also shared provider quotas |
| Manual processing retries | 2 per PDF; 6/day per account |

The seventh subject returns `409 SUBJECT_LIMIT_REACHED`: **Subject limit reached
(6/6). Delete an existing subject to add a new one.** Deletion frees its subject slot
immediately. Original bytes stay charged until the worker actually removes the
objects. Deleting/retrying never refunds upload/AI admission charges. Limits live in
`backend/src/ai/study/policy.js`; Groq environment quotas may only reduce the reviewed
ceilings. Quotas use shared PostgreSQL counters, including existing chapter AI routes.

An asynchronous OCR job can pause for one minute-window reset between pages, keeping
its lease alive and checking deletion while it waits. Daily exhaustion does not wait.
Handwritten PDFs larger than the available vision quota can be `partial`. Their
reliable passages remain searchable, and the UI lists pages requiring review. Complete,
unambiguous vision transcriptions are cached by immutable document/page/model/prompt
version, so a later retry spends capacity on unread pages. Two manual retries do not
guarantee completion of a large or difficult handwritten PDF. Use smaller selections
within the published file and upload limits. Partial extraction is shown in answers.

## Storage and access

Reservation and byte/count/rate checks run before accepting a PDF. The server streams
one multipart file to bounded temporary disk, validates its exact declared length,
PDF signature and SHA-256, then writes its permanent key. A browser never receives a
replayable storage PUT URL. Duplicate content within a subject is resolved before a
second object write. The worker validates the actual PDF and page count separately;
an arbitrary file with a PDF header cannot become searchable merely by passing upload.

All document/workspace/source/retrieval operations require the owner; an admin role
does not override this. Query eligibility is filtered before vector/full-text ranking.
Generated citations must reference supplied pages and ownership is checked again after
generation. Original PDF GET links expire in 60 seconds. An already-issued link can
remain valid for that short lifetime after deletion.

The original prefix is `private/study/<owner UUID>/<document UUID>/original.pdf`.
Derived page images are disabled by default; rendering is transient and citations open
the original PDF. Enabling `STUDY_STORE_PAGE_IMAGES=true` adds separately bounded
private derived artifacts; these are not included in the original-byte quota above.
Keep it disabled for the initial storage budget.

Deletion tombstones exclude content immediately. Durable jobs remove originals,
derived attempts, transcriptions, pages and chunks. Job leases and publication fences
prevent a cancelled worker from republishing. Abandoned uploads are swept each minute;
in-flight upload leases defer deletion. Failed storage deletion is retried after an
outage. Keep bucket access private, and monitor/reconcile orphaned objects after hard
crashes: S3 and PostgreSQL cannot share a transaction. Do not apply a blanket lifecycle
expiry to all active originals.

## Deployment

Pushing backend changes to `Priyanshu` triggers the existing backend deployment workflow
(the workflow also accepts `main`). It does not apply the study migrations or provision
the Python services; those deployment steps must be completed separately. New study CI runs tests and a
frontend build without production credentials. The Docker template has not been built
on this host because Docker access is unavailable; validate it on the deployment host.

1. Use a staging database and private staging bucket first. Install backend dependencies
   with `cd backend && npm ci`. PostgreSQL must support `CREATE EXTENSION vector` and
   the migration identity must be allowed to install it. Take a database backup before
   a production migration.
2. Set backend environment variables from `backend/.env.example` through the existing
   secret manager. Keep real values out of Git. Generate a random `STUDY_INTERNAL_TOKEN`
   of at least 32 characters and use the same value in Express and the embedding service.
   Verify the Groq organization is on Free with paid billing disabled, inspect its
   model-specific quotas, lower `STUDY_GROQ_*` to fit, then explicitly set
   `STUDY_GROQ_FREE_PLAN_CONFIRMED=true`. Until then, hosted AI fails closed.
3. From `backend`, run **`npm run migrate:study`** against the intended database. This is
   an additive, checksummed migration with an advisory lock; it does not run on API
   startup. Do not edit an applied migration. All four study migrations are required (including pasted text support).
4. Start ingestion and the local embedding service using Python 3.12 and Tesseract.
   See [the worker guide](../backend/study-worker/README.md). For a host-based Express
   API, the optional container setup is:

   ```sh
   cd backend/study-worker
   docker compose --env-file ../.env build
   docker compose --env-file ../.env up -d
   ```

   The template exposes embeddings only on host loopback, runs as UID 10001, limits
   memory/CPU/PIDs/temp disk, and shares a persistent model cache. Plan capacity for
   both worker processes plus Node and the OS. Keep 8091 off public ingress. On first
   start the public pinned E5 weights download; allow outbound Hugging Face access.
   Both processes and Express must use revision
   `614241f622f53c4eeff9890bdc4f31cfecc418b3`. A different revision requires explicit
   reindexing. Do not automatically switch model families or dimensions.
5. Restart the API and deploy the frontend after the schema and workers are ready.
   Ingress must allow a single 20 MiB PDF plus multipart overhead (for example Nginx
   `client_max_body_size 21m`) and the bounded upload timeout. Private uploads go through
   Express rather than direct-to-bucket CORS uploads. Configure private bucket GET CORS
   for the application origin so the PDF viewer can fetch its short-lived source URL.
6. Validate as two different users: upload syllabus-only, notes-only and both; try a
   seventh subject; interrupt an upload; delete during indexing; exhaust a quota; check
   page references. Benchmark your actual printed and handwritten notes. Check job
   failures/queue age, storage cleanup, memory and Groq 429 responses before wider use.

For rollback, stop study workers, revert the application deployment, and retain the
additive tables and private originals for recovery. Do not drop study tables while
objects still need deletion. Completed content is retained until the owner deletes it;
the upload `expires_at` field is not a retention timer. An administrator's account
deletion first disables new private uploads and queues private storage cleanup. It
returns `409 ACCOUNT_CLEANUP_PENDING` until the worker finishes. Retrying then removes
the account and its study tombstones atomically. Public resources are left intact
during the pending cleanup phase; the existing delete-with-resources option removes
them only when account deletion completes.

## Pasted text and readiness

Pasted content is stored privately in PostgreSQL, not converted into a PDF or written
to object storage. It skips OCR, becomes one internal text segment, and enters the same
local chunking/embedding pipeline. Citations open a plain-text viewer instead of a
fictional PDF page. Requests use a stable submission key for safe retries. Deletion
clears the saved text together with searchable pages/chunks.

Run `cd backend && npm run study:check` for a read-only configuration/schema/embedding
health report. It prints presence booleans, not credentials, and makes no Groq request.
A listing failure does not require a Groq call: missing study tables or database access
can cause a 503 before any model is involved. The general `/health` endpoint checks the
API process and is not a complete RAG readiness check. Passing model health also does
not prove the ingestion worker is running.

## Verification and remaining acceptance work

```sh
cd backend
npm test
npm run check:roles
cd ../Frontend
node --test test/*.test.mjs
npx tsc --noEmit
npm run build
cd ../backend/study-worker
python3.12 -m unittest discover -s tests -v
```

Backend tests use isolated PGlite PostgreSQL/pgvector and fake storage/provider calls.
The Python worker's actual SQL lifecycle also runs against this engine through a
test-only stdio adapter; production connects through psycopg. This verifies SQL and
transactions but is not a real PostgreSQL network/S3 integration deployment.
Worker tests cover real PDF parsing/rendering and printed Tesseract OCR; HTTP tests bind
only localhost. ML unit tests use fake embeddings. The pinned CPU model also has a
separate real-model smoke check in `backend/study-worker/scripts/smoke_embeddings.py`.
No production database, S3 object, or real Groq request is required by these checks.

Still required before launch: a real PostgreSQL/S3 worker integration run, a container
build on the actual host, account-specific Groq quota/free-plan confirmation, a live
Groq text/handwriting test, and a labeled sample benchmark. These are separate from
source-level tests. Supply a selectable syllabus, a printed scan, and handwritten notes
with known answers using material you are comfortable sending to Groq for OCR.
