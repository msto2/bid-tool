import { json } from '@sveltejs/kit';
import { loadBidsFromFile, saveBidsToFile } from '$lib/server/bidStorage.js';
import { isManagerAuthenticated } from '$lib/managerAuth.js';

// Cache for free agents to reduce API calls
let freeAgentsCache = {
  data: new Set(),
  lastUpdated: 0,
  ttl: 30000 // 30 seconds cache
};

// Function to get current free agents list with caching
async function getCurrentFreeAgents() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (freeAgentsCache.lastUpdated && (now - freeAgentsCache.lastUpdated) < freeAgentsCache.ttl) {
    return freeAgentsCache.data;
  }
  
  try {
    // Use Promise.allSettled for better error handling
    const responses = await Promise.allSettled([
      fetch('http://localhost:8000/free-agents-qb'),
      fetch('http://localhost:8000/free-agents-rb'),
      fetch('http://localhost:8000/free-agents-wr'),
      fetch('http://localhost:8000/free-agents-te'),
      fetch('http://localhost:8000/free-agents-dt'),
      fetch('http://localhost:8000/free-agents-de'),
      fetch('http://localhost:8000/free-agents-lb'),
      fetch('http://localhost:8000/free-agents-cb'),
      fetch('http://localhost:8000/free-agents-s'),
      fetch('http://localhost:8000/free-agents-k')
    ]);
    
    const allPlayers = [];
    
    // Process responses with better error handling
    await Promise.all(responses.map(async (result) => {
      if (result.status === 'fulfilled' && result.value.ok) {
        try {
          const players = await result.value.json();
          allPlayers.push(...players);
        } catch (error) {
          console.error('Error parsing player data:', error);
        }
      }
    }));
    
    // Update cache
    freeAgentsCache.data = new Set(allPlayers.map(player => player.id));
    freeAgentsCache.lastUpdated = now;
    
    return freeAgentsCache.data;
  } catch (error) {
    console.error('Error fetching free agents:', error);
    // Return cached data if available, or empty set
    return freeAgentsCache.data.size > 0 ? freeAgentsCache.data : new Set();
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
	try {
		// Check if user is authenticated as manager
		if (!isManagerAuthenticated(cookies)) {
			return json({ error: 'Unauthorized - Manager access required' }, { status: 401 });
		}
		
		// Load all bids from file
		const allBids = loadBidsFromFile();
		
		// Get current free agents
		const availablePlayerIds = await getCurrentFreeAgents();
		
		// Separate bids into active (player still available) and historical (player no longer available)
		const updatedBids = allBids.map(bid => {
			const isAvailable = availablePlayerIds.has(bid.playerId);
			
			// Update status based on player availability
			if (!isAvailable && (!bid.status || bid.status === 'active')) {
				return {
					...bid,
					status: 'historical',
					markedHistoricalAt: Date.now()
				};
			}
			
			return bid;
		});
		
		// Count how many bids were marked as historical
		const markedCount = updatedBids.filter(bid => 
			bid.status === 'historical' && 
			allBids.find(originalBid => originalBid.id === bid.id)?.status !== 'historical'
		).length;
		
		// Save updated bids back to file
		saveBidsToFile(updatedBids);
		
		return json({ 
			success: true, 
			message: `Marked ${markedCount} bids as historical`,
			totalBids: updatedBids.length,
			activeBids: updatedBids.filter(b => b.status === 'active').length,
			historicalBids: updatedBids.filter(b => b.status === 'historical').length
		});
		
	} catch (error) {
		console.error('Error cleaning up bids:', error);
		return json({ error: 'Failed to cleanup bids' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ cookies }) {
	try {
		// Check if user is authenticated as manager
		if (!isManagerAuthenticated(cookies)) {
			return json({ error: 'Unauthorized - Manager access required' }, { status: 401 });
		}
		
		// Load all bids from file
		const allBids = loadBidsFromFile();
		
		// Filter to keep only active bids
		const activeBids = allBids.filter(bid => bid.status === 'active');
		
		const removedCount = allBids.length - activeBids.length;
		
		// Save only active bids back to file
		saveBidsToFile(activeBids);
		
		return json({ 
			success: true, 
			message: `Removed ${removedCount} historical bids permanently`,
			remainingBids: activeBids.length
		});
		
	} catch (error) {
		console.error('Error removing historical bids:', error);
		return json({ error: 'Failed to remove historical bids' }, { status: 500 });
	}
}