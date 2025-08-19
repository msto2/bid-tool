/**
 * Core data models and type definitions for the Fantasy Football Bid Tool
 */

// ===== PLAYER MODELS =====

export interface Player {
  id: number;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'DT' | 'DE' | 'LB' | 'CB' | 'S' | 'K' | 'Unknown Position';
  team: string;
  projected_points: number;
  total_points: number;
  avg_points: number;
  projected_avg_points: number;
  status: string;
  stats: PlayerStats;
  historicalStats?: YearlyStats[];
}

export interface PlayerStats {
  breakdown: Record<string, number>;
  projected_breakdown: Record<string, number>;
}

export interface YearlyStats {
  year: number;
  stats: Record<string, number>;
}

// ===== TEAM MODELS =====

export interface Team {
  id: string;
  team_name: string;
  wins: number;
  losses: number;
  points_for?: number;
}

export interface SignedInTeam {
  id: string;
  name: string;
  signedInAt: number;
}

// ===== BID MODELS =====

export interface Bid {
  id: string;
  playerId: number;
  playerName: string;
  playerPosition: string;
  playerTeam: string;
  teamId: string;
  teamName: string;
  years: number;
  salary: number;
  timestamp: number;
}

export interface BidRequest {
  playerId: number;
  teamId: string;
  teamName: string;
  years: number;
  salary: number;
}

// ===== STATISTICAL MODELS =====

export interface PassingStats {
  passingCompletions: number;
  passingAttempts: number;
  passingCompletionPercentage: number;
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
}

export interface RushingStats {
  rushingAttempts: number;
  rushingYards: number;
  rushingYardsPerAttempt: number;
  rushingTouchdowns: number;
}

export interface ReceivingStats {
  receivingTargets: number;
  receivingReceptions: number;
  receivingYards: number;
  receivingYardsPerReception: number;
  receivingTouchdowns: number;
}

export interface DefensiveStats {
  defensiveTotalTackles: number;
  defensiveSacks: number;
  defensiveForcedFumbles: number;
  defensiveFumbles: number;
  defensivePassesDefensed: number;
  defensiveInterceptions: number;
}

// ===== AUTHENTICATION MODELS =====

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface VerificationRequest {
  teamId: string;
  method: 'email' | 'sms';
  email?: string;
  phone?: string;
}

export interface VerificationResponse {
  success: boolean;
  code?: string;
  error?: string;
}

// ===== API RESPONSE MODELS =====

export interface FreeAgentStatusResponse {
  playerId: number;
  isFreeAgent: boolean;
  isRostered: boolean;
  totalRosteredPlayers?: number;
  error?: string;
}

export interface HistoricalStatsResponse {
  playerId: number;
  historicalStats: YearlyStats[];
}

export interface NFLPlayerSearchResult {
  id: string;
  name: string;
  team: string;
  position: string;
}

// ===== SERVER-SENT EVENTS MODELS =====

export interface SSEMessage {
  type: 'bid-created' | 'bid-deleted' | 'connection-established';
  data?: Bid | { bidId: string } | { clientCount: number };
  timestamp: number;
}

// ===== FORM MODELS =====

export interface BidFormData {
  years: number;
  salary: number;
}

export interface SearchFilters {
  position?: string;
  query?: string;
}

// ===== ERROR MODELS =====

export interface APIError {
  error: string;
  status?: number;
  details?: string;
}

// ===== COMPONENT PROP MODELS =====

export interface PlayerCardProps {
  player: Player;
  onBid?: (player: Player, bidData: BidFormData) => Promise<void>;
  loadingHistoricalStats?: Record<number, boolean>;
  historicalStatsCache?: Record<number, YearlyStats[]>;
}

export interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onBid?: (player: Player, bidData: BidFormData) => Promise<void>;
}

export interface PositionFilterProps {
  currentPosition: string;
  isLoading: boolean;
}

// ===== PAGE DATA MODELS =====

export interface HomePageData {
  teams: Team[];
}

export interface FreeAgentsPageData {
  players: Player[];
  position: string;
}

export interface BidsPageData {
  bids: Bid[];
  signedInTeam: SignedInTeam;
}