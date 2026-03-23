/**
 * TypeScript interfaces for decoded EVM events from Base chain contracts.
 * Maps 1:1 to the Solidity event signatures.
 */

// ==================== MarketFactory Events ====================

export interface MarketCreatedEvent {
  marketId: `0x${string}`;
  questionId: `0x${string}`;
  creator: `0x${string}`;
  question: string;
  outcomeCount: bigint;
  deadline: bigint;
  createdAt: bigint;
}

export interface MarketStatusChangedEvent {
  marketId: `0x${string}`;
  oldStatus: number;
  newStatus: number;
}

export interface MarketResolvedEvent {
  marketId: `0x${string}`;
  resolvedAt: bigint;
}

export interface MarketCancelledEvent {
  marketId: `0x${string}`;
  cancelledAt: bigint;
}

export interface MarketActivatedEvent {
  marketId: `0x${string}`;
}

// ==================== PredictionMarketAMM Events ====================

export interface PoolInitializedEvent {
  marketId: `0x${string}`;
  funding: bigint;
  feeRate: bigint;
}

export interface BuyEvent {
  marketId: `0x${string}`;
  buyer: `0x${string}`;
  outcomeIndex: bigint;
  investmentAmount: bigint;
  outcomeTokensBought: bigint;
  feeAmount: bigint;
}

export interface SellEvent {
  marketId: `0x${string}`;
  seller: `0x${string}`;
  outcomeIndex: bigint;
  returnAmount: bigint;
  outcomeTokensSold: bigint;
  feeAmount: bigint;
}

export interface LiquidityAddedEvent {
  marketId: `0x${string}`;
  provider: `0x${string}`;
  funding: bigint;
  sharesMinted: bigint;
}

export interface LiquidityRemovedEvent {
  marketId: `0x${string}`;
  provider: `0x${string}`;
  sharesBurned: bigint;
  collateralReturned: bigint;
}

export interface PoolFrozenEvent {
  marketId: `0x${string}`;
}

// ==================== UmaCtfAdapter Events ====================

export interface UmaMarketRegisteredEvent {
  marketId: `0x${string}`;
  questionId: `0x${string}`;
  reward: bigint;
  bond: bigint;
}

export interface OutcomeAssertedEvent {
  marketId: `0x${string}`;
  assertionId: `0x${string}`;
  proposedOutcome: bigint;
  asserter: `0x${string}`;
}

export interface AssertionSettledEvent {
  marketId: `0x${string}`;
  assertionId: `0x${string}`;
  truthful: boolean;
}

export interface AssertionDisputedEvent {
  marketId: `0x${string}`;
  assertionId: `0x${string}`;
}

export interface MarketResetEvent {
  marketId: `0x${string}`;
  disputeCount: bigint;
}

// ==================== PythOracleAdapter Events ====================

export interface PythMarketRegisteredEvent {
  marketId: `0x${string}`;
  feedId: `0x${string}`;
  strikePrice: bigint;
  resolutionType: number;
}

export interface PythMarketResolvedEvent {
  marketId: `0x${string}`;
  feedId: `0x${string}`;
  price: bigint;
  expo: number;
  winningOutcome: bigint;
}

// ==================== Solidity MarketStatus mapping ====================

export const MARKET_STATUS_MAP: Record<number, string> = {
  0: 'active', // Created — but we map to 'active' since DB doesn't have 'created'
  1: 'active', // Active
  2: 'resolving', // Resolving
  3: 'disputed', // Disputed
  4: 'resolved', // Resolved
  5: 'cancelled', // Cancelled
} as const;
