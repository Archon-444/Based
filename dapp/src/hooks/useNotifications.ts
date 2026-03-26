import { useMemo, useState, useCallback } from 'react';
import type { Market } from './useMarkets';
import type { UserPosition } from './useUserPosition';

export type NotificationKind = 'win_claimable' | 'market_resolved_loss' | 'ending_soon';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  marketId: number;
  question: string;
  outcomeLabel: string;
  timestamp: number;
  read: boolean;
  amount?: number; // micro units (shares) for wins
}

const STORAGE_KEY = 'based-notifications-read';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function useNotifications(
  markets: Market[],
  positions: Map<number, UserPosition>
) {
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  const rawNotifications = useMemo<Omit<AppNotification, 'read'>[]>(() => {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const list: Omit<AppNotification, 'read'>[] = [];

    positions.forEach((pos, marketId) => {
      const market = markets.find((m) => String(m.id) === String(marketId));
      if (!market) return;

      const outcomeLabel = market.outcomes[pos.outcome] ?? `Outcome ${pos.outcome}`;
      const isResolved = market.status === 'resolved' || market.resolvedAt != null;
      const endTimestamp = market.endDate ? new Date(market.endDate).getTime() : 0;

      if (isResolved && market.resolvedOutcome === pos.outcome && !pos.claimed) {
        list.push({
          id: `win_claimable-${marketId}`,
          kind: 'win_claimable',
          marketId,
          question: market.question,
          outcomeLabel,
          timestamp: endTimestamp,
          amount: pos.shares,
        });
      } else if (isResolved && market.resolvedOutcome !== pos.outcome) {
        list.push({
          id: `market_resolved_loss-${marketId}`,
          kind: 'market_resolved_loss',
          marketId,
          question: market.question,
          outcomeLabel,
          timestamp: endTimestamp,
        });
      } else if (
        !isResolved &&
        endTimestamp > now &&
        endTimestamp - now < TWENTY_FOUR_HOURS
      ) {
        list.push({
          id: `ending_soon-${marketId}`,
          kind: 'ending_soon',
          marketId,
          question: market.question,
          outcomeLabel,
          timestamp: endTimestamp,
        });
      }
    });

    const order: Record<NotificationKind, number> = {
      win_claimable: 0,
      ending_soon: 1,
      market_resolved_loss: 2,
    };

    return list.sort((a, b) => {
      if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
      return b.timestamp - a.timestamp;
    });
  }, [markets, positions]);

  const notifications: AppNotification[] = useMemo(
    () => rawNotifications.map((n) => ({ ...n, read: readIds.has(n.id) })),
    [rawNotifications, readIds]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      rawNotifications.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }, [rawNotifications]);

  return { notifications, unreadCount, markRead, markAllRead };
}
