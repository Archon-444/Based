import { type Request, type Response, Router } from 'express';

import { getTradesByMarket } from '../services/trades.service.js';

export const tradesRouter = Router();

/**
 * GET /api/trades/:marketId
 * Query params: page, limit, trader, sort
 */
tradesRouter.get('/:marketId', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const sort = (req.query.sort as string) === 'asc' ? 'asc' : 'desc';
    const trader = req.query.trader as string | undefined;

    const result = await getTradesByMarket({ marketId, trader, page, limit, sort });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});
