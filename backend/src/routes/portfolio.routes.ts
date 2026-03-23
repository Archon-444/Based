import { type Request, type Response, Router } from 'express';

import { getPortfolio } from '../services/portfolio.service.js';

export const portfolioRouter = Router();

/**
 * GET /api/portfolio/:address
 */
portfolioRouter.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const result = await getPortfolio(address);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});
