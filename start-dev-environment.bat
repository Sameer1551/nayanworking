@echo off
setlocal
echo ========================================
echo Starting Nayan Eye Care Development Environment
echo ========================================
echo.

echo [1/3] Checking MySQL service status...
sc query MySQL80 | find "RUNNING" > nul
if %errorlevel% neq 0 (
    echo Attempting to start MySQL80...
    net start MySQL80
) else (
    echo MySQL80 service is already running.
)

echo.
echo [2/3] Starting Spring Boot Backend...
start "Spring Boot Backend" /D "%~dp0" cmd /k "mvn spring-boot:run"

echo.
echo [3/3] Starting Frontend Development Server...
npm run dev

echo.
echo Development Environment Startup Complete!
pause
