/** @type {import('./$types').PageServerLoad} */
export async function load() {
  // This page will primarily use client-side data from localStorage
  // but we might need team data for display purposes
  try {
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