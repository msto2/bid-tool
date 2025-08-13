# CLAUDE.md - Free Agents Page

This file provides guidance to Claude Code (claude.ai/code) when working with the free agents page components.

## Overview

The free-agents page (`/free-agents`) is the core marketplace interface where users browse available players, view detailed statistics, and submit bids. It features lazy-loaded historical stats, responsive design, and comprehensive bid submission functionality.

## File Structure

- `+page.server.js` - Server-side data loading from FastAPI backend
- `+page.svelte` - Main free agents component with player display and bidding

## Key Features

### Data Loading Architecture
- **Server-Side**: Fetches position-specific free agent data using URL parameters
- **Position Filtering**: URL-based position filtering with reactive data loading
- **Client-Side**: Lazy loads historical stats on demand
- **Caching**: Prevents redundant API calls with in-memory cache
- **Error Handling**: Graceful fallbacks for API failures

### Player Display System
- **Position Filtering**: Navigate between All, QB, RB, WR, TE, and defensive positions
- **Card Layout**: Rich player information with expandable details
- **Stats Integration**: Current projections + 3 years of historical data
- **Category-Based Stats**: Organized by passing, rushing, and receiving sections
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
- `freeAgents` - Reactive player data from server
- `currentPosition` - Active position filter from URL parameters
- `selectedPlayer` - Current bid target
- `showAddModal` - Bid modal visibility
- `loadingHistoricalStats` - Track loading states per player
- `historicalStatsCache` - In-memory stats cache

### Key Functions

#### `handlePositionChange(position)`
- Navigates to URL with position parameter using goto()
- Triggers server-side data reload for selected position
- Updates reactive data and UI state

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

#### `handlePlayerBid(player, contract)`
- Creates comprehensive bid object with player and contract details
- Validates team authentication before submission
- Makes API call to `/api/bids` endpoint
- Shows success/error feedback via toast notifications
- Integrates with real-time SSE broadcasting system

### Component Integration

#### PlayerCard Component System
- **Main Display**: PlayerCard.svelte handles individual player presentation
- **Statistical Breakdown**: Integrated expandable details with category-based organization  
- **Bidding Integration**: Direct bidding interface within player cards
- **Responsive Grid**: Flexbox-based breakdown grid with mobile optimizations

#### PositionFilter Component
- **Dynamic Filtering**: Real-time position navigation with loading states
- **PlayerSearch Integration**: Embedded search functionality for player lookup
- **URL Synchronization**: Position changes update URL and trigger data reloads

#### Real-Time Features
- **Server-Sent Events**: Live bid notifications across all connected clients
- **Bid Broadcasting**: Automatic updates when other users place bids
- **Notification System**: Non-intrusive toast notifications for bid activity

### Statistical Display System

#### Component-Level Organization
- **PlayerCard Integration**: Statistical display handled by reusable PlayerCard components
- **Category-Based Breakdown**: Passing, rushing, receiving stats organized by player position
- **Historical Data Loading**: Lazy-loaded multi-year statistics with caching
- **Unified Styling**: Consistent breakdown-grid styling across all components

#### Position-Specific Logic
- **QB Stats**: Passing primary, rushing secondary
- **RB Stats**: Rushing primary, receiving secondary  
- **WR/TE Stats**: Receiving focus
- **Defensive Players**: Fallback display for non-offensive positions

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

### Header Layout Design
- **Clean Architecture**: Compact user navigation positioned to right of page title
- **No Team Display**: Removed team name for cleaner appearance
- **Desktop Layout**: Absolutely positioned navigation (top: 50%, right: 0)
- **Mobile Layout**: Stacked navigation above page content
- **Footer Sign-out**: Sign-out button moved to bottom footer, right-aligned
- **Consistent Styling**: Small navigation buttons (0.75rem font, 0.4rem x 0.6rem padding)

## Integration Points

### FastAPI Backend
- **Position Endpoints**: `/free-agents-{position}` (server-side fetching)
- **URL Parameter Integration**: Position filtering via `?position=` query parameters
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
- **Server-Side Data**: URL navigation triggers automatic data reloads
- **Reactive Statements**: `$:` syntax for position and data management
- **Selective Updates**: Only update specific player objects for historical stats
- **Efficient Re-renders**: Svelte's reactive assignments and component updates

## Development Guidelines

### Adding New Features
- **Maintain Responsiveness**: Test across all breakpoints
- **Follow Stat Patterns**: Use existing label mapping system
- **Preserve Performance**: Consider lazy loading for heavy operations
- **Error Handling**: Graceful degradation for API failures

### Statistical Enhancements
- **Category Functions**: Update `getStatsByCategory()` for new positions
- **Label Mapping**: Maintain `getCategoryLabel()` and `getStatLabel()` consistency
- **Position Logic**: Extend category assignment logic for new positions
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