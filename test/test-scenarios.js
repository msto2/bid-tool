/**
 * Test scenarios for the Fantasy Football Bid Tool
 * Run these tests to simulate various bid lifecycle scenarios
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173'; // SvelteKit dev server
const MOCK_API_URL = 'http://localhost:8000'; // Mock API server

// Test data
const testPlayers = {
  qb: { id: 1001, name: 'Justin Fields' },
  rb: { id: 2001, name: 'Dameon Pierce' },
  wr: { id: 3001, name: 'George Pickens' }
};

const testBidder = {
  teamId: 1,
  name: 'Test Team 1'
};

// Helper functions
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkPlayerAvailability(playerId) {
  const response = await fetch(`${MOCK_API_URL}/playerinfo?playerId=${playerId}`);
  if (response.ok) {
    const freeAgentsResponse = await fetch(`${MOCK_API_URL}/free-agents`);
    const freeAgents = await freeAgentsResponse.json();
    return freeAgents.some(player => player.id === playerId);
  }
  return false;
}

async function createBid(playerId, playerName, bidAmount, years) {
  const response = await fetch(`${BASE_URL}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId,
      playerName,
      bidder: testBidder,
      contract: {
        salary: bidAmount,
        years: years
      }
    })
  });
  
  return response.json();
}

async function getBids() {
  const response = await fetch(`${BASE_URL}/api/bids`);
  return response.json();
}

async function claimPlayer(playerId) {
  const response = await fetch(`${MOCK_API_URL}/admin/claim-player/${playerId}`, {
    method: 'POST'
  });
  return response.json();
}

async function releasePlayer(playerId) {
  const response = await fetch(`${MOCK_API_URL}/admin/release-player/${playerId}`, {
    method: 'POST'
  });
  return response.json();
}

async function resetAllPlayers() {
  const response = await fetch(`${MOCK_API_URL}/admin/reset`, {
    method: 'POST'
  });
  return response.json();
}

// Test Scenarios

/**
 * Scenario 1: Basic bid creation and persistence
 */
async function testScenario1() {
  console.log('\n=== Scenario 1: Basic Bid Creation ===');
  
  // Reset to clean state
  await resetAllPlayers();
  
  // Create a bid
  console.log('1. Creating bid for', testPlayers.qb.name);
  const bid = await createBid(testPlayers.qb.id, testPlayers.qb.name, 10, 2);
  console.log('   Bid created:', bid.success ? 'Success' : 'Failed');
  
  // Verify bid exists
  console.log('2. Verifying bid exists in system');
  const bids = await getBids();
  const bidExists = bids.some(b => b.playerId === testPlayers.qb.id);
  console.log('   Bid found:', bidExists ? 'Yes' : 'No');
  
  return bidExists;
}

/**
 * Scenario 2: Player claimed during bid period
 */
async function testScenario2() {
  console.log('\n=== Scenario 2: Player Claimed During Bid Period ===');
  
  // Reset to clean state
  await resetAllPlayers();
  
  // Create multiple bids
  console.log('1. Creating bids for multiple players');
  await createBid(testPlayers.rb.id, testPlayers.rb.name, 15, 1);
  await createBid(testPlayers.wr.id, testPlayers.wr.name, 8, 2);
  console.log('   Bids created');
  
  // Check initial bid count
  let bids = await getBids();
  console.log('2. Initial bid count:', bids.length);
  
  // Simulate player being claimed (waiver processed)
  console.log('3. Simulating waiver claim for', testPlayers.rb.name);
  await claimPlayer(testPlayers.rb.id);
  
  // Check if player is still available
  const isAvailable = await checkPlayerAvailability(testPlayers.rb.id);
  console.log('   Player still in free agency:', isAvailable ? 'Yes' : 'No');
  
  // Verify bids are preserved
  console.log('4. Checking if bids are preserved');
  bids = await getBids();
  const bidCount = bids.length;
  const rbBidExists = bids.some(b => b.playerId === testPlayers.rb.id);
  console.log('   Total bids:', bidCount);
  console.log('   RB bid still exists:', rbBidExists ? 'Yes (Good!)' : 'No (Bad!)');
  
  return rbBidExists;
}

/**
 * Scenario 3: Batch waiver processing
 */
