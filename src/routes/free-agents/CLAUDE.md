# CLAUDE.md - Free Agents Page

This file provides guidance to Claude Code (claude.ai/code) when working with the free agents page components.

## Overview

The free-agents page (`/free-agents`) is the core marketplace interface where users browse available players, view detailed statistics, and submit bids. It features lazy-loaded historical stats, responsive design, and comprehensive bid submission functionality.

## File Structure

- `+page.server.js` - Server-side data loading from FastAPI backend
- `+page.svelte` - Main free agents component with player display and bidding

## Key Features

### Data Loading Architecture
- **Server-Side**: Fetches position-specific free agent data from FastAPI
- **Client-Side**: Lazy loads historical stats on demand
- **Caching**: Prevents redundant API calls with in-memory cache
- **Error Handling**: Graceful fallbacks for API failures

### Player Display System
- **Position Sections**: Organized by QB, RB, WR, TE, defensive positions
- **Card Layout**: Rich player information with expandable details
- **Stats Integration**: Current projections + 3 years of historical data
- **Responsive Design**: Optimized for mobile, tablet, and desktop

### Bid Submission Flow
- **Modal Interface**: Clean, focused bid submission experience
- **Contract Options**: 1-5 year contracts with $1-50M annual salaries
- **localStorage Persistence**: Bids survive browser sessions
- **Success Feedback**: Toast notifications and error handling

## Data Architecture

### Player Data Structure
```javascript
{
  id: number,                    // ESPN player ID
  name: string,                  // Player name
  position: string,              // Position (QB, RB, WR, etc.)
  team: string,                  // NFL team
  projected_points: number,      // Season projection
  total_points: number,          // Current season total
  avg_points: number,            // Average per game
  projected_avg_points: number,  // Projected per game
  status: string,                // Active status
  stats: object,                 // Current/projected stats
  historicalStats?: array        // Lazy-loaded historical data
}
```

### Historical Stats Integration
- **API Endpoint**: `/player-stats/{player_id}`
- **Data Range**: 2022, 2023, 2024 seasons
- **Lazy Loading**: Fetched only when user expands details
- **Cache Management**: Prevents duplicate requests

## Component Architecture

### State Management
- `signedInTeam` - Authentication state
- `freeAgentsByPosition` - Mutable player data (allows historical stats updates)
- `selectedPlayer` - Current bid target
- `showAddModal` - Bid modal visibility
- `loadingHistoricalStats` - Track loading states per player
- `historicalStatsCache` - In-memory stats cache

### Key Functions

#### `fetchHistoricalStats(playerId)`
- Makes API request to FastAPI backend
- Updates loading state and cache
- Handles errors gracefully
- Returns formatted historical data

#### `handleDetailsToggle(event, player)`
- Triggered when user expands player details
- Initiates historical stats loading
- Updates player object with new data
- Triggers UI reactivity

#### `addPlayer()`
- Creates comprehensive bid object
- Saves to localStorage with proper structure
- Shows success feedback
- Integrates with authentication system

### Statistical Display System

#### Stat Label Mapping
- **Position-Specific**: Different stats for QB vs RB vs WR/TE
- **Consistent Naming**: Unified display labels across data sources
- **Derived Calculations**: Completion percentages, yards per attempt

#### Breakdown Grid System
- **Responsive Design**: 
  - Desktop: Single row layout (6-8 columns)
  - Tablet: 4 columns
  - Mobile: 3 columns
- **Hover Effects**: Visual feedback on interaction
- **Loading States**: Spinner animations during data fetch

## UI/UX Features

### Authentication Integration
- **Route Protection**: Redirects unauthenticated users
- **User Context**: Displays signed-in team name
- **Session Management**: 24-hour authentication expiration
- **Navigation**: Seamless routing to bids page

### Modal System
- **Bid Interface**: Clean contract selection (years/salary)
- **Error Display**: Inline error messages
- **Success Feedback**: Animated toast notifications
- **Keyboard Support**: Enter key navigation

### Responsive Design
- **Mobile-First**: Optimized touch interactions
- **Breakpoint System**: 480px, 768px, 1024px breakpoints
- **Flexible Layouts**: CSS Grid and Flexbox combinations
- **Touch-Friendly**: Appropriate button sizes and spacing

## Integration Points

### FastAPI Backend
- **Position Endpoints**: `/free-agents-{position}`
- **Historical Stats**: `/player-stats/{player_id}`
- **Team Data**: Links to team information system

### Authentication System
- **localStorage**: Reads signed-in team data
- **Route Guards**: Protects against unauthorized access
- **Context Passing**: Team info for bid attribution

### Bid Management
- **Data Structure**: Comprehensive bid objects with metadata
- **Persistence**: localStorage with JSON serialization
- **Navigation**: Integration with bids viewing page

## Performance Optimizations

### Lazy Loading Strategy
- **Historical Stats**: Only loaded on user interaction
- **Cache Implementation**: Prevents duplicate API requests
- **Loading States**: Visual feedback during data fetch

### Reactivity Management
- **Mutable Data**: `freeAgentsByPosition` as reactive variable
- **Selective Updates**: Only update specific player objects
- **Efficient Re-renders**: Svelte's reactive assignments

## Development Guidelines

### Adding New Features
- **Maintain Responsiveness**: Test across all breakpoints
- **Follow Stat Patterns**: Use existing label mapping system
- **Preserve Performance**: Consider lazy loading for heavy operations
- **Error Handling**: Graceful degradation for API failures

### Statistical Enhancements
- **Position Logic**: Update `getRelevantStatLabels()` for new positions
- **Data Mapping**: Maintain consistency with backend stat names
- **Display Formatting**: Use existing percentage and rounding logic

### UI/UX Modifications
- **Design System**: Follow established color and spacing patterns
- **Modal Patterns**: Extend existing modal architecture
- **Loading States**: Implement consistent loading indicators

## Error Handling Strategies

- **API Failures**: Show loading states, fallback to empty data
- **Authentication**: Redirect to login on token expiration
- **localStorage**: Validate JSON structure, recover from corruption
- **User Feedback**: Clear error messages and recovery suggestions

## Future Enhancement Areas

- **Real-time Updates**: WebSocket integration for live data
- **Advanced Filtering**: Position, salary, projection filters  
- **Comparison Tools**: Side-by-side player comparisons
- **Mobile App**: PWA features for mobile experience
- **Analytics**: Player valuation and trend analysis