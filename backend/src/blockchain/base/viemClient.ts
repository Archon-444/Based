/**
 * Viem Client Singleton for Base Chain
 *
 * Provides public client (HTTP), WebSocket client (event subscriptions),
 * and three wallet clients (admin, keeper, resolver) with role separation.
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

/**
 * Admin wallet — createMarket, registerMarket, grantRole
 */
export function getAdminWallet(): WalletClient {
  if (!_adminWallet) {
    if (!env.ADMIN_PRIVATE_KEY) {
      throw new Error('ADMIN_PRIVATE_KEY is required for admin wallet');
    }
    const account = privateKeyToAccount(env.ADMIN_PRIVATE_KEY as `0x${string}`);
    _adminWallet = createWalletClient({
      account,
      chain: getChain(),
      transport: http(env.BASE_RPC_URL),
    });
    logger.info({ address: account.address }, '[ViemClient] Admin wallet initialized');
  }
  return _adminWallet;
}

/**
 * Keeper wallet — beginResolution, settleAssertion
 */
export function getKeeperWallet(): WalletClient {
  if (!_keeperWallet) {
    if (!env.KEEPER_PRIVATE_KEY) {
      throw new Error('KEEPER_PRIVATE_KEY is required for keeper wallet');
    }
    const account = privateKeyToAccount(env.KEEPER_PRIVATE_KEY as `0x${string}`);
    _keeperWallet = createWalletClient({
      account,
      chain: getChain(),
      transport: http(env.BASE_RPC_URL),
    });
    logger.info({ address: account.address }, '[ViemClient] Keeper wallet initialized');
  }
  return _keeperWallet;
}

/**
 * Resolver wallet — reportPayoutsFor, Pyth resolve
 */
export function getResolverWallet(): WalletClient {
  if (!_resolverWallet) {
    if (!env.RESOLVER_PRIVATE_KEY) {
      throw new Error('RESOLVER_PRIVATE_KEY is required for resolver wallet');
    }
    const account = privateKeyToAccount(env.RESOLVER_PRIVATE_KEY as `0x${string}`);
    _resolverWallet = createWalletClient({
      account,
      chain: getChain(),
      transport: http(env.BASE_RPC_URL),
    });
    logger.info({ address: account.address }, '[ViemClient] Resolver wallet initialized');
  }
  return _resolverWallet;
}
