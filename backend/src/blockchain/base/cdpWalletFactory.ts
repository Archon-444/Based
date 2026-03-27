/**
 * CDP Wallet Provider Factory
 *
 * Creates viem WalletClients backed by Coinbase Developer Platform server wallets.
 * Falls back to raw private keys when CDP credentials are not configured.
 *
 * CDP Server Wallets are managed, recoverable, and auditable — solving the
 * operational risk of raw private keys stored in .env.
 */

import {
  type Chain,
  createWalletClient,
  http,
  type WalletClient,
} from 'viem';
import { toAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

type WalletRole = 'admin' | 'keeper' | 'resolver';

function getChain(): Chain {
  return env.BASE_CHAIN_ID === '84532' ? baseSepolia : base;
}

/**
 * Returns true if CDP credentials are fully configured.
 */
export function isCdpConfigured(): boolean {
  return !!(env.CDP_API_KEY_ID && env.CDP_API_KEY_SECRET && env.CDP_WALLET_SECRET);
}

/**
 * Create a viem WalletClient from a CDP Server Wallet.
 *
 * Uses `getOrCreateAccount` with a deterministic name per role,
 * so it's idempotent — same role always returns the same wallet.
 */
export async function createCdpWalletClient(role: WalletRole): Promise<WalletClient> {
  // Dynamic import — only loads CDP SDK when actually needed
  const { CdpClient } = await import('@coinbase/cdp-sdk');

  const cdp = new CdpClient({
    apiKeyId: env.CDP_API_KEY_ID,
    apiKeySecret: env.CDP_API_KEY_SECRET,
    walletSecret: env.CDP_WALLET_SECRET,
  });

  const accountName = `based-${role}`;
  const serverAccount = await cdp.evm.getOrCreateAccount({ name: accountName });

  // Bridge CDP account into viem's account interface
  const viemAccount = toAccount({
    address: serverAccount.address as `0x${string}`,
    signMessage: async ({ message }) => {
      // viem message is string | { raw: Hex | ByteArray } — CDP accepts the same via SignableMessage
      return serverAccount.signMessage({ message: message as string }) as Promise<`0x${string}`>;
    },
    signTransaction: async (tx) => {
      return serverAccount.signTransaction(tx) as Promise<`0x${string}`>;
    },
    signTypedData: async (typedData) => {
      return serverAccount.signTypedData(typedData as any) as Promise<`0x${string}`>;
    },
  });

  const client = createWalletClient({
    account: viemAccount,
    chain: getChain(),
    transport: http(env.BASE_RPC_URL),
  });

  logger.info(
    { role, address: serverAccount.address, provider: 'cdp' },
    `[WalletFactory] CDP wallet initialized for ${role}`
  );

  return client;
}
