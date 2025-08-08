<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { contacts } from '$lib/data/contacts.js';

  export let data;
  const { teams } = data;

  let signedInTeam = null;
  let bids = [];
  let teamsMap = {};

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
        loadBids();
        createTeamsMap();
      } catch (error) {
        localStorage.removeItem('signedInTeam');
        goto('/');
        return;
      }
    }
  });

  function createTeamsMap() {
    teamsMap = {};
    teams.forEach(team => {
      teamsMap[team.id] = team.team_name;
    });
  }

  function loadBids() {
    if (browser) {
      const savedBids = localStorage.getItem('fantasyBids');
      if (savedBids) {
        try {
          const allBids = JSON.parse(savedBids);
          bids = allBids.sort((a, b) => {
            // Sort by bidder name first, then by timestamp
            const nameComparison = a.bidder.name.localeCompare(b.bidder.name);
            if (nameComparison !== 0) return nameComparison;
            return b.timestamp - a.timestamp; // Most recent first for same bidder
          });
        } catch (error) {
          console.error('Error loading bids:', error);
          bids = [];
        }
      }
    }
  }

  function handleSignOut() {
    if (browser) {
      localStorage.removeItem('signedInTeam');
      goto('/');
    }
  }

  function formatCurrency(amount) {
    return `$${amount}M`;
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getContactInfo(teamId) {
    const contact = contacts[teamId];
    return contact ? contact.email : '';
  }

  function navigateToFreeAgents() {
    goto('/free-agents');
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
    max-width: 1200px;
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

  .actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  .bid-count {
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .bids-grid {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .bid-card {
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    position: relative;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: grid;
    grid-template-columns: 1.2fr 1.8fr 0.8fr 0.8fr 0.8fr 1fr;
    gap: 1rem;
    align-items: center;
    min-height: 50px;
  }

  .bid-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(30, 41, 59, 0.8);
  }

  .bid-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .item-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f1f5f9;
    line-height: 1.2;
  }

  .item-label {
    font-size: 0.65rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-top: 0.1rem;
  }

  .user-name {
    color: #06b6d4;
  }

  .player-name {
    color: #f1f5f9;
  }

  .player-position {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-top: 0.1rem;
  }

  .contract-years {
    color: #e2e8f0;
  }

  .salary-value {
    color: #10b981;
  }

  .total-value {
    color: #10b981;
    font-weight: 700;
  }

  .submitted-date {
    color: #94a3b8;
    font-size: 0.75rem;
  }

  /* Header row for labels */
  .bids-header {
    display: grid;
    grid-template-columns: 1.2fr 1.8fr 0.8fr 0.8fr 0.8fr 1fr;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }

  .header-label {
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .no-bids {
    text-align: center;
    color: #94a3b8;
    font-size: 1.1rem;
    margin-top: 3rem;
    padding: 3rem 2rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  .no-bids-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
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

    .actions-bar {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .container {
      padding: 1rem;
    }

    .bids-header {
      display: none; /* Hide column headers on mobile */
    }

    .bid-card {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      padding: 1rem;
      min-height: auto;
    }

    .bid-item {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .bid-item:last-child {
      border-bottom: none;
    }

    .item-value {
      font-size: 0.8rem;
    }

    .item-label {
      font-size: 0.7rem;
      margin-top: 0;
      text-transform: none;
      letter-spacing: normal;
    }
  }
</style>

<div class="container">
  <div class="header">
    {#if signedInTeam}
      <div class="user-info">
        <span class="team-name">{signedInTeam.name}</span>
        <button class="nav-btn" on:click={navigateToFreeAgents}>
          Free Agents
        </button>
        <button class="sign-out-btn" on:click={handleSignOut}>
          Sign Out
        </button>
      </div>
    {/if}
    
    <h1 class="main-title">Submitted Bids</h1>
    <p class="subtitle">Track all player bids across the league</p>
  </div>

  <div class="actions-bar">
    <div class="bid-count">
      {bids.length} {bids.length === 1 ? 'bid' : 'bids'} submitted
    </div>
    <button class="nav-btn" on:click={navigateToFreeAgents}>
      + Place New Bid
    </button>
  </div>

  {#if bids.length > 0}
    <!-- Header Row (Desktop Only) -->
    <div class="bids-header">
      <div class="header-label">User Name</div>
      <div class="header-label">Player Name</div>
      <div class="header-label">Contract</div>
      <div class="header-label">Annual</div>
      <div class="header-label">Total</div>
      <div class="header-label">Submitted</div>
    </div>

    <div class="bids-grid">
      {#each bids as bid}
        <div class="bid-card">
          <!-- User Name -->
          <div class="bid-item">
            <div class="item-value user-name">{bid.bidder.name}</div>
            <div class="item-label">User Name</div>
          </div>
          
          <!-- Player Name -->
          <div class="bid-item">
            <div class="item-value player-name">{bid.playerName}</div>
            <div class="player-position">{bid.position} • {bid.team}</div>
            <div class="item-label">Player</div>
          </div>
          
          <!-- Contract Length -->
          <div class="bid-item">
            <div class="item-value contract-years">{bid.contract.years}yr{bid.contract.years > 1 ? 's' : ''}</div>
            <div class="item-label">Contract</div>
          </div>
          
          <!-- Annual Salary -->
          <div class="bid-item">
            <div class="item-value salary-value">{formatCurrency(bid.contract.salary)}</div>
            <div class="item-label">Annual</div>
          </div>
          
          <!-- Total Value -->
          <div class="bid-item">
            <div class="item-value total-value">{formatCurrency(bid.contract.salary * bid.contract.years)}</div>
            <div class="item-label">Total</div>
          </div>
          
          <!-- Submitted Date -->
          <div class="bid-item">
            <div class="item-value submitted-date">{formatDate(bid.timestamp)}</div>
            <div class="item-label">Submitted</div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="no-bids">
      <div class="no-bids-icon">📝</div>
      <h3>No bids submitted yet</h3>
      <p>Start placing bids on free agents to see them appear here.</p>
      <button class="nav-btn" style="margin-top: 1rem;" on:click={navigateToFreeAgents}>
        Browse Free Agents
      </button>
    </div>
  {/if}
</div>