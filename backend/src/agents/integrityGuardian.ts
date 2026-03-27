/**
 * Integrity Guardian
 *
 * Monitors UMA assertions and disputes incorrect proposals.
 * When someone asserts an outcome on a UMA market, this agent:
 * 1. Independently verifies the assertion via web search
 * 2. If the assertion appears wrong (>90% confidence), disputes it on-chain
 *
 * Integration: Called from baseEventHandlers.ts handleOutcomeAsserted() via setImmediate.
 * Safety: All errors are caught internally — never throws into the event handler.
 */

import type { Abi, Address, Hex } from 'viem';

import { contractAddresses, umaCtfAdapterAbi } from '../blockchain/base/abis/index.js';
import { encodeCall, sendTransaction } from '../blockchain/base/transactionService.js';
import {
  getKeeperWallet,
  getPublicClient,
  getResolverWallet,
} from '../blockchain/base/viemClient.js';
import { env } from '../config/env.js';
import { prisma } from '../database/prismaClient.js';
import { createAgentLogger } from './shared/agentLogger.js';
import { searchAndParse } from './shared/claudeClient.js';
import { type DisputeAssessment, DisputeAssessmentSchema } from './shared/structuredOutput.js';

const log = createAgentLogger('integrity');

// Minimal ABI fragments
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

