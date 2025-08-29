<script>
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  export let fallback = '';
  
  let mounted = false;
  
  onMount(() => {
    console.log('[CLIENT ONLY] Component mounting...');
    mounted = true;
  });
</script>

{#if browser && mounted}
  <slot />
{:else if fallback}
  {@html fallback}
{:else}
  <!-- Loading placeholder -->
  <div class="client-only-loading">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">Loading...</div>
    </div>
  </div>
{/if}

<style>
  .client-only-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 8px;
  }
  
  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(59, 130, 246, 0.3);
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    color: #94a3b8;
    font-size: 0.9rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>