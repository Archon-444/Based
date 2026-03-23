/**
 * Blockchain Event Types for Event Indexer (M2)
 *
 * These types define the structure of events emitted by the prediction market smart contracts.
 * Events are indexed from the blockchain and stored in PostgreSQL for efficient querying.
 */

export interface MarketCreatedEvent {
  market_id: string;
  creator: string;
  question: string;
  outcomes: string[];
  end_timestamp: string;
  liquidity_parameter: string;
}

export interface MarketResolvedEvent {
  market_id: string;
  resolver: string;
  winning_outcome: number;
  total_volume: string;
}

export interface BetPlacedEvent {
  market_id: string;
  bettor: string;
  outcome: number;
  amount: string;
  shares: string;
  timestamp: string;
}

export interface WinningsClaimedEvent {
  market_id: string;
  user: string;
  amount: string;
  timestamp: string;
}

export interface DisputeCreatedEvent {
  dispute_id: string;
  market_id: string;
  disputor: string;
  reason: string;
  timestamp: string;
}

export interface DisputeResolvedEvent {
  dispute_id: string;
  market_id: string;
  accepted: boolean;
  new_outcome: number | null;
  timestamp: string;
}

export interface RoleGrantedEvent {
  wallet: string;
  role: string;
  granted_by: string;
  timestamp: string;
}

export interface RoleRevokedEvent {
  wallet: string;
  role: string;
  revoked_by: string;
  timestamp: string;
}

export interface SystemPausedEvent {
  paused_by: string;
  timestamp: string;
}

export interface SystemUnpausedEvent {
  unpaused_by: string;
  timestamp: string;
}

/**
 * Union type of all possible event types
 */
export type BlockchainEvent =
  | MarketCreatedEvent
  | MarketResolvedEvent
  | BetPlacedEvent
  | WinningsClaimedEvent
  | DisputeCreatedEvent
  | DisputeResolvedEvent
  | RoleGrantedEvent
  | RoleRevokedEvent
  | SystemPausedEvent
  | SystemUnpausedEvent;

/**
 * Event type identifiers matching smart contract event names
 */
export enum EventType {
  MarketCreated = 'MarketCreatedEvent',
  MarketResolved = 'MarketResolvedEvent',
  BetPlaced = 'BetPlacedEvent',
  WinningsClaimed = 'WinningsClaimedEvent',
  DisputeCreated = 'DisputeCreatedEvent',
  DisputeResolved = 'DisputeResolvedEvent',
  RoleGranted = 'RoleGrantedEvent',
  RoleRevoked = 'RoleRevokedEvent',
  SystemPaused = 'SystemPausedEvent',
  SystemUnpaused = 'SystemUnpausedEvent',
}

/**
 * Raw event data from Aptos blockchain
 */
export interface AptosEvent {
  version: string;
  guid?: {
    creation_number?: string;
    account_address?: string;
  };
  sequence_number: string;
  type: string;
  data: Record<string, any>;
}

/**
 * Processed event ready for database storage
 */
export interface ProcessedEvent {
  chain: 'aptos' | 'sui' | 'movement' | 'base';
  eventType: EventType;
  transactionHash: string;
  sequenceNumber: bigint;
  eventData: BlockchainEvent;
  blockHeight?: bigint;
  timestamp?: Date;
  marketId?: string;
}

/**
 * Indexer state for tracking sync progress
 */
export interface IndexerState {
  chain: 'aptos' | 'sui' | 'movement' | 'base';
  lastProcessedVersion: bigint;
  lastProcessedTimestamp?: Date;
  isRunning: boolean;
  lastError?: string;
}

/**
 * Indexer configuration
 */
export interface IndexerConfig {
  chain: 'aptos' | 'sui' | 'movement' | 'base';
  moduleAddress: string;
  startVersion?: bigint;
  pollInterval: number; // milliseconds
  batchSize: number; // events per batch
  maxRetries: number;
  retryDelay: number; // milliseconds
  usdcCoinType?: string;
}
