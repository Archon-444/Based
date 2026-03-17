/**
 * Chain transaction hooks for Base (EVM)
 *
 * Replaces the Aptos/Sui multi-chain transaction hooks with wagmi-based
 * hooks for MarketFactory, AMM, and ConditionalTokens contracts.
 */

import { useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, PredictionMarketAMMABI, ConditionalTokensABI } from '../config/contracts';

interface ChainTransactionResult {
  hash: string;
  success: boolean;
}

// ---------- Buy Outcome ----------

export const useChainPlaceBet = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  return useCallback(async (
    marketId: string,
    outcomeIndex: number,
    usdcAmount: number,
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!CONTRACTS.amm) throw new Error('AMM address not configured');

    const amount = parseUnits(usdcAmount.toString(), 6);
    const minTokensOut = 0n; // No slippage protection for now — can be added later

    const hash = await writeContractAsync({
      address: CONTRACTS.amm,
      abi: PredictionMarketAMMABI,
      functionName: 'buy',
      args: [marketId as `0x${string}`, BigInt(outcomeIndex), amount, minTokensOut],
    } as any);

    return { hash, success: true };
  }, [address, writeContractAsync]);
};

// ---------- Sell Outcome ----------

export const useChainSellPosition = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  return useCallback(async (
    marketId: string,
    outcomeIndex: number,
    tokenAmount: bigint,
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!CONTRACTS.amm) throw new Error('AMM address not configured');

    const minUsdcOut = 0n;

    const hash = await writeContractAsync({
      address: CONTRACTS.amm,
      abi: PredictionMarketAMMABI,
      functionName: 'sell',
      args: [marketId as `0x${string}`, BigInt(outcomeIndex), tokenAmount, minUsdcOut],
    } as any);

    return { hash, success: true };
  }, [address, writeContractAsync]);
};

// ---------- Redeem Positions ----------

export const useChainClaimWinnings = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  return useCallback(async (
    conditionId: string,
    indexSets: bigint[],
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!CONTRACTS.conditionalTokens) throw new Error('ConditionalTokens address not configured');

    const parentCollectionId = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

    const hash = await writeContractAsync({
      address: CONTRACTS.conditionalTokens,
      abi: ConditionalTokensABI,
      functionName: 'redeemPositions',
      args: [CONTRACTS.usdc, parentCollectionId, conditionId as `0x${string}`, indexSets],
    } as any);

    return { hash, success: true };
  }, [address, writeContractAsync]);
};

// ---------- Add Liquidity ----------

export const useChainAddLiquidity = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  return useCallback(async (
    marketId: string,
    usdcAmount: number,
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!CONTRACTS.amm) throw new Error('AMM address not configured');

    const amount = parseUnits(usdcAmount.toString(), 6);

    const hash = await writeContractAsync({
      address: CONTRACTS.amm,
      abi: PredictionMarketAMMABI,
      functionName: 'addLiquidity',
      args: [marketId as `0x${string}`, amount],
    } as any);

    return { hash, success: true };
  }, [address, writeContractAsync]);
};

// ---------- Remove Liquidity ----------

export const useChainRemoveLiquidity = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  return useCallback(async (
    marketId: string,
    shares: bigint,
  ): Promise<ChainTransactionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!CONTRACTS.amm) throw new Error('AMM address not configured');

    const hash = await writeContractAsync({
      address: CONTRACTS.amm,
      abi: PredictionMarketAMMABI,
      functionName: 'removeLiquidity',
      args: [marketId as `0x${string}`, shares],
    } as any);

    return { hash, success: true };
  }, [address, writeContractAsync]);
};
