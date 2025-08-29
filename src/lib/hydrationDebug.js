// Hydration debugging utilities to identify mismatches
import { browser } from '$app/environment';

/**
 * Compare server-rendered data with client expectations
 * @param {string} pageName - Name of the page for logging
 * @param {object} serverData - Data from server load function
 * @param {object} clientExpectedData - What client expects
 */
export function debugHydrationMismatch(pageName, serverData, clientExpectedData = {}) {
  if (!browser) return;
  
  console.log(`[HYDRATION DEBUG] ${pageName} - Server data:`, {
    teams: Array.isArray(serverData?.teams) ? serverData.teams.length : typeof serverData?.teams,
    contacts: typeof serverData?.contacts,
    loadContext: serverData?.loadContext,
    serverDataKeys: serverData ? Object.keys(serverData) : 'undefined'
  });
  
  console.log(`[HYDRATION DEBUG] ${pageName} - Client expectations:`, clientExpectedData);
  
  // Check for potential mismatches
  const mismatches = [];
  
  if (serverData?.teams && !Array.isArray(serverData.teams)) {
    mismatches.push(`Teams is not an array: ${typeof serverData.teams}`);
  }
  
  if (serverData?.teams && serverData.teams.length === 0) {
    mismatches.push('Teams array is empty');
  }
  
  if (!serverData?.contacts || typeof serverData.contacts !== 'object') {
    mismatches.push(`Contacts is not an object: ${typeof serverData?.contacts}`);
  }
  
  if (mismatches.length > 0) {
    console.warn(`[HYDRATION DEBUG] ${pageName} - Potential mismatches:`, mismatches);
  }
  
  return mismatches;
}

/**
 * Debug DOM structure before hydration issues
 */
export function debugDOMStructure() {
  if (!browser) return;
  
  console.log('[HYDRATION DEBUG] DOM structure analysis...');
  
  // Check for elements that might cause hydration issues
  const body = document.body;
  const mainElements = body.querySelectorAll('main, div[data-sveltekit-preload-data]');
  
  console.log(`[HYDRATION DEBUG] Found ${mainElements.length} main elements`);
  
  mainElements.forEach((el, i) => {
    console.log(`[HYDRATION DEBUG] Element ${i}:`, {
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      childrenCount: el.children.length,
      textContent: el.textContent ? el.textContent.substring(0, 100) + '...' : 'empty'
    });
  });
  
  // Check for script tags that might interfere
  const scripts = document.querySelectorAll('script');
  console.log(`[HYDRATION DEBUG] Found ${scripts.length} script tags`);
  
  // Check for any elements with undefined properties
  const allElements = document.querySelectorAll('*');
  let undefinedElements = 0;
  
  allElements.forEach(el => {
    if (!el.tagName) {
      undefinedElements++;
    }
  });
  
  if (undefinedElements > 0) {
    console.warn(`[HYDRATION DEBUG] Found ${undefinedElements} elements with undefined properties`);
  }
}

/**
 * Monitor for hydration-related errors specifically
 */
export function setupHydrationErrorMonitoring() {
  if (!browser) return;
  
  console.log('[HYDRATION DEBUG] Setting up hydration error monitoring...');
  
  // Intercept the specific error we're tracking
  const originalError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (message && message.includes('Cannot read properties of undefined') && 
        message.includes('call') && source && source.includes('chunk-')) {
      
      console.log('[HYDRATION DEBUG] Intercepted target error!');
      console.log('[HYDRATION DEBUG] Error details:', {
        message,
        source,
        lineno,
        colno,
        error,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
      
      // Capture current page state
      console.log('[HYDRATION DEBUG] Page state at error:', {
        pageData: window.__sveltekit_page_data || 'undefined',
        bodyHTML: document.body ? document.body.innerHTML.substring(0, 500) + '...' : 'no body',
        readyState: document.readyState,
        loaded: document.readyState === 'complete'
      });
      
      // Capture component mount state
      debugDOMStructure();
    }
    
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
  };
  
  // Also monitor unhandled promise rejections with more detail
  const originalRejection = window.onunhandledrejection;
  window.onunhandledrejection = function(event) {
    if (event.reason && event.reason.message && 
        event.reason.message.includes('Cannot read properties of undefined')) {
      
      console.log('[HYDRATION DEBUG] Intercepted promise rejection!');
      console.log('[HYDRATION DEBUG] Promise rejection details:', {
        reason: event.reason,
        stack: event.reason.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Log current component state
      debugDOMStructure();
    }
    
    if (originalRejection) {
      return originalRejection(event);
    }
  };
}