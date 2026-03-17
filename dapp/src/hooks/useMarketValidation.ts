import { useMemo } from 'react';
import type { Market } from './useMarkets';

/**
 * Hook to validate if a market is active and accepting bets
 */
export const useMarketStatus = (market: Market | null) => {
  const status = useMemo(() => {
    if (!market) {
      return {
        canBet: false,
        canClaim: false,
        isExpired: false,
        isResolved: false,
        message: 'Market not found',
      };
    }

    const now = Date.now();
    const endTimestamp = market.endDate ? new Date(market.endDate).getTime() : 0;
    const isExpired = endTimestamp > 0 && endTimestamp <= now;
    const isResolved = market.status === 'resolved' || market.resolvedAt != null;

    // Can only bet if market is not expired and not resolved
    const canBet = !isExpired && !isResolved;

    // Can only claim if market is resolved
    const canClaim = isResolved;

    let message = '';
    if (isResolved) {
      message = 'Market has been resolved';
    } else if (isExpired) {
      message = 'Market has expired';
    } else if (endTimestamp > 0) {
      const timeUntilExpiry = endTimestamp - now;
      const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
      const minutesUntilExpiry = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

      if (hoursUntilExpiry > 24) {
        const daysUntilExpiry = Math.floor(hoursUntilExpiry / 24);
        message = `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} until expiry`;
      } else if (hoursUntilExpiry > 0) {
        message = `${hoursUntilExpiry}h ${minutesUntilExpiry}m until expiry`;
      } else {
        message = `${minutesUntilExpiry} minute${minutesUntilExpiry !== 1 ? 's' : ''} until expiry`;
      }
    }

    return {
      canBet,
      canClaim,
      isExpired,
      isResolved,
      message,
      timeUntilExpiry: isExpired || endTimestamp === 0 ? 0 : endTimestamp - now,
    };
  }, [market]);

  return status;
};

/**
 * Hook to validate bet parameters before submission
 */
export const useBetValidation = (market: Market | null, outcomeId: number, amount: number) => {
  const marketStatus = useMarketStatus(market);

  const validation = useMemo(() => {
    const errors: string[] = [];

    // Check market status
    if (!marketStatus.canBet) {
      errors.push(marketStatus.message);
    }

    // Check outcome validity
    if (market && (outcomeId < 0 || outcomeId >= market.outcomes.length)) {
      errors.push('Invalid outcome selected');
    }

    // Check amount
    if (amount <= 0) {
      errors.push('Bet amount must be positive');
    }

    if (amount < 1) {
      errors.push('Minimum bet is 1 USDC');
    }

    if (amount > 1_000_000) {
      errors.push('Maximum bet is 1,000,000 USDC');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [market, marketStatus, outcomeId, amount]);

  return validation;
};
