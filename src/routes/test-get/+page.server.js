// src/routes/+page.server.js
export async function load({ fetch }) {
  const [teamsRes, agentsRes] = await Promise.all([
    fetch('http://localhost:8000/teams'),
    fetch('http://localhost:8000/free-agents')
  ]);

  if (!teamsRes.ok || !agentsRes.ok) {
    console.error('Failed to load data');
    return { teams: [], freeAgents: [] };
  }

  const teams = await teamsRes.json();
  const freeAgents = await agentsRes.json();

  // console.log("SERVER DATA", teams, freeAgents); // ✅ Confirmed to work

  return {
    teams,
    freeAgents
  };
}
