import { useChainId } from 'wagmi';
import { getContractsForChain } from '../config/contracts';

export function useContracts() {
  const chainId = useChainId();
  return getContractsForChain(chainId);
}
