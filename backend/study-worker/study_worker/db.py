"""Short transactions, job leases, atomic quotas, and fenced publication."""
from contextlib import contextmanager
import math
import uuid
from .core import BudgetExceeded, LeaseLost, quota_reservations


class Database:
    def __init__(self, settings, connector=None):
        self.settings = settings
        self.connector = connector

    @contextmanager
    def connect(self):
        if self.connector:
            connection = self.connector()
        else:
            import psycopg
            from psycopg.rows import dict_row
            connection = psycopg.connect(self.settings.database_url, connect_timeout=10,
                                        row_factory=dict_row, application_name="edus-study-worker")
        with connection:
            yield connection

    def claim(self):
        token = str(uuid.uuid4())
        with self.connect() as con, con.cursor() as cur:
            cur.execute("""
                SELECT j.*, d.workspace_id, d.kind AS document_kind, d.filename, d.s3_key,
                       d.sha256, d.size_bytes, d.contains_handwriting, w.owner_id
                FROM study_jobs j
                JOIN study_documents d ON d.id=j.document_id
                JOIN study_workspaces w ON w.id=d.workspace_id
                WHERE ((j.status='queued' AND j.available_at <= clock_timestamp())
                       OR (j.status='processing' AND j.lease_until < clock_timestamp()))
                  AND j.attempts < %s
                  AND ((j.kind='delete' AND (d.upload_token IS NULL OR d.expires_at <= clock_timestamp())) OR
                       (j.kind='ingest' AND d.status IN ('queued','processing')
                        AND w.deleted_at IS NULL))
                ORDER BY CASE WHEN j.kind='delete' THEN 0 ELSE 1 END, j.created_at
                FOR UPDATE OF j SKIP LOCKED LIMIT 1
            """, (self.settings.max_attempts,))
            job = cur.fetchone()
            if not job:
                return None
            cur.execute("""UPDATE study_jobs SET status='processing', attempts=attempts+1,
                           lease_token=%s, lease_until=clock_timestamp() + %s * interval '1 second',
                           updated_at=clock_timestamp() WHERE id=%s""",
                        (token, self.settings.lease_seconds, job["id"]))
            if job["kind"] == "ingest":
                cur.execute("""UPDATE study_documents SET status='processing', processing_stage='extracting',
                               error=NULL, updated_at=clock_timestamp() WHERE id=%s
                               AND status IN ('queued','processing')""", (job["document_id"],))
            job["lease_token"] = token
            job["attempts"] += 1
            return job

    def _fence(self, cur, job, lock=False):
        if lock:
            # API deletion locks the workspace before its documents. Match that
            # order so publication cannot deadlock against a subject deletion.
            cur.execute("SELECT id FROM study_workspaces WHERE id=%s FOR UPDATE", (job["workspace_id"],))
        cur.execute("""
            SELECT d.id FROM study_jobs j JOIN study_documents d ON d.id=j.document_id
            JOIN study_workspaces w ON w.id=d.workspace_id
            WHERE j.id=%s AND j.lease_token=%s AND j.status='processing'
              AND j.lease_until > clock_timestamp()
              AND (j.kind='delete' OR (d.status='processing' AND w.deleted_at IS NULL))
        """ + (" FOR UPDATE OF j,d" if lock else ""), (job["id"], job["lease_token"]))
        if not cur.fetchone():
            raise LeaseLost("Document is deleted or the job lease is no longer valid")

    def assert_live(self, job):
        with self.connect() as con, con.cursor() as cur:
            self._fence(cur, job)

    def heartbeat(self, job):
        with self.connect() as con, con.cursor() as cur:
            cur.execute("""
                UPDATE study_jobs j SET lease_until=clock_timestamp() + %s * interval '1 second',
                       updated_at=clock_timestamp()
                WHERE j.id=%s AND j.lease_token=%s AND j.status='processing'
                  AND j.lease_until > clock_timestamp()
                  AND EXISTS(SELECT 1 FROM study_documents d JOIN study_workspaces w ON w.id=d.workspace_id
                    WHERE d.id=j.document_id AND (j.kind='delete' OR
                    (d.status='processing' AND w.deleted_at IS NULL)))
            """, (self.settings.lease_seconds, job["id"], job["lease_token"]))
            if cur.rowcount != 1:
                raise LeaseLost("Job heartbeat was fenced")

    def stage(self, job, stage):
        with self.connect() as con, con.cursor() as cur:
            self._fence(cur, job, lock=True)
            cur.execute("""UPDATE study_documents SET processing_stage=%s, updated_at=clock_timestamp()
                           WHERE id=%s""", (stage, job["document_id"]))

    def reserve_vision(self, owner_id):
        # Same scopes, buckets, UTC fixed windows, lock order, and no-refund rule as Node.
        with self.connect() as con, con.cursor() as cur:
            cur.execute("SELECT clock_timestamp() AS now")
            instant = cur.fetchone()["now"]
            reservations = quota_reservations(self.settings, owner_id, instant)
            exhausted = []
            for scope, bucket, window, amount, limit in reservations:
                cur.execute("""INSERT INTO study_usage(scope,bucket,window_start,amount)
                               VALUES(%s,%s,%s,0) ON CONFLICT DO NOTHING""", (scope, bucket, window))
                cur.execute("""UPDATE study_usage SET amount=amount+%s
                               WHERE scope=%s AND bucket=%s AND window_start=%s AND amount+%s <= %s
                               RETURNING amount""", (amount, scope, bucket, window, amount, limit))
                if not cur.fetchone():
                    exhausted.append((bucket, window, amount, limit))
            if exhausted:
                # A daily limit wins over minute pacing. Otherwise a long PDF
                # could wait each minute even after its owner's daily cap is used.
                bucket, window, amount, limit = next((item for item in exhausted if not item[0].endswith('_minute') or item[2] > item[3]), exhausted[0])
                short_window = bucket.endswith('_minute') and amount <= limit
                seconds = 60 if bucket.endswith('_minute') else 86400
                retry_after = max(1, math.ceil(window.timestamp() + seconds - instant.timestamp()))
                raise BudgetExceeded("Free handwriting/OCR quota is exhausted; retry later", retry_after, short_window)

    def cached_transcription(self, job, page_number, model, version):
        with self.connect() as con, con.cursor() as cur:
            self._fence(cur, job)
            cur.execute("""SELECT text FROM study_transcriptions WHERE document_id=%s AND page_number=%s
                           AND vision_model=%s AND prompt_version=%s""",
                        (job["document_id"], page_number, model, version))
            row = cur.fetchone()
            return row["text"] if row else None

    def save_transcription(self, job, page_number, model, version, text):
        with self.connect() as con, con.cursor() as cur:
            self._fence(cur, job, lock=True)
            cur.execute("""INSERT INTO study_transcriptions(document_id,page_number,vision_model,prompt_version,text)
                           VALUES(%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING""",
                        (job["document_id"], page_number, model, version, text))

    def publish(self, job, pages, chunks, error=None):
        partial = bool(error) or any(p.quality not in ("good", "blank") for p in pages)
        with self.connect() as con, con.cursor() as cur:
            self._fence(cur, job, lock=True)
            cur.execute("DELETE FROM study_chunks WHERE document_id=%s", (job["document_id"],))
            cur.execute("DELETE FROM study_pages WHERE document_id=%s", (job["document_id"],))
            cur.executemany("""INSERT INTO study_pages(document_id,page_number,text,method,quality,image_key)
                               VALUES(%s,%s,%s,%s,%s,%s)""",
                            [(job["document_id"], p.number, p.text, p.method, p.quality, p.image_key) for p in pages])
            if chunks:
                cur.executemany("""INSERT INTO study_chunks
                    (id,document_id,page_number,chunk_index,text,tokens,embedding)
                    VALUES(%s,%s,%s,%s,%s,%s,%s::vector)""",
                    [(c["id"], job["document_id"], c["page_number"], c["chunk_index"], c["text"], c["tokens"],
                      "[" + ",".join(str(float(x)) for x in c["embedding"]) + "]") for c in chunks])
            # Recheck the wall clock after inserts; NOW() would be fixed at transaction start.
            cur.execute("""UPDATE study_jobs SET status='done', lease_until=NULL, lease_token=NULL,
                           updated_at=clock_timestamp() WHERE id=%s AND lease_token=%s
                           AND lease_until > clock_timestamp() RETURNING id""", (job["id"], job["lease_token"]))
            if not cur.fetchone():
                raise LeaseLost("Lease expired during index publication")
            cur.execute("""UPDATE study_documents SET status=%s, page_count=%s, error=%s,
                           embedding_model=%s, embedding_revision=%s,
                           processing_stage='complete', updated_at=clock_timestamp() WHERE id=%s""",
                        ("partial" if partial else "ready", len(pages), error,
                         self.settings.embedding_model, self.settings.embedding_revision, job["document_id"]))

    def complete_delete(self, job):
        with self.connect() as con, con.cursor() as cur:
            self._fence(cur, job, lock=True)
            cur.execute("DELETE FROM study_chunks WHERE document_id=%s", (job["document_id"],))
            cur.execute("DELETE FROM study_pages WHERE document_id=%s", (job["document_id"],))
            cur.execute("DELETE FROM study_transcriptions WHERE document_id=%s", (job["document_id"],))
            cur.execute("""UPDATE study_documents SET status='deleted', processing_stage='deleted',
                           error=NULL, updated_at=clock_timestamp() WHERE id=%s""", (job["document_id"],))
            cur.execute("""UPDATE study_jobs SET status='done', lease_until=NULL, lease_token=NULL,
                           updated_at=clock_timestamp() WHERE id=%s AND lease_token=%s
                           AND lease_until > clock_timestamp() RETURNING id""", (job["id"], job["lease_token"]))
            if not cur.fetchone():
                raise LeaseLost("Lease expired during deletion")

    def fail(self, job, message):
        retry = job["attempts"] < self.settings.max_attempts
        with self.connect() as con, con.cursor() as cur:
            # Cancellation/deletion can fence ingestion. Update only a lease still owned here.
            cur.execute("""UPDATE study_jobs SET status=%s, last_error=%s, lease_until=NULL, lease_token=NULL,
                           available_at=clock_timestamp() + %s * interval '1 second', updated_at=clock_timestamp()
                           WHERE id=%s AND lease_token=%s AND status='processing'
                           AND lease_until > clock_timestamp() RETURNING id""",
                        ("queued" if retry else "failed", message[:300], min(300, 15 * 2 ** job["attempts"]),
                         job["id"], job["lease_token"]))
            if cur.fetchone() and job["kind"] == "ingest":
                cur.execute("""UPDATE study_documents d SET status=%s, error=%s, processing_stage=%s,
                               updated_at=clock_timestamp() FROM study_workspaces w
                               WHERE d.id=%s AND d.workspace_id=w.id AND d.status='processing'
                                 AND w.deleted_at IS NULL""",
                            ("queued" if retry else "failed", message[:300], "retrying" if retry else "failed",
                             job["document_id"]))

    def reap_exhausted(self):
        # A process killed on its last attempt must not leave an immortal processing job.
        with self.connect() as con, con.cursor() as cur:
            cur.execute("""WITH expired AS (
                SELECT id FROM study_documents WHERE status IN ('reserved','uploading')
                  AND expires_at <= clock_timestamp() FOR UPDATE SKIP LOCKED LIMIT 50
                ) UPDATE study_documents d SET status='deleting',processing_stage='deleting',updated_at=clock_timestamp()
                  FROM expired e WHERE d.id=e.id RETURNING d.id""")
            for document in cur.fetchall():
                cur.execute("""INSERT INTO study_jobs(document_id,kind) VALUES(%s,'delete')
                    ON CONFLICT(document_id,kind) WHERE status IN ('queued','processing') DO NOTHING""", (document["id"],))
            # Storage outages must not leave failed delete jobs charged forever.
            cur.execute("""WITH retry AS (
                SELECT DISTINCT ON (j.document_id) j.id FROM study_jobs j
                WHERE j.kind='delete' AND j.status='failed'
                  AND j.updated_at < clock_timestamp() - interval '15 minutes'
                  AND NOT EXISTS(SELECT 1 FROM study_jobs active WHERE active.document_id=j.document_id
                      AND active.kind='delete' AND active.status IN ('queued','processing'))
                ORDER BY j.document_id,j.updated_at DESC
                ) UPDATE study_jobs j SET status='queued',attempts=0,available_at=clock_timestamp(),
                           updated_at=clock_timestamp() FROM retry r WHERE j.id=r.id""")
            cur.execute("DELETE FROM study_usage WHERE window_start < clock_timestamp() - interval '2 days'")
            cur.execute("""UPDATE study_jobs SET status='failed', last_error='Worker retry limit reached',
                           lease_until=NULL, lease_token=NULL, updated_at=clock_timestamp()
                           WHERE status='processing' AND lease_until < clock_timestamp() AND attempts >= %s
                           RETURNING document_id,kind""", (self.settings.max_attempts,))
            exhausted = cur.fetchall()
            for job in exhausted:
                if job["kind"] == "ingest":
                    cur.execute("""UPDATE study_documents SET status='failed', error='Worker retry limit reached',
                                   processing_stage='failed', updated_at=clock_timestamp()
                                   WHERE id=%s AND status='processing'""", (job["document_id"],))
