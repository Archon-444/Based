import { useAccount, useDisconnect, useSignMessage } from 'wagmi';

export interface UnifiedWallet {
  address: string | undefined;
  connected: boolean;
  disconnect: () => void;
  chainId: number | undefined;
  publicKey: string | undefined;
  signMessage: ((payload: {
    message: string;
    nonce: string;
    address?: boolean;
    application?: boolean;
    chainId?: boolean;
  }) => Promise<{
    signature?: string;
    publicKey?: string;
    fullMessage?: string;
  }>) | undefined;
}

export const useUnifiedWallet = (): UnifiedWallet => {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  return {
    address: address as string | undefined,
    connected: isConnected,
    disconnect,
    chainId: chain?.id,
    // On EVM, the address serves as the public identifier
    publicKey: address as string | undefined,
    // Adapt wagmi signMessage to the WalletAuthContext shape
    signMessage: isConnected && signMessageAsync
      ? async (payload) => {
          const sig = await signMessageAsync({ message: payload.message } as any);
          return {
            signature: sig,
            publicKey: address as string,
            fullMessage: payload.message,
          };
        }
      : undefined,
  };
};
