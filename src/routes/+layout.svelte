<script>
  import { navigating } from '$app/stores';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { forceSessionReset } from '$lib/deployment.js';

  // Global error handler for deployment-related issues
  onMount(() => {
    if (browser) {
      // Add global error handler for unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        if (event.reason?.message?.includes('Cannot read properties of undefined')) {
          console.log('Detected potential deployment session issue, clearing data...');
          forceSessionReset();
          // Prevent the error from bubbling up
          event.preventDefault();
          // Reload the page after a brief delay
          setTimeout(() => window.location.reload(), 500);
        }
      });

      // Add global error handler for other errors
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        if (event.error?.message?.includes('Cannot read properties of undefined')) {
          console.log('Detected potential deployment session issue, clearing data...');
          forceSessionReset();
          // Reload the page after a brief delay
          setTimeout(() => window.location.reload(), 500);
        }
      });
    }
  });
</script>

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