async function testScenario3() {
  console.log('\n=== Scenario 3: Batch Waiver Processing ===');
  
  // Reset to clean state
  await resetAllPlayers();
  
  // Create bids for multiple players
  console.log('1. Creating bids for 3 players');
  await createBid(testPlayers.qb.id, testPlayers.qb.name, 12, 2);
  await createBid(testPlayers.rb.id, testPlayers.rb.name, 20, 3);
  await createBid(testPlayers.wr.id, testPlayers.wr.name, 15, 2);
  
  let bids = await getBids();
  console.log('   Initial bid count:', bids.length);
  
  // Simulate batch waiver processing
  console.log('2. Processing waivers for 2 players');
  const response = await fetch(`${MOCK_API_URL}/admin/process-waivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerIds: [testPlayers.qb.id, testPlayers.wr.id]
    })
  });
  const result = await response.json();
  console.log('   Players claimed:', result.claimed.length);
  
  // Check bid preservation
  console.log('3. Verifying all bids are preserved');
  bids = await getBids();
  const allBidsExist = [testPlayers.qb.id, testPlayers.rb.id, testPlayers.wr.id]
    .every(playerId => bids.some(b => b.playerId === playerId));
  
  console.log('   All bids preserved:', allBidsExist ? 'Yes (Good!)' : 'No (Bad!)');
  console.log('   Total bids in system:', bids.length);
  
  return allBidsExist;
}

/**
 * Scenario 4: Player release and re-bidding
 */
async function testScenario4() {
  console.log('\n=== Scenario 4: Player Release and Re-bidding ===');
  
  // Reset to clean state
  await resetAllPlayers();
  
  // Create initial bid
  console.log('1. Creating initial bid for', testPlayers.qb.name);
  await createBid(testPlayers.qb.id, testPlayers.qb.name, 10, 1);
  
  // Claim the player
  console.log('2. Claiming player (removing from free agency)');
  await claimPlayer(testPlayers.qb.id);
  
  // Try to bid on claimed player (should fail)
  console.log('3. Attempting to bid on claimed player');
  try {
    const result = await createBid(testPlayers.qb.id, testPlayers.qb.name, 15, 2);
    console.log('   Result:', result.error || 'Unexpected success');
  } catch (error) {
    console.log('   Error (expected):', error.message);
  }
  
  // Release player back to free agency
  console.log('4. Releasing player back to free agency');
  await releasePlayer(testPlayers.qb.id);
  
  // Create new bid
  console.log('5. Creating new bid for released player');
  const newBid = await createBid(testPlayers.qb.id, testPlayers.qb.name, 15, 2);
  console.log('   New bid created:', newBid.success ? 'Success' : 'Failed');
  
  // Check total bids
  const bids = await getBids();
  const qbBids = bids.filter(b => b.playerId === testPlayers.qb.id);
  console.log('6. Total bids for this player:', qbBids.length);
  
  return qbBids.length === 2; // Should have both old and new bid
}

// Run all scenarios
async function runAllTests() {
  console.log('========================================');
  console.log('Fantasy Football Bid Tool - Test Suite');
  console.log('========================================');
  console.log('\nMake sure both servers are running:');
  console.log('  1. npm run dev (port 5173)');
  console.log('  2. node test/mock-server.js (port 8000)');
  console.log('========================================');
  
  await delay(2000);
  
  const results = {
    scenario1: await testScenario1(),
    scenario2: await testScenario2(),
    scenario3: await testScenario3(),
    scenario4: await testScenario4()
  };
  
  console.log('\n========================================');
  console.log('Test Results Summary:');
  console.log('========================================');
  console.log('Scenario 1 (Basic Bid Creation):', results.scenario1 ? '✅ PASS' : '❌ FAIL');
  console.log('Scenario 2 (Player Claimed):', results.scenario2 ? '✅ PASS' : '❌ FAIL');
  console.log('Scenario 3 (Batch Processing):', results.scenario3 ? '✅ PASS' : '❌ FAIL');
  console.log('Scenario 4 (Release & Re-bid):', results.scenario4 ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
}

// Export for use in other test files
export {
  testScenario1,
  testScenario2,
  testScenario3,
  testScenario4,
  runAllTests,
  checkPlayerAvailability,
  createBid,
  getBids,
  claimPlayer,
  releasePlayer,
  resetAllPlayers
};

// Run tests if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllTests().catch(console.error);
}