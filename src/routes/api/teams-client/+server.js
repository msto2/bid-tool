import { json } from '@sveltejs/kit';
import { CONTACTS } from '$env/static/private';
import { apiRequest, parseJsonResponse } from '$lib/apiConfig.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const context = 'teams-client-api';
  console.log(`[${context.toUpperCase()}] Client-side data request`);
  console.log(`[${context.toUpperCase()}] Request URL: ${url.href}`);
  
  let teams = [];
  let contacts = {};
  
  try {
    console.log(`[${context.toUpperCase()}] Fetching teams data...`);
    const teamsRes = await apiRequest('/teams', {}, 'teams-client-fetch');
    teams = await parseJsonResponse(teamsRes, 'teams-client-parse');
    
    if (!Array.isArray(teams)) {
      console.warn(`[${context.toUpperCase()}] Teams data is not an array:`, typeof teams);
      teams = [];
    }
    
    console.log(`[${context.toUpperCase()}] Successfully loaded ${teams.length} teams`);
    
  } catch (error) {
    console.error(`[${context.toUpperCase()}] Failed to fetch teams:`, error);
    // Don't fail the entire request, just return empty teams
    teams = [];
  }

  try {
    console.log(`[${context.toUpperCase()}] Parsing contacts from environment...`);
    if (CONTACTS) {
      contacts = JSON.parse(CONTACTS);
      console.log(`[${context.toUpperCase()}] Parsed contacts for ${Object.keys(contacts).length} teams`);
    } else {
      console.warn(`[${context.toUpperCase()}] CONTACTS environment variable is not set`);
    }
    
  } catch (error) {
    console.error(`[${context.toUpperCase()}] Failed to parse contacts:`, error);
    contacts = {};
  }

  const result = {
    teams,
    contacts,
    timestamp: new Date().toISOString(),
    source: 'client-api',
    success: teams.length > 0
  };

  console.log(`[${context.toUpperCase()}] Returning data:`, {
    teamsCount: result.teams.length,
    contactsCount: Object.keys(result.contacts).length,
    success: result.success
  });

  return json(result);
}