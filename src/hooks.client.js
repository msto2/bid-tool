// Client-side error handling
import { browser } from '$app/environment';

if (browser) {
  // Enhanced error handling specifically for hydration issues
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Catch hydration and rendering errors
    if (message.includes('reading \'call\'') || 
        message.includes('get_first_child') ||
        message.includes('hydration') ||
        message.includes('Cannot read properties of undefined')) {
      
      console.warn('Hydration error detected, forcing page reload...');
      
      // Clear all cache and reload
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        
        // Hard reload after short delay
        setTimeout(() => {
          window.location.reload();
        }, 100);
        
        return; // Don't log the error, just handle it
      } catch (clearError) {
        console.warn('Cache clearing failed:', clearError);
      }
    }
    
    // Log other errors normally
    originalConsoleError.apply(console, args);
  };
}