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
  if (!savedTeamData) return false;
  
  try {
    const teamData = JSON.parse(savedTeamData);
    
    // Check if the session has a deployment version
    if (!teamData.deploymentVersion) {
      // Old session without deployment tracking - invalidate
      return false;
    }
    
    // Check if the deployment version matches current
    if (teamData.deploymentVersion !== DEPLOYMENT_VERSION) {
      // Session is from a previous deployment - invalidate
      return false;
    }
    
    // Check if session is expired (24 hours)
    const now = Date.now();
    const sessionAge = now - teamData.signedInAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      // Session is too old - invalidate
      return false;
    }
    
    return true;
  } catch (error) {
    // Invalid JSON or other error - invalidate
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
    localStorage.removeItem('signedInTeam');
  }
}