const oov3DisputeAbi = [
  {
    name: 'disputeAssertion',
    type: 'function',
    inputs: [
      { name: 'assertionId', type: 'bytes32' },
      { name: 'disputer', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

const SYSTEM_PROMPT = `You are a prediction market integrity guardian. Your job is to verify whether a proposed market resolution is correct.

You will be given:
1. The market question and resolution criteria
2. The proposed outcome (what someone claims happened)
3. The possible outcomes

Your task:
1. Search the web for authoritative evidence about what actually happened
2. Determine if the proposed outcome is correct or incorrect
3. Only recommend dispute if you are CONFIDENT the proposal is WRONG (>90% confidence)

RULES:
- Do NOT dispute correct proposals — disputes cost money (bond)
- When in doubt, do NOT dispute (let the proposal stand)
- Use the same authoritative sources as the resolution criteria specify
- The proposer may have information you don't — be conservative
- Only recommend dispute when you have strong counter-evidence

After searching for evidence, respond ONLY with a valid JSON object matching this exact schema:
{
  "shouldDispute": <boolean>,
  "confidence": <number 0-100 — how confident you are in your assessment>,
  "reasoning": "<string, min 30 chars — your reasoning>",
  "correctOutcome": <number | null — what you think the correct outcome index is, if different>,
  "evidenceSummary": "<string | null — summary of evidence found>"
}

No markdown, no explanation, no backticks — just the JSON object.`;

export async function tryVerifyAssertion(
  marketOnChainId: string,
  assertionId: string,
  proposedOutcome: number
): Promise<void> {
  if (env.AGENT_AUTO_DISPUTE !== 'true') return;

  log.info(
    { marketId: marketOnChainId, assertionId, proposedOutcome },
    '[Integrity] Evaluating assertion'
  );

  // Load market from DB
  const dbMarket = await prisma.market.findFirst({
    where: { onChainId: marketOnChainId, chain: 'base' },
  });

  if (!dbMarket) {
    log.warn({ marketId: marketOnChainId }, '[Integrity] Market not found in DB');
    return;
  }

  // Self-dispute prevention: skip if our keeper wallet made this assertion
  try {
    const keeperWallet = await getKeeperWallet();
    const keeperAddress = keeperWallet.account!.address.toLowerCase();

    const assertion = await prisma.umaAssertion.findFirst({
      where: { assertionId },
    });

    if (assertion && assertion.asserter.toLowerCase() === keeperAddress) {
      log.info(
        { assertionId },
        '[Integrity] Skipping — assertion was made by our own keeper wallet'
      );
      return;
    }
  } catch {
    // If we can't get the keeper wallet, continue with verification
  }

  // Build context for Claude
  const outcomeName = dbMarket.outcomes[proposedOutcome] ?? `Outcome ${proposedOutcome}`;
  const userMessage = `
Market question: ${dbMarket.question}
Possible outcomes: ${dbMarket.outcomes.map((o, i) => `${i}: "${o}"`).join(', ')}
Market deadline: ${dbMarket.endDate?.toISOString() ?? 'Unknown'}

PROPOSED RESOLUTION: Outcome ${proposedOutcome} ("${outcomeName}")

Is this proposed outcome correct? Search for evidence and verify.
If you find strong evidence that this is WRONG, recommend dispute.
If the proposal appears correct or you're unsure, do NOT recommend dispute.
  `.trim();

  const result = await searchAndParse(
    SYSTEM_PROMPT,
    userMessage,
    DisputeAssessmentSchema,
    'integrity'
  );

  if (!result) {
    log.error({ assertionId }, '[Integrity] Failed to get LLM response');
    await logAgentAction(dbMarket.id, 'skip', null, 0, 0, 0, false, 'LLM call failed');
    return;
  }

  const { parsed: assessment, inputTokens, outputTokens, costUsd } = result;

  log.info(
    {
      assertionId,
      shouldDispute: assessment.shouldDispute,
      confidence: assessment.confidence,
    },
    '[Integrity] Assessment completed'
  );

  // Dispute gate: need both shouldDispute=true AND high confidence
  if (!assessment.shouldDispute || assessment.confidence < env.AGENT_DISPUTE_CONFIDENCE_THRESHOLD) {
    const reason = !assessment.shouldDispute
      ? 'Assessment says proposal appears correct'
      : `Confidence ${assessment.confidence}% below dispute threshold ${env.AGENT_DISPUTE_CONFIDENCE_THRESHOLD}%`;

    log.info({ assertionId, reason }, '[Integrity] Not disputing');
    await logAgentAction(
      dbMarket.id,
      'skip',
      assessment,
      inputTokens,
      outputTokens,
      costUsd,
      true,
      reason
    );
    return;
  }

  // Execute on-chain dispute
  const txHash = await executeDispute(assertionId);

  if (txHash) {
    log.info(
      { assertionId, txHash, confidence: assessment.confidence },
      '[Integrity] Assertion disputed on-chain'
    );
    await logAgentAction(
      dbMarket.id,
      'dispute',
      assessment,
      inputTokens,
      outputTokens,
      costUsd,
      true,
      null,
      txHash
    );
  } else {
    await logAgentAction(
      dbMarket.id,
      'dispute',
      assessment,
      inputTokens,
      outputTokens,
      costUsd,
      false,
      'On-chain dispute failed'
    );
  }
}

async function executeDispute(assertionId: string): Promise<string | null> {
  if (!contractAddresses.umaAdapter || !contractAddresses.usdc) {
    log.error('[Integrity] UMA_ADAPTER_ADDRESS or USDC_ADDRESS not configured');
    return null;
  }

  const publicClient = getPublicClient();
  const resolverWallet = await getResolverWallet();

  try {
    // Read OOV3 address from adapter
    const oov3Address = (await publicClient.readContract({
      address: contractAddresses.umaAdapter,
      abi: umaCtfAdapterAbi as Abi,
      functionName: 'oov3',
    })) as Address;

    // Read bond amount — we need to match the asserter's bond
    // For simplicity, read the assertion's bond from the UMA adapter's market data
    // The bond is fixed per market registration
    const assertionData = await prisma.umaAssertion.findFirst({
      where: { assertionId },
      include: { market: true },
    });

    if (!assertionData) {
      log.error({ assertionId }, '[Integrity] Assertion not found in DB');
      return null;
    }

    // Read bond from on-chain market data
    const marketData = (await publicClient.readContract({
      address: contractAddresses.umaAdapter,
      abi: umaCtfAdapterAbi as Abi,
      functionName: 'getMarketData',
      args: [assertionData.market.onChainId as Hex],
    })) as { bond: bigint };

    const bond = marketData.bond;
    log.info({ assertionId, bond: bond.toString() }, '[Integrity] Read bond for dispute');

    // Approve USDC to OOV3 for the dispute bond
    const approveData = encodeCall(erc20ApproveAbi as Abi, 'approve', [oov3Address, bond]);

    await sendTransaction({
      walletClient: resolverWallet,
      publicClient,
      to: contractAddresses.usdc,
      data: approveData,
      walletLabel: 'resolver',
      methodLabel: 'USDC.approve(oov3)',
    });

    // Dispute the assertion via OOV3
    const disputeData = encodeCall(oov3DisputeAbi as Abi, 'disputeAssertion', [
      assertionId,
      resolverWallet.account!.address,
    ]);

    const receipt = await sendTransaction({
      walletClient: resolverWallet,
      publicClient,
      to: oov3Address,
      data: disputeData,
      walletLabel: 'resolver',
      methodLabel: 'OOV3.disputeAssertion',
    });

    return receipt.transactionHash;
  } catch (error) {
    log.error(
      { assertionId, error: error instanceof Error ? error.message : String(error) },
      '[Integrity] On-chain dispute failed'
    );
    return null;
  }
}

async function logAgentAction(
  marketId: string | null,
  action: string,
  assessment: DisputeAssessment | null,
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
        agent: 'integrity',
        marketId,
        action,
        confidence: assessment?.confidence ?? null,
        reasoning: assessment?.reasoning ?? null,
        sources: [],
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
      '[Integrity] Failed to log agent action to DB'
    );
  }
}
