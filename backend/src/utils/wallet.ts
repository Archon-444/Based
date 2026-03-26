import { verifyMessage } from 'viem';

import { env } from '../config/env.js';

const SIGNING_PREFIX = 'Based::';
const seenNonces = new Map<string, number>();
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

interface VerifyWalletSignatureParams {
  signature: string;
  message: string;
  address: string;
  timestamp: string;
  nonce: string;
  publicKey: string;
}

const cleanupExpiredNonces = () => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }
  for (const [key, timestamp] of seenNonces.entries()) {
    if (now - timestamp > env.SIGNATURE_TTL_MS) {
      seenNonces.delete(key);
    }
  }
  lastCleanup = now;
};

export const verifyWalletSignature = async ({
  signature,
  message,
  address,
  timestamp: timestampHeader,
  nonce,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publicKey,
}: VerifyWalletSignatureParams) => {
  try {
    if (!signature || !message || !address || !timestampHeader || !nonce) {
      return false;
    }

    // Verify the message structure matches expected format
    const expectedMessage = `${SIGNING_PREFIX}${nonce}::${timestampHeader}`;
    if (message !== expectedMessage) {
      return false;
    }

    // Validate timestamp
    const timestamp = Number(timestampHeader);
    if (!Number.isFinite(timestamp)) {
      return false;
    }

    const age = Date.now() - timestamp;
    if (age < 0 || age > env.SIGNATURE_TTL_MS) {
      return false;
    }

    // Check for nonce replay
    cleanupExpiredNonces();
    const cacheKey = `${address}:${nonce}`;
    if (seenNonces.has(cacheKey)) {
      console.warn('[wallet.ts] Nonce replay detected:', cacheKey);
      return false;
    }

    // EVM signature verification (EIP-191 personal_sign)
    try {
      const valid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!valid) {
        return false;
      }
    } catch (error) {
      console.error('[wallet.ts] Signature verification failed:', error);
      return false;
    }

    seenNonces.set(cacheKey, Date.now());
    return true;
  } catch (error) {
    return false;
  }
};
