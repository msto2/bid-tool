import { json } from '@sveltejs/kit';
import { broadcastToSSEClients } from '$lib/sse.js';

// In-memory storage for demo purposes
// In production, this should be replaced with a proper database
let bidsStorage = [];

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

// Function to clean up invalid bids
async function cleanupInvalidBids() {
  const availablePlayerIds = await getCurrentFreeAgents();
  const validBids = bidsStorage.filter(bid => availablePlayerIds.has(bid.playerId));
  const removedCount = bidsStorage.length - validBids.length;
  bidsStorage = validBids;
  return removedCount;
}

// Function to broadcast bid notifications to all connected clients
function broadcastBidNotification(bid) {
  const notification = {
    type: 'new_bid',
    message: `${bid.bidder.name} has placed a bid`,
    timestamp: Date.now()
  };
  
  // Broadcast to SSE clients synchronously
  try {
    broadcastToSSEClients(notification);
  } catch (error) {
    console.error('Error broadcasting notification:', error);
  }
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Clean up invalid bids (players no longer in free agents list)
		await cleanupInvalidBids();
		
		// Return all bids sorted by bidder name, then timestamp
		const sortedBids = [...bidsStorage].sort((a, b) => {
			const nameComparison = a.bidder.name.localeCompare(b.bidder.name);
			if (nameComparison !== 0) return nameComparison;
			return b.timestamp - a.timestamp; // Most recent first for same bidder
		});
		
		return json(sortedBids);
	} catch (error) {
		console.error('Error fetching bids:', error);
		return json({ error: 'Failed to fetch bids' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const bid = await request.json();
		
		// Validate bid structure
		if (!bid.playerId || !bid.playerName || !bid.bidder || !bid.contract) {
			return json({ error: 'Invalid bid data' }, { status: 400 });
		}
		
		// Validate that player is still available in free agents
		const availablePlayerIds = await getCurrentFreeAgents();
		if (!availablePlayerIds.has(bid.playerId)) {
			return json({ error: 'Player is no longer available' }, { status: 400 });
		}
		
		// Generate ID if not provided
		if (!bid.id) {
			bid.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
		}
		
		// Add timestamp if not provided
		if (!bid.timestamp) {
			bid.timestamp = Date.now();
		}
		
		// Find and remove any existing bid from same bidder for same player
		bidsStorage = bidsStorage.filter(existingBid => 
			!(existingBid.playerId === bid.playerId && existingBid.bidder.teamId === bid.bidder.teamId)
		);
		
		// Add the new bid
		bidsStorage.push(bid);
		
		// Broadcast bid notification to all connected clients
		broadcastBidNotification(bid);
		
		return json({ success: true, bid });
	} catch (error) {
		console.error('Error saving bid:', error);
		return json({ error: 'Failed to save bid' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url }) {
	try {
		const bidId = url.searchParams.get('id');
		
		if (!bidId) {
			return json({ error: 'Bid ID required' }, { status: 400 });
		}
		
		const initialLength = bidsStorage.length;
		bidsStorage = bidsStorage.filter(bid => bid.id !== bidId);
		
		if (bidsStorage.length === initialLength) {
			return json({ error: 'Bid not found' }, { status: 404 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting bid:', error);
		return json({ error: 'Failed to delete bid' }, { status: 500 });
	}
}