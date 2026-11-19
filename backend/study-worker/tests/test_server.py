import http.client
from http.server import ThreadingHTTPServer
import json
import threading
import unittest
from unittest.mock import Mock

from study_worker.config import Settings
from study_worker.server import handler_class


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.settings = Settings(internal_token='test-internal-token')
        self.embedder = Mock()
        self.embedder.embed.return_value = [[1.0] + [0.0] * 383]
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), handler_class(self.settings, self.embedder))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.close)

    def close(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=1)

    def request(self, method, path, body=None, authenticated=True):
        connection = http.client.HTTPConnection(*self.server.server_address, timeout=5)
        headers = {'Content-Type': 'application/json'}
        if authenticated:
            headers['X-Study-Token'] = self.settings.internal_token
        try:
            connection.request(method, path, body, headers)
            response = connection.getresponse()
            return response.status, json.loads(response.read())
        finally:
            connection.close()

    def test_both_health_and_embedding_require_internal_auth(self):
        for method, path in [('GET', '/health'), ('POST', '/embed')]:
            status, _ = self.request(method, path, '{}', authenticated=False)
            self.assertEqual(status, 401)
        self.embedder.embed.assert_not_called()

    def test_embeddings_report_the_exact_model_revision(self):
        status, data = self.request('POST', '/embed', json.dumps({'texts': ['deadlock'], 'kind': 'query'}))
        self.assertEqual(status, 200)
        self.assertEqual(data['model'], self.settings.embedding_model)
        self.assertEqual(data['revision'], self.settings.embedding_revision)
        self.assertEqual(len(data['embeddings'][0]), 384)
        self.embedder.embed.assert_called_once_with(['deadlock'], 'query')

    def test_oversized_body_never_reaches_model(self):
        status, _ = self.request('POST', '/embed', 'x' * 131073)
        self.assertEqual(status, 413)
        self.embedder.embed.assert_not_called()


if __name__ == '__main__':
    unittest.main()
