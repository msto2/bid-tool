/**
 * Simple authentication reset for deployment
 * This is a fallback solution that forces re-authentication on every page load
 */

// Simple deployment marker - change this on each deployment
export const DEPLOYMENT_MARKER = "deployment-2025-08-19-02-51";

/**
 * Check if we need to clear old authentication data
 */
export function checkAndClearOldAuth() {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const lastDeployment = localStorage.getItem('lastDeployment');
    
    if (lastDeployment !== DEPLOYMENT_MARKER) {
      // Different deployment, clear everything
      console.log('New deployment detected, clearing old session data...');
      
      // Clear all localStorage items
      localStorage.removeItem('signedInTeam');
      localStorage.removeItem('playerCache');
      localStorage.removeItem('historicalStatsCache');
      localStorage.removeItem('bidCache');
      localStorage.removeItem('positionCache');
      
      // Set new deployment marker
      localStorage.setItem('lastDeployment', DEPLOYMENT_MARKER);
      
      console.log('Old session data cleared for new deployment');
    }
  } catch (error) {
    console.error('Error during deployment check:', error);
    // If anything fails, just clear everything
    try {
      localStorage.clear();
    } catch (clearError) {
      console.error('Error clearing localStorage:', clearError);
    }
  }
}

/**
 * Get signed in team with deployment validation
 */
export function getSignedInTeam() {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const savedTeam = localStorage.getItem('signedInTeam');
    if (!savedTeam) return null;
    
    const teamData = JSON.parse(savedTeam);
    
    // Basic validation
    if (!teamData || !teamData.id || !teamData.name) {
      console.log('Invalid team data, clearing...');
      localStorage.removeItem('signedInTeam');
      return null;
    }
    
    // Check if too old (24 hours)
    if (teamData.signedInAt) {
      const now = Date.now();
      const age = now - teamData.signedInAt;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (age > maxAge) {
        console.log('Session expired, clearing...');
        localStorage.removeItem('signedInTeam');
        return null;
      }
    }
    
    return teamData;
  } catch (error) {
    console.error('Error getting signed in team:', error);
    localStorage.removeItem('signedInTeam');
    return null;
  }
}

/**
 * Create and save session data
 */
export function createAndSaveSession(teamId, teamName) {
  if (typeof localStorage === 'undefined') return;
  
  const sessionData = {
    id: teamId,
    name: teamName,
    signedInAt: Date.now(),
    deployment: DEPLOYMENT_MARKER
  };
  
  try {
    localStorage.setItem('signedInTeam', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}