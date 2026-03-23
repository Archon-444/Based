import { logger } from '../config/logger.js';
import { prisma } from '../database/prismaClient.js';

interface CreateSuggestionInput {
  question: string;
  category?: string;
  outcomes: string[];
  durationHours: number;
  resolutionSource?: string;
  proposer: string;
  chain: 'aptos' | 'sui' | 'movement' | 'base';
}

interface ListSuggestionsInput {
  status?: 'pending' | 'approved' | 'rejected' | 'published';
  chain?: 'aptos' | 'sui' | 'movement' | 'base';
  limit?: number;
  offset?: number;
}

export const suggestionService = {
  async createSuggestion(input: CreateSuggestionInput) {
    const suggestion = await prisma.suggestion.create({
      data: {
        question: input.question,
        category: input.category,
        outcomes: input.outcomes,
        durationHours: input.durationHours,
        resolutionSource: input.resolutionSource,
        proposer: input.proposer,
        chain: input.chain,
      },
    });

    await prisma.suggestionEvent.create({
      data: {
        suggestionId: suggestion.id,
        actorWallet: input.proposer,
        eventType: 'submitted',
        metadata: { chain: input.chain },
      },
    });

    return suggestion;
  },

  async listSuggestions(input: ListSuggestionsInput) {
    return prisma.suggestion.findMany({
      where: {
        status: input.status,
        chain: input.chain,
      },
      orderBy: { createdAt: 'desc' },
      take: input.limit ?? 50,
      skip: input.offset ?? 0,
    });
  },

  async approveSuggestion(params: {
    id: string;
    reviewer: string;
    publishOnChain: boolean;
    reviewerChain?: 'aptos' | 'sui' | 'movement' | 'base';
    txHash?: string | null;
  }) {
    let suggestion = await prisma.suggestion.update({
      where: { id: params.id },
      data: {
        status: 'approved',
        reviewer: params.reviewer,
        approvedAt: new Date(),
      },
    });

    await prisma.suggestionEvent.create({
      data: {
        suggestionId: suggestion.id,
        actorWallet: params.reviewer,
        eventType: 'approved',
        metadata: {
          chain: params.reviewerChain,
          publishOnChain: params.publishOnChain,
        },
      },
    });

    if (params.publishOnChain) {
      if (params.reviewerChain && params.reviewerChain !== suggestion.chain) {
        throw new Error(
          `Switch to the ${suggestion.chain.toUpperCase()} network to publish this market`
        );
      }

      try {
        let txHash = params.txHash ?? undefined;

        if (!txHash) {
          // On Base, market creation requires a tx hash from the admin frontend
          throw new Error('Transaction hash required for on-chain market publication on Base');
        }

        if (!txHash) {
          throw new Error('Publish transaction hash missing');
        }

        suggestion = await prisma.suggestion.update({
          where: { id: params.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            publishedMarketId: txHash,
            publishedBy: params.reviewer,
          },
        });

        await prisma.suggestionEvent.create({
          data: {
            suggestionId: suggestion.id,
            actorWallet: params.reviewer,
            eventType: 'published',
            metadata: { txHash, chain: suggestion.chain },
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to publish market on-chain');
        throw error;
      }
    }

    return suggestion;
  },

  async rejectSuggestion(params: {
    id: string;
    reviewer: string;
    reason?: string;
    reviewerChain?: 'aptos' | 'sui' | 'movement' | 'base';
  }) {
    const suggestion = await prisma.suggestion.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        reviewer: params.reviewer,
        reviewReason: params.reason,
      },
    });

    await prisma.suggestionEvent.create({
      data: {
        suggestionId: suggestion.id,
        actorWallet: params.reviewer,
        eventType: 'rejected',
        metadata: {
          reason: params.reason,
          chain: params.reviewerChain,
        },
      },
    });

    return suggestion;
  },

  async voteOnSuggestion(params: {
    id: string;
    voter: string;
    delta: number;
    voterChain?: 'aptos' | 'sui' | 'movement' | 'base';
  }) {
    const suggestion = await prisma.suggestion.update({
      where: { id: params.id },
      data: {
        upvotes: { increment: params.delta },
      },
    });

    await prisma.suggestionEvent.create({
      data: {
        suggestionId: suggestion.id,
        actorWallet: params.voter,
        eventType: 'vote',
        metadata: { delta: params.delta, chain: params.voterChain },
      },
    });

    return suggestion;
  },

  async listEvents(id: string) {
    return prisma.suggestionEvent.findMany({
      where: { suggestionId: id },
      orderBy: { timestamp: 'asc' },
    });
  },

  /**
   * Publish an approved suggestion to the blockchain
   * This is a separate action from approval to allow admins to review before publishing
   */
  async publishSuggestion(params: {
    id: string;
    publisher: string;
    publisherChain?: 'aptos' | 'sui' | 'movement' | 'base';
    txHash?: string;
  }) {
    // 1. Get suggestion (must be 'approved')
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: params.id },
    });

    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    if (suggestion.status !== 'approved') {
      throw new Error('Only approved suggestions can be published');
    }

    if (suggestion.publishedMarketId) {
      throw new Error('Suggestion already published');
    }

    if (params.publisherChain && params.publisherChain !== suggestion.chain) {
      throw new Error(
        `Switch to the ${suggestion.chain.toUpperCase()} network to publish this market`
      );
    }

    // 2. Create market on-chain (requires tx hash from admin frontend for Base)
    try {
      if (!params.txHash) {
        throw new Error('Transaction hash required for on-chain market publication on Base');
      }
      const txHash = params.txHash;

      // 3. Update suggestion
      const updatedSuggestion = await prisma.suggestion.update({
        where: { id: params.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          publishedMarketId: txHash,
          publishedBy: params.publisher,
        },
      });

      // 4. Create event log
      await prisma.suggestionEvent.create({
        data: {
          suggestionId: suggestion.id,
          actorWallet: params.publisher,
          eventType: 'published',
          metadata: { txHash, chain: suggestion.chain },
        },
      });

      logger.info({ suggestionId: params.id, txHash }, 'Suggestion published to blockchain');
      return updatedSuggestion;
    } catch (error) {
      logger.error({ error, suggestionId: params.id }, 'Failed to publish market on-chain');
      throw error;
    }
  },
};
