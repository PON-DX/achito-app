@echo off
echo ============================================
echo   Sacred Treasures - Amulet Shop Setup
echo ============================================

echo.
echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 ( echo Backend install failed. & pause & exit /b 1 )

echo.
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 ( echo Frontend install failed. & pause & exit /b 1 )

echo.
echo [3/4] Starting backend server on port 5000...
cd /d "%~dp0backend"
start "Amulet Shop - Backend" cmd /k "node server.js"

echo.
echo [4/4] Starting frontend dev server on port 5173...
cd /d "%~dp0frontend"
start "Amulet Shop - Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo   App is starting up!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   Admin:    http://localhost:5173/login
echo   Credentials: admin / admin123
echo ============================================
timeout /t 3
