import type { Transaction } from '@mysten/sui/transactions';

export interface CreateMarketParams {
  question: string;
  outcomes: string[];
  durationHours: number;
  resolutionSource?: string; // Optional for backwards compatibility
  numShards?: number;
  proposer?: string;
}

export interface ExecuteSettlementsParams {
  marketId: string;
  queueId: string;
  maxToProcess: number;
  adminCapId?: string;
  treasuryId?: string;
}

export interface RedeemClaimParams {
  ticketId: string;
  treasuryId?: string;
  recipientAddress?: string;
}

export interface BootstrapMarketParams {
  digest: string;
}

export interface BootstrapMarketResult {
  marketId: string;
}

export interface ResolveOracleSnapshot {
  price: number;
  numSources: number;
  timestamp: number;
  verified: boolean;
}

export interface ResolveMarketOptions {
  oracleSnapshot?: ResolveOracleSnapshot;
}

export interface IBlockchainClient {
  readonly chain: 'aptos' | 'sui' | 'movement' | 'base';
  createMarket(params: CreateMarketParams): Promise<string>;
  resolveMarket(
    marketId: string,
    winningOutcome: number,
    options?: ResolveMarketOptions
  ): Promise<string>;
  grantRole(walletAddress: string, role: string): Promise<string>;
  revokeRole(walletAddress: string, role: string): Promise<string>;
  executeSettlements?(params: ExecuteSettlementsParams): Promise<string>;
  buildRedeemClaimTransaction?(params: RedeemClaimParams): Transaction;
  bootstrapMarket?(params: BootstrapMarketParams): Promise<BootstrapMarketResult>;
  fetchRoles?(walletAddress: string): Promise<string[]>;
}
