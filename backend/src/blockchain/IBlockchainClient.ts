export interface CreateMarketParams {
  question: string;
  outcomes: string[];
  durationHours: number;
  resolutionSource?: string;
  proposer?: string;
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
