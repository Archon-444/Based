import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { logger } from '../config/logger.js';
import { marketsService } from '../services/markets.service.js';
import { suiMarketLookupService } from '../services/sui-market-lookup.service.js';

const listSchema = z.object({
  chain: z.enum(['aptos', 'sui', 'movement', 'base']).optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().positive().max(2000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const detailSchema = z.object({
  chain: z.enum(['aptos', 'sui', 'movement', 'base']),
  onChainId: z.string().min(1),
});

const calculatePayoutSchema = z
  .object({
    marketId: z.string().min(1).optional(),
    chain: z.enum(['aptos', 'sui', 'movement', 'base']).optional(),
    onChainId: z.string().min(1).optional(),
    outcomeIndex: z.coerce.number().int().min(0),
    amount: z.coerce.number().positive(),
  })
  .refine((data) => Boolean(data.marketId) || (Boolean(data.chain) && Boolean(data.onChainId)), {
    message: 'Provide marketId or chain and onChainId to calculate payout',
    path: ['marketId'],
  });

const suiMarketObjectsSchema = z.object({
  marketId: z.coerce.number().int().min(0),
});

const suiBootstrapSchema = z.object({
  digest: z.string().min(1),
});

export const marketsController = {
  async listMarkets(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listSchema.parse(req.query);
      const markets = await marketsService.listMarkets(query);
      res.json(markets);
    } catch (error) {
      next(error);
    }
  },

  async getMarket(req: Request, res: Response, next: NextFunction) {
    try {
      const params = detailSchema.parse(req.params);
      const market = await marketsService.getMarket(params);
      if (!market) {
        return res.status(404).json({ error: 'Market not found' });
      }
      res.json(market);
    } catch (error) {
      next(error);
    }
  },

  async calculatePayout(req: Request, res: Response, next: NextFunction) {
    try {
      const params = calculatePayoutSchema.parse(req.body);
      const payout = await marketsService.calculatePayout(params);

      if (!payout) {
        return res.status(404).json({ error: 'Market not found or invalid parameters' });
      }

      res.json({
        estimatedPayout: payout.estimatedPayout,
        potentialProfit: payout.potentialProfit,
        currentOdds: payout.currentOdds,
        fees: payout.fees,
        chain: payout.chain,
        shares: payout.shares,
        priceImpact: payout.priceImpact,
        marketId: params.marketId ?? null,
        onChainId: params.onChainId ?? null,
        outcomeIndex: params.outcomeIndex,
        betAmount: params.amount,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSuiMarketObjects(req: Request, res: Response, next: NextFunction) {
    try {
      const params = suiMarketObjectsSchema.parse(req.params);
      const objects = await suiMarketLookupService.getSuiMarketObjects(params.marketId);
      if (!objects) {
        return res.status(404).json({ error: 'Market objects not found' });
      }
      res.json(objects);
    } catch (error) {
      next(error);
    }
  },

  async bootstrapSuiMarket(req: Request, res: Response, next: NextFunction) {
    try {
      const { digest } = suiBootstrapSchema.parse(req.body);

      const { globalChainRouter } = await import('../blockchain/chainRouter.js');
      const client = globalChainRouter.getClient('sui');

      if (!client.bootstrapMarket) {
        return res.status(501).json({ error: 'Sui bootstrap not supported by this backend' });
      }

      const result = await client.bootstrapMarket({ digest });

      res.status(201).json({ marketId: result.marketId });
    } catch (error) {
      logger.error({ error }, '[MarketsController] Failed to bootstrap Sui market');
      next(error);
    }
  },
};
