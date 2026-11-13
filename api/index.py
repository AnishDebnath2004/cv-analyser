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

for p in (CWD, PARENT_DIR, CURRENT_DIR, LAMBDA_TASK_ROOT):
    if p and os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)
    backend_sub = os.path.join(p, "backend")
    if os.path.isdir(backend_sub) and backend_sub not in sys.path:
        sys.path.insert(0, backend_sub)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app instance at top-level so Vercel's ASGI runtime can always bind immediately
app = FastAPI(title="CV Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_init_error: Optional[str] = None
_init_traceback: Optional[str] = None

try:
    try:
        from backend.main import api_router
    except ImportError:
        from main import api_router

    # Mount the backend api_router for both '/api' prefixed calls and root-relative calls
    app.include_router(api_router, prefix="/api")
    app.include_router(api_router)
except Exception as exc:
    _init_error = f"{type(exc).__name__}: {str(exc)}"
    _init_traceback = traceback.format_exc()
    logging.error(f"Failed to load backend.main api_router: {_init_error}\n{_init_traceback}")


@app.get("/api/debug")
@app.get("/debug")
async def debug_info():
    """Diagnostic endpoint to inspect environment and import health on Vercel."""
    return {
        "status": "online",
        "initialized": _init_error is None,
        "init_error": _init_error,
        "init_traceback": _init_traceback,
        "python_version": sys.version,
        "cwd": os.getcwd(),
        "sys_path": sys.path[:10],
        "cwd_listdir": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else [],
        "parent_listdir": os.listdir(PARENT_DIR) if os.path.exists(PARENT_DIR) else [],
    }


if _init_error:
    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def fallback_startup_error(request: Request, full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Backend initialization error on Vercel: {_init_error}",
                "traceback": _init_traceback,
                "requested_path": full_path,
            }
        )
