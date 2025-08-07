from espn_api.football import League

# Replace these values
league_id = 3925
year = 2025
# espn_s2 = 'your_espn_s2_cookie'
# swid = '{your_swid}'  # Include curly braces

# Create League object
league = League(
    league_id=league_id,
    year=year
)

# Print each team name
for team in league.teams:
    print(f"{team.team_name}: {team.wins}-{team.losses}")

    free_agents = league.free_agents()

for player in free_agents:  # Print first 10
    print(f"{player.name} - {player.position} - {player.proTeam} - {player.projected_total_points}")
