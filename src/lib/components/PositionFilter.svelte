<script>
  export let selectedPosition = 'All';
  export let onPositionChange;
  export let loading = false;

  const positions = [
    { id: 'All', name: 'All', color: '#3b82f6' },
    { id: 'QB', name: 'QB', color: '#8b5cf6' },
    { id: 'RB', name: 'RB', color: '#10b981' },
    { id: 'WR', name: 'WR', color: '#f59e0b' },
    { id: 'TE', name: 'TE', color: '#ef4444' },
    { id: 'DT', name: 'DT', color: '#6b7280' },
    { id: 'DE', name: 'DE', color: '#6b7280' },
    { id: 'LB', name: 'LB', color: '#6b7280' },
    { id: 'CB', name: 'CB', color: '#6b7280' },
    { id: 'S', name: 'S', color: '#6b7280' },
    { id: 'K', name: 'K', color: '#f97316' }
  ];

  function handlePositionClick(position) {
    if (loading) return;
    selectedPosition = position.id;
    onPositionChange?.(position.id);
  }
</script>

<style>
  .position-filter {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-label {
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: 600;
    margin-right: 0.5rem;
  }

  .position-btn {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.2);
    color: #e2e8f0;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    min-width: 48px;
    text-align: center;
  }

  .position-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-color: rgba(148, 163, 184, 0.4);
  }

  .position-btn.active {
    background: var(--position-color);
    border-color: var(--position-color);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .position-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-indicator {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-left: 0.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .position-filter {
      padding: 0.75rem;
      gap: 0.375rem;
    }

    .filter-label {
      width: 100%;
      margin-bottom: 0.5rem;
      margin-right: 0;
    }

    .position-btn {
      font-size: 0.8rem;
      padding: 0.4rem 0.75rem;
      min-width: 40px;
    }
  }
</style>

<div class="position-filter">
  <span class="filter-label">Filter by Position:</span>
  {#each positions as position}
    <button
      class="position-btn"
      class:active={selectedPosition === position.id}
      style="--position-color: {position.color}"
      on:click={() => handlePositionClick(position)}
      disabled={loading}
    >
      {position.name}
      {#if loading && selectedPosition === position.id}
        <span class="loading-indicator"></span>
      {/if}
    </button>
  {/each}
</div>