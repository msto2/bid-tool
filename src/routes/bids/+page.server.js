import { apiRequest, parseJsonResponse } from '$lib/apiConfig.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, setHeaders, url }) {
  const context = 'bids-load';
  console.log(`[${context.toUpperCase()}] Starting load function`);
  console.log(`[${context.toUpperCase()}] Request URL: ${url.href}`);
  console.log(`[${context.toUpperCase()}] Host: ${url.host}`);
  
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=10' // Cache for 10 seconds (shorter for real-time bid updates)
  });
  
  let teams = [];
  let bids = [];
  
  try {
    console.log(`[${context.toUpperCase()}] Starting parallel API requests...`);
    const startTime = Date.now();
    
    // Use Promise.allSettled to handle failures gracefully
    const [teamsRes, bidsRes] = await Promise.allSettled([
      apiRequest('/teams', {}, 'teams-fetch-bids'),
      fetch('/api/bids') // This is internal API, use regular fetch
    ]);
    
    const apiCallDuration = Date.now() - startTime;
    console.log(`[${context.toUpperCase()}] API calls completed in ${apiCallDuration}ms`);
    
    // Process teams response
    if (teamsRes.status === 'fulfilled') {
      try {
        teams = await parseJsonResponse(teamsRes.value, 'teams-parse-bids');
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
    
    // Process bids response (internal API)
    if (bidsRes.status === 'fulfilled') {
      try {
        if (bidsRes.value.ok) {
          bids = await bidsRes.value.json();
          if (!Array.isArray(bids)) {
            console.warn(`[${context.toUpperCase()}] Bids data is not an array:`, typeof bids);
            bids = [];
          }
          console.log(`[${context.toUpperCase()}] Successfully loaded ${bids.length} bids`);
          
          // Log some sample data
          if (bids.length > 0) {
            const sampleBid = bids[0];
            console.log(`[${context.toUpperCase()}] Sample bid data:`, {
              id: sampleBid.id,
              playerName: sampleBid.playerName,
              position: sampleBid.position,
              bidderName: sampleBid.bidder?.name,
              contract: sampleBid.contract
            });
          }
        } else {
          console.error(`[${context.toUpperCase()}] Bids API request failed:`, bidsRes.value.status, bidsRes.value.statusText);
          bids = [];
        }
      } catch (error) {
        console.error(`[${context.toUpperCase()}] Failed to parse bids response:`, error);
        bids = [];
      }
    } else {
      console.error(`[${context.toUpperCase()}] Bids request rejected:`, bidsRes.reason);
      bids = [];
    }
    
  } catch (error) {
    console.error(`[${context.toUpperCase()}] Unexpected error in load function:`, error);
    console.error(`[${context.toUpperCase()}] Error stack:`, error.stack);
    teams = [];
    bids = [];
  }

  const result = {
    teams,
    bids,
    loadContext: {
      timestamp: new Date().toISOString(),
      host: url.host,
      protocol: url.protocol,
      teamsCount: teams.length,
      bidsCount: bids.length,
      success: true
    }
  };

  console.log(`[${context.toUpperCase()}] Load function complete:`, {
    teamsCount: result.teams.length,
    bidsCount: result.bids.length,
    host: result.loadContext.host,
    success: result.loadContext.success
  });

  return result;
}