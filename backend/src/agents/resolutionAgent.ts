/**
 * Resolution Agent
 *
 * For UMA-type markets past their deadline, this agent:
 * 1. Gathers evidence via Claude's web_search tool
 * 2. Determines the correct outcome with a confidence score
 * 3. If confidence >= threshold, asserts the outcome on-chain via UMA adapter
 *
 * Integration: Called from keeperService.ts checkDeadlines() when a UMA market expires.
 * Safety: All errors are caught internally — never throws into the keeper.
 */

import type { Abi, Hex } from 'viem';

import { contractAddresses, umaCtfAdapterAbi } from '../blockchain/base/abis/index.js';
import { encodeCall, sendTransaction } from '../blockchain/base/transactionService.js';
import { getKeeperWallet, getPublicClient } from '../blockchain/base/viemClient.js';
import { env } from '../config/env.js';
import { prisma } from '../database/prismaClient.js';
import { createAgentLogger } from './shared/agentLogger.js';
import { searchAndParse } from './shared/claudeClient.js';
import { type ResolutionProposal, ResolutionProposalSchema } from './shared/structuredOutput.js';

const log = createAgentLogger('resolution');

// Minimal ERC-20 ABI for USDC approve
const erc20ApproveAbi = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

const SYSTEM_PROMPT = `You are a prediction market resolution agent. Your job is to determine the outcome of a prediction market based on evidence.

You will be given:
1. The market question
2. The possible outcomes (indexed from 0)
3. The market deadline
4. Resolution criteria (if available)

Your task:
1. Search the web for authoritative evidence about what actually happened
2. Determine which outcome (by index) is correct
3. Assess your confidence level (0-100)

RULES:
- Only propose outcomes you are confident about (>80%)
- Use official/authoritative sources (government sites, major news agencies, official league results)
- If the outcome is ambiguous or uncertain, set confidence below 80 and explain why
- For sports: use official league/federation results
- For politics: use official government/electoral sources
- For crypto prices: use major aggregator data (CoinGecko, CoinMarketCap)
- For culture: use the specific source mentioned in the resolution criteria
- Your sources array MUST contain at least one URL with a valid https:// URL

After searching for evidence, respond ONLY with a valid JSON object matching this exact schema:
{
  "proposedOutcome": <number - the 0-based outcome index>,
  "outcomeName": "<string - the name of the outcome>",
  "confidence": <number 0-100>,
  "evidenceSummary": "<string, min 50 chars - summary of the evidence found>",
  "sources": [{"url": "<valid https URL>", "title": "<source title>", "relevance": "primary"|"supporting"|"contextual"}],
  "reasoning": "<string, min 50 chars - your reasoning for this outcome>"
}

No markdown, no explanation, no backticks — just the JSON object.`;

interface MarketInput {
  onChainId: string;
  question: string;
  outcomes: string[];
  endDate: Date;
}

