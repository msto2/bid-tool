@echo off
echo Starting Fantasy Football Bid Tool...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install npm dependencies
        pause
        exit /b 1
    )
)

REM Check if Python dependencies are installed for the API
cd espn-api-0.45.1
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install fastapi uvicorn espn-api requests
    if errorlevel 1 (
        echo ERROR: Failed to install Python dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists
cd ..
if not exist ".env" (
    echo.
    echo WARNING: .env file not found!
    echo You need to create a .env file with your ESPN credentials:
    echo.
    echo SWID=your_swid_cookie_value
    echo ESPN_S2=your_espn_s2_cookie_value
    echo.
    echo Please check the README.md for instructions on how to get these values.
    pause
)

echo.
echo Starting ESPN API server on port 8000...
start "ESPN API Server" cmd /c "cd espn-api-0.45.1 && python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload"

REM Wait a moment for the API server to start
timeout /t 3 /nobreak >nul

echo Starting SvelteKit development server...
start "SvelteKit Dev Server" cmd /c "npm run dev"

echo.
echo Both servers are starting...
echo - ESPN API Server: http://localhost:8000
echo - SvelteKit App: http://localhost:5173
echo.
echo Press any key to stop both servers...
pause >nul

REM Kill the servers
taskkill /f /im "python.exe" /fi "WINDOWTITLE eq ESPN API Server*" >nul 2>&1
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq SvelteKit Dev Server*" >nul 2>&1

echo Servers stopped.
pause