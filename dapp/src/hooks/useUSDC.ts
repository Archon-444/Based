import { useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useContracts } from './useContracts';

export const useUSDCBalance = () => {
  const { address } = useAccount();
  const contracts = useContracts();

  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.usdc,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts.usdc,
      refetchInterval: 15_000,
    },
  });

  const balance = data ?? 0n;
  const balanceUSDC = Number(formatUnits(balance as bigint, 6));
  const formatted = `$${balanceUSDC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    balance: balance as bigint,
    balanceUSDC,
    formatted,
    isLoading,
    error,
    refetch,
  };
};
