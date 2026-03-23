/**
 * Market Creator Agent
 *
 * Transforms natural language input into fully-formed market proposals,
 * then executes the on-chain market creation flow:
 * 1. createMarket → 2. activateMarket → 3. registerOracle → 4. initializePool
 *
 * Usage: CLI-only for now (npm run agent:create -- "Will BTC hit $150K?")
 */

import { type Abi, keccak256, toBytes, toHex } from 'viem';

import {
  contractAddresses,
  marketFactoryAbi,
  predictionMarketAmmAbi,
  pythOracleAdapterAbi,
  umaCtfAdapterAbi,
} from '../blockchain/base/abis/index.js';
import { encodeCall, sendTransaction } from '../blockchain/base/transactionService.js';
import { getAdminWallet, getPublicClient } from '../blockchain/base/viemClient.js';
import { prisma } from '../database/prismaClient.js';
import { createAgentLogger } from './shared/agentLogger.js';
import { callAndParse } from './shared/claudeClient.js';
import { type MarketProposal, MarketProposalSchema } from './shared/structuredOutput.js';

const log = createAgentLogger('marketCreator');

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

const SYSTEM_PROMPT = `You are a prediction market creator for a decentralized platform.

Given a topic or idea, generate a complete market proposal as a JSON object.

RULES:
1. Questions MUST be unambiguous — a reasonable person should agree on the outcome
2. Resolution criteria MUST specify exact sources and conditions
3. Deadlines must be realistic (not too far, not too close)
4. For crypto price markets, use automationType "pyth" with a specific price feed and strike price
5. For everything else, use automationType "uma"
6. Binary markets (2 outcomes: "Yes", "No") are preferred unless the topic naturally has multiple outcomes
7. Flag any regulatory risks (US elections, sanctioned entities) in riskFlags

CATEGORIES:
- crypto: Cryptocurrency prices, DeFi events, protocol launches
- politics: Elections, policy decisions, geopolitical events
- sports: Match outcomes, season results, player achievements
- culture: Entertainment, social media, viral events
- science: Research outcomes, space events, climate milestones
- economics: Fed rates, inflation, employment, GDP
- tech: Product launches, AI milestones, company announcements

PYTH PRICE FEED IDS (use these exact values for crypto markets):
- BTC/USD: 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
- ETH/USD: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
- SOL/USD: 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d

For Pyth markets, strikePrice should be in whole dollars.

Today's date: ${new Date().toISOString().split('T')[0]}

Respond ONLY with a valid JSON object matching the MarketProposal schema:
{
  "question": "<clear, time-bounded question>",
  "description": "<detailed description of the market>",
  "outcomeCount": <2-10>,
  "outcomes": ["Yes", "No"] or ["Team A", "Team B", ...],
  "deadline": "<ISO 8601 date>",
  "category": "<one of the categories above>",
  "resolutionSource": "<URL or oracle identifier>",
  "resolutionCriteria": "<detailed, unambiguous criteria>",
  "automationType": "pyth" | "uma",
  "priceFeedId": "<hex string, only for pyth>",
  "strikePrice": <number, only for pyth>,
  "resolutionType": "ABOVE_THRESHOLD" | "BELOW_THRESHOLD" | "BETWEEN" (only for pyth),
  "suggestedLiquidityUsdc": <100-100000>,
  "duplicateRisk": "none" | "similar_exists" | "exact_duplicate",
  "riskFlags": ["<any risks>"]
}

No markdown, no explanation, no backticks — just the JSON object.`;

export interface CreateMarketResult {
  proposal: MarketProposal;
  marketId: string | null;
  status: 'created' | 'needs_review' | 'rejected';
  reason?: string;
  txHash?: string;
}

