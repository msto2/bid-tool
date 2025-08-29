/** @type {import('./$types.d.ts').PageServerLoad} */
export async function load() {
  try {
<<<<<<< HEAD
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
    
    // Try to fetch teams from FastAPI backend with retry
    let teams = [];
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Attempting to fetch teams from FastAPI... (attempt ${attempts + 1}/${maxAttempts})`);
        
        const teamsRes = await fetch('http://127.0.0.1:8000/teams', {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SvelteKit-Server'
          }
        });
        
        if (teamsRes.ok) {
          teams = await teamsRes.json();
          console.log('Successfully fetched teams from FastAPI:', teams.length, 'teams');
          break; // Success, exit retry loop
        } else {
          console.log('FastAPI returned non-OK status:', teamsRes.status);
          throw new Error(`HTTP ${teamsRes.status}`);
        }
      } catch (error) {
        attempts++;
        console.log(`FastAPI attempt ${attempts} failed:`, error.message);
        
        if (attempts < maxAttempts) {
          console.log('Retrying in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log('All FastAPI attempts failed, using fallback team data');
        }
      }
    }
    
    // If no teams were fetched, provide fallback data
    if (!teams || teams.length === 0) {
      teams = [
        { id: "1", team_name: "Team Alpha", wins: 0, losses: 0, points_for: 0 },
        { id: "2", team_name: "Team Beta", wins: 0, losses: 0, points_for: 0 },
        { id: "3", team_name: "Team Gamma", wins: 0, losses: 0, points_for: 0 },
        { id: "4", team_name: "Team Delta", wins: 0, losses: 0, points_for: 0 }
      ];
    }
=======
    // Fetch teams from FastAPI backend
    const teamsRes = await fetch('http://localhost:8000/teams');
    
    if (!teamsRes.ok) {
      throw new Error('Failed to fetch teams data');
    }
    
    const teams = await teamsRes.json();
    
    return {
      teams
    };
  } catch (error) {
    console.error('Error fetching teams:', error);
    return {
      teams: []
    };
  }
}