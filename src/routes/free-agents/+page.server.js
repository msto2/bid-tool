export async function load({ fetch, setHeaders, url }) {
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=300' // Cache for 1 minute
  });
  
<<<<<<< HEAD
  try {
    // Check if a specific position is requested
    const position = url.searchParams.get('position');
    
    // Try to fetch data with timeout
    let teams = [];
    let freeAgents = [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      let freeAgentsUrl = 'http://127.0.0.1:8000/free-agents';
      if (position && position !== 'All') {
        freeAgentsUrl = `http://127.0.0.1:8000/free-agents-${position.toLowerCase()}`;
      }
      
      const [teamsRes, freeAgentsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/teams', { signal: controller.signal }),
        fetch(freeAgentsUrl, { signal: controller.signal })
      ]);
      clearTimeout(timeoutId);
=======
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
>>>>>>> parent of 8f3edf1 (connect to web)

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