/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, setHeaders }) {
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=10' // Cache for 10 seconds (shorter for real-time bid updates)
  });
  try {
    // Fetch both teams and bids data
    const [teamsRes, bidsRes] = await Promise.all([
      fetch('http://localhost:8000/teams'),
      fetch('/api/bids')
    ]);
    
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