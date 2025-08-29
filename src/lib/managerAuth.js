/**
 * Manager authentication utilities
 */

const MANAGER_EMAIL = 'michael.stokes.212@gmail.com';
const MANAGER_SESSION_KEY = 'managerSession';

/**
 * Check if a user is authorized as a manager
 * @param {string} email - Email to check
 * @returns {boolean} True if user is authorized manager
 */
export function isAuthorizedManager(email) {
  return email === MANAGER_EMAIL;
}

/**
 * Set manager session in localStorage
 * @param {string} email - Manager email
 */
export function setManagerSession(email) {
  if (isAuthorizedManager(email)) {
    const session = {
      email,
      loginTime: Date.now()
    };
    localStorage.setItem(MANAGER_SESSION_KEY, JSON.stringify(session));
    return true;
  }
  return false;
}

/**
 * Get current manager session
 * @returns {Object|null} Manager session data or null
 */
export function getManagerSession() {
  try {
    const sessionData = localStorage.getItem(MANAGER_SESSION_KEY);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      // Check if session is less than 24 hours old
      if (Date.now() - session.loginTime < 24 * 60 * 60 * 1000) {
        return session;
      } else {
        // Session expired
        clearManagerSession();
      }
    }
  } catch (error) {
    console.error('Error reading manager session:', error);
    clearManagerSession();
  }
  return null;
}

/**
 * Clear manager session
 */
export function clearManagerSession() {
  localStorage.removeItem(MANAGER_SESSION_KEY);
}

/**
 * Check if user is currently authenticated as manager
 * @returns {boolean} True if authenticated manager
 */
export function isManagerAuthenticated() {
  const session = getManagerSession();
  return session && isAuthorizedManager(session.email);
}