"""Authenticated, bounded HTTP access to local E5 embeddings only."""
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import threading


def handler_class(settings, embedder):
    gate = threading.BoundedSemaphore(2)

    class Handler(BaseHTTPRequestHandler):
        server_version = "EDUSStudy"

        def setup(self):
            super().setup()
            self.connection.settimeout(15)

        def log_message(self, *args):
            pass  # Do not log request text, credentials, or document content.

        def send_json(self, status, data):
            body = json.dumps(data, allow_nan=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def authenticated(self):
            supplied = self.headers.get("X-Study-Token", "")
            if not hmac.compare_digest(supplied, settings.internal_token):
                self.send_json(401, {"error": "Unauthorized"})
                return False
            return True

        def do_GET(self):
            if not self.authenticated():
                return
            if self.path != "/health":
                self.send_json(404, {"error": "Not found"})
                return
            self.send_json(200, {"status": "ok", "dimension": 384, "model": settings.embedding_model,
                                 "revision": settings.embedding_revision})

        def do_POST(self):
            if not self.authenticated():
                return
            if self.path != "/embed":
                self.send_json(404, {"error": "Not found"})
                return
            if not gate.acquire(blocking=False):
                self.send_json(429, {"error": "Embedding service is busy"})
                return
            try:
                if self.headers.get("Transfer-Encoding"):
                    raise ValueError("Content-Length is required")
                size = int(self.headers.get("Content-Length", "0"))
                if not 1 <= size <= 131072:
                    self.send_json(413, {"error": "Request is too large"})
                    return
                data = json.loads(self.rfile.read(size))
                if not isinstance(data, dict) or not isinstance(data.get("texts"), list):
                    raise ValueError("Expected texts array")
                texts, kind = data["texts"], data.get("kind", "passage")
                if any(not isinstance(t, str) for t in texts) or sum(len(t) for t in texts) > 32000:
                    raise ValueError("Text batch is too large")
                self.send_json(200, {"embeddings": embedder.embed(texts, kind), "model": settings.embedding_model,
                                     "revision": settings.embedding_revision})
            except (ValueError, TypeError, UnicodeError):
                self.send_json(400, {"error": "Invalid input: use 1–32 texts, query/passage kind and <=450 tokens per text"})
            except (OSError, TimeoutError):
                self.close_connection = True
            except Exception:
                self.send_json(503, {"error": "Embedding service unavailable"})
            finally:
                gate.release()

    return Handler


def serve(settings, embedder):
    settings.require_server()
    server = ThreadingHTTPServer((settings.host, settings.port), handler_class(settings, embedder))
    server.daemon_threads = True
    server.request_queue_size = 16
    try:
        server.serve_forever()
    finally:
        server.server_close()
