// Application version for cache management
export const APP_VERSION = '0.0.1-' + Date.now();
export const CACHE_VERSION_KEY = 'bid-tool-version';

export function checkCacheVersion() {
  if (typeof window === 'undefined') return; // Server-side
  
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  
  if (storedVersion !== APP_VERSION) {
    console.log('App version changed, clearing cache...');
    
    // Clear localStorage
    ['signedInTeam', 'playerCache', 'historicalStatsCache', 'bidCache', 'positionCache'].forEach(item => {
      localStorage.removeItem(item);
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Force browser cache clear
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Update stored version
    localStorage.setItem(CACHE_VERSION_KEY, APP_VERSION);
    
    console.log('Cache cleared for version:', APP_VERSION);
  }
}