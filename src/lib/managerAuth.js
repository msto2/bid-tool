/**
 * Manager authentication utilities for bid window management
 */

// Session key for localStorage
const MANAGER_SESSION_KEY = 'managerSession';

// Session duration (24 hours)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Check if manager is currently authenticated
 * @returns {boolean} True if manager is authenticated
 */
export function isManagerAuthenticated() {
  if (typeof localStorage === 'undefined') return false;
  
  try {
    const session = localStorage.getItem(MANAGER_SESSION_KEY);
    if (!session) return false;
    
    const { email, timestamp } = JSON.parse(session);
    const now = Date.now();
    
    // Check if session is still valid (within 24 hours)
    if (now - timestamp > SESSION_DURATION) {
      clearManagerSession();
      return false;
    }
    
    return !!email;
  } catch (error) {
    console.error('Error checking manager authentication:', error);
    clearManagerSession();
    return false;
  }
}

/**
 * Set manager session
 * @param {string} email - Manager email
 * @returns {boolean} True if session was set successfully
 */
export function setManagerSession(email) {
  if (typeof localStorage === 'undefined') return false;
  
  try {
    const session = {
      email,
      timestamp: Date.now()
    };
    
    localStorage.setItem(MANAGER_SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error('Error setting manager session:', error);
    return false;
  }
}

/**
 * Clear manager session
 */
export function clearManagerSession() {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.removeItem(MANAGER_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing manager session:', error);
  }
}

/**
 * Get current manager session
 * @returns {Object|null} Manager session or null
 */
export function getManagerSession() {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const session = localStorage.getItem(MANAGER_SESSION_KEY);
    if (!session) return null;
    
    const { email, timestamp } = JSON.parse(session);
    const now = Date.now();
    
    // Check if session is still valid
    if (now - timestamp > SESSION_DURATION) {
      clearManagerSession();
      return null;
    }
    
    return { email, timestamp };
  } catch (error) {
    console.error('Error getting manager session:', error);
    clearManagerSession();
    return null;
  }
}