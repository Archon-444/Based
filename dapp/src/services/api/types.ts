// API Types for Backend Integration

export interface Suggestion {
  id: string;
  question: string;
  category?: string;
  outcomes: string[];
  durationHours: number;
  resolutionSource?: string;
  proposer: string;
  reviewer?: string;
  reviewReason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  chain: 'aptos' | 'sui' | 'movement' | 'base';
  upvotes: number;
  publishedMarketId?: string;
  publishedBy?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface CreateSuggestionInput {
  question: string;
  outcomes: string[];
  category?: string;
  durationHours: number;
  resolutionSource?: string;
  chain?: 'aptos' | 'sui' | 'movement' | 'base' | 'base';
}

export interface ApproveSuggestionInput {
  publishOnChain?: boolean;
  txHash?: string;
}

export interface RejectSuggestionInput {
  reason?: string;
}

export interface VoteOnSuggestionInput {
  delta: number;
}

export type SuggestionEventType = 'submitted' | 'approved' | 'rejected' | 'published' | 'vote';

export interface SuggestionEvent {
  id: string;
  suggestionId: string;
  eventType: SuggestionEventType;
  actorWallet: string;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
}

export interface Market {
  id: string;
  onChainId: string;
  chain: 'aptos' | 'sui' | 'movement' | 'base';
  question: string;
  category?: string;
  creatorWallet?: string;
  endDate?: string;
  status?: string;
  totalVolume: string;
  yesPool: string;
  noPool: string;
  resolvedOutcome?: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export type LeaderboardMetric = 'profit' | 'volume';
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardEntry {
  id: string;
  walletAddress: string;
  displayName?: string | null;
  metric: LeaderboardMetric;
  period: LeaderboardPeriod;
  chain: 'aptos' | 'sui' | 'movement' | 'base';
  rank: number;
  value: string;
  totalProfit: string;
  totalVolume: string;
  totalBets: number;
  winRate: number;
  badges: string[];
  snapshotAt: string;
}

export interface UserLeaderboardSummary {
  walletAddress: string;
  stats: LeaderboardEntry[];
  latestByMetric: Record<string, LeaderboardEntry[]>;
}
