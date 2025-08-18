<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { contacts } from '$lib/data/contacts.js';

  export let data;
  const { teams } = data;
  let { bids } = data;

  let signedInTeam = null;
  let teamsMap = {};
  let eventSource = null;

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
        createTeamsMap();
        setupRealTimeUpdates();
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
      if (revealTimer) {
        clearTimeout(revealTimer);
      }
    };
  });

  function setupRealTimeUpdates() {
    if (!browser || eventSource) return; // Prevent duplicate connections
    
    eventSource = new EventSource('/api/websocket');
    
    eventSource.onopen = () => {
      console.log('SSE connection established for bids page');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_bid') {
          // Refresh the bids list when a new bid is placed
          refreshBids();
        } else if (data.type === 'bid_deleted') {
          // Remove the deleted bid from the local list immediately for better UX
          bids = bids.filter(bid => bid.id !== data.bidId);
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
            setupRealTimeUpdates();
          }
        }, 3000);
      }
    };
  }

  async function refreshBids() {
    try {
      const response = await fetch('/api/bids');
      if (response.ok) {
        bids = await response.json();
      }
    } catch (error) {
      console.error('Error refreshing bids:', error);
    }
  }

  function createTeamsMap() {
    teamsMap = {};
    teams.forEach(team => {
      teamsMap[team.id] = team.team_name;
    });
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

  async function deleteBid(bidId) {
    try {
      const response = await fetch(`/api/bids?id=${bidId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the bid from the local list
        bids = bids.filter(bid => bid.id !== bidId);
        console.log('Bid deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete bid:', errorData);
      }
    } catch (error) {
      console.error('Error deleting bid:', error);
    }
  }

  // Reactive function that updates when signedInTeam changes
  $: canDeleteBid = (bid) => {
    if (!signedInTeam || !bid || !bid.bidder) return false;
    console.log('Checking delete permissions:', { 
      signedInTeam: signedInTeam?.id, 
      bidderTeamId: bid.bidder.teamId 
    });
    return signedInTeam.id === bid.bidder.teamId;
  };

  function isInRevealWindow() {
    const now = new Date();
    
    // Create dates in Eastern Time using Intl.DateTimeFormat
    function getEasternTime(date) {
      return new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
    }
    
    function getNextDayAtTime(dayOfWeek, hour) {
      const easternNow = getEasternTime(now);
      const target = new Date(easternNow);
      
      // Find next occurrence of the target day
      const currentDay = target.getDay(); // Sunday = 0
      let daysUntil = (dayOfWeek - currentDay + 7) % 7;
      
      // If it's the same day, check if we're past the target time
      if (daysUntil === 0) {
        target.setHours(hour, 0, 0, 0);
        if (easternNow >= target) {
          daysUntil = 7; // Move to next week
        }
      }
      
      target.setDate(target.getDate() + daysUntil);
      target.setHours(hour, 0, 0, 0);
      
      return target;
    }
    
    const easternNow = getEasternTime(now);
    const nextSunday9pm = getNextDayAtTime(0, 21); // Sunday = 0, 9 PM = 21
    const nextWednesday9pm = getNextDayAtTime(3, 21); // Wednesday = 3, 9 PM = 21
    
    // Check if we're after Wednesday 9 PM EST and before the next Sunday 9 PM EST
    const lastWednesday9pm = new Date(nextWednesday9pm);
    lastWednesday9pm.setDate(lastWednesday9pm.getDate() - 7);
    
    return easternNow >= lastWednesday9pm && easternNow < nextSunday9pm;
  }

  let revealBids = false;
  let sortedBids = [];
  let revealedIndexes = new Set();
  let revealTimer = null;
  
  // Initialize reveal state
  $: {
    const shouldReveal = isInRevealWindow();
    if (shouldReveal && !revealBids) {
      // Just entered reveal window - trigger animation
      triggerRevealAnimation();
    } else if (!shouldReveal && revealBids) {
      // Left reveal window - hide bids immediately
      revealBids = false;
      revealedIndexes.clear();
      if (revealTimer) {
        clearTimeout(revealTimer);
        revealTimer = null;
      }
    } else if (shouldReveal) {
      // Already in reveal window - just update sorting
      revealBids = true;
      updateSortedBids();
    }
  }
  
  function updateSortedBids() {
    if (!revealBids) return;
    
    // Group bids by player name and sort by total salary within each group
    const grouped = {};
    bids.forEach(bid => {
      const totalSalary = bid.contract.salary * bid.contract.years;
      if (!grouped[bid.playerName]) {
        grouped[bid.playerName] = [];
      }
      grouped[bid.playerName].push({ ...bid, totalSalary });
    });
    
    // Sort each group by total salary (highest first)
    Object.keys(grouped).forEach(playerName => {
      grouped[playerName].sort((a, b) => b.totalSalary - a.totalSalary);
    });
    
    // Flatten back to array, maintaining player groupings
    sortedBids = Object.values(grouped).flat();
  }
  
  function triggerRevealAnimation() {
    revealBids = true;
    updateSortedBids();
    revealedIndexes.clear();
    
    // Stagger the reveal animation
    sortedBids.forEach((_, index) => {
      setTimeout(() => {
        revealedIndexes.add(index);
        revealedIndexes = new Set(revealedIndexes); // Trigger reactivity
      }, index * 150); // 150ms delay between each reveal
    });
  }
  
  // Update sorted bids when regular bids change
  $: if (bids && revealBids) {
    updateSortedBids();
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
    padding: 0 1rem 0 1rem;
    position: relative;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: grid;
    grid-template-columns: 1.2fr 1.8fr 0.8fr 0.8fr 0.8fr 1fr 40px;
    gap: 1rem;
    align-items: center;
    min-height: 50px;
  }

  .bid-card.revealing {
    opacity: 0;
    transform: translateY(20px);
    animation: revealBid 0.6s ease-out forwards;
  }

  @keyframes revealBid {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .player-group-header {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin: 1rem 0 0.5rem 0;
    font-weight: 600;
    color: #3b82f6;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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
    display: none;
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

  .delete-btn {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .user-name-row .delete-btn {
    display: none; /* Hide mobile delete button on desktop */
  }

  .desktop-delete {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Header row for labels */
  .bids-header {
    display: grid;
    grid-template-columns: 1.2fr 1.8fr 0.8fr 0.8fr 0.8fr 1fr 40px;
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
      display: contents;
    }

    .user-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .delete-btn {
      width: 24px;
      height: 24px;
      font-size: 0.7rem;
    }

    .user-name-row .delete-btn {
      display: flex; /* Show mobile delete button on mobile */
    }

    .desktop-delete {
      display: none; /* Hide desktop delete button on mobile */
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
        <a href="/free-agents" class="nav-btn" data-sveltekit-preload-data="hover">
          Free Agents
        </a>
      </div>
    {/if}
    
    <div class="header-content">
      <h1 class="main-title">Submitted Bids</h1>
      <p class="subtitle">Track all player bids across the league</p>
    </div>
  </div>

  <div class="actions-bar">
    <div class="bid-count">
      {bids.length} {bids.length === 1 ? 'bid' : 'bids'} submitted
    </div>
    <a href="/free-agents" class="nav-btn" data-sveltekit-preload-data="hover">
      + Place New Bid
    </a>
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
      <div class="header-label"></div>
    </div>

    <div class="bids-grid">
      {#each (revealBids ? sortedBids : bids) as bid, index}
        {@const isRevealed = !revealBids || revealedIndexes.has(index)}
        {@const showPlayerHeader = revealBids && (index === 0 || (sortedBids[index-1] && sortedBids[index-1].playerName !== bid.playerName))}
        
        {#if showPlayerHeader}
          <div class="player-group-header">
            {bid.playerName} - {bid.position} • {bid.team}
          </div>
        {/if}
        
        <div class="bid-card" class:revealing={revealBids && !isRevealed}>
          <!-- User Name -->
          <div class="bid-item">
            <div class="user-name-row">
              <div class="item-value user-name">{bid.bidder.name}</div>
              {#if canDeleteBid(bid)}
                <button class="delete-btn" on:click={() => deleteBid(bid.id)} title="Delete bid">X</button>
              {/if}
            </div>
          </div>
          
          <!-- Player Name -->
          <div class="bid-item">
            {#if canDeleteBid(bid) || revealBids}
            <div class="player-position">{bid.position} • {bid.team}</div>
            <div class="item-value player-name">{bid.playerName}</div>
            {:else}
            <div class="player-position">XX • XXX</div>
            <div class="item-value player-name">Player Name</div>
            {/if}
          </div>
          
          <!-- Contract Length -->
          <div class="bid-item">
            <div class="item-label">Contract</div>
            {#if canDeleteBid(bid) || revealBids}
            <div class="item-value contract-years">{bid.contract.years} yr{bid.contract.years > 1 ? 's' : ''}</div>
            {:else}
            <div class="item-value contract-years"># yrs</div>
            {/if}
          </div>
          
          <!-- Annual Salary -->
          <div class="bid-item">
            <div class="item-label">Annual</div>
            {#if canDeleteBid(bid) || revealBids}
            <div class="item-value salary-value">{formatCurrency(bid.contract.salary)}</div>
            {:else}
            <div class="item-value salary-value">$</div>
            {/if}
          </div>
          
          <!-- Total Value -->
           
          <div class="bid-item">
            <div class="item-label">Total</div>
            {#if canDeleteBid(bid) || revealBids}
            <div class="item-value total-value">{formatCurrency(bid.contract.salary * bid.contract.years)}</div>
            {:else}
            <div class="item-value total-value">&lt;---&gt;</div>
            {/if}
          </div>
          
          <!-- Submitted Date -->
          <div class="bid-item">
            <div class="item-label">Submitted</div>
            <div class="item-value submitted-date">{formatDate(bid.timestamp)}</div>
          </div>

          <!-- Delete Button (Desktop Only) -->
          {#if canDeleteBid(bid)}
            <div class="bid-item desktop-delete">
              <button class="delete-btn" on:click={() => deleteBid(bid.id)} title="Delete bid">×</button>
            </div>
          {:else}
            <div class="bid-item"></div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="no-bids">
      <div class="no-bids-icon">📝</div>
      <h3>No bids submitted yet</h3>
      <p>Start placing bids on free agents to see them appear here.</p>
      <a href="/free-agents" class="nav-btn" style="margin-top: 1rem;" data-sveltekit-preload-data="hover">
        Browse Free Agents
      </a>
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