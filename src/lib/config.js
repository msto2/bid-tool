import { dev } from '$app/environment';
import { browser } from '$app/environment';

// Determine the API base URL based on environment and context
export function getApiBaseUrl() {
  // In development, always use localhost
  if (dev) {
    return 'http://localhost:8000';
  }
  
  // In production, on the browser side
  if (browser) {
    // If accessing via domain, try to use port 8000 on the same domain
    if (window.location.hostname === 'bids.triplepoint.me') {
      // Try HTTPS first, fallback to HTTP
      return window.location.protocol === 'https:' 
        ? 'https://bids.triplepoint.me:8000'
        : 'http://bids.triplepoint.me:8000';
    }
    // For IP access, use the same host but port 8000
    if (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${window.location.hostname}:8000`;
    }
    // Fallback to localhost for other cases
    return 'http://localhost:8000';
  }
  
  // Server-side in production
  // For server-side requests, always use direct localhost connection
  return 'http://127.0.0.1:8000';
}

// Export individual API endpoints
export const API_ENDPOINTS = {
  teams: () => `${getApiBaseUrl()}/teams`,
  freeAgents: () => `${getApiBaseUrl()}/free-agents`,
  freeAgentsByPosition: (position) => `${getApiBaseUrl()}/free-agents-${position.toLowerCase()}`,
  playerInfo: () => `${getApiBaseUrl()}/playerinfo`,
  playerStats: (playerId) => `${getApiBaseUrl()}/player-stats/${playerId}`
};