import http.server
import mimetypes
import socketserver

PORT = 8123

# Ensure module files are served with JavaScript MIME types.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://127.0.0.1:{PORT}")
    httpd.serve_forever()
