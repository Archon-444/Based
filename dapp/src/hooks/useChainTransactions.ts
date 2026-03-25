/**
 * Chain transaction hooks for Base (EVM)
 *
 * Uses useGaslessTransaction for Coinbase Smart Wallet (paymaster-sponsored),
 * with automatic fallback to regular writeContract for other wallets.
 */

import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { PredictionMarketAMMABI, ConditionalTokensABI } from '../config/contracts';
import { useGaslessTransaction } from './useGaslessTransaction';
import { useContracts } from './useContracts';

interface ChainTransactionResult {
  hash: string;
  success: boolean;
}

// ---------- Buy Outcome ----------

export const useChainPlaceBet = () => {
  const { address } = useAccount();
  const { writeGasless } = useGaslessTransaction();
  const contracts = useContracts();

  return useCallback(async (
    marketId: string,
    outcomeIndex: number,
    usdcAmount: number,
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!contracts.amm) throw new Error('AMM address not configured');

    const amount = parseUnits(usdcAmount.toString(), 6);
    const minTokensOut = 0n;

    const hash = await writeGasless({
      address: contracts.amm,
      abi: PredictionMarketAMMABI as any,
      functionName: 'buy',
      args: [marketId as `0x${string}`, BigInt(outcomeIndex), amount, minTokensOut],
    });

    return { hash, success: true };
  }, [address, writeGasless, contracts]);
};

// ---------- Sell Outcome ----------

export const useChainSellPosition = () => {
  const { address } = useAccount();
  const { writeGasless } = useGaslessTransaction();
  const contracts = useContracts();

  return useCallback(async (
    marketId: string,
    outcomeIndex: number,
    tokenAmount: bigint,
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!contracts.amm) throw new Error('AMM address not configured');

    const minUsdcOut = 0n;

    const hash = await writeGasless({
      address: contracts.amm,
      abi: PredictionMarketAMMABI as any,
      functionName: 'sell',
      args: [marketId as `0x${string}`, BigInt(outcomeIndex), tokenAmount, minUsdcOut],
    });

    return { hash, success: true };
  }, [address, writeGasless, contracts]);
};

// ---------- Redeem Positions ----------

export const useChainClaimWinnings = () => {
  const { address } = useAccount();
  const { writeGasless } = useGaslessTransaction();
  const contracts = useContracts();

  return useCallback(async (
    conditionId: string,
    indexSets: bigint[],
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!contracts.conditionalTokens) throw new Error('ConditionalTokens address not configured');

    const parentCollectionId = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

    const hash = await writeGasless({
      address: contracts.conditionalTokens,
      abi: ConditionalTokensABI as any,
      functionName: 'redeemPositions',
      args: [contracts.usdc, parentCollectionId, conditionId as `0x${string}`, indexSets],
    });

    return { hash, success: true };
  }, [address, writeGasless, contracts]);
};

// ---------- Add Liquidity ----------

export const useChainAddLiquidity = () => {
  const { address } = useAccount();
  const { writeGasless } = useGaslessTransaction();
  const contracts = useContracts();

  return useCallback(async (
    marketId: string,
    usdcAmount: number,
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!contracts.amm) throw new Error('AMM address not configured');

    const amount = parseUnits(usdcAmount.toString(), 6);

    const hash = await writeGasless({
      address: contracts.amm,
      abi: PredictionMarketAMMABI as any,
      functionName: 'addLiquidity',
      args: [marketId as `0x${string}`, amount],
    });

    return { hash, success: true };
  }, [address, writeGasless, contracts]);
};

// ---------- Remove Liquidity ----------

export const useChainRemoveLiquidity = () => {
  const { address } = useAccount();
  const { writeGasless } = useGaslessTransaction();
  const contracts = useContracts();

  return useCallback(async (
    marketId: string,
    shares: bigint,
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!contracts.amm) throw new Error('AMM address not configured');

    const hash = await writeGasless({
      address: contracts.amm,
      abi: PredictionMarketAMMABI as any,
      functionName: 'removeLiquidity',
      args: [marketId as `0x${string}`, shares],
    });

    return { hash, success: true };
  }, [address, writeGasless, contracts]);
};
