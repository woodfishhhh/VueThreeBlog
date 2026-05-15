#!/usr/bin/env python3

import json
import os
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class JsonCounterStore:
    def __init__(self, data_file):
        self.data_file = Path(data_file)
        self._lock = threading.Lock()
        self._ensure_file()

    def read_total(self):
        with self._lock:
            return self._read_payload()["total"]

    def increment(self):
        with self._lock:
            payload = self._read_payload()
            payload["total"] += 1
            self._write_payload(payload)
            return payload["total"]

    def _ensure_file(self):
        self.data_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.data_file.exists():
          self._write_payload({"total": 0})

    def _read_payload(self):
        payload = json.loads(self.data_file.read_text(encoding="utf-8"))
        if not isinstance(payload, dict) or not isinstance(payload.get("total"), int):
            raise ValueError("visitor counter payload must be an object with integer total")
        return payload

    def _write_payload(self, payload):
        temp_file = self.data_file.with_suffix(f"{self.data_file.suffix}.tmp")
        temp_file.write_text(json.dumps(payload), encoding="utf-8")
        os.replace(temp_file, self.data_file)


class VisitorCounterHandler(BaseHTTPRequestHandler):
    server_version = "VisitorCounter/1.0"

    def do_GET(self):
        if self.path == "/api/visitor-count":
            total = self.server.counter_store.read_total()
            self._send_json(HTTPStatus.OK, {"total": total})
            return

        if self.path == "/api/visitor-count/visit":
            self._send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "method not allowed"})
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def do_POST(self):
        if self.path == "/api/visitor-count/visit":
            total = self.server.counter_store.increment()
            self._send_json(HTTPStatus.OK, {"total": total, "counted": True})
            return

        if self.path == "/api/visitor-count":
            self._send_json(HTTPStatus.METHOD_NOT_ALLOWED, {"error": "method not allowed"})
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def log_message(self, format, *args):
        return

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def create_server(host, port, data_file):
    server = ThreadingHTTPServer((host, port), VisitorCounterHandler)
    server.counter_store = JsonCounterStore(data_file)
    return server


def main():
    host = os.environ.get("VISITOR_COUNTER_HOST", "127.0.0.1")
    port = int(os.environ.get("VISITOR_COUNTER_PORT", "3011"))
    data_file = os.environ.get(
        "VISITOR_COUNTER_DATA_FILE",
        "/opt/blog-stack/services/visitor-counter/data/visitor-count.json",
    )
    server = create_server(host, port, data_file)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
