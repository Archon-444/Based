import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';

export interface PricePoint {
  time: string;
  pct: number;   // probability of outcome[0] in %
}

// Seeded PRNG — stable across renders for the same market
function seededRng(seed: number) {
  let s = (seed * 1664525 + 1013904223) & 0x7fffffff;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateMockHistory(marketId: number, currentPct: number, points = 30): PricePoint[] {
  const rng = seededRng(marketId);
  const startPct = Math.max(10, Math.min(90, currentPct + (rng() - 0.5) * 40));
  const data: PricePoint[] = [];
  let cur = startPct;
  const now = Date.now();

  for (let i = points - 1; i >= 0; i--) {
    const drift = i === 0 ? currentPct - cur : (rng() - 0.45) * 7;
    cur = Math.max(3, Math.min(97, cur + drift));
    data.push({
      time: format(subDays(now, i), 'MMM d'),
      pct: Math.round(i === 0 ? currentPct : cur),
    });
  }
  return data;
}

interface UsePriceHistoryResult {
  data: PricePoint[];
  isLive: boolean;   // true = real API data, false = mock
  isLoading: boolean;
}

export function usePriceHistory(
  marketId: number | null,
  currentPct: number,
  chain: string,
): UsePriceHistoryResult {
  const [data, setData] = useState<PricePoint[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (marketId === null) {
      setData([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL ?? '';
    const url = `${backendUrl}/api/markets/${marketId}/price-history?chain=${chain}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Expected: { history: [{ timestamp: number, pct: number }] }
        const raw: { timestamp: number; pct: number }[] = json.history ?? [];
        if (!raw.length) throw new Error('empty');
        return raw.map((p) => ({
          time: format(new Date(p.timestamp), 'MMM d'),
          pct: Math.round(p.pct),
        }));
      })
      .then((points) => {
        if (cancelled) return;
        setData(points);
        setIsLive(true);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Fall back to deterministic mock
        setData(generateMockHistory(marketId, currentPct));
        setIsLive(false);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [marketId, chain, currentPct]);

  return { data, isLive, isLoading };
}
