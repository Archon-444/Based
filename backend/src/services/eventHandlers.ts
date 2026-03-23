/**
 * Event Handlers for Blockchain Events (M2)
 *
 * This module processes blockchain events and updates the database accordingly.
 * Each handler is responsible for a specific event type and maintains data consistency.
 */

import { logger } from '../config/logger.js';
import { prisma } from '../database/prismaClient.js';
import type {
  BetPlacedEvent,
  DisputeCreatedEvent,
  DisputeResolvedEvent,
  MarketCreatedEvent,
  MarketResolvedEvent,
  ProcessedEvent,
  RoleGrantedEvent,
  RoleRevokedEvent,
  SystemPausedEvent,
  SystemUnpausedEvent,
  WinningsClaimedEvent,
} from '../types/blockchain.js';

const formatLog = (message: string, data?: Record<string, unknown>) =>
  data ? { ...data, msg: message } : { msg: message };

const logInfo = (message: string, data?: Record<string, unknown>) =>
  logger.info(formatLog(message, data));
const logWarn = (message: string, data?: Record<string, unknown>) =>
  logger.warn(formatLog(message, data));
const logError = (message: string, data?: Record<string, unknown>) =>
  logger.error(formatLog(message, data));

/**
 * Handle MarketCreatedEvent
 * Creates a new market in the database with on-chain data
 */
