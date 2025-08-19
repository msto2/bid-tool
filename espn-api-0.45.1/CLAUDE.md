# CLAUDE.md - ESPN API FastAPI Backend

This file provides guidance to Claude Code (claude.ai/code) when working with the FastAPI backend in this directory.

## Overview

This is a FastAPI backend that serves as a bridge between the ESPN Fantasy Football API and the frontend application. It provides RESTful endpoints for accessing team data, free agent information, and historical player statistics.

## Key Components

### Configuration
- **League ID**: 3925 (Aliquippa Keeper League)
- **Current Year**: 2025
- **Base URL**: http://localhost:8000

### Core Dependencies
- `fastapi` - Web framework for building APIs
- `espn_api.football` - ESPN Fantasy Football API wrapper
- `requests` - HTTP client for external API calls

## API Endpoints

### Team Data
- `GET /teams` - Returns all league teams with wins, losses, and team IDs
- **Response Format**: `[{team_name, wins, losses, id}]`

### Free Agent Data
- `GET /free-agents` - Returns top 10 free agents across all positions
- `GET /free-agents-{position}` - Returns free agents filtered by position
- **Supported Positions**: QB, RB, WR, TE, DT, DE, LB, CB, S, K
- **Response Format**: `[{id, name, position, team, projected_points, total_points, avg_points, projected_avg_points, status, stats}]`

### Player Validation
- `GET /player-free-agent-status/{player_id}` - Validates if player is available as free agent
- **Purpose**: Used by bidding system to ensure player availability before accepting bids
- **Response Format**: `{playerId, isFreeAgent: boolean}`

### Historical Stats (Custom Implementation)
- `GET /player-stats/{player_id}` - Returns 3 years of historical NFL stats
- **Data Source**: ESPN Core API (`sports.core.api.espn.com`)
- **Years Covered**: 2022, 2023, 2024
- **Response Format**: `{playerId, historicalStats: [{year, stats}]}`
- **Stat Normalization**: Maps ESPN stat IDs to consistent field names

## Key Functions

### `get_free_agents_by_position(position: str, size: int = 10)`
- Reusable function for fetching position-specific free agents
- Used by all position endpoints to maintain consistency

### `fetch_player_stats_for_year(player_id: int, year: int)`
- Fetches individual season stats from ESPN Core API
- Maps ESPN stat IDs to consistent field names using predefined mappings
- Calculates derived stats (completion percentage, yards per attempt, etc.)
- Handles API failures gracefully with empty responses
- Properly handles missing or null stat values

### `get_player_historical_stats(player_id: int)`
- Orchestrates multi-year stats collection
- Filters out years with no data
- Returns structured historical data for frontend consumption

## Stat Mapping Structure

The backend maps ESPN Core API stat IDs to consistent field names:

**ESPN Stat ID Mappings**:
- `3` → `passingCompletions`
- `4` → `passingAttempts`  
- `5` → `passingYards`
- `6` → `passingTouchdowns`
- `7` → `passingInterceptions`
- `23` → `rushingAttempts`
- `24` → `rushingYards` 
- `25` → `rushingTouchdowns`
- `53` → `receivingTargets`
- `54` → `receivingReceptions`
- `55` → `receivingYards`
- `56` → `receivingTouchdowns`

**Derived Calculations**:
- `passingCompletionPercentage` = completions / attempts * 100
- `rushingYardsPerAttempt` = yards / attempts
- `receivingYardsPerReception` = yards / receptions

## Running the Server

```bash
cd espn-api-0.45.1
uvicorn api:app --reload --port 8000
```

## Development Notes

- **Error Handling**: All endpoints include try-catch blocks for API failures
- **Timeout**: External API calls have 10-second timeouts
- **Rate Limiting**: Be mindful of ESPN API rate limits when fetching historical data
- **League Configuration**: Update LEAGUE_ID and YEAR constants when needed
- **Player ID Mapping**: Ensure ESPN player IDs are correctly passed from frontend
- **Stat ID Consistency**: ESPN Core API uses numeric IDs that require mapping
- **Missing Data Handling**: Gracefully handles seasons with no statistical data

## Integration with Frontend

### SvelteKit Application Integration
- **Port Requirement**: Frontend expects all endpoints available on localhost:8000
- **Bid Validation**: `/player-free-agent-status/{player_id}` endpoint used by bid system for real-time validation
- **Historical Stats**: Fetched on-demand via `/player-stats/{player_id}` to avoid performance issues
- **Player ID Coordination**: Numeric player IDs link free agent data with historical statistics
- **Error Handling**: Frontend components handle API failures gracefully with fallback states

### Data Flow Architecture
- **Free Agent Display**: Position-specific endpoints feed PlayerCard components
- **Player Search**: PlayerModal integration for detailed player information
- **Bid System**: Free agent validation ensures bid integrity before submission
- **Real-time Updates**: Works alongside SvelteKit SSE system for live bid notifications

## Type Integration with Frontend

### Data Model Alignment
The FastAPI backend returns data that aligns with frontend TypeScript models:
- **Player Data**: Matches `Player` interface in `src/models/types.ts`
- **Team Data**: Conforms to `Team` interface structure
- **Historical Stats**: Follows `YearlyStats` and statistical model interfaces
- **Error Responses**: Uses standardized `APIError` format

### Statistical Data Mapping
- **Defensive Stats**: Maps to `DefensiveStats` interface (defensiveTotalTackles, defensiveSacks, etc.)
- **Offensive Stats**: Maps to position-specific interfaces (PassingStats, RushingStats, ReceivingStats)
- **Derived Calculations**: Provides computed values like completion percentage and yards per attempt
- **Multi-year Data**: Structured as `YearlyStats[]` for historical analysis

## Future Enhancements

- Add caching for historical stats to reduce API calls
- Implement player search functionality
- Add more detailed defensive stats and special teams statistics
- Expand stat mapping to include additional ESPN stat IDs
- Consider database integration for persistent data storage
- Add stat validation to ensure data quality and consistency
- **Type Safety**: Add Pydantic models for request/response validation matching frontend TypeScript types