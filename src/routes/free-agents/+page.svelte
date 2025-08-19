<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import PositionFilter from '$lib/components/PositionFilter.svelte';
  import PlayerCard from '$lib/components/PlayerCard.svelte';
  import { checkAndClearOldAuth, getSignedInTeam } from '$lib/simple-auth-reset.js';

  export let data;
  
  let signedInTeam = null;
  let loadingPosition = false;
  let eventSource = null;

  // Reactive data management - updates when data prop changes
  $: freeAgents = data.freeAgents;
  $: currentPosition = data.currentPosition;
  $: selectedPosition = currentPosition || 'All';
  $: allPlayers = [...freeAgents];
  $: filteredPlayers = [...allPlayers];
  
  // Position-specific data cache
  let positionCache = {};
  $: {
    if (currentPosition && freeAgents.length > 0) {
      positionCache[currentPosition] = [...freeAgents];
    }
  }

  // Historical stats management
  let loadingHistoricalStats = {};
  let historicalStatsCache = {};
  
  // Notification system
  let notifications = [];
  let showBidSuccess = false;

  // Reactive filtering
  $: {
    if (selectedPosition === 'All') {
      filteredPlayers = allPlayers;
    } else {
      filteredPlayers = allPlayers.filter(player => player.position === selectedPosition);
    }
  }

  onMount(() => {
    // Check and clear old deployment data, then validate session
    if (browser) {
      try {
        // Clear old deployment data first
        checkAndClearOldAuth();
        
        // Get current signed in team
        signedInTeam = getSignedInTeam();
        
        if (!signedInTeam) {
          goto('/');
          return;
        }
        
        setupNotifications();
        
        // Pre-populate NFL players cache in background
        fetch('/api/nfl-players').catch(() => {
          // Silently ignore errors for background cache population
          console.log('Background NFL players cache population failed (this is non-critical)');
        });
      } catch (error) {
        console.log('Error in session check:', error);
        goto('/');
        return;
      }
    }
    
    // Cleanup on component destroy
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  });

  function setupNotifications() {
    if (!browser || eventSource) return;
    
    eventSource = new EventSource('/api/websocket');
    
    eventSource.onopen = () => {
      console.log('SSE connection established');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_bid' && data.message) {
          if (!data.message.includes(signedInTeam.name)) {
            addNotification(data.message);
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      if (eventSource?.readyState === EventSource.CLOSED) {
        setTimeout(() => {
          if (browser && signedInTeam) {
            eventSource = null;
            setupNotifications();
          }
        }, 3000);
      }
    };
  }
  
  function addNotification(message) {
    const notification = {
      id: Date.now(),
      message,
      timestamp: Date.now()
    };
    
    notifications = [notification, ...notifications];
    
    setTimeout(() => {
      notifications = notifications.filter(n => n.id !== notification.id);
    }, 5000);
  }
  
  function removeNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
  }

  function handleSignOut() {
    if (browser) {
      localStorage.removeItem('signedInTeam');
      goto('/');
    }
  }

  async function handlePositionChange(position) {
    if (loadingPosition) return;
    
    selectedPosition = position;
    loadingPosition = true;

    // Navigate to the new position URL, which will trigger a page reload with new data
    const url = new URL(window.location);
    if (position === 'All') {
      url.searchParams.delete('position');
    } else {
      url.searchParams.set('position', position);
    }
    
    try {
      await goto(url.pathname + url.search, { replaceState: true });
    } catch (error) {
      console.error('Error navigating to position:', error);
    } finally {
      loadingPosition = false;
    }
  }

  async function handlePlayerBid(player, contract) {
    if (!signedInTeam) return;

    const bid = {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      team: player.team,
      bidder: {
        teamId: signedInTeam.id,
        name: signedInTeam.name
      },
      contract: {
        years: contract.years,
        salary: contract.salary
      }
    };

    const response = await fetch('/api/bids', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bid)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit bid');
    }

    // Show success message
    showBidSuccess = true;
    setTimeout(() => {
      showBidSuccess = false;
    }, 2000);

    console.log(`Bid submitted: ${player.name} for ${contract.years} years at $${contract.salary}M by ${signedInTeam.name}`);
  }

  // Extract unique positions from all players for filter
  $: availablePositions = [...new Set(allPlayers.map(p => p.position))].sort();
</script>

