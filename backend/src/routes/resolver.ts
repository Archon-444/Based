/**
 * Resolver Management API Routes
 *
 * Provides endpoints for managing market resolver scheduling and controls
 */

import { Router } from 'express';

import { logger } from '../config/logger.js';
import { authenticateWallet } from '../middleware/authenticateWallet.js';
import { requireRole } from '../middleware/requireRole.js';
import { getMarketResolverService } from '../services/marketResolver.js';

const router = Router();

// Apply authentication and role checks to all routes
router.use(authenticateWallet);
router.use(requireRole('admin')); // Require admin role for resolver management

/**
 * GET /resolver/status
 * Get current resolver status and configuration
 */
router.get('/status', async (req, res) => {
  try {
    const resolver = getMarketResolverService();

    // Get pending resolutions
    const pendingResolutions = await resolver.getPendingResolutions();

    // Get resolver configuration from environment
    const config = {
      intervalMs: parseInt(process.env.RESOLVER_INTERVAL_MS ?? '300000', 10),
      enabled: process.env.RESOLVER_ENABLED !== 'false',
      dryRun: process.env.RESOLVER_DRY_RUN === 'true',
    };

    res.json({
      success: true,
      data: {
        config,
        pendingResolutions: pendingResolutions.length,
        lastCheck: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get resolver status');
    res.status(500).json({
      success: false,
      error: 'Failed to get resolver status',
    });
  }
});

/**
 * POST /resolver/run
 * Manually trigger resolver check
 */
router.post('/run', async (req, res) => {
  try {
    const { dryRun = false } = req.body;
    const resolver = getMarketResolverService();

    logger.info({ dryRun }, 'Manual resolver check triggered');

    const results = await resolver.checkAndResolveMarkets(dryRun);

    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        dryRun,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to run resolver');
    res.status(500).json({
      success: false,
      error: 'Failed to run resolver',
    });
  }
});

/**
 * POST /resolver/resolve/:marketId
 * Manually resolve a specific market
 */
router.post('/resolve/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    const { dryRun = false } = req.body;
    const resolver = getMarketResolverService();

    logger.info({ marketId, dryRun }, 'Manual market resolution triggered');

    // Check if market can be resolved
    const canResolve = await resolver.canAutoResolve(marketId);

    if (!canResolve.canResolve) {
      return res.status(400).json({
        success: false,
        error: canResolve.reason,
        criteria: canResolve.criteria,
      });
    }

    const result = await resolver.resolveMarket(marketId, dryRun);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error, marketId: req.params.marketId }, 'Failed to resolve market');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve market',
    });
  }
});

/**
 * GET /resolver/pending
 * Get list of markets pending resolution
 */
router.get('/pending', async (req, res) => {
  try {
    const resolver = getMarketResolverService();
    const pendingResolutions = await resolver.getPendingResolutions();

    // Add resolution analysis for each market
    const enrichedResolutions = await Promise.all(
      (pendingResolutions as { id: string; [key: string]: unknown }[]).map(async (market) => {
        const canResolve = await resolver.canAutoResolve(market.id);
        return {
          ...market,
          canAutoResolve: canResolve.canResolve,
          resolutionReason: canResolve.reason,
          criteria: canResolve.criteria,
        };
      })
    );

    res.json({
      success: true,
      data: enrichedResolutions,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get pending resolutions');
    res.status(500).json({
      success: false,
      error: 'Failed to get pending resolutions',
    });
  }
});

/**
 * POST /resolver/config
 * Update resolver configuration
 */
router.post('/config', async (req, res) => {
  try {
    const { intervalMs, enabled, dryRun } = req.body;

    // Validate input
    if (intervalMs && (typeof intervalMs !== 'number' || intervalMs < 60000)) {
      return res.status(400).json({
        success: false,
        error: 'Interval must be at least 60 seconds',
      });
    }

    // Update environment variables (this would typically be stored in a config service)
    if (intervalMs) {
      process.env.RESOLVER_INTERVAL_MS = intervalMs.toString();
    }
    if (enabled !== undefined) {
      process.env.RESOLVER_ENABLED = enabled.toString();
    }
    if (dryRun !== undefined) {
      process.env.RESOLVER_DRY_RUN = dryRun.toString();
    }

    logger.info({ intervalMs, enabled, dryRun }, 'Resolver configuration updated');

    res.json({
      success: true,
      data: {
        intervalMs: process.env.RESOLVER_INTERVAL_MS,
        enabled: process.env.RESOLVER_ENABLED,
        dryRun: process.env.RESOLVER_DRY_RUN,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update resolver config');
    res.status(500).json({
      success: false,
      error: 'Failed to update resolver config',
    });
  }
});

export default router;
