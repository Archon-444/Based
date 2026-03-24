/**
 * Base Chain Event Handlers
 *
 * One handler per EVM event type. Each handler writes to Prisma and creates
 * a BlockchainEvent audit row. Follows the pattern in eventHandlers.ts.
 */

import type { Prisma } from '@prisma/client';
import type { Log } from 'viem';

import { getPublicClient } from '../blockchain/base/viemClient.js';
import { logger } from '../config/logger.js';
import { prisma } from '../database/prismaClient.js';
import { recordBaseEvent } from '../monitoring/metrics.js';
import type {
  AssertionDisputedEvent,
  AssertionSettledEvent,
  LiquidityAddedEvent,
  LiquidityRemovedEvent,
  MarketCancelledEvent,
  MarketCreatedEvent,
  MarketResetEvent,
  MarketResolvedEvent,
  MarketStatusChangedEvent,
  OutcomeAssertedEvent,
  PoolInitializedEvent,
  PythMarketRegisteredEvent,
  PythMarketResolvedEvent,
  TradeEvent,
  UmaMarketRegisteredEvent,
} from '../types/base-events.js';
import { MARKET_STATUS_MAP } from '../types/base-events.js';
import { broadcast } from '../websocket/wsHandlers.js';

// ---------- Helpers ----------

async function getTimestamp(log: Log): Promise<Date> {
  // Fetch block timestamp from chain; fallback to now if unavailable
  if (log.blockNumber) {
    try {
      const block = await getPublicClient().getBlock({ blockNumber: log.blockNumber });
      return new Date(Number(block.timestamp) * 1000);
    } catch {
      // Fall through to default
    }
  }
  return new Date();
}

async function storeAuditEvent(
  eventType: string,
  log: Log,
  marketDbId: string | null,
  eventData: Record<string, unknown>
): Promise<void> {
  await prisma.blockchainEvent.create({
    data: {
      chain: 'base',
      eventType,
      transactionHash: log.transactionHash!,
      sequenceNumber: BigInt(log.logIndex ?? 0),
      eventData: eventData as unknown as Prisma.InputJsonValue,
      blockHeight: log.blockNumber ? BigInt(log.blockNumber) : null,
      timestamp: await getTimestamp(log),
      marketId: marketDbId,
    },
  });
}

async function findMarketByOnChainId(marketId: string): Promise<{ id: string } | null> {
  return prisma.market.findFirst({
    where: { onChainId: marketId, chain: 'base' },
    select: { id: true },
  });
}

// ---------- MarketFactory Handlers ----------

export async function handleMarketCreated(args: MarketCreatedEvent, log: Log): Promise<void> {
  const onChainId = args.marketId;

  const market = await prisma.market.create({
    data: {
      onChainId,
      chain: 'base',
      question: args.question,
      outcomes: Array.from({ length: Number(args.outcomeCount) }, (_, i) => `Outcome ${i}`),
      creatorWallet: args.creator.toLowerCase(),
      endDate: new Date(Number(args.deadline) * 1000),
      status: 'active',
      totalVolume: 0n,
      conditionId: null, // Will be set by CTF event if needed
      questionId: args.questionId,
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
      chainId: 8453,
      lastSyncedAt: new Date(),
    },
  });

  await storeAuditEvent('MarketCreated', log, market.id, {
    marketId: onChainId,
    questionId: args.questionId,
    creator: args.creator,
    outcomeCount: args.outcomeCount.toString(),
  });

  broadcast(onChainId, { type: 'market_created', marketId: onChainId });
  recordBaseEvent('MarketCreated');
  logger.info({ onChainId, question: args.question }, '[BaseHandler] MarketCreated');
}

export async function handleMarketStatusChanged(
  args: MarketStatusChangedEvent,
  log: Log
): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  const newStatus = MARKET_STATUS_MAP[args.newStatus] ?? 'active';

  await prisma.market.update({
    where: { id: market.id },
    data: { status: newStatus as Prisma.MarketUpdateInput['status'], lastSyncedAt: new Date() },
  });

  await storeAuditEvent('MarketStatusChanged', log, market.id, {
    marketId: args.marketId,
    oldStatus: args.oldStatus,
    newStatus: args.newStatus,
  });

  broadcast(args.marketId, { type: 'status_changed', marketId: args.marketId, status: newStatus });
  recordBaseEvent('MarketStatusChanged');
}

export async function handleMarketResolved(args: MarketResolvedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.market.update({
    where: { id: market.id },
    data: {
      status: 'resolved',
      resolvedAt: new Date(Number(args.resolvedAt) * 1000),
      lastSyncedAt: new Date(),
    },
  });

  await storeAuditEvent('MarketResolved', log, market.id, { marketId: args.marketId });
  broadcast(args.marketId, { type: 'market_resolved', marketId: args.marketId });
  recordBaseEvent('MarketResolved');
}

