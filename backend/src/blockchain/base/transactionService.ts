/**
 * Transaction Service for Base Chain
 *
 * Handles nonce management, gas estimation, and retry logic for on-chain transactions.
 * Uses async-mutex to prevent nonce collisions from concurrent transactions.
 */

import { Mutex } from 'async-mutex';
import {
  type Abi,
  type Address,
  encodeFunctionData,
  type Hex,
  type PublicClient,
  type TransactionReceipt,
  type WalletClient,
} from 'viem';

import { logger } from '../../config/logger.js';
import { recordBaseTransaction } from '../../monitoring/metrics.js';

// ---------- Nonce Manager ----------

class NonceManager {
  private nonces = new Map<string, number>();
  private mutexes = new Map<string, Mutex>();

  async acquireNonce(address: string, publicClient: PublicClient): Promise<number> {
    let mutex = this.mutexes.get(address);
    if (!mutex) {
      mutex = new Mutex();
      this.mutexes.set(address, mutex);
    }

    const release = await mutex.acquire();
    try {
      let nonce = this.nonces.get(address);
      if (nonce === undefined) {
        nonce = await publicClient.getTransactionCount({ address: address as Address });
      }
      this.nonces.set(address, nonce + 1);
      return nonce;
    } finally {
      release();
    }
  }

  resetNonce(address: string): void {
    this.nonces.delete(address);
  }
}

const nonceManager = new NonceManager();

// ---------- Error Helpers ----------

function isNonceError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('nonce') || msg.includes('replacement transaction underpriced');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Send Transaction ----------

export interface SendTransactionParams {
  walletClient: WalletClient;
  publicClient: PublicClient;
  to: Address;
  data: Hex;
  value?: bigint;
  maxRetries?: number;
  walletLabel?: string;
  methodLabel?: string;
}

export async function sendTransaction(params: SendTransactionParams): Promise<TransactionReceipt> {
  const {
    walletClient,
    publicClient,
    to,
    data,
    value = 0n,
    maxRetries = 3,
    walletLabel = 'unknown',
    methodLabel = 'unknown',
  } = params;

  const address = walletClient.account!.address;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const nonce = await nonceManager.acquireNonce(address, publicClient);

      const gasEstimate = await publicClient.estimateGas({
        account: address,
        to,
        data,
        value,
      });
      const gasLimit = gasEstimate + (gasEstimate * 20n) / 100n; // 20% buffer

      const hash = await walletClient.sendTransaction({
        account: walletClient.account!,
        to,
        data,
        value,
        gas: gasLimit,
        nonce,
        chain: walletClient.chain,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });

      if (receipt.status === 'reverted') {
        recordBaseTransaction(walletLabel, methodLabel, 'reverted');
        throw new Error(`Transaction reverted: ${hash}`);
      }

      logger.info(
        { hash, gasUsed: receipt.gasUsed.toString(), wallet: walletLabel, method: methodLabel },
        '[TxService] Transaction confirmed'
      );

      recordBaseTransaction(walletLabel, methodLabel, 'success');
      return receipt;
    } catch (error) {
      if (isNonceError(error)) {
        nonceManager.resetNonce(address);
      }

      if (attempt === maxRetries) {
        recordBaseTransaction(walletLabel, methodLabel, 'failure');
        logger.error(
          {
            error: error instanceof Error ? error.message : String(error),
            attempt,
            wallet: walletLabel,
          },
          '[TxService] Transaction failed after all retries'
        );
        throw error;
      }

      const delay = 1000 * Math.pow(2, attempt);
      logger.warn(
        { attempt, delay, error: error instanceof Error ? error.message : String(error) },
        '[TxService] Retrying transaction'
      );
      await sleep(delay);
    }
  }

  // Unreachable, but satisfies TypeScript
  throw new Error('sendTransaction: unreachable');
}

// ---------- Helper: Encode Function Call ----------

export function encodeCall<TAbi extends Abi>(
  abi: TAbi,
  functionName: string,
  args: unknown[]
): Hex {
  return encodeFunctionData({
    abi,
    functionName,
    args,
  } as Parameters<typeof encodeFunctionData>[0]);
}
