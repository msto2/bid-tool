import { json } from '@sveltejs/kit';
import { apiRequest, parseJsonResponse } from '$lib/apiConfig.js';

export async function GET({ url }) {
    const context = 'playerinfo-api';
    const playerId = url.searchParams.get('playerId');
    
    console.log(`[${context.toUpperCase()}] Request for player ID: ${playerId}`);
    
    if (!playerId) {
        console.warn(`[${context.toUpperCase()}] Missing playerId parameter`);
        return json({ error: 'playerId parameter is required' }, { status: 400 });
    }
    
    try {
        console.log(`[${context.toUpperCase()}] Fetching player info for ID: ${playerId}`);
        const response = await apiRequest(`/playerinfo?playerId=${playerId}`, {}, context);
        const data = await parseJsonResponse(response, context);
        
        console.log(`[${context.toUpperCase()}] Successfully fetched player info for: ${data?.name || 'unknown'}`);
        return json(data);
        
    } catch (error) {
        console.error(`[${context.toUpperCase()}] Error fetching player info:`, error);
        return json({ 
            error: 'Failed to fetch player info',
            details: error.message 
        }, { status: 500 });
    }
}