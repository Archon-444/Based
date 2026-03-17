/**
 * Environment configuration
 * Centralized access to environment variables for Base chain
 */

export const env = {
  // Mode
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,

  // API
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws',

  // Base chain
  baseRpcUrl: import.meta.env.VITE_BASE_RPC_URL || '',
  baseChainId: parseInt(import.meta.env.VITE_BASE_CHAIN_ID || '84532', 10),

  // Contract addresses
  factoryAddress: import.meta.env.VITE_FACTORY_ADDRESS || '',
  ammAddress: import.meta.env.VITE_AMM_ADDRESS || '',
  usdcAddress: import.meta.env.VITE_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  conditionalTokensAddress: import.meta.env.VITE_CONDITIONAL_TOKENS_ADDRESS || '',

  // Wallet
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',

  // Feature flags
  enablePushNotifications: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true',
  enableBiometricAuth: import.meta.env.VITE_ENABLE_BIOMETRIC_AUTH === 'true',
  enableServiceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',

  // Logging
  logLevel: import.meta.env.VITE_LOG_LEVEL || (import.meta.env.DEV ? 'DEBUG' : 'INFO'),
} as const;

export function validateEnv(): void {
  const warnings: string[] = [];

  if (!env.factoryAddress) warnings.push('VITE_FACTORY_ADDRESS');
  if (!env.ammAddress) warnings.push('VITE_AMM_ADDRESS');
  if (!env.conditionalTokensAddress) warnings.push('VITE_CONDITIONAL_TOKENS_ADDRESS');

  if (env.isProduction && warnings.length > 0) {
    throw new Error(`Missing required environment variables:\n${warnings.join('\n')}`);
  }

  if (warnings.length > 0) {
    console.warn(`Missing env vars (some features may not work):\n${warnings.join('\n')}`);
  }
}

export default env;
