import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { env } from './env';

const projectId = env.walletConnectProjectId;

const chains = env.baseChainId === 84532 ? [baseSepolia, base] as const : [base, baseSepolia] as const;

export const config = createConfig({
  chains,
  connectors: [
    coinbaseWallet({
      appName: 'Prediction Market',
      preference: 'smartWalletOnly',
    }),
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_MAINNET_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(env.baseRpcUrl || 'https://sepolia.base.org'),
  },
});