export async function tryResolveUmaMarket(market: MarketInput): Promise<void> {
  if (env.AGENT_AUTO_RESOLVE !== 'true') return;

  log.info({ marketId: market.onChainId }, '[Resolution] Evaluating market for auto-resolution');

  // Check if this market already has a pending assertion
  const existingAssertion = await prisma.umaAssertion.findFirst({
    where: {
      market: { onChainId: market.onChainId, chain: 'base' },
      status: 'PENDING',
    },
  });
  if (existingAssertion) {
    log.info(
      { marketId: market.onChainId },
      '[Resolution] Market already has a pending assertion, skipping'
    );
    return;
  }

  // Find the DB market for the FK
  const dbMarket = await prisma.market.findFirst({
    where: { onChainId: market.onChainId, chain: 'base' },
  });

  // Build context for Claude
  const userMessage = `
Market question: ${market.question}
Possible outcomes: ${market.outcomes.map((o, i) => `${i}: "${o}"`).join(', ')}
Market deadline: ${market.endDate.toISOString()} (this deadline has passed)
Number of outcomes: ${market.outcomes.length}

Based on the resolution criteria, determine which outcome (by index) is correct.
Search the web for authoritative evidence to support your determination.
  `.trim();

  // Call Claude with web search + structured output
  const result = await searchAndParse(
    SYSTEM_PROMPT,
    userMessage,
    ResolutionProposalSchema,
    'resolution'
  );

  if (!result) {
    log.error({ marketId: market.onChainId }, '[Resolution] Failed to get LLM response');
    await logAgentAction(dbMarket?.id ?? null, 'skip', null, 0, 0, 0, false, 'LLM call failed');
    return;
  }

  const { parsed: proposal, inputTokens, outputTokens, costUsd } = result;

  log.info(
    {
      marketId: market.onChainId,
      proposedOutcome: proposal.proposedOutcome,
      outcomeName: proposal.outcomeName,
      confidence: proposal.confidence,
    },
    '[Resolution] LLM decision received'
  );

  // Confidence gate
  if (proposal.confidence < env.AGENT_CONFIDENCE_THRESHOLD) {
    log.info(
      {
        marketId: market.onChainId,
        confidence: proposal.confidence,
        threshold: env.AGENT_CONFIDENCE_THRESHOLD,
      },
      '[Resolution] Confidence below threshold, skipping auto-assertion'
    );
    await logAgentAction(
      dbMarket?.id ?? null,
      'skip',
      proposal,
      inputTokens,
      outputTokens,
      costUsd,
      true,
      `Confidence ${proposal.confidence}% below threshold ${env.AGENT_CONFIDENCE_THRESHOLD}%`
    );
    return;
  }

  // Validate outcome index
  if (proposal.proposedOutcome < 0 || proposal.proposedOutcome >= market.outcomes.length) {
    log.error(
      {
        marketId: market.onChainId,
        proposedOutcome: proposal.proposedOutcome,
        outcomeCount: market.outcomes.length,
      },
      '[Resolution] Invalid outcome index from LLM'
    );
    await logAgentAction(
      dbMarket?.id ?? null,
      'skip',
      proposal,
      inputTokens,
      outputTokens,
      costUsd,
      false,
      'Invalid outcome index'
    );
    return;
  }

  // Execute on-chain assertion
  const txHash = await executeAssertion(market.onChainId, proposal);

  if (txHash) {
    log.info(
      {
        marketId: market.onChainId,
        txHash,
        proposedOutcome: proposal.proposedOutcome,
        confidence: proposal.confidence,
      },
      '[Resolution] Outcome asserted on-chain'
    );
    await logAgentAction(
      dbMarket?.id ?? null,
      'resolve',
      proposal,
      inputTokens,
      outputTokens,
      costUsd,
      true,
      null,
      txHash
    );
  } else {
    await logAgentAction(
      dbMarket?.id ?? null,
      'resolve',
      proposal,
      inputTokens,
      outputTokens,
      costUsd,
      false,
      'On-chain assertion failed'
    );
  }
}

async function executeAssertion(
  onChainMarketId: string,
  proposal: ResolutionProposal
): Promise<string | null> {
  if (!contractAddresses.umaAdapter || !contractAddresses.usdc) {
    log.error('[Resolution] UMA_ADAPTER_ADDRESS or USDC_ADDRESS not configured');
    return null;
  }

  const publicClient = getPublicClient();
  const keeperWallet = getKeeperWallet();

  try {
    // Read bond amount from UMA adapter
    const marketData = (await publicClient.readContract({
      address: contractAddresses.umaAdapter,
      abi: umaCtfAdapterAbi as Abi,
      functionName: 'getMarketData',
      args: [onChainMarketId as Hex],
    })) as { bond: bigint };

    const bond = marketData.bond;
    log.info({ marketId: onChainMarketId, bond: bond.toString() }, '[Resolution] Read bond amount');

    // Approve USDC to UMA adapter
    const approveData = encodeCall(erc20ApproveAbi as Abi, 'approve', [
      contractAddresses.umaAdapter,
      bond,
    ]);

    await sendTransaction({
      walletClient: keeperWallet,
      publicClient,
      to: contractAddresses.usdc,
      data: approveData,
      walletLabel: 'keeper',
      methodLabel: 'USDC.approve(umaAdapter)',
    });

    // Assert outcome via UMA adapter
    const assertData = encodeCall(umaCtfAdapterAbi as Abi, 'assertOutcome', [
      onChainMarketId,
      BigInt(proposal.proposedOutcome),
    ]);

    const receipt = await sendTransaction({
      walletClient: keeperWallet,
      publicClient,
      to: contractAddresses.umaAdapter,
      data: assertData,
      walletLabel: 'keeper',
      methodLabel: 'UmaAdapter.assertOutcome',
    });

    return receipt.transactionHash;
  } catch (error) {
    log.error(
      { marketId: onChainMarketId, error: error instanceof Error ? error.message : String(error) },
      '[Resolution] On-chain assertion failed'
    );
    return null;
  }
}

async function logAgentAction(
  marketId: string | null,
  action: string,
  proposal: ResolutionProposal | null,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
  success: boolean,
  error: string | null,
  txHash?: string
): Promise<void> {
  try {
    await prisma.agentAction.create({
      data: {
        agent: 'resolution',
        marketId,
        action,
        confidence: proposal?.confidence ?? null,
        reasoning: proposal?.reasoning ?? null,
        sources: proposal?.sources.map((s) => s.url) ?? [],
        inputTokens,
        outputTokens,
        costUsd,
        txHash: txHash ?? null,
        success,
        error,
      },
    });
  } catch (dbError) {
    log.error(
      { error: dbError instanceof Error ? dbError.message : String(dbError) },
      '[Resolution] Failed to log agent action to DB'
    );
  }
}
