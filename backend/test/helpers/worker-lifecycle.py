"""Drive the actual Python database worker against the parent's isolated PostgreSQL.

JSON stdio is only a test transport; production uses psycopg unchanged.
"""
from datetime import datetime
import json
from pathlib import Path
import sys
import uuid

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "study-worker"))
from study_worker.config import Settings
from study_worker.core import BudgetExceeded, LeaseLost, Page
from study_worker.db import Database


class Connection:
    def __enter__(self):
        self.command("BEGIN")
        return self

    def __exit__(self, kind, value, trace):
        self.command("ROLLBACK" if kind else "COMMIT")

    def command(self, sql, params=()):
        print(json.dumps({"sql": sql, "params": params}, default=lambda value: value.isoformat()), flush=True)
        result = json.loads(sys.stdin.readline())
        if "error" in result:
            raise RuntimeError(result["error"])
        return result

    def cursor(self):
        return Cursor(self)


class Cursor:
    def __init__(self, connection):
        self.connection = connection

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def execute(self, sql, params=()):
        result = self.connection.command(sql, params)
        self.rows = result["rows"]
        self.rowcount = result["affectedRows"]
        for row in self.rows:
            if isinstance(row.get("now"), str):
                row["now"] = datetime.fromisoformat(row["now"].replace("Z", "+00:00"))

    def executemany(self, sql, values):
        for params in values:
            self.execute(sql, params)

    def fetchone(self):
        return self.rows.pop(0) if self.rows else None

    def fetchall(self):
        rows, self.rows = self.rows, []
        return rows


def main():
    database = Database(Settings(), connector=Connection)
    job = database.claim()
    assert job and job["kind"] == "ingest"
    database.heartbeat(job)
    database.save_transcription(job, 1, "test-vision", "literal-v1", "Reliable reading")
    assert database.cached_transcription(job, 1, "test-vision", "literal-v1") == "Reliable reading"
    assert database.cached_transcription(job, 1, "test-vision", "other-prompt") is None
    database.reserve_vision(str(job["owner_id"]))
    try:
        database.reserve_vision(str(job["owner_id"]))
    except BudgetExceeded as error:
        assert error.short_window and 1 <= error.retry_after <= 60
    else:
        raise AssertionError("Vision quota must roll back the second oversized reservation")
    try:
        Database(Settings(vision_pages_day=1), connector=Connection).reserve_vision(str(job["owner_id"]))
    except BudgetExceeded as error:
        assert not error.short_window, "Daily exhaustion must win over minute pacing"
    else:
        raise AssertionError("The owner's daily vision cap must be enforced")
    chunk = {"id": str(uuid.uuid4()), "page_number": 1, "chunk_index": 0,
             "text": "Reliable reading", "tokens": 5, "embedding": [1.0] + [0.0] * 383}
    database.publish(job, [Page(1, "Reliable reading", "test")], [chunk])
    try:
        database.publish(job, [Page(1, "Stale replacement", "test")], [])
    except LeaseLost:
        pass
    else:
        raise AssertionError("Completed lease must not republish")
    with database.connect() as con, con.cursor() as cur:
        cur.execute("SELECT status FROM study_documents WHERE id=%s", (job["document_id"],))
        assert cur.fetchone()["status"] == "ready"
        cur.execute("SELECT text FROM study_chunks WHERE document_id=%s", (job["document_id"],))
        assert cur.fetchone()["text"] == "Reliable reading"
        cur.execute("SELECT amount FROM study_usage WHERE scope=%s AND bucket='groq_requests_day'", ("groq:" + Settings().vision_model,))
        assert int(cur.fetchone()["amount"]) == 1
        # Simulate a crashed upload on the same immutable document; reap must queue cleanup.
        cur.execute("UPDATE study_documents SET status='uploading',upload_token=%s,expires_at=clock_timestamp()-interval '1 minute' WHERE id=%s", (str(uuid.uuid4()), job["document_id"]))
    database.reap_exhausted()
    deletion = database.claim()
    assert deletion and deletion["kind"] == "delete"
    database.complete_delete(deletion)
    with database.connect() as con, con.cursor() as cur:
        for table in ("study_chunks", "study_pages", "study_transcriptions"):
            cur.execute(f"SELECT count(*) AS total FROM {table} WHERE document_id=%s", (job["document_id"],))
            assert int(cur.fetchone()["total"]) == 0
        cur.execute("SELECT status FROM study_documents WHERE id=%s", (job["document_id"],))
        assert cur.fetchone()["status"] == "deleted"
        # Multiple failed delete histories must requeue only one job per document.
        cur.execute("INSERT INTO study_jobs(document_id,kind,status,updated_at) VALUES(%s,'delete','failed',clock_timestamp()-interval '1 hour'),(%s,'delete','failed',clock_timestamp()-interval '2 hours')", (job["document_id"], job["document_id"]))
    database.reap_exhausted()
    database.reap_exhausted()
    with database.connect() as con, con.cursor() as cur:
        cur.execute("SELECT count(*) AS total FROM study_jobs WHERE document_id=%s AND kind='delete' AND status='queued'", (job["document_id"],))
        assert int(cur.fetchone()["total"]) == 1


if __name__ == "__main__":
    main()
