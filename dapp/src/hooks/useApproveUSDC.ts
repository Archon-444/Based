import { useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { erc20Abi } from 'viem';
import { useContracts } from './useContracts';

export function useApproveUSDC(spenderOverride?: `0x${string}`) {
  const { address } = useAccount();
  const contracts = useContracts();
  const spender = spenderOverride ?? contracts.amm;

  // Read current allowance
  const { data: allowance = 0n, refetch: refetchAllowance } = useReadContract({
    address: contracts.usdc,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, spender] : undefined,
    query: {
      enabled: !!address && !!contracts.usdc,
    },
  });

  // Write approve
  const { writeContract, data: hash, isPending: isApproving, error: approveError, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash,
  });

  const needsApproval = (amount: bigint): boolean => {
    return (allowance as bigint) < amount;
  };

  // Approve an exact amount — never an unlimited (MaxUint256) allowance.
  const approve = (amount: bigint) => {
    writeContract({
      address: contracts.usdc,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
    } as any);
  };

  // Refetch allowance when approval confirms (effect, not during render)
  useEffect(() => {
    if (isApproved) {
      refetchAllowance();
    }
  }, [isApproved, refetchAllowance]);

  return {
    allowance: allowance as bigint,
    needsApproval,
    approve,
    isApproving: isApproving || isConfirming,
    isApproved,
    approveError,
    hash,
    reset,
    refetchAllowance,
  };
}