export async function handleMarketCreated(
  event: ProcessedEvent,
  eventData: MarketCreatedEvent
): Promise<void> {
  const { market_id, creator, question, outcomes, end_timestamp, liquidity_parameter } = eventData;

  logInfo('[EventHandler] Processing MarketCreatedEvent', {
    marketId: market_id,
    creator,
    question,
  });

  try {
    // Parse end timestamp (Aptos uses microseconds)
    const endDate = new Date(parseInt(end_timestamp) / 1000);

    // Create market in database
    await prisma.market.create({
      data: {
        onChainId: market_id,
        chain: event.chain,
        question,
        outcomes,
        creatorWallet: creator,
        endDate,
        status: 'active',
        liquidityParam: BigInt(liquidity_parameter),
        outcomePools: [], // Will be populated on first bet
        transactionHash: event.transactionHash,
        lastSyncedAt: new Date(),
      },
    });

    logInfo('[EventHandler] Market created in database', { marketId: market_id });
  } catch (error) {
    logError('[EventHandler] Failed to handle MarketCreatedEvent', {
      marketId: market_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Handle MarketResolvedEvent
 * Updates market status to resolved and records winning outcome
 */
export async function handleMarketResolved(
  event: ProcessedEvent,
  eventData: MarketResolvedEvent
): Promise<void> {
  const { market_id, winning_outcome, total_volume } = eventData;

  logInfo('[EventHandler] Processing MarketResolvedEvent', {
    marketId: market_id,
    winningOutcome: winning_outcome,
  });

  try {
    // Find market by onChainId
    const market = await prisma.market.findFirst({
      where: { onChainId: market_id, chain: event.chain },
    });

    if (!market) {
      logWarn('[EventHandler] Market not found for resolution', { marketId: market_id });
      return;
    }

    // Update market status
    await prisma.market.update({
      where: { id: market.id },
      data: {
        status: 'resolved',
        resolvedOutcome: winning_outcome,
        resolvedAt: new Date(),
        totalVolume: BigInt(total_volume),
        lastSyncedAt: new Date(),
      },
    });

    logInfo('[EventHandler] Market resolved in database', { marketId: market_id });
  } catch (error) {
    logError('[EventHandler] Failed to handle MarketResolvedEvent', {
      marketId: market_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Handle BetPlacedEvent
 * Updates market pools and volume
 */
export async function handleBetPlaced(
  event: ProcessedEvent,
  eventData: BetPlacedEvent
): Promise<void> {
  const { market_id, bettor, outcome, amount, shares } = eventData;

  logInfo('[EventHandler] Processing BetPlacedEvent', {
    marketId: market_id,
    bettor,
    outcome,
    amount,
    shares,
  });

  try {
    // Find market
    const market = await prisma.market.findFirst({
      where: { onChainId: market_id, chain: event.chain },
    });

    if (!market) {
      logWarn('[EventHandler] Market not found for bet', { marketId: market_id });
      return;
    }

    // Update market volume
    await prisma.market.update({
      where: { id: market.id },
      data: {
        totalVolume: { increment: BigInt(amount) },
        lastSyncedAt: new Date(),
      },
    });

    logInfo('[EventHandler] Bet recorded', { marketId: market_id, bettor });
  } catch (error) {
    logError('[EventHandler] Failed to handle BetPlacedEvent', {
      marketId: market_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Handle WinningsClaimedEvent
 * Records that a user claimed their winnings
 */
export async function handleWinningsClaimed(
  event: ProcessedEvent,
  eventData: WinningsClaimedEvent
): Promise<void> {
  const { market_id, user, amount } = eventData;

  logInfo('[EventHandler] Processing WinningsClaimedEvent', {
    marketId: market_id,
    user,
    amount,
  });

  // Currently just logging - could track user positions in future
  // For now, the event is stored in BlockchainEvent table for audit purposes
}

/**
 * Handle DisputeCreatedEvent
 * Updates market status to disputed
 */
export async function handleDisputeCreated(
  event: ProcessedEvent,
  eventData: DisputeCreatedEvent
): Promise<void> {
  const { dispute_id, market_id, disputor } = eventData;

  logInfo('[EventHandler] Processing DisputeCreatedEvent', {
    disputeId: dispute_id,
    marketId: market_id,
    disputor,
  });

  try {
    // Find market
    const market = await prisma.market.findFirst({
      where: { onChainId: market_id, chain: event.chain },
    });

    if (!market) {
      logWarn('[EventHandler] Market not found for dispute', { marketId: market_id });
      return;
    }

    // Update market status to disputed
    await prisma.market.update({
      where: { id: market.id },
      data: {
        status: 'disputed',
        lastSyncedAt: new Date(),
      },
    });

    logInfo('[EventHandler] Market marked as disputed', { marketId: market_id });
  } catch (error) {
    logError('[EventHandler] Failed to handle DisputeCreatedEvent', {
      marketId: market_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Handle DisputeResolvedEvent
 * Updates market status after dispute resolution
 */
export async function handleDisputeResolved(
  event: ProcessedEvent,
  eventData: DisputeResolvedEvent
): Promise<void> {
  const { dispute_id, market_id, accepted, new_outcome } = eventData;

  logInfo('[EventHandler] Processing DisputeResolvedEvent', {
    disputeId: dispute_id,
    marketId: market_id,
    accepted,
  });

  try {
    // Find market
    const market = await prisma.market.findFirst({
      where: { onChainId: market_id, chain: event.chain },
    });

    if (!market) {
      logWarn('[EventHandler] Market not found for dispute resolution', { marketId: market_id });
      return;
    }

    // Update market based on dispute outcome
    await prisma.market.update({
      where: { id: market.id },
      data: {
        status: 'resolved',
        resolvedOutcome: accepted && new_outcome !== null ? new_outcome : market.resolvedOutcome,
        lastSyncedAt: new Date(),
      },
    });

    logInfo('[EventHandler] Dispute resolved', { marketId: market_id, accepted });
  } catch (error) {
    logError('[EventHandler] Failed to handle DisputeResolvedEvent', {
      marketId: market_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Handle RoleGrantedEvent
 * Records role grant in database and updates user roles
 */
export async function handleRoleGranted(
  event: ProcessedEvent,
  eventData: RoleGrantedEvent
): Promise<void> {
  const { wallet, role, granted_by } = eventData;

  logInfo('[EventHandler] Processing RoleGrantedEvent', {
    wallet,
    role,
    grantedBy: granted_by,
  });

  try {
    // Upsert user
    await prisma.user.upsert({
      where: { walletAddress: wallet },
      update: {
        roles: { push: role },
        lastRoleSync: new Date(),
      },
      create: {
        walletAddress: wallet,
        roles: [role],
        onChainRolesSynced: true,
        lastRoleSync: new Date(),
      },
    });

    // Record role change
    await prisma.roleChange.create({
      data: {
        walletAddress: wallet,
        role,
        action: 'grant',
        grantedBy: granted_by,
        transactionHash: event.transactionHash,
        chain: event.chain,
      },
    });

    logInfo('[EventHandler] Role granted', { wallet, role });
  } catch (error) {
    logError('[EventHandler] Failed to handle RoleGrantedEvent', {
      wallet,
      role,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Handle RoleRevokedEvent
 * Records role revocation in database and updates user roles
 */
export async function handleRoleRevoked(
  event: ProcessedEvent,
  eventData: RoleRevokedEvent
): Promise<void> {
  const { wallet, role, revoked_by } = eventData;

  logInfo('[EventHandler] Processing RoleRevokedEvent', {
    wallet,
    role,
    revokedBy: revoked_by,
  });

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
    });

    if (!user) {
      logWarn('[EventHandler] User not found for role revocation', { wallet });
      return;
    }

    // Remove role from user
    const updatedRoles = user.roles.filter((assignedRole: string) => assignedRole !== role);
    await prisma.user.update({
      where: { walletAddress: wallet },
      data: {
        roles: updatedRoles,
        lastRoleSync: new Date(),
      },
    });

    // Record role change
    await prisma.roleChange.create({
      data: {
        walletAddress: wallet,
        role,
        action: 'revoke',
        grantedBy: revoked_by,
        transactionHash: event.transactionHash,
        chain: event.chain,
      },
    });

    logInfo('[EventHandler] Role revoked', { wallet, role });
  } catch (error) {
    logError('[EventHandler] Failed to handle RoleRevokedEvent', {
      wallet,
      role,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Handle SystemPausedEvent
 * Currently just logs - could update system state in future
 */
export async function handleSystemPaused(
  event: ProcessedEvent,
  eventData: SystemPausedEvent
): Promise<void> {
  const { paused_by } = eventData;

  logWarn('[EventHandler] System paused', {
    pausedBy: paused_by,
    chain: event.chain,
  });
}

/**
 * Handle SystemUnpausedEvent
 * Currently just logs - could update system state in future
 */
export async function handleSystemUnpaused(
  event: ProcessedEvent,
  eventData: SystemUnpausedEvent
): Promise<void> {
  const { unpaused_by } = eventData;

  logInfo('[EventHandler] System unpaused', {
    unpausedBy: unpaused_by,
    chain: event.chain,
  });
}

/**
 * Route event to appropriate handler based on event type
 */
export async function processEvent(event: ProcessedEvent): Promise<void> {
  const eventData = event.eventData;

  switch (event.eventType) {
    case 'MarketCreatedEvent':
      await handleMarketCreated(event, eventData as MarketCreatedEvent);
      break;
    case 'MarketResolvedEvent':
      await handleMarketResolved(event, eventData as MarketResolvedEvent);
      break;
    case 'BetPlacedEvent':
      await handleBetPlaced(event, eventData as BetPlacedEvent);
      break;
    case 'WinningsClaimedEvent':
      await handleWinningsClaimed(event, eventData as WinningsClaimedEvent);
      break;
    case 'DisputeCreatedEvent':
      await handleDisputeCreated(event, eventData as DisputeCreatedEvent);
      break;
    case 'DisputeResolvedEvent':
      await handleDisputeResolved(event, eventData as DisputeResolvedEvent);
      break;
    case 'RoleGrantedEvent':
      await handleRoleGranted(event, eventData as RoleGrantedEvent);
      break;
    case 'RoleRevokedEvent':
      await handleRoleRevoked(event, eventData as RoleRevokedEvent);
      break;
    case 'SystemPausedEvent':
      await handleSystemPaused(event, eventData as SystemPausedEvent);
      break;
    case 'SystemUnpausedEvent':
      await handleSystemUnpaused(event, eventData as SystemUnpausedEvent);
      break;
    default:
      logWarn('[EventHandler] Unknown event type', { eventType: event.eventType });
  }

  // Store raw event in database for audit trail
  await prisma.blockchainEvent.create({
    data: {
      chain: event.chain,
      eventType: event.eventType,
      transactionHash: event.transactionHash,
      sequenceNumber: event.sequenceNumber,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eventData: eventData as any,
      blockHeight: event.blockHeight,
      timestamp: event.timestamp,
      marketId: event.marketId,
    },
  });
}
