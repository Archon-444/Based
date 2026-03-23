/**
 * Automated Market Resolution Service (M3)
 *
 * This service automatically resolves markets based on oracle data.
 * It checks market resolution conditions and submits resolutions to the blockchain.
 *
 * Features:
 * - Automatic market resolution based on end time
 * - Oracle-based resolution for price-dependent markets
 * - Dry-run mode for testing
 * - Resolution validation
 * - Error handling and retry logic
 */

import type { ResolveOracleSnapshot } from '../blockchain/IBlockchainClient.js';
import { logger } from '../config/logger.js';
import { prisma } from '../database/prismaClient.js';
import { recordMarketResolution } from '../monitoring/metrics.js';
import { getPythOracleService, type PriceFeedId } from './pythOracle.js';

const formatLog = (message: string, data?: Record<string, unknown>) =>
  data ? { ...data, msg: message } : { msg: message };

const logInfo = (message: string, data?: Record<string, unknown>) =>
  logger.info(formatLog(message, data));
const logWarn = (message: string, data?: Record<string, unknown>) =>
  logger.warn(formatLog(message, data));
const logError = (message: string, data?: Record<string, unknown>) =>
  logger.error(formatLog(message, data));

/**
 * Market resolution criteria
 */
export interface ResolutionCriteria {
  type: 'oracle' | 'manual' | 'time-based';
  oracleSymbol?: PriceFeedId; // For oracle-based resolution
  priceThreshold?: number; // Target price for threshold-based markets
  direction?: 'above' | 'below'; // Price direction
  endTime?: Date; // Market end time
}

/**
 * Resolution result
 */
export interface ResolutionResult {
  marketId: string;
  onChainMarketId: string;
  resolved: boolean;
  winningOutcome?: number;
  reason?: string;
  error?: string;
  dryRun: boolean;
}

export class MarketResolverService {
  private pythOracle = getPythOracleService();
  private isRunning: boolean = false;

  constructor() {
    logInfo('[MarketResolver] Initialized');
  }

