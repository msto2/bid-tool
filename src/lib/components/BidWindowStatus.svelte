<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let showCountdown = true;
  export let compact = false;
  
  let status = null;
  let loading = true;
  let error = null;
  let interval;
  let eventSource = null;
  
  async function fetchStatus() {
    try {
      const response = await fetch('/api/bid-window');
      if (response.ok) {
        status = await response.json();
        
        // Sync client-side settings with server settings
        if (status.settings) {
          // Update client-side bid window settings
          const { updateBidWindowSettings } = await import('$lib/bidWindow.js');
          updateBidWindowSettings(status.settings);
        }
        
        error = null;
      } else {
        throw new Error('Failed to fetch bid window status');
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    fetchStatus();
    
    // Update every minute
    interval = setInterval(fetchStatus, 60000);
    
    // Set up real-time updates for settings changes
    setupRealTimeUpdates();
  });
  
  function setupRealTimeUpdates() {
    if (typeof window === 'undefined') return; // Server-side check
    
    eventSource = new EventSource('/api/websocket');
    
    eventSource.onopen = () => {
      console.log('BidWindowStatus: SSE connection established');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'bid_window_settings_updated') {
          console.log('BidWindowStatus: Received settings update, refreshing status');
          // Immediately refresh the status when settings change
          fetchStatus();
        }
      } catch (error) {
        console.error('BidWindowStatus: Error parsing SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('BidWindowStatus: SSE connection error:', error);
    };
  }

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
    if (eventSource) {
      eventSource.close();
    }
  });
  
  $: statusClass = status?.allowed ? 'status-open' : 'status-closed';
</script>

{#if loading}
  <div class="status-container {compact ? 'compact' : ''}" class:loading>
    <div class="loading-spinner"></div>
    <span>Loading bid window status...</span>
  </div>
{:else if error}
  <div class="status-container {compact ? 'compact' : ''}" class:error>
    <span>⚠️ Error loading bid window status</span>
  </div>
{:else if status}
  <div class="status-container {compact ? 'compact' : ''}" class:open={status.allowed} class:closed={!status.allowed}>
    <div class="status-indicator">
      <div class="status-dot {statusClass}"></div>
      <span class="status-text">{status.statusText}</span>
    </div>
    
    {#if !compact}
      <div class="status-details">
        <div class="current-time">
          Current: {status.currentTimeText}
        </div>
        
        <div class="reason" class:open-reason={status.allowed}>
          {status.reason}
        </div>
        
        {#if !status.allowed && status.nextWindowText}
          <div class="next-window">
            {status.nextWindowText}
          </div>
        {/if}
        
        {#if showCountdown && status.timeUntilChange}
          <div class="countdown">
            Bidding {status.timeUntilChange.changeType} in: 
            <span class="countdown-time">{status.timeUntilChange.formattedTime}</span>
          </div>
        {/if}
      </div>
    {:else if showCountdown && status.timeUntilChange}
      <div class="compact-countdown">
        {status.timeUntilChange.changeType} in {status.timeUntilChange.formattedTime}
      </div>
    {/if}
  </div>
{/if}

<style>
  .status-container {
    background: rgba(30, 41, 59, 0.6);
    border-radius: 0.75rem;
    padding: 1rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }
  
  .status-container.compact {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
  
  .status-container.loading {
    border: 1px solid rgba(156, 163, 175, 0.3);
  }
  
  .status-container.error {
    border: 1px solid rgba(239, 68, 68, 0.5);
    background: rgba(239, 68, 68, 0.1);
  }
  
  .status-container.open {
    border: 1px solid rgba(34, 197, 94, 0.5);
    background: rgba(34, 197, 94, 0.1);
  }
  
  .status-container.closed {
    border: 1px solid rgba(239, 68, 68, 0.5);
    background: rgba(239, 68, 68, 0.1);
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .compact .status-indicator {
    margin-bottom: 0;
  }
  
  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .status-dot.status-open {
    background: #22c55e;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
    animation: pulse-green 2s infinite;
  }
  
  .status-dot.status-closed {
    background: #ef4444;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
    animation: pulse-red 2s infinite;
  }
  
  @keyframes pulse-green {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  @keyframes pulse-red {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  .status-text {
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  .compact .status-text {
    font-size: 0.875rem;
  }
  
  .status-details {
    display: grid;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #94a3b8;
  }
  
  .current-time {
    color: #60a5fa;
  }

  .bid-cycle {
    color: #a78bfa;
    font-size: 0.875rem;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 0.375rem;
    padding: 0.5rem;
    margin: 0.5rem 0;
  }
  
  .reason {
    color: #f87171;
    font-weight: 500;
  }

  .reason.open-reason {
    color: #4ade80;
  }
  
  .next-window {
    color: #34d399;
  }
  
  .countdown, .compact-countdown {
    color: #fbbf24;
    font-weight: 500;
  }
  
  .countdown-time {
    color: #60a5fa;
    font-weight: 700;
  }
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #374151;
    border-top: 2px solid #60a5fa;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading {
    display: flex;
    align-items: center;
    color: #94a3b8;
  }
  
  .error {
    color: #f87171;
  }
</style>