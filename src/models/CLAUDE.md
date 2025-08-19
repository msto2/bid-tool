# Models Directory

This directory contains the data models, type definitions, and system architecture documentation for the Fantasy Football Bid Tool.

## Files Overview

### `types.ts`
- **Purpose**: Comprehensive TypeScript type definitions for all data models
- **Key Features**:
  - Player, Team, and Bid data structures
  - Statistical model interfaces (Passing, Rushing, Receiving, Defensive)
  - Authentication and session management types
  - API response and error handling models
  - Component prop interfaces
  - Form data and validation structures

### `architecture.md`
- **Purpose**: Visual system architecture and data flow documentation
- **Key Features**:
  - UML-like system diagrams
  - Component interaction matrices
  - Data flow visualizations
  - Authentication and bidding process flows
  - Real-time update architecture
  - Error handling and security patterns

## Type System Architecture

### Core Data Models

#### Player Model Hierarchy
```
Player (Main Interface)
├── PlayerStats (Current season data)
│   ├── breakdown (Record<string, number>)
│   └── projected_breakdown (Record<string, number>)
├── YearlyStats[] (Historical data)
└── Position-specific stat interfaces:
    ├── PassingStats
    ├── RushingStats  
    ├── ReceivingStats
    └── DefensiveStats
```

#### Team & Authentication Models
```
Team (League data)
├── id: string
├── team_name: string
├── wins/losses: number
└── points_for?: number

SignedInTeam (Session data)
├── id: string (references Team.id)
├── name: string
└── signedInAt: number (timestamp)
```

#### Bidding System Models
```
Bid (Core bid data)
├── id: string (UUID)
├── playerId: number (references Player.id)
├── teamId: string (references Team.id)
├── years: number (1-5)
├── salary: number (1-50M)
└── timestamp: number

BidRequest (Submission data)
├── playerId: number
├── teamId: string
├── teamName: string
├── years: number
└── salary: number
```

### Component Interface Models

#### Props & Event Handlers
- **PlayerCardProps**: Player display and bidding interface
- **PlayerModalProps**: Detailed player information modal
- **PositionFilterProps**: Position navigation component
- **Page Data Models**: Server-side load function return types

#### Form & Interaction Models
- **BidFormData**: Contract length and salary inputs
- **SearchFilters**: Player search and filtering
- **VerificationRequest/Response**: Authentication flow data

### API & Communication Models

#### Server-Sent Events
```
SSEMessage
├── type: 'bid-created' | 'bid-deleted' | 'connection-established'
├── data?: Bid | { bidId: string } | { clientCount: number }
└── timestamp: number
```

#### API Response Structures
- **FreeAgentStatusResponse**: Player availability validation
- **HistoricalStatsResponse**: Multi-year statistical data
- **NFLPlayerSearchResult**: Search functionality results
- **APIError**: Standardized error responses

## Integration with System Components

### SvelteKit Integration
- **Page Load Functions**: Use page data models for type safety
- **Component Props**: Strongly typed component interfaces
- **Form Handling**: Validated form data structures
- **Store Integration**: Type-safe reactive stores

### FastAPI Backend Integration  
- **Request/Response Models**: Consistent data formats
- **Validation Schemas**: Server-side validation alignment
- **Error Handling**: Standardized error response formats
- **ESPN API Mapping**: Type-safe data transformation

### Real-time Communication
- **SSE Message Types**: Strongly typed event data
- **WebSocket Protocols**: Message format specifications
- **Connection Management**: Client state tracking

## Development Guidelines

### Type Safety Best Practices
- **Import Strategy**: Import specific types rather than entire module
- **Null Safety**: Use optional properties and union types appropriately
- **Generic Constraints**: Leverage TypeScript generics for reusable types
- **Runtime Validation**: Combine with zod or similar for runtime type checking

### Model Evolution
- **Backward Compatibility**: Consider API versioning for breaking changes
- **Documentation**: Update architecture.md when adding new models
- **Testing Integration**: Use models for mock data generation
- **Code Generation**: Consider generating API clients from these types

### Error Handling Patterns
- **Union Types**: Use discriminated unions for success/error states
- **Optional Fields**: Mark uncertain API responses as optional
- **Error Models**: Standardize error response structures
- **Validation Messages**: Include user-friendly error descriptions

## Future Enhancements

### Enhanced Type Safety
- **Runtime Validation**: Integration with zod or io-ts
- **API Contract Testing**: Ensure backend matches frontend types
- **Mock Data Generation**: Automated test data from type definitions
- **Documentation Generation**: Auto-generate API docs from types

### Advanced Models
- **State Management**: Redux/Zustand store type definitions
- **Caching Models**: Data fetching and cache invalidation types
- **WebSocket Protocols**: Real-time communication event types
- **Analytics Models**: User interaction tracking data structures

### Performance Optimizations
- **Bundle Analysis**: Tree-shaking optimization for unused types
- **Code Splitting**: Lazy-load type definitions where appropriate
- **Memory Management**: Efficient data structure patterns
- **Serialization**: Optimized data transfer formats