import { Router } from 'express';

import { marketsController } from '../controllers/markets.controller.js';
import { authenticatedApiLimiter, publicApiLimiter } from '../middleware/rateLimit.js';

export const marketsRouter = Router();

// List markets - public endpoint with rate limiting
marketsRouter.get('/', publicApiLimiter, marketsController.listMarkets);

// Get market details - public endpoint with rate limiting
marketsRouter.get('/:chain/:onChainId', publicApiLimiter, marketsController.getMarket);

// Calculate payout - authenticated endpoint (requires computation)
marketsRouter.post('/calculate-payout', authenticatedApiLimiter, marketsController.calculatePayout);
