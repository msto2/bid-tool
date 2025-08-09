export async function load({ fetch, setHeaders, url }) {
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=300' // Cache for 1 minute
  });
  
  // Check if a specific position is requested
  const position = url.searchParams.get('position');
  
  let freeAgentsUrl = 'http://localhost:8000/free-agents';
  if (position && position !== 'All') {
    freeAgentsUrl = `http://localhost:8000/free-agents-${position.toLowerCase()}`;
  }
  
  const [teamsRes, freeAgentsRes] = await Promise.all([
    fetch('http://localhost:8000/teams'),
    fetch(freeAgentsUrl)
  ]);

  if (!teamsRes.ok || !freeAgentsRes.ok) {
    console.error('Failed to load data sources');
    return {
      teams: [],
      freeAgents: [],
      currentPosition: position || 'All'
    };
  }

  const teams = await teamsRes.json();
  const freeAgents = await freeAgentsRes.json();

  return {
    teams,
    freeAgents,
    currentPosition: position || 'All'
  };
}