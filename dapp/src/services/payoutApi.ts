import env from '../config/env';

export type ChainKey = 'aptos' | 'sui' | 'movement' | 'base';

export interface PayoutQuote {
  estimatedPayout: number;
  potentialProfit: number;
  currentOdds: number;
  fees: {
    trading: number;
    creator: number;
    protocol: number;
    total: number;
  };
  chain: ChainKey;
  marketId?: string | null;
  onChainId?: string | null;
  shares?: {
    micro: string;
    decimal: number;
  };
  priceImpact?: number;
}

interface PayoutQuoteRequest {
  chain: ChainKey;
  onChainId: string;
  outcomeIndex: number;
  amount: number;
  marketId?: string;
}

const normalizeApiBase = (rawUrl: string): string => {
  const trimmed = rawUrl.replace(/\/$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
};

export async function fetchPayoutQuote(
  params: PayoutQuoteRequest,
  options: { signal?: AbortSignal } = {}
): Promise<PayoutQuote> {
  const apiBase = normalizeApiBase(env.apiUrl);
  const payload = {
    chain: params.chain,
    onChainId: params.onChainId,
    outcomeIndex: params.outcomeIndex,
    amount: params.amount,
    ...(params.marketId ? { marketId: params.marketId } : {}),
  };

  const response = await fetch(`${apiBase}/markets/calculate-payout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!response.ok) {
    let message = response.statusText || 'Failed to fetch payout quote';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.error === 'string') {
        message = errorBody.error;
      }
    } catch {
      // ignore parse errors and use default message
    }
    throw new Error(message);
  }

  const data = await response.json();

  return {
    estimatedPayout: Number(data.estimatedPayout ?? 0),
    potentialProfit: Number(data.potentialProfit ?? 0),
    currentOdds: Number(data.currentOdds ?? 0),
    fees: {
      trading: Number(data.fees?.trading ?? 0),
      creator: Number(data.fees?.creator ?? 0),
      protocol: Number(data.fees?.protocol ?? 0),
      total: Number(data.fees?.total ?? 0),
    },
    chain: (data.chain ?? params.chain) as ChainKey,
    marketId: data.marketId ?? params.marketId ?? null,
    onChainId: data.onChainId ?? params.onChainId ?? null,
    shares: typeof data.shares === 'object' && data.shares !== null
      ? {
          micro: String(data.shares.micro ?? '0'),
          decimal: Number(data.shares.decimal ?? data.estimatedPayout ?? 0),
        }
      : undefined,
    priceImpact: typeof data.priceImpact === 'number' ? data.priceImpact : undefined,
  };
}

export default fetchPayoutQuote;
