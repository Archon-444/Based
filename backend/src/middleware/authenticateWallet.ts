import { NextFunction, Request, Response } from 'express';

import { verifyWalletSignature } from '../utils/wallet.js';

type SupportedChain = 'aptos' | 'sui' | 'movement' | 'base';

export interface WalletContext {
  address: string;
  chain?: SupportedChain;
}

declare global {
  namespace Express {
    interface Request {
      wallet: WalletContext;
    }
  }
}

const normalizeChain = (value?: string | null): SupportedChain | undefined => {
  if (!value) return 'base';
  const normalized = value.toLowerCase();
  if (normalized === 'base' || normalized === 'movement') {
    return normalized;
  }
  return 'base';
};

export const authenticateWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chainHeader = normalizeChain(req.header('x-active-chain'));

    // Check for dev-wallet bypass (only in development)
    const devWallet = req.header('x-dev-wallet-address');
    if (devWallet && process.env.NODE_ENV !== 'production') {
      req.wallet = { address: devWallet, chain: chainHeader };
      return next();
    }

    const signature = req.header('x-wallet-signature');
    const message = req.header('x-wallet-message');
    const address = req.header('x-wallet-address');
    const timestamp = req.header('x-wallet-timestamp');
    const nonce = req.header('x-wallet-nonce');
    const publicKey = req.header('x-wallet-public-key');

    if (!signature || !message || !address || !timestamp || !nonce || !publicKey) {
      return res.status(401).json({ error: 'Missing wallet authentication headers' });
    }

    // Validate timestamp (reject if older than 5 minutes)
    const messageTimestamp = parseInt(timestamp, 10);
    const currentTimestamp = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (Number.isNaN(messageTimestamp) || currentTimestamp - messageTimestamp > FIVE_MINUTES) {
      return res.status(401).json({ error: 'Request timestamp expired or invalid' });
    }

    // Validate future timestamps (prevent clock skew attacks)
    if (messageTimestamp > currentTimestamp + 60000) {
      return res.status(401).json({ error: 'Request timestamp is in the future' });
    }

    const isValid = await verifyWalletSignature({
      signature,
      message,
      address,
      timestamp,
      nonce,
      publicKey,
    });
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }

    req.wallet = { address, chain: chainHeader };
    next();
  } catch (error) {
    next(error);
  }
};
