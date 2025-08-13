<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import PlayerCard from './PlayerCard.svelte';
  
  export let player = null;
  export let show = false;

  const dispatch = createEventDispatcher();
  
  let playerForCard = null;
  let loadingHistoricalStats = {};
  let historicalStatsCache = {};
  let loadingStats = false;
  let statsError = null;
  let currentStatsPlayerId = null;
  let playerFreeAgentStatus = null;
  let loadingFreeAgentStatus = false;
  let signedInTeam = null;
  let showBidModal = false;
  let years = 1;
  let salary = 1;
  let errorMessage = '';
  let showBidSuccess = false;
  let showBidButton = false;

  // Load signed in team from localStorage
  onMount(() => {
    if (browser) {
      const savedTeam = localStorage.getItem('signedInTeam');
      if (savedTeam) {
        try {
          signedInTeam = JSON.parse(savedTeam);
        } catch (error) {
          console.error('Error parsing signed in team:', error);
        }
      }
    }
  });

  async function fetchPlayerStats(playerId) {
    if (!playerId || currentStatsPlayerId === playerId) return; // Don't fetch if already loaded for this player
    
    loadingStats = true;
    statsError = null;
    
    try {
      // Fetch detailed player data, historical stats, and projected stats from external API in parallel
      const [playerDetailsResponse, statsResponse, projectedStatsResponse] = await Promise.all([
        fetch(`/api/nfl-players?playerId=${playerId}`),
        fetch(`/api/player-stats/${playerId}`),
        fetch(`http://localhost:8000/playerinfo?playerId=${playerId}`)
      ]);
      
      let detailedPlayerData = { position: null, team: null, teamName: null };
      let historicalStats = [];
      let projectedStatsData = null;

      // Get detailed player data
      if (playerDetailsResponse.ok) {
        detailedPlayerData = await playerDetailsResponse.json();
      }

      // Get historical stats
      if (statsResponse.ok) {
        const rawData = await statsResponse.json();
        historicalStats = rawData.historicalStats || [];
      }

      // Get projected stats from external API
      if (projectedStatsResponse.ok) {
        const projectedData = await projectedStatsResponse.json();
        // Extract the first player from the array (playerinfo returns array)
        if (projectedData && projectedData.length > 0) {
          projectedStatsData = projectedData[0];
        }
      }
      
      // Extract projected breakdown from the correct nested path
      let projectedBreakdown = projectedStatsData?.stats?.projected_breakdown;
      
      // If that's empty, try the nested path: stats.breakdown.projected_breakdown
      if (!projectedBreakdown || Object.keys(projectedBreakdown).length === 0) {
        projectedBreakdown = projectedStatsData?.stats?.breakdown?.projected_breakdown;
      }
      
      // If still empty, try using the stats.breakdown object directly
      if (!projectedBreakdown || Object.keys(projectedBreakdown).length === 0) {
        const statsBreakdown = projectedStatsData?.stats?.breakdown || {};
        const filteredStats = {};
        
        // Copy over fields that look like actual stats (exclude metadata fields)
        Object.keys(statsBreakdown).forEach(key => {
          if (key !== 'breakdown' && key !== 'projected_breakdown' && 
              key !== 'avg_points' && key !== 'points' && key !== 'projected_avg_points' && key !== 'projected_points') {
            filteredStats[key] = statsBreakdown[key];
          }
        });
        
        projectedBreakdown = filteredStats;
      }
      
      // Transform player data to match PlayerCard expectations with corrected position/team data
      playerForCard = {
        ...player,
        // Override with correct position and team data from detailed API
        position: detailedPlayerData.position || player.position,
        team: detailedPlayerData.team || player.team || 'FA',
        teamName: detailedPlayerData.teamName || player.teamName || 'Free Agent',
        stats: {
          // Add empty current stats since we don't have them
          breakdown: null,
          // Use projected stats from external API if available
          projected_breakdown: projectedBreakdown || null
        },
        historicalStats: historicalStats,
        // Use projected stats data if available, otherwise fallback to player data
        projected_points: projectedStatsData?.projected_points || player.projected_points || 0,
        projected_avg_points: projectedStatsData?.projected_avg_points || player.projected_avg_points || 0,
        total_points: projectedStatsData?.total_points || player.total_points || 0,
        avg_points: projectedStatsData?.avg_points || player.avg_points || 0
      };

      // Also update the original player object for modal header display
      player = {
        ...player,
        position: detailedPlayerData.position || player.position,
        team: detailedPlayerData.team || player.team || 'FA',
        teamName: detailedPlayerData.teamName || player.teamName || 'Free Agent'
      };
      
      
      // Check free agent status using ESPN roster data
      await checkPlayerFreeAgentStatus(playerId);
      
      currentStatsPlayerId = playerId;
    } catch (error) {
      console.error('Error fetching player data:', error);
      statsError = 'Error loading player data';
    } finally {
      loadingStats = false;
    }
  }

  function closeModal() {
    show = false;
    dispatch('close');
    // Reset stats when closing
    playerForCard = null;
    statsError = null;
    currentStatsPlayerId = null;
    playerFreeAgentStatus = null;
    loadingFreeAgentStatus = false;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  // Fetch stats when player changes and modal is shown
  $: if (show && player?.id) {
    fetchPlayerStats(player.id);
  }

  // Handle bidding functionality for both PlayerCard and modal header button
  async function handlePlayerBid(player, contract) {
    if (!signedInTeam) return;

    // Convert player ID to number to match external API format
    const playerId = parseInt(player.id);
    if (isNaN(playerId)) {
      throw new Error('Invalid player ID - cannot convert to number');
    }

    const bid = {
      playerId: playerId,
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

    console.log('Submitting bid from PlayerModal:', bid);
    console.log('Player object:', player);
    console.log('Player ID type:', typeof player.id, 'Player ID value:', player.id);

    const response = await fetch('/api/bids', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bid)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Bid submission failed:', errorData);
      throw new Error(errorData.error || 'Failed to submit bid');
    }

    // Show success message
    showBidSuccess = true;
    setTimeout(() => {
      showBidSuccess = false;
    }, 2000);

    console.log(`Bid submitted: ${player.name} for ${contract.years} years at $${contract.salary}M by ${signedInTeam.name}`);
  }

  function openBidModal() {
    showBidModal = true;
    years = 1;
    salary = 1;
    errorMessage = '';
  }

  function closeBidModal() {
    showBidModal = false;
    years = 1;
    salary = 1;
    errorMessage = '';
  }

  async function submitBid() {
    if (!player) return;
    
    try {
      await handlePlayerBid(player, { years, salary });
      closeBidModal();
    } catch (error) {
      errorMessage = error.message || 'Failed to submit bid. Please try again.';
    }
  }


  // Check if player is actually a free agent using ESPN roster data
  async function checkPlayerFreeAgentStatus(playerId) {
    if (!playerId) return false;
    
    // Return cached result if available
    if (playerFreeAgentStatus && playerFreeAgentStatus.playerId == playerId) {
      return playerFreeAgentStatus.isFreeAgent;
    }
    
    loadingFreeAgentStatus = true;
    
    try {
      const response = await fetch(`http://localhost:8000/player-free-agent-status/${playerId}`);
      if (response.ok) {
        const statusData = await response.json();
        playerFreeAgentStatus = statusData;
        return statusData.isFreeAgent;
      }
    } catch (error) {
      console.error('Error checking player free agent status:', error);
    } finally {
      loadingFreeAgentStatus = false;
    }
    
    // Fallback to basic logic if API fails
    return isPlayerFreeAgentFallback(player);
  }

  // Fallback logic for determining free agent status
  function isPlayerFreeAgentFallback(player) {
    if (!player) return false;
    
    // If we can't reach the API, assume they are a free agent
    // This is safer than blocking bidding entirely
    // The real check should always be done via the ESPN roster API
    return true;
  }

  // Determine if player is available for bidding (free agent)
  function isPlayerFreeAgent(player) {
    if (!player || !player.id) return false;
    
    // If we have cached status for this player, use it
    if (playerFreeAgentStatus && playerFreeAgentStatus.playerId == player.id) {
      return playerFreeAgentStatus.isFreeAgent;
    }
    
    // While loading or if no cached data, don't show button yet
    // This prevents the button from disappearing when NFL team data loads
    return false;
  }

  // Reactive statement to determine if bid button should show
  $: {
    showBidButton = signedInTeam && 
                    playerFreeAgentStatus && 
                    playerFreeAgentStatus.playerId == player?.id && // Use == for type coercion
                    playerFreeAgentStatus.isFreeAgent;
  
  }
</script>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    box-sizing: border-box;
  }

  .modal-content {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    max-width: 40rem;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    animation: modalSlideIn 0.3s ease;
  }

  .modal-header {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
  }

  .player-headshot {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: #3b82f6;
    flex-shrink: 0;
  }

  .player-basic-info {
    flex: 1;
  }

  .player-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #e2e8f0;
    margin-bottom: 0.25rem;
  }

  .player-team-position {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .position-badge {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .team-info {
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .jersey-number {
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .close-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .add-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
    margin-left: auto;
  }

  .add-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 5px 20px rgba(16, 185, 129, 0.5);
    background: linear-gradient(135deg, #059669, #047857);
  }

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
    z-index: 3000;
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

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.4rem;
    text-align: center;
  }

  .modal-subtitle {
    color: #94a3b8;
    font-size: 0.8rem;
    text-align: center;
    margin-bottom: 1.5rem;
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

  .success-toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
    z-index: 4000;
    animation: slideInToast 0.3s ease, slideOutToast 0.3s ease 1.7s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
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

  .modal-body {
    padding: 1.5rem;
  }

  .breakdown-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
    margin: 0 auto 1.5rem auto;
  }

  .breakdown-item {
    background: rgba(15, 23, 42, 0.4);
    border-radius: 6px;
    text-align: center;
    min-height: 40px;
    max-height: 60px;
    width: 6rem;
    padding: 0 0.1rem 0 0.1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background-color 0.2s ease;
    flex-shrink: 0;
  }

  .breakdown-item:hover {
    background: rgba(15, 23, 42, 0.6);
  }

  .breakdown-name {
    font-size: 0.55rem;
    color: #94a3b8;
    margin-bottom: 0.2rem;
    font-weight: 500;
    line-height: 1.0;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }

  .breakdown-value {
    font-size: 0.75rem;
    font-weight: 700;
    color: #e2e8f0;
    line-height: 1;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-active {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .status-inactive {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .bio-section {
    background: rgba(30, 41, 59, 0.3);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }

  .bio-title {
    color: #e2e8f0;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .bio-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }

  .bio-item:last-child {
    border-bottom: none;
  }

  .bio-label {
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .bio-value {
    color: #e2e8f0;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .stats-title {
    color: #e2e8f0;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .loading-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .stats-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(148, 163, 184, 0.3);
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .stats-error {
    color: #ef4444;
    font-size: 0.85rem;
    text-align: center;
    padding: 1rem;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .player-card-container {
    background: none;
    border: none;
    padding: 0;
  }

  /* Override PlayerCard styles for modal context */
  .player-card-container :global(.player-card) {
    background: transparent;
    border: none;
    padding: 0;
    box-shadow: none;
    margin: 0;
  }

  .player-card-container :global(.categories-row) {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }

  .player-card-container :global(.player-header) {
    display: none; /* Hide header since we show it in modal header */
  }

  /* Show bid button only for free agents */
  .player-card-container :global(.add-btn) {
    /* Button will be visible by default, but only show for free agents based on PlayerCard logic */
  }

  .player-card-container :global(.player-stats) {
    display: none; /* Hide basic stats since we show them in modal body */
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Desktop optimizations */
  @media (min-width: 1024px) {
    .breakdown-grid {
      gap: 0.3rem;
    }

    .breakdown-name {
      font-size: 0.6rem;
    }

    .breakdown-value {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 768px) {
    .add-btn {
      margin-right: 1rem;
    }
    .modal-content {
      margin: 0.5rem;
      max-height: 97vh;
      max-width: 100%;
    }
    
    .breakdown-grid {
      gap: 0.25rem;
      margin: 0;
    }

    .breakdown-item {
      min-height: 45px;
      width: 3.5rem;
    }

    .breakdown-name {
      font-size: 0.5rem;
      margin-bottom: 0.15rem;
    }

    .breakdown-value {
      font-size: 0.7rem;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-body {
      padding: 0 1rem .5rem 1rem;
    }

    .player-name {
      font-size: 1.1rem;
    }
  }
</style>

{#if show && player}
  <div
    class="modal-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
  >
    <div class="modal-content">
      <div class="modal-header">
        
        <div class="player-basic-info">
          <div class="player-name">{player.name}</div>
          <div class="player-team-position">
            <span class="position-badge">{(player.position && player.position !== 'N/A') ? player.position : 'Unknown Position'}</span>
            <span class="team-info">{player.teamName || player.team || 'Free Agent'}</span>
          </div>
          {#if player.jersey}
            <div class="jersey-number">#{player.jersey}</div>
          {/if}
        </div>

        {#if showBidButton}
          <button class="add-btn" on:click={openBidModal}>+</button>
        {/if}

        <button class="close-button" on:click={closeModal}>×</button>
      </div>

      <div class="modal-body">
        <div class="breakdown-grid">
          {#if player.age}
            <div class="breakdown-item">
              <div class="breakdown-name">Age</div>
              <div class="breakdown-value">{player.age}</div>
            </div>
          {/if}

          {#if player.height}
            <div class="breakdown-item">
              <div class="breakdown-name">Height</div>
              <div class="breakdown-value">{player.height}</div>
            </div>
          {/if}

          {#if player.weight}
            <div class="breakdown-item">
              <div class="breakdown-name">Weight</div>
              <div class="breakdown-value">{player.weight}</div>
            </div>
          {/if}

          {#if player.experience !== undefined}
            <div class="breakdown-item">
              <div class="breakdown-name">Experience</div>
              <div class="breakdown-value">
                {player.experience === 0 ? 'Rookie' : `${player.experience} years`}
              </div>
            </div>
          {/if}
        </div>

        <!-- Player Statistics Section -->
        <div class="stats-section">
          
          {#if loadingStats}
            <div class="loading-stats">
              <div class="stats-spinner"></div>
              Loading player statistics...
            </div>
          {:else if statsError}
            <div class="stats-error">
              {statsError}
            </div>
          {:else if playerForCard}
            <div class="player-card-container">
              <PlayerCard 
                player={playerForCard} 
                onBid={isPlayerFreeAgent(playerForCard) ? handlePlayerBid : null}
                bind:loadingHistoricalStats
                bind:historicalStatsCache
              />
            </div>
          {:else}
            <div class="stats-error">
              No statistics available for this player
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Bid Modal -->
{#if showBidModal}
  <div class="modal-overlay" on:click={closeBidModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-title">{player.name}</div>
      <div class="modal-subtitle">{player.position} • {player.teamName || player.team || 'Free Agent'}</div>

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
        <button class="btn btn-primary" on:click={submitBid}>
          Place Bid
        </button>
        <button class="btn btn-secondary" on:click={closeBidModal}>Cancel</button>
      </div>

      {#if errorMessage}
        <div style="color: #ef4444; font-size: 0.8rem; text-align: center; margin-top: 1rem;">
          {errorMessage}
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Success Toast -->
{#if showBidSuccess}
  <div class="success-toast">
    <span>✅</span>
    Bid submitted successfully!
  </div>
{/if}