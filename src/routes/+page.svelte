<script>
  export let data;
  const { teams } = data;

  function handleSignIn(teamName) {
    // For now, just log the team selection
    console.log(`Sign in requested for team: ${teamName}`);
    alert(`Sign in functionality for ${teamName} will be implemented here`);
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
    padding: 2rem;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .main-title {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #194285, #06b6d4, #10b981);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
  }

  .subtitle {
    color: #94a3b8;
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .league-info {
    color: #64748b;
    font-size: 0.9rem;
  }

  .teams-grid {
    display: grid;
    /* grid-template-columns: 1fr 1fr; */
    grid-template-columns: repeat(2, minmax(100px, .5fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .team-card {
    background: rgba(30, 41, 59, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .team-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
  }

  .team-header {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .team-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.5rem;
  }

  .team-record {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .record-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    min-width: 50px;
  }

  .record-label {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-bottom: 0.25rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .record-value {
    font-size: 1.1rem;
    font-weight: 700;
    color:#10b981;
  }

  .wins {
    color: #10b981;
  }

  .losses {
    color: #ef4444;
  }

  .sign-in-btn {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sign-in-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(59, 130, 246, 0.4);
    background: linear-gradient(135deg, #2563eb, #0891b2);
  }

  .sign-in-btn:active {
    transform: translateY(0);
  }

  .no-teams {
    text-align: center;
    color: #94a3b8;
    font-size: 1.1rem;
    margin-top: 3rem;
    padding: 2rem;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .container {
      padding: 1rem;
    }

    .main-title {
      font-size: 2rem;
    }

    .teams-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .team-card {
      padding: 1.25rem;
    }

    .team-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .sign-in-btn {
      width: 100%;
      padding: 1rem;
    }
  }
</style>

<div class="container">
  <div class="header">
    <h1 class="main-title">Aliquippa Keeper League</h1>
    <p class="subtitle">Choose your team to get started</p>
    <p class="league-info">League ID: 3925 • Season: 2025</p>
  </div>

  {#if teams && teams.length > 0}
    <div class="teams-grid">
      {#each teams as team}
        <button class="team-card" on:click={() => handleSignIn(team.team_name)}>
          <div class="team-header">
            <div>
              <h2 class="team-name">{team.team_name} {team.id}</h2>
              <div class="team-record">
                <div class="record-item">
                  <div class="record-label">Record</div>
                  <div class="record-value">{team.wins}-{team.losses}</div>
                </div>
                <div class="record-item">
                  <div class="record-label">Points</div>
                  <div class="record-value wins">{team.points_for ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="no-teams">
      <p>No teams found. Make sure the FastAPI server is running on localhost:8000</p>
    </div>
  {/if}
</div>