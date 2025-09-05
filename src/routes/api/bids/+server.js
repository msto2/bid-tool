import { json } from '@sveltejs/kit';
import { broadcastToSSEClients } from '$lib/sse.js';
import { loadBidsFromFile, addBidToFile, removeBidFromFile, clearAllBidsFromFile, saveBidsToFile } from '$lib/server/bidStorage.js';

// Load bids from file on server start
let bidsStorage = loadBidsFromFile();

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

// Function to check if a player is still available (for validation only)
async function isPlayerAvailable(playerId) {
  const availablePlayerIds = await getCurrentFreeAgents();
  return availablePlayerIds.has(playerId);
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

// Function to broadcast bid deletion notifications to all connected clients
function broadcastBidDeletion(bidId) {
  const notification = {
    type: 'bid_deleted',
    bidId: bidId,
    message: `A bid has been deleted`,
    timestamp: Date.now()
  };
  
  // Broadcast to SSE clients synchronously
  try {
    broadcastToSSEClients(notification);
  } catch (error) {
    console.error('Error broadcasting deletion notification:', error);
  }
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Load fresh bids from file
		bidsStorage = loadBidsFromFile();
		
		// Return ALL bids without filtering - preserving historical records
		// Bids are kept for record-keeping purposes even if players are no longer available
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
		// This check prevents new bids on unavailable players but doesn't affect existing bids
		const playerAvailable = await isPlayerAvailable(bid.playerId);
		if (!playerAvailable) {
			return json({ error: 'Player is no longer available' }, { status: 400 });
		}
		
		// Generate ID if not provided
		if (!bid.id) {
			bid.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
		}
		
		// Add timestamp and status if not provided
		if (!bid.timestamp) {
			bid.timestamp = Date.now();
		}
		
		// Mark bid as active (for future status tracking)
		if (!bid.status) {
			bid.status = 'active';
		}
		
		// Save bid to file (this handles replacing existing bids from same bidder for same player)
		if (!addBidToFile(bid)) {
			return json({ error: 'Failed to save bid to file' }, { status: 500 });
		}
		
		// Update in-memory storage
		bidsStorage = loadBidsFromFile();
		
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
		const clearAll = url.searchParams.get('clear') === 'all';
		
		if (clearAll) {
			// Clear all bids from file (for weekly reset)
			const clearedCount = clearAllBidsFromFile();
			
			// Update in-memory storage
			bidsStorage = loadBidsFromFile();
			
			// Broadcast that all bids were cleared
			const notification = {
				type: 'all_bids_cleared',
				message: `All bids cleared for new week`,
				timestamp: Date.now()
			};
			
			try {
				broadcastToSSEClients(notification);
			} catch (error) {
				console.error('Error broadcasting clear notification:', error);
			}
			
			return json({ success: true, clearedCount });
		}
		
		if (!bidId) {
			return json({ error: 'Bid ID required' }, { status: 400 });
		}
		
		// Remove bid from file
		if (!removeBidFromFile(bidId)) {
			return json({ error: 'Bid not found' }, { status: 404 });
		}
		
		// Update in-memory storage
		bidsStorage = loadBidsFromFile();
		
		// Broadcast bid deletion notification to all connected clients
		broadcastBidDeletion(bidId);
		
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting bid:', error);
		return json({ error: 'Failed to delete bid' }, { status: 500 });
	}
}