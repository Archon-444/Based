/**
 * Base Chain Event Handlers
 *
 * One handler per EVM event type. Each handler writes to Prisma and creates
 * a BlockchainEvent audit row. Follows the pattern in eventHandlers.ts.
 */

import type { Log } from 'viem';

import { getPublicClient } from '../blockchain/base/viemClient.js';
import { logger } from '../config/logger.js';
import { prisma } from '../database/prismaClient.js';
import { recordBaseEvent } from '../monitoring/metrics.js';
import type {
  AssertionDisputedEvent,
  AssertionSettledEvent,
  BuyEvent,
  LiquidityAddedEvent,
  LiquidityRemovedEvent,
  MarketActivatedEvent,
  MarketCancelledEvent,
  MarketCreatedEvent,
  MarketResetEvent,
  MarketResolvedEvent,
  MarketStatusChangedEvent,
  OutcomeAssertedEvent,
  PoolFrozenEvent,
  PoolInitializedEvent,
  PythMarketRegisteredEvent,
  PythMarketResolvedEvent,
  SellEvent,
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
      eventData: eventData as any,
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

export async function handleMarketActivated(args: MarketActivatedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.market.update({
    where: { id: market.id },
    data: { status: 'active', lastSyncedAt: new Date() },
  });

  await storeAuditEvent('MarketActivated', log, market.id, { marketId: args.marketId });
  broadcast(args.marketId, { type: 'market_activated', marketId: args.marketId });
  recordBaseEvent('MarketActivated');
}

export async function handleMarketStatusChanged(args: MarketStatusChangedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  const newStatus = MARKET_STATUS_MAP[args.newStatus] ?? 'active';

  await prisma.market.update({
    where: { id: market.id },
    data: { status: newStatus as any, lastSyncedAt: new Date() },
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
      feeRate: Number(args.feeRate),
      lastSyncedAt: new Date(),
    },
  });

  await storeAuditEvent('PoolInitialized', log, market.id, {
    marketId: args.marketId,
    funding: args.funding.toString(),
    feeRate: args.feeRate.toString(),
  });

  recordBaseEvent('PoolInitialized');
}

export async function handleBuy(args: BuyEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.trade.create({
    data: {
      marketId: market.id,
      trader: args.buyer.toLowerCase(),
      outcomeIndex: Number(args.outcomeIndex),
      tradeType: 'BUY',
      amount: args.investmentAmount,
      outcomeTokens: args.outcomeTokensBought,
      fee: args.feeAmount,
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      timestamp: await getTimestamp(log),
    },
  });

  await prisma.market.update({
    where: { id: market.id },
    data: { totalVolume: { increment: args.investmentAmount }, lastSyncedAt: new Date() },
  });

  await storeAuditEvent('Buy', log, market.id, {
    marketId: args.marketId,
    buyer: args.buyer,
    outcomeIndex: args.outcomeIndex.toString(),
    amount: args.investmentAmount.toString(),
  });

  broadcast(args.marketId, {
    type: 'trade',
    marketId: args.marketId,
    tradeType: 'BUY',
    trader: args.buyer,
    outcomeIndex: Number(args.outcomeIndex),
    amount: args.investmentAmount.toString(),
    tokens: args.outcomeTokensBought.toString(),
  });
  recordBaseEvent('Buy');
}

export async function handleSell(args: SellEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.trade.create({
    data: {
      marketId: market.id,
      trader: args.seller.toLowerCase(),
      outcomeIndex: Number(args.outcomeIndex),
      tradeType: 'SELL',
      amount: args.returnAmount,
      outcomeTokens: args.outcomeTokensSold,
      fee: args.feeAmount,
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      timestamp: await getTimestamp(log),
    },
  });

  await storeAuditEvent('Sell', log, market.id, {
    marketId: args.marketId,
    seller: args.seller,
    outcomeIndex: args.outcomeIndex.toString(),
    amount: args.returnAmount.toString(),
  });

  broadcast(args.marketId, {
    type: 'trade',
    marketId: args.marketId,
    tradeType: 'SELL',
    trader: args.seller,
    outcomeIndex: Number(args.outcomeIndex),
    amount: args.returnAmount.toString(),
    tokens: args.outcomeTokensSold.toString(),
  });
  recordBaseEvent('Sell');
}

