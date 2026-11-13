import os
import sys
import json
import logging
import traceback
from typing import Optional

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

_fastapi_error: Optional[str] = None
_backend_error: Optional[str] = None
_backend_traceback: Optional[str] = None

try:
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware

    # Initialize top-level FastAPI instance
    app = FastAPI(title="CV Analyzer API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    try:
        try:
            from backend.main import api_router
        except ImportError:
            from main import api_router

        # Mount backend api_router for both '/api' prefixed calls and root-relative calls
        app.include_router(api_router, prefix="/api")
        app.include_router(api_router)
    except Exception as b_exc:
        _backend_error = f"{type(b_exc).__name__}: {str(b_exc)}"
        _backend_traceback = traceback.format_exc()
        logging.error(f"Failed to load backend api_router: {_backend_error}\n{_backend_traceback}")

    @app.get("/api/debug")
    @app.get("/debug")
    async def debug_info():
        return {
            "status": "online",
            "initialized": _backend_error is None,
            "backend_error": _backend_error,
            "backend_traceback": _backend_traceback,
            "python_version": sys.version,
            "cwd": os.getcwd(),
            "sys_path": sys.path[:10],
            "cwd_listdir": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else [],
            "parent_listdir": os.listdir(PARENT_DIR) if os.path.exists(PARENT_DIR) else [],
        }

    if _backend_error:
        @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
        async def fallback_route(request: Request, full_path: str):
            return JSONResponse(
                status_code=500,
                content={
                    "detail": f"Backend initialization error on Vercel: {_backend_error}",
                    "traceback": _backend_traceback,
                    "requested_path": full_path,
                }
            )

except Exception as f_exc:
    # Pure ASGI standard-library fallback in case FastAPI itself could not be imported
    _fastapi_error = f"{type(f_exc).__name__}: {str(f_exc)}\n{traceback.format_exc()}"

    async def app(scope, receive, send):
        if scope.get("type") == "http":
            body = json.dumps({
                "detail": f"FastAPI import failure on Vercel: {_fastapi_error}",
                "python_version": sys.version,
                "cwd": os.getcwd(),
                "sys_path": sys.path[:10],
            }).encode("utf-8")
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    [b"content-type", b"application/json"],
                    [b"content-length", str(len(body)).encode("utf-8")],
                ],
            })
            await send({
                "type": "http.response.body",
                "body": body,
            })
