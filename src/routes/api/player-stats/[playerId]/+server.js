import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	const { playerId } = params;
	
	if (!playerId) {
		return json({ error: 'Player ID required' }, { status: 400 });
	}

	try {
		// Proxy the request to the external API server
		const response = await fetch(`http://localhost:8000/player-stats/${playerId}`);
		
		if (!response.ok) {
			throw new Error(`External API responded with status: ${response.status}`);
		}
		
		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Error fetching player stats:', error);
		return json({ error: 'Failed to fetch player stats' }, { status: 500 });
	}
}