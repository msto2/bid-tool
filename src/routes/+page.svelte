<script>
  export let data;
  const league = data.league;

  function getOwnerName(id) {
    const owner = league.members.find(m => m.id === id);
    return owner ? owner.displayName : 'Unknown Owner';
  }

  function getOwners(ownerIds) {
    return ownerIds.map(getOwnerName).join(', ');
  }
</script>

<h1>{league.settings.name}</h1>
<p><strong>Season:</strong> {league.seasonId}</p>
<p><strong>Scoring Period:</strong> {league.scoringPeriodId}</p>
<p><strong>Matchup Period:</strong> {league.status.currentMatchupPeriod}</p>
<p><strong>League Active:</strong> {league.status.isActive ? 'Yes' : 'No'}</p>

<h2>Teams</h2>
<ul>
  {#each league.teams as team}
    <li>
      <strong>{team.abbrev}</strong> (ID: {team.id})<br />
      Owners: {getOwners(team.owners)}
    </li>
  {/each}
</ul>
