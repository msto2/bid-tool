# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Fantasy Football Bid Tool** that provides a comprehensive interface for viewing and bidding on free agents in ESPN Fantasy Football leagues. The application combines SvelteKit frontend with ESPN Fantasy Football API integration to deliver real-time player data, projections, and bidding functionality.

## Development Commands

### Primary Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version and run prepack
- `npm run preview` - Preview production build locally
- `npm run check` - Type check TypeScript files
- `npm run check:watch` - Type check in watch mode

### Package Commands
- `npm run prepack` - Sync SvelteKit and build package with publint
- `npm pack` - Create distributable package

## Architecture

### Frontend Architecture
- **SvelteKit 2** with TypeScript and Vite
- **Server-side data loading** using `+page.server.js` pattern
- **Component structure**: Main league overview + dedicated free agents interface
- **Responsive design** with mobile-first approach and desktop optimizations

### API Integration Pattern
The application uses a **dual API approach**:

1. **Direct ESPN API Integration** (`src/routes/+page.server.js`):
   - Fetches league data directly from `lm-api-reads.fantasy.espn.com`
   - Requires ESPN authentication cookies (SWID, ESPN_S2)
   - Handles JSON parsing and error management

2. **External API Server** (`src/routes/free-agents/+page.server.js`):
   - Expects a separate API server running on `localhost:8000`
   - Fetches position-specific free agent data
   - Endpoints: `/teams`, `/free-agents`, `/free-agents-{position}`, `/playerinfo`

### Data Flow
1. **League Data**: Direct ESPN API → SvelteKit server → Component props
2. **Free Agent Data**: External API server → SvelteKit server → Component props
3. **Player Stats**: Includes both current season and projected statistics
4. **Position Filtering**: Separate endpoints for QB, RB, WR, TE, and defensive positions

## Key Files and Structure

### Core Application Files
- `src/routes/+page.server.js` - ESPN league data fetching
- `src/routes/+page.svelte` - League overview interface
- `src/routes/free-agents/+page.server.js` - Free agent data fetching
- `src/routes/free-agents/+page.svelte` - Free agent marketplace interface

### Configuration Files
- `package.json` - SvelteKit library configuration with ESPN API dependency
- `svelte.config.js` - Standard SvelteKit configuration
- `tsconfig.json` - TypeScript configuration with strict mode
- `vite.config.ts` - Vite build configuration

## Authentication and Environment

### Required Environment Variables (`.env`)
- `SWID` - ESPN session cookie for user identification
- `ESPN_S2` - ESPN session cookie for authentication

These cookies are required to access private league data from ESPN's API.

### External Dependencies
- **Python ESPN API Package**: Included in `espn-api-0.45.1/` directory
- **External API Server**: Must run separately on `localhost:8000` to provide free agent data
- **ESPN Fantasy Football API**: Direct integration for league data

## Development Dependencies and External APIs

### Required External Services
The free agents functionality requires an external API server providing these endpoints:
- `GET /teams` - Team data
- `GET /free-agents` - General free agent list  
- `GET /free-agents-{position}` - Position-specific players (QB, RB, WR, TE, DT, DE, LB, CB, S, K)
- `GET /playerinfo` - Detailed player information

### Player Data Structure
Free agent data includes:
- Basic info: name, position, team
- Fantasy points: projected_points, projected_avg_points, total_points, avg_points
- Detailed stats: current season breakdown and projected statistics
- Position-specific stat categories (passing, rushing, receiving)

## UI Components and Features

### League Overview (`+page.svelte`)
- Displays league settings and current status
- Shows team roster with owner information
- Responsive team listing

### Free Agent Marketplace (`free-agents/+page.svelte`)
- Position-based player organization
- Comprehensive player cards with stats
- Modal-based bidding interface (contract length and salary)
- Expandable detailed statistics with season/projected breakdowns
- Mobile-responsive grid layouts

### Styling Architecture
- Custom CSS with CSS Grid and Flexbox
- Dark theme with gradient accents
- Mobile-first responsive design
- Backdrop filter effects and modern UI patterns

## Package Information

This project is configured as a **SvelteKit library package**:
- Exports library components from `src/lib/`
- Uses `src/routes/` as showcase/preview application  
- Configured for npm publishing with proper TypeScript declarations
- Includes `espn-fantasy-football-api` as a runtime dependency