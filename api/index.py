import os
import sys

# Ensure root directory and Lambda task root are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

for p in (ROOT_DIR, CURRENT_DIR, os.getcwd(), os.environ.get("LAMBDA_TASK_ROOT", "/var/task")):
    if p and os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)

from backend.main import app as _app

app = _app
