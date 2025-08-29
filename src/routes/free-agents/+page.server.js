import { API_ENDPOINTS } from '$lib/config.js';

export async function load({ fetch, setHeaders, url }) {
  try {
    // Set cache headers for better performance
    setHeaders({
      'cache-control': 'max-age=300' // Cache for 5 minutes
    });
    
    // Check if a specific position is requested
    const position = url.searchParams.get('position');
    
    // Determine the correct API endpoint
    let freeAgentsUrl = API_ENDPOINTS.freeAgents();
    if (position && position !== 'All') {
      freeAgentsUrl = API_ENDPOINTS.freeAgentsByPosition(position);
    }
    
    // Fetch data with timeout
    const fetchWithTimeout = (url) => fetch(url, {
      signal: AbortSignal.timeout(8000), // 8 second timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SvelteKit-Server'
      }
    });
    
    const [teamsRes, freeAgentsRes] = await Promise.allSettled([
      fetchWithTimeout(API_ENDPOINTS.teams()),
      fetchWithTimeout(freeAgentsUrl)
    ]);

    // Handle results with fallbacks
    let teams = [];
    let freeAgents = [];
    
    if (teamsRes.status === 'fulfilled' && teamsRes.value.ok) {
      teams = await teamsRes.value.json();
    } else {
      console.error('Failed to load teams data:', teamsRes.reason || teamsRes.value?.status);
      // Provide fallback teams data
      teams = [
        { id: "1", team_name: "Team Alpha", wins: 0, losses: 0, points_for: 0 },
        { id: "2", team_name: "Team Beta", wins: 0, losses: 0, points_for: 0 },
        { id: "3", team_name: "Team Gamma", wins: 0, losses: 0, points_for: 0 },
        { id: "4", team_name: "Team Delta", wins: 0, losses: 0, points_for: 0 }
      ];
    }
    
    if (freeAgentsRes.status === 'fulfilled' && freeAgentsRes.value.ok) {
      freeAgents = await freeAgentsRes.value.json();
    } else {
      console.error('Failed to load free agents data:', freeAgentsRes.reason || freeAgentsRes.value?.status);
      freeAgents = []; // Empty array as fallback
    }

    return {
      teams,
      freeAgents,
      currentPosition: position || 'All'
    };
  } catch (error) {
    console.error('Error in free-agents page load:', error);
    // Return fallback data to prevent hydration mismatch
    return {
      teams: [
        { id: "1", team_name: "Team Alpha", wins: 0, losses: 0, points_for: 0 },
        { id: "2", team_name: "Team Beta", wins: 0, losses: 0, points_for: 0 }
      ],
      freeAgents: [],
      currentPosition: url.searchParams.get('position') || 'All'
    };
  }
}