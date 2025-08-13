# Fantasy Football Bid Tool

A comprehensive web application for viewing and bidding on free agents in ESPN Fantasy Football leagues. This tool combines a SvelteKit frontend with ESPN Fantasy Football API integration to provide real-time player data, projections, and bidding functionality.

## Quick Start (For Novices)

### Prerequisites

Before you begin, you need to install the following software on your computer:

1. **Node.js** (version 18 or higher)
   - **Windows/Mac**: Download from https://nodejs.org (choose LTS version)
   - **Linux**: See terminal installation instructions below

2. **Python** (version 3.8 or higher)
   - **Windows**: Download from https://python.org (**IMPORTANT**: Check "Add Python to PATH")
   - **Mac**: Download from https://python.org or use Homebrew: `brew install python3`
   - **Linux**: See terminal installation instructions below

3. **Git** (optional but recommended)
   - Download from: https://git-scm.com

#### Linux Terminal Installation

**Ubuntu/Debian:**
```bash
# Update package list
sudo apt update

# Install Node.js (via NodeSource repository for latest LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3 and pip
sudo apt install python3 python3-pip

# Verify installations
node --version
python3 --version
```

### Step 1: Get Your ESPN Cookies

To access your private ESPN Fantasy Football league data, you need two cookies:

1. **Open your web browser** and go to [ESPN Fantasy Football](https://fantasy.espn.com)
2. **Sign in** to your ESPN account
3. **Navigate** to your fantasy football league
4. **Open Developer Tools**:
   - **Chrome/Edge**: Press `F12` or right-click → "Inspect"
   - **Firefox**: Press `F12` or right-click → "Inspect Element"
5. **Go to the Application/Storage tab**:
   - Chrome/Edge: Click "Application" tab
   - Firefox: Click "Storage" tab
6. **Find Cookies**:
   - Expand "Cookies" in the left sidebar
   - Click on "https://fantasy.espn.com"
7. **Copy these two values**:
   - Find `SWID` and copy its value (should look like `{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}`)
   - Find `ESPN_S2` and copy its value (long string of characters)

### Step 2: Set Up Environment Variables

1. **Create a file** called `.env` in the project root folder
2. **Add your ESPN cookies** to the file:
   ```
   SWID=your_swid_value_here
   ESPN_S2=your_espn_s2_value_here
   ```
3. **Save the file**

**Example .env file:**
```
SWID={12345678-1234-1234-1234-123456789012}
ESPN_S2=AEBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Start the Application

#### Option A: Use the Startup Script (Recommended)

**Windows:**
1. Double-click `start.bat` in the project folder
2. The script will automatically install dependencies and start both servers

**Mac/Linux:**
1. Open Terminal
2. Navigate to the project folder: `cd path/to/bid-tool`
3. Run: `./start.sh`

#### Option B: Manual Start

1. **Open two command prompt/terminal windows**

2. **In the first window**, start the ESPN API server:
   ```sh
   cd espn-api-0.45.1
   pip install fastapi uvicorn espn-api requests
   python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **In the second window**, start the SvelteKit development server:
   ```sh
   npm install
   npm run dev
   ```

### Step 4: Access the Application

Once both servers are running:

- **Main Application**: Open http://localhost:5173 in your web browser
- **API Server**: Running at http://localhost:8000 (you don't need to access this directly)

## What You'll See

The application has three main sections:

1. **Home** (`/`) - League overview with team information
2. **Free Agents** (`/free-agents`) - Browse and bid on available players
3. **Bids** (`/bids`) - View and manage your bids

## Troubleshooting

### Common Issues

**"Python is not recognized"**
- Make sure Python is installed and added to your PATH
- Restart your command prompt/terminal after installing Python

**"Node is not recognized"**
- Make sure Node.js is installed
- Restart your command prompt/terminal after installing Node.js

**"Permission denied" on Mac/Linux**
- Run: `chmod +x start.sh` to make the script executable

**ESPN API errors**
- Double-check your SWID and ESPN_S2 values in the `.env` file
- Make sure you're logged into ESPN in your browser
- Try refreshing your ESPN cookies (they expire periodically)

**Port already in use**
- Make sure no other applications are using ports 5173 or 8000
- Stop any running development servers and try again

### Getting Help

If you encounter issues:

1. Check that all prerequisites are installed correctly
2. Verify your `.env` file has the correct ESPN cookie values
3. Try restarting both servers
4. Check the console/terminal output for error messages

## For Developers

### Development Commands

- `npm run dev` - Start SvelteKit development server
- `npm run build` - Build production version
- `npm run preview` - Preview production build
- `npm run check` - Type check TypeScript files

### Project Structure

- `src/lib/` - Reusable Svelte components
- `src/routes/` - SvelteKit pages and API routes
- `espn-api-0.45.1/` - Python ESPN API server
- See `CLAUDE.md` for detailed architecture documentation

### API Endpoints

The Python server provides these endpoints:
- `GET /teams` - League team data
- `GET /free-agents` - Available players
- `GET /free-agents-{position}` - Position-specific players
- `GET /playerinfo` - Detailed player information
- `GET /player-stats/{id}` - Historical player statistics

### Environment Variables

Required in `.env` file:
- `SWID` - ESPN session cookie for user identification
- `ESPN_S2` - ESPN session cookie for authentication
