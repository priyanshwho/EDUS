-- Private student syllabi and notes never enter public resources or shared syllabi.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS study_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  slot integer NOT NULL CHECK (slot BETWEEN 1 AND 6),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 150),
  branch text,
  semester integer CHECK (semester BETWEEN 1 AND 8),
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (owner_id, idempotency_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS study_workspaces_active_slot_uq ON study_workspaces(owner_id, slot) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS study_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES study_workspaces(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('syllabus','notes')),
  filename text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  sha256 text CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'),
  s3_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','uploading','queued','processing','ready','partial','failed','deleting','deleted')),
  contains_handwriting boolean NOT NULL DEFAULT false,
  page_count integer CHECK (page_count > 0),
  error text,
  processing_stage text NOT NULL DEFAULT 'reserved',
  expires_at timestamptz NOT NULL,
  upload_token uuid,
  embedding_model text,
  embedding_revision text,
  manual_retry_count integer NOT NULL DEFAULT 0 CHECK (manual_retry_count BETWEEN 0 AND 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS study_documents_workspace_status_idx ON study_documents(workspace_id, status);
CREATE INDEX IF NOT EXISTS study_documents_expiry_idx ON study_documents(expires_at) WHERE status IN ('reserved','uploading');
CREATE UNIQUE INDEX IF NOT EXISTS study_documents_syllabus_uq ON study_documents(workspace_id) WHERE kind = 'syllabus' AND status NOT IN ('deleting','deleted');
CREATE UNIQUE INDEX IF NOT EXISTS study_documents_hash_uq ON study_documents(workspace_id, sha256) WHERE sha256 IS NOT NULL AND status NOT IN ('deleting','deleted');

CREATE TABLE IF NOT EXISTS study_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES study_documents(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('ingest','delete')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','done','failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  lease_token uuid,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS study_jobs_active_uq ON study_jobs(document_id, kind) WHERE status IN ('queued','processing');
CREATE INDEX IF NOT EXISTS study_jobs_claim_idx ON study_jobs(status, available_at, lease_until);

CREATE TABLE IF NOT EXISTS study_pages (
  document_id uuid NOT NULL REFERENCES study_documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL CHECK (page_number > 0),
  text text NOT NULL,
  method text NOT NULL,
  quality text NOT NULL,
  image_key text,
  PRIMARY KEY (document_id, page_number)
);

CREATE TABLE IF NOT EXISTS study_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES study_documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL CHECK (page_number > 0),
  chunk_index integer NOT NULL CHECK (chunk_index >= 0),
  text text NOT NULL,
  tokens integer NOT NULL CHECK (tokens > 0),
  embedding vector(384) NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED,
  UNIQUE (document_id, page_number, chunk_index),
  FOREIGN KEY (document_id, page_number) REFERENCES study_pages(document_id, page_number) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS study_chunks_document_idx ON study_chunks(document_id);
CREATE INDEX IF NOT EXISTS study_chunks_search_idx ON study_chunks USING gin(search_vector);
-- At this bounded corpus size, exact vector search avoids ANN filtered-recall issues.

CREATE TABLE IF NOT EXISTS study_usage (
  scope text NOT NULL,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  amount bigint NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (scope, bucket, window_start)
);
