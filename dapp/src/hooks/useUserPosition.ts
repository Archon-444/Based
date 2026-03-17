import { usePortfolio } from './usePortfolio';

export interface UserPosition {
  outcome: number;
  stake: number;
  shares: number;
  claimed: boolean;
}

export const useUserPosition = (
  userAddress: string | undefined,
  _marketId: string | number | null
) => {
  // Delegate to portfolio API — position data comes from backend indexer
  const { data, isLoading, error } = usePortfolio(userAddress);
  const marketId = _marketId !== null ? String(_marketId) : null;

  const position: UserPosition | null = (() => {
    if (!data?.positions || !marketId) return null;
    const pos = data.positions.find((p) => p.onChainId === marketId || p.marketId === marketId);
    if (!pos || pos.holdings.length === 0) return null;
    const h = pos.holdings[0];
    return {
      outcome: h.outcomeIndex,
      stake: Number(h.invested) / 1e6,
      shares: Number(h.tokens) / 1e18,
      claimed: false,
    };
  })();

  return { position, isLoading, error, refetch: () => {} };
};

export const useUserPositions = (userAddress: string | undefined, _marketCount: number) => {
  const { data, isLoading, error } = usePortfolio(userAddress);

  const positions = new Map<number, UserPosition>();

  if (data?.positions) {
    data.positions.forEach((pos, idx) => {
      if (pos.holdings.length > 0) {
        const h = pos.holdings[0];
        positions.set(idx, {
          outcome: h.outcomeIndex,
          stake: Number(h.invested) / 1e6,
          shares: Number(h.tokens) / 1e18,
          claimed: false,
        });
      }
    });
  }

  return { positions, isLoading, error, refetch: () => {} };
};
