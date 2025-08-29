#!/bin/bash

echo "Starting Fantasy Football Bid Tool..."
echo

# Kill any existing processes and clean cache
echo "Cleaning up any existing processes..."
pkill -f "uvicorn api:app" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Clean caches
echo "Cleaning caches..."
rm -rf .svelte-kit 2>/dev/null || true
rm -rf node_modules/.vite 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

echo "Regenerating SvelteKit files..."
npm run prepare 2>/dev/null || npx svelte-kit sync 2>/dev/null || echo "SvelteKit sync will happen on dev start"

echo "Cleanup complete."
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
else
# Check if authentication dependencies are installed
if ! npm ls @getbrevo/brevo &> /dev/null; then
echo "Installing authentication dependencies..."
npm install
if [ $? -ne 0 ]; then
echo "ERROR: Failed to install authentication dependencies"
exit 1
fi
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

# Wait and check if API server is running
echo "Waiting for API server to start..."
sleep 3

# Check if FastAPI server is responding
MAX_RETRIES=10
RETRY_COUNT=0
API_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
if curl -s http://localhost:8000/teams > /dev/null 2>&1; then
API_READY=true
echo "✓ FastAPI server is running and responding on port 8000"
break
else
RETRY_COUNT=$((RETRY_COUNT + 1))
echo "Waiting for FastAPI server... (attempt $RETRY_COUNT/$MAX_RETRIES)"
sleep 2
fi
done

if [ "$API_READY" = false ]; then
echo "ERROR: FastAPI server failed to start or is not responding after $MAX_RETRIES attempts"
echo "Please check the API server logs above for errors"
kill $API_PID 2>/dev/null
exit 1
fi

echo "Starting SvelteKit development server..."
cd ..

# Give the API server a bit more time to fully initialize
sleep 2

# Test one more time before starting SvelteKit to ensure API is ready
if curl -s http://127.0.0.1:8000/teams > /dev/null 2>&1; then
echo "✓ API server confirmed ready, starting SvelteKit..."
else
echo "⚠ API server may still be initializing..."
fi

npm run dev &
SVELTE_PID=$!

echo
echo "✓ Both servers are running successfully!"
echo "- ESPN API Server: http://localhost:8000"
echo "- SvelteKit App: http://localhost:5173"
echo
echo "API Health Check: curl http://localhost:8000/teams"
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