#!/bin/bash

echo "Starting Fantasy Football Bid Tool..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install npm dependencies"
        exit 1
    fi
fi

# Check if Python dependencies are installed for the API
cd espn-api-0.45.1
if ! python3 -c "import fastapi" &> /dev/null; then
    echo "Installing Python dependencies..."
    pip3 install fastapi uvicorn espn-api requests
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install Python dependencies"
        exit 1
    fi
fi

# Check if .env file exists
cd ..
if [ ! -f ".env" ]; then
    echo
    echo "WARNING: .env file not found!"
    echo "You need to create a .env file with your ESPN credentials:"
    echo
    echo "SWID=your_swid_cookie_value"
    echo "ESPN_S2=your_espn_s2_cookie_value"
    echo
    echo "Please check the README.md for instructions on how to get these values."
    read -p "Press Enter to continue..."
fi

echo
echo "Starting ESPN API server on port 8000..."
cd espn-api-0.45.1
python3 -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!

# Wait a moment for the API server to start
sleep 3

echo "Starting SvelteKit development server..."
cd ..
npm run dev &
SVELTE_PID=$!

echo
echo "Both servers are running..."
echo "- ESPN API Server: http://localhost:8000"
echo "- SvelteKit App: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup on exit
cleanup() {
    echo
    echo "Stopping servers..."
    kill $API_PID 2>/dev/null
    kill $SVELTE_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user input or process termination
wait