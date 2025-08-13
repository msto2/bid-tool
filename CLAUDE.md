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
2. **Free Agent Data**: External API server → SvelteKit server → Component props with URL parameter filtering
3. **Player Stats**: Includes both current season and projected statistics with category-based organization
4. **Position Filtering**: Server-side URL parameter handling for position-specific data loading
5. **Bid Management**: Real-time bid creation, deletion, and synchronization across clients via SSE

## UI/UX Design System

### Header Layout Architecture
All pages follow a consistent, clean header design pattern:

**Desktop Layout**:
- **Header Content**: Centered page title and subtitle
- **User Navigation**: Compact navigation bar positioned absolutely to the right of header content
- **Footer Sign-out**: Sign-out button relocated to footer, right-aligned to mirror navigation

**Mobile Layout**: 
- **Responsive Stack**: User navigation moves above page content
- **Centered Footer**: Sign-out button centers on mobile devices
- **Flexible Navigation**: Buttons wrap appropriately for smaller screens

### Navigation Design
- **Compact User Info**: Removed team name display for cleaner appearance
- **Smaller Buttons**: Reduced padding (0.4rem x 0.6rem) and font size (0.75rem)
- **Consistent Styling**: Blue navigation buttons with hover effects
- **Cross-page Navigation**: Complete navigation between Home, Free Agents, and Bids

## Key Files and Structure

### Core Application Files
- `src/routes/+page.server.js` - ESPN league data fetching
- `src/routes/+page.svelte` - League overview interface
- `src/routes/free-agents/+page.server.js` - Free agent data fetching  
- `src/routes/free-agents/+page.svelte` - Free agent marketplace interface
- `src/routes/bids/+page.server.js` - Bid data management
- `src/routes/bids/+page.svelte` - Bid viewing and management interface

### Component Files
- `src/lib/components/PlayerCard.svelte` - Player statistics display with bidding
- `src/lib/components/PlayerModal.svelte` - Detailed player information modal
- `src/lib/components/PlayerSearch.svelte` - NFL player search functionality
- `src/lib/components/PositionFilter.svelte` - Position filtering with search
- **See `src/lib/components/CLAUDE.md`** for detailed component documentation

### API Routes
- `src/routes/api/bids/+server.js` - Bid CRUD operations and SSE broadcasting
- `src/routes/api/nfl-players/+server.js` - ESPN NFL player data API
- `src/routes/api/player-stats/+server.js` - Historical player statistics
- `src/routes/api/websocket/+server.js` - Server-Sent Events for real-time updates
- **See `src/routes/api/CLAUDE.md`** for detailed API documentation

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
- Real-time bid notifications via Server-Sent Events (SSE)

### Component Architecture

#### PlayerCard Component (`src/lib/components/PlayerCard.svelte`)
- **Statistical Display**: Fantasy points (projected/current), categorized stats breakdown
- **Position-Specific Stats**: Passing, rushing, receiving stats organized by player position
- **Historical Data**: Multi-year statistics with async loading and caching
- **Bidding Interface**: Integrated modal for contract bidding (years + salary)
- **Responsive Layout**: Flex-based breakdown grid with mobile optimizations

#### PlayerModal Component (`src/lib/components/PlayerModal.svelte`)
- **Detailed Player View**: Enhanced player information with headshot display
- **Unified Styling**: Uses same breakdown-grid styles as PlayerCard for consistency
- **Player Search Integration**: Accessible via PlayerSearch component
- **API Compatibility**: Handles both ESPN API (string IDs) and external API (numeric IDs)
- **Free Agent Validation**: Real-time verification of player availability before bidding

#### PlayerSearch Component (`src/lib/components/PlayerSearch.svelte`)
- **ESPN API Integration**: Searches comprehensive NFL player database
- **Real-time Search**: Debounced input with dropdown results
- **Modal Trigger**: Opens PlayerModal for detailed player information

#### PositionFilter Component (`src/lib/components/PositionFilter.svelte`)
- **Position Navigation**: All positions (QB, RB, WR, TE, DT, DE, LB, CB, S, K)
- **Loading States**: Visual feedback during position changes
- **PlayerSearch Integration**: Embedded search functionality

### Bidding System Architecture

#### Bid Management (`src/routes/api/bids/+server.js`)
- **In-Memory Storage**: Demo-level bid persistence with cleanup validation
- **Free Agent Validation**: Real-time checking against external API availability
- **SSE Broadcasting**: Live notifications to all connected clients
- **CRUD Operations**: Create, read, delete bids with proper error handling

#### Bid Viewing (`src/routes/bids/+page.svelte`)
- **Real-Time Updates**: Live bid list with SSE synchronization
- **Bid Deletion**: Team owners can remove their own bids
- **Responsive Layout**: Mobile-optimized bid cards with player information

### Styling Architecture
- **Consistent Design System**: Unified breakdown-grid components across PlayerCard and PlayerModal
- **Dark Theme**: Gradient backgrounds with glassmorphism effects
- **Mobile-First Design**: Responsive layouts with device-specific optimizations
- **Component Reusability**: Shared CSS classes and styling patterns
- **Modern UI Patterns**: Backdrop filters, hover effects, and smooth animations

## Package Information

This project is configured as a **SvelteKit library package**:
- Exports library components from `src/lib/`
- Uses `src/routes/` as showcase/preview application  
- Configured for npm publishing with proper TypeScript declarations
- Includes `espn-fantasy-football-api` as a runtime dependency