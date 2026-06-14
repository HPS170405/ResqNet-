@echo off
echo ==========================================
echo    ResqNet - Starting All Servers
echo ==========================================
echo.

:: Kill any existing processes on our ports
echo [1/5] Clearing old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5678"') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak >nul

:: Start Backend Server
echo [2/5] Starting Backend (port 5000)...
start "ResqNet Backend :5000" cmd /k "cd /d %~dp0server && node src/app.js"
timeout /t 2 /nobreak >nul

:: Start ML and Agentic Microservice
echo [3/5] Starting ML and Agentic Service (port 8000)...
start "ResqNet ML Service :8000" cmd /k "cd /d %~dp0ml-service && venv\Scripts\python -m uvicorn app:app --port 8000"
timeout /t 2 /nobreak >nul

:: Start Frontend Dev Server
echo [4/5] Starting Frontend (port 5173)...
start "ResqNet Frontend :5173" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 2 /nobreak >nul

:: Start n8n Automation Server
echo [5/5] Starting n8n (port 5678)...
start "ResqNet n8n :5678" cmd /k "npx n8n start"

echo.
echo ==========================================
echo  Frontend:   http://localhost:5173
echo  Backend/UI: http://localhost:5000
echo  ML Service: http://localhost:8000
echo  n8n Portal: http://localhost:5678
echo ==========================================
echo.
echo All servers are starting in new windows.
echo Open http://localhost:5173 (Vite Dev) or http://localhost:5000 (Production served) in your browser!
pause