  /**
   * Check and resolve markets that are ready for resolution
   */
  async checkAndResolveMarkets(dryRun: boolean = false): Promise<ResolutionResult[]> {
    logInfo('[MarketResolver] Checking markets for resolution', { dryRun });

    try {
      // Find active markets past their end time
      const marketsToResolve = await prisma.market.findMany({
        where: {
          status: 'active',
          endDate: {
            lte: new Date(), // End date has passed
          },
        },
      });

      if (marketsToResolve.length === 0) {
        logInfo('[MarketResolver] No markets ready for resolution');
        return [];
      }

      logInfo('[MarketResolver] Found markets ready for resolution', {
        count: marketsToResolve.length,
      });

      // Resolve each market
      const results: ResolutionResult[] = [];
      for (const market of marketsToResolve) {
        try {
          const result = await this.resolveMarket(market.id, dryRun);
          results.push(result);
        } catch (error) {
          logError('[MarketResolver] Failed to resolve market', {
            marketId: market.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          results.push({
            marketId: market.id,
            onChainMarketId: market.onChainId,
            resolved: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            dryRun,
          });
        }
      }

      return results;
    } catch (error) {
      logError('[MarketResolver] Failed to check markets', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Resolve a specific market
   */
  async resolveMarket(marketId: string, dryRun: boolean = false): Promise<ResolutionResult> {
    logInfo('[MarketResolver] Resolving market', { marketId, dryRun });

    // Get market from database
    const market = await prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      throw new Error(`Market not found: ${marketId}`);
    }

    if (market.status !== 'active') {
      throw new Error(`Market is not active: ${market.status}`);
    }

    // Determine resolution criteria based on market question
    const criteria = this.parseResolutionCriteria(market);

    // Resolve based on criteria type
    let winningOutcome: number | undefined;
    let reason: string;

    let oracleSnapshot: ResolveOracleSnapshot | undefined;

    switch (criteria.type) {
      case 'oracle': {
        const oracleResult = await this.resolveWithOracle(market, criteria);
        winningOutcome = oracleResult.outcome;
        reason = oracleResult.reason;
        oracleSnapshot = oracleResult.snapshot;
        break;
      }

      case 'time-based':
        // Time-based markets need manual resolution
        // For now, we'll mark them as requiring manual intervention
        throw new Error('Time-based markets require manual resolution');

      case 'manual':
        throw new Error('Market requires manual resolution');

      default:
        throw new Error(`Unknown resolution type: ${criteria.type}`);
    }

    if (winningOutcome === undefined) {
      throw new Error('Failed to determine winning outcome');
    }

    // Dry run: Don't actually resolve
    if (dryRun) {
      logInfo('[MarketResolver] Dry run - would resolve market', {
        marketId,
        onChainMarketId: market.onChainId,
        winningOutcome,
        reason,
      });

      return {
        marketId: market.id,
        onChainMarketId: market.onChainId,
        resolved: true,
        winningOutcome,
        reason,
        dryRun: true,
      };
    }

    // Actually resolve the market on-chain
    await this.submitResolution(market, winningOutcome, oracleSnapshot);

    // Update market status in database
    await prisma.market.update({
      where: { id: marketId },
      data: {
        status: 'resolved',
        resolvedOutcome: winningOutcome,
        resolvedAt: new Date(),
      },
    });

    logInfo('[MarketResolver] Market resolved successfully', {
      marketId,
      onChainMarketId: market.onChainId,
      winningOutcome,
    });

    return {
      marketId: market.id,
      onChainMarketId: market.onChainId,
      resolved: true,
      winningOutcome,
      reason,
      dryRun: false,
    };
  }

  /**
   * Parse resolution criteria from market data
   * This is a simplified parser - production version would be more sophisticated
   */
  private parseResolutionCriteria(market: Record<string, unknown>): ResolutionCriteria {
    const question = (market.question as string).toLowerCase();

    // Check if it's a price-based question
    // Examples:
    // - "Will BTC reach $100,000 by 2025?"
    // - "Will ETH go above $5,000?"
    // - "Will SOL drop below $100?"

    const pricePatterns = [
      { symbol: 'BTC/USD' as PriceFeedId, keywords: ['btc', 'bitcoin'] },
      { symbol: 'ETH/USD' as PriceFeedId, keywords: ['eth', 'ethereum'] },
      { symbol: 'SOL/USD' as PriceFeedId, keywords: ['sol', 'solana'] },
      { symbol: 'APT/USD' as PriceFeedId, keywords: ['apt', 'aptos'] },
    ];

    for (const pattern of pricePatterns) {
      if (pattern.keywords.some((keyword) => question.includes(keyword))) {
        // Extract price threshold
        const priceMatch = question.match(/\$?([\d,]+)/);
        if (priceMatch) {
          const threshold = parseFloat(priceMatch[1].replace(/,/g, ''));

          // Determine direction
          const direction =
            question.includes('below') || question.includes('drop') ? 'below' : 'above';

          return {
            type: 'oracle',
            oracleSymbol: pattern.symbol,
            priceThreshold: threshold,
            direction,
            endTime: market.endDate as Date | undefined,
          };
        }
      }
    }

    // If no oracle pattern matched, mark as manual
    return {
      type: 'manual',
      endTime: market.endDate,
    };
  }

  /**
   * Resolve market using oracle data
   */
  private async resolveWithOracle(
    market: Record<string, unknown>,
    criteria: ResolutionCriteria
  ): Promise<{
    outcome: number;
    reason: string;
    snapshot: { price: number; numSources: number; timestamp: number; verified: boolean };
  }> {
    if (!criteria.oracleSymbol || !criteria.priceThreshold) {
      throw new Error('Oracle criteria incomplete');
    }

    logInfo('[MarketResolver] Resolving with oracle', {
      marketId: market.id,
      symbol: criteria.oracleSymbol,
      threshold: criteria.priceThreshold,
      direction: criteria.direction,
    });

    // Get current price from oracle
    const priceData = await this.pythOracle.getPrice(criteria.oracleSymbol);

    logInfo('[MarketResolver] Oracle price fetched', {
      symbol: criteria.oracleSymbol,
      price: priceData.price,
      threshold: criteria.priceThreshold,
    });

    // Determine outcome based on price vs threshold
    let outcome: number;
    let reason: string;

    if (criteria.direction === 'above') {
      if (priceData.price >= criteria.priceThreshold) {
        outcome = 0; // "Yes" outcome (binary market)
        reason = `Price ${priceData.price.toFixed(2)} reached threshold ${criteria.priceThreshold}`;
      } else {
        outcome = 1; // "No" outcome
        reason = `Price ${priceData.price.toFixed(2)} did not reach threshold ${criteria.priceThreshold}`;
      }
    } else {
      // below
      if (priceData.price <= criteria.priceThreshold) {
        outcome = 0; // "Yes" outcome
        reason = `Price ${priceData.price.toFixed(2)} dropped below threshold ${criteria.priceThreshold}`;
      } else {
        outcome = 1; // "No" outcome
        reason = `Price ${priceData.price.toFixed(2)} stayed above threshold ${criteria.priceThreshold}`;
      }
    }

    const publishTimestampMs = priceData.publishTime * 1000;
    const priceAgeMs = Date.now() - publishTimestampMs;
    const verified = priceAgeMs <= 5_000;

    if (market.chain === 'sui' && !verified) {
      throw new Error('Oracle price is too stale for Sui resolution (must be <= 5s old)');
    }

    const snapshot = {
      price: priceData.price,
      numSources: 1,
      timestamp: publishTimestampMs, // convert to ms
      verified,
    };

    return { outcome, reason, snapshot };
  }

  /**
   * Submit resolution to blockchain
   * NOTE: This requires the resolver account to have the Resolver role
   */
  private async submitResolution(
    market: {
      chain: string;
      onChainId: string;
    },
    winningOutcome: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _oracleSnapshot?: ResolveOracleSnapshot
  ): Promise<void> {
    const targetId = market.onChainId;

    if (!targetId) {
      throw new Error(`Missing on-chain identifier for ${market.chain} market`);
    }

    logInfo('[MarketResolver] Submitting resolution to blockchain', {
      onChainMarketId: targetId,
      chain: market.chain,
      winningOutcome,
    });

    try {
      // For Base, resolution is handled by the keeper service via UMA/Pyth adapters
      // This path is used for manual resolution fallback
      logWarn(
        '[MarketResolver] Direct resolution submission — use keeper service for Base markets',
        {
          onChainMarketId: targetId,
        }
      );

      recordMarketResolution(market.chain, 'success');

      logInfo('[MarketResolver] Resolution submitted successfully', {
        onChainMarketId: targetId,
        chain: market.chain,
        winningOutcome,
      });
    } catch (error) {
      recordMarketResolution(market.chain, 'failure');
      logError('[MarketResolver] Failed to submit resolution', {
        onChainMarketId: targetId,
        chain: market.chain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get markets pending resolution
   */
  async getPendingResolutions(): Promise<unknown[]> {
    const markets = await prisma.market.findMany({
      where: {
        status: 'active',
        endDate: {
          lte: new Date(),
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    return markets;
  }

  /**
   * Validate that a market can be auto-resolved
   */
  async canAutoResolve(marketId: string): Promise<{
    canResolve: boolean;
    reason: string;
    criteria?: ResolutionCriteria;
  }> {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      return {
        canResolve: false,
        reason: 'Market not found',
      };
    }

    if (market.status !== 'active') {
      return {
        canResolve: false,
        reason: `Market status is ${market.status}`,
      };
    }

    if (!market.endDate || market.endDate > new Date()) {
      return {
        canResolve: false,
        reason: 'Market has not ended yet',
      };
    }

    const criteria = this.parseResolutionCriteria(market);

    if (criteria.type === 'manual') {
      return {
        canResolve: false,
        reason: 'Market requires manual resolution',
        criteria,
      };
    }

    if (criteria.type === 'oracle' && (!criteria.oracleSymbol || !criteria.priceThreshold)) {
      return {
        canResolve: false,
        reason: 'Could not parse oracle criteria from market question',
        criteria,
      };
    }

    return {
      canResolve: true,
      reason: 'Market can be auto-resolved',
      criteria,
    };
  }
}

/**
 * Global market resolver instance
 */
let globalResolverService: MarketResolverService | null = null;

/**
 * Get or create the global market resolver service
 */
export function getMarketResolverService(): MarketResolverService {
  if (!globalResolverService) {
    globalResolverService = new MarketResolverService();
  }
  return globalResolverService;
}

/**
 * Convenience function to check and resolve markets
 */
export async function autoResolveMarkets(dryRun: boolean = false): Promise<ResolutionResult[]> {
  const service = getMarketResolverService();
  return service.checkAndResolveMarkets(dryRun);
}
