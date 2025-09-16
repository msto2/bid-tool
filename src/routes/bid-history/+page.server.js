import { loadBidsFromFile } from '$lib/server/bidStorage.js';
import { getCurrentBidPeriodRange } from '$lib/server/bidWindow.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		// Load all bids from file
		const allBids = loadBidsFromFile();

		// Get current bid window period
		const currentPeriodRange = getCurrentBidPeriodRange();

		// Filter out bids from the current window - only show historical bids
		const bids = allBids.filter(bid => {
			if (!bid.timestamp) return false;

			const bidTime = new Date(bid.timestamp);
			const periodStart = new Date(currentPeriodRange.start);
			const periodEnd = new Date(currentPeriodRange.end);

			// Include bid in history if it's outside the current window
			return bidTime < periodStart || bidTime > periodEnd;
		});

		// Calculate statistics
		const totalBids = bids.length;
		const lastUpdated = bids.length > 0 ? Math.max(...bids.map(bid => bid.timestamp)) : null;

		return {
			bids,
			totalBids,
			lastUpdated,
			currentPeriodRange,
			error: null
		};
	} catch (error) {
		console.error('Error loading bid history:', error);
		return {
			bids: [],
			totalBids: 0,
			lastUpdated: null,
			currentPeriodRange: null,
			error: 'Failed to load bid history'
		};
	}
}