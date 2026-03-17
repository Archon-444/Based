import { useQuery } from '@tanstack/react-query';
import { env } from '../config/env';

export interface Market {
  id: string;
  onChainId: string;
  chain: string;
  question: string;
  category: string | null;
  outcomes: string[];
  creatorWallet: string | null;
  endDate: string | null;
  status: string;
  totalVolume: string;
  liquidityParam: string | null;
  outcomePools: string[];
  resolvedOutcome: number | null;
  createdAt: string;
  resolvedAt: string | null;
  conditionId: string | null;
  questionId: string | null;
  resolutionType: string | null;
}

const API_BASE = env.apiUrl;

async function fetchMarkets(): Promise<Market[]> {
  const res = await fetch(`${API_BASE}/markets?chain=base`);
  if (!res.ok) throw new Error(`Failed to fetch markets: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.markets ?? [];
}

async function fetchMarket(onChainId: string): Promise<Market> {
  const res = await fetch(`${API_BASE}/markets/base/${onChainId}`);
  if (!res.ok) throw new Error(`Failed to fetch market: ${res.statusText}`);
  return res.json();
}

export const useMarkets = () => {
  const { data: markets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets,
    refetchInterval: 30_000,
  });

  return { markets, isLoading, error, refetch };
};

export const useMarket = (marketId: string | null) => {
  const { data: market = null, isLoading, error, refetch } = useQuery({
    queryKey: ['market', marketId],
    queryFn: () => fetchMarket(marketId!),
    enabled: !!marketId,
    refetchInterval: 15_000,
  });

  return { market, isLoading, error, refetch };
};
