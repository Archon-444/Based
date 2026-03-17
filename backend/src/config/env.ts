import 'dotenv/config';

import { z } from 'zod';

export const BRIDGED_WUSDC_COIN_TYPE =
  '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('4000')
    .transform((value) => parseInt(value, 10)),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3001,http://localhost:5173,http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),

  // Aptos Configuration (Required)
  APTOS_NETWORK: z.string().default('testnet'),
  APTOS_MODULE_ADDRESS: z.string().min(1, 'APTOS_MODULE_ADDRESS is required'),
  APTOS_ADMIN_ACCOUNT: z.string().optional(),
  APTOS_ADMIN_PRIVATE_KEY: z.string().optional(),
  APTOS_EXPECTED_CHAIN_ID: z.string().optional(),

  // Sui Configuration (Optional - only required if using Sui chain)
  DISABLE_SUI_INDEXER: z.string().optional().default('false'),
  SUI_RPC_URL: z.string().optional(),
  SUI_PACKAGE_ID: z.string().optional(),
  SUI_ADMIN_PRIVATE_KEY: z.string().optional(),
  SUI_ADMIN_CAP_ID: z.string().optional(),
  SUI_TREASURY_ID: z.string().optional(),
  SUI_EXPECTED_CHAIN_ID: z.string().optional(),
  SUI_RESOLVER_CAP_ID: z.string().optional(),
  SUI_ROLE_REGISTRY_ID: z.string().optional(),
  SUI_ORACLE_REGISTRY_ID: z.string().optional(),
  SUI_USDC_COIN_TYPE: z
    .string()
    .optional()
    .refine(
      (value) => !value || value !== BRIDGED_WUSDC_COIN_TYPE,
      'SUI_USDC_COIN_TYPE must be the native Circle USDC coin type (bridged wUSDC is unsupported)'
    ),
  MOVEMENT_EXPECTED_CHAIN_ID: z.string().optional(),

  // Base Configuration (Optional — only required if using Base chain)
  BASE_RPC_URL: z.string().optional(),
  BASE_WS_URL: z.string().optional(),
  BASE_CHAIN_ID: z.string().optional().default('8453'),
  MARKET_FACTORY_ADDRESS: z.string().optional(),
  AMM_ADDRESS: z.string().optional(),
  UMA_ADAPTER_ADDRESS: z.string().optional(),
  PYTH_ADAPTER_ADDRESS: z.string().optional(),
  PYTH_CONTRACT_ADDRESS: z.string().optional(),
  CONDITIONAL_TOKENS_ADDRESS: z.string().optional(),
  USDC_ADDRESS: z.string().optional(),
  ADMIN_PRIVATE_KEY: z.string().optional(),
  KEEPER_PRIVATE_KEY: z.string().optional(),
  RESOLVER_PRIVATE_KEY: z.string().optional(),

  // Agent Configuration (Phase 5)
  ANTHROPIC_API_KEY: z.string().optional(),
  AGENT_ENABLED: z.string().optional().default('false'),
  AGENT_AUTO_RESOLVE: z.string().optional().default('false'),
  AGENT_AUTO_DISPUTE: z.string().optional().default('false'),
  AGENT_COMMENTARY_ENABLED: z.string().optional().default('false'),
  AGENT_CONFIDENCE_THRESHOLD: z
    .string()
    .optional()
    .default('80')
    .transform((v) => parseInt(v, 10)),
  AGENT_DISPUTE_CONFIDENCE_THRESHOLD: z
    .string()
    .optional()
    .default('90')
    .transform((v) => parseInt(v, 10)),

  // Application Configuration
  ACTIVE_CHAINS: z.string().default('aptos'),
  LOG_LEVEL: z.string().default('info'),
  SIGNATURE_TTL_MS: z
    .string()
    .default('60000')
    .transform((value) => parseInt(value, 10)),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('60000')
    .transform((value) => parseInt(value, 10)),
  RATE_LIMIT_MAX: z
    .string()
    .default('120')
    .transform((value) => parseInt(value, 10)),
  METRICS_AUTH_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

const normalizedActiveChains = env.ACTIVE_CHAINS.split(',').map((chain) => chain.trim().toLowerCase());

export function isChainActive(chain: 'aptos' | 'sui' | 'movement' | 'base'): boolean {
  return normalizedActiveChains.includes(chain.toLowerCase());
}
