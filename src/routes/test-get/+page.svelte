<script>
  export let data;
  const { teams, freeAgents } = data;
</script>

<h2>Teams</h2>
<ul>
  {#each teams as team}
    <li>{team.team_name}: {team.wins}-{team.losses}</li>
  {/each}
</ul>

<h2>Top Free Agents</h2>
<ul>
  {#each freeAgents as player}
    <li>
      <strong>{player.name}</strong> - {player.position} - {player.team}<br>
      Projected: {player.projected_points} | 
      Actual: {player.total_points} | 
      Avg: {player.avg_points} | 
      Projected Avg: {player.projected_avg_points} | 
      Status: {player.status}
      
      {#if player.stats}
        <details>
          <summary>Stat Breakdown</summary>
          <ul>
            {#each Object.entries(player.stats.breakdown || {}) as [statName, value]}
              <li>{statName}: {value}</li>
            {/each}
            {#if player.stats.projected_breakdown}
              <li><strong>Projected Stats:</strong></li>
              {#each Object.entries(player.stats.projected_breakdown) as [statName, value]}
                <li>{statName}: {value}</li>
              {/each}
            {/if}
          </ul>
        </details>
      {/if}
    </li>
  {/each}
</ul>
