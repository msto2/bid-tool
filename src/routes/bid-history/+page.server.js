import { readFileSync, existsSync } from 'fs';
import path from 'path';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const BIDS_FILE_PATH = path.join(process.cwd(), 'bids.json');
  
  try {
    let bids = [];
    
    if (existsSync(BIDS_FILE_PATH)) {
      const fileContent = readFileSync(BIDS_FILE_PATH, 'utf8');
      bids = JSON.parse(fileContent);
    }
    
    // Sort bids by timestamp (newest first)
    bids.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      bids,
      totalBids: bids.length,
      lastUpdated: bids.length > 0 ? bids[0].timestamp : null
    };
  } catch (error) {
    console.error('Error loading bid history:', error);
    return {
      bids: [],
      totalBids: 0,
      lastUpdated: null,
      error: 'Failed to load bid history'
    };
  }
}