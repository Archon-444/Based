import { useState, useCallback, useRef } from 'react';
import toast from '../components/ui/Toast';
import { RateLimiter } from '../utils/validation';
import { useChainPlaceBet, useChainClaimWinnings } from './useChainTransactions';

export const usePlaceBet = () => {
  const chainPlaceBet = useChainPlaceBet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const rateLimiterRef = useRef(new RateLimiter(5, 60000));

  const placeBet = useCallback(
    async (marketId: string, outcome: number, amount: number): Promise<string | null> => {
      if (!Number.isFinite(amount) || amount <= 0) {
        const err = new Error('Bet amount must be greater than zero');
        setError(err);
        toast.error(err.message);
        return null;
      }

      if (!rateLimiterRef.current.checkLimit()) {
        const waitTime = Math.ceil(rateLimiterRef.current.getTimeUntilNextRequest() / 1000);
        toast.error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
        return null;
      }

      setIsLoading(true);
      setError(null);

      const toastId = toast.loading('Placing bet on Base...');

      try {
        const result = await chainPlaceBet(marketId, outcome, amount);
        toast.dismiss(toastId);
        toast.success('Bet placed successfully!');
        return result.hash;
      } catch (err) {
        toast.dismiss(toastId);
        const message = err instanceof Error ? err.message : 'Failed to place bet';
        toast.error(message);
        setError(err instanceof Error ? err : new Error(message));
        console.error('Error placing bet:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [chainPlaceBet]
  );

  return { placeBet, isLoading, error };
};

export const useClaimWinnings = () => {
  const chainClaimWinnings = useChainClaimWinnings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const claimWinnings = useCallback(
    async (conditionId: string, indexSets: bigint[]): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      const toastId = toast.loading('Claiming winnings...');

      try {
        const result = await chainClaimWinnings(conditionId, indexSets);
        toast.dismiss(toastId);
        toast.success('Winnings claimed successfully!');
        return result.hash;
      } catch (err) {
        toast.dismiss(toastId);
        const message = err instanceof Error ? err.message : 'Failed to claim winnings';
        toast.error(message);
        setError(err instanceof Error ? err : new Error(message));
        console.error('Error claiming winnings:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [chainClaimWinnings]
  );

  return { claimWinnings, isLoading, error };
};

/**
 * Stub: useCreateMarket
 * On Base, market creation is typically done by the admin/factory owner.
 * This hook provides a compatible interface for pages that still reference it.
 */
export const useCreateMarket = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createMarket = useCallback(
    async (question: string, outcomes: string[], durationHours: number): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        // Market creation on Base goes through the backend/factory contract
        // This is a placeholder — real implementation depends on contract deployment
        toast.error('Direct on-chain market creation is not yet available on Base. Please use the suggestion system.');
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create market';
        toast.error(message);
        setError(err instanceof Error ? err : new Error(message));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createMarket, isLoading, error };
};
