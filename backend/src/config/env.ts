import 'dotenv/config';

import { z } from 'zod';

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

  // Base Configuration
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
  ACTIVE_CHAINS: z.string().default('base'),
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

const normalizedActiveChains = env.ACTIVE_CHAINS.split(',').map((chain) =>
  chain.trim().toLowerCase()
);

export function isChainActive(chain: 'base' | 'movement'): boolean {
  return normalizedActiveChains.includes(chain.toLowerCase());
}
