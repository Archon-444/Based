import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { erc20Abi, maxUint256 } from 'viem';
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

  const approve = (amount?: bigint) => {
    writeContract({
      address: contracts.usdc,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount ?? maxUint256],
    } as any);
  };

  // Refetch allowance when approval confirms
  if (isApproved) {
    refetchAllowance();
  }

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
