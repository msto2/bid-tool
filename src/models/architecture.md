# System Architecture & Data Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Fantasy Football Bid Tool                         │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐   │
│  │   SvelteKit     │    │   FastAPI       │    │    ESPN Fantasy API     │   │
│  │   Frontend      │◄──►│   Backend       │◄──►│    & ESPN Core API      │   │
│  │  (Port 5173)    │    │  (Port 8000)    │    │   (External Service)    │   │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Layer (SvelteKit)

```
src/
├── routes/
│   ├── +page.svelte                 # Home/Authentication
│   ├── free-agents/+page.svelte     # Free Agent Marketplace
│   ├── bids/+page.svelte           # Bid Management
│   └── api/                        # API Proxy Routes
├── lib/
│   ├── components/                 # Reusable UI Components
│   ├── data/                      # Static Data (contacts)
│   └── sse.js                     # Real-time Communication
└── models/                        # Type Definitions
```

### Backend Layer (FastAPI)

```
espn-api-0.45.1/
└── api.py                         # All API Endpoints
    ├── /teams                     # Team Data
    ├── /free-agents*              # Free Agent Data
    ├── /player-stats/{id}         # Historical Statistics
    ├── /playerinfo                # Player Details
    └── /player-free-agent-status  # Bid Validation
```

## Data Flow Diagrams

### 1. Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   User      │────►│ Team Select  │────►│ Verify Code │────►│ localStorage │
│ Home Page   │     │   Modal      │     │   Modal     │     │  Session     │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
       │                     │                     │                    │
       │                     ▼                     ▼                    │
       │            ┌─────────────────┐   ┌─────────────────┐            │
       │            │ /api/send-code  │   │ Client-side     │            │
       │            │   (SvelteKit)   │   │ Validation      │            │
       │            └─────────────────┘   └─────────────────┘            │
       │                                                                 │
       └─────────────────────────────────────────────────────────────────┘
                                Success → Redirect to Free Agents
```

### 2. Free Agent Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   Free Agents   │────►│  SvelteKit API  │────►│     FastAPI Backend     │
│     Page        │     │     Proxy       │     │   /free-agents-{pos}    │
└─────────────────┘     └─────────────────┘     └─────────────────────────┘
         │                        │                           │
         │                        │                           ▼
         │                        │              ┌─────────────────────────┐
         │                        │              │    ESPN Fantasy API     │
         │                        │              │  league.free_agents()   │
         │                        │              └─────────────────────────┘
         │                        │                           │
         │                        │◄──────────────────────────┘
         │                        │        Player Data
         │◄───────────────────────┘
         │         JSON Response
         ▼
┌─────────────────┐
│  PlayerCard     │
│  Components     │
└─────────────────┘
```

### 3. Historical Stats Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   PlayerCard    │────►│  SvelteKit API  │────►│     FastAPI Backend     │
│ Details Toggle  │     │     Proxy       │     │  /player-stats/{id}     │
└─────────────────┘     └─────────────────┘     └─────────────────────────┘
         │                        │                           │
         │                        │                           ▼
         │                        │              ┌─────────────────────────┐
         │                        │              │    ESPN Core API        │
         │                        │              │  sports.core.api.espn   │
         │                        │              │  Multi-year fetch       │
         │                        │              └─────────────────────────┘
         │                        │                           │
         │                        │◄──────────────────────────┘
         │                        │      Historical Stats
         │◄───────────────────────┘
         │      Cached Response
         ▼
┌─────────────────┐
│  Stats Display  │
│  by Category    │
└─────────────────┘
```

### 4. Bidding System Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   Bid Modal     │────►│  SvelteKit API  │────►│   In-Memory Storage     │
│ (PlayerCard)    │     │   /api/bids     │     │    (Demo System)        │
└─────────────────┘     └─────────────────┘     └─────────────────────────┘
         │                        │                           │
         │                        │                           ▼
         │                        │              ┌─────────────────────────┐
         │                        │              │   Free Agent Validation │
         │                        │              │   FastAPI Backend       │
         │                        │              └─────────────────────────┘
         │                        │                           │
         │                        │◄──────────────────────────┘
         │                        │        Validation Result
         │◄───────────────────────┘
         │         Success
         ▼
┌─────────────────┐
│   SSE Broadcast │
│ to All Clients  │
└─────────────────┘
```

### 5. Real-time Updates (SSE)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   Bids Page     │◄────│  SSE Connection │◄────│   SvelteKit Server     │
│   Component     │     │   (EventSource) │     │   /api/websocket       │
└─────────────────┘     └─────────────────┘     └─────────────────────────┘
         │                        │                           │
         ▼                        │                           │
