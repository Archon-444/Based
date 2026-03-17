import { useQuery } from '@tanstack/react-query';
import { env } from '../config/env';

export interface PortfolioPosition {
  marketId: string;
  onChainId: string;
  question: string;
  status: string;
  resolvedOutcome: number | null;
  holdings: Array<{
    outcomeIndex: number;
    outcome: string;
    tokens: string;
    invested: string;
  }>;
}

export interface PortfolioResult {
  address: string;
  positions: PortfolioPosition[];
}

const API_BASE = env.apiUrl;

export function usePortfolio(address: string | undefined) {
  return useQuery<PortfolioResult>({
    queryKey: ['portfolio', address],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/portfolio/${address}`);
      if (!res.ok) throw new Error(`Failed to fetch portfolio: ${res.statusText}`);
      return res.json();
    },
    enabled: !!address,
    refetchInterval: 30_000,
  });
}