export async function createFromPrompt(input: string): Promise<CreateMarketResult> {
  log.info({ input: input.substring(0, 100) }, '[MarketCreator] Creating market from prompt');

  // 1. Call Claude to generate a structured proposal
  const result = await callAndParse(SYSTEM_PROMPT, input, MarketProposalSchema, 'marketCreator');

  if (!result) {
    throw new Error('Failed to generate market proposal from LLM');
  }

  const { parsed: proposal, inputTokens, outputTokens, costUsd } = result;

  log.info(
    {
      question: proposal.question,
      category: proposal.category,
      automationType: proposal.automationType,
      outcomes: proposal.outcomes,
    },
    '[MarketCreator] Proposal generated'
  );

  // 2. Duplicate check
  const isDuplicate = await checkForDuplicates(proposal.question);
  if (isDuplicate) {
    await logAction(
      null,
      'skip',
      proposal,
      inputTokens,
      outputTokens,
      costUsd,
      true,
      'Duplicate market exists'
    );
    return { proposal, marketId: null, status: 'rejected', reason: 'Duplicate market exists' };
  }

  // 3. Risk flag check
  if (proposal.riskFlags.length > 0) {
    await logAction(
      null,
      'flag',
      proposal,
      inputTokens,
      outputTokens,
      costUsd,
      true,
      proposal.riskFlags.join(', ')
    );
    return {
      proposal,
      marketId: null,
      status: 'needs_review',
      reason: proposal.riskFlags.join(', '),
    };
  }

  // 4. Execute on-chain creation
  const { marketId, txHash } = await executeCreation(proposal);

  await logAction(null, 'create', proposal, inputTokens, outputTokens, costUsd, true, null, txHash);

  return { proposal, marketId, status: 'created', txHash };
}

