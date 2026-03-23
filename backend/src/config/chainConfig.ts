import type { Chain } from '@prisma/client';

export interface ChainConfig {
  chain: Chain;
  feeStructure: {
    tradingFee: number;
    withdrawalFee: number;
    creatorFee: number;
    protocolFee: number;
  };
  lmsrParams: {
    b: number;
    initialLiquidity: bigint;
  };
  limits: {
    minBet: bigint;
    maxBet: bigint;
    maxMarketDurationHours: number;
  };
  contractAddress: string;
  rpcEndpoint: string;
  usdcCoinType?: string;
}

const MICRO_USDC = 1_000_000n;

const chainConfigs: Partial<Record<Chain, ChainConfig>> = {
  base: {
    chain: 'base',
    feeStructure: {
      tradingFee: 2.0,
      withdrawalFee: 0,
      creatorFee: 0,
      protocolFee: 0,
    },
    lmsrParams: {
      b: 0,
      initialLiquidity: 0n,
    },
    limits: {
      minBet: 1n * MICRO_USDC,
      maxBet: 100_000n * MICRO_USDC,
      maxMarketDurationHours: 24 * 365,
    },
    contractAddress: process.env.MARKET_FACTORY_ADDRESS ?? '',
    rpcEndpoint: process.env.BASE_RPC_URL ?? '',
  },
  movement: {
    chain: 'movement',
    feeStructure: {
      tradingFee: 1.0,
      withdrawalFee: 0,
      creatorFee: 0.25,
      protocolFee: 0.75,
    },
    lmsrParams: {
      b: 100,
      initialLiquidity: 100n * MICRO_USDC,
    },
    limits: {
      minBet: 1n * MICRO_USDC,
      maxBet: 10_000n * MICRO_USDC,
      maxMarketDurationHours: 24 * 365,
    },
    contractAddress: process.env.MOVEMENT_MODULE_ADDRESS ?? '',
    rpcEndpoint: process.env.MOVEMENT_RPC_ENDPOINT ?? '',
  },
};

export function getChainConfig(chain: Chain): ChainConfig {
  const config = chainConfigs[chain];

  if (!config) {
    throw new Error(`Unsupported chain configuration requested: ${chain}`);
  }

  return config;
}
