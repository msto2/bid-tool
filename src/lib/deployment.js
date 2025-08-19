/**
 * Deployment version management
 * Forces users to re-authenticate after deployments
 */

// Generate a deployment timestamp when the app builds
// This will be different for each deployment
export const DEPLOYMENT_VERSION = Date.now().toString();

/**
 * Check if the user's session is from a previous deployment
 * @param {string|null} savedTeamData - localStorage signedInTeam data
 * @returns {boolean} - true if session is valid for current deployment
 */
export function isSessionValidForDeployment(savedTeamData) {
  if (!savedTeamData || savedTeamData === 'undefined' || savedTeamData === 'null') {
    return false;
  }
  
  try {
    const teamData = JSON.parse(savedTeamData);
    
    // Ensure teamData is an object and has required fields
    if (!teamData || typeof teamData !== 'object' || !teamData.id || !teamData.name) {
      console.log('Invalid session data structure, clearing...');
      return false;
    }
    
    // Check if the session has a deployment version
    if (!teamData.deploymentVersion) {
      // Old session without deployment tracking - invalidate
      console.log('Session missing deployment version, clearing...');
      return false;
    }
    
    // Check if the deployment version matches current
    if (teamData.deploymentVersion !== DEPLOYMENT_VERSION) {
      // Session is from a previous deployment - invalidate
      console.log('Session from old deployment, clearing...');
      return false;
    }
    
    // Check if session is expired (24 hours)
    const now = Date.now();
    if (!teamData.signedInAt || typeof teamData.signedInAt !== 'number') {
      console.log('Invalid signedInAt timestamp, clearing...');
      return false;
    }
    
    const sessionAge = now - teamData.signedInAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      // Session is too old - invalidate
      console.log('Session expired, clearing...');
      return false;
    }
    
    return true;
  } catch (error) {
    // Invalid JSON or other error - invalidate
    console.log('Error parsing session data:', error);
    return false;
  }
}

/**
 * Create a session object with current deployment version
 * @param {string} teamId 
 * @param {string} teamName 
 * @returns {object} - Session object to store in localStorage
 */
export function createSessionData(teamId, teamName) {
  return {
    id: teamId,
    name: teamName,
    signedInAt: Date.now(),
    deploymentVersion: DEPLOYMENT_VERSION
  };
}

/**
 * Clear invalid session data from localStorage
 */
export function clearInvalidSession() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('signedInTeam');
      console.log('Cleared invalid session from localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

/**
 * Force clear all session data and reload page if needed
 */
export function forceSessionReset() {
  if (typeof localStorage !== 'undefined') {
    try {
      // Clear all possible session-related items
      localStorage.removeItem('signedInTeam');
      localStorage.removeItem('playerCache');
      localStorage.removeItem('historicalStatsCache');
      console.log('Force cleared all session data');
    } catch (error) {
      console.error('Error force clearing localStorage:', error);
    }
  }
}

// All exports are already available as named exports above