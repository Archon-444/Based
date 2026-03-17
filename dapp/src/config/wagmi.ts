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
    [base.id]: http(env.baseRpcUrl || undefined),
    [baseSepolia.id]: http(env.baseRpcUrl || undefined),
  },
});
