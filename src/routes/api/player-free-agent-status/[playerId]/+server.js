import { json } from '@sveltejs/kit';
import { apiRequest, parseJsonResponse } from '$lib/apiConfig.js';

export async function GET({ params }) {
    const context = 'player-status-api';
    const { playerId } = params;
    
    console.log(`[${context.toUpperCase()}] Request for player status ID: ${playerId}`);
    
    if (!playerId) {
        console.warn(`[${context.toUpperCase()}] Missing playerId parameter`);
        return json({ error: 'playerId parameter is required' }, { status: 400 });
    }
    
    try {
        console.log(`[${context.toUpperCase()}] Fetching free agent status for ID: ${playerId}`);
        const response = await apiRequest(`/player-free-agent-status/${playerId}`, {}, context);
        const data = await parseJsonResponse(response, context);
        
        console.log(`[${context.toUpperCase()}] Status check complete for player ${playerId}: ${data?.isFreeAgent ? 'available' : 'unavailable'}`);
        return json(data);
        
    } catch (error) {
        console.error(`[${context.toUpperCase()}] Error fetching player status:`, error);
        return json({ 
            error: 'Failed to fetch player free agent status',
            details: error.message 
        }, { status: 500 });
    }
}