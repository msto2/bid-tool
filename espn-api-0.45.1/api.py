from fastapi import FastAPI
from espn_api.football import League

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
            "losses": team.losses
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
        for p in free_agents[:10]
    ]

def get_free_agents_by_position(position: str, size: int = 10):
    league = League(league_id=LEAGUE_ID, year=YEAR)
    free_agents = league.free_agents(position=position, size=size)

    return [
        {
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
    
