<script>
  export let player;
  export let onBid;
  export let loadingHistoricalStats = {};
  export let historicalStatsCache = {};

  let showBidModal = false;
  let years = 1;
  let salary = 1;
  let errorMessage = '';

  const statLabelsPassing = {
    passingCompletions: "Completions",
    passingAttempts: "Attempts",
    passingCompletionPercentage: "Comp %",
    passingYards: "Pass Yards",
    passingTouchdowns: "Pass TDs",
    passingInterceptions: "Int"
  };

  const statLabelsRushing = {
    rushingAttempts: "Carries",
    rushingYards: "Rush Yards",
    rushingYardsPerAttempt: "Yards/Carry",
    rushingTouchdowns: "Rush TDs"
  };

  const statLabelReceiving = {
    receivingTargets: "Targets",
    receivingReceptions: "Receptions",
    receivingYards: "Rec Yards",
    receivingYardsPerReception: "Yards/Rec",
    receivingTouchdowns: "Receiving TDs"
  };

  function getRelevantStatLabels(position) {
    // Handle null, undefined, or 'N/A' positions
    if (!position || position === 'N/A' || position === 'Unknown Position') {
      return {}; // Show no detailed stats for unknown positions
    }
    
    switch(position) {
      case 'QB':
        return {...statLabelsPassing, ...statLabelsRushing};
      case 'RB':
        return {...statLabelsRushing, ...statLabelReceiving};
      case 'WR':
      case 'TE':
        return statLabelReceiving;
      default:
        return {}; // Show no detailed stats for unknown positions
    }
  }

  function getStatsByCategory(stats, position) {
    const categories = {
      passing: [],
      rushing: [],
      receiving: []
    };
    
    if (!stats) return {};
    
    // Handle null, undefined, or 'N/A' positions
    if (!position || position === 'N/A' || position === 'Unknown Position') {
      return {}; // Show no categorized stats for unknown positions
    }
    
    // Process stats in the order defined by the statLabels objects
    // Passing stats in order
    Object.keys(statLabelsPassing).forEach(statKey => {
      if (stats[statKey] !== null && stats[statKey] !== undefined) {
        categories.passing.push([statKey, stats[statKey]]);
      }
    });
    
    // Rushing stats in order
    Object.keys(statLabelsRushing).forEach(statKey => {
      if (stats[statKey] !== null && stats[statKey] !== undefined) {
        categories.rushing.push([statKey, stats[statKey]]);
      }
    });
    
    // Receiving stats in order
    Object.keys(statLabelReceiving).forEach(statKey => {
      if (stats[statKey] !== null && stats[statKey] !== undefined) {
        categories.receiving.push([statKey, stats[statKey]]);
      }
    });
    
    // Filter based on position
    const result = {};
    
    switch(position) {
      case 'QB':
        if (categories.passing.length > 0) result.passing = categories.passing;
        if (categories.rushing.length > 0) result.rushing = categories.rushing;
        break;
      case 'RB':
        if (categories.rushing.length > 0) result.rushing = categories.rushing;
        if (categories.receiving.length > 0) result.receiving = categories.receiving;
        break;
      case 'WR':
      case 'TE':
        if (categories.receiving.length > 0) result.receiving = categories.receiving;
        break;
      default:
        // For unknown positions, don't show categorized stats
        break;
    }
    
    return result;
  }

  function getCategoryLabel(category) {
    const labels = {
      passing: 'Passing',
      rushing: 'Rushing', 
      receiving: 'Receiving'
    };
    return labels[category] || category;
  }

  function getStatLabel(statName) {
    return statLabelsPassing[statName] || statLabelsRushing[statName] || statLabelReceiving[statName] || statName;
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
    if (!onBid) return;
    
    try {
      await onBid(player, { years, salary });
      closeBidModal();
    } catch (error) {
      errorMessage = error.message || 'Failed to submit bid. Please try again.';
    }
  }

  async function fetchHistoricalStats() {
    if (historicalStatsCache[player.id] || loadingHistoricalStats[player.id]) {
      return historicalStatsCache[player.id] || null;
    }

    loadingHistoricalStats[player.id] = true;
    loadingHistoricalStats = { ...loadingHistoricalStats };

    try {
      const response = await fetch(`/api/player-stats/${player.id}`);
      if (response.ok) {
        const data = await response.json();
        historicalStatsCache[player.id] = data.historicalStats;
        return historicalStatsCache[player.id];
      }
    } catch (error) {
      console.error('Error fetching historical stats:', error);
    } finally {
      loadingHistoricalStats[player.id] = false;
      loadingHistoricalStats = { ...loadingHistoricalStats };
    }

    return null;
  }

  async function handleDetailsToggle(event) {
    if (event.target.open && player.id && !historicalStatsCache[player.id]) {
      const stats = await fetchHistoricalStats();
      if (stats) {
        player.historicalStats = stats;
        player = { ...player };
      }
    }
  }
