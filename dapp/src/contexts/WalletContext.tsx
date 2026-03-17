/**
 * Aptos Wallet Context — Compatibility shim (Base-only mode).
 */
import React from 'react';

export const AptosWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export default AptosWalletProvider;
