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
2. **Add your ESPN cookies, API keys, and team contacts** to the file:
   ```
   SWID=your_swid_value_here
   ESPN_S2=your_espn_s2_value_here
   BREVO_API_KEY=your_brevo_api_key_here
   TEXTBEE_API_KEY=your_textbee_api_key_here
   TEXTBEE_DEVICE_ID=your_textbee_device_id_here
   CONTACTS={"1":{"email":"team1@example.com","phone":"1234567890"},"2":{"email":"team2@example.com","phone":"0987654321"}}
   ```
3. **Save the file**

**Example .env file:**
```
SWID={12345678-1234-1234-1234-123456789012}
ESPN_S2=AEBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxx
TEXTBEE_API_KEY=your-textbee-api-key-here
TEXTBEE_DEVICE_ID=your-textbee-device-id-here
CONTACTS={"1":{"email":"team1@example.com","phone":"1234567890"},"2":{"email":"team2@example.com","phone":"0987654321"}}
```

#### Setting Up Team Contacts

The `CONTACTS` environment variable contains team contact information for email and SMS verification:

- **Format**: JSON string mapping team IDs to contact objects
- **Structure**: `{"teamId": {"email": "address", "phone": "number"}}`
- **Team IDs**: Match the team IDs from your FastAPI backend
- **Phone Numbers**: Use full numbers without special formatting (e.g., "1234567890")
- **Email Addresses**: Valid email addresses for verification codes

#### Getting Your Brevo API Key (For Email Authentication)

The application uses Brevo (formerly Sendinblue) for sending email verification codes:

1. **Create a Brevo account** at https://www.brevo.com
2. **Go to SMTP & API settings** in your account dashboard
3. **Create a new API key** with transactional email permissions
4. **Copy the API key** (starts with `xkeysib-`) and add it to your `.env` file
5. **Verify a sender email** in your Brevo account for sending emails

#### Getting Your TextBee Credentials (For SMS Authentication)

The application uses TextBee.dev for sending SMS verification codes:

1. **Create a TextBee account** at https://textbee.dev
2. **Set up your device** and get your device ID from the dashboard
3. **Generate an API key** in your account settings
4. **Copy both values** and add them to your `.env` file:
   - `TEXTBEE_API_KEY`: Your TextBee API key
   - `TEXTBEE_DEVICE_ID`: Your TextBee device ID

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

1. **Home** (`/`) - League overview with team selection and email/SMS authentication
2. **Free Agents** (`/free-agents`) - Browse and bid on available players
3. **Bids** (`/bids`) - View and manage your bids

### Authentication System

The application features a comprehensive, production-ready authentication system:

- **Team Selection**: Choose your fantasy team from the league roster
- **Email Verification**: Receive verification codes via Brevo email service
- **SMS Verification**: Receive verification codes via TextBee.dev SMS service
- **Session Management**: Persistent login sessions with automatic expiry
- **Security**: No verification codes displayed on screen - users must check email/SMS
- **Environment-Aware**: Development mode includes logging for testing, production mode is secure

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

**Authentication Issues**
- **Email not received**: Check your Brevo account settings and verify sender email
- **SMS not received**: Verify your TextBee device is connected and API credentials are correct
- **"Missing contact information"**: Ensure all team IDs have corresponding entries in the CONTACTS environment variable
- **Invalid verification codes**: Codes expire after 10 minutes, request a new one if needed

**Port already in use**
- Make sure no other applications are using ports 5173 or 8000
- Stop any running development servers and try again

**"This host is not allowed" when hosting on web**
- Add your domain to `allowedHosts` in `vite.config.ts`
- Example: `allowedHosts: ['your-domain.com']`
- Restart the development server after making changes

### Getting Help

If you encounter issues:

1. Check that all prerequisites are installed correctly
2. Verify your `.env` file has the correct ESPN cookie values
3. Try restarting both servers
4. Check the console/terminal output for error messages

## For Developers

### Development Commands

- `npm run dev` - Start SvelteKit development server (accessible on network)
- `npm run build` - Build production version
- `npm run preview` - Preview production build
- `npm run check` - Type check TypeScript files

### Development vs Production

**Development Mode** (`npm run dev`):
- Verification codes logged to console for testing
- API responses include verification codes for development tools
- Enhanced error logging and debugging information

**Production Mode** (`npm run build` + `npm run preview`):
- No verification codes logged or displayed anywhere
- Secure API responses without sensitive information
- Production-optimized builds and error handling

### Server Configuration

The Vite development server is configured with:
- **Host**: `0.0.0.0` (accepts connections from any IP)
- **Port**: `5173` (default SvelteKit port)
- **Network Access**: App accessible from other devices on your local network
- **Allowed Hosts**: Configured for `bids.triplepoint.me` domain

### Web Hosting

If hosting on a custom domain, update `vite.config.ts`:
```typescript
server: {
  host: true, 
  port: 5173,
  allowedHosts: ['your-domain.com']
}
```

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
- `BREVO_API_KEY` - Brevo API key for email verification (starts with `xkeysib-`)
- `TEXTBEE_API_KEY` - TextBee API key for SMS verification
- `TEXTBEE_DEVICE_ID` - TextBee device ID for SMS sending
- `CONTACTS` - JSON string with team contact information for authentication
