# Fantasy Football Bid Tool - Testing Suite

This directory contains comprehensive testing tools for the Fantasy Football Bid Tool, focusing on bid preservation and player movement scenarios.

## 🚀 Quick Start

### 1. Install Test Dependencies
```bash
cd test
npm install
```

### 2. Start the Servers
You need both servers running:

**Terminal 1 - Main Application:**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - Mock API Server:**
```bash
cd test
npm run mock-server
# Runs on http://localhost:8000
```

### 3. Run Tests

**Interactive Test Utility:**
```bash
npm run test-utils
```

**Automated Test Scenarios:**
```bash
npm run test
```

**Vitest Integration Tests:**
```bash
npm run test:integration
```

## 📁 Test Files

### `mock-data/free-agents.json`
Contains realistic mock player data across all positions (QB, RB, WR, TE, K, defensive positions).

### `mock-server.js`
Express server that simulates the external API with additional admin endpoints for testing:
- Standard endpoints (`/teams`, `/free-agents`, `/playerinfo`)
- Admin endpoints for testing player movement
- Tracks rostered vs available players in memory

### `test-scenarios.js`
Automated test scenarios covering:
1. **Basic Bid Creation** - Verify bids are created and persisted
2. **Player Claimed During Bid Period** - Ensure bids survive when players are claimed
3. **Batch Waiver Processing** - Test multiple player claims at once
4. **Player Release and Re-bidding** - Test the full lifecycle of player movement

### `test-utils.js`
Interactive command-line utility for manual testing:
- View current system status
- Claim/release individual players
- Process batch waivers
- Monitor bid preservation
- Run automated test scenarios

### `bid-preservation.test.js`
Vitest integration tests for comprehensive testing of bid preservation logic.

## 🎮 Testing Workflows

### Test Bid Preservation

1. **Start both servers**
2. **Create some bids** (via the UI or test utils)
3. **Claim players** using the test utility:
   ```bash
   npm run test-utils
   # Choose option 2 to claim a player
   ```
4. **Verify bids persist** in the UI or via test utils

### Simulate Waiver Processing

1. **Create multiple bids** for different players
2. **Run batch waiver processing:**
   ```bash
   npm run test-utils
   # Choose option 4
   # Enter player names: fields, pierce, pickens
   ```
3. **Check that all bids remain** in `bids.json`

### Test Player Release Cycle

1. **Create a bid** for a player
2. **Claim the player** (removes from free agency)
3. **Attempt new bid** (should fail - player unavailable)
4. **Release the player** back to free agency
5. **Create new bid** (should succeed)
6. **Verify both bids exist** in history

## 🔍 Admin API Endpoints

The mock server provides these admin endpoints for testing:

### `POST /admin/claim-player/:playerId`
Removes a player from free agency (simulates waiver claim).

### `POST /admin/release-player/:playerId`
Returns a player to free agency (simulates player drop).

### `POST /admin/process-waivers`
Batch claim multiple players at once.
```json
{
  "playerIds": [1001, 2001, 3001]
}
```

### `POST /admin/reset`
Reset all players back to free agency.

### `GET /admin/status`
Get current roster/free agency status with detailed breakdown.

## ✅ Key Test Cases

### Bid Preservation
- ✅ Bids remain in `bids.json` when players are claimed
- ✅ No automatic deletion of historical bids
- ✅ New bids blocked for unavailable players
- ✅ Existing bids preserved regardless of player status

### Status Tracking
- ✅ Bids get `status: 'active'` when created
- ✅ Optional marking as `historical` via manager endpoint
- ✅ Complete bid history maintained

### Edge Cases
- ✅ Player claimed then released (multiple bid cycles)
- ✅ Batch waiver processing with partial success
- ✅ Concurrent bid creation and player claims
- ✅ System recovery after server restart

## 🐛 Troubleshooting

### Servers Not Starting
- Ensure ports 5173 and 8000 are free
- Check for proper npm dependencies installed

### Tests Failing
- Verify both servers are running
- Clear `bids.json` if testing fresh scenarios
- Check console output from both servers

### Mock Data Issues
- Edit `mock-data/free-agents.json` to add more players
- Restart mock server after data changes

## 📊 Expected Behavior

After the bid preservation changes:

1. **GET /api/bids** returns ALL bids without filtering
2. **POST /api/bids** validates player availability but doesn't affect existing bids
3. **No automatic cleanup** runs during normal operations
4. **Manager can optionally** mark bids as historical
5. **Complete audit trail** maintained in `bids.json`

## 🎯 Testing Goals

The test suite verifies:
- ✅ Bid records are never automatically deleted
- ✅ Historical tracking works correctly
- ✅ Player movement doesn't affect existing bids
- ✅ New bids respect player availability
- ✅ System maintains data integrity across all operations