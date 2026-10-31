@echo off
echo =======================================================
echo   PathFinder AI - O*NET CV Analysis & Career Agent
echo =======================================================
echo.
echo Activating virtual environment...
call .venv\Scripts\activate.bat
echo Starting backend and web application on http://localhost:8000
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend
pause
