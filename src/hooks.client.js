// // Enhanced client hooks for hydration error handling
// import { browser } from '$app/environment';

// // Setup client-side error handling and hydration debugging
// if (browser) {
//   console.log('[CLIENT HOOKS] Setting up enhanced client-side error handling...');
  
//   // Track hydration state
//   let hydrationComplete = false;
//   let hydrationStarted = false;
  
//   // Monitor hydration lifecycle
//   const originalConsoleError = console.error;
//   console.error = function(...args) {
//     const message = args.join(' ');
    
//     // Detect hydration-related errors
//     if (message.includes('hydration') || 
//         message.includes('get_first_child') ||
//         (message.includes('Cannot read properties of undefined') && message.includes('call'))) {
//       console.log('[CLIENT HOOKS] Hydration error detected:', message);
      
//       // Log additional context
//       console.log('[CLIENT HOOKS] Hydration state:', {
//         hydrationComplete,
//         hydrationStarted,
//         readyState: document.readyState,
//         bodyChildren: document.body?.children?.length || 0,
//         timestamp: new Date().toISOString()
//       });
      
//       // Don't reload here - let the root error handler deal with it
//     }
    
//     originalConsoleError.apply(console, args);
//   };
  
//   // Monitor when hydration starts and completes
//   document.addEventListener('DOMContentLoaded', () => {
//     console.log('[CLIENT HOOKS] DOM content loaded');
//     hydrationStarted = true;
    
//     // Give hydration a moment to complete
//     setTimeout(() => {
//       hydrationComplete = true;
//       console.log('[CLIENT HOOKS] Hydration should be complete');
//     }, 100);
//   });
  
//   // Additional monitoring
//   window.addEventListener('load', () => {
//     console.log('[CLIENT HOOKS] Window load complete');
//   });
// }

// // Export error handler for SvelteKit
// export const handleError = ({ error, event, status, message }) => {
//   console.error('[CLIENT HOOKS] SvelteKit error:', {
//     error: error?.message,
//     stack: error?.stack,
//     event: event?.url?.href,
//     status,
//     message,
//     timestamp: new Date().toISOString()
//   });
  
//   // Don't prevent default error handling
//   return undefined;
// };