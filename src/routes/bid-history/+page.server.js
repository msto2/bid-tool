import { loadBidsFromFile } from '$lib/server/bidStorage.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		// Load all bids from file
		const bids = loadBidsFromFile();
		
		// Calculate statistics
		const totalBids = bids.length;
		const lastUpdated = bids.length > 0 ? Math.max(...bids.map(bid => bid.timestamp)) : null;
		
		return {
			bids,
			totalBids,
			lastUpdated,
			error: null
		};
	} catch (error) {
		console.error('Error loading bid history:', error);
		return {
			bids: [],
			totalBids: 0,
			lastUpdated: null,
			error: 'Failed to load bid history'
		};
	}
}