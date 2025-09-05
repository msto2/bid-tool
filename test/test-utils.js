/**
 * Utility scripts for testing player movement and bid preservation
 * Run these from the command line to simulate various scenarios
 */

import fetch from 'node-fetch';
import readline from 'readline';

const MOCK_API_URL = 'http://localhost:8000';
const APP_URL = 'http://localhost:5173';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Player data for quick reference
const players = {
  'fields': { id: 1001, name: 'Justin Fields', position: 'QB' },
  'jones': { id: 1002, name: 'Mac Jones', position: 'QB' },
  'pierce': { id: 2001, name: 'Dameon Pierce', position: 'RB' },
  'herbert': { id: 2002, name: 'Khalil Herbert', position: 'RB' },
  'mitchell': { id: 2003, name: 'Elijah Mitchell', position: 'RB' },
  'pickens': { id: 3001, name: 'George Pickens', position: 'WR' },
  'dotson': { id: 3002, name: 'Jahan Dotson', position: 'WR' },
  'moore': { id: 3003, name: 'Skyy Moore', position: 'WR' },
  'freiermuth': { id: 4001, name: 'Pat Freiermuth', position: 'TE' },
  'higbee': { id: 4002, name: 'Tyler Higbee', position: 'TE' }
};

// Helper to get player by name or ID
function findPlayer(input) {
  // Check if it's a number (ID)
  if (!isNaN(input)) {
    const id = parseInt(input);
    return Object.values(players).find(p => p.id === id);
  }
  
  // Check by partial name match
  const searchTerm = input.toLowerCase();
  return Object.entries(players).find(([key, player]) => 
    key.includes(searchTerm) || 
    player.name.toLowerCase().includes(searchTerm)
  )?.[1];
}

// Display functions
function displayStatus(status) {
  console.log('\n📊 Current Status:');
  console.log('─────────────────────────────────');
  console.log(`Total Players: ${status.totalPlayers}`);
  console.log(`Rostered: ${status.rosteredCount}`);
  console.log(`Available: ${status.availableCount}`);
  console.log('\nBy Position:');
  Object.entries(status.positions).forEach(([pos, data]) => {
    console.log(`  ${pos.toUpperCase()}: ${data.available}/${data.total} available`);
  });
  
  if (status.rosteredPlayerIds.length > 0) {
    console.log('\nRostered Players:');
    status.rosteredPlayerIds.forEach(id => {
      const player = Object.values(players).find(p => p.id === id);
      if (player) {
        console.log(`  - ${player.name} (${player.position})`);
      }
    });
  }
}

async function displayBids() {
  try {
    const response = await fetch(`${APP_URL}/api/bids`);
    const bids = await response.json();
    
    console.log('\n🎯 Current Bids:');
    console.log('─────────────────────────────────');
    
    if (bids.length === 0) {
      console.log('No bids currently in the system');
      return;
    }
    
    bids.forEach(bid => {
      const status = bid.status || 'active';
      const statusEmoji = status === 'historical' ? '📜' : '✅';
      console.log(`${statusEmoji} ${bid.playerName} - $${bid.contract.salary}M/${bid.contract.years}yr by ${bid.bidder.name}`);
    });
    
    console.log(`\nTotal: ${bids.length} bids`);
  } catch (error) {
    console.log('❌ Could not fetch bids. Is the app running?');
  }
}

// Action functions
async function claimPlayer(playerInput) {
  const player = findPlayer(playerInput);
  if (!player) {
    console.log('❌ Player not found');
    return;
  }
  
  try {
    const response = await fetch(`${MOCK_API_URL}/admin/claim-player/${player.id}`, {
      method: 'POST'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${player.name} has been claimed and removed from free agency`);
    } else {
      console.log(`❌ ${result.error}`);
    }
  } catch (error) {
    console.log('❌ Error claiming player:', error.message);
  }
}

async function releasePlayer(playerInput) {
  const player = findPlayer(playerInput);
  if (!player) {
    console.log('❌ Player not found');
    return;
  }
  
  try {
    const response = await fetch(`${MOCK_API_URL}/admin/release-player/${player.id}`, {
      method: 'POST'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${player.name} has been released back to free agency`);
    } else {
      console.log(`❌ ${result.error}`);
    }
  } catch (error) {
    console.log('❌ Error releasing player:', error.message);
  }
}