async function executeCreation(
  proposal: MarketProposal
): Promise<{ marketId: string; txHash: string }> {
  if (!contractAddresses.marketFactory || !contractAddresses.usdc) {
    throw new Error('MARKET_FACTORY_ADDRESS or USDC_ADDRESS not configured');
  }

  const publicClient = getPublicClient();
  const adminWallet = getAdminWallet();

  // a. Generate questionId
  const questionId = keccak256(toBytes(proposal.question + ':' + Date.now().toString()));

  // b. Prepare parameters
  const deadline = BigInt(Math.floor(new Date(proposal.deadline).getTime() / 1000));
  const ancillaryData = toHex(toBytes(proposal.resolutionCriteria));
  const liquidityUsdc = BigInt(proposal.suggestedLiquidityUsdc) * 1_000_000n; // Convert to 6-decimal USDC

  // c. Approve USDC to MarketFactory for initial liquidity
  const approveData = encodeCall(erc20ApproveAbi as Abi, 'approve', [
    contractAddresses.marketFactory,
    liquidityUsdc,
  ]);

  await sendTransaction({
    walletClient: adminWallet,
    publicClient,
    to: contractAddresses.usdc,
    data: approveData,
    walletLabel: 'admin',
    methodLabel: 'USDC.approve(factory)',
  });

  // d. Create market
  const createData = encodeCall(marketFactoryAbi as Abi, 'createMarket', [
    questionId,
    proposal.question,
    BigInt(proposal.outcomeCount),
    deadline,
    ancillaryData,
    liquidityUsdc,
  ]);

  const createReceipt = await sendTransaction({
    walletClient: adminWallet,
    publicClient,
    to: contractAddresses.marketFactory,
    data: createData,
    walletLabel: 'admin',
    methodLabel: 'MarketFactory.createMarket',
  });

  // Extract marketId from logs (MarketCreated event)
  // For now, recompute it the same way the contract does
  const marketId = questionId; // Factory uses questionId as marketId in most implementations

  log.info({ marketId, txHash: createReceipt.transactionHash }, '[MarketCreator] Market created');

  // e. Activate market
  const activateData = encodeCall(marketFactoryAbi as Abi, 'activateMarket', [marketId]);

  await sendTransaction({
    walletClient: adminWallet,
    publicClient,
    to: contractAddresses.marketFactory,
    data: activateData,
    walletLabel: 'admin',
    methodLabel: 'MarketFactory.activateMarket',
  });

  // f. Register with oracle adapter
  if (proposal.automationType === 'uma' && contractAddresses.umaAdapter) {
    const reward = 0n; // No reward for now
    const bond = 500_000_000n; // MIN_BOND = 500 USDC (6 decimals)
    const liveness = proposal.category === 'sports' ? 7200n : 172800n; // 2h for sports, 48h otherwise

    const registerData = encodeCall(umaCtfAdapterAbi as Abi, 'registerMarket', [
      marketId,
      reward,
      bond,
      liveness,
    ]);

    await sendTransaction({
      walletClient: adminWallet,
      publicClient,
      to: contractAddresses.umaAdapter,
      data: registerData,
      walletLabel: 'admin',
      methodLabel: 'UmaAdapter.registerMarket',
    });
  } else if (
    proposal.automationType === 'pyth' &&
    contractAddresses.pythAdapter &&
    proposal.priceFeedId
  ) {
    const resolutionTypeMap: Record<string, number> = {
      ABOVE_THRESHOLD: 0,
      BELOW_THRESHOLD: 1,
      BETWEEN: 2,
    };

    const registerData = encodeCall(pythOracleAdapterAbi as Abi, 'registerMarket', [
      marketId,
      proposal.priceFeedId,
      BigInt(proposal.strikePrice ?? 0) * 100_000_000n, // Convert to Pyth's 8-decimal format
      0n, // strikePriceHigh (only for BETWEEN)
      resolutionTypeMap[proposal.resolutionType ?? 'ABOVE_THRESHOLD'] ?? 0,
    ]);

    await sendTransaction({
      walletClient: adminWallet,
      publicClient,
      to: contractAddresses.pythAdapter,
      data: registerData,
      walletLabel: 'admin',
      methodLabel: 'PythAdapter.registerMarket',
    });
  }

  // g. Initialize AMM pool
  if (contractAddresses.amm) {
    // Approve USDC to AMM
    const ammApproveData = encodeCall(erc20ApproveAbi as Abi, 'approve', [
      contractAddresses.amm,
      liquidityUsdc,
    ]);

    await sendTransaction({
      walletClient: adminWallet,
      publicClient,
      to: contractAddresses.usdc,
      data: ammApproveData,
      walletLabel: 'admin',
      methodLabel: 'USDC.approve(amm)',
    });

    const initPoolData = encodeCall(predictionMarketAmmAbi as Abi, 'initializePool', [
      marketId,
      liquidityUsdc,
    ]);

    await sendTransaction({
      walletClient: adminWallet,
      publicClient,
      to: contractAddresses.amm,
      data: initPoolData,
      walletLabel: 'admin',
      methodLabel: 'AMM.initializePool',
    });
  }

  return { marketId, txHash: createReceipt.transactionHash };
}

async function checkForDuplicates(question: string): Promise<boolean> {
  const activeMarkets = await prisma.market.findMany({
    where: { chain: 'base', status: 'active' },
    select: { question: true },
  });

  const inputWords = new Set(
    question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  if (inputWords.size === 0) return false;

  for (const market of activeMarkets) {
    const marketWords = new Set(
      market.question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    if (marketWords.size === 0) continue;

    let overlap = 0;
    for (const word of inputWords) {
      if (marketWords.has(word)) overlap++;
    }

    const overlapRatio = overlap / Math.min(inputWords.size, marketWords.size);
    if (overlapRatio > 0.6) return true;
  }

  return false;
}

async function logAction(
  marketId: string | null,
  action: string,
  proposal: MarketProposal,
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
        agent: 'marketCreator',
        marketId,
        action,
        confidence: null,
        reasoning: `${proposal.category}: ${proposal.question}`,
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
      '[MarketCreator] Failed to log agent action'
    );
  }
}
