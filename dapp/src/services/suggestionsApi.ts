import { apiClient } from './api/client';
import type { WalletAuthContext } from './api/client';
import type {
  Suggestion,
  SuggestionEvent as ApiSuggestionEvent,
  CreateSuggestionInput,
} from './api/types';

export type MarketSuggestionStatus = Suggestion['status'];
export type SuggestionEventType = ApiSuggestionEvent['eventType'];

export interface MarketSuggestion {
  id: string;
  proposer: string;
  question: string;
  outcomes: string[];
  category?: string | null;
  resolutionSource?: string | null;
  durationHours: number;
  status: MarketSuggestionStatus;
  reviewer?: string | null;
  reviewReason?: string | null;
  votes: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  publishedMarketId?: string | null;
  publishedBy?: string | null;
  chain: 'aptos' | 'sui' | 'movement' | 'base';
  txHash?: string | null;
}

export interface SuggestionEvent {
  id: string;
  suggestionId: string;
  type: SuggestionEventType;
  actor: string;
  timestamp: string;
  metadata?: Record<string, any> | null;
}

export interface CreateMarketSuggestionInput extends Omit<CreateSuggestionInput, 'chain'> {
  chain?: 'aptos' | 'sui' | 'movement' | 'base';
}

export interface ReviewSuggestionInput {
  status: Exclude<MarketSuggestionStatus, 'pending'>;
  reason?: string;
  publishOnChain?: boolean;
  txHash?: string;
  chain?: 'aptos' | 'sui' | 'movement' | 'base';
}

export const mapSuggestionToMarketSuggestion = (suggestion: Suggestion): MarketSuggestion => ({
  id: suggestion.id,
  proposer: suggestion.proposer,
  question: suggestion.question,
  outcomes: suggestion.outcomes,
  category: suggestion.category,
  resolutionSource: suggestion.resolutionSource,
  durationHours: suggestion.durationHours,
  status: suggestion.status,
  reviewer: suggestion.reviewer,
  reviewReason: suggestion.reviewReason,
  votes: suggestion.upvotes ?? 0,
  createdAt: suggestion.createdAt,
  updatedAt: suggestion.updatedAt,
  approvedAt: suggestion.approvedAt ?? null,
  publishedMarketId: suggestion.publishedMarketId ?? null,
  publishedBy: suggestion.publishedBy ?? null,
  chain: suggestion.chain,
  txHash: suggestion.publishedMarketId ?? null,
});

const mapEvent = (event: ApiSuggestionEvent): SuggestionEvent => ({
  id: event.id,
  suggestionId: event.suggestionId,
  type: event.eventType,
  actor: event.actorWallet,
  timestamp: event.timestamp,
  metadata: event.metadata ?? null,
});

export const submitMarketSuggestion = async (
  auth: WalletAuthContext,
  input: CreateMarketSuggestionInput
): Promise<MarketSuggestion> => {
  if (!auth.address) {
    throw new Error('Wallet address is required to submit a suggestion');
  }

  const suggestion = await apiClient.suggestions.create(
    {
      question: input.question,
      outcomes: input.outcomes,
      category: input.category,
      durationHours: input.durationHours,
      resolutionSource: input.resolutionSource,
      chain: input.chain,
    },
    auth
  );

  return mapSuggestionToMarketSuggestion(suggestion);
};

export const fetchMarketSuggestions = async (
  status?: MarketSuggestionStatus | 'all',
  chain?: string
): Promise<MarketSuggestion[]> => {
  const suggestions = await apiClient.suggestions.list({
    status: status && status !== 'all' ? status : undefined,
    chain,
  });
  return suggestions.map(mapSuggestionToMarketSuggestion);
};

export const reviewMarketSuggestion = async (
  auth: WalletAuthContext,
  id: string,
  review: ReviewSuggestionInput
): Promise<MarketSuggestion | undefined> => {
  if (!auth.address) {
    throw new Error('Wallet address is required to review suggestions');
  }

  if (review.status === 'approved') {
    const suggestion = await apiClient.suggestions.approve(
      id,
      { publishOnChain: Boolean(review.publishOnChain), txHash: review.txHash },
      auth
    );
    return mapSuggestionToMarketSuggestion(suggestion);
  }

  if (review.status === 'rejected') {
    const suggestion = await apiClient.suggestions.reject(
      id,
      { reason: review.reason },
      auth
    );
    return mapSuggestionToMarketSuggestion(suggestion);
  }

  return undefined;
};

export const voteOnSuggestion = async (
  auth: WalletAuthContext,
  id: string,
  delta: number,
  chain?: string
): Promise<MarketSuggestion> => {
  if (!auth.address) {
    throw new Error('Wallet address is required to vote on suggestions');
  }

  const suggestion = await apiClient.suggestions.vote(
    id,
    { delta },
    {
      ...auth,
      chain: chain ?? auth.chain,
    }
  );

  return mapSuggestionToMarketSuggestion(suggestion);
};

export const fetchSuggestionEvents = async (
  auth: WalletAuthContext | undefined,
  suggestionId?: string,
  chain?: string
): Promise<SuggestionEvent[]> => {
  if (!auth?.address) {
    return [];
  }

  if (!suggestionId) {
    return [];
  }

  const events = await apiClient.suggestions.events(suggestionId, {
    ...auth,
    chain: chain ?? auth.chain,
  });
  return events.map(mapEvent);
};
