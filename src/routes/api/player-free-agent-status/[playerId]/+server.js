import { json } from '@sveltejs/kit';

const EXTERNAL_API_BASE = 'http://localhost:8000';

export async function GET({ params }) {
    const { playerId } = params;
    
    if (!playerId) {
        return json({ error: 'playerId parameter is required' }, { status: 400 });
    }
    
    try {
        const response = await fetch(`${EXTERNAL_API_BASE}/player-free-agent-status/${playerId}`);
        
        if (!response.ok) {
            return json({ error: 'Failed to fetch player free agent status' }, { status: response.status });
        }
        
        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Error fetching player free agent status:', error);
        return json({ error: 'Failed to fetch player free agent status' }, { status: 500 });
    }
}