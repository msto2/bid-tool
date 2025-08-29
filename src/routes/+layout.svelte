<script>
  import { navigating } from '$app/stores';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { logClientError, logAppState, setupDOMMonitoring, setupSvelteErrorMonitoring, getDebugInfo } from '$lib/clientDebug.js';
  import { analyzeDOMStructure, setupDOMMonitoring as setupAdvancedDOMMonitoring } from '$lib/domAnalysis.js';
  
  let mounted = false;
  let errorCount = 0;

  // Global error handler for deployment-related issues
  onMount(() => {
    if (browser) {
      console.log('[LAYOUT] Mounting layout component...');
      logAppState('layout-mount', getDebugInfo());
      
      mounted = true;
      
      // Setup enhanced monitoring
      setupDOMMonitoring();
      setupSvelteErrorMonitoring();
      
      // Setup advanced DOM analysis
      try {
        const domAnalysis = analyzeDOMStructure();
        console.log('[LAYOUT] Initial DOM analysis complete');
        
        // Setup continuous monitoring
        setupAdvancedDOMMonitoring(30000);
        
        // Make analysis available globally for root error handler
        window.analyzeDOMStructure = analyzeDOMStructure;
        
      } catch (error) {
        console.error('[LAYOUT] Failed to setup DOM analysis:', error);
      }
      
      // Enhanced localStorage cleanup function with logging
      const clearAllLocalStorage = (reason = 'unknown') => {
        try {
          console.log(`[LAYOUT] Clearing localStorage due to: ${reason}`);
          logAppState('before-storage-clear', { reason, errorCount });
          
          const itemsToRemove = ['signedInTeam', 'playerCache', 'historicalStatsCache', 'bidCache', 'positionCache', 'recentErrors'];
          itemsToRemove.forEach(item => {
            const value = localStorage.getItem(item);
            if (value) {
              console.log(`[LAYOUT] Removing ${item} (${value.length} chars)`);
              localStorage.removeItem(item);
            }
          });
          
          sessionStorage.clear();
          console.log('[LAYOUT] Cleared all storage data');
          logAppState('after-storage-clear', { success: true });
        } catch (error) {
          console.error('[LAYOUT] Error clearing storage:', error);
          logClientError('storage-clear-error', error);
        }
      };

      // Enhanced error detection and logging
      const isTargetError = (error) => {
        if (!error) return false;
        const message = error.message || '';
        return (
          message.includes('Cannot read properties of undefined') ||
          message.includes('reading \'call\'') ||
          message.includes('hydration') ||
          message.includes('get_first_child')
        );
      };

      const handleTargetError = (error, source) => {
        errorCount++;
        console.log(`[LAYOUT] Target error detected (#${errorCount}) from ${source}`);
        
        // Log comprehensive error details
        logClientError(`target-error-${source}`, error, {
          errorCount,
          debugInfo: getDebugInfo(),
          currentHost: window.location.host,
          isLocalhost: window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168'),
          isDomain: window.location.hostname === 'bids.triplepoint.me'
        });
        
        // Only clear storage and reload if we haven't tried too many times
        if (errorCount <= 2) {
          clearAllLocalStorage(`${source}-error-${errorCount}`);
          
          // More aggressive service worker cleanup
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              console.log(`[LAYOUT] Found ${registrations.length} service worker registrations`);
              for(let registration of registrations) {
                console.log('[LAYOUT] Unregistering service worker:', registration.scope);
                registration.unregister();
              }
            });
          }
          
          // Clear all possible caches
          if ('caches' in window) {
            caches.keys().then(function(names) {
              console.log(`[LAYOUT] Found ${names.length} cache stores`);
              for(let name of names) {
                console.log('[LAYOUT] Deleting cache:', name);
                caches.delete(name);
              }
            });
          }
          
          // Delayed reload with cache busting
          console.log(`[LAYOUT] Reloading in 1 second... (attempt ${errorCount})`);
          setTimeout(() => {
            const timestamp = Date.now();
            window.location.href = `${window.location.pathname}?cachebust=${timestamp}`;
          }, 1000);
        } else {
          console.error('[LAYOUT] Too many reload attempts, stopping auto-reload');
          logClientError('max-reload-attempts', error, { errorCount });
        }
      };

      // Add global error handler for unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        console.error('[LAYOUT] Unhandled promise rejection:', event.reason);
        logClientError('unhandled-rejection', event.reason, {
          type: 'promise-rejection',
          debugInfo: getDebugInfo()
        });
        
        if (isTargetError(event.reason)) {
          handleTargetError(event.reason, 'promise-rejection');
          event.preventDefault(); // Prevent the error from bubbling up
        }
      });

      // Add global error handler for other errors
      window.addEventListener('error', (event) => {
        console.error('[LAYOUT] Global error:', event.error);
        logClientError('global-error', event.error, {
          type: 'error-event',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          debugInfo: getDebugInfo()
        });
        
        if (isTargetError(event.error)) {
          handleTargetError(event.error, 'error-event');
        }
      });
      
      // Additional monitoring for resource loading errors
      window.addEventListener('error', (event) => {
        if (event.target && event.target !== window) {
          console.warn('[LAYOUT] Resource loading error:', event.target.src || event.target.href);
          logClientError('resource-error', new Error('Resource failed to load'), {
            target: event.target.tagName,
            src: event.target.src,
            href: event.target.href
          });
        }
      }, true);
      
      console.log('[LAYOUT] Error handlers setup complete');
    }
  });
</script>

{#if mounted}
  {#if $navigating}
    <div class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    </div>
  {/if}

  <main>
    <slot />
  </main>
{:else}
  <div class="loading-overlay">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">Starting application...</div>
    </div>
  </div>
{/if}

<style>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease;
  }

  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(59, 130, 246, 0.3);
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    color: #e2e8f0;
    font-size: 0.9rem;
    font-weight: 500;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  main {
    min-height: 100vh;
  }
</style>