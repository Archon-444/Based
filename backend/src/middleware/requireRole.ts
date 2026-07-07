import { NextFunction, Request, Response } from 'express';

import { prisma } from '../database/prismaClient.js';
import { verifyOnChainRole } from '../services/onChainRoles.js';

export const requireRole = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const address = req.wallet?.address;
    if (!address) {
      return res.status(401).json({ error: 'Wallet not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress: address } });
    const roles = user?.roles ?? [];
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions', required: role, roles });
    }

    // Defence in depth: when the role has an on-chain source of truth and RPC is configured,
    // require the MarketFactory to agree. A `false` here means the DB says yes but the chain says
    // no (e.g. a rogue DB write) — deny. `null` means we can't verify on-chain; trust the DB.
    try {
      const onChain = await verifyOnChainRole(address, role);
      if (onChain === false) {
        return res.status(403).json({ error: 'Role not confirmed on-chain', required: role });
      }
    } catch {
      // Never let a verification failure block a legitimately-DB-authorized request.
    }

    next();
  };
};
