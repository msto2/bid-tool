# Components Directory

This directory contains reusable Svelte components for the Fantasy Football Bid Tool.

## Component Files

### PlayerCard.svelte
- **Purpose**: Main player display component with integrated bidding functionality
- **Key Features**:
  - Statistical breakdown display (fantasy points, position-specific stats)
  - Expandable detailed statistics with season/projected data
  - Integrated bidding modal (contract length and salary)
  - Historical data loading with async caching
  - Mobile-responsive grid layouts
- **Dependencies**: Uses PlayerModal for detailed views
- **Styling**: Implements breakdown-grid system for consistent stat display

### PlayerModal.svelte
- **Purpose**: Detailed player information overlay with bidding interface
- **Key Features**:
  - Enhanced player view with headshot display
  - Unified styling with PlayerCard using breakdown-grid
  - Free agent validation before bidding
  - API compatibility (handles both ESPN string IDs and external numeric IDs)
- **Integration**: Accessible via PlayerSearch component
- **Styling**: Shares CSS classes with PlayerCard for design consistency

### PlayerSearch.svelte
- **Purpose**: NFL player search functionality with ESPN API integration
- **Key Features**:
  - Real-time search with debounced input
  - Dropdown results display
  - ESPN API integration for comprehensive player database
  - Modal trigger for PlayerModal
- **API**: Uses `/api/nfl-players` endpoint
- **UX**: Provides quick access to any NFL player information

### PositionFilter.svelte
- **Purpose**: Position-based navigation and filtering
- **Key Features**:
  - All position support (QB, RB, WR, TE, DT, DE, LB, CB, S, K)
  - Loading state management during position changes
  - Embedded PlayerSearch integration
  - URL parameter handling for position filtering
- **Navigation**: Server-side routing with position-specific data loading
- **Integration**: Works with free-agents page server load function

## Shared Design Patterns

### Styling Architecture
- **breakdown-grid**: Consistent grid system for statistical displays
- **Dark theme**: Gradient backgrounds with glassmorphism effects
- **Mobile-first**: Responsive layouts with device-specific optimizations
- **Component reusability**: Shared CSS classes across components

### Data Flow Patterns
- **Props-based**: Components receive data through SvelteKit page props
- **API Integration**: Components interact with API routes for dynamic data
- **SSE Updates**: Real-time updates through Server-Sent Events
- **State Management**: Local component state with parent communication

### Error Handling
- **Graceful Degradation**: Components handle missing data appropriately
- **Loading States**: Visual feedback during async operations
- **API Validation**: Real-time validation against external services
- **User Feedback**: Clear error messages and loading indicators