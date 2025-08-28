<script>
  /** @type {import('./$types').PageData} */
  export let data;
  
  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
  }
  
  function formatContract(contract) {
    return `${contract.years} year${contract.years !== 1 ? 's' : ''}, $${contract.salary}`;
  }
  
  // Group bids by player for easier viewing
  function groupBidsByPlayer(bids) {
    const grouped = {};
    bids.forEach(bid => {
      if (!grouped[bid.playerId]) {
        grouped[bid.playerId] = {
          playerName: bid.playerName,
          bids: []
        };
      }
      grouped[bid.playerId].bids.push(bid);
    });
    return Object.values(grouped);
  }
  
  $: groupedBids = groupBidsByPlayer(data.bids);
</script>

<svelte:head>
  <title>Bid History - Fantasy Football Bid Tool</title>
</svelte:head>

<main class="container">
  <header class="page-header">
    <div class="header-content">
      <h1>Bid History</h1>
      <p class="subtitle">Complete record of all bids</p>
    </div>
    
    <nav class="user-nav">
      <a href="/" class="nav-button">Home</a>
      <a href="/free-agents" class="nav-button">Free Agents</a>
      <a href="/bids" class="nav-button">Current Bids</a>
    </nav>
  </header>

  <div class="content">
    {#if data.error}
      <div class="error-message">
        <p>⚠️ {data.error}</p>
      </div>
    {:else}
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-label">Total Bids:</span>
          <span class="stat-value">{data.totalBids}</span>
        </div>
        {#if data.lastUpdated}
          <div class="stat">
            <span class="stat-label">Last Updated:</span>
            <span class="stat-value">{formatDate(data.lastUpdated)}</span>
          </div>
        {/if}
      </div>

      {#if data.bids.length === 0}
        <div class="empty-state">
          <h2>No Bid History</h2>
          <p>No bids have been recorded yet. Start bidding to see history here!</p>
          <a href="/free-agents" class="primary-button">Browse Free Agents</a>
        </div>
      {:else}
        <div class="history-section">
          <h2>All Bids ({data.totalBids})</h2>
          
          <div class="bids-grid">
            {#each data.bids as bid (bid.id)}
              <div class="bid-card">
                <div class="bid-header">
                  <div class="player-info">
                    <h3 class="player-name">{bid.playerName}</h3>
                    <span class="player-position">{bid.position || 'N/A'}</span>
                  </div>
                  <div class="bid-time">
                    {formatDate(bid.timestamp)}
                  </div>
                </div>
                
                <div class="bid-details">
                  <div class="bidder">
                    <span class="label">Bidder:</span>
                    <span class="value">{bid.bidder.name}</span>
                  </div>
                  
                  <div class="contract">
                    <span class="label">Contract:</span>
                    <span class="value">{formatContract(bid.contract)}</span>
                  </div>
                  
                  <div class="bid-id">
                    <span class="label">Bid ID:</span>
                    <span class="value">{bid.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="grouped-section">
          <h2>By Player ({groupedBids.length} players)</h2>
          
          <div class="players-grid">
            {#each groupedBids as playerGroup}
              <div class="player-group">
                <h3 class="player-group-title">
                  {playerGroup.playerName}
                  <span class="bid-count">({playerGroup.bids.length} bid{playerGroup.bids.length !== 1 ? 's' : ''})</span>
                </h3>
                
                <div class="player-bids">
                  {#each playerGroup.bids as bid (bid.id)}
                    <div class="mini-bid-card">
                      <div class="mini-bid-info">
                        <span class="bidder-name">{bid.bidder.name}</span>
                        <span class="contract-info">{formatContract(bid.contract)}</span>
                      </div>
                      <div class="mini-bid-time">
                        {formatDate(bid.timestamp)}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</main>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    color: white;
    font-family: 'Inter', sans-serif;
  }

  .page-header {
    position: relative;
    text-align: center;
    margin-bottom: 2rem;
  }

  .header-content h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #60a5fa, #34d399);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 30px rgba(96, 165, 250, 0.3);
  }

  .subtitle {
    font-size: 1.1rem;
    color: #94a3b8;
    margin: 0;
  }

  .user-nav {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  @media (max-width: 768px) {
    .user-nav {
      position: static;
      transform: none;
      justify-content: center;
      margin-top: 1rem;
    }
  }

  .nav-button {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #60a5fa;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .nav-button:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
    color: #93c5fd;
  }

  .stats-bar {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 0.75rem;
    backdrop-filter: blur(10px);
  }

  .stat {
    text-align: center;
  }

  .stat-label {
    display: block;
    font-size: 0.875rem;
    color: #94a3b8;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #60a5fa;
  }

  .error-message {
    text-align: center;
    padding: 2rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.75rem;
    color: #f87171;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 1rem;
    backdrop-filter: blur(10px);
  }

  .empty-state h2 {
    font-size: 1.5rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: #64748b;
    margin-bottom: 1.5rem;
  }

  .primary-button {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    transition: transform 0.2s ease;
    display: inline-block;
  }

  .primary-button:hover {
    transform: translateY(-2px);
  }

  .history-section, .grouped-section {
    margin-bottom: 3rem;
  }

  .history-section h2, .grouped-section h2 {
    font-size: 1.5rem;
    color: #e2e8f0;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  }

  .bids-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .bid-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 0.75rem;
    padding: 1.25rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .bid-card:hover {
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateY(-2px);
  }

  .bid-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .player-info h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #60a5fa;
    margin: 0 0 0.25rem 0;
  }

  .player-position {
    font-size: 0.75rem;
    color: #94a3b8;
    background: rgba(59, 130, 246, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }

  .bid-time {
    font-size: 0.75rem;
    color: #64748b;
    text-align: right;
  }

  .bid-details {
    display: grid;
    gap: 0.5rem;
  }

  .bid-details > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .value {
    font-size: 0.875rem;
    color: #e2e8f0;
    font-weight: 600;
  }

  .players-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }

  .player-group {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: 0.75rem;
    padding: 1.5rem;
    backdrop-filter: blur(10px);
  }

  .player-group-title {
    font-size: 1.1rem;
    color: #34d399;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bid-count {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: normal;
  }

  .player-bids {
    display: grid;
    gap: 0.75rem;
  }

  .mini-bid-card {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(59, 130, 246, 0.1);
    border-radius: 0.5rem;
    padding: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .mini-bid-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bidder-name {
    font-size: 0.875rem;
    color: #60a5fa;
    font-weight: 500;
  }

  .contract-info {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .mini-bid-time {
    font-size: 0.75rem;
    color: #64748b;
    text-align: right;
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .stats-bar {
      flex-direction: column;
      gap: 1rem;
    }
    
    .bids-grid, .players-grid {
      grid-template-columns: 1fr;
    }
    
    .bid-header {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .bid-time {
      text-align: left;
    }
  }
</style>