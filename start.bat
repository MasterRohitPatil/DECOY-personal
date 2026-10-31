@echo off
echo =====================================================================
echo  SENTINEL GRID - AI-Based National Cyber Threat Early Warning System
echo  D3COY 1.0 PS 01 Hackathon Prototype
echo =====================================================================
echo.

echo Starting Backend API (FastAPI + Supabase PostgreSQL) on http://localhost:8000 ...
start "SENTINEL GRID Backend (FastAPI)" cmd /k "cd backend && py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend UI (React + Vite + Tailwind) on http://localhost:5173 ...
start "SENTINEL GRID Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo Launching browser to http://localhost:5173 in 3 seconds...
ping -n 4 127.0.0.1 >nul
start http://localhost:5173

echo.
echo =====================================================================
echo  SENTINEL GRID is LIVE!
echo  - Frontend: http://localhost:5173
echo  - Backend Docs: http://localhost:8000/docs
echo  - Press keys 1 to 7 in the browser for the 3-minute rehearsed pitch.
echo =====================================================================

