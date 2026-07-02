@echo off
title Stop AttendEase

echo Stopping AttendEase Backend & Frontend servers...
taskkill /FI "WINDOWTITLE eq AttendEase Backend Server*" /F /T >nul 2>&1
taskkill /FI "WINDOWTITLE eq AttendEase Frontend Client*" /F /T >nul 2>&1

echo ✅ Servers stopped cleanly.
pause
