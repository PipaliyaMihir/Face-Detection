@echo off
title AttendEase - Smart Face Recognition Attendance System

echo ===================================================
echo 🧠 Starting AttendEase Attendance System...
echo ===================================================
echo.

:: 1. Start FastAPI Backend in a new window
echo 🚀 Launching Backend Server (Port 8000)...
start "AttendEase Backend Server" cmd /k "cd /d "%~dp0server" && if exist venv\Scripts\activate (call venv\Scripts\activate) && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

:: 2. Start React Frontend in a new window
echo 🎨 Launching Frontend Client (Port 5173)...
start "AttendEase Frontend Client" cmd /k "cd /d "%~dp0client" && npm run dev"

:: Wait 2 seconds and open browser
timeout /t 2 /nobreak >nul

echo 🌐 Opening Web Browser...
start http://localhost:5173

echo.
echo ===================================================
echo ✅ System Launched Successfully!
echo 📍 App:   http://localhost:5173
echo 📍 Admin: http://localhost:5173/login (admin / admin123)
echo 📍 API:   http://localhost:8000/docs
echo ===================================================
echo Keep the server terminal windows open while using the app.
echo.
pause
