import { CONTACTS } from '$env/static/private';

/** @type {import('./$types.d.ts').PageServerLoad} */
export async function load() {
  try {
    // Fetch teams from FastAPI backend
    const teamsRes = await fetch('http://localhost:8000/teams');
    
    if (!teamsRes.ok) {
      throw new Error('Failed to fetch teams data');
    }
    
    const teams = await teamsRes.json();
    
    // Parse contacts from environment variable
    const contacts = JSON.parse(CONTACTS);
    
    return {
      teams,
      contacts
    };
  } catch (error) {
    console.error('Error fetching teams:', error);
    return {
      teams: [],
      contacts: {}
    };
  }
}