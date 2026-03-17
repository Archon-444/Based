import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { erc20Abi, maxUint256 } from 'viem';
import { CONTRACTS } from '../config/contracts';

export function useApproveUSDC(spender: `0x${string}` = CONTRACTS.amm) {
  const { address } = useAccount();

  // Read current allowance
  const { data: allowance = 0n, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.usdc,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, spender] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.usdc,
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
      address: CONTRACTS.usdc,
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
