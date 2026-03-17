import { useQuery } from '@tanstack/react-query';
import { env } from '../config/env';

export interface Trade {
  id: string;
  trader: string;
  outcomeIndex: number;
  tradeType: 'BUY' | 'SELL';
  amount: string;
  outcomeTokens: string;
  fee: string;
  txHash: string;
  timestamp: string;
}

export interface TradeResult {
  trades: Trade[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

const API_BASE = env.apiUrl;

export function useTradeHistory(marketId: string | undefined, page = 1) {
  return useQuery<TradeResult>({
    queryKey: ['trades', marketId, page],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/trades/${marketId}?page=${page}&limit=50`);
      if (!res.ok) throw new Error(`Failed to fetch trades: ${res.statusText}`);
      return res.json();
    },
    enabled: !!marketId,
    refetchInterval: 30_000,
  });
}
