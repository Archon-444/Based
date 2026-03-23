import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { marketsService } from '../services/markets.service.js';

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
};
