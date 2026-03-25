import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';
import type {
  LeaderboardEntry,
  LeaderboardMetric,
  LeaderboardPeriod,
  UserLeaderboardSummary,
} from '../services/api/types';

interface UseLeaderboardOptions {
  metric?: LeaderboardMetric;
  period?: LeaderboardPeriod;
  chain?: 'aptos' | 'sui' | 'movement' | 'all';
  enabled?: boolean;
}

export const useLeaderboard = (options: UseLeaderboardOptions = {}) => {
  const {
    metric = 'profit',
    period = 'weekly',
    chain = 'all',
    enabled = true,
  } = options;

  const query = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', { metric, period, chain }],
    queryFn: () => apiClient.leaderboard.list({ metric, period, chain }),
    staleTime: 60_000,
    enabled,
  });

  const leaders = useMemo(() => {
    const d = query.data;
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object' && 'leaders' in d) return (d as any).leaders ?? [];
    return [];
  }, [query.data]);

  return {
    leaders,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};

export const useUserLeaderboard = (walletAddress?: string) => {
  const query = useQuery<UserLeaderboardSummary>({
    queryKey: ['leaderboard-user', walletAddress],
    queryFn: () => {
      if (!walletAddress) throw new Error('Missing wallet address');
      return apiClient.leaderboard.getUser(walletAddress);
    },
    enabled: Boolean(walletAddress),
    staleTime: 60_000,
  });

  return {
    summary: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};
