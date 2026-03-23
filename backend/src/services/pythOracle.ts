/**
 * Pyth Oracle Service (M3)
 *
 * This service integrates with Pyth Network to fetch real-time price data for crypto assets.
 * It provides price feeds for BTC, ETH, SOL, and other assets with failover mechanisms.
 *
 * Features:
 * - Real-time price feeds from Pyth Network
 * - Multiple oracle endpoints for failover
 * - Price caching with TTL
 * - Confidence interval validation
 * - Staleness checks
 * - Error handling with retry logic
 */

import { PriceServiceConnection } from '@pythnetwork/price-service-client';

import { logger } from '../config/logger.js';

const formatLog = (message: string, data?: Record<string, unknown>) =>
  data ? { ...data, msg: message } : { msg: message };

const logInfo = (message: string, data?: Record<string, unknown>) =>
  logger.info(formatLog(message, data));
const logWarn = (message: string, data?: Record<string, unknown>) =>
  logger.warn(formatLog(message, data));
const logError = (message: string, data?: Record<string, unknown>) =>
  logger.error(formatLog(message, data));
const logDebug = (message: string, data?: Record<string, unknown>) =>
  logger.debug(formatLog(message, data));

/**
 * Supported price feed IDs from Pyth Network
 * These are the actual Pyth price feed IDs for each asset
 */
export const PRICE_FEED_IDS = {
  // Crypto price feeds
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'APT/USD': '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
} as const;

export type PriceFeedId = keyof typeof PRICE_FEED_IDS;

/**
 * Price data from Pyth Network
 */
export interface PriceData {
  price: number; // Price in USD
  confidence: number; // Confidence interval
  exponent: number; // Price exponent (10^exponent)
  publishTime: number; // Unix timestamp
}

/**
 * Cached price entry
 */
interface PriceCacheEntry {
  data: PriceData;
  timestamp: number;
}

/**
 * Oracle configuration for failover
 */
interface OracleEndpoint {
  url: string;
  priority: number; // Lower = higher priority
  enabled: boolean;
}

export class PythOracleService {
  private connections: Map<string, PriceServiceConnection> = new Map();
  private cache: Map<string, PriceCacheEntry> = new Map();
  private cacheTTL: number; // milliseconds
  private maxConfidenceRatio: number; // max confidence/price ratio
  private maxStaleness: number; // max age in seconds

  // Oracle endpoints in priority order (failover)
  private endpoints: OracleEndpoint[] = [
    { url: 'https://hermes.pyth.network', priority: 1, enabled: true },
    { url: 'https://hermes-beta.pyth.network', priority: 2, enabled: true },
    { url: 'https://xc-mainnet.pyth.network', priority: 3, enabled: true },
  ];

  constructor(config?: { cacheTTL?: number; maxConfidenceRatio?: number; maxStaleness?: number }) {
    this.cacheTTL = config?.cacheTTL || 30000; // 30 seconds default
    this.maxConfidenceRatio = config?.maxConfidenceRatio || 0.01; // 1% max confidence
    this.maxStaleness = config?.maxStaleness || 60; // 60 seconds max staleness

    // Initialize connections
    this.initializeConnections();

    logInfo('[PythOracle] Initialized', {
      cacheTTL: this.cacheTTL,
      maxConfidenceRatio: this.maxConfidenceRatio,
      maxStaleness: this.maxStaleness,
      endpoints: this.endpoints.length,
    });
  }

