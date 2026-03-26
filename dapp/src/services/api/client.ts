// API Client for Backend Integration - M0
import type {
  Suggestion,
  SuggestionEvent,
  CreateSuggestionInput,
  ApproveSuggestionInput,
  RejectSuggestionInput,
  VoteOnSuggestionInput,
  Market,
  LeaderboardEntry,
  LeaderboardMetric,
  LeaderboardPeriod,
  UserLeaderboardSummary,
} from './types';
import env from '../../config/env';

const API_BASE = env.apiUrl.replace(/\/$/, '');

const buildUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

const SIGNING_PREFIX = 'Based::';

const normalizeHex = (value: string): string => {
  if (!value) return value;
  return value.startsWith('0x') ? value.toLowerCase() : `0x${value.toLowerCase()}`;
};

const generateNonce = () => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((part) => part.toString(16).padStart(8, '0'))
      .join('');
  }
  return Math.random().toString(36).substring(2, 10);
};

export interface WalletAuthContext {
  address: string;
  publicKey?: string;
  chain?: string;
  signMessage: (payload: {
    message: string;
    nonce: string;
    address?: boolean;
    application?: boolean;
    chainId?: boolean;
  }) => Promise<{
    signature?: string;
    publicKey?: string;
    fullMessage?: string;
  }>;
}

async function buildAuthHeaders(auth: WalletAuthContext): Promise<Record<string, string>> {
  const nonce = generateNonce();
  const timestamp = Date.now().toString();
  const message = `${SIGNING_PREFIX}${nonce}::${timestamp}`;

  const signed = await auth.signMessage({
    message,
    nonce,
    address: true,
    application: true,
    chainId: true,
  });

  const signature = signed.signature;
  const resolvedPublicKey = signed.publicKey ?? auth.publicKey;

  if (!signature || !resolvedPublicKey) {
    throw new Error('Wallet did not return signature or public key');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-wallet-address': normalizeHex(auth.address),
    'x-wallet-public-key': normalizeHex(resolvedPublicKey),
    'x-wallet-signature': normalizeHex(signature),
    'x-wallet-message': message,
    'x-wallet-timestamp': timestamp,
    'x-wallet-nonce': nonce,
  };

  if (auth.chain) {
    headers['x-active-chain'] = auth.chain;
  }

  return headers;
}

async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let errorMessage = fallbackMessage;

  try {
    const errorBody = await response.json();
    if (typeof errorBody === 'object' && errorBody !== null) {
      if (typeof errorBody.error === 'string') {
        errorMessage = errorBody.error;
      } else if (typeof errorBody.message === 'string') {
        errorMessage = errorBody.message;
      }
    }
  } catch {
    // Ignore JSON parse errors and use fallback message
  }

  throw new Error(errorMessage);
}

export const apiClient = {
  suggestions: {
    async create(data: CreateSuggestionInput, auth: WalletAuthContext): Promise<Suggestion> {
      const response = await fetch(buildUrl('/suggestions'), {
        method: 'POST',
        headers: await buildAuthHeaders(auth),
        body: JSON.stringify(data),
      });

      return handleResponse<Suggestion>(response, 'Failed to create suggestion');
    },

    async list(params?: { status?: string; chain?: string }): Promise<Suggestion[]> {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.chain) query.set('chain', params.chain);

      const url = query.toString()
        ? buildUrl(`/suggestions?${query}`)
        : buildUrl('/suggestions');

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      return handleResponse<Suggestion[]>(response, 'Failed to fetch suggestions');
    },

    async approve(
      id: string,
      data: ApproveSuggestionInput,
      auth: WalletAuthContext
    ): Promise<Suggestion> {
      const response = await fetch(buildUrl(`/suggestions/${id}/approve`), {
        method: 'PATCH',
        headers: await buildAuthHeaders(auth),
        body: JSON.stringify(data),
      });

      return handleResponse<Suggestion>(response, 'Failed to approve suggestion');
    },

    async reject(
      id: string,
      data: RejectSuggestionInput,
      auth: WalletAuthContext
    ): Promise<Suggestion> {
      const response = await fetch(buildUrl(`/suggestions/${id}/reject`), {
        method: 'PATCH',
        headers: await buildAuthHeaders(auth),
        body: JSON.stringify(data),
      });

      return handleResponse<Suggestion>(response, 'Failed to reject suggestion');
    },

    async vote(
      id: string,
      data: VoteOnSuggestionInput,
      auth: WalletAuthContext
    ): Promise<Suggestion> {
      const response = await fetch(buildUrl(`/suggestions/${id}/vote`), {
        method: 'PATCH',
        headers: await buildAuthHeaders(auth),
        body: JSON.stringify(data),
      });

      return handleResponse<Suggestion>(response, 'Failed to record suggestion vote');
    },

    async events(id: string, auth: WalletAuthContext): Promise<SuggestionEvent[]> {
      const response = await fetch(buildUrl(`/suggestions/${id}/events`), {
        headers: await buildAuthHeaders(auth),
      });

      return handleResponse<SuggestionEvent[]>(response, 'Failed to fetch suggestion events');
    },
  },

  markets: {
    async list(params?: { chain?: string }): Promise<Market[]> {
      const query = new URLSearchParams();
      if (params?.chain) query.set('chain', params.chain);

      const url = query.toString()
        ? buildUrl(`/markets?${query}`)
        : buildUrl('/markets');

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      return handleResponse<Market[]>(response, 'Failed to fetch markets');
    },

    async get(chain: string, onChainId: string): Promise<Market> {
      const response = await fetch(buildUrl(`/markets/${chain}/${onChainId}`), {
        headers: { 'Content-Type': 'application/json' },
      });

      return handleResponse<Market>(response, 'Failed to fetch market');
    },
  },

  leaderboard: {
    async list(params: {
      metric?: LeaderboardMetric;
      period?: LeaderboardPeriod;
      chain?: 'aptos' | 'sui' | 'movement' | 'all';
      limit?: number;
      offset?: number;
    } = {}): Promise<LeaderboardEntry[]> {
      const query = new URLSearchParams();
      if (params.metric) query.set('metric', params.metric);
      if (params.period) query.set('period', params.period);
      if (params.chain) query.set('chain', params.chain);
      if (typeof params.limit === 'number') query.set('limit', params.limit.toString());
      if (typeof params.offset === 'number') query.set('offset', params.offset.toString());

      const url = query.toString()
        ? buildUrl(`/leaderboard?${query}`)
        : buildUrl('/leaderboard');

      const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      return handleResponse<LeaderboardEntry[]>(response, 'Failed to fetch leaderboard');
    },

    async getUser(address: string): Promise<UserLeaderboardSummary> {
      const response = await fetch(buildUrl(`/leaderboard/user/${address}`), {
        headers: { 'Content-Type': 'application/json' },
      });
      return handleResponse<UserLeaderboardSummary>(response, 'Failed to fetch user leaderboard stats');
    },
  },
};

export { buildAuthHeaders };
