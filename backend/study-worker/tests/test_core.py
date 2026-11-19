import hashlib
import io
import json
import re
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock

from study_worker.config import Settings
from study_worker.core import (BudgetExceeded, ExtractionError, Page, chunk_id, derived_prefix,
                               merge_ocr, normalize_text, quota_reservations, reliable_lines)
from study_worker.embeddings import Embedder
from study_worker.storage import Storage
from study_worker.vision import Vision

DOC = "00000000-0000-4000-8000-000000000001"
WORKSPACE = "00000000-0000-4000-8000-000000000002"


class Tokenizer:
    def encode(self, text, add_special_tokens=True):
        return list(range(len(re.findall(r"\S+", text)) + (2 if add_special_tokens else 0)))

    def __call__(self, text, **kwargs):
        return {"offset_mapping": [(m.start(), m.end()) for m in re.finditer(r"\S+", text)]}


class Model:
    tokenizer = Tokenizer()

    def encode(self, texts, **kwargs):
        self.last_texts = texts
        return [[1.0] + [0.0] * 383 for _ in texts]


class CoreTests(unittest.TestCase):
    def test_preserves_equations_and_short_symbols(self):
        self.assertEqual(normalize_text("x² = α\n+\n=\n\x00"), "x² = α\n+\n=")

    def test_mixed_page_merge_keeps_scanned_body_without_duplicate_heading(self):
        merged = merge_ocr("Unit 1\nEntropy", "Unit 1\nEntropy\nΔS = Q/T\nΔS = Q/T")
        self.assertEqual(merged, "Unit 1\nEntropy\nΔS = Q/T")

    def test_uncertain_equation_is_not_answer_evidence(self):
        self.assertEqual(reliable_lines("Definition\nx = [unclear]\nKnown fact"), "Definition\nKnown fact")

    def test_chunk_identity_is_deterministic_and_revision_sensitive(self):
        values = (DOC, 1, 0, "Text", "e5", "rev1")
        self.assertEqual(chunk_id(*values), chunk_id(*values))
        self.assertNotEqual(chunk_id(*values), chunk_id(*values[:-1], "rev2"))

    def test_prefix_requires_exact_uuids(self):
        self.assertEqual(derived_prefix(WORKSPACE, DOC), f"study-derived/{WORKSPACE}/{DOC}/")
        with self.assertRaises(ValueError):
            derived_prefix("../../", DOC)

    def test_quota_fixed_utc_windows_and_shared_scopes(self):
        now = datetime(2026, 11, 18, 7, 31, 59, tzinfo=timezone.utc)
        reservations = quota_reservations(Settings(), DOC, now)
        rows = {bucket: (scope, window, amount, limit) for scope, bucket, window, amount, limit in reservations}
        self.assertEqual(rows["groq_tokens_minute"][1].second, 0)
        self.assertEqual(rows["groq_tokens_day"][1].hour, 0)
        self.assertEqual(rows["groq_tokens_minute"][2], 7000)
        self.assertEqual(rows["vision_pages_day"][0], "user:" + DOC)
        self.assertEqual(reservations, sorted(reservations, key=lambda r: (r[0], r[1], r[2])))

    def test_paid_or_other_model_is_rejected(self):
        with self.assertRaises(ValueError):
            Settings.from_env({"STUDY_VISION_MODEL": "some-other-model"})
        with self.assertRaises(ValueError):
            Settings.from_env({"STUDY_GROQ_RPD": "99999"})


class EmbeddingTests(unittest.TestCase):
    def setUp(self):
        self.model = Model()
        self.embedder = Embedder(Settings(), self.model)

    def test_prefix_and_normalized_dimension(self):
        result = self.embedder.embed(["entropy"], "query")
        self.assertEqual(self.model.last_texts, ["query: entropy"])
        self.assertEqual(len(result[0]), 384)

    def test_chunks_bounded_with_overlap_preserve_page_and_revision(self):
        text = " ".join("word" + str(i) for i in range(1000))
        chunks = self.embedder.chunks(DOC, [Page(7, text, "native")])
        self.assertGreater(len(chunks), 2)
        self.assertTrue(all(c["tokens"] <= 450 and c["page_number"] == 7 for c in chunks))
        self.assertEqual(chunks[0]["text"].split()[-50:], chunks[1]["text"].split()[:50])
        self.assertEqual(chunks, self.embedder.chunks(DOC, [Page(7, text, "native")]))

    def test_uncertain_text_not_embedded(self):
        self.assertEqual(self.embedder.chunks(DOC, [Page(1, "guessed", "vision", indexable_text="")]), [])

    def test_oversized_or_invalid_vectors_are_rejected(self):
        with self.assertRaises(ValueError):
            self.embedder.embed(["x " * 500])
        self.model.encode = lambda *_args, **_kwargs: [[0.0] * 384]
        with self.assertRaises(ValueError):
            self.embedder.embed(["valid"])


