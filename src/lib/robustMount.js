// Robust mounting utilities to prevent hydration issues
import { browser } from '$app/environment';

/**
 * Create a safe wrapper for component data that prevents undefined access
 * @param {object} data - Raw data from server
 * @returns {object} - Safe data object
 */
export function createSafeDataWrapper(data) {
  if (!data) {
    console.warn('[ROBUST MOUNT] Data is undefined, creating safe wrapper');
    return {
      teams: [],
      contacts: {},
      loadContext: {
        timestamp: new Date().toISOString(),
        success: false,
        error: 'No data provided'
      }
    };
  }

  const safeData = {
    teams: Array.isArray(data.teams) ? data.teams : [],
    contacts: (data.contacts && typeof data.contacts === 'object') ? data.contacts : {},
    loadContext: data.loadContext || {
      timestamp: new Date().toISOString(),
      success: Array.isArray(data.teams) && data.teams.length > 0
    }
  };

  // Add any additional properties from the original data
  Object.keys(data).forEach(key => {
    if (!safeData.hasOwnProperty(key)) {
      safeData[key] = data[key];
    }
  });

  console.log('[ROBUST MOUNT] Created safe data wrapper:', {
    originalDataType: typeof data,
    safeTeamsLength: safeData.teams.length,
    safeContactsKeys: Object.keys(safeData.contacts).length,
    safeLoadContext: !!safeData.loadContext
  });

  return safeData;
}

/**
 * Delay component rendering until after hydration is complete
 * @param {Function} callback - Callback to run after safe mounting
 */
export function waitForSafeMount(callback) {
  if (!browser) {
    // On server, run immediately
    callback();
    return;
  }

  // On client, wait for DOM to be fully ready
  if (document.readyState === 'complete') {
    // Already loaded
    setTimeout(callback, 0);
  } else {
    // Wait for load event
    window.addEventListener('load', () => {
      setTimeout(callback, 10); // Small delay to ensure everything is ready
    }, { once: true });
  }
}

/**
 * Safely access nested object properties
 * @param {object} obj - Object to access
 * @param {string} path - Dot notation path (e.g., 'teams.0.name')
 * @param {any} defaultValue - Default value if path doesn't exist
 */
export function safeGet(obj, path, defaultValue = undefined) {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !current.hasOwnProperty(key)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  } catch (error) {
    console.warn(`[ROBUST MOUNT] Safe get failed for path "${path}":`, error);
    return defaultValue;
  }
}

/**
 * Monitor for component rendering errors and provide recovery
 */
export function setupComponentErrorRecovery() {
  if (!browser) return;
  
  console.log('[ROBUST MOUNT] Setting up component error recovery...');
  
  // Track component mount states
  const componentStates = new Map();
  
  // Monitor component lifecycle
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && 
        (event.error.message.includes('get_first_child') || 
         event.error.message.includes('Cannot read properties of undefined'))) {
      
      console.error('[ROBUST MOUNT] Component rendering error detected:', {
        message: event.error.message,
        filename: event.filename,
        lineno: event.lineno,
        stack: event.error.stack,
        componentStates: Array.from(componentStates.entries())
      });
      
      // Try to recover by clearing potentially corrupted state
      try {
        console.log('[ROBUST MOUNT] Attempting error recovery...');
        
        // Clear any cached data that might be corrupted
        ['playerCache', 'historicalStatsCache', 'bidCache', 'positionCache'].forEach(key => {
          if (localStorage.getItem(key)) {
            console.log(`[ROBUST MOUNT] Clearing potentially corrupted cache: ${key}`);
            localStorage.removeItem(key);
          }
        });
        
        // Force a clean reload without cache
        setTimeout(() => {
          const url = new URL(window.location);
          url.searchParams.set('recovery', Date.now());
          window.location.replace(url.toString());
        }, 1000);
        
      } catch (recoveryError) {
        console.error('[ROBUST MOUNT] Error recovery failed:', recoveryError);
      }
    }
  });
  
  return {
    registerComponent: (name, state) => {
      componentStates.set(name, { ...state, timestamp: Date.now() });
    },
    unregisterComponent: (name) => {
      componentStates.delete(name);
    }
  };
}