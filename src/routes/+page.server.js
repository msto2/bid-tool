import { CONTACTS } from '$env/static/private';
import { apiRequest, parseJsonResponse } from '$lib/apiConfig.js';

/** @type {import('./$types.d.ts').PageServerLoad} */
export async function load({ url }) {
  const context = 'home-page-load';
  console.log(`[${context.toUpperCase()}] Starting load function`);
  console.log(`[${context.toUpperCase()}] Request URL: ${url.href}`);
  console.log(`[${context.toUpperCase()}] Host: ${url.host}`);
  console.log(`[${context.toUpperCase()}] Protocol: ${url.protocol}`);
  
  let teams = [];
  let contacts = {};
  
  try {
    console.log(`[${context.toUpperCase()}] Fetching teams data...`);
    const teamsRes = await apiRequest('/teams', {}, 'teams-fetch');
    teams = await parseJsonResponse(teamsRes, 'teams-parse');
    
    if (!Array.isArray(teams)) {
      console.warn(`[${context.toUpperCase()}] Teams data is not an array:`, typeof teams);
      teams = [];
    }
    
    console.log(`[${context.toUpperCase()}] Successfully loaded ${teams.length} teams`);
    
  } catch (error) {
    console.error(`[${context.toUpperCase()}] Failed to fetch teams:`, error);
    console.error(`[${context.toUpperCase()}] Error stack:`, error.stack);
    teams = [];
  }

  try {
    console.log(`[${context.toUpperCase()}] Parsing contacts from environment...`);
    console.log(`[${context.toUpperCase()}] CONTACTS env var length:`, CONTACTS?.length || 'undefined');
    
    if (CONTACTS) {
      contacts = JSON.parse(CONTACTS);
      console.log(`[${context.toUpperCase()}] Parsed contacts for ${Object.keys(contacts).length} teams`);
    } else {
      console.warn(`[${context.toUpperCase()}] CONTACTS environment variable is not set`);
    }
    
  } catch (error) {
    console.error(`[${context.toUpperCase()}] Failed to parse contacts:`, error);
    console.error(`[${context.toUpperCase()}] CONTACTS raw value:`, CONTACTS);
    contacts = {};
  }

  const result = {
    teams,
    contacts,
    loadContext: {
      timestamp: new Date().toISOString(),
      host: url.host,
      protocol: url.protocol,
      teamsCount: teams.length,
      contactsCount: Object.keys(contacts).length,
      success: true
    }
  };

  console.log(`[${context.toUpperCase()}] Load function complete:`, {
    teamsCount: result.teams.length,
    contactsCount: Object.keys(result.contacts).length,
    host: result.loadContext.host
  });

  return result;
}