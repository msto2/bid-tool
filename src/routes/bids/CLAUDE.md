# CLAUDE.md - Bids Page

This file provides guidance to Claude Code (claude.ai/code) when working with the bids page components.

## Overview

The bids page (`/bids`) displays all submitted player bids across the league, sorted by bidder name. It provides comprehensive bid management and viewing functionality with localStorage persistence.

## File Structure

- `+page.server.js` - Server-side data loading (teams data for display)
- `+page.svelte` - Main bids page component with bid display and management

## Key Features

### Authentication Protection
- Redirects unauthenticated users to home page
- Validates stored authentication tokens with expiration
- Maintains user session state throughout the application

### Bid Display System
- **Primary Sort**: Bidder name (alphabetical)
- **Secondary Sort**: Timestamp (most recent first for same bidder)
- **Card Layout**: Rich bid information with hover effects
- **Team Integration**: Links team IDs to team names and contact information

### Data Management
- **Storage**: Uses localStorage with key `'fantasyBids'`
- **Structure**: Array of bid objects with comprehensive metadata
- **Persistence**: Survives browser sessions and page refreshes

## Bid Data Structure

```javascript
{
  id: string,              // Unique identifier
  playerId: number,        // ESPN player ID
  playerName: string,      // Player display name
  position: string,        // Player position (QB, RB, WR, etc.)
  team: string,           // NFL team abbreviation
  bidder: {
    teamId: string,       // Fantasy team ID
    name: string          // Fantasy team name
  },
  contract: {
    years: number,        // Contract length (1-5)
    salary: number        // Annual salary in millions
  },
  timestamp: number       // Unix timestamp of submission
}
```

## Component Architecture

### State Management
- `signedInTeam` - Current authenticated user
- `bids` - Array of all bids from localStorage
- `teamsMap` - Mapping of team IDs to team names

### Key Functions

#### `loadBids()`
- Retrieves bids from localStorage
- Sorts by bidder name, then timestamp
- Handles JSON parsing errors gracefully

#### `createTeamsMap()`
- Maps team IDs from FastAPI to team names
- Used for displaying bidder team information

#### Navigation Functions
- `navigateToFreeAgents()` - Routes to free agent marketplace
- `handleSignOut()` - Clears authentication and redirects

### Display Components

#### Bid Cards
- **Player Info**: Name, position, NFL team
- **Contract Details**: Years, annual salary, total value
- **Bidder Info**: Team name, contact email
- **Timestamp**: Formatted submission date

#### Empty State
- Helpful messaging when no bids exist
- Call-to-action button to browse free agents
- Encouraging visual design with icons

## Styling Architecture

### Design System
- **Dark Theme**: Gradient background with glassmorphism cards
- **Card Hover**: Elevation and border color changes
- **Responsive Grid**: Adapts to mobile, tablet, and desktop
- **Color Coding**: Green for contract values, blue for navigation

### Layout Breakpoints
- **Desktop**: Full feature layout with positioned elements
- **Tablet**: Adjusted grid and simplified layouts
- **Mobile**: Stacked elements and full-width components

## Integration Points

### localStorage Interface
- Reads bid data written by free-agents page
- Maintains data consistency across sessions
- Handles malformed data with error recovery

### Team Data
- Fetches team information from FastAPI backend
- Maps team IDs to display names
- Integrates with contact information from `contacts.js`

### Navigation Flow
- Bi-directional navigation with free-agents page
- Maintains authentication state across routes
- Provides clear user feedback and CTAs

## Error Handling

- **Missing Data**: Graceful handling of empty states
- **Invalid JSON**: Error recovery for corrupted localStorage
- **API Failures**: Fallback to empty team data
- **Authentication**: Automatic redirect to login flow

## Development Guidelines

### Adding New Features
- Maintain sorting consistency (bidder name primary)
- Preserve responsive design across breakpoints
- Follow established card component patterns
- Use existing color and spacing systems

### Data Modifications
- Always validate localStorage data structure
- Maintain backward compatibility with existing bids
- Handle data migration if structure changes
- Preserve sorting and filtering logic

### UI/UX Considerations
- Maintain loading states for data operations
- Provide clear feedback for user actions
- Ensure accessibility with proper ARIA labels
- Test across multiple device sizes

## Future Enhancements

- **Filtering**: Add filters by position, salary range, or bidder
- **Export**: CSV/PDF export functionality for league management
- **Bid Status**: Add pending/accepted/rejected status tracking
- **Notifications**: Real-time updates when new bids are placed
- **Analytics**: Bid trends and salary cap analysis