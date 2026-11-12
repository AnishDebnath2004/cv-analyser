import os
import sys
import logging
import traceback

# Ensure project root is in sys.path so 'backend' package and modules are imported cleanly
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from backend.main import app
except Exception as e:
    logging.error(f"Failed to import backend.main in api/index.py: {e}\n{traceback.format_exc()}")
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="CV Analyzer Fallback API")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def vercel_startup_error(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Backend initialization error on Vercel: {str(e)}",
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc()
            }
        )


