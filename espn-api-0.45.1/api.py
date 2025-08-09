from fastapi import FastAPI, HTTPException
from espn_api.football import League
import requests
from typing import Dict, Any, List
import asyncio

app = FastAPI()
LEAGUE_ID = 3925
YEAR = 2025

@app.get("/teams")
def get_teams():
    league_id = 3925
    year = 2025
    league = League(league_id=league_id, year=year)

    teams = [
        {
            "team_name": team.team_name,
            "wins": team.wins,
            "losses": team.losses,
            "id": team.team_id
        }
        for team in league.teams
    ]
    return teams

@app.get("/playerinfo")
def get_free_agents():
    league_id = 3925
    year = 2025
    league = League(league_id=league_id, year=year)

    player = league.player_info(playerId=3139477)
    return player

@app.get("/free-agents")
def get_free_agents():
    league_id = 3925
    year = 2025
    league = League(league_id=league_id, year=year)

    free_agents = league.free_agents()
    return [
        {
            "id": p.playerId,
            "name": p.name,
            "position": p.position,
            "team": p.proTeam,
            "projected_points": p.projected_total_points,
            "total_points": p.total_points,
            "avg_points": p.avg_points,
            "projected_avg_points": p.projected_avg_points,
            "status": p.active_status,
            "stats": p.stats.get(0, {})
        }
        for p in free_agents[:50]
    ]

def get_free_agents_by_position(position: str, size: int = 25):
    league = League(league_id=LEAGUE_ID, year=YEAR)
    free_agents = league.free_agents(position=position, size=size)

    return [
        {
            "id": p.playerId,
            "name": p.name,
            "position": p.position,
            "team": p.proTeam,
            "projected_points": p.projected_total_points,
            "total_points": p.total_points,
            "avg_points": p.avg_points,
            "projected_avg_points": p.projected_avg_points,
            "status": p.active_status,
            "stats": p.stats.get(0, {})
        }
        for p in free_agents
    ]


@app.get("/free-agents-qb")
def get_free_agents_qb():
    return get_free_agents_by_position("QB")


@app.get("/free-agents-rb")
def get_free_agents_rb():
    return get_free_agents_by_position("RB")


@app.get("/free-agents-wr")
def get_free_agents_wr():
    return get_free_agents_by_position("WR")


@app.get("/free-agents-te")
def get_free_agents_te():
    return get_free_agents_by_position("TE")


@app.get("/free-agents-dt")
def get_free_agents_dt():
    return get_free_agents_by_position("DT")


@app.get("/free-agents-de")
def get_free_agents_de():
    return get_free_agents_by_position("DE")


@app.get("/free-agents-lb")
def get_free_agents_lb():
    return get_free_agents_by_position("LB")


@app.get("/free-agents-cb")
def get_free_agents_cb():
    return get_free_agents_by_position("CB")


@app.get("/free-agents-s")
def get_free_agents_s():
    return get_free_agents_by_position("S")


@app.get("/free-agents-k")
def get_free_agents_k():
    return get_free_agents_by_position("K")

def fetch_player_stats_for_year(player_id: int, year: int) -> Dict[str, Any]:
    """Fetch player stats from ESPN Core API for a specific year"""
    url = f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/types/2/athletes/{player_id}/statistics"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            # Extract relevant stats from the response
            stats = {}
            
            if 'splits' in data and 'categories' in data['splits']:
                categories = data['splits']['categories']
                
                
                for category in categories:
                    category_name = category.get('name', '').lower()
                    if 'stats' in category:
                        for stat in category['stats']:
                            stat_name = stat.get('name', '')
                            stat_value = stat.get('value', 0)
                            
                            # Map stat names to match our existing structure
                            if category_name == 'passing':
                                if 'completions' in stat_name.lower():
                                    stats['passingCompletions'] = stat_value
                                elif stat_name.lower() == 'passingattempts':
                                    stats['passingAttempts'] = stat_value
                                elif stat_name.lower() == 'passingyards':
                                    stats['passingYards'] = stat_value
                                elif 'touchdowns' in stat_name.lower():
                                    stats['passingTouchdowns'] = stat_value
                                elif 'interceptions' in stat_name.lower():
                                    stats['passingInterceptions'] = stat_value
                            
                            elif category_name == 'rushing':
                                if stat_name.lower() == 'rushingattempts':
                                    stats['rushingAttempts'] = stat_value
                                elif stat_name.lower() == 'rushingyards':
                                    stats['rushingYards'] = stat_value
                                    print(f"{year}: {stats}")
                                elif stat_name.lower() == 'rushingtouchdowns':
                                    stats['rushingTouchdowns'] = stat_value
                            
                            elif category_name == 'receiving':
                                if 'targets' in stat_name.lower():
                                    stats['receivingTargets'] = stat_value
                                elif 'receptions' in stat_name.lower():
                                    stats['receivingReceptions'] = stat_value
                                elif stat_name.lower() == 'receivingyards':
                                    stats['receivingYards'] = stat_value
                                elif 'touchdowns' in stat_name.lower():
                                    stats['receivingTouchdowns'] = stat_value
            
            # Calculate derived stats
            if 'passingCompletions' in stats and 'passingAttempts' in stats and stats['passingAttempts'] > 0:
                stats['passingCompletionPercentage'] = stats['passingCompletions'] / stats['passingAttempts']
            
            if 'rushingYards' in stats and 'rushingAttempts' in stats and stats['rushingAttempts'] > 0:
                stats['rushingYardsPerAttempt'] = stats['rushingYards'] / stats['rushingAttempts']
            
            if 'receivingYards' in stats and 'receivingReceptions' in stats and stats['receivingReceptions'] > 0:
                stats['receivingYardsPerReception'] = stats['receivingYards'] / stats['receivingReceptions']
            
            print(f"{year}: {stats}")
            return {
                'year': year,
                'stats': stats
            }
    except Exception as e:
        print(f"Error fetching stats for player {player_id} in {year}: {e}")
    
    return {'year': year, 'stats': {}}

@app.get("/player-stats/{player_id}")
def get_player_historical_stats(player_id: int):
    """Get historical stats for a player over the past 3 seasons"""
    current_year = 2024  # Latest completed season
    years = [current_year - i for i in range(3)]  # [2024, 2023, 2022]
    
    historical_stats = []
    
    for year in years:
        year_stats = fetch_player_stats_for_year(player_id, year)
        if year_stats['stats']:  # Only include years with data
            historical_stats.append(year_stats)
    
    return {
        'playerId': player_id,
        'historicalStats': historical_stats
    }
    