export async function handleMarketCancelled(args: MarketCancelledEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.market.update({
    where: { id: market.id },
    data: { status: 'cancelled', lastSyncedAt: new Date() },
  });

  await storeAuditEvent('MarketCancelled', log, market.id, { marketId: args.marketId });
  broadcast(args.marketId, { type: 'market_cancelled', marketId: args.marketId });
  recordBaseEvent('MarketCancelled');
}

// ---------- AMM Handlers ----------

export async function handlePoolInitialized(args: PoolInitializedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.market.update({
    where: { id: market.id },
    data: {
      lastSyncedAt: new Date(),
    },
  });

  await storeAuditEvent('PoolInitialized', log, market.id, {
    marketId: args.marketId,
    initialLiquidity: args.initialLiquidity.toString(),
    provider: args.provider,
  });

  recordBaseEvent('PoolInitialized');
}

/**
 * Handles the unified Trade event (covers both buys and sells).
 * The `isBuy` flag determines the trade direction.
 */
export async function handleTrade(args: TradeEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  const tradeType = args.isBuy ? 'BUY' : 'SELL';

  await prisma.trade.create({
    data: {
      marketId: market.id,
      trader: args.trader.toLowerCase(),
      outcomeIndex: Number(args.outcomeIndex),
      tradeType,
      amount: args.usdcAmount,
      outcomeTokens: args.tokenAmount,
      fee: args.feeAmount,
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      timestamp: await getTimestamp(log),
    },
  });

  if (args.isBuy) {
    await prisma.market.update({
      where: { id: market.id },
      data: { totalVolume: { increment: args.usdcAmount }, lastSyncedAt: new Date() },
    });
  }

  await storeAuditEvent('Trade', log, market.id, {
    marketId: args.marketId,
    trader: args.trader,
    outcomeIndex: args.outcomeIndex.toString(),
    isBuy: args.isBuy,
    usdcAmount: args.usdcAmount.toString(),
    tokenAmount: args.tokenAmount.toString(),
    feeAmount: args.feeAmount.toString(),
  });

  broadcast(args.marketId, {
    type: 'trade',
    marketId: args.marketId,
    tradeType,
    trader: args.trader,
    outcomeIndex: Number(args.outcomeIndex),
    amount: args.usdcAmount.toString(),
    tokens: args.tokenAmount.toString(),
  });
  recordBaseEvent('Trade');
}

export async function handleLiquidityAdded(args: LiquidityAddedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.liquidityEvent.create({
    data: {
      marketId: market.id,
      provider: args.provider.toLowerCase(),
      eventType: 'ADD',
      amount: args.usdcAmount,
      shares: args.shares,
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      timestamp: await getTimestamp(log),
    },
  });

  await storeAuditEvent('LiquidityAdded', log, market.id, {
    marketId: args.marketId,
    provider: args.provider,
    usdcAmount: args.usdcAmount.toString(),
    shares: args.shares.toString(),
  });

  broadcast(args.marketId, { type: 'liquidity_added', marketId: args.marketId });
  recordBaseEvent('LiquidityAdded');
}

export async function handleLiquidityRemoved(args: LiquidityRemovedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.liquidityEvent.create({
    data: {
      marketId: market.id,
      provider: args.provider.toLowerCase(),
      eventType: 'REMOVE',
      amount: args.usdcAmount,
      shares: args.shares,
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      timestamp: await getTimestamp(log),
    },
  });

  await storeAuditEvent('LiquidityRemoved', log, market.id, {
    marketId: args.marketId,
    provider: args.provider,
    usdcAmount: args.usdcAmount.toString(),
    shares: args.shares.toString(),
  });

  broadcast(args.marketId, { type: 'liquidity_removed', marketId: args.marketId });
  recordBaseEvent('LiquidityRemoved');
}

// ---------- UMA Adapter Handlers ----------

export async function handleUmaMarketRegistered(
  args: UmaMarketRegisteredEvent,
  log: Log
): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.market.update({
    where: { id: market.id },
    data: { resolutionType: 'uma', lastSyncedAt: new Date() },
  });

  await storeAuditEvent('UmaMarketRegistered', log, market.id, {
    marketId: args.marketId,
    bond: args.bond.toString(),
    liveness: args.liveness.toString(),
  });
  recordBaseEvent('UmaMarketRegistered');
}

