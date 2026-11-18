import unittest
from unittest.mock import Mock
from study_worker.config import Settings
from study_worker.core import LeaseLost, Page
from study_worker.db import Database
from study_worker.worker import Worker

JOB = {"id": "job", "document_id": "doc", "workspace_id": "workspace", "lease_token": "lease",
       "s3_key": "private/source", "kind": "ingest", "attempts": 1}


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.database, self.storage, self.extractor, self.embedder = Mock(spec=Database), Mock(), Mock(), Mock()
        self.worker = Worker(Settings(), self.database, self.storage, self.extractor, self.embedder)
        self.extractor.extract.return_value = [Page(1, "Reliable text", "native")]
        self.embedder.chunks.return_value = [{"text": "Reliable text"}]
        self.embedder.embed.return_value = [[1.0] + [0.0] * 383]

    def test_success_publishes_once_after_embedding(self):
        self.worker.process(dict(JOB))
        self.database.publish.assert_called_once()
        self.assertEqual(self.database.publish.call_args.args[2][0]["embedding"][0], 1)
        self.storage.delete_attempt.assert_not_called()

    def test_delete_between_extraction_and_publish_cannot_resurrect(self):
        self.database.stage.side_effect = LeaseLost("deleted")
        self.worker.process(dict(JOB))
        self.database.publish.assert_not_called()
        self.database.fail.assert_not_called()
        self.storage.delete_attempt.assert_called_once()

    def test_publication_fence_failure_cleans_attempt(self):
        self.database.publish.side_effect = LeaseLost("replacement lease")
        self.worker.process(dict(JOB))
        self.storage.delete_attempt.assert_called_once()

    def test_partial_handwriting_without_text_still_persists_page_status(self):
        self.extractor.extract.return_value = [Page(3, "", "tesseract", "quota_limited", indexable_text="")]
        self.embedder.chunks.return_value = []
        self.worker.process(dict(JOB))
        self.database.publish.assert_called_once()
        self.assertIn("No reliable text", self.database.publish.call_args.args[3])
        self.embedder.embed.assert_not_called()

    def test_failed_s3_delete_keeps_database_rows_for_retry(self):
        self.storage.delete_document.side_effect = RuntimeError("retry")
        job = dict(JOB, kind="delete")
        self.worker.process(job)
        self.database.complete_delete.assert_not_called()
        self.database.fail.assert_called_once()

    def test_successful_delete_never_calls_embedding(self):
        self.worker.process(dict(JOB, kind="delete"))
        self.database.complete_delete.assert_called_once()
        self.embedder.embed.assert_not_called()


class PublicationTests(unittest.TestCase):
    def test_fenced_publication_rolls_back_before_any_replacement(self):
        cursor = Mock()
        cursor.__enter__ = Mock(return_value=cursor)
        cursor.__exit__ = Mock(return_value=None)
        cursor.fetchone.return_value = None
        connection = Mock()
        connection.__enter__ = Mock(return_value=connection)
        connection.__exit__ = Mock(return_value=None)
        connection.cursor.return_value = cursor
        database = Database(Settings(), connector=lambda: connection)
        with self.assertRaises(LeaseLost):
            database.publish(JOB, [Page(1, "text", "native")], [])
        self.assertEqual(cursor.execute.call_count, 2)
        cursor.executemany.assert_not_called()


if __name__ == "__main__":
    unittest.main()
