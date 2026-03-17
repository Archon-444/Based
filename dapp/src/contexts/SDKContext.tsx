/**
 * SDK Context — Compatibility shim for Base-only mode.
 * Pages that still reference useSDK/useSDKContext will get a minimal adapter.
 */
import React, { createContext, useContext } from 'react';

interface MinimalSDK {
  getMarketCount(): Promise<number>;
  getMarket(id: number): Promise<any>;
  getOdds(id: number): Promise<number[]>;
  getBalance(address: string): Promise<number>;
  getUserPosition(marketId: number, address: string): Promise<any>;
  fromMicroUSDC(amount: number): number;
  toMicroUSDC(amount: number): number;
  formatUSDC(amount: number): string;
  getNetwork(): string;
  getModuleAddress(): string;
  placeBet(marketId: number, outcome: number, amount: number): Promise<any>;
  claimWinnings(marketId: number): Promise<any>;
}

const stubSDK: MinimalSDK = {
  getMarketCount: async () => 0,
  getMarket: async () => null,
  getOdds: async () => [],
  getBalance: async () => 0,
  getUserPosition: async () => null,
  fromMicroUSDC: (amount: number) => amount / 1_000_000,
  toMicroUSDC: (amount: number) => Math.round(amount * 1_000_000),
  formatUSDC: (amount: number) => `$${(amount / 1_000_000).toFixed(2)}`,
  getNetwork: () => 'base',
  getModuleAddress: () => '',
  placeBet: async () => ({ hash: '', success: false }),
  claimWinnings: async () => ({ hash: '', success: false }),
};

interface SDKContextType {
  sdk: MinimalSDK;
  chain: string;
}

const SDKContext = createContext<SDKContextType>({
  sdk: stubSDK,
  chain: 'base',
});

export const SDKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SDKContext.Provider value={{ sdk: stubSDK, chain: 'base' }}>
      {children}
    </SDKContext.Provider>
  );
};

export const useSDK = () => useContext(SDKContext).sdk;
export const useSDKContext = () => useContext(SDKContext);

export default SDKContext;
