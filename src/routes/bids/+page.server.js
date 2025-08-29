import { CONTACTS } from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, setHeaders }) {
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=10' // Cache for 10 seconds (shorter for real-time bid updates)
  });
  try {
    // Parse contacts from environment variable first
    let contacts = {};
    try {
      contacts = JSON.parse(CONTACTS || '{}');
    } catch (parseError) {
      console.error('Error parsing CONTACTS:', parseError);
      contacts = {};
    }
    
    // Always fetch bids (internal API)
    let bids = [];
    try {
      const bidsRes = await fetch('/api/bids');
      if (bidsRes.ok) {
        bids = await bidsRes.json();
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
    
    // Try to fetch teams with timeout and fallback
    let teams = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const teamsRes = await fetch('http://localhost:8000/teams', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (teamsRes.ok) {
        teams = await teamsRes.json();
      }
    } catch (error) {
      console.log('FastAPI not available, using fallback team data');
      // Provide fallback team data
      teams = [
        { id: "1", team_name: "Team Alpha", wins: 0, losses: 0, points_for: 0 },
        { id: "2", team_name: "Team Beta", wins: 0, losses: 0, points_for: 0 },
        { id: "3", team_name: "Team Gamma", wins: 0, losses: 0, points_for: 0 },
        { id: "4", team_name: "Team Delta", wins: 0, losses: 0, points_for: 0 }
      ];
    }
    
    return {
      teams,
      bids,
      contacts
    };
  } catch (error) {
    console.error('Error in bids page load function:', error);
    return {
      teams: [],
      bids: [],
      contacts: {}
    };
  }
}