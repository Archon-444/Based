import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';

/**
 * Key a limiter on the *authenticated* wallet (set by authenticateWallet) when present, else the
 * real client IP. Never key on the raw `x-wallet-address` header: it is unauthenticated, so an
 * attacker could rotate it to dodge their own limit or spoof a victim's to exhaust theirs.
 */
const keyByWalletOrIp =
  (prefix: string) =>
  (req: Request): string => {
    const authed = (req as Request & { wallet?: { address?: string } }).wallet?.address;
    if (authed) return `${prefix}:${authed}`;
    return req.ip || req.socket.remoteAddress || 'unknown';
  };

/**
 * Standard rate limiter for public API endpoints
 * Applies to unauthenticated requests
 */
export const publicApiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 60, // 60 requests per window (default 1 minute)
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: env.RATE_LIMIT_WINDOW_MS / 1000, // Convert to seconds
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use IP address as the key for rate limiting
  keyGenerator: (req) => {
    // In production, use X-Forwarded-For if behind a proxy
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

/**
 * Rate limiter for authenticated API endpoints
 * Higher limits for logged-in users
 */
export const authenticatedApiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX, // Default 120 requests per window
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: env.RATE_LIMIT_WINDOW_MS / 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByWalletOrIp('wallet'),
});

/**
 * Strict rate limiter for admin endpoints
 * Higher limits but still protected
 */
export const adminApiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 300, // 300 requests per window for admin operations
  message: {
    error: 'Too many admin requests, please try again later',
    retryAfter: env.RATE_LIMIT_WINDOW_MS / 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByWalletOrIp('admin'),
});

/**
 * Very strict rate limiter for sensitive operations
 * E.g., wallet authentication, role changes
 */
export const strictApiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 20, // Only 20 requests per window
  message: {
    error: 'Too many sensitive operation attempts, please try again later',
    retryAfter: env.RATE_LIMIT_WINDOW_MS / 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
});

/**
 * Rate limiter for blockchain write operations
 * Very conservative to prevent spam and protect blockchain resources
 */
export const blockchainWriteLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // Only 10 blockchain writes per minute
  message: {
    error: 'Too many blockchain transactions, please wait before submitting more',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByWalletOrIp('blockchain'),
});
