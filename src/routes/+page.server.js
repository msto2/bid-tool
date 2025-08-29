import { CONTACTS } from '$env/static/private';

/** @type {import('./$types.d.ts').PageServerLoad} */
export async function load() {
  try {
    // Parse contacts from environment variable first
    let contacts = {};
    try {
      if (CONTACTS) {
        contacts = JSON.parse(CONTACTS);
        console.log('Parsed contacts successfully');
      } else {
        console.log('CONTACTS environment variable not set');
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
    
    // Try to fetch teams from FastAPI backend with timeout
    let teams = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const teamsRes = await fetch('http://localhost:8000/teams', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (teamsRes.ok) {
        teams = await teamsRes.json();
      }
    } catch (error) {
      console.log('FastAPI not available, using fallback team data');
      // Provide fallback team data if API is not available
      teams = [
        { id: "1", team_name: "Team Alpha", wins: 0, losses: 0, points_for: 0 },
        { id: "2", team_name: "Team Beta", wins: 0, losses: 0, points_for: 0 },
        { id: "3", team_name: "Team Gamma", wins: 0, losses: 0, points_for: 0 },
        { id: "4", team_name: "Team Delta", wins: 0, losses: 0, points_for: 0 }
      ];
    }
    
    return {
      teams,
      contacts
    };
  } catch (error) {
    console.error('Error in page load function:', error);
    return {
      teams: [],
      contacts: {}
    };
  }
}