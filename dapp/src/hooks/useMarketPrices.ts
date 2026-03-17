import { useReadContract } from 'wagmi';
import { CONTRACTS, PredictionMarketAMMABI } from '../config/contracts';

export function useMarketPrices(marketId: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.amm,
    abi: PredictionMarketAMMABI,
    functionName: 'getPrices',
    args: marketId ? [marketId] : undefined,
    query: {
      enabled: !!marketId && !!CONTRACTS.amm,
      refetchInterval: 10_000,
    },
  });

  // Convert from 18-decimal bigint[] to 0-1 number[]
  const prices = data
    ? (data as bigint[]).map((p) => Number(p) / 1e18)
    : [];

  return { prices, isLoading, error, refetch };
}
