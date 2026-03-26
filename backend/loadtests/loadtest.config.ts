import { randomBytes } from 'node:crypto';

// TODO: Replace Aptos SDK with viem for EVM signing
import { Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const SIGNING_PREFIX = 'Based::';

type SupportedChain = 'base' | 'sui' | 'movement';

export interface WalletAuthContext {
  address: string;
  signer: Ed25519PrivateKey;
  publicKey: string;
}

export interface LoadTestConfig {
  baseUrl: string;
  activeChain: SupportedChain;
  suggestionSubmitter: WalletAuthContext;
  marketplaceAdmin: WalletAuthContext;
  connections: number;
  durationSeconds: number;
  warmupSeconds: number;
}

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeHex = (value: string, label: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Missing ${label} for load testing`);
  }
  return trimmed.startsWith('0x') ? trimmed.toLowerCase() : `0x${trimmed.toLowerCase()}`;
};

const createWalletAuthContext = (
  addressEnv: string | undefined,
  privateKeyEnv: string | undefined,
  fallbackAddress: string,
  envLabel: string,
): WalletAuthContext => {
  if (!privateKeyEnv) {
    throw new Error(`Set ${envLabel} before running load tests`);
  }

  const address = normalizeHex(
    addressEnv ?? fallbackAddress,
    `${envLabel.replace(/_PRIVATE_KEY$/, '')}_ADDRESS`,
  );
  const privateKeyHex = normalizeHex(privateKeyEnv, envLabel);
  const signer = new Ed25519PrivateKey(privateKeyHex);

  return {
    address,
    signer,
    publicKey: signer.publicKey().toString(),
  };
};

const baseUrl =
  process.env.LOADTEST_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

const activeChain = (process.env.LOADTEST_ACTIVE_CHAIN?.toLowerCase() as SupportedChain) ?? 'base';

export const loadTestConfig: LoadTestConfig = {
  baseUrl,
  activeChain,
  suggestionSubmitter: createWalletAuthContext(
    process.env.LOADTEST_SUBMITTER_ADDRESS,
    process.env.LOADTEST_SUBMITTER_PRIVATE_KEY,
    '0x1cefeedc0ffeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    'LOADTEST_SUBMITTER_PRIVATE_KEY',
  ),
  marketplaceAdmin: createWalletAuthContext(
    process.env.LOADTEST_ADMIN_ADDRESS,
    process.env.LOADTEST_ADMIN_PRIVATE_KEY ?? process.env.LOADTEST_SUBMITTER_PRIVATE_KEY,
    '0x5ca1ab1eba5eba11ba5eba11ba5eba11ba5eba11ba5eba11ba5eba11ba5e',
    'LOADTEST_ADMIN_PRIVATE_KEY',
  ),
  connections: toNumber(process.env.LOADTEST_CONNECTIONS, 50),
  durationSeconds: toNumber(process.env.LOADTEST_DURATION, 60),
  warmupSeconds: toNumber(process.env.LOADTEST_WARMUP, 10),
};

export const buildWalletSignatureHeaders = (
  wallet: WalletAuthContext,
  chain: SupportedChain,
): Record<string, string> => {
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString('hex');
  const message = `${SIGNING_PREFIX}${nonce}::${timestamp}`;
  const signature = wallet.signer.sign(message).toString();

  return {
    'x-wallet-address': wallet.address,
    'x-wallet-public-key': wallet.publicKey,
    'x-wallet-signature': signature,
    'x-wallet-message': message,
    'x-wallet-timestamp': timestamp,
    'x-wallet-nonce': nonce,
    'x-active-chain': chain,
  };
};

export const createSummary = (title: string, description: string): string => {
  return `${title}\n${'-'.repeat(title.length)}\n${description}\n`;
};
