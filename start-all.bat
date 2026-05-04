@echo off
echo Starting AI Interviewer Services...

SET ROOT=%~dp0

REM ===============================
REM Start Backend
REM ===============================
start cmd /k "cd /d "%ROOT%backend" && npm run dev"

REM ===============================
REM Start AI Service (FastAPI + Groq)
REM ===============================
start cmd /k "cd /d "%ROOT%ai-service" && venv\Scripts\activate && python main.py"

REM ===============================
REM Start Frontend
REM ===============================
start cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo All services launched!
pause
