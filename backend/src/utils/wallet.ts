import { verifyMessage } from 'viem';

import { env } from '../config/env.js';

const seenNonces = new Map<string, number>();
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

/**
 * Reconstruct the SIWE-style sign-in message. MUST stay byte-for-byte identical to the frontend's
 * buildSignInMessage (dapp/src/services/api/client.ts) — the signature is verified against it.
 */
const buildSignInMessage = (p: {
  domain: string;
  address: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
}): string =>
  [
    'Based wants you to sign in with your wallet.',
    '',
    `Domain: ${p.domain}`,
    `Address: ${p.address}`,
    `Chain ID: ${p.chainId}`,
    `Nonce: ${p.nonce}`,
    `Issued At: ${p.issuedAt}`,
  ].join('\n');

// Hosts allowed to appear in the signed Domain field. Derived from CORS_ORIGIN (which must already
// be correct for the frontend to reach the API) plus Vercel previews, so a phishing domain in the
// signed message is rejected.
const allowedDomainHosts = new Set(
  env.CORS_ORIGIN.split(',')
    .map((origin) => {
      const trimmed = origin.trim();
      if (!trimmed) return '';
      try {
        return new URL(trimmed).host;
      } catch {
        return trimmed.replace(/^https?:\/\//, '');
      }
    })
    .filter(Boolean)
);

const isDomainAllowed = (domain: string): boolean => {
  if (allowedDomainHosts.has(domain)) return true;
  return /^based[a-z0-9-]*\.vercel\.app$/.test(domain);
};

interface VerifyWalletSignatureParams {
  signature: string;
  message: string;
  address: string;
  timestamp: string;
  nonce: string;
  publicKey: string;
  domain: string;
  chainId: string;
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
  domain,
  chainId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publicKey,
}: VerifyWalletSignatureParams) => {
  try {
    if (!signature || !message || !address || !timestampHeader || !nonce || !domain || !chainId) {
      return false;
    }

    // The signed Domain must be one of ours — this is what makes a phishing-site signature
    // (which would carry that site's domain) unusable against this API.
    if (!isDomainAllowed(domain)) {
      return false;
    }

    // Reconstruct the signed message from the individual header fields and require an exact match,
    // so the signature is bound to this domain, address, chain, nonce, and timestamp.
    const expectedMessage = buildSignInMessage({
      domain,
      address,
      chainId,
      nonce,
      issuedAt: timestampHeader,
    });
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
