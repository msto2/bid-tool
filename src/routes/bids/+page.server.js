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
      if (CONTACTS) {
        contacts = JSON.parse(CONTACTS);
      } else {
        // Provide fallback contacts structure that matches team IDs
        contacts = {
          "1": { email: "team1@example.com", phone: "555-0001" },
          "2": { email: "team2@example.com", phone: "555-0002" },
          "3": { email: "team3@example.com", phone: "555-0003" },
          "4": { email: "team4@example.com", phone: "555-0004" }
        };
      }
    } catch (parseError) {
      console.error('Error parsing CONTACTS:', parseError);
      // Provide fallback contacts structure
      contacts = {
        "1": { email: "team1@example.com", phone: "555-0001" },
        "2": { email: "team2@example.com", phone: "555-0002" },
        "3": { email: "team3@example.com", phone: "555-0003" },
        "4": { email: "team4@example.com", phone: "555-0004" }
      };
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
      
      const teamsRes = await fetch('http://127.0.0.1:8000/teams', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (teamsRes.ok) {
        teams = await teamsRes.json();
      }
    } catch (error) {
      console.log('FastAPI not available, using fallback team data');
      console.log('Error details:', error.message);
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