/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, setHeaders }) {
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=10' // Cache for 10 seconds (shorter for real-time bid updates)
  });
  try {
<<<<<<< HEAD
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
=======
    // Fetch both teams and bids data
    const [teamsRes, bidsRes] = await Promise.all([
      fetch('http://localhost:8000/teams'),
      fetch('/api/bids')
    ]);
>>>>>>> parent of 8f3edf1 (connect to web)
    
    const teams = teamsRes.ok ? await teamsRes.json() : [];
    const bids = bidsRes.ok ? await bidsRes.json() : [];
    
    return {
      teams,
      bids
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      teams: [],
      bids: []
    };
  }
}