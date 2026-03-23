import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { rolesService } from '../services/roles.service.js';

const grantRoleSchema = z.object({
  walletAddress: z.string().min(2),
  role: z.string().min(2),
  transactionHash: z.string().optional(),
  chain: z.enum(['aptos', 'sui', 'movement', 'base']).default('base'),
});

const syncRolesSchema = z.object({
  walletAddress: z.string().min(2),
  chain: z.enum(['aptos', 'sui', 'movement', 'base']).default('base'),
});

const addressParamSchema = z.object({ address: z.string().min(2) });

export const rolesController = {
  async getUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = addressParamSchema.parse(req.params);
      const roles = await rolesService.getUserRoles(address);
      res.json(roles);
    } catch (error) {
      next(error);
    }
  },

  async grantRole(req: Request, res: Response, next: NextFunction) {
    try {
      const input = grantRoleSchema.parse(req.body);
      const result = await rolesService.grantRole({
        ...input,
        actor: req.wallet.address,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async revokeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const input = grantRoleSchema.parse(req.body);
      const result = await rolesService.revokeRole({
        ...input,
        actor: req.wallet.address,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async syncRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = req.wallet.address;
      const input = syncRolesSchema.parse(req.body);

      if (actor !== input.walletAddress) {
        const actorRoles = await rolesService.getUserRoles(actor);
        const isAdmin = actorRoles.roles.some(
          (role) => role === 'ROLE_ADMIN' || role === 'DaoAdmin'
        );
        if (!isAdmin) {
          return res.status(403).json({
            error: 'Only admins can sync roles for other wallets',
          });
        }
      }

      const result = await rolesService.syncRoles({
        walletAddress: input.walletAddress,
        chain: input.chain,
        actor,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
