<script>
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  // Import the actual page component
  import HomePage from './HomePage.svelte';
  
  export let data;
  
  let mounted = false;
  let loadError = null;
  
  onMount(() => {
    console.log('[CLIENT PAGE] Client-only page mounting...');
    console.log('[CLIENT PAGE] Data received:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : 'none',
      teamsLength: data?.teams?.length || 0
    });
    
    try {
      mounted = true;
    } catch (error) {
      console.error('[CLIENT PAGE] Mount error:', error);
      loadError = error;
    }
  });
</script>

{#if browser}
  {#if loadError}
    <div class="error-container">
      <h1>Loading Error</h1>
      <p>Failed to load the page: {loadError.message}</p>
      <button onclick="window.location.reload()">Reload</button>
    </div>
  {:else if mounted}
    <HomePage {data} />
  {:else}
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">Starting application...</div>
      </div>
    </div>
  {/if}
{:else}
  <div class="loading-container">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">Loading...</div>
    </div>
  </div>
{/if}

<style>
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #e2e8f0;
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
    font-size: 1rem;
    font-weight: 500;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-container h1 {
    color: #ef4444;
    margin-bottom: 1rem;
  }
  
  .error-container button {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    margin-top: 1rem;
  }
</style>