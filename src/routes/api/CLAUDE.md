# API Routes Directory

This directory contains SvelteKit API endpoints that provide backend functionality for the Fantasy Football Bid Tool.

## API Endpoints

### `/api/bids/+server.js`
- **Purpose**: Bid management and real-time broadcasting
- **Methods**: GET, POST, DELETE
- **Features**:
  - In-memory bid storage for demo purposes
  - Free agent validation against external API
  - Server-Sent Events (SSE) broadcasting for real-time updates
  - CRUD operations with proper error handling
- **Data Flow**: Validates bids → Stores in memory → Broadcasts to all clients
- **SSE**: Maintains persistent connections for live bid notifications

### `/api/bids/[id]/+server.js`
- **Purpose**: Individual bid operations
- **Methods**: DELETE
- **Features**: Specific bid deletion with validation
- **Authorization**: Team owners can only delete their own bids

### `/api/nfl-players/+server.js`
- **Purpose**: ESPN NFL player database search
- **Methods**: GET
- **Features**:
  - Real-time player search functionality
  - ESPN API integration for comprehensive player data
  - Supports both name and team-based searches
- **Integration**: Powers PlayerSearch component
- **Data**: Returns player names, teams, positions, and ESPN IDs

### `/api/player-stats/[playerId]/+server.js`
- **Purpose**: Historical player statistics retrieval
- **Methods**: GET
- **Features**:
  - Multi-year player statistics
  - Caching for performance optimization
  - ESPN API integration for historical data
- **Usage**: Provides detailed stats for PlayerCard and PlayerModal components
- **Data**: Returns season-by-season statistical breakdowns

### `/api/send-code/+server.js`
- **Purpose**: Code sharing functionality
- **Methods**: POST
- **Features**: Enables sharing of bid configurations or league data
- **Integration**: Supports external communication features

### `/api/websocket/+server.js`
- **Purpose**: WebSocket connection management
- **Methods**: GET (WebSocket upgrade)
- **Features**:
  - Real-time bidirectional communication
  - Fallback for SSE functionality
  - Connection management and cleanup
- **Usage**: Provides alternative to SSE for real-time updates

## API Architecture Patterns

### Authentication & Security
- **ESPN Cookies**: SWID and ESPN_S2 for private league access
- **Validation**: Free agent status validation before bid creation
- **Authorization**: Team-based permissions for bid management
- **Error Handling**: Comprehensive error responses with proper HTTP status codes

### Data Integration
- **External API**: Integration with localhost:8000 for free agent data
- **ESPN API**: Direct integration for league and player data
- **Data Transformation**: Converts between API formats as needed
- **Caching Strategy**: In-memory caching for frequently accessed data

### Real-Time Features
- **Server-Sent Events**: Primary method for real-time updates
- **WebSocket Fallback**: Alternative connection method
- **Broadcasting**: Notifications sent to all connected clients
- **Connection Management**: Proper cleanup of persistent connections

### Error Handling
- **HTTP Status Codes**: Proper REST API status code usage
- **Validation Errors**: Clear error messages for invalid data
- **API Failures**: Graceful handling of external API failures
- **Timeout Management**: Appropriate timeouts for external calls

## External Dependencies

### Required Services
- **ESPN Fantasy API**: League and player data
- **External API Server**: Free agent data (localhost:8000)
- **Environment Variables**: SWID and ESPN_S2 cookies

### API Endpoints Expected
- `GET /teams` - Team roster data
- `GET /free-agents` - Available players
- `GET /free-agents-{position}` - Position-filtered players
- `GET /playerinfo` - Detailed player information

## Type Safety & Data Models

### API Response Types
All API endpoints return data conforming to types defined in `src/models/types.ts`:
- **Player Interface**: Complete player data structure
- **Team Interface**: League team information
- **Bid Interface**: Bidding system data
- **Historical Stats**: Multi-year player performance
- **API Error**: Standardized error responses

### Request/Response Validation
- **Type Guards**: Runtime validation of incoming data
- **Error Handling**: Typed error responses with proper HTTP status codes
- **Data Transformation**: Converting between ESPN API format and application models
- **See `src/models/types.ts`** for complete API data model definitions