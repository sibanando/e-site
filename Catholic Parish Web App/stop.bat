@echo off
echo Stopping Catholic Parish Web App...

echo [1/3] Stopping Backend API (port 4000)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":4000 " ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)
echo     Backend stopped.

echo [2/3] Stopping Frontend (port 5173)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)
echo     Frontend stopped.

echo [3/3] Stopping PostgreSQL (Docker)...
docker stop parish-postgres >nul 2>&1
echo     PostgreSQL stopped.

echo.
echo All services stopped.
