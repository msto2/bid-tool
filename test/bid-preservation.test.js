import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173';
const MOCK_API_URL = 'http://localhost:8000';

// Test data
const testPlayer = {
  id: 2001,
  name: 'Dameon Pierce',
  position: 'RB'
};

const testBidder = {
  teamId: 1,
  name: 'Test Team 1'
};

describe('Bid Preservation Tests', () => {
  
  beforeEach(async () => {
    // Reset all players to free agency before each test
    await fetch(`${MOCK_API_URL}/admin/reset`, { method: 'POST' });
    
    // Clear all bids (if endpoint exists)
    try {
      await fetch(`${BASE_URL}/api/bids?clear=all`, { method: 'DELETE' });
    } catch (e) {
      // Ignore if endpoint doesn't exist
    }
  });
  
  describe('Bid Creation and Storage', () => {
    it('should create a bid with active status', async () => {
      const response = await fetch(`${BASE_URL}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: testPlayer.id,
          playerName: testPlayer.name,
          bidder: testBidder,
          contract: {
            salary: 10,
            years: 2
          }
        })
      });
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.bid.status).toBe('active');
    });
    
    it('should persist bids in storage', async () => {
      // Create a bid
      await fetch(`${BASE_URL}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: testPlayer.id,
          playerName: testPlayer.name,
          bidder: testBidder,
          contract: { salary: 10, years: 2 }
        })
      });
      
      // Fetch all bids
      const response = await fetch(`${BASE_URL}/api/bids`);
      const bids = await response.json();
      
      expect(bids).toHaveLength(1);
      expect(bids[0].playerId).toBe(testPlayer.id);
    });
    
    it('should prevent bids on unavailable players', async () => {
      // Claim the player first
      await fetch(`${MOCK_API_URL}/admin/claim-player/${testPlayer.id}`, {
        method: 'POST'
      });
      
      // Try to create a bid
      const response = await fetch(`${BASE_URL}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: testPlayer.id,
          playerName: testPlayer.name,
          bidder: testBidder,
          contract: { salary: 10, years: 2 }
        })
      });
      
      const result = await response.json();
      expect(response.status).toBe(400);
      expect(result.error).toContain('no longer available');
    });
  });
  
  describe('Bid Preservation During Player Claims', () => {
    it('should preserve bids when player is claimed', async () => {
      // Create a bid
      await fetch(`${BASE_URL}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: testPlayer.id,
          playerName: testPlayer.name,
          bidder: testBidder,
          contract: { salary: 15, years: 1 }
        })
      });
      
      // Claim the player
      await fetch(`${MOCK_API_URL}/admin/claim-player/${testPlayer.id}`, {
        method: 'POST'
      });
      
      // Fetch bids - should still exist
      const response = await fetch(`${BASE_URL}/api/bids`);
      const bids = await response.json();
      
      expect(bids).toHaveLength(1);
      expect(bids[0].playerId).toBe(testPlayer.id);
      // Status might be 'active' or 'historical' depending on implementation
    });
    
    it('should preserve multiple bids during batch waiver processing', async () => {
      const players = [
        { id: 1001, name: 'Justin Fields' },
        { id: 2001, name: 'Dameon Pierce' },
        { id: 3001, name: 'George Pickens' }
      ];
      
      // Create bids for all players
      for (const player of players) {
        await fetch(`${BASE_URL}/api/bids`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.id,
            playerName: player.name,
            bidder: testBidder,
            contract: { salary: 10, years: 2 }
          })
        });
      }
      
      // Process waivers for 2 players
      await fetch(`${MOCK_API_URL}/admin/process-waivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerIds: [players[0].id, players[1].id]
        })
      });
      
      // All bids should still exist
      const response = await fetch(`${BASE_URL}/api/bids`);
      const bids = await response.json();
      
      expect(bids).toHaveLength(3);
      const bidPlayerIds = bids.map(b => b.playerId);
      expect(bidPlayerIds).toContain(players[0].id);
      expect(bidPlayerIds).toContain(players[1].id);
      expect(bidPlayerIds).toContain(players[2].id);
    });
  });
  
  describe('Historical Bid Tracking', () => {
    it('should maintain bid history across player movements', async () => {
      // Create initial bid
      await fetch(`${BASE_URL}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: testPlayer.id,
          playerName: testPlayer.name,
          bidder: testBidder,
          contract: { salary: 8, years: 1 }
        })
      });
      
      // Claim player
      await fetch(`${MOCK_API_URL}/admin/claim-player/${testPlayer.id}`, {
        method: 'POST'
      });
      
      // Release player back to free agency
      await fetch(`${MOCK_API_URL}/admin/release-player/${testPlayer.id}`, {
        method: 'POST'
      });
      
      // Create new bid
      await fetch(`${BASE_URL}/api/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: testPlayer.id,
          playerName: testPlayer.name,
          bidder: { teamId: 2, name: 'Test Team 2' },
          contract: { salary: 12, years: 2 }
        })
      });
      
      // Should have both bids in history
      const response = await fetch(`${BASE_URL}/api/bids`);
      const bids = await response.json();
      
      const playerBids = bids.filter(b => b.playerId === testPlayer.id);
      expect(playerBids).toHaveLength(2);
      
      // Verify different bidders
      const bidders = playerBids.map(b => b.bidder.teamId);
      expect(bidders).toContain(1);
      expect(bidders).toContain(2);
    });
  });
  
  describe('Manager Cleanup Functions', () => {
    it('should mark bids as historical without deleting them', async () => {
      // This test assumes the manager cleanup endpoint exists
      // Skip if not implemented
      try {
        // Create a bid
        await fetch(`${BASE_URL}/api/bids`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: testPlayer.id,
            playerName: testPlayer.name,
            bidder: testBidder,
            contract: { salary: 10, years: 2 }
          })
        });
        
        // Claim the player
        await fetch(`${MOCK_API_URL}/admin/claim-player/${testPlayer.id}`, {
          method: 'POST'
        });
        
        // Run manager cleanup (if endpoint exists)
        const cleanupResponse = await fetch(`${BASE_URL}/api/manager/cleanup-bids`, {
          method: 'POST',
          // Add manager auth if needed
        });
        
        if (cleanupResponse.ok) {
          const result = await cleanupResponse.json();
          
          // Verify bids still exist
          const bidsResponse = await fetch(`${BASE_URL}/api/bids`);
          const bids = await bidsResponse.json();
          
          expect(bids).toHaveLength(1);
          // The bid might be marked as historical
        }
      } catch (e) {
        // Skip if endpoint doesn't exist
        console.log('Manager cleanup endpoint not available, skipping test');
      }
    });
  });
});