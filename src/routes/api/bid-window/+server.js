import { json } from '@sveltejs/kit';
import { getBidWindowStatusServer, getTimeUntilWindowChangeServer } from '$lib/server/bidWindow.js';
import { loadBidWindowSettingsFromFile } from '$lib/server/bidWindowStorage.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		// Get status using server-side settings
		const status = getBidWindowStatusServer();
		
		// Load settings to pass to client-side time calculation
		const settings = loadBidWindowSettingsFromFile();
		
		// Calculate time until window change (server-side)
		const timeUntilChange = getTimeUntilWindowChangeServer(status, settings);
		
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