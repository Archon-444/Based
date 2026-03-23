export { marketFactoryAbi } from './MarketFactory.js';
export { predictionMarketAmmAbi } from './PredictionMarketAMM.js';
export { pythOracleAdapterAbi } from './PythOracleAdapter.js';
export { umaCtfAdapterAbi } from './UmaCtfAdapter.js';

import { env } from '../../../config/env.js';

export const contractAddresses = {
  marketFactory: env.MARKET_FACTORY_ADDRESS as `0x${string}` | undefined,
  amm: env.AMM_ADDRESS as `0x${string}` | undefined,
  umaAdapter: env.UMA_ADAPTER_ADDRESS as `0x${string}` | undefined,
  pythAdapter: env.PYTH_ADAPTER_ADDRESS as `0x${string}` | undefined,
  conditionalTokens: env.CONDITIONAL_TOKENS_ADDRESS as `0x${string}` | undefined,
  usdc: env.USDC_ADDRESS as `0x${string}` | undefined,
  pyth: env.PYTH_CONTRACT_ADDRESS as `0x${string}` | undefined,
} as const;