async function processWaivers() {
  console.log('\nEnter player names/IDs to claim (comma-separated):');
  const input = await new Promise(resolve => rl.question('> ', resolve));
  
  const playerInputs = input.split(',').map(s => s.trim());
  const playerIds = [];
  
  for (const input of playerInputs) {
    const player = findPlayer(input);
    if (player) {
      playerIds.push(player.id);
      console.log(`  Adding ${player.name} to waiver claims`);
    } else {
      console.log(`  ⚠️  Could not find player: ${input}`);
    }
  }
  
  if (playerIds.length === 0) {
    console.log('No valid players to process');
    return;
  }
  
  try {
    const response = await fetch(`${MOCK_API_URL}/admin/process-waivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds })
    });
    const result = await response.json();
    
    console.log(`\n✅ Processed ${result.claimed.length} waiver claims`);
    if (result.alreadyClaimed.length > 0) {
      console.log(`⚠️  ${result.alreadyClaimed.length} players were already claimed`);
    }
  } catch (error) {
    console.log('❌ Error processing waivers:', error.message);
  }
}

async function resetAll() {
  try {
    const response = await fetch(`${MOCK_API_URL}/admin/reset`, {
      method: 'POST'
    });
    const result = await response.json();
    
    console.log(`✅ Reset complete. ${result.playersReleased} players released back to free agency`);
  } catch (error) {
    console.log('❌ Error resetting:', error.message);
  }
}

async function getStatus() {
  try {
    const response = await fetch(`${MOCK_API_URL}/admin/status`);
    const status = await response.json();
    return status;
  } catch (error) {
    console.log('❌ Error getting status:', error.message);
    return null;
  }
}

// Interactive menu
async function showMenu() {
  console.log('\n🏈 Fantasy Football Test Utilities');
  console.log('════════════════════════════════════');
  console.log('1. Show Status (players & bids)');
  console.log('2. Claim Player (remove from FA)');
  console.log('3. Release Player (add to FA)');
  console.log('4. Process Waivers (batch claim)');
  console.log('5. Reset All (clear rosters)');
  console.log('6. List Players');
  console.log('7. Run Test Scenarios');
  console.log('0. Exit');
  console.log('────────────────────────────────────');
  
  const choice = await new Promise(resolve => rl.question('Choose option: ', resolve));
  
  switch (choice) {
    case '1':
      const status = await getStatus();
      if (status) displayStatus(status);
      await displayBids();
      break;
      
    case '2':
      console.log('Enter player name or ID (e.g., "fields" or "1001"):');
      const claimInput = await new Promise(resolve => rl.question('> ', resolve));
      await claimPlayer(claimInput);
      break;
      
    case '3':
      console.log('Enter player name or ID to release:');
      const releaseInput = await new Promise(resolve => rl.question('> ', resolve));
      await releasePlayer(releaseInput);
      break;
      
    case '4':
      await processWaivers();
      break;
      
    case '5':
      await resetAll();
      break;
      
    case '6':
      console.log('\n📋 Available Players:');
      console.log('─────────────────────────────────');
      Object.entries(players).forEach(([key, player]) => {
        console.log(`${player.id}: ${player.name} (${player.position}) - alias: "${key}"`);
      });
      break;
      
    case '7':
      console.log('\nLaunching test scenarios...');
      const { runAllTests } = await import('./test-scenarios.js');
      await runAllTests();
      break;
      
    case '0':
      console.log('Goodbye! 👋');
      rl.close();
      return false;
      
    default:
      console.log('Invalid option');
  }
  
  return true;
}

// Main loop
async function main() {
  console.clear();
  console.log('🚀 Starting Fantasy Football Test Utilities...');
  console.log('Make sure both servers are running:');
  console.log('  1. npm run dev (main app)');
  console.log('  2. node test/mock-server.js (mock API)');
  
  while (await showMenu()) {
    // Continue showing menu
  }
}

// Run if called directly
if (process.argv[1].endsWith('test-utils.js')) {
  main().catch(console.error);
}

export {
  findPlayer,
  claimPlayer,
  releasePlayer,
  processWaivers,
  resetAll,
  getStatus,
  displayStatus,
  displayBids
};