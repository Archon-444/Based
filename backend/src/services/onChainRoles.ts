/**
 * On-chain role verification (B-M1)
 *
 * Backend authorization was governed purely by a mutable `User.roles` DB column that was
 * decoupled from the MarketFactory AccessControl contract. This verifies a canonical backend
 * role against the factory's on-chain `hasRole`, so a rogue/compromised DB write can't by
 * itself escalate privilege for roles that have an on-chain source of truth.
 *
 * Behaviour is fail-safe for environments without RPC/factory configured: verify() returns
 * `null` when it cannot check (no mapping, no RPC, no factory, or an RPC error), and the caller
 * falls back to the DB decision. It only returns `false` when the chain authoritatively says the
 * address does NOT hold the role.
 */

import { keccak256, toBytes } from 'viem';

import { marketFactoryAbi } from '../blockchain/base/abis/index.js';
import { getPublicClient } from '../blockchain/base/viemClient.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { canonicalizeRole } from '../utils/roleNormalization.js';

// DEFAULT_ADMIN_ROLE is bytes32(0); the others are keccak256 of the role name (OZ AccessControl).
const ZERO_ROLE = `0x${'0'.repeat(64)}` as `0x${string}`;

const CANONICAL_TO_ONCHAIN: Record<string, `0x${string}`> = {
  ROLE_ADMIN: ZERO_ROLE,
  ROLE_MARKET_CREATOR: keccak256(toBytes('MARKET_CREATOR_ROLE')),
  ROLE_RESOLVER: keccak256(toBytes('RESOLVER_ROLE')),
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: boolean; expires: number }>();

/**
 * @returns `true`/`false` when the chain can authoritatively answer, or `null` when the role has
 *          no on-chain equivalent or verification is not possible (fall back to the DB decision).
 */
export async function verifyOnChainRole(address: string, role: string): Promise<boolean | null> {
  const canonical = canonicalizeRole(role);
  if (!canonical) return null;

  const onChainRole = CANONICAL_TO_ONCHAIN[canonical];
  if (!onChainRole) return null; // e.g. ROLE_PAUSER / ROLE_ORACLE_MANAGER — no factory role

  if (!env.BASE_RPC_URL || !env.MARKET_FACTORY_ADDRESS) return null;

  const key = `${onChainRole}:${address.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  try {
    const value = (await getPublicClient().readContract({
      address: env.MARKET_FACTORY_ADDRESS as `0x${string}`,
      abi: marketFactoryAbi,
      functionName: 'hasRole',
      args: [onChainRole, address as `0x${string}`],
    })) as boolean;

    cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
    return value;
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : String(error), address, role },
      '[onChainRoles] hasRole check failed — falling back to DB roles'
    );
    return null;
  }
}
