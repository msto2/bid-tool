import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Load initial mock data
let freeAgentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mock-data', 'free-agents.json'), 'utf-8')
);

// Track rostered players (players who have been claimed)
let rosteredPlayers = new Set();

// Teams data
const teamsData = [
  { id: 1, team_name: "Test Team 1", wins: 8, losses: 4, points_for: 1245.6 },
  { id: 2, team_name: "Test Team 2", wins: 7, losses: 5, points_for: 1198.3 },
  { id: 3, team_name: "Test Team 3", wins: 6, losses: 6, points_for: 1156.2 },
  { id: 4, team_name: "Test Team 4", wins: 5, losses: 7, points_for: 1089.7 }
];

// Helper to filter out rostered players
function getAvailablePlayers(position = null) {
  if (position) {
    return (freeAgentsData[position] || []).filter(
      player => !rosteredPlayers.has(player.id)
    );
  }
  
  // Return all available players
  const allPlayers = [];
  Object.keys(freeAgentsData).forEach(pos => {
    allPlayers.push(
      ...freeAgentsData[pos].filter(player => !rosteredPlayers.has(player.id))
    );
  });
  return allPlayers;
}

// API endpoints
app.get('/teams', (req, res) => {
  res.json(teamsData);
});

app.get('/free-agents', (req, res) => {
  res.json(getAvailablePlayers());
});

// Position-specific endpoints
const positions = ['qb', 'rb', 'wr', 'te', 'dt', 'de', 'lb', 'cb', 's', 'k'];
positions.forEach(position => {
  app.get(`/free-agents-${position}`, (req, res) => {
    res.json(getAvailablePlayers(position));
  });
});

app.get('/playerinfo', (req, res) => {
  const playerId = parseInt(req.query.playerId);
  
  // Find player across all positions
  for (const position of Object.keys(freeAgentsData)) {
    const player = freeAgentsData[position].find(p => p.id === playerId);
    if (player) {
      return res.json(player);
    }
  }
  
  res.status(404).json({ error: 'Player not found' });
});

// Admin endpoints for testing

// Claim a player (remove from free agency)
app.post('/admin/claim-player/:playerId', (req, res) => {
  const playerId = parseInt(req.params.playerId);
  
  // Find the player
  let playerFound = null;
  for (const position of Object.keys(freeAgentsData)) {
    const player = freeAgentsData[position].find(p => p.id === playerId);
    if (player) {
      playerFound = player;
      break;
    }
  }
  
  if (!playerFound) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  if (rosteredPlayers.has(playerId)) {
    return res.status(400).json({ error: 'Player already rostered' });
  }
  
  rosteredPlayers.add(playerId);
  
  res.json({
    success: true,
    message: `${playerFound.name} has been claimed and removed from free agency`,
    player: playerFound,
    totalRostered: rosteredPlayers.size
  });
});

// Release a player (add back to free agency)
app.post('/admin/release-player/:playerId', (req, res) => {
  const playerId = parseInt(req.params.playerId);
  
  if (!rosteredPlayers.has(playerId)) {
    return res.status(400).json({ error: 'Player not on a roster' });
  }
  
  rosteredPlayers.delete(playerId);
  
  // Find the player to return their name
  let playerFound = null;
  for (const position of Object.keys(freeAgentsData)) {
    const player = freeAgentsData[position].find(p => p.id === playerId);
    if (player) {
      playerFound = player;
      break;
    }
  }
  
  res.json({
    success: true,
    message: `Player ${playerId} has been released back to free agency`,
    player: playerFound,
    totalRostered: rosteredPlayers.size
  });
});

// Batch claim players (simulate waiver processing)
app.post('/admin/process-waivers', (req, res) => {
  const { playerIds } = req.body;
  
  if (!Array.isArray(playerIds)) {
    return res.status(400).json({ error: 'playerIds must be an array' });
  }
  
  const claimed = [];
  const alreadyClaimed = [];
  
  playerIds.forEach(playerId => {
    if (rosteredPlayers.has(playerId)) {
      alreadyClaimed.push(playerId);
    } else {
      rosteredPlayers.add(playerId);
      claimed.push(playerId);
    }
  });
  
  res.json({
    success: true,
    message: `Processed ${playerIds.length} waiver claims`,
    claimed,
    alreadyClaimed,
    totalRostered: rosteredPlayers.size
  });
});

// Reset all players to free agency
app.post('/admin/reset', (req, res) => {
  const previousCount = rosteredPlayers.size;
  rosteredPlayers.clear();
  
  res.json({
    success: true,
    message: 'All players have been released back to free agency',
    playersReleased: previousCount
  });
});

// Get current roster status
app.get('/admin/status', (req, res) => {
  const status = {
    totalPlayers: Object.values(freeAgentsData).flat().length,
    rosteredCount: rosteredPlayers.size,
    availableCount: Object.values(freeAgentsData).flat().length - rosteredPlayers.size,
    rosteredPlayerIds: Array.from(rosteredPlayers),
    positions: {}
  };
  
  // Count by position
  positions.forEach(position => {
    const total = freeAgentsData[position]?.length || 0;
    const available = getAvailablePlayers(position).length;
    status.positions[position] = {
      total,
      available,
      rostered: total - available
    };
  });
  
  res.json(status);
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  /teams');
  console.log('  GET  /free-agents');
  console.log('  GET  /free-agents-{position}');
  console.log('  GET  /playerinfo?playerId={id}');
  console.log('\nAdmin endpoints for testing:');
  console.log('  POST /admin/claim-player/:playerId');
  console.log('  POST /admin/release-player/:playerId');
  console.log('  POST /admin/process-waivers');
  console.log('  POST /admin/reset');
  console.log('  GET  /admin/status');
});