import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { env } from '../config/env';
import { AptosAdapter } from '../services/AptosAdapter';
import type { IBlockchainAdapter } from '../services/IBlockchainAdapter';
import { SuiPredictionMarketSDK } from '../services/SuiPredictionMarketSDK';
import { useChain } from './ChainContext';

interface SDKContextProps {
  sdk: IBlockchainAdapter;
  chain: 'aptos' | 'sui';
}

const SDKContext = createContext<SDKContextProps | null>(null);

const normalizeAddress = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export const SDKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeChain } = useChain();

  const aptosAdapter = useMemo(() => {
    const network = env.aptosNetwork;
    const moduleAddress = normalizeAddress(env.aptosModuleAddress) ?? '0x1';
    const usdcAddress = normalizeAddress(env.aptosUsdcAddress) ?? moduleAddress;

    if (moduleAddress === '0x1') {
      console.warn('[SDKProvider] VITE_APTOS_MODULE_ADDRESS is not set — using placeholder 0x1. Contract calls will fail until this is configured in Vercel environment variables.');
    }

    return new AptosAdapter(network, moduleAddress, usdcAddress);
  }, []);

  const suiAdapter = useMemo(() => {
    const network = (env.suiNetwork ?? 'devnet') as 'devnet' | 'testnet' | 'mainnet';
    const packageId = normalizeAddress(env.suiPackageId);

    console.log('[SDKProvider] Sui configuration:', {
      raw: env.suiPackageId,
      normalized: packageId,
      fallback: packageId ?? '0x0',
      network
    });

    if (!packageId) {
      console.warn('[SDKProvider] Sui package ID missing. Sui features will be limited until configured.');
    }

    return new SuiPredictionMarketSDK(network, packageId ?? '0x0');
  }, []);

  const sdk = useMemo<IBlockchainAdapter>(() => {
    return activeChain === 'sui' ? suiAdapter : aptosAdapter;
  }, [activeChain, aptosAdapter, suiAdapter]);

  useEffect(() => {
    console.log('[SDKProvider] Adapter switched', {
      chain: activeChain,
      moduleAddress: sdk.getModuleAddress(),
      network: sdk.getNetwork(),
    });
  }, [sdk, activeChain]);

  const value = useMemo<SDKContextProps>(() => ({
    sdk,
    chain: activeChain,
  }), [sdk, activeChain]);

  return <SDKContext.Provider value={value}>{children}</SDKContext.Provider>;
};

export const useSDK = (): IBlockchainAdapter => {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error('useSDK must be used within an SDKProvider');
  }
  return context.sdk;
};

export const useSDKContext = (): SDKContextProps => {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error('useSDKContext must be used within an SDKProvider');
  }
  return context;
};

export default SDKProvider;
