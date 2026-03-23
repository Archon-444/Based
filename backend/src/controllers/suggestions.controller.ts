import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { suggestionService } from '../services/suggestions.service.js';

const createSuggestionSchema = z.object({
  question: z.string().min(10),
  category: z.string().optional(),
  outcomes: z.array(z.string()).min(2),
  durationHours: z.number().int().positive().max(8760),
  resolutionSource: z.string().optional(),
  chain: z.enum(['aptos', 'sui', 'movement', 'base']).default('base'),
});

const listSuggestionsSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'published']).optional(),
  chain: z.enum(['aptos', 'sui', 'movement', 'base']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

const voteSchema = z.object({
  delta: z.number().int().min(-1).max(1),
});

const approveBodySchema = z.object({
  publishOnChain: z.boolean().optional(),
  txHash: z.string().optional(),
});
const rejectBodySchema = z.object({ reason: z.string().optional() });

const suggestionController = {
  async createSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createSuggestionSchema.parse(req.body);
      const suggestion = await suggestionService.createSuggestion({
        ...payload,
        proposer: req.wallet.address,
      });
      res.status(201).json(suggestion);
    } catch (error) {
      next(error);
    }
  },

  async listSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listSuggestionsSchema.parse(req.query);
      const suggestions = await suggestionService.listSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  },

  async approveSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const body = approveBodySchema.parse(req.body ?? {});
      const result = await suggestionService.approveSuggestion({
        id,
        reviewer: req.wallet.address,
        publishOnChain: Boolean(body.publishOnChain),
        reviewerChain: req.wallet.chain,
        txHash: body.txHash,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async rejectSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { reason } = rejectBodySchema.parse(req.body ?? {});
      const result = await suggestionService.rejectSuggestion({
        id,
        reviewer: req.wallet.address,
        reason,
        reviewerChain: req.wallet.chain,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async upvoteSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { delta } = voteSchema.parse(req.body);
      const result = await suggestionService.voteOnSuggestion({
        id,
        voter: req.wallet.address,
        delta,
        voterChain: req.wallet.chain,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async listEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const events = await suggestionService.listEvents(id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  },

  async publishSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const result = await suggestionService.publishSuggestion({
        id,
        publisher: req.wallet.address,
        publisherChain: req.wallet.chain,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export { suggestionController };