<style>
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    margin: 0;
    padding: 0;
    color: #e2e8f0;
    min-height: 100vh;
    font-size: 14px;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  .header {
    margin-bottom: 2rem;
    position: relative;
  }

  .header-content {
    text-align: center;
  }

  .main-title {
    font-size: 2.25rem;
    font-weight: 800;
    background: linear-gradient(135deg, #3b82f6, #06b6d4, #10b981);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
  }

  .subtitle {
    color: #94a3b8;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .user-info {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
  }

  .team-name {
    color: #f1f5f9;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .nav-btn {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-block;
  }

  .nav-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .footer {
    margin-top: 4rem;
    padding: 1rem 0;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    display: flex;
    justify-content: flex-end;
  }

  .sign-out-btn {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sign-out-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .players-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .loading-state {
    text-align: center;
    padding: 3rem;
    color: #94a3b8;
  }

  .loading-spinner {
    display: inline-block;
    width: 32px;
    height: 32px;
    border: 3px solid rgba(148, 163, 184, 0.3);
    border-top: 3px solid #06b6d4;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .player-count {
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .no-players {
    text-align: center;
    color: #94a3b8;
    font-size: 1.1rem;
    margin-top: 3rem;
    padding: 3rem 2rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  .no-players-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  /* Success Toast */
  .success-toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
    z-index: 2000;
    animation: slideInToast 0.3s ease, slideOutToast 0.3s ease 1.7s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
  }

  /* Notifications */
  .notifications-container {
    position: fixed;
    top: 2rem;
    left: 2rem;
    z-index: 1500;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 300px;
  }

  .notification {
    background: rgba(59, 130, 246, 0.9);
    backdrop-filter: blur(10px);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
    animation: slideInNotification 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.85rem;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .notification-message {
    flex: 1;
  }

  .notification-close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    margin-left: 0.5rem;
    transition: color 0.2s ease;
  }

  .notification-close:hover {
    color: white;
  }

  @keyframes slideInNotification {
    from {
      opacity: 0;
      transform: translateX(-100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInToast {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutToast {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  @media (max-width: 768px) {
    .user-info {
      position: static;
      justify-content: center;
      margin-bottom: 1rem;
      transform: none;
      flex-wrap: wrap;
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .footer {
      justify-content: center;
    }

    .container {
      padding: 1rem;
    }

    .main-title {
      font-size: 1.75rem;
    }
  }
</style>

<div class="container">
  <div class="header">
    {#if signedInTeam}
      <div class="user-info">
        <a href="/" class="nav-btn" data-sveltekit-preload-data="hover">
          Home
        </a>
        <a href="/bids" class="nav-btn" data-sveltekit-preload-data="hover">
          View Bids
        </a>
      </div>
    {/if}
    
    <div class="header-content">
      <h1 class="main-title">Free Agent Market</h1>
      <p class="subtitle">Discover top available talent for your fantasy roster</p>
    </div>
  </div>

  <PositionFilter 
    bind:selectedPosition 
    loading={loadingPosition}
    onPositionChange={handlePositionChange} 
  />

  {#if loadingPosition}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading {selectedPosition === 'All' ? 'all players' : selectedPosition + ' players'}...</p>
    </div>
  {:else if filteredPlayers.length > 0}
    <div class="player-count">
      Showing {filteredPlayers.length} {selectedPosition === 'All' ? 'players' : selectedPosition + ' players'}
    </div>
    
    <div class="players-grid">
      {#each filteredPlayers as player (player.id)}
        <PlayerCard 
          {player} 
          onBid={handlePlayerBid}
          bind:loadingHistoricalStats
          bind:historicalStatsCache
        />
      {/each}
    </div>
  {:else}
    <div class="no-players">
      <div class="no-players-icon">🔍</div>
      <h3>No {selectedPosition === 'All' ? 'players' : selectedPosition + ' players'} found</h3>
      <p>Try selecting a different position or check back later.</p>
    </div>
  {/if}
  
  {#if signedInTeam}
    <div class="footer">
      <button class="sign-out-btn" on:click={handleSignOut}>
        Sign Out
      </button>
    </div>
  {/if}
</div>

<!-- Notifications -->
{#if notifications.length > 0}
  <div class="notifications-container">
    {#each notifications as notification (notification.id)}
      <div class="notification">
        <span class="notification-message">{notification.message}</span>
        <button class="notification-close" on:click={() => removeNotification(notification.id)}>×</button>
      </div>
    {/each}
  </div>
{/if}

<!-- Success Toast -->
{#if showBidSuccess}
  <div class="success-toast">
    <span>✅</span>
    Bid submitted successfully!
  </div>
{/if}