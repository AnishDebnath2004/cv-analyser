import os
import sys
import json
import logging
import traceback

_import_status = {}

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
LAMBDA_TASK_ROOT = os.environ.get("LAMBDA_TASK_ROOT", "/var/task")

for p in (ROOT_DIR, CURRENT_DIR, os.getcwd(), LAMBDA_TASK_ROOT):
    if p and os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)
    backend_sub = os.path.join(p, "backend")
    if os.path.isdir(backend_sub) and backend_sub not in sys.path:
        sys.path.insert(0, backend_sub)

try:
    import fastapi
    _import_status["fastapi"] = getattr(fastapi, "__version__", "unknown")
except Exception as e:
    _import_status["fastapi_error"] = f"{type(e).__name__}: {e}"

try:
    from backend.main import app as fastapi_app
    _import_status["backend_main"] = "SUCCESS"
except Exception as e:
    fastapi_app = None
    _import_status["backend_main_error"] = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
    logging.error(f"Failed to load backend.main app: {_import_status}")


async def app(scope, receive, send):
    scope_type = scope.get("type")

    # Special built-in diagnostics route
    if scope_type == "http":
        path = scope.get("path", "")
        if path in ("/api/debug", "/debug"):
            body = json.dumps({
                "status": "online",
                "initialized": fastapi_app is not None,
                "import_status": _import_status,
                "python_version": sys.version,
                "cwd": os.getcwd(),
                "sys_path": sys.path[:10],
                "cwd_files": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else [],
            }).encode("utf-8")
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    [b"content-type", b"application/json"],
                    [b"content-length", str(len(body)).encode("utf-8")],
                    [b"access-control-allow-origin", b"*"],
                ],
            })
            await send({
                "type": "http.response.body",
                "body": body,
            })
            return

    if fastapi_app is not None:
        try:
            return await fastapi_app(scope, receive, send)
        except Exception as req_err:
            if scope_type == "http":
                body = json.dumps({
                    "detail": f"Exception during request handling: {type(req_err).__name__}: {req_err}",
                    "traceback": traceback.format_exc(),
                    "path": scope.get("path"),
                }).encode("utf-8")
                await send({
                    "type": "http.response.start",
                    "status": 500,
                    "headers": [
                        [b"content-type", b"application/json"],
                        [b"content-length", str(len(body)).encode("utf-8")],
                        [b"access-control-allow-origin", b"*"],
                    ],
                })
                await send({
                    "type": "http.response.body",
                    "body": body,
                })
                return
            raise

    # Lifespan handling if FastAPI failed to load
    if scope_type == "lifespan":
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                await send({"type": "lifespan.shutdown.complete"})
                return

    # HTTP fallback response if FastAPI failed to load
    if scope_type == "http":
        body = json.dumps({
            "detail": "Backend initialization failed on Vercel.",
            "import_status": _import_status,
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
                [b"access-control-allow-origin", b"*"],
            ],
        })
        await send({
            "type": "http.response.body",
            "body": body,
        })
