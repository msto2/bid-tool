#!/bin/bash

echo "=== Fantasy Football Bid Tool - Network Debug ==="
echo

echo "1. Checking if FastAPI server is running..."
if curl -s http://localhost:8000/teams > /dev/null 2>&1; then
    echo "✓ FastAPI server is responding on localhost:8000"
else
    echo "✗ FastAPI server is NOT responding on localhost:8000"
fi

echo

echo "2. Checking network interfaces..."
ip addr show | grep -E "inet.*brd" | head -3

echo

echo "3. Checking if port 8000 is listening..."
netstat -tlnp | grep :8000 || echo "Port 8000 is not listening"

echo

echo "4. Checking if port 5173 is listening..."
netstat -tlnp | grep :5173 || echo "Port 5173 is not listening"

echo

echo "5. Testing external access to FastAPI..."
if command -v curl &> /dev/null; then
    echo "Testing http://bids.triplepoint.me:8000/teams"
    curl -s -m 5 "http://bids.triplepoint.me:8000/teams" | head -100 || echo "Failed to connect to external FastAPI"
else
    echo "curl not available"
fi

echo

echo "6. Testing external access to SvelteKit..."
if command -v curl &> /dev/null; then
    echo "Testing http://bids.triplepoint.me:5173"
    curl -s -m 5 "http://bids.triplepoint.me:5173" | head -100 || echo "Failed to connect to external SvelteKit"
else
    echo "curl not available"
fi

echo

echo "=== Debug complete ==="