export async function handleLiquidityAdded(args: LiquidityAddedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.liquidityEvent.create({
    data: {
      marketId: market.id,
      provider: args.provider.toLowerCase(),
      eventType: 'ADD',
      amount: args.funding,
      shares: args.sharesMinted,
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      timestamp: await getTimestamp(log),
    },
  });

  await storeAuditEvent('LiquidityAdded', log, market.id, {
    marketId: args.marketId,
    provider: args.provider,
    funding: args.funding.toString(),
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
      amount: args.collateralReturned,
      shares: args.sharesBurned,
      txHash: log.transactionHash!,
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      timestamp: await getTimestamp(log),
    },
  });

  await storeAuditEvent('LiquidityRemoved', log, market.id, {
    marketId: args.marketId,
    provider: args.provider,
    collateral: args.collateralReturned.toString(),
  });

  broadcast(args.marketId, { type: 'liquidity_removed', marketId: args.marketId });
  recordBaseEvent('LiquidityRemoved');
}

export async function handlePoolFrozen(args: PoolFrozenEvent, log: Log): Promise<void> {
  logger.info({ marketId: args.marketId }, '[BaseHandler] PoolFrozen');
  recordBaseEvent('PoolFrozen');
}

// ---------- UMA Adapter Handlers ----------

export async function handleUmaMarketRegistered(args: UmaMarketRegisteredEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  await prisma.market.update({
    where: { id: market.id },
    data: { resolutionType: 'uma', lastSyncedAt: new Date() },
  });

  await storeAuditEvent('UmaMarketRegistered', log, market.id, {
    marketId: args.marketId,
    reward: args.reward.toString(),
    bond: args.bond.toString(),
  });
  recordBaseEvent('UmaMarketRegistered');
}

export async function handleOutcomeAsserted(args: OutcomeAssertedEvent, log: Log): Promise<void> {
  const market = await findMarketByOnChainId(args.marketId);
  if (!market) return;

  // Get block timestamp for assertedAt
  const block = await prisma.blockchainEvent.findFirst(); // We'll use log timestamp
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
    truthful: args.truthful,
  });

  broadcast(args.marketId, {
    type: 'assertion_settled',
    marketId: args.marketId,
    assertionId: args.assertionId,
    truthful: args.truthful,
  });
  recordBaseEvent('AssertionSettled');
}

export async function handleAssertionDisputed(args: AssertionDisputedEvent, log: Log): Promise<void> {
  const assertion = await prisma.umaAssertion.findUnique({
    where: { assertionId: args.assertionId },
  });
  if (!assertion) return;

  await prisma.umaAssertion.update({
    where: { assertionId: args.assertionId },
    data: {
      status: 'DISPUTED',
      disputeCount: { increment: 1 },
    },
  });

  const market = await findMarketByOnChainId(args.marketId);

  await storeAuditEvent('AssertionDisputed', log, market?.id ?? null, {
    marketId: args.marketId,
    assertionId: args.assertionId,
  });

  broadcast(args.marketId, {
    type: 'assertion_disputed',
    marketId: args.marketId,
    assertionId: args.assertionId,
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
    disputeCount: args.disputeCount.toString(),
  });

  broadcast(args.marketId, { type: 'market_reset', marketId: args.marketId });
  recordBaseEvent('MarketReset');
}

// ---------- Pyth Adapter Handlers ----------

export async function handlePythMarketRegistered(args: PythMarketRegisteredEvent, log: Log): Promise<void> {
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

export async function handlePythMarketResolved(args: PythMarketResolvedEvent, log: Log): Promise<void> {
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
