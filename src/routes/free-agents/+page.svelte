<script>
  // @ts-ignore
  export let data;
  const {freeAgentsByPosition} = data;
  const positions = Object.keys(freeAgentsByPosition);

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
  
  let selectedPlayer = null;
  let showAddModal = false;
  let years = 1;
  let salary = 1;
  
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
  }
  
  function addPlayer() {
    // @ts-ignore
    console.log(`Adding ${selectedPlayer.name} for ${years} years at $${salary}M`);
    closeAddModal();
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
    padding: 1rem;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
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
    margin-top: 0.75rem;
    padding-top: 0.75rem;
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
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 0.4rem;
  }

  .breakdown-item {
    background: rgba(15, 23, 42, 0.4);
    border-radius: 5px;
    padding: 0.4rem;
    text-align: center;
  }

  .breakdown-name {
    font-size: 0.6rem;
    color: #94a3b8;
    margin-bottom: 0.2rem;
    font-weight: 500;
    line-height: 1.2;
  }

  .breakdown-value {
    font-size: 0.8rem;
    font-weight: 600;
    color: #e2e8f0;
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
                <details>
                  <summary class="breakdown-toggle">📊 Detailed Stats</summary>
                  
                  {#if Object.keys(getRelevantStatLabels(player.position)).length > 0}
                    <!-- Projected Stats -->
                    {#if player.stats.projected_breakdown}
                      <div class="breakdown-section-title">Projected Stats</div>
                      <div class="breakdown-grid">
                        {#each Object.entries(player.stats.projected_breakdown).filter(([k, v]) => !isNaN(parseInt(k)) === false && getRelevantStatLabels(player.position)[k]) as [statName, value]}
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
                      <div class="breakdown-section-title">Previous Seasons</div>
                      <div class="breakdown-grid">
                        {#each Object.entries(player.stats.breakdown).filter(([k, v]) => !isNaN(parseInt(k)) === false && getRelevantStatLabels(player.position)[k]) as [statName, value]}
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
                  {:else}
                    <!-- Fallback for other positions -->
                    <div class="breakdown-grid">
                      {#each Object.entries(player.stats.breakdown || {}).filter(([k]) => isNaN(parseInt(k))) as [statName, value]}
                        <div class="breakdown-item">
                          <div class="breakdown-name">{statName}</div>
                          <div class="breakdown-value">{value}</div>
                        </div>
                      {/each}
                    </div>

                    {#if player.stats.projected_breakdown}
                      <div class="breakdown-section-title">Projected Stats</div>
                      <div class="breakdown-grid">
                        {#each Object.entries(player.stats.projected_breakdown).filter(([k]) => isNaN(parseInt(k))) as [statName, value]}
                          <div class="breakdown-item">
                            <div class="breakdown-name">{statName}</div>
                            <div class="breakdown-value">
                              {statName === 'passingCompletionPercentage' ? `${Math.round((value*100))}%` : Math.round(value)}
                            </div>
                          </div>
                        {/each}
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
    </div>
  </div>
{/if}