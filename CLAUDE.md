# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Based is a decentralized prediction market on Base (Coinbase L2). Users trade outcomes on real-world events using USDC. The monorepo has three main workspaces plus supporting directories:

- `contracts-base/` — Solidity 0.8.24 contracts (Foundry)
- `backend/` — Node.js API: Express + Prisma + viem (ESM, TypeScript)
- `dapp/` — React 18 frontend: Vite + wagmi v2 + RainbowKit + TailwindCSS
- `docs/` — architecture, security, audit prep, runbooks
- `monitoring/` — Prometheus/Grafana manifests

**CONTEXT.md is the living project status document** — read it for detailed contract interfaces, current phase, and roadmap. Update it after completing a major phase. Current state: Phase 6 complete, testnet only (Base Sepolia), pre-audit.

## Commands

### Contracts (`contracts-base/`)

Foundry libs are git submodules — run `git submodule update --init --recursive` before building.

```bash
forge test                                  # all 121 tests
forge test --match-contract MarketFactoryTest   # one suite
forge test --match-test test_CreateMarket       # one test
forge build                                 # solc 0.8.24, via-IR, 10K fuzz runs
```

### Backend (`backend/`)

Requires PostgreSQL and a `.env` (see `backend/.env.example`).

```bash
npm install
npx prisma generate           # after install or schema changes
npx prisma migrate dev        # apply migrations locally
npm run dev                   # tsx watch, http://localhost:4000
npm test                      # vitest (watch); npm test -- --run for CI mode
npx vitest run tests/health.test.ts   # single test file (tests live in backend/tests/)
npm run lint                  # eslint; CI enforces --max-warnings=0
npm run build                 # tsc

# AI agent CLIs
npm run agent:create -- "Will BTC hit $150K?"   # create market from NL prompt
npm run agent:costs                              # agent cost report
npm run deploy:sepolia                           # deploy contracts via CLI
```

### Frontend (`dapp/`)

```bash
npm run dev            # vite, http://localhost:5173
npm run build          # vite build (Vercel uses this)
npm run build:check    # tsc + vite build (type-checks first)
npm test               # vitest
npm run lint           # eslint ts,tsx
```

### CI

- `backend-ci.yml` — on backend changes: Prisma generate, `lint --max-warnings=0`, `test -- --run`, build, against Postgres 15.
- Lint warnings fail CI — keep backend code warning-free.

## Architecture

### Contracts — how the pieces connect

Five contracts in `contracts-base/src/`, deployed in dependency order:

1. **ConditionalTokens.sol** — Gnosis CTF ported to 0.8.24. ERC-1155 outcome tokens. Everything else depends on it.
2. **MarketFactory.sol** — market lifecycle (Created → Active → Resolving → Resolved | Disputed | Cancelled). **The factory is the CTF oracle**: it calls `prepareCondition` with `address(this)` and all payout reporting flows through `factory.reportPayoutsFor()`. AccessControl roles: `MARKET_CREATOR_ROLE`, `RESOLVER_ROLE`.
3. **PredictionMarketAMM.sol** — CPMM for binary markets, LMSR for multi-outcome. Reads market status/deadline from the factory before allowing trades. 2% fee split: 84% LP / 12% protocol / 4% buyback.
4. **UmaCtfAdapter.sol** — UMA Optimistic Oracle V3 for subjective events (assert → liveness → settle → callback). First dispute auto-resets market to Resolving; second waits for DVM.
5. **PythOracleAdapter.sol** — automated price resolution (ABOVE/BELOW/BETWEEN), binary markets only, atomic `resolve()`.

Both oracle adapters need `RESOLVER_ROLE` on MarketFactory. Tests are in `test/unit/*.t.sol` with mocks in `test/mocks/`.

### Backend — data flow

```
On-chain events → baseEventIndexer → baseEventHandlers → Prisma DB
                                          ↓
                              REST API + WebSocket broadcast → frontend
```

