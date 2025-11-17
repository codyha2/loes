@echo off
echo ====================================
echo Stopping LOES Backend Server
echo ====================================
echo.
echo Finding processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a
)
echo.
echo Done!
pause

