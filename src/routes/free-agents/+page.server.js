import { apiRequest, parseJsonResponse } from '$lib/apiConfig.js';

export async function load({ fetch, setHeaders, url }) {
  const context = 'free-agents-load';
  console.log(`[${context.toUpperCase()}] Starting load function`);
  console.log(`[${context.toUpperCase()}] Request URL: ${url.href}`);
  console.log(`[${context.toUpperCase()}] Host: ${url.host}`);
  
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=300' // Cache for 5 minutes
  });
  
  // Check if a specific position is requested
  const position = url.searchParams.get('position');
  console.log(`[${context.toUpperCase()}] Position filter: ${position || 'All'}`);
  
  let teams = [];
  let freeAgents = [];
  
  try {
    let freeAgentsEndpoint = '/free-agents';
    if (position && position !== 'All') {
      freeAgentsEndpoint = `/free-agents-${position.toLowerCase()}`;
    }
    console.log(`[${context.toUpperCase()}] Free agents endpoint: ${freeAgentsEndpoint}`);
    
    console.log(`[${context.toUpperCase()}] Starting parallel API requests...`);
    const startTime = Date.now();
    
    const [teamsRes, freeAgentsRes] = await Promise.allSettled([
      apiRequest('/teams', {}, 'teams-fetch-fa'),
      apiRequest(freeAgentsEndpoint, {}, 'free-agents-fetch')
    ]);
    
    const apiCallDuration = Date.now() - startTime;
    console.log(`[${context.toUpperCase()}] API calls completed in ${apiCallDuration}ms`);
    
    // Process teams response
    if (teamsRes.status === 'fulfilled') {
      try {
        teams = await parseJsonResponse(teamsRes.value, 'teams-parse-fa');
        if (!Array.isArray(teams)) {
          console.warn(`[${context.toUpperCase()}] Teams data is not an array:`, typeof teams);
          teams = [];
        }
        console.log(`[${context.toUpperCase()}] Successfully loaded ${teams.length} teams`);
      } catch (error) {
        console.error(`[${context.toUpperCase()}] Failed to parse teams response:`, error);
        teams = [];
      }
    } else {
      console.error(`[${context.toUpperCase()}] Teams request rejected:`, teamsRes.reason);
      teams = [];
    }
    
    // Process free agents response  
    if (freeAgentsRes.status === 'fulfilled') {
      try {
        freeAgents = await parseJsonResponse(freeAgentsRes.value, 'free-agents-parse');
        if (!Array.isArray(freeAgents)) {
          console.warn(`[${context.toUpperCase()}] Free agents data is not an array:`, typeof freeAgents);
          freeAgents = [];
        }
        console.log(`[${context.toUpperCase()}] Successfully loaded ${freeAgents.length} free agents`);
        
        // Log some sample data
        if (freeAgents.length > 0) {
          const samplePlayer = freeAgents[0];
          console.log(`[${context.toUpperCase()}] Sample player data:`, {
            id: samplePlayer.id,
            name: samplePlayer.name,
            position: samplePlayer.position,
            team: samplePlayer.team,
            hasStats: !!samplePlayer.stats
          });
        }
      } catch (error) {
        console.error(`[${context.toUpperCase()}] Failed to parse free agents response:`, error);
        freeAgents = [];
      }
    } else {
      console.error(`[${context.toUpperCase()}] Free agents request rejected:`, freeAgentsRes.reason);
      freeAgents = [];
    }
    
  } catch (error) {
    console.error(`[${context.toUpperCase()}] Unexpected error in load function:`, error);
    console.error(`[${context.toUpperCase()}] Error stack:`, error.stack);
    teams = [];
    freeAgents = [];
  }

  const result = {
    teams,
    freeAgents,
    currentPosition: position || 'All',
    loadContext: {
      timestamp: new Date().toISOString(),
      host: url.host,
      protocol: url.protocol,
      position: position || 'All',
      teamsCount: teams.length,
      freeAgentsCount: freeAgents.length,
      success: teams.length > 0 || freeAgents.length > 0
    }
  };

  console.log(`[${context.toUpperCase()}] Load function complete:`, {
    teamsCount: result.teams.length,
    freeAgentsCount: result.freeAgents.length,
    position: result.currentPosition,
    host: result.loadContext.host,
    success: result.loadContext.success
  });

  return result;
}