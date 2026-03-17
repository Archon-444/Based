/**
 * Structured Output Schemas
 *
 * Zod schemas for every AI agent output type. These enforce type safety
 * at the boundary between Claude's JSON responses and our code.
 */

import { z } from 'zod';

// ---------- Market Creator ----------

export const MarketProposalSchema = z
  .object({
    question: z.string().min(10).max(500),
    description: z.string().min(20).max(2000),
    outcomeCount: z.number().int().min(2).max(10),
    outcomes: z.array(z.string()).min(2).max(10),
    deadline: z.string(), // ISO 8601
    category: z.enum(['crypto', 'politics', 'sports', 'culture', 'science', 'economics', 'tech']),
    resolutionSource: z.string(),
    resolutionCriteria: z.string().min(20),
    automationType: z.enum(['pyth', 'uma']),
    priceFeedId: z.string().optional(),
    strikePrice: z.number().optional(),
    resolutionType: z.enum(['ABOVE_THRESHOLD', 'BELOW_THRESHOLD', 'BETWEEN']).optional(),
    suggestedLiquidityUsdc: z.number().min(100).max(100000),
    duplicateRisk: z.enum(['none', 'similar_exists', 'exact_duplicate']),
    riskFlags: z.array(z.string()),
  })
  .strict();

export type MarketProposal = z.infer<typeof MarketProposalSchema>;

// ---------- Resolution Agent ----------

export const ResolutionProposalSchema = z
  .object({
    proposedOutcome: z.number().int().min(0),
    outcomeName: z.string(),
    confidence: z.number().min(0).max(100),
    evidenceSummary: z.string().min(50),
    sources: z
      .array(
        z.object({
          url: z.string().url(),
          title: z.string(),
          relevance: z.enum(['primary', 'supporting', 'contextual']),
        })
      )
      .min(1),
    reasoning: z.string().min(50),
  })
  .strict();

export type ResolutionProposal = z.infer<typeof ResolutionProposalSchema>;

// ---------- Commentary Agent ----------

export const MarketCommentarySchema = z
  .object({
    commentary: z.string().min(30).max(500),
    sentiment: z.enum(['bullish', 'bearish', 'neutral', 'uncertain']),
    keyFactor: z.string().max(100),
    priceContext: z.string().optional(),
  })
  .strict();

export type MarketCommentary = z.infer<typeof MarketCommentarySchema>;

// ---------- Integrity Guardian ----------

export const DisputeAssessmentSchema = z
  .object({
    shouldDispute: z.boolean(),
    confidence: z.number().min(0).max(100),
    reasoning: z.string().min(30),
    correctOutcome: z.number().int().optional(),
    evidenceSummary: z.string().optional(),
  })
  .strict();

export type DisputeAssessment = z.infer<typeof DisputeAssessmentSchema>;
