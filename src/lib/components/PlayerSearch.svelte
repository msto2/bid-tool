<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let onPlayerSelect = () => {};

  let searchQuery = '';
  let searchResults = [];
  let isSearching = false;
  let showDropdown = false;
  let searchTimeout;
  let searchInput;

  async function searchPlayers(query) {
    if (!query.trim() || query.length < 2) {
      searchResults = [];
      showDropdown = false;
      return;
    }

    isSearching = true;
    
    try {
      const response = await fetch(`/api/nfl-players?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (response.ok) {
        searchResults = data.players || [];
        showDropdown = searchResults.length > 0;
      } else {
        console.error('Search error:', data.error);
        searchResults = [];
        showDropdown = false;
      }
    } catch (error) {
      console.error('Search request failed:', error);
      searchResults = [];
      showDropdown = false;
    } finally {
      isSearching = false;
    }
  }

  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchPlayers(searchQuery);
    }, 300);
  }

  function handlePlayerClick(player) {
    searchQuery = '';
    searchResults = [];
    showDropdown = false;
    onPlayerSelect(player);
  }

  function handleClickOutside(event) {
    if (searchInput && !searchInput.contains(event.target)) {
      showDropdown = false;
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      showDropdown = false;
      searchQuery = '';
      searchResults = [];
    }
  }

  onMount(() => {
    if (browser) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeydown);
      
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeydown);
        clearTimeout(searchTimeout);
      };
    }
  });
</script>

<style>
  .player-search {
    position: relative;
    width: 100%;
    max-width: 300px;
    margin-bottom: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    padding-right: 2.5rem;
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-input::placeholder {
    color: #94a3b8;
  }

  .search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
  }

  .loading-spinner {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border: 2px solid rgba(148, 163, 184, 0.3);
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .search-result {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .search-result:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .search-result:last-child {
    border-bottom: none;
  }

  .player-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: #3b82f6;
    flex-shrink: 0;
  }

  .player-info {
    flex: 1;
    min-width: 0;
  }

  .player-name {
    font-weight: 600;
    color: #e2e8f0;
    font-size: 0.9rem;
    margin-bottom: 0.1rem;
  }

  .player-details {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .position-badge {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .no-results {
    padding: 1rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  @keyframes spin {
    0% { transform: translateY(-50%) rotate(0deg); }
    100% { transform: translateY(-50%) rotate(360deg); }
  }

  @media (max-width: 768px) {
    .player-search {
      max-width: 100%;
    }
  }
</style>

<div class="player-search" bind:this={searchInput}>
  <input
    class="search-input"
    type="text"
    placeholder="Search NFL players..."
    bind:value={searchQuery}
    on:input={handleSearchInput}
  />
  
  {#if isSearching}
    <div class="loading-spinner"></div>
  {:else}
    <div class="search-icon">🔍</div>
  {/if}

  {#if showDropdown}
    <div class="search-dropdown">
      {#if searchResults.length > 0}
        {#each searchResults as player}
          <div
            class="search-result"
            on:click={() => handlePlayerClick(player)}
          >
            <div class="player-avatar">
              {#if player.headshot}
                <img src={player.headshot} alt={player.name} style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
              {:else}
                {player.name.charAt(0)}
              {/if}
            </div>
            <div class="player-info">
              <div class="player-name">{player.name}</div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="no-results">
          No players found matching "{searchQuery}"
        </div>
      {/if}
    </div>
  {/if}
  
</div>