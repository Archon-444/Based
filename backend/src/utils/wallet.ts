import { Prisma } from '@prisma/client';
import { verifyMessage } from 'viem';

import { env } from '../config/env.js';
import { prisma } from '../database/prismaClient.js';

const SIGNING_PREFIX = 'Based::';

interface VerifyWalletSignatureParams {
  signature: string;
  message: string;
  address: string;
  timestamp: string;
  nonce: string;
  publicKey: string;
}

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

    // EVM signature verification (EIP-191 personal_sign)
    let valid = false;
    try {
      valid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (error) {
      console.error('[wallet.ts] Signature verification failed:', error);
      return false;
    }
    if (!valid) {
      return false;
    }

    // Atomically consume the nonce. Persisted (not an in-memory Map) so replay protection survives
    // restarts and spans horizontally-scaled instances; a unique-constraint violation on
    // (address, nonce) means the nonce was already used → replay.
    try {
      await prisma.usedNonce.create({
        data: {
          address,
          nonce,
          expiresAt: new Date(timestamp + env.SIGNATURE_TTL_MS),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        console.warn('[wallet.ts] Nonce replay detected:', `${address}:${nonce}`);
        return false;
      }
      throw error;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Delete expired used-nonce rows. Housekeeping only — a replayed request with an expired timestamp
 * is already rejected by the age check above; this just bounds table growth. Run periodically.
 */
export const cleanupExpiredNonces = async (): Promise<number> => {
  const result = await prisma.usedNonce.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
};
