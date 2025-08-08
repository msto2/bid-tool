<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  // @ts-ignore
  export let data;
  let freeAgentsByPosition = data.freeAgentsByPosition;
  $: positions = Object.keys(freeAgentsByPosition);

  let signedInTeam = null;

  onMount(() => {
    // Check if user is signed in
    if (browser) {
      const savedTeam = localStorage.getItem('signedInTeam');
      if (!savedTeam) {
        goto('/');
        return;
      }
      
      try {
        signedInTeam = JSON.parse(savedTeam);
        // Check if authentication is still valid (optional: add expiration)
        const signedInAt = signedInTeam.signedInAt;
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (now - signedInAt > maxAge) {
          localStorage.removeItem('signedInTeam');
          goto('/');
          return;
        }
        
        // Set up SSE connection for notifications
        setupNotifications();
      } catch (error) {
        localStorage.removeItem('signedInTeam');
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
    if (!browser || eventSource) return; // Prevent duplicate connections
    
    eventSource = new EventSource('/api/websocket');
    
    eventSource.onopen = () => {
      console.log('SSE connection established');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_bid' && data.message) {
          // Only show notification if it's not from the current user
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
      // Auto-reconnect after a short delay if connection is lost
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
    
    // Auto-remove notification after 5 seconds
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

  const statLabelsPassing = {
    passingCompletions: "Passing Completions",
    passingAttempts: "Passing Attempts",
    passingCompletionPercentage: "Completion Percentage",
    passingYards: "Passing Yards",
    passingTouchdowns: "Passing Touchdowns",
    passingInterceptions: "Interceptions",
    passing40PlusYardTD: "40+ Yard Passing TDs",
    passing50PlusYardTD: "50+ Yard Passing TDs",
    passing300To399YardGame: "300-399 Passing Yard Games",
    passing400PlusYardGame: "400+ Yard Games"
  }
  const statLabelsRushing = {
    rushingAttempts: "Rushing Attempts",
    rushingYards: "Rushing Yards",
    rushingYardsPerAttempt: "Yards per Carry",
    rushingTouchdowns: "Rushing Touchdowns",
    rushing40PlusYardTD: "40+ Yard Rushing TDs",
    rushing50PlusYardTD: "50+ Yard Rushing TDs",
    rushing100To199YardGame: "100-199 Yard Games",
    rushing200PlusYardGame: "200+ Yard Games"
  }

    const statLabelReceiving = {
    receivingTargets: "Targets",
    receivingReceptions: "Receptions",
    receivingYards: "Receiving Yards",
    receivingYardsPerReception: "Yards per Reception",
    receivingTouchdowns: "Receiving Touchdowns",
    receiving40PlusYardTD: "40+ Yard Receiving TDs",
    receiving50PlusYardTD: "50+ Yard Receiving TDs",
    receiving100To199YardGame: "100-199 Yard Games (Receiving)"
  }

  function getRelevantStatLabels(position) {
    switch(position) {
      case 'QB':
        return {...statLabelsPassing, ...statLabelsRushing};
      case 'RB':
        return {...statLabelsRushing, ...statLabelReceiving};
      case 'WR':
      case 'TE':
        return statLabelReceiving;
      default:
        return {};
    }
  }

  function getOrderedStats(stats, position) {
    const labels = getRelevantStatLabels(position);
    const labelKeys = Object.keys(labels);
    
    // Filter stats to only include those that have labels and exist in the data
    const orderedEntries = labelKeys
      .filter(key => stats.hasOwnProperty(key) && stats[key] !== null && stats[key] !== undefined)
      .map(key => [key, stats[key]]);
    
    return orderedEntries;
  }
  
  let selectedPlayer = null;
  let showAddModal = false;
  let years = 1;
  let salary = 1;
  let loadingHistoricalStats = {};
  let historicalStatsCache = {};
  let showBidSuccess = false;
  let errorMessage = '';
  
  // Notification system
  let notifications = [];
  let eventSource = null;
  
  // @ts-ignore
  function openAddModal(player) {
    selectedPlayer = player;
    showAddModal = true;
    years = 1;
    salary = 1;
  }
  
  function closeAddModal() {
    showAddModal = false;
    selectedPlayer = null;
    years = 1;
    salary = 1;
    errorMessage = '';
  }
  
  async function addPlayer() {
    if (!selectedPlayer || !signedInTeam) return;

    // Create bid object
    const bid = {
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      position: selectedPlayer.position,
      team: selectedPlayer.team,
      bidder: {
        teamId: signedInTeam.id,
        name: signedInTeam.name
      },
      contract: {
        years: years,
        salary: salary
      }
    };

    try {
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

      // Show success message briefly
      showBidSuccess = true;
      setTimeout(() => {
        showBidSuccess = false;
      }, 2000);

      console.log(`Bid submitted: ${selectedPlayer.name} for ${years} years at $${salary}M by ${signedInTeam.name}`);
      closeAddModal();
      
    } catch (error) {
      console.error('Error saving bid:', error);
      errorMessage = error.message || 'Failed to save bid. Please try again.';
    }
  }

  async function fetchHistoricalStats(playerId) {
    if (historicalStatsCache[playerId] || loadingHistoricalStats[playerId]) {
      return historicalStatsCache[playerId] || null;
    }

    loadingHistoricalStats[playerId] = true;
    loadingHistoricalStats = { ...loadingHistoricalStats }; // Trigger reactivity

    try {
      const response = await fetch(`/api/player-stats/${playerId}`);
      if (response.ok) {
        const data = await response.json();
        historicalStatsCache[playerId] = data.historicalStats;
        console.log(data)
        return historicalStatsCache[playerId];
      }
    } catch (error) {
      console.error('Error fetching historical stats:', error);
    } finally {
      loadingHistoricalStats[playerId] = false;
      loadingHistoricalStats = { ...loadingHistoricalStats }; // Trigger reactivity
    }

    return null;
  }

  async function handleDetailsToggle(event, player) {
    if (event.target.open && player.id && !historicalStatsCache[player.id]) {
      const stats = await fetchHistoricalStats(player.id);
      if (stats) {
        // Update the player object with historical stats
        player.historicalStats = stats;
        // Trigger reactivity by reassigning the freeAgentsByPosition
        freeAgentsByPosition = { ...freeAgentsByPosition };
      }
    }
  }
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
    text-align: center;
    margin-bottom: 2rem;
    position: relative;
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
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(30, 41, 59, 0.9);
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  .team-name {
    color: #f1f5f9;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .sign-out-btn, .nav-btn {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-block;
  }

  .nav-btn {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }

  .sign-out-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .nav-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
  }

  @media (max-width: 768px) {
    .user-info {
      position: static;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 2.5rem 0 1rem;
    color: #f1f5f9;
    position: relative;
    padding-left: 1rem;
  }

  .section-title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 1.5rem;
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    border-radius: 2px;
  }

  .players-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .player-card {
    background: rgba(30, 41, 59, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    padding: .5rem 1rem .25rem 1rem;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    display: grid;
    grid-template-columns: 1fr;
    gap: .25rem;
  }

  .player-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
  }

  .player-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .player-info {
    flex: 1;
    padding-right: .5rem;
  }

  .player-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.25rem;
  }

  .player-team {
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .add-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    font-size: 1.25rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
  }

  .add-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 5px 20px rgba(16, 185, 129, 0.5);
    background: linear-gradient(135deg, #059669, #047857);
  }

  .player-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .stat-item {
    background: rgba(15, 23, 42, 0.6);
    border-radius: 6px;
    padding: 0.6rem;
    text-align: center;
  }

  .stat-label {
    font-size: 0.65rem;
    color: #94a3b8;
    margin-bottom: 0.25rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.2;
  }

  .stat-value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #06b6d4;
  }

  .stat-breakdown {
    padding-top: 0.5rem;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
  }

  .breakdown-toggle {
    background: none;
    border: none;
    color: #06b6d4;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0;
    margin-bottom: 0.75rem;
    transition: color 0.2s ease;
  }

  .breakdown-toggle:hover {
    color: #0891b2;
  }

  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 0.5rem;
    margin: 0.5rem 0;
  }

  .breakdown-item {
    background: rgba(15, 23, 42, 0.4);
    border-radius: 6px;
    text-align: center;
    min-height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .breakdown-item:hover {
    background: rgba(15, 23, 42, 0.6);
  }

  .breakdown-name {
    font-size: 0.65rem;
    color: #94a3b8;
    margin-bottom: 0.3rem;
    font-weight: 500;
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .breakdown-value {
    font-size: 0.85rem;
    font-weight: 700;
    color: #e2e8f0;
    line-height: 1;
  }

  /* Desktop optimizations */
  @media (min-width: 1024px) {
    .breakdown-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.6rem;
      max-width: none;
    }

    .breakdown-item {
      min-height: 65px;
    }

    .breakdown-name {
      font-size: 0.7rem;
    }

    .breakdown-value {
      font-size: 0.9rem;
    }
  }

  /* Tablet optimizations */
  @media (min-width: 768px) and (max-width: 1023px) {
    .breakdown-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }

    .breakdown-item {
      min-height: 55px;
    }
  }

  /* Mobile optimizations */
  @media (max-width: 767px) {
    .breakdown-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.4rem;
    }

    .breakdown-item {
      padding: 0.5rem 0.3rem;
      min-height: 50px;
    }

    .breakdown-name {
      font-size: 0.6rem;
      margin-bottom: 0.2rem;
    }

    .breakdown-value {
      font-size: 0.8rem;
    }
  }

  .breakdown-section-title {
    margin: 0.75rem 0 0.4rem;
    font-weight: 600;
    color: #06b6d4;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal {
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 16px;
    padding: 1.75rem;
    max-width: 350px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
  }

  .modal-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.4rem;
  }

  .modal-subtitle {
    color: #94a3b8;
    font-size: 0.8rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 0.4rem;
  }

  .form-select {
    width: 100%;
    padding: 0.65rem;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .form-select:focus {
    outline: none;
    border-color: #06b6d4;
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.65rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    box-shadow: 0 3px 12px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 16px rgba(59, 130, 246, 0.4);
  }

  .btn-secondary {
    background: rgba(148, 163, 184, 0.2);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .btn-secondary:hover {
    background: rgba(148, 163, 184, 0.3);
    color: #e2e8f0;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
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

  /* Desktop Layout */
  @media (min-width: 1024px) {
    .player-card {
      grid-template-columns: 1fr auto;
      align-items: center;
    }

    .player-content {
      display: flex;
      align-items: center;
      gap: 2rem;
      width: 100%;
    }

    .player-stats {
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      min-width: 320px;
    }
  }

  /* Mobile optimizations */
  @media (max-width: 480px) {
    .main-title {
      font-size: 1.75rem;
    }
    
    .container {
      padding: 1rem;
    }

    .player-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .stat-item {
      padding: 0.5rem;
    }

    .stat-label {
      font-size: 0.6rem;
    }

    .stat-value {
      font-size: 0.85rem;
    }
  }
</style>

<div class="container">
  <div class="header">
    {#if signedInTeam}
      <div class="user-info">
        <span class="team-name">{signedInTeam.name}</span>
        <a href="/bids" class="nav-btn" data-sveltekit-preload-data="hover">
          View Bids
        </a>
        <button class="sign-out-btn" on:click={handleSignOut}>
          Sign Out
        </button>
      </div>
    {/if}
    
    <h1 class="main-title">Free Agent Market</h1>
    <p class="subtitle">Discover top available talent for your fantasy roster</p>
  </div>

  {#each positions as position}
    <div>
      <h2 class="section-title">{position}</h2>
      <div class="players-grid">
        {#each freeAgentsByPosition[position] as player}
          <div class="player-card">
            <div class="player-content">
              <div class="player-header">
                <div class="player-info">
                  <div class="player-name">{player.name}</div>
                  <div class="player-team">{player.position} • {player.team}</div>
                </div>
                <button class="add-btn" on:click={() => openAddModal(player)}>+</button>
              </div>

              <div class="player-stats">
                <div class="stat-item">
                  <div class="stat-label">Season Proj</div>
                  <div class="stat-value">{player.projected_points}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Week Proj</div>
                  <div class="stat-value">{player.projected_avg_points}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Total Pts</div>
                  <div class="stat-value">{player.total_points}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Avg Pts</div>
                  <div class="stat-value">{player.avg_points}</div>
                </div>
              </div>
            </div>

            
            <div></div>
            {#if player.stats}
              <div class="stat-breakdown">
                <details on:toggle={(e) => handleDetailsToggle(e, player)}>
                  <summary class="breakdown-toggle">📊 Detailed Stats</summary>
                  
                  {#if Object.keys(getRelevantStatLabels(player.position)).length > 0}
                    <!-- Projected Stats -->
                    {#if player.stats.projected_breakdown}
                      <div class="breakdown-section-title">Projected Stats</div>
                      <div class="breakdown-grid">
                        {#each getOrderedStats(player.stats.projected_breakdown, player.position) as [statName, value]}
                          <div class="breakdown-item">
                            <div class="breakdown-name">{getRelevantStatLabels(player.position)[statName]}</div>
                            <div class="breakdown-value">
                              {statName === 'passingCompletionPercentage' ? `${Math.round((value*100))}%` : 
                               statName === 'rushingYardsPerAttempt' || statName === 'receivingYardsPerReception' ? Math.round(value * 10) / 10 : 
                               Math.round(value)}
                            </div>
                          </div>
                        {/each}
                      </div>
                    {/if}

                    <!-- Current Season Stats -->
                    {#if player.stats.breakdown}
                      <div class="breakdown-section-title">Current Season Stats</div>
                      <div class="breakdown-grid">
                        {#each getOrderedStats(player.stats.breakdown, player.position) as [statName, value]}
                          <div class="breakdown-item">
                            <div class="breakdown-name">{getRelevantStatLabels(player.position)[statName]}</div>
                            <div class="breakdown-value">
                              {statName === 'passingCompletionPercentage' ? `${Math.round((value*100))}%` : 
                               statName === 'rushingYardsPerAttempt' || statName === 'receivingYardsPerReception' ? Math.round(value * 10) / 10 : 
                               Math.round(value)}
                            </div>
                          </div>
                        {/each}
                      </div>
                    {/if}

                    <!-- Historical Stats -->
                    {#if player.historicalStats && player.historicalStats.length > 0}
                      <div class="breakdown-section-title">Previous Seasons</div>
                      {#each player.historicalStats as yearStats}
                        <div class="breakdown-section-title">{yearStats.year} Season</div>
                        <div class="breakdown-grid">
                          {#each getOrderedStats(yearStats.stats, player.position) as [statName, value]}
                            <div class="breakdown-item">
                              <div class="breakdown-name">{getRelevantStatLabels(player.position)[statName]}</div>
                              <div class="breakdown-value">
                                {statName === 'passingCompletionPercentage' ? `${Math.round((value*100))}%` : 
                                 statName === 'rushingYardsPerAttempt' || statName === 'receivingYardsPerReception' ? Math.round(value * 10) / 10 : 
                                 Math.round(value)}
                              </div>
                            </div>
                          {/each}
                        </div>
                      {/each}
                    {:else if loadingHistoricalStats[player.id]}
                      <div class="breakdown-section-title">Loading Historical Stats...</div>
                      <div style="text-align: center; padding: 1rem; color: #94a3b8;">
                        <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(148, 163, 184, 0.3); border-top: 2px solid #06b6d4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                      </div>
                    {/if}
                  {:else}
                    <!-- Fallback for other positions (defensive players, kickers) -->
                    {#if player.stats.projected_breakdown}
                      <div class="breakdown-section-title">Projected Stats</div>
                      <div class="breakdown-grid">
                        {#each Object.entries(player.stats.projected_breakdown).filter(([k]) => isNaN(parseInt(k))) as [statName, value]}
                          <div class="breakdown-item">
                            <div class="breakdown-name">{statName}</div>
                            <div class="breakdown-value">{Math.round(value) || value}</div>
                          </div>
                        {/each}
                      </div>
                    {/if}

                    {#if player.stats.breakdown}
                      <div class="breakdown-section-title">Current Season Stats</div>
                      <div class="breakdown-grid">
                        {#each Object.entries(player.stats.breakdown).filter(([k]) => isNaN(parseInt(k))) as [statName, value]}
                          <div class="breakdown-item">
                            <div class="breakdown-name">{statName}</div>
                            <div class="breakdown-value">{Math.round(value) || value}</div>
                          </div>
                        {/each}
                      </div>
                    {/if}

                    <!-- Historical Stats for other positions -->
                    {#if player.historicalStats && player.historicalStats.length > 0}
                      <div class="breakdown-section-title">Previous Seasons</div>
                      {#each player.historicalStats as yearStats}
                        <div class="breakdown-section-title">{yearStats.year} Season</div>
                        <div class="breakdown-grid">
                          {#each Object.entries(yearStats.stats).filter(([k]) => isNaN(parseInt(k))) as [statName, value]}
                            <div class="breakdown-item">
                              <div class="breakdown-name">{statName}</div>
                              <div class="breakdown-value">{Math.round(value) || value}</div>
                            </div>
                          {/each}
                        </div>
                      {/each}
                    {:else if loadingHistoricalStats[player.id]}
                      <div class="breakdown-section-title">Loading Historical Stats...</div>
                      <div style="text-align: center; padding: 1rem; color: #94a3b8;">
                        <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(148, 163, 184, 0.3); border-top: 2px solid #06b6d4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                      </div>
                    {/if}
                  {/if}
                </details>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

{#if showAddModal && selectedPlayer}
  <div class="modal-overlay" on:click={closeAddModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <div class="modal-title">{selectedPlayer.name}</div>
        <div class="modal-subtitle">{selectedPlayer.position} • {selectedPlayer.team}</div>
      </div>

      <div class="form-group">
        <label class="form-label" for="years">Contract Length</label>
        <select class="form-select" id="years" bind:value={years}>
          <option value={1}>1 Year</option>
          <option value={2}>2 Years</option>
          <option value={3}>3 Years</option>
          <option value={4}>4 Years</option>
          <option value={5}>5 Years</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="salary">Annual Salary (Million $)</label>
        <select class="form-select" id="salary" bind:value={salary}>
          {#each Array.from({length: 50}, (_, i) => i + 1) as amount}
            <option value={amount}>${amount}M</option>
          {/each}
        </select>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" on:click={addPlayer}>
          Place Bid
        </button>
        <button class="btn btn-secondary" on:click={closeAddModal}>Cancel</button>
      </div>

      {#if errorMessage}
        <div style="color: #ef4444; font-size: 0.8rem; text-align: center; margin-top: 1rem;">
          {errorMessage}
        </div>
      {/if}
    </div>
  </div>
{/if}

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