class StorageTests(unittest.TestCase):
    def test_streamed_checksum_and_pdf_validation(self):
        data = b"%PDF-1.7\nexample"
        client = Mock()
        client.get_object.return_value = {"Body": io.BytesIO(data), "ContentLength": len(data)}
        storage = Storage(Settings(bucket="test"), client)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "file.pdf"
            storage.download("private/key", path, hashlib.sha256(data).hexdigest())
            self.assertEqual(path.read_bytes(), data)
        self.assertTrue(client.get_object.return_value["Body"].closed)

    def test_checksum_failure_cannot_index_different_pdf(self):
        client = Mock()
        client.get_object.return_value = {"Body": io.BytesIO(b"%PDF-1.7\nexample")}
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises(ExtractionError):
                Storage(Settings(bucket="test"), client).download("key", Path(folder) / "x", "0" * 64)

    def test_delete_partial_s3_failure_requires_retry(self):
        client = Mock()
        client.delete_objects.return_value = {"Errors": [{"Key": "private"}]}
        with self.assertRaises(RuntimeError):
            Storage(Settings(bucket="test"), client).delete_keys(["private"])


class VisionTests(unittest.TestCase):
    def test_minute_capacity_paces_one_page_but_daily_exhaustion_does_not_wait(self):
        for short_window in (True, False):
            database, opener, waiter = Mock(), Mock(), Mock()
            database.cached_transcription.return_value = None
            database.reserve_vision.side_effect = [BudgetExceeded('capacity', 20, short_window), None]
            response = Mock()
            response.__enter__ = Mock(return_value=response)
            response.__exit__ = Mock(return_value=None)
            response.read.return_value = json.dumps({'choices': [{'message': {'content': 'Complete transcription'}, 'finish_reason': 'stop'}]}).encode()
            opener.return_value = response
            vision = Vision(Settings(groq_key='test', free_plan_confirmed=True), database, opener, waiter)
            if short_window:
                self.assertEqual(vision.transcribe(b'jpg', DOC, job={'id': 'job'}, page_number=1)[0], 'Complete transcription')
                waiter.assert_called_once_with({'id': 'job'}, 20)
                self.assertEqual(database.reserve_vision.call_count, 2)
            else:
                with self.assertRaises(BudgetExceeded):
                    vision.transcribe(b'jpg', DOC, job={'id': 'job'}, page_number=1)
                waiter.assert_not_called()
                opener.assert_not_called()

    def test_successful_cached_page_uses_no_provider_or_quota(self):
        opener, database = Mock(), Mock()
        database.cached_transcription.return_value = "Previously read handwriting"
        text, truncated = Vision(Settings(), database, opener).transcribe(b"jpg", DOC, job={"document_id": DOC}, page_number=1)
        self.assertEqual(text, "Previously read handwriting")
        self.assertFalse(truncated)
        opener.assert_not_called()
        database.reserve_vision.assert_not_called()

    def test_only_complete_unambiguous_readings_are_cached(self):
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=None)
        database = Mock()
        database.cached_transcription.return_value = None
        vision = Vision(Settings(groq_key="test", free_plan_confirmed=True), database, Mock(return_value=response))
        for content, reason in [("x = [unclear]", "stop"), ("x = 1", "length"), ("x = 2", "stop")]:
            response.read.return_value = json.dumps({"choices": [{"message": {"content": content}, "finish_reason": reason}]}).encode()
            vision.transcribe(b"jpg", DOC, job={"document_id": DOC}, page_number=1)
        self.assertEqual(database.save_transcription.call_count, 1)
        self.assertEqual(database.save_transcription.call_args.args[-1], "x = 2")

    def test_no_explicit_free_confirmation_means_no_provider_call(self):
        opener, database = Mock(), Mock()
        with self.assertRaises(BudgetExceeded):
            Vision(Settings(groq_key="test"), database, opener).transcribe(b"image", DOC)
        opener.assert_not_called()
        database.reserve_vision.assert_not_called()

    def test_quota_failure_prevents_provider_call(self):
        opener, database = Mock(), Mock()
        database.reserve_vision.side_effect = BudgetExceeded("limit")
        with self.assertRaises(BudgetExceeded):
            Vision(Settings(groq_key="test", free_plan_confirmed=True), database, opener).transcribe(b"image", DOC)
        opener.assert_not_called()

    def test_literal_prompt_one_image_and_truncation(self):
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=None)
        response.read.return_value = json.dumps({"choices": [{"message": {"content": "x = [unclear]"},
                                                               "finish_reason": "length"}]}).encode()
        opener, database = Mock(return_value=response), Mock()
        text, truncated = Vision(Settings(groq_key="test", free_plan_confirmed=True), database, opener).transcribe(b"jpg", DOC)
        self.assertTrue(truncated)
        self.assertEqual(text, "x = [unclear]")
        body = json.loads(opener.call_args.args[0].data)
        self.assertEqual(len(body["messages"][0]["content"]), 2)
        self.assertIn("never guess", body["messages"][0]["content"][0]["text"])
        self.assertEqual(body["model"], Settings().vision_model)
        self.assertEqual(body["reasoning_effort"], "none")


if __name__ == "__main__":
    unittest.main()
