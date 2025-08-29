export async function load({ fetch, setHeaders, url }) {
  // Set cache headers for better performance
  setHeaders({
    'cache-control': 'max-age=300' // Cache for 5 minutes
  });
  
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

      if (teamsRes.ok) {
        teams = await teamsRes.json();
      }
      if (freeAgentsRes.ok) {
        freeAgents = await freeAgentsRes.json();
      }
    } catch (error) {
      console.log('FastAPI not available, using fallback data');
      // Provide fallback team data
      teams = [
        { id: "1", team_name: "Team Alpha", wins: 0, losses: 0, points_for: 0 },
        { id: "2", team_name: "Team Beta", wins: 0, losses: 0, points_for: 0 },
        { id: "3", team_name: "Team Gamma", wins: 0, losses: 0, points_for: 0 },
        { id: "4", team_name: "Team Delta", wins: 0, losses: 0, points_for: 0 }
      ];
      // Empty free agents if API not available
      freeAgents = [];
    }

    return {
      teams,
      freeAgents,
      currentPosition: position || 'All'
    };
  } catch (error) {
    console.error('Error in free-agents page load function:', error);
    return {
      teams: [],
      freeAgents: [],
      currentPosition: position || 'All'
    };
  }
}