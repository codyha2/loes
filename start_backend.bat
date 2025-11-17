@echo off
echo ====================================
echo Starting LOES Backend Server
echo ====================================
cd /d C:\Users\Admin\Documents\LOES\backend
echo.
echo Checking if port 8000 is in use...
netstat -ano | findstr :8000
echo.
echo Starting backend...
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause

