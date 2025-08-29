// Client-side debugging and error monitoring utilities
import { browser } from '$app/environment';

/**
 * Enhanced client-side error logging with context
 * @param {string} context - Error context (e.g., 'component-mount', 'api-call')
 * @param {Error} error - The error object
 * @param {object} metadata - Additional metadata about the error
 */
export function logClientError(context, error, metadata = {}) {
  if (!browser) return;
  
  const errorInfo = {
    context,
    timestamp: new Date().toISOString(),
    host: window.location.host,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    },
    metadata
  };
  
  console.error(`[CLIENT ERROR] ${context}:`, errorInfo);
  
  // Store recent errors for debugging
  try {
    const recentErrors = JSON.parse(localStorage.getItem('recentErrors') || '[]');
    recentErrors.unshift(errorInfo);
    // Keep only last 10 errors
    recentErrors.splice(10);
    localStorage.setItem('recentErrors', JSON.stringify(recentErrors));
  } catch (e) {
    console.warn('[CLIENT ERROR] Failed to store error in localStorage:', e);
  }
}

/**
 * Log application state for debugging
 * @param {string} context - Context of the state log
 * @param {object} state - Application state to log
 */
export function logAppState(context, state = {}) {
  if (!browser) return;
  
  const stateInfo = {
    context,
    timestamp: new Date().toISOString(),
    host: window.location.host,
    pathname: window.location.pathname,
    state,
    localStorage: {
      signedInTeam: !!localStorage.getItem('signedInTeam'),
      playerCache: !!localStorage.getItem('playerCache'),
      bidCache: !!localStorage.getItem('bidCache')
    }
  };
  
  console.log(`[APP STATE] ${context}:`, stateInfo);
}

/**
 * Monitor DOM changes that might cause hydration issues
 */
export function setupDOMMonitoring() {
  if (!browser) return;
  
  console.log('[DOM MONITOR] Setting up DOM change monitoring...');
  
  // Monitor for missing elements that might cause the 'call' error
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            console.log('[DOM MONITOR] Element removed:', node.tagName, node.className);
          }
        });
        
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            console.log('[DOM MONITOR] Element added:', node.tagName, node.className);
          }
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Stop observing after 30 seconds to avoid performance issues
  setTimeout(() => {
    observer.disconnect();
    console.log('[DOM MONITOR] Stopped monitoring after 30 seconds');
  }, 30000);
}

/**
 * Monitor for specific Svelte-related errors
 */
export function setupSvelteErrorMonitoring() {
  if (!browser) return;
  
  console.log('[SVELTE MONITOR] Setting up Svelte error monitoring...');
  
  // Monitor for the specific error pattern
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('Cannot read properties of undefined') && 
        message.includes('call')) {
      console.log('[SVELTE MONITOR] Detected the target error!');
      logClientError('svelte-call-error', new Error(message), {
        args: args,
        stackTrace: new Error().stack
      });
    }
    
    originalConsoleError.apply(console, args);
  };
}

/**
 * Get debug information about the current environment
 */
export function getDebugInfo() {
  if (!browser) return {};
  
  return {
    timestamp: new Date().toISOString(),
    location: {
      href: window.location.href,
      host: window.location.host,
      protocol: window.location.protocol,
      pathname: window.location.pathname
    },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled
    },
    storage: {
      localStorage: (() => {
        try {
          const keys = Object.keys(localStorage);
          return keys.reduce((acc, key) => {
            acc[key] = localStorage.getItem(key)?.length || 0;
            return acc;
          }, {});
        } catch (e) {
          return { error: e.message };
        }
      })(),
      sessionStorage: (() => {
        try {
          return Object.keys(sessionStorage).length;
        } catch (e) {
          return { error: e.message };
        }
      })()
    },
    performance: {
      navigation: performance.navigation?.type,
      timing: {
        loadEventEnd: performance.timing?.loadEventEnd,
        domContentLoadedEventEnd: performance.timing?.domContentLoadedEventEnd,
        navigationStart: performance.timing?.navigationStart
      }
    }
  };
}

/**
 * Enhanced error boundary for Svelte components
 * @param {Function} fn - Function to execute
 * @param {string} context - Context for error logging
 * @returns {Promise} - Promise that resolves with the function result or rejects with enhanced error
 */
export async function withErrorBoundary(fn, context) {
  try {
    logAppState(`before-${context}`);
    const result = await fn();
    logAppState(`after-${context}`, { success: true });
    return result;
  } catch (error) {
    logClientError(context, error, getDebugInfo());
    throw error;
  }
}