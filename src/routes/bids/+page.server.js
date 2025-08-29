import { API_ENDPOINTS } from '$lib/config.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, setHeaders }) {
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=10' // Cache for 10 seconds (shorter for real-time bid updates)
  });
  try {
    // Fetch both teams and bids data with timeouts
    const [teamsRes, bidsRes] = await Promise.allSettled([
      fetch(API_ENDPOINTS.teams(), {
        signal: AbortSignal.timeout(5000),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SvelteKit-Server'
        }
      }),
      fetch('/api/bids', {
        signal: AbortSignal.timeout(5000)
      })
    ]);
    
    // Handle teams data with fallback
    let teams = [];
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
    
    // Handle bids data
    let bids = [];
    if (bidsRes.status === 'fulfilled' && bidsRes.value.ok) {
      bids = await bidsRes.value.json();
    } else {
      console.error('Failed to load bids data:', bidsRes.reason || bidsRes.value?.status);
      bids = [];
    }
    
    return {
      teams,
      bids
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      teams: [
        { id: "1", team_name: "Team Alpha", wins: 0, losses: 0, points_for: 0 },
        { id: "2", team_name: "Team Beta", wins: 0, losses: 0, points_for: 0 }
      ],
      bids: []
    };
  }
}