export async function handleOutcomeAsserted(args: OutcomeAssertedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  // We'll use log timestamp for assertedAt
  const assertedAt = await getTimestamp(log);

  await prisma.umaAssertion.create({
    data: {
      assertionId: args.assertionId,
      marketId: market.id,
      proposedOutcome: Number(args.proposedOutcome),
      asserter: args.asserter.toLowerCase(),
      bond: 0n, // Bond is tracked in the adapter contract
      liveness: 0, // Liveness is tracked in the adapter contract
      assertedAt,
      status: 'PENDING',
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
    },
  });

  await storeAuditEvent('OutcomeAsserted', log, market.id, {
    marketId: args.marketId,
    assertionId: args.assertionId,
    proposedOutcome: args.proposedOutcome.toString(),
    asserter: args.asserter,
  });

  broadcast(args.marketId, {
    type: 'outcome_asserted',
    marketId: args.marketId,
    assertionId: args.assertionId,
    proposedOutcome: Number(args.proposedOutcome),
  });
  recordBaseEvent('OutcomeAsserted');

  // Integrity Guardian: asynchronously verify the assertion (non-blocking)
  setImmediate(async () => {
    try {
      if (process.env.AGENT_ENABLED === 'true' && process.env.AGENT_AUTO_DISPUTE === 'true') {
        const { tryVerifyAssertion } = await import('../agents/integrityGuardian.js');
        await tryVerifyAssertion(args.marketId, args.assertionId, Number(args.proposedOutcome));
      }
    } catch (error) {
      logger.error(
        {
          assertionId: args.assertionId,
          error: error instanceof Error ? error.message : String(error),
        },
        '[BaseHandler] Integrity guardian error (non-fatal)'
      );
    }
  });
}

export async function handleAssertionSettled(args: AssertionSettledEvent, log: Log): Promise<void> {
  const assertion = await prisma.umaAssertion.findUnique({
    where: { assertionId: args.assertionId },
  });
  if (!assertion) return;

  await prisma.umaAssertion.update({
    where: { assertionId: args.assertionId },
    data: {
      status: 'SETTLED',
      resolvedAt: new Date(),
    },
  });

  const market = await findMarketByOnChainId(args.marketId);

  await storeAuditEvent('AssertionSettled', log, market?.id ?? null, {
    marketId: args.marketId,
    assertionId: args.assertionId,
    winningOutcome: args.winningOutcome.toString(),
  });

  broadcast(args.marketId, {
    type: 'assertion_settled',
    marketId: args.marketId,
    assertionId: args.assertionId,
    winningOutcome: Number(args.winningOutcome),
  });
  recordBaseEvent('AssertionSettled');
}

export async function handleAssertionDisputed(
  args: AssertionDisputedEvent,
  log: Log
): Promise<void> {
  const assertion = await prisma.umaAssertion.findUnique({
    where: { assertionId: args.assertionId },
  });
  if (!assertion) return;

  await prisma.umaAssertion.update({
    where: { assertionId: args.assertionId },
    data: {
      status: 'DISPUTED',
      disputeCount: Number(args.disputeCount),
    },
  });

  const market = await findMarketByOnChainId(args.marketId);

  await storeAuditEvent('AssertionDisputed', log, market?.id ?? null, {
    marketId: args.marketId,
    assertionId: args.assertionId,
    disputeCount: args.disputeCount.toString(),
  });

  broadcast(args.marketId, {
    type: 'assertion_disputed',
    marketId: args.marketId,
    assertionId: args.assertionId,
    disputeCount: Number(args.disputeCount),
  });
  recordBaseEvent('AssertionDisputed');
}

export async function handleMarketReset(args: MarketResetEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.market.update({
    where: { id: market.id },
    data: { status: 'resolving', lastSyncedAt: new Date() },
  });

  await storeAuditEvent('MarketReset', log, market.id, {
    marketId: args.marketId,
  });

  broadcast(args.marketId, { type: 'market_reset', marketId: args.marketId });
  recordBaseEvent('MarketReset');
}

// ---------- Pyth Adapter Handlers ----------

export async function handlePythMarketRegistered(
  args: PythMarketRegisteredEvent,
  log: Log
): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.market.update({
    where: { id: market.id },
    data: {
      resolutionType: 'pyth',
      pythFeedId: args.feedId,
      strikePrice: args.strikePrice.toString(),
      lastSyncedAt: new Date(),
    },
  });

  await storeAuditEvent('PythMarketRegistered', log, market.id, {
    marketId: args.marketId,
    feedId: args.feedId,
    strikePrice: args.strikePrice.toString(),
    resolutionType: args.resolutionType,
  });
  recordBaseEvent('PythMarketRegistered');
}

export async function handlePythMarketResolved(
  args: PythMarketResolvedEvent,
  log: Log
): Promise<void> {
  // Market resolution is already handled by the factory's MarketResolved event.
  // This handler just logs the Pyth-specific resolution details.
  logger.info(
    {
      marketId: args.marketId,
      price: args.price.toString(),
      expo: args.expo,
      winningOutcome: args.winningOutcome.toString(),
    },
    '[BaseHandler] PythMarketResolved'
  );

  await storeAuditEvent('PythMarketResolved', log, null, {
    marketId: args.marketId,
    feedId: args.feedId,
    price: args.price.toString(),
    expo: args.expo,
    winningOutcome: args.winningOutcome.toString(),
  });
  recordBaseEvent('PythMarketResolved');
}