  /**
   * Initialize connections to all oracle endpoints
   */
  private initializeConnections(): void {
    for (const endpoint of this.endpoints) {
      if (endpoint.enabled) {
        try {
          const connection = new PriceServiceConnection(endpoint.url, {
            priceFeedRequestConfig: {
              binary: true,
            },
          });
          this.connections.set(endpoint.url, connection);
          logInfo('[PythOracle] Connected to endpoint', { url: endpoint.url });
        } catch (error) {
          logError('[PythOracle] Failed to connect to endpoint', {
            url: endpoint.url,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  }

  /**
   * Get current price for an asset
   * Uses cache if available and not expired
   */
  async getPrice(symbol: PriceFeedId): Promise<PriceData> {
    // Check cache
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      logDebug('[PythOracle] Cache hit', { symbol });
      return cached.data;
    }

    // Fetch from oracle with failover
    logDebug('[PythOracle] Fetching price from oracle', { symbol });
    const priceData = await this.fetchPriceWithFailover(symbol);

    // Validate price data
    this.validatePriceData(symbol, priceData);

    // Update cache
    this.cache.set(symbol, {
      data: priceData,
      timestamp: Date.now(),
    });

    return priceData;
  }

  /**
   * Fetch price with automatic failover to backup endpoints
   */
  private async fetchPriceWithFailover(symbol: PriceFeedId): Promise<PriceData> {
    const priceId = PRICE_FEED_IDS[symbol];
    const sortedEndpoints = this.endpoints
      .filter((e) => e.enabled)
      .sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;

    for (const endpoint of sortedEndpoints) {
      try {
        const connection = this.connections.get(endpoint.url);
        if (!connection) {
          continue;
        }

        logDebug('[PythOracle] Trying endpoint', {
          url: endpoint.url,
          priority: endpoint.priority,
        });

        const priceFeeds = await connection.getLatestPriceFeeds([priceId]);

        if (!priceFeeds || priceFeeds.length === 0) {
          throw new Error('No price feed data returned');
        }

        const priceFeed = priceFeeds[0];
        const priceData = priceFeed.getPriceNoOlderThan(this.maxStaleness);

        if (!priceData) {
          throw new Error(`Price data too stale (max: ${this.maxStaleness}s)`);
        }

        const price = Number(priceData.price) * Math.pow(10, priceData.expo);
        const confidence = Number(priceData.conf) * Math.pow(10, priceData.expo);

        const result: PriceData = {
          price,
          confidence,
          exponent: priceData.expo,
          publishTime: priceData.publishTime,
        };

        logInfo('[PythOracle] Successfully fetched price', {
          symbol,
          endpoint: endpoint.url,
          price: result.price,
          publishTime: result.publishTime,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logWarn('[PythOracle] Endpoint failed, trying next', {
          url: endpoint.url,
          error: lastError.message,
        });
      }
    }

    // All endpoints failed
    throw new Error(
      `Failed to fetch price for ${symbol} from all endpoints. Last error: ${lastError?.message}`
    );
  }

  /**
   * Validate price data quality
   */
  private validatePriceData(symbol: PriceFeedId, data: PriceData): void {
    // Check confidence ratio
    const confidenceRatio = data.confidence / data.price;
    if (confidenceRatio > this.maxConfidenceRatio) {
      logWarn('[PythOracle] High confidence ratio detected', {
        symbol,
        confidenceRatio,
        maxAllowed: this.maxConfidenceRatio,
      });
      throw new Error(
        `Price confidence too low: ${confidenceRatio.toFixed(4)} > ${this.maxConfidenceRatio}`
      );
    }

    // Check staleness
    const age = Date.now() / 1000 - data.publishTime;
    if (age > this.maxStaleness) {
      throw new Error(`Price data too stale: ${age.toFixed(0)}s > ${this.maxStaleness}s`);
    }

    // Check for zero/negative price
    if (data.price <= 0) {
      throw new Error(`Invalid price: ${data.price}`);
    }

    logDebug('[PythOracle] Price data validated', { symbol, age: age.toFixed(1) });
  }

  /**
   * Get multiple prices at once
   */
  async getPrices(symbols: PriceFeedId[]): Promise<Map<PriceFeedId, PriceData>> {
    const prices = new Map<PriceFeedId, PriceData>();

    // Fetch prices in parallel
    const results = await Promise.allSettled(symbols.map((symbol) => this.getPrice(symbol)));

    results.forEach((result, index) => {
      const symbol = symbols[index];
      if (result.status === 'fulfilled') {
        prices.set(symbol, result.value);
      } else {
        logError('[PythOracle] Failed to fetch price', {
          symbol,
          error: result.reason,
        });
      }
    });

    return prices;
  }

  /**
   * Check if price meets threshold for market resolution
   * e.g., "Will BTC reach $100k?" -> compare current price to threshold
   */
  checkPriceThreshold(
    symbol: PriceFeedId,
    threshold: number,
    direction: 'above' | 'below' = 'above'
  ): boolean {
    const cached = this.cache.get(symbol);
    if (!cached) {
      throw new Error(`No cached price for ${symbol}`);
    }

    const price = cached.data.price;

    if (direction === 'above') {
      return price >= threshold;
    } else {
      return price <= threshold;
    }
  }

  /**
   * Get health status of all oracle endpoints
   */
  async getOracleHealth(): Promise<{
    healthy: boolean;
    endpoints: Array<{
      url: string;
      priority: number;
      status: 'healthy' | 'unhealthy';
      lastCheck: number;
    }>;
  }> {
    const endpointStatus = await Promise.all(
      this.endpoints.map(async (endpoint) => {
        try {
          const connection = this.connections.get(endpoint.url);
          if (!connection) {
            return {
              url: endpoint.url,
              priority: endpoint.priority,
              status: 'unhealthy' as const,
              lastCheck: Date.now(),
            };
          }

          // Try to fetch a test price (BTC/USD)
          await connection.getLatestPriceFeeds([PRICE_FEED_IDS['BTC/USD']]);

          return {
            url: endpoint.url,
            priority: endpoint.priority,
            status: 'healthy' as const,
            lastCheck: Date.now(),
          };
        } catch (error) {
          return {
            url: endpoint.url,
            priority: endpoint.priority,
            status: 'unhealthy' as const,
            lastCheck: Date.now(),
          };
        }
      })
    );

    const healthy = endpointStatus.some((e) => e.status === 'healthy');

    return {
      healthy,
      endpoints: endpointStatus,
    };
  }

  /**
   * Clear price cache
   */
  clearCache(symbol?: PriceFeedId): void {
    if (symbol) {
      this.cache.delete(symbol);
      logDebug('[PythOracle] Cache cleared for symbol', { symbol });
    } else {
      this.cache.clear();
      logInfo('[PythOracle] All cache cleared');
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL,
      entries: Array.from(this.cache.entries()).map(([symbol, entry]) => ({
        symbol,
        price: entry.data.price,
        age: Date.now() - entry.timestamp,
      })),
    };
  }

  /**
   * Enable/disable an endpoint
   */
  setEndpointStatus(url: string, enabled: boolean): void {
    const endpoint = this.endpoints.find((e) => e.url === url);
    if (endpoint) {
      endpoint.enabled = enabled;
      logInfo('[PythOracle] Endpoint status changed', { url, enabled });
    }
  }
}

/**
 * Global Pyth oracle service instance
 */
let globalPythService: PythOracleService | null = null;

/**
 * Get or create the global Pyth oracle service
 */
export function getPythOracleService(): PythOracleService {
  if (!globalPythService) {
    const cacheTTL = parseInt(process.env.PYTH_CACHE_TTL ?? '30000', 10); // 30 seconds default
    const maxConfidenceRatio = parseFloat(process.env.PYTH_MAX_CONFIDENCE_RATIO ?? '0.01'); // 1% default
    const maxStaleness = parseInt(process.env.PYTH_MAX_STALENESS ?? '60', 10); // 60 seconds default

    globalPythService = new PythOracleService({
      cacheTTL,
      maxConfidenceRatio,
      maxStaleness,
    });
  }
  return globalPythService;
}

/**
 * Convenience functions for price fetching
 */
export async function getBTCPrice(): Promise<number> {
  const service = getPythOracleService();
  const data = await service.getPrice('BTC/USD');
  return data.price;
}

export async function getETHPrice(): Promise<number> {
  const service = getPythOracleService();
  const data = await service.getPrice('ETH/USD');
  return data.price;
}

export async function getSOLPrice(): Promise<number> {
  const service = getPythOracleService();
  const data = await service.getPrice('SOL/USD');
  return data.price;
}

export async function getAPTPrice(): Promise<number> {
  const service = getPythOracleService();
  const data = await service.getPrice('APT/USD');
  return data.price;
}
