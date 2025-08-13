from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from espn_api.football import League
import requests
from typing import Dict, Any, List
import asyncio

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Allow Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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
def get_player_info(playerId: int = None):
    league_id = 3925
    year = 2025
    league = League(league_id=league_id, year=year)

    if not playerId:
        raise HTTPException(status_code=400, detail="playerId parameter is required")
    
    try:
        player = league.player_info(playerId=playerId)
        
        # Return player data in consistent format
        if isinstance(player, list) and len(player) > 0:
            p = player[0]
        else:
            p = player
            
        return [{
            "id": p.playerId,
            "name": p.name,
            "position": p.position,
            "team": p.proTeam,
            "projected_points": p.projected_total_points,
            "total_points": p.total_points,
            "avg_points": p.avg_points,
            "projected_avg_points": p.projected_avg_points,
            "status": p.active_status,
            "stats": {
                "breakdown": p.stats.get(0, {}),
                "projected_breakdown": p.stats.get(1, {})
            }
        }]
    except Exception as e:
        print(f"Error fetching player info for {playerId}: {e}")
        raise HTTPException(status_code=404, detail=f"Player {playerId} not found")

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

def get_free_agents_by_position(position: str, size: int = 15):
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

# Cache for roster data to speed up free agent checks
_roster_cache = None
_roster_cache_time = None
ROSTER_CACHE_DURATION = 5 * 60 * 1000  # 5 minutes in milliseconds

def get_all_team_rosters():
    """Get all team rosters and cache them for quick lookups"""
    global _roster_cache, _roster_cache_time
    import time
    
    current_time = int(time.time() * 1000)
    
    # Return cached data if still valid
    if _roster_cache is not None and _roster_cache_time is not None:
        if (current_time - _roster_cache_time) < ROSTER_CACHE_DURATION:
            return _roster_cache
    
    try:
        league = League(league_id=LEAGUE_ID, year=YEAR)
        
        # Build a set of all player IDs on team rosters
        rostered_player_ids = set()
        
        for team in league.teams:
            for player in team.roster:
                if hasattr(player, 'playerId'):
                    rostered_player_ids.add(player.playerId)
        _roster_cache = rostered_player_ids
        _roster_cache_time = current_time
        
        return rostered_player_ids
        
    except Exception as e:
        print(f"Error fetching team rosters: {e}")
        # Return empty set if we can't fetch rosters
        return set()

@app.get("/player-free-agent-status/{player_id}")
def check_player_free_agent_status(player_id: int):
    """Check if a player is a free agent by looking at team rosters"""
    try:
        rostered_player_ids = get_all_team_rosters()
        
        # Player is a free agent if they're NOT on any team roster
        is_free_agent = player_id not in rostered_player_ids
        
        
        return {
            'playerId': player_id,
            'isFreeAgent': is_free_agent,
            'isRostered': not is_free_agent,
            'totalRosteredPlayers': len(rostered_player_ids)
        }
        
    except Exception as e:
        print(f"Error checking free agent status for player {player_id}: {e}")
        # If we can't determine status, assume they're not a free agent for safety
        return {
            'playerId': player_id,
            'isFreeAgent': False,
            'isRostered': True,
            'error': 'Could not determine free agent status'
        }

@app.get("/debug-rosters")
def debug_team_rosters():
    """Debug endpoint to see all team rosters"""
    try:
        league = League(league_id=LEAGUE_ID, year=YEAR)
        
        team_rosters = []
        all_rostered_ids = set()
        
        for team in league.teams:
            roster_info = {
                'teamName': team.team_name,
                'teamId': team.team_id,
                'rosterSize': len(team.roster),
                'players': []
            }
            
            for player in team.roster:
                if hasattr(player, 'playerId'):
                    player_info = {
                        'name': player.name,
                        'playerId': player.playerId,
                        'position': getattr(player, 'position', 'Unknown')
                    }
                    roster_info['players'].append(player_info)
                    all_rostered_ids.add(player.playerId)
            
            team_rosters.append(roster_info)
        
        return {
            'teams': team_rosters,
            'totalRosteredPlayers': len(all_rostered_ids),
            'allRosteredIds': list(all_rostered_ids)
        }
        
    except Exception as e:
        return {
            'error': f'Error fetching rosters: {e}',
            'teams': []
        }

@app.get("/test-deandre-hopkins")
def test_deandre_hopkins():
    """Test endpoint to find DeAndre Hopkins and check if he's a free agent"""
    try:
        # Get all rostered player IDs
        rostered_player_ids = get_all_team_rosters()
        
        # Get all free agents to look for DeAndre Hopkins
        league = League(league_id=LEAGUE_ID, year=YEAR)
        free_agents = league.free_agents(size=200)  # Get more free agents
        
        # Look for DeAndre Hopkins
        hopkins_players = []
        for p in free_agents:
            if 'hopkins' in p.name.lower():
                hopkins_info = {
                    'name': p.name,
                    'playerId': p.playerId,
                    'position': p.position,
                    'team': p.proTeam,
                    'isOnRoster': p.playerId in rostered_player_ids,
                    'isFreeAgent': p.playerId not in rostered_player_ids
                }
                hopkins_players.append(hopkins_info)
        
        return {
            'hopkinsPlayers': hopkins_players,
            'totalRosteredPlayers': len(rostered_player_ids),
            'foundHopkins': len(hopkins_players) > 0
        }
        
    except Exception as e:
        return {
            'error': f'Error searching for Hopkins: {e}',
            'hopkinsPlayers': []
        }
