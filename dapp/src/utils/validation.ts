// Validation utilities for Based

/**
 * Validates an Aptos address format
 * Aptos addresses are 64 character hex strings (32 bytes) with optional 0x prefix
 * or can be shortened versions that are padded with zeros
 */
export function isValidAptosAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') || address.startsWith('0X')
    ? address.slice(2)
    : address;

  // Check if it's a valid hex string
  if (!/^[0-9a-fA-F]+$/.test(cleanAddress)) {
    return false;
  }

  // Aptos addresses can be 1-64 characters (will be left-padded with zeros)
  // Standard format is 64 characters (32 bytes)
  if (cleanAddress.length < 1 || cleanAddress.length > 64) {
    return false;
  }

  return true;
}

/**
 * Validates a Sui address format
 * Sui addresses are hex strings up to 64 characters with optional 0x prefix
 */
export function isValidSuiAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const cleanAddress = address.startsWith('0x') || address.startsWith('0X')
    ? address.slice(2)
    : address;

  if (!/^[0-9a-fA-F]+$/.test(cleanAddress)) {
    return false;
  }

  return cleanAddress.length >= 1 && cleanAddress.length <= 64;
}

/**
 * Validates and normalizes an Aptos address to full 64-character format
 */
export function normalizeAptosAddress(address: string): string {
  if (!isValidAptosAddress(address)) {
    throw new Error('Invalid Aptos address format');
  }

  const cleanAddress = address.startsWith('0x') || address.startsWith('0X')
    ? address.slice(2)
    : address;

  // Pad with zeros to make it 64 characters
  return '0x' + cleanAddress.toLowerCase().padStart(64, '0');
}

/**
 * Constants for validation
 */
export const VALIDATION_CONSTANTS = {
  // USDC has 6 decimals
  USDC_DECIMALS: 6,
  MICRO_USDC_MULTIPLIER: 1_000_000,

  // Minimum bet: 1 USDC = 1,000,000 micro-USDC
  MIN_BET_USDC: 1,
  MIN_BET_MICRO_USDC: 1_000_000,

  // Maximum bet: 1,000,000 USDC to prevent market manipulation
  MAX_BET_USDC: 1_000_000,
  MAX_BET_MICRO_USDC: 1_000_000_000_000,

  // Maximum safe integer in JavaScript (2^53 - 1)
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,

  // Market ID limits
  MIN_MARKET_ID: 0,
  MAX_MARKET_ID: 999_999, // Reasonable upper limit

  // Outcome ID limits
  MIN_OUTCOME_ID: 0,
  MAX_OUTCOME_ID: 100, // Most markets won't have more than 100 outcomes
} as const;

/**
 * Validates a market ID
 */
export function validateMarketId(marketId: number): void {
  if (!Number.isInteger(marketId)) {
    throw new Error('Market ID must be an integer');
  }

  if (marketId < VALIDATION_CONSTANTS.MIN_MARKET_ID) {
    throw new Error(`Market ID must be >= ${VALIDATION_CONSTANTS.MIN_MARKET_ID}`);
  }

  if (marketId > VALIDATION_CONSTANTS.MAX_MARKET_ID) {
    throw new Error(`Market ID must be <= ${VALIDATION_CONSTANTS.MAX_MARKET_ID}`);
  }
}

/**
 * Validates an outcome ID
 */
export function validateOutcomeId(outcomeId: number): void {
  if (!Number.isInteger(outcomeId)) {
    throw new Error('Outcome ID must be an integer');
  }

  if (outcomeId < VALIDATION_CONSTANTS.MIN_OUTCOME_ID) {
    throw new Error(`Outcome ID must be >= ${VALIDATION_CONSTANTS.MIN_OUTCOME_ID}`);
  }

  if (outcomeId > VALIDATION_CONSTANTS.MAX_OUTCOME_ID) {
    throw new Error(`Outcome ID must be <= ${VALIDATION_CONSTANTS.MAX_OUTCOME_ID}`);
  }
}

/**
 * Validates a USDC amount (in USDC, not micro-USDC)
 */
export function validateUSDCAmount(amount: number): void {
  if (typeof amount !== 'number' || !isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }

  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (amount < VALIDATION_CONSTANTS.MIN_BET_USDC) {
    throw new Error(`Minimum bet is ${VALIDATION_CONSTANTS.MIN_BET_USDC} USDC`);
  }

  if (amount > VALIDATION_CONSTANTS.MAX_BET_USDC) {
    throw new Error(`Maximum bet is ${VALIDATION_CONSTANTS.MAX_BET_USDC} USDC`);
  }
}

/**
 * Safely converts USDC to micro-USDC with overflow protection
 */
export function toMicroUSDC(usdc: number): number {
  validateUSDCAmount(usdc);

  // Use precise multiplication to avoid floating point errors
  const microUsdc = Math.floor(usdc * VALIDATION_CONSTANTS.MICRO_USDC_MULTIPLIER);

  // Check for overflow
  if (microUsdc > VALIDATION_CONSTANTS.MAX_SAFE_INTEGER) {
    throw new Error('Amount too large: would cause integer overflow');
  }

  if (microUsdc < VALIDATION_CONSTANTS.MIN_BET_MICRO_USDC) {
    throw new Error(`Amount too small: minimum is ${VALIDATION_CONSTANTS.MIN_BET_USDC} USDC`);
  }

  if (microUsdc > VALIDATION_CONSTANTS.MAX_BET_MICRO_USDC) {
    throw new Error(`Amount too large: maximum is ${VALIDATION_CONSTANTS.MAX_BET_USDC} USDC`);
  }

  return microUsdc;
}

/**
 * Safely converts micro-USDC to USDC
 */
export function fromMicroUSDC(microUsdc: number): number {
  if (!Number.isInteger(microUsdc) || microUsdc < 0) {
    throw new Error('Micro-USDC amount must be a non-negative integer');
  }

  return microUsdc / VALIDATION_CONSTANTS.MICRO_USDC_MULTIPLIER;
}

/**
 * Validates that a market hasn't expired
 */
export function validateMarketNotExpired(resolutionTime: number): void {
  const now = Date.now();

  if (resolutionTime <= now) {
    throw new Error('Market has already expired');
  }
}

/**
 * Sanitizes user input by removing potentially harmful characters
 * and limiting length
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Rate limiter utility
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindowMs: number;

  constructor(maxRequests: number, timeWindowMs: number) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
  }

  /**
   * Check if an action is allowed based on rate limit
   * Returns true if allowed, false if rate limited
   */
  checkLimit(): boolean {
    const now = Date.now();

    // Remove timestamps outside the time window
    this.timestamps = this.timestamps.filter(
      timestamp => now - timestamp < this.timeWindowMs
    );

    // Check if we're under the limit
    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get time until next request is allowed (in milliseconds)
   */
  getTimeUntilNextRequest(): number {
    if (this.timestamps.length < this.maxRequests) {
      return 0;
    }

    const oldestTimestamp = this.timestamps[0];
    const timeUntilExpiry = this.timeWindowMs - (Date.now() - oldestTimestamp);

    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.timestamps = [];
  }
}
