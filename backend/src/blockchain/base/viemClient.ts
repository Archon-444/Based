/**
 * Viem Client Singleton for Base Chain
 *
 * Provides public client (HTTP), WebSocket client (event subscriptions),
 * and three wallet clients (admin, keeper, resolver) with role separation.
 *
 * Wallet initialization order:
 * 1. CDP Server Wallet (if CDP_API_KEY_ID + CDP_API_KEY_SECRET + CDP_WALLET_SECRET set)
 * 2. Raw private key fallback (ADMIN/KEEPER/RESOLVER_PRIVATE_KEY)
 */

import {
  type Chain,
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  webSocket,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { createCdpWalletClient, isCdpConfigured } from './cdpWalletFactory.js';

// ---------- Chain Selection ----------

function getChain(): Chain {
  return env.BASE_CHAIN_ID === '84532' ? baseSepolia : base;
}

// ---------- Lazy Singletons ----------

let _publicClient: PublicClient | null = null;
let _wsClient: PublicClient | null = null;
let _adminWallet: WalletClient | null = null;
let _keeperWallet: WalletClient | null = null;
let _resolverWallet: WalletClient | null = null;

// Track async CDP initialization to prevent races
let _adminWalletPromise: Promise<WalletClient> | null = null;
let _keeperWalletPromise: Promise<WalletClient> | null = null;
let _resolverWalletPromise: Promise<WalletClient> | null = null;

/**
 * HTTP public client for reads, getLogs, estimateGas, etc.
 */
export function getPublicClient(): PublicClient {
  if (!_publicClient) {
    if (!env.BASE_RPC_URL) {
      throw new Error('BASE_RPC_URL is required for Base chain');
    }
    _publicClient = createPublicClient({
      chain: getChain(),
      transport: http(env.BASE_RPC_URL),
    });
    logger.info({ chainId: getChain().id }, '[ViemClient] Public client initialized');
  }
  return _publicClient;
}

/**
 * WebSocket public client for watchContractEvent subscriptions.
 */
export function getWsClient(): PublicClient {
  if (!_wsClient) {
    if (!env.BASE_WS_URL) {
      throw new Error('BASE_WS_URL is required for Base chain WebSocket subscriptions');
    }
    _wsClient = createPublicClient({
      chain: getChain(),
      transport: webSocket(env.BASE_WS_URL),
    });
    logger.info('[ViemClient] WebSocket client initialized');
  }
  return _wsClient;
}

// ---------- Wallet Client Helpers ----------

function createRawKeyWallet(privateKey: string, role: string): WalletClient {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const wallet = createWalletClient({
    account,
    chain: getChain(),
    transport: http(env.BASE_RPC_URL),
  });
  logger.info({ address: account.address, provider: 'raw-key' }, `[ViemClient] ${role} wallet initialized`);
  return wallet;
}

async function getOrCreateWallet(
  role: 'admin' | 'keeper' | 'resolver',
  privateKeyEnv: string | undefined,
): Promise<WalletClient> {
  // Prefer CDP managed wallet
  if (isCdpConfigured()) {
    return createCdpWalletClient(role);
  }

  // Fallback: raw private key
  if (!privateKeyEnv) {
    throw new Error(
      `No wallet configured for ${role}. Set CDP credentials (CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET) or ${role.toUpperCase()}_PRIVATE_KEY.`
    );
  }
  return createRawKeyWallet(privateKeyEnv, role);
}

/**
 * Admin wallet — createMarket, registerMarket, grantRole
 */
export async function getAdminWallet(): Promise<WalletClient> {
  if (_adminWallet) return _adminWallet;
  if (!_adminWalletPromise) {
    _adminWalletPromise = getOrCreateWallet('admin', env.ADMIN_PRIVATE_KEY).then((w) => {
      _adminWallet = w;
      return w;
    });
  }
  return _adminWalletPromise;
}

/**
 * Keeper wallet — beginResolution, settleAssertion
 */
export async function getKeeperWallet(): Promise<WalletClient> {
  if (_keeperWallet) return _keeperWallet;
  if (!_keeperWalletPromise) {
    _keeperWalletPromise = getOrCreateWallet('keeper', env.KEEPER_PRIVATE_KEY).then((w) => {
      _keeperWallet = w;
      return w;
    });
  }
  return _keeperWalletPromise;
}

/**
 * Resolver wallet — reportPayoutsFor, Pyth resolve
 */
export async function getResolverWallet(): Promise<WalletClient> {
  if (_resolverWallet) return _resolverWallet;
  if (!_resolverWalletPromise) {
    _resolverWalletPromise = getOrCreateWallet('resolver', env.RESOLVER_PRIVATE_KEY).then((w) => {
      _resolverWallet = w;
      return w;
    });
  }
  return _resolverWalletPromise;
}
