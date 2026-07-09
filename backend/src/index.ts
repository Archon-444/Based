import { createServer } from 'http';

import app from './app.js';
import { env, isChainActive } from './config/env.js';
import { logger } from './config/logger.js';
import { getMarketResolverService } from './services/marketResolver.js';
import { cleanupExpiredNonces } from './utils/wallet.js';
import { attachWebSocketServer } from './websocket/wsServer.js';

const server = createServer(app);
const port = env.PORT;

const NONCE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // hourly

// Store interval IDs and service references for cleanup
let resolverInterval: NodeJS.Timeout | null = null;
let nonceCleanupInterval: NodeJS.Timeout | null = null;
let baseKeeperService: import('./services/keeperService.js').KeeperService | null = null;
let baseAgentManager: import('./agents/index.js').AgentManager | null = null;

server.listen(port, async () => {
  logger.info(`Backend listening on port ${port}`);

  // Start Base Event Indexer + Keeper
  if (isChainActive('base')) {
    try {
      const { startBaseIndexer } = await import('./services/baseEventIndexer.js');
      await startBaseIndexer();
      logger.info('Base event indexer started successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to start Base event indexer');
    }

    try {
      const { KeeperService } = await import('./services/keeperService.js');
      baseKeeperService = new KeeperService();
      baseKeeperService.start();
      logger.info('Base keeper service started');
    } catch (error) {
      logger.error({ error }, 'Failed to start Base keeper service');
    }
    // Start AI Agent Manager (Phase 5)
    if (env.AGENT_ENABLED === 'true') {
      try {
        const { AgentManager } = await import('./agents/index.js');
        baseAgentManager = new AgentManager();
        await baseAgentManager.start();
        logger.info('AI Agent Manager started');
      } catch (error) {
        logger.error({ error }, 'Failed to start AI Agent Manager (non-fatal)');
      }
    }
  } else {
    logger.info('Base services disabled via ACTIVE_CHAINS');
  }

  // Attach WebSocket server
  attachWebSocketServer(server);

  // Start Market Resolver (M3)
  // Check for markets to resolve every 5 minutes
  const resolver = getMarketResolverService();
  const resolverIntervalMs = parseInt(process.env.RESOLVER_INTERVAL_MS ?? '300000', 10); // 5 min default

  resolverInterval = setInterval(async () => {
    try {
      logger.debug('Running scheduled market resolution check');
      const results = await resolver.checkAndResolveMarkets(false);

      if (results.length > 0) {
        logger.info({ count: results.length }, 'Market resolution check completed');
        results.forEach((result) => {
          if (result.resolved) {
            logger.info(
              {
                marketId: result.marketId,
                winningOutcome: result.winningOutcome,
                reason: result.reason,
              },
              'Market auto-resolved'
            );
          } else if (result.error) {
            logger.error(
              {
                marketId: result.marketId,
                error: result.error,
              },
              'Failed to auto-resolve market'
            );
          }
        });
      }
    } catch (error) {
      logger.error({ error }, 'Market resolver error');
    }
  }, resolverIntervalMs);

  logger.info({ intervalMs: resolverIntervalMs }, 'Market resolver started');

  // Periodically prune expired auth nonces (housekeeping for the persistent replay store).
  nonceCleanupInterval = setInterval(async () => {
    try {
      const deleted = await cleanupExpiredNonces();
      if (deleted > 0) logger.debug({ deleted }, 'Pruned expired auth nonces');
    } catch (error) {
      logger.error({ error }, 'Nonce cleanup error');
    }
  }, NONCE_CLEANUP_INTERVAL_MS);
});

const shutdown = async (signal: string) => {
  logger.warn({ signal }, 'Received shutdown signal, closing server');

  // Stop market resolver
  if (resolverInterval) {
    clearInterval(resolverInterval);
    logger.info('Market resolver stopped');
  }

  if (nonceCleanupInterval) {
    clearInterval(nonceCleanupInterval);
  }

  // Stop Base services
  if (isChainActive('base')) {
    try {
      const { stopBaseIndexer } = await import('./services/baseEventIndexer.js');
      await stopBaseIndexer();
      logger.info('Base event indexer stopped');
    } catch (error) {
      logger.error({ error }, 'Error stopping Base event indexer');
    }

    if (baseKeeperService) {
      baseKeeperService.stop();
      logger.info('Base keeper service stopped');
    }

    if (baseAgentManager) {
      baseAgentManager.stop();
      logger.info('AI Agent Manager stopped');
    }
  }

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
