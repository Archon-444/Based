import { useState } from 'react';

// Stub for Base chain — resolution data comes from backend API / market detail
export interface ResolutionMetadata {
  resolved: boolean;
  winningOutcome: number;
  source: number;
  strategy: number;
}

export interface PythPriceSnapshot {
  hasSnapshot: boolean;
  price: bigint;
  priceNegative: boolean;
  confidence: bigint;
  expo: number;
  expoNegative: boolean;
  publishTime: number;
  receivedAt: number;
}

export const useMarketResolution = (_marketId: string | number | null) => {
  // On Base, resolution data is available through the market detail API
  // This hook is kept for compatibility with existing page components
  const [state] = useState({
    metadata: null as ResolutionMetadata | null,
    price: null as PythPriceSnapshot | null,
    isLoading: false,
    error: null as Error | null,
  });

  return { ...state, refetch: () => {} };
};
