#!/bin/bash

echo "=== Network Fix Script for bids.triplepoint.me ==="
echo

# Stop existing servers
echo "1. Stopping existing servers..."
pkill -f "uvicorn api:app" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Check and open firewall ports
echo "2. Checking firewall configuration..."

# For Ubuntu/Debian systems
if command -v ufw &> /dev/null; then
    echo "   Opening ports 5173 and 8000 in UFW..."
    sudo ufw allow 5173/tcp || echo "   UFW rule may already exist"
    sudo ufw allow 8000/tcp || echo "   UFW rule may already exist"
    sudo ufw status
fi

# For RHEL/CentOS systems
if command -v firewall-cmd &> /dev/null; then
    echo "   Opening ports 5173 and 8000 in firewalld..."
    sudo firewall-cmd --add-port=5173/tcp --permanent || echo "   Port may already be open"
    sudo firewall-cmd --add-port=8000/tcp --permanent || echo "   Port may already be open"
    sudo firewall-cmd --reload
    sudo firewall-cmd --list-ports
fi

echo

echo "3. Starting FastAPI server with explicit network binding..."
cd espn-api-0.45.1
python3 -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!
sleep 3

echo "4. Testing FastAPI network access..."
# Test local access
if curl -s http://127.0.0.1:8000/teams > /dev/null 2>&1; then
    echo "   ✓ FastAPI responding on localhost"
else
    echo "   ✗ FastAPI NOT responding on localhost"
fi

# Test external access (if possible)
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "   Local IP detected: $LOCAL_IP"

if curl -s -m 3 "http://$LOCAL_IP:8000/teams" > /dev/null 2>&1; then
    echo "   ✓ FastAPI responding on local network ($LOCAL_IP)"
else
    echo "   ✗ FastAPI NOT responding on local network ($LOCAL_IP)"
fi

echo

echo "5. Starting SvelteKit with explicit network binding..."
cd ..

# Export environment variable to ensure Vite binds to all interfaces
export VITE_HOST=0.0.0.0
export VITE_PORT=5173

npm run dev &
SVELTE_PID=$!

sleep 5

echo "6. Testing SvelteKit network access..."
# Test local access
if curl -s http://127.0.0.1:5173 > /dev/null 2>&1; then
    echo "   ✓ SvelteKit responding on localhost"
else
    echo "   ✗ SvelteKit NOT responding on localhost"
fi

# Test external access
if curl -s -m 3 "http://$LOCAL_IP:5173" > /dev/null 2>&1; then
    echo "   ✓ SvelteKit responding on local network ($LOCAL_IP)"
else
    echo "   ✗ SvelteKit NOT responding on local network ($LOCAL_IP)"
fi

echo

echo "7. Network diagnostic summary..."
echo "   Server processes:"
ps aux | grep -E "(uvicorn|vite|node)" | grep -v grep

echo
echo "   Listening ports:"
netstat -tlnp | grep -E ":(5173|8000)" || echo "   No processes listening on target ports"

echo

echo "=== Next Steps ==="
echo "1. If servers are running but not externally accessible:"
echo "   - Check your router's port forwarding for ports 5173 and 8000"
echo "   - Verify your domain DNS points to the correct IP: $LOCAL_IP"
echo "   - Check cloud provider security groups (if applicable)"
echo
echo "2. Test external access:"
echo "   - FastAPI: curl http://bids.triplepoint.me:8000/teams"
echo "   - SvelteKit: curl http://bids.triplepoint.me:5173"
echo
echo "3. If still issues, check server logs above for errors"

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

echo
echo "Servers running. Press Ctrl+C to stop..."
wait