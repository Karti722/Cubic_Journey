import http.server
import mimetypes
import os
import socketserver
import threading
import time
from urllib.parse import urlparse
from pathlib import Path

PORT = 8123
ROOT = Path(__file__).resolve().parent

# Ensure module files are served with JavaScript MIME types.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")


class LiveReloadState:
    def __init__(self):
        self._lock = threading.Lock()
        self._version = 0

    def bump(self):
        with self._lock:
            self._version += 1

    def get(self):
        with self._lock:
            return self._version


STATE = LiveReloadState()


def should_watch(path: Path) -> bool:
    if not path.is_file():
        return False
    if path.name.startswith("."):
        return False
    if "__pycache__" in path.parts or ".git" in path.parts:
        return False
    return True


def snapshot_tree() -> dict[str, float]:
    files = {}
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in {".git", "__pycache__"}]
        for name in names:
            path = Path(base) / name
            if not should_watch(path):
                continue
            try:
                files[str(path.relative_to(ROOT))] = path.stat().st_mtime
            except OSError:
                continue
    return files


def watch_files(poll_interval: float = 0.35):
    last = snapshot_tree()
    while True:
        time.sleep(poll_interval)
        current = snapshot_tree()
        if current != last:
            STATE.bump()
            last = current


class LiveReloadHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/__events":
            self.handle_events_stream()
            return
        self.strip_conditional_headers()
        super().do_GET()

    def do_HEAD(self):
        self.strip_conditional_headers()
        super().do_HEAD()

    def strip_conditional_headers(self):
        for header_name in ("If-Modified-Since", "If-None-Match"):
            try:
                del self.headers[header_name]
            except Exception:
                pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def handle_events_stream(self):
        try:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            return

        last_seen = STATE.get()
        try:
            while True:
                current = STATE.get()
                if current != last_seen:
                    payload = f"event: reload\ndata: {current}\n\n"
                    self.wfile.write(payload.encode("utf-8"))
                    self.wfile.flush()
                    last_seen = current
                else:
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
                time.sleep(0.6)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            return


class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    watcher = threading.Thread(target=watch_files, daemon=True)
    watcher.start()

    with ThreadingTCPServer(("", PORT), LiveReloadHandler) as httpd:
        print(f"Serving at http://127.0.0.1:{PORT}")
        print("Live reload enabled. Save any file to auto-refresh connected pages.")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