</script>

<style>
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
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
    margin: 0 auto;
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

  .breakdown-section-title {
    margin: 0.75rem 0 0.4rem;
    font-weight: 600;
    color: #06b6d4;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
  }

  .breakdown-year-title {
    margin: 0.75rem 0 0.4rem;
    font-weight: 600;
    color: #06b6d4;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
  }

  .breakdown-category-title {
    margin: 0.5rem 0 0.3rem;
    font-weight: 600;
    color: #10b981;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    text-align: center;
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

  .categories-row {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: flex-start;
  }

  .category-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .category-header {
    margin-bottom: 0.1rem;
    font-weight: 600;
    color: #10b981;
    font-size: 0.70rem;
    text-transform: uppercase;
    letter-spacing: .3rem;
    text-align: center;
  }

  .category-stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
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

    .categories-row {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: flex-start;
    }

    .category-section {
      flex: 1;
      min-width: 0;
      margin-bottom: .5rem;
    }

    .category-stats {
      gap: 0.3rem;
    }
  }

  /* Mobile optimizations */
  @media (max-width: 767px) {
    .player-card {
      background: rgba(30, 41, 59, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      padding: .25rem; 
      position: relative;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: grid;
      grid-template-columns: 1fr;
      gap: .25rem;
    }
    .player-content{
      padding: .5rem;
    }

    .breakdown-grid {
      gap: 0.15rem;
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

<div class="player-card">
  <div class="player-content">
    <div class="player-header">
      <div class="player-info">
        <div class="player-name">{player.name}</div>
        <div class="player-team">{player.position} • {player.team}</div>
      </div>
      <button class="add-btn" on:click={openBidModal}>+</button>
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
      <details on:toggle={handleDetailsToggle}>
        <summary class="breakdown-toggle">📊 Detailed Stats</summary>
        
        {#if Object.keys(getRelevantStatLabels(player.position)).length > 0}
          <!-- Projected Stats -->
          {#if player.stats.projected_breakdown}
            <div class="breakdown-section-title">Projected Stats</div>
            <div class="categories-row">
              {#each Object.entries(getStatsByCategory(player.stats.projected_breakdown, player.position)) as [category, stats]}
                <div class="category-section">
                  <div class="category-header">{getCategoryLabel(category)}</div>
                  <div class="category-stats">
                    {#each stats as [statName, value]}
                      <div class="breakdown-item">
                        <div class="breakdown-name">{getStatLabel(statName)}</div>
                        <div class="breakdown-value">
                          {statName === 'passingCompletionPercentage' ? `${Math.round((value*100))}%` : 
                           statName === 'passingYards' || statName === 'rushingYards' || statName === 'receivingYards' ? Math.round(value * 17): 
                           Math.round(value)}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Current Season Stats -->
          {#if player.stats.breakdown && player.stats.breakdown.length > 0}
            <div class="breakdown-section-title">Current Season Stats</div>
            <div class="categories-row">
              {#each Object.entries(getStatsByCategory(player.stats.breakdown, player.position)) as [category, stats]}
                <div class="category-section">
                  <div class="category-header">{getCategoryLabel(category)}</div>
                  <div class="category-stats">
                    {#each stats as [statName, value]}
                      <div class="breakdown-item">
                        <div class="breakdown-name">{getStatLabel(statName)}</div>
                        <div class="breakdown-value">
                          {statName === 'passingCompletionPercentage' ? `${Math.round((value*100))}%` : 
                           statName === 'rushingYardsPerAttempt' || statName === 'receivingYardsPerReception' ? Math.round(value * 10) / 10 : 
                           Math.round(value)}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Historical Stats -->
          {#if player.historicalStats && player.historicalStats.length > 0}
            {#each player.historicalStats as yearStats}
              <div class="breakdown-year-title">{yearStats.year} Season</div>
              <div class="categories-row">
                {#each Object.entries(getStatsByCategory(yearStats.stats, player.position)) as [category, stats]}
                  <div class="category-section">
                    <div class="category-header">{getCategoryLabel(category)}</div>
                    <div class="category-stats">
                      {#each stats as [statName, value]}
                        <div class="breakdown-item">
                          <div class="breakdown-name">{getStatLabel(statName)}</div>
                          <div class="breakdown-value">
                            {statName === 'passingCompletionPercentage' ? `${Math.round((value*100))}%` : 
                             statName === 'rushingYardsPerAttempt' || statName === 'receivingYardsPerReception' ? Math.round(value * 10) / 10 : 
                             Math.round(value)}
                          </div>
                        </div>
                      {/each}
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
          <!-- Fallback for other positions -->
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

{#if showBidModal}
  <div class="modal-overlay" on:click={closeBidModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <div class="modal-title">{player.name}</div>
        <div class="modal-subtitle">{player.position} • {player.team}</div>
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