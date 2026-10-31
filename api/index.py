import os
import sys
import traceback

# Ensure project root and backend directories are in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from backend.main import app
except Exception as e:
    err_tb = traceback.format_exc()
    print("FATAL BACKEND IMPORT ERROR IN VERCEL SERVERLESS:", err_tb)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="CV Analyzer Fallback")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    async def handle_import_error(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Backend serverless initialization error: {str(e)}",
                "traceback": err_tb.splitlines()[-8:]
            }
        )
