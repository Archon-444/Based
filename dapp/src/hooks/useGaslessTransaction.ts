/**
 * Gasless Transaction Hook
 *
 * Uses wagmi's useSendCalls with Coinbase CDP Paymaster for gasless transactions.
 * Falls back to regular writeContractAsync for wallets that don't support EIP-5792.
 *
 * How it works:
 * - Coinbase Smart Wallet supports EIP-5792 wallet_sendCalls with paymasterService
 * - When cdpPaymasterUrl is configured and the wallet supports it, transactions are gasless
 * - For MetaMask/other wallets, falls back to normal (user pays gas)
 *
 * Safety:
 * - Optional `erc20Approval` ensures the spender has an exact-amount allowance before the
 *   call runs — batched atomically into the same EIP-5792 bundle for smart wallets, or sent
 *   as a preceding transaction for EOAs. No unlimited (MaxUint256) approvals.
 * - When `waitForReceipt` is set, the promise only resolves after the transaction is mined
 *   successfully and REJECTS on revert, so callers never report success for a failed tx.
 */

import { useCallback, useState } from 'react';
import { useSendCalls } from 'wagmi';
import { useAccount, useWriteContract } from 'wagmi';
import { readContract, waitForCallsStatus, waitForTransactionReceipt } from 'wagmi/actions';
import { type Abi, encodeFunctionData, erc20Abi } from 'viem';
import { env } from '../config/env';
import { config } from '../config/wagmi';

interface Erc20Approval {
  token: `0x${string}`;
  spender: `0x${string}`;
  amount: bigint;
}

interface GaslessWriteParams {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
  /** Ensure `spender` can pull exactly `amount` of `token` before the call executes. */
  erc20Approval?: Erc20Approval;
  /** Block until the tx is mined; reject on revert. Defaults to true. */
  waitForReceipt?: boolean;
}

interface GaslessResult {
  writeGasless: (params: GaslessWriteParams) => Promise<string>;
  isGaslessSupported: boolean;
  isPending: boolean;
}

export function useGaslessTransaction(): GaslessResult {
  const { connector, address } = useAccount();
  const { sendCallsAsync } = useSendCalls();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);

  // Coinbase Smart Wallet supports EIP-5792 capabilities
  const isCoinbaseSmartWallet = connector?.id === 'coinbaseWalletSDK';
  const hasPaymasterUrl = !!env.cdpPaymasterUrl;
  const isGaslessSupported = isCoinbaseSmartWallet && hasPaymasterUrl;

  const writeGasless = useCallback(async (params: GaslessWriteParams): Promise<string> => {
    setIsPending(true);

    const shouldWait = params.waitForReceipt ?? true;

    try {
      // Determine whether an approval is required (allowance below the exact amount needed).
      let approvalNeeded = false;
      if (params.erc20Approval && address) {
        const current = (await readContract(config, {
          address: params.erc20Approval.token,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, params.erc20Approval.spender],
        } as any)) as bigint;
        approvalNeeded = current < params.erc20Approval.amount;
      }

      if (isGaslessSupported) {
        // Batch [approve?, main] atomically into one EIP-5792 bundle.
        const calls: { to: `0x${string}`; data: `0x${string}`; value: bigint }[] = [];

        if (approvalNeeded && params.erc20Approval) {
          calls.push({
            to: params.erc20Approval.token,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [params.erc20Approval.spender, params.erc20Approval.amount],
            }),
            value: 0n,
          });
        }

        calls.push({
          to: params.address,
          data: encodeFunctionData({
            abi: params.abi,
            functionName: params.functionName,
            args: params.args as any,
          }),
          value: params.value ?? 0n,
        });

        const result = await sendCallsAsync({
          calls,
          capabilities: {
            paymasterService: { url: env.cdpPaymasterUrl },
          },
        } as any);

        // sendCallsAsync returns { id: string } — the call bundle ID.
        const id = typeof result === 'string' ? result : (result as any).id ?? String(result);

        if (shouldWait) {
          // Reject unless the whole bundle confirms; surface the settled tx hash.
          const settled = await waitForCallsStatus(config, { id });
          if (settled.status !== 'success') {
            throw new Error('Transaction bundle failed on-chain');
          }
          const txHash = settled.receipts?.[settled.receipts.length - 1]?.transactionHash;
          return txHash ?? id;
        }
        return id;
      }

      // Fallback: EOA path (user pays gas). Approve first if needed, then the main call.
      if (approvalNeeded && params.erc20Approval) {
        const approveHash = await writeContractAsync({
          address: params.erc20Approval.token,
          abi: erc20Abi,
          functionName: 'approve',
          args: [params.erc20Approval.spender, params.erc20Approval.amount],
        } as any);
        await waitForTransactionReceipt(config, { hash: approveHash });
      }

      const hash = await writeContractAsync({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args as any,
        value: params.value,
      } as any);

      if (shouldWait) {
        const receipt = await waitForTransactionReceipt(config, { hash });
        if (receipt.status === 'reverted') {
          throw new Error('Transaction reverted on-chain');
        }
      }

      return hash;
    } finally {
      setIsPending(false);
    }
  }, [isGaslessSupported, sendCallsAsync, writeContractAsync, address]);

  return { writeGasless, isGaslessSupported, isPending };
}
