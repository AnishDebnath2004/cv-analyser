import os
import sys
import logging
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app at top-level so @vercel/python AST scanner detects it
app = FastAPI(title="CV Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup candidate roots so that 'backend' package and modules are importable in Vercel serverless Lambda
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

_startup_error = None
_startup_traceback = None

try:
    try:
        from backend.main import api_router
    except ImportError:
        from main import api_router

    app.include_router(api_router, prefix="/api")
    app.include_router(api_router)
except Exception as b_exc:
    _startup_error = f"{type(b_exc).__name__}: {str(b_exc)}"
    _startup_traceback = traceback.format_exc()
    logging.error(f"Failed to load backend api_router: {_startup_error}\n{_startup_traceback}")


@app.get("/api/debug")
@app.get("/debug")
async def debug_info():
    return {
        "status": "online",
        "initialized": _startup_error is None,
        "startup_error": _startup_error,
        "startup_traceback": _startup_traceback,
        "python_version": sys.version,
        "cwd": os.getcwd(),
        "sys_path": sys.path[:10],
        "cwd_listdir": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else [],
        "parent_listdir": os.listdir(PARENT_DIR) if os.path.exists(PARENT_DIR) else [],
    }


@app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def fallback_catchall(request: Request, full_path: str):
    if _startup_error:
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Backend initialization error on Vercel: {_startup_error}",
                "traceback": _startup_traceback,
                "requested_path": full_path,
            }
        )
    return JSONResponse(
        status_code=404,
        content={
            "detail": f"Route not found: {request.method} /{full_path}",
            "requested_path": full_path,
        }
    )
