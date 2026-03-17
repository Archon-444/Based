/**
 * Commentary Agent
 *
 * Generates natural language commentary for market price movements.
 * Commentary is stored in the DB and broadcast via WebSocket.
 *
 * Triggers:
 * - Cron: Every 30 minutes for top active markets by volume
 * - On-demand: Called when significant price movement detected
 */

import cron from 'node-cron';
import type { Hex } from 'viem';

import { contractAddresses, predictionMarketAmmAbi } from '../blockchain/base/abis/index.js';
import { getPublicClient } from '../blockchain/base/viemClient.js';
import { env } from '../config/env.js';
import { prisma } from '../database/prismaClient.js';
import { broadcast } from '../websocket/wsHandlers.js';
import { createAgentLogger } from './shared/agentLogger.js';
import { callAndParse } from './shared/claudeClient.js';
import { type MarketCommentary, MarketCommentarySchema } from './shared/structuredOutput.js';

const log = createAgentLogger('commentary');

const SYSTEM_PROMPT = `You are a prediction market analyst writing brief commentary on market movements.

You will be given:
1. The market question
2. Current outcome prices (as probabilities)
3. Recent trade activity

Write a 1-3 sentence commentary explaining what's happening in this market. Be specific and informative, like a financial news brief.

STYLE:
- Concise and factual
- Reference specific price movements ("YES jumped from 45% to 62%")
- Speculate on likely causes when obvious (news events, related market movements)
- No hype, no emoji, no exclamation marks
- Write as if for Bloomberg terminal users

Respond ONLY with a valid JSON object matching this exact schema:
{
  "commentary": "<string, 30-500 chars — the market commentary>",
  "sentiment": "bullish" | "bearish" | "neutral" | "uncertain",
  "keyFactor": "<string, max 100 chars — one-line summary of the key driver>",
  "priceContext": "<string | null — e.g. 'YES moved from 45% to 62%'>"
}

No markdown, no explanation, no backticks — just the JSON object.`;

export async function generateCommentary(
  marketOnChainId: string,
  trigger: 'price_move' | 'scheduled' = 'scheduled'
): Promise<MarketCommentary | null> {
  log.info({ marketId: marketOnChainId, trigger }, '[Commentary] Generating commentary');

  // Load market + recent trades
  const market = await prisma.market.findFirst({
    where: { onChainId: marketOnChainId, chain: 'base' },
    include: {
      trades: { orderBy: { timestamp: 'desc' }, take: 20 },
    },
  });

  if (!market) {
    log.warn({ marketId: marketOnChainId }, '[Commentary] Market not found');
    return null;
  }

  // Get current prices from AMM
  const prices = await getCurrentPrices(marketOnChainId);
  const priceStr = prices
    ? market.outcomes.map((o, i) => `${o}: ${((prices[i] ?? 0) * 100).toFixed(1)}%`).join(', ')
    : 'Prices unavailable';

  // Summarize recent trades
  const tradesSummary =
    market.trades.length > 0
      ? market.trades
          .slice(0, 10)
          .map(
            (t) =>
              `${t.tradeType} outcome ${t.outcomeIndex} ("${market.outcomes[t.outcomeIndex] ?? '?'}") for $${(Number(t.amount) / 1e6).toFixed(2)}`
          )
          .join('; ')
      : 'No recent trades';

  const userMessage = `
Market: ${market.question}
Current prices: ${priceStr}
Recent trades (most recent first): ${tradesSummary}
Total volume: $${(Number(market.totalVolume) / 1e6).toFixed(2)}
Trigger: ${trigger === 'price_move' ? 'Significant price movement detected' : 'Scheduled update'}
  `.trim();

  const result = await callAndParse(
    SYSTEM_PROMPT,
    userMessage,
    MarketCommentarySchema,
    'commentary'
  );

  if (!result) {
    log.error({ marketId: marketOnChainId }, '[Commentary] Failed to generate commentary');
    return null;
  }

  const { parsed: commentary, inputTokens, outputTokens, costUsd } = result;

  // Store in DB
  try {
    await prisma.agentCommentary.create({
      data: {
        marketId: market.id,
        headline: commentary.keyFactor,
        body: commentary.commentary,
        sentiment: commentary.sentiment,
        keyFactors: commentary.priceContext ? [commentary.keyFactor, commentary.priceContext] : [commentary.keyFactor],
      },
    });
  } catch (dbError) {
    log.error(
      { error: dbError instanceof Error ? dbError.message : String(dbError) },
      '[Commentary] Failed to store commentary in DB'
    );
  }

  // Log agent action
  try {
    await prisma.agentAction.create({
      data: {
        agent: 'commentary',
        marketId: market.id,
        action: 'commentary',
        confidence: null,
        reasoning: null,
        sources: [],
        inputTokens,
        outputTokens,
        costUsd,
        success: true,
      },
    });
  } catch {
    // Non-critical
  }

  // Broadcast via WebSocket
  broadcast(marketOnChainId, {
    type: 'commentary',
    commentary: commentary.commentary,
    sentiment: commentary.sentiment,
    keyFactor: commentary.keyFactor,
    priceContext: commentary.priceContext,
  });

  log.info(
    { marketId: marketOnChainId, sentiment: commentary.sentiment },
    '[Commentary] Commentary generated and stored'
  );

  return commentary;
}

export function startCommentaryCron(): cron.ScheduledTask {
  // Every 30 minutes: generate commentary for top active markets
  const task = cron.schedule('*/30 * * * *', async () => {
    try {
      if (env.AGENT_COMMENTARY_ENABLED !== 'true') return;

      // Get top 5 active markets by volume
      const topMarkets = await prisma.market.findMany({
        where: {
          chain: 'base',
          status: 'active',
          totalVolume: { gt: 0n },
        },
        orderBy: { totalVolume: 'desc' },
        take: 5,
        select: { onChainId: true },
      });

      for (const market of topMarkets) {
        try {
          await generateCommentary(market.onChainId, 'scheduled');
        } catch (error) {
          log.error(
            { marketId: market.onChainId, error: error instanceof Error ? error.message : String(error) },
            '[Commentary] Cron commentary failed for market'
          );
        }
      }
    } catch (error) {
      log.error(
        { error: error instanceof Error ? error.message : String(error) },
        '[Commentary] Cron job failed'
      );
    }
  });

  log.info('[Commentary] Cron started (every 30 minutes)');
  return task;
}

// ---------- Helpers ----------

async function getCurrentPrices(marketOnChainId: string): Promise<number[] | null> {
  if (!contractAddresses.amm) return null;

  try {
    const publicClient = getPublicClient();
    const rawPrices = (await publicClient.readContract({
      address: contractAddresses.amm,
      abi: predictionMarketAmmAbi as any,
      functionName: 'getPrices',
      args: [marketOnChainId as Hex],
    })) as bigint[];

    // Prices are in 18-decimal fixed point, convert to 0-1 range
    return rawPrices.map((p) => Number(p) / 1e18);
  } catch (error) {
    log.debug(
      { marketId: marketOnChainId, error: error instanceof Error ? error.message : String(error) },
      '[Commentary] Could not read prices from AMM'
    );
    return null;
  }
}
