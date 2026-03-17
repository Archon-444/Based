/**
 * Chain Context — Compatibility shim for Base-only mode.
 * All chain references now return 'base'.
 */
import React, { createContext, useContext } from 'react';

export type Chain = 'aptos' | 'sui' | 'movement' | 'base';

interface ChainContextType {
  activeChain: Chain;
  availableChains: Chain[];
  setActiveChain: (chain: Chain) => void;
}

const ChainContext = createContext<ChainContextType>({
  activeChain: 'base',
  availableChains: ['base'],
  setActiveChain: () => {},
});

export const ChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ChainContext.Provider value={{ activeChain: 'base', availableChains: ['base'], setActiveChain: () => {} }}>
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = () => useContext(ChainContext);

export default ChainContext;
