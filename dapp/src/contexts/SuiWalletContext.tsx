/**
 * Sui Wallet Context — Compatibility shim (Base-only mode).
 */
import React, { createContext, useContext } from 'react';

interface SuiWalletState {
  account: null;
  connected: false;
  connect: () => void;
  disconnect: () => void;
}

const SuiWalletContext = createContext<SuiWalletState>({
  account: null,
  connected: false,
  connect: () => {},
  disconnect: () => {},
});

export const SuiWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SuiWalletContext.Provider value={{ account: null, connected: false, connect: () => {}, disconnect: () => {} }}>
    {children}
  </SuiWalletContext.Provider>
);

export const useSuiWallet = () => useContext(SuiWalletContext);

export default SuiWalletContext;
