import json
import os
import sys
import traceback
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        diag = {
            "status": "online",
            "cwd": os.getcwd(),
            "sys_path": sys.path[:10],
            "python_version": sys.version,
            "files_in_cwd": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else []
        }

        # Setup paths to test imports
        CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
        ROOT_DIR = os.path.dirname(CURRENT_DIR)
        for p in (ROOT_DIR, CURRENT_DIR, os.getcwd()):
            if p and p not in sys.path:
                sys.path.insert(0, p)

        # Test importing dependencies
        for mod in ("fastapi", "pydantic", "pypdf", "docx", "httpx", "backend.main"):
            try:
                __import__(mod)
                diag[f"import_{mod}"] = "OK"
            except Exception as e:
                diag[f"import_{mod}_err"] = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"

        self.wfile.write(json.dumps(diag, indent=2).encode("utf-8"))

    def do_POST(self):
        self.do_GET()
