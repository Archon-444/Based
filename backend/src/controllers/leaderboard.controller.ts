import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { leaderboardService } from '../services/leaderboard.service.js';

const querySchema = z.object({
  metric: z.enum(['profit', 'volume']).default('profit'),
  period: z.enum(['daily', 'weekly', 'monthly', 'all_time']).default('weekly'),
  chain: z.enum(['aptos', 'sui', 'movement', 'base', 'all']).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const paramsSchema = z.object({
  address: z.string(),
});

export const leaderboardController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = querySchema.parse(req.query);
      const data = await leaderboardService.getLeaderboard(query);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getUserSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = paramsSchema.parse(req.params);
      const summary = await leaderboardService.getUserSummary(address);
      if (!summary) {
        return res.status(404).json({ error: 'User not found in leaderboard' });
      }
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },
};
