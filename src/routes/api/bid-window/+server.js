import { json } from '@sveltejs/kit';
import { getBiddingWindowStatus, getTimeUntilWindowChange, getBidWindowSettings } from '$lib/server/bidWindow.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Get status using unified bidWindow system
		const status = getBiddingWindowStatus();
		
		// Load settings to pass to client-side time calculation
		const settings = getBidWindowSettings();
		
		// Calculate time until window change
		const timeUntilChange = getTimeUntilWindowChange();
		
		// Return complete status with countdown
		return json({
			...status,
			settings, // Include settings so client can sync
			timeUntilChange
		});
	} catch (error) {
		console.error('Error getting bid window status:', error);
		return json({ error: 'Failed to get bid window status' }, { status: 500 });
	}
}