import os
import sys

# Ensure candidate directories are on sys.path so 'backend' package and modules are imported cleanly
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

for path in (ROOT_DIR, CURRENT_DIR, os.getcwd(), os.environ.get("LAMBDA_TASK_ROOT", "/var/task")):
    if path and os.path.isdir(path) and path not in sys.path:
        sys.path.insert(0, path)

from backend.main import app

@app.get("/api/debug")
@app.get("/debug")
async def debug_status():
    return {
        "status": "online",
        "initialized": True,
        "cwd": os.getcwd(),
        "python_version": sys.version,
    }