┌─────────────────┐              │                           │
│  Live Bid List  │              │                           │
│    Updates      │              │                           │
└─────────────────┘              │                           │
                                 │                           │
┌─────────────────┐              │                           │
│  Free Agents    │◄─────────────┘                           │
│  Notifications  │                                          │
└─────────────────┘                                          │
                                                             │
                              ┌──────────────────────────────┘
                              │
                              ▼
                  ┌─────────────────────────┐
                  │   Bid Event Triggers    │
                  │  (Create/Delete Bid)    │
                  └─────────────────────────┘
```

## Component Interaction Matrix

### Core Components

| Component | Interacts With | Data Flow | Purpose |
|-----------|---------------|-----------|---------|
| **Home Page** | FastAPI `/teams`, localStorage | Teams ← API, Auth → Storage | Authentication & Team Selection |
| **Free Agents** | FastAPI `/free-agents-*`, SSE | Players ← API, Events ← SSE | Player Discovery & Bidding |
| **Bids Page** | SvelteKit `/api/bids`, SSE | Bids ← API, Events ← SSE | Bid Management & Monitoring |
| **PlayerCard** | FastAPI `/player-stats`, Modal | Stats ← API, Actions → Modal | Player Display & Interaction |
| **PlayerModal** | FastAPI `/playerinfo`, `/player-free-agent-status` | Details ← API, Validation ← API | Detailed Player Information |
| **PlayerSearch** | SvelteKit `/api/nfl-players` | Search Results ← API | Player Discovery |

### API Endpoints

| Endpoint | Frontend Caller | Backend Source | Data Type | Caching |
|----------|----------------|----------------|-----------|---------|
| `/teams` | Home Page | ESPN Fantasy API | Team[] | None |
| `/free-agents-{pos}` | Free Agents Page | ESPN Fantasy API | Player[] | None |
| `/player-stats/{id}` | PlayerCard | ESPN Core API | HistoricalStats | Component-level |
| `/playerinfo` | PlayerModal | ESPN Fantasy API | Player | None |
| `/api/bids` | Bids Page, PlayerCard | In-Memory Store | Bid[] | Real-time |
| `/api/nfl-players` | PlayerSearch | ESPN API | SearchResult[] | None |

### Data Dependencies

```
Team Selection
    │
    ├── Teams Data ← FastAPI ← ESPN Fantasy API
    └── Authentication → localStorage
                            │
                            ▼
                      Free Agents Access
                            │
                            ├── Free Agent Data ← FastAPI ← ESPN Fantasy API
                            ├── Historical Stats ← FastAPI ← ESPN Core API
                            └── Bidding Actions → SvelteKit API → In-Memory Store
                                                    │
                                                    └── SSE Broadcast → All Connected Clients
```

## Error Handling Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   Component     │────►│   Try/Catch     │────►│      Error State        │
│   Operation     │     │   Boundary      │     │     Display             │
└─────────────────┘     └─────────────────┘     └─────────────────────────┘
         │                        │                           │
         │                        ▼                           │
         │              ┌─────────────────┐                   │
         │              │ Console Logging │                   │
         │              │ Error Messages  │                   │
         │              └─────────────────┘                   │
         │                                                    │
         └────────────────────────────────────────────────────┘
                               Retry Logic
```

## Security & Validation

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   User Input    │────►│   Client-Side   │────►│    Server-Side          │
│   (Bid Data)    │     │   Validation    │     │    Validation           │
└─────────────────┘     └─────────────────┘     └─────────────────────────┘
         │                        │                           │
         │                        │                           ▼
         │                        │              ┌─────────────────────────┐
         │                        │              │   Free Agent Status     │
         │                        │              │   Verification          │
         │                        │              └─────────────────────────┘
         │                        │                           │
         │                        │◄──────────────────────────┘
         │                        │        Valid/Invalid
         │◄───────────────────────┘
         │         Result
         ▼
┌─────────────────┐
│   UI Feedback   │
│ Success/Error   │
└─────────────────┘
```

## Performance Considerations

### Caching Strategy
- **Component Level**: Historical stats cached per player ID
- **No Backend Caching**: FastAPI calls ESPN APIs directly each time
- **localStorage**: Authentication tokens with expiration
- **In-Memory**: Demo bid storage with cleanup validation

### Real-time Updates
- **Server-Sent Events**: Persistent connections for live bid updates
- **WebSocket Fallback**: Alternative connection method available
- **Connection Management**: Automatic cleanup on client disconnect

### API Rate Limiting
- **ESPN APIs**: External rate limits managed by request frequency
- **Historical Stats**: On-demand loading to reduce API calls
- **Free Agent Data**: Position-filtered requests to minimize payload