import json
import sys
import traceback
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            body = {
                "status": "ok",
                "message": "Vercel Python Lambda is active!",
                "python": sys.version
            }
            self.wfile.write(json.dumps(body).encode("utf-8"))
        except Exception:
            self.send_response(500)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(traceback.format_exc().encode("utf-8"))

    def do_POST(self):
        self.do_GET()
