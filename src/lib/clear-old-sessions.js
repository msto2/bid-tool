/**
 * Emergency session cleanup script
 * Run this in browser console to clear old session data
 */

export function emergencySessionCleanup() {
  try {
    console.log('Starting emergency session cleanup...');
    
    // Clear all localStorage items that might be causing issues
    const itemsToRemove = [
      'signedInTeam',
      'playerCache', 
      'historicalStatsCache',
      'bidCache',
      'positionCache'
    ];
    
    itemsToRemove.forEach(item => {
      try {
        localStorage.removeItem(item);
        console.log(`Removed ${item} from localStorage`);
      } catch (error) {
        console.error(`Error removing ${item}:`, error);
      }
    });
    
    // Clear all sessionStorage as well
    try {
      sessionStorage.clear();
      console.log('Cleared sessionStorage');
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
    
    console.log('Emergency cleanup completed. Please refresh the page.');
    
    // Auto-refresh after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('Error during emergency cleanup:', error);
  }
}

// Auto-run if accessed via browser console
if (typeof window !== 'undefined') {
  window.emergencySessionCleanup = emergencySessionCleanup;
  console.log('Emergency cleanup function available as window.emergencySessionCleanup()');
}