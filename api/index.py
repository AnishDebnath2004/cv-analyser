import os
import sys
import logging
import traceback
from typing import Optional

# Setup candidate roots to ensure 'backend' package and modules are importable anywhere
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
CWD = os.getcwd()
LAMBDA_TASK_ROOT = os.environ.get("LAMBDA_TASK_ROOT", "/var/task")

candidates = [CURRENT_DIR, PARENT_DIR, CWD, LAMBDA_TASK_ROOT]
for c in candidates:
    if c and os.path.isdir(c) and c not in sys.path:
        sys.path.insert(0, c)
    backend_sub = os.path.join(c, "backend")
    if os.path.isdir(backend_sub) and backend_sub not in sys.path:
        sys.path.insert(0, backend_sub)

_startup_error: Optional[str] = None
_startup_traceback: Optional[str] = None

try:
    try:
        from backend.main import app
    except ImportError:
        from main import app
except Exception as exc:
    _startup_error = f"{type(exc).__name__}: {str(exc)}"
    _startup_traceback = traceback.format_exc()
    logging.error(f"Failed to import backend.main in api/index.py: {_startup_error}\n{_startup_traceback}")

    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="CV Analyzer Fallback API")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def vercel_startup_error(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Backend initialization error on Vercel: {_startup_error}",
                "traceback": _startup_traceback,
                "sys_path": sys.path,
                "cwd": os.getcwd(),
                "current_dir": CURRENT_DIR,
                "parent_dir": PARENT_DIR,
                "root_contents": os.listdir(PARENT_DIR) if os.path.exists(PARENT_DIR) else [],
                "cwd_contents": os.listdir(CWD) if os.path.exists(CWD) else [],
            }
        )