- **Indexer** (`services/baseEventIndexer.ts`): historical backfill via `getLogs` (2000-block chunks) + real-time `watchContractEvent`; resumable via `IndexerState`; idempotent on txHash+logIndex.
- **Event handlers** (`services/baseEventHandlers.ts`): one handler per EVM event — each writes Prisma, stores an audit `BlockchainEvent`, broadcasts on WebSocket, records Prometheus metrics.
- **Keeper** (`services/keeperService.ts`): cron jobs to resolve expired markets, settle UMA assertions, and monitor integrity. Triggers the AI resolution agent for UMA markets.
- **Transaction service** (`blockchain/base/transactionService.ts`): gas estimation with buffer, nonce management via async-mutex, retry with backoff. Three wallets: admin (createMarket), keeper (settle), resolver (Pyth).
- **WebSocket** (`websocket/`): per-market subscriptions at `/ws`; broadcasts trades, commentary, status changes, assertion events.

Startup sequence lives in `src/index.ts`; Express app assembly in `src/app.ts`; routes → controllers → services layering.

### AI agents (`backend/src/agents/`)

All agents are feature-flagged and fail-safe: the Anthropic SDK is **lazy-loaded** (never imported unless `ANTHROPIC_API_KEY` is set), and agent errors must never crash the keeper/indexer. Master switch `AGENT_ENABLED=false` by default, with per-agent flags (`AGENT_AUTO_RESOLVE`, `AGENT_AUTO_DISPUTE`, `AGENT_COMMENTARY_ENABLED`).

- **resolutionAgent** — web-searches evidence, asserts UMA outcomes (confidence gate ≥80%)
- **integrityGuardian** — verifies others' assertions, disputes bad ones (≥90%); skips self-disputes
- **commentaryAgent** — market commentary on a 30-min cron, broadcast via WebSocket
- **marketCreator** — CLI-only NL-prompt → on-chain market pipeline

Shared infra in `agents/shared/`: singleton Claude client with retry/cost tracking, Zod schemas for structured output, agent logger.

### Frontend

Provider hierarchy: `ErrorBoundary → ThemeProvider → WagmiProvider → QueryClientProvider → RainbowKitProvider → SessionProvider → Router`.

Two data paths:
- **On-chain reads/writes** via wagmi hooks in `src/hooks/` (`useMarketPrices`, `useChainPlaceBet`, `useApproveUSDC`, etc.) against ABIs in `src/config/`
- **Indexed data** via TanStack Query hooks hitting the backend REST API, with `useMarketWebSocket` invalidating query caches on live events

Wallet connectors (in `config/wagmi.ts`): Coinbase Smart Wallet (smartWalletOnly — email/passkey onboarding), injected, WalletConnect.

## Conventions and Gotchas

- **Backend is ESM** (`"type": "module"`) — all relative imports must use `.js` extensions, even in TypeScript source.
- **Legacy multi-chain remnants**: the project was migrated from Aptos/Sui ("Move Market" branding) to Base. The Prisma `Chain` enum, `chainConfig.ts`, and files like `eventHandlers.ts` (vs the active `baseEventHandlers.ts`) still carry aptos/sui/movement entries. `base` is the only active chain — don't extend the legacy paths.
- **Contract addresses come from env**, never hardcoded: `MARKET_FACTORY_ADDRESS`, `AMM_ADDRESS`, `CONDITIONAL_TOKENS_ADDRESS` (backend); `VITE_FACTORY_ADDRESS`, `VITE_AMM_ADDRESS`, etc. (frontend). Deployed Base Sepolia addresses are listed in README.md and CONTEXT.md.
- **Market IDs are bytes32** (`keccak256(abi.encode(questionId, outcomeCount, deadline))`); the DB stores them as `onChainId` scoped by `chain`.
- **AMM prices are 18-decimal fixed point** (sum ≈ 1e18); USDC amounts are 6-decimal.
- **Foundry remappings** (`contracts-base/remappings.txt`): `@openzeppelin/`, `@prb/math/`, `forge-std/`.
- **Deployment**: frontend on Vercel (`vercel.json`, builds `dapp/`), backend on Render (`render.yaml`, root `Dockerfile`).
