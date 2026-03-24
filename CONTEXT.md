# CONTEXT.md — Prediction Market on Base
# Last updated: Phase 6 complete — 2026-03-17
# UPDATE THIS FILE after every completed phase.

## Project overview

Decentralized prediction market platform on Base (Coinbase L2). Uses Gnosis Conditional Token Framework for outcome tokens, UMA Optimistic Oracle for subjective market resolution, Pyth for automated price resolution, and CPMM/LMSR AMMs for liquidity. AI agents (Claude) automate market creation, resolution, commentary, and integrity monitoring.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Contracts | Solidity 0.8.24 / Foundry (121 tests) |
| Backend | Node.js + Express + Prisma + viem |
| AI Agents | Anthropic SDK (Claude Sonnet 4) |
| Frontend | React 18 + Vite + wagmi v2 + RainbowKit |
| Database | PostgreSQL (Prisma ORM) |
| Monitoring | Prometheus (prom-client) |
| Deployment | Vercel (frontend), self-hosted (backend) |

### Repository structure

```
contracts-base/          # Solidity contracts (Foundry)
backend/                 # Node.js backend (ESM, TypeScript)
  src/
    agents/              # AI agents (Phase 5)
    blockchain/base/     # viem clients, ABIs, transaction service
    config/              # env, chain config, logger
    routes/              # Express API routes
    services/            # Indexer, keeper, business logic
    websocket/           # WebSocket server + handlers
    monitoring/          # Prometheus metrics
dapp/                    # React frontend (Vite, TypeScript)
  src/
    config/              # wagmi, contracts, env
    hooks/               # 40+ custom hooks
    pages/               # 18 route pages
    contexts/            # Theme, Session providers
    services/            # API client, payout API
```

---

## Contracts (Phase 1-3)

Build tool: Foundry (forge 0.8.24, via-IR optimization, 10K fuzz runs). All contracts in `contracts-base/`.

Dependencies: OpenZeppelin v5.6.1, forge-std v1.15.0, PRBMath v4.1.1 SD59x18.

### MarketFactory.sol — 35/35 tests

- Constructor: `(_conditionalTokens, _usdc)`. Uses ReentrancyGuard.
- Roles: `DEFAULT_ADMIN_ROLE`, `MARKET_CREATOR_ROLE`, `RESOLVER_ROLE`
- Constants: `MAX_OUTCOMES`, `MAX_QUESTION_LENGTH`, `MIN_OUTCOMES`
- Market ID: `keccak256(abi.encode(questionId, outcomeCount, deadline))`
- Factory is the CTF oracle (`address(this)` in `prepareCondition`)
- Key functions: `createMarket` (returns bytes32 marketId), `activateMarket`, `beginResolution`, `resolveMarket`, `disputeMarket`, `resetToResolving`, `cancelMarket`, `reportPayoutsFor`
- View helpers: `getMarket(marketId)`, `getMarketCount()`, `getActiveMarkets()`, `getAllMarketIds()`, `isMarketActive(marketId)`, `marketExists(marketId)`, `conditionalTokens()`, `usdc()`
- Market struct: questionId, question, outcomeCount, deadline, createdAt, creator, status (uint8 enum), conditionId, ancillaryData, initialLiquidity
- Status enum: Created → Active → Resolving → Resolved | Disputed → Resolving | Cancelled
- Events: `MarketCreated(marketId, questionId, creator, question, outcomeCount, deadline, createdAt)`, `MarketResolved(marketId, resolvedAt)`, `MarketCancelled(marketId, cancelledAt)`, `MarketStatusChanged(marketId, oldStatus, newStatus)`
- Errors: `DeadlineInPast(deadline, currentTime)`, `InvalidOutcomeCount(provided, min, max)`, `MarketAlreadyExists(marketId)`, `MarketNotFound(marketId)`, `MarketNotInStatus(marketId, expected, actual)`, `QuestionTooLong(length, maxLength)`, `EmptyQuestion`

### PredictionMarketAMM.sol — 26/26 tests

- CPMM for binary markets (outcomeCount == 2), LMSR for multi-outcome (>2)
- Inherits Ownable (not AccessControl). Constructor: `(_conditionalTokens, _marketFactory, _usdc)`
- Key functions: `initializePool`, `buy`, `sell`, `addLiquidity`, `removeLiquidity(marketId, sharesToBurn)`, `getPrices`, `freezePool`, `getPool`, `getReserves`, `withdrawProtocolFees`
- View helpers: `reserves(bytes32, uint256)`, `lpShares(bytes32, address)`, `buybackFees()`, `protocolFees()`, `owner()`, `conditionalTokens()`, `marketFactory()`, `usdc()`
- Constants: `BPS`, `BUYBACK_FEE_SHARE`, `DEFAULT_FEE_BPS`, `LP_FEE_SHARE`, `MAX_FEE_BPS`, `MIN_LIQUIDITY`, `PRECISION`, `PROTOCOL_FEE_SHARE`
- `getPrices` returns uint256[] in 18-decimal fixed point (sum to ~1e18)
- Pool struct: conditionId, outcomeCount, totalLpShares, feeBps, lmsrB (uint256), initialized, frozen
- Fee: 2% (200 bps) — 84% LP, 12% protocol, 4% buyback
- LP shares: `mapping(bytes32 => mapping(address => uint256))`
- ERC-1155 receiver: `onERC1155Received`, `onERC1155BatchReceived`
- Events: `Trade(marketId, trader, outcomeIndex, isBuy, usdcAmount, tokenAmount, feeAmount, newPrices[])`, `PoolInitialized(marketId, initialLiquidity, provider)`, `LiquidityAdded(marketId, provider, usdcAmount, shares)`, `LiquidityRemoved(marketId, provider, usdcAmount, shares)`

### UmaCtfAdapter.sol — 34/34 tests

- Constructor: `(_oov3, _factory, _usdc)` — 3 params (no _conditionalTokens)
- Constants: `MIN_BOND = 500e6`, `DEFAULT_LIVENESS_SPORTS = 7200` (uint64), `DEFAULT_LIVENESS_POLITICS = 172800` (uint64), `BOND_RATIO_BPS`
- Key functions: `registerMarket(marketId, reward, bond, liveness)`, `assertOutcome(marketId, proposedOutcome)` (returns void), `settle(marketId)`
- View helpers: `getMarketData(marketId)` (returns MarketData struct), `getMarketForAssertion(assertionId)`, `factory()`, `oov3()`, `usdc()`
- Callbacks: `assertionResolvedCallback`, `assertionDisputedCallback`
- First dispute: auto-reset to Resolving. Second dispute: stays Disputed, waits for DVM.
- Needs `RESOLVER_ROLE` on MarketFactory.
- Events: `MarketRegistered(marketId, bond, liveness)`, `OutcomeAsserted(marketId, assertionId, proposedOutcome, asserter)`, `AssertionSettled(marketId, assertionId, winningOutcome)`, `AssertionDisputed(marketId, assertionId, disputeCount)`, `MarketReset(marketId)`

### PythOracleAdapter.sol — 26/26 tests

- Constructor: `(_pyth, _factory)` — 2 params only (no _conditionalTokens, no _usdc)
- Binary markets only. Resolution types: ABOVE, BELOW, BETWEEN
- `registerMarket(marketId, feedId, strikePrice, strikePriceHigh, resolutionType)` — strikePriceHigh (int256) is for BETWEEN range markets
- `resolve(marketId, pythUpdateData)` — payable, atomic resolution (beginResolution + resolveMarket + reportPayoutsFor)
- View helpers: `getMarketConfig(marketId)` (returns PythMarketConfig struct), `factory()`, `pyth()`
- PythMarketConfig struct: feedId (bytes32), strikePrice (int256), strikePriceHigh (int256), resolutionType (uint8), registered, resolved
- Price comparison: raw Pyth int64 vs stored strikePrice (same expo)
- Needs `RESOLVER_ROLE` on MarketFactory.
- Events: `MarketRegistered(marketId, feedId, strikePrice, resolutionType)`, `MarketResolved(marketId, feedId, price, expo, winningOutcome)`

### Test counts

| Suite | Tests |
|-------|-------|
| MarketFactory | 35 |
| PredictionMarketAMM | 26 |
| UmaCtfAdapter | 34 |
| PythOracleAdapter | 26 |
| **Total** | **121** |

---

## Backend (Phase 4)

Node.js + Express + Prisma + viem. ESM (`"type": "module"`). All imports use `.js` extensions.

### Prisma models

| Model | Purpose | Key fields |
|-------|---------|-----------|
| Market | Indexed market data | onChainId, chain, question, outcomes[], status, totalVolume, resolutionType, pythFeedId, conditionId |
| Trade | Buy/sell transactions | trader, outcomeIndex, tradeType, amount, outcomeTokens, fee, txHash |
| LiquidityEvent | Add/remove liquidity | provider, eventType, amount, shares |
| UmaAssertion | UMA oracle assertions | assertionId, proposedOutcome, asserter, bond, liveness, status (PENDING/SETTLED/DISPUTED) |
| BlockchainEvent | Audit log | chain, eventType, transactionHash, eventData (JSON) |
| IndexerState | Resumable indexing | contractAddress, lastProcessedVersion |
| AgentAction | AI agent decisions | agent, action, confidence, reasoning, sources[], costUsd, txHash |
| AgentCommentary | AI market commentary | headline, body, sentiment, keyFactors[] |
| User | Wallet roles | walletAddress, roles[], onChainRolesSynced |
| Suggestion | Market proposals | question, outcomes[], status, proposer, upvotes |
| LeaderboardEntry | Trader rankings | metric (profit/volume), period, rank, value |

### Services

**Event Indexer** (`baseEventIndexer.ts`):
- Historical backfill via `getLogs()` (2000-block chunks)
- Real-time via `watchContractEvent()` (WebSocket)
- Per-contract IndexerState tracking
- Idempotent (unique constraint on txHash + logIndex)
- Contracts indexed: MarketFactory, AMM, UmaCtfAdapter, PythOracleAdapter

**Event Handlers** (`baseEventHandlers.ts`):
- 18 handlers (one per EVM event): MarketCreated, Buy, Sell, OutcomeAsserted, AssertionSettled, etc.
- Each handler: writes to Prisma → stores audit event → broadcasts via WebSocket → records metrics

**Keeper Service** (`keeperService.ts`):
- `checkDeadlines` (5 min) — resolve expired Pyth markets; trigger AI agent for UMA markets
- `settleAssertions` (15 min) — settle mature UMA assertions past liveness
- `resolveWithPyth` (5 min) — resolve Pyth markets in Resolving state
- `monitorIntegrity` (1 min) — stuck market detection, on-chain/DB count comparison

**Transaction Service** (`transactionService.ts`):
- `sendTransaction(params)` — gas estimation (20% buffer), nonce management (async-mutex), retry with exponential backoff
- `encodeCall(abi, functionName, args)` — viem encodeFunctionData wrapper
- Three wallets: admin (createMarket), keeper (settleAssertion), resolver (Pyth resolve)

**Pyth Hermes** (`pythHermes.ts`):
- `fetchPriceUpdateData(feedIds)` — hex-encoded VAA bytes for on-chain updatePriceFeeds
- `fetchLatestPrices(feedIds)` — parsed price data

### API routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/markets` | GET | List markets (chain filter) |
| `/api/markets/:chain/:onChainId` | GET | Market detail |
| `/api/markets/calculate-payout` | POST | Payout quote (fees, price impact) |
| `/api/trades/:marketId` | GET | Trade history (paginated) |
| `/api/portfolio/:address` | GET | User portfolio (positions + P&L) |
| `/api/leaderboard` | GET | Trader rankings |
| `/api/roles/:address` | GET | User roles |
| `/api/roles/grant` | POST | Grant role |
| `/api/roles/revoke` | POST | Revoke role |
| `/api/suggestions` | GET/POST | Market suggestions |

### WebSocket (`/ws`)

- Subscribe/unsubscribe per marketId
- Broadcasts: trade, commentary, status_change, outcome_asserted, assertion_settled, assertion_disputed
- Heartbeat ping/pong every 30s

### Startup sequence (`src/index.ts`)

1. Start chain-specific event indexers (Aptos, Sui, Base)
2. Start Base keeper service (cron jobs)
3. Start AI Agent Manager (if `AGENT_ENABLED=true`)
4. Attach WebSocket server
5. Start market resolver (5 min interval)
6. Graceful shutdown on SIGINT/SIGTERM

---

## AI Agents (Phase 5)

All agents are optional — controlled by independent env vars. Anthropic SDK lazy-loaded (never imports if `ANTHROPIC_API_KEY` absent). Agent errors never crash the keeper/indexer.

### Shared infrastructure (`agents/shared/`)

- **claudeClient.ts** — Singleton Anthropic SDK wrapper. Lazy loading, retry (3x exponential backoff on 429/500), per-agent cost tracking, web_search_20250305 tool, Zod-validated structured output parsing with retry on validation failure.
- **structuredOutput.ts** — Zod schemas: MarketProposal, ResolutionProposal, MarketCommentary, DisputeAssessment
- **agentLogger.ts** — Pino child logger with `{ agent }` context + `logLlmCall()` for token/cost tracking

### Resolution Agent (`resolutionAgent.ts`)

- **Purpose:** Auto-resolve expired UMA markets via evidence gathering
- **Trigger:** Keeper's `checkDeadlines()` when `AGENT_AUTO_RESOLVE=true`
- **Flow:** Web search for evidence → parse ResolutionProposal → confidence gate (≥80%) → approve USDC bond → call `umaAdapter.assertOutcome()`
- **Safety:** Skips if market already has pending assertion

### Integrity Guardian (`integrityGuardian.ts`)

- **Purpose:** Verify UMA assertions; dispute incorrect proposals
- **Trigger:** `handleOutcomeAsserted()` event handler via `setImmediate` (non-blocking)
- **Flow:** Web search for counter-evidence → parse DisputeAssessment → confidence gate (≥90%) → approve bond to OOV3 → call `oov3.disputeAssertion()`
- **Safety:** Self-dispute prevention (skips if asserter is our keeper wallet)

### Commentary Agent (`commentaryAgent.ts`)

- **Purpose:** Generate NL market commentary on price movements
- **Trigger:** Cron every 30 min for top 5 active markets by volume
- **Flow:** Load market + trades + prices → call Claude → store in AgentCommentary → broadcast via WebSocket

### Market Creator (`marketCreator.ts`)

- **Purpose:** Transform NL prompt into on-chain market
- **Trigger:** CLI only (`npm run agent:create -- "Will BTC hit $150K?"`)
- **Flow:** Claude generates MarketProposal → duplicate check → risk flag check → 7-step on-chain creation (createMarket → activateMarket → registerOracle → initializePool)

### Agent env vars

| Variable | Default | Purpose |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | — | Claude API key |
| `AGENT_ENABLED` | false | Master kill switch |
| `AGENT_AUTO_RESOLVE` | false | Auto-assert UMA outcomes |
| `AGENT_AUTO_DISPUTE` | false | Auto-dispute wrong assertions |
| `AGENT_COMMENTARY_ENABLED` | false | Generate commentary |
| `AGENT_CONFIDENCE_THRESHOLD` | 80 | Min confidence for assertion |
| `AGENT_DISPUTE_CONFIDENCE_THRESHOLD` | 90 | Min confidence for dispute |

---

## Frontend (Phase 6)

React 18 + Vite + wagmi v2 + viem + RainbowKit. Tailwind CSS dark theme. Deployed on Vercel.

### Provider hierarchy (App.tsx)

```
ErrorBoundary → ThemeProvider → WagmiProvider → QueryClientProvider → RainbowKitProvider → SessionProvider → Router
```

### Wallet connectors (config/wagmi.ts)

1. **Coinbase Smart Wallet** (`preference: 'smartWalletOnly'`) — email/passkey signup
2. **Injected** — MetaMask, Rabby, etc.
3. **WalletConnect** — if `VITE_WALLETCONNECT_PROJECT_ID` set

### Contract hooks

| Hook | Type | Contract call |
|------|------|--------------|
| `useMarketPrices(marketId)` | Read (10s poll) | `AMM.getPrices(bytes32)` |
| `useUSDCBalance()` | Read (15s poll) | `USDC.balanceOf(address)` |
| `useApproveUSDC(spender)` | Read+Write | `USDC.allowance` + `USDC.approve` |
| `useChainPlaceBet()` | Write | `AMM.buy(marketId, outcomeIndex, usdcAmount, minTokensOut)` |
| `useChainSellPosition()` | Write | `AMM.sell(marketId, outcomeIndex, tokenAmount, minUsdcOut)` |
| `useChainClaimWinnings()` | Write | `ConditionalTokens.redeemPositions(...)` |
| `useChainAddLiquidity()` | Write | `AMM.addLiquidity(marketId, usdcAmount)` |
| `useChainRemoveLiquidity()` | Write | `AMM.removeLiquidity(marketId, sharesToBurn)` |

### API hooks (TanStack Query)

| Hook | Endpoint | Refresh |
|------|----------|---------|
| `useMarkets()` | `GET /api/markets?chain=base` | 30s |
| `useMarket(id)` | `GET /api/markets/base/:id` | 15s |
| `useTradeHistory(marketId)` | `GET /api/trades/:marketId` | 30s |
| `usePortfolio(address)` | `GET /api/portfolio/:address` | 30s |

### WebSocket hook

`useMarketWebSocket(marketId)` — subscribes to live updates, invalidates TanStack Query caches on trade/status events.

### Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | LandingPage | Homepage, featured markets |
| `/markets` | MarketsPage | Market list, filters, search |
| `/market/:id` | MarketDetailPage | Chart, trading panel, trades, commentary |
| `/dashboard` | DashboardPage | Portfolio, positions, P&L |
| `/create` | CreateMarketPage | Market suggestions |
| `/liquidity` | LiquidityPage | LP management |
| `/leaderboard` | LeaderboardPage | Top traders |
| `/admin/*` | Admin pages | Roles, resolver, suggestions |

### Frontend env vars

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:4000/api` | Backend API |
| `VITE_WS_URL` | `ws://localhost:4000/ws` | WebSocket |
| `VITE_BASE_RPC_URL` | — | Base RPC endpoint |
| `VITE_BASE_CHAIN_ID` | 84532 | Chain ID (84532=Sepolia, 8453=mainnet) |
| `VITE_FACTORY_ADDRESS` | — | MarketFactory contract |
| `VITE_AMM_ADDRESS` | — | AMM contract |
| `VITE_USDC_ADDRESS` | `0x036CbD...` | USDC (Base Sepolia) |
| `VITE_CONDITIONAL_TOKENS_ADDRESS` | — | CTF contract |
| `VITE_WALLETCONNECT_PROJECT_ID` | — | WalletConnect |

---

## Key integration patterns

1. **Factory is CTF oracle.** `prepareCondition` uses `address(this)`. All payout reporting via `factory.reportPayoutsFor()` → `conditionalTokens.reportPayouts()`.

2. **RESOLVER_ROLE gates oracle adapters.** Both UMA and Pyth adapters need this role to call `beginResolution`, `resolveMarket`, `reportPayoutsFor`.

3. **AMM reads market state from factory.** Checks status == Active and deadline not passed before allowing trades.

4. **Token flow (buy):** User approves USDC → AMM calls CTF `splitPosition` → keeps unwanted tokens → sends desired tokens to user.

5. **Resolution flow (UMA):** Deadline passes → AI agent calls `assertOutcome()` → liveness period → `settle()` → callback → `resolveMarket()` + `reportPayoutsFor()`.

6. **Resolution flow (Pyth):** Keeper calls `resolve{value: fee}(marketId, updateData)` → atomic resolution.

7. **ERC-20 approval flow (frontend):** `useApproveUSDC` checks allowance → if insufficient, user approves (default: MaxUint256) → then trade executes.

8. **Data flow:** On-chain events → backend indexer → Prisma DB → REST API / WebSocket → frontend hooks.

9. **Agent integration:** Keeper triggers resolution agent (dynamic import, try/catch). Event handler triggers integrity guardian (setImmediate). Both use lazy Anthropic SDK loading.

---

## Deployment

### Addresses (Base Sepolia testnet)

- Pyth: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- UMA OOV3: `0x0F7fC5E6482f096380db6158f978167b57388deE`
- USDC (testnet): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- MarketFactory, AMM, UMA adapter, Pyth adapter: deployed (addresses in `.env`)

### Addresses (Base Mainnet)

- Chain ID: 8453
- USDC (native Circle): `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Pyth: see https://docs.pyth.network/price-feeds/core/contract-addresses/evm

### Frontend deployment

- Vercel: https://aptos-prediction-market-eight.vercel.app/
- Build command: `cd dapp && npm install && npm run build`
- Output: `dapp/dist/`

---

## Pyth price feed IDs

| Asset | Feed ID |
|-------|---------|
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |
| SOL/USD | `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` |

---

## Remappings (contracts-base/remappings.txt)

```
@openzeppelin/=lib/openzeppelin-contracts/
@prb/math/=lib/prb-math/src/
forge-std/=lib/forge-std/src/
```

---

## Roadmap

### Completed

| Phase | What | Status |
|-------|------|--------|
| 1-3 | Solidity contracts (MarketFactory, AMM, UMA, Pyth) — 121 tests | Done |
| 4 | Backend (indexer, keeper, tx service, API, WebSocket) | Done |
| 5 | AI agents (resolution, integrity, commentary, market creator) | Done |
| 6 | Frontend migration (wagmi v2, RainbowKit, Coinbase Smart Wallet) | Done |

### Phase 7: Gasless UX + Contract Deployment (next)

Deploy contracts to Base Sepolia. Integrate Coinbase CDP Paymaster for gasless trades. End-to-end: email signup → gasless first trade → position visible in portfolio.

### Phase 8: CLOB Hybrid Architecture

Off-chain order book + on-chain settlement (Polymarket-style). EIP-712 signed orders, operator matching server. Keep AMM as fallback for low-liquidity/long-tail markets. This is the biggest competitive gap vs Polymarket.

### Phase 9: Social Layer

User profiles (ENS/Basename resolution). Threaded comments on markets (moderated). Follow traders, share positions. Activity feed. Leaderboard rewards. Polymarket's social is weak — opportunity to do it right.

### Phase 10: Institutional API

Typed SDK (TypeScript + Python). Bulk order placement, portfolio management. Webhooks for market events. Historical data export. API keys with rate tiers. Market makers bring liquidity; liquidity brings retail.

### Phase 11: Advanced AI (Moat)

Trending topic detector → auto-create markets from news. AI liquidity manager. Natural language market search. AI risk scoring. This is the unique differentiator vs all competitors.

### Phase 12: Mobile + Notifications

React Native or Capacitor wrapper. Push notifications (resolved, price alerts). Biometric auth for trades.

### Phase 13: Data Partnerships + Growth

Embeddable prediction widgets for news sites. API for publishers to show market probabilities. Affiliate/referral program.

### Competitive positioning vs Polymarket

| Dimension | Polymarket | Our advantage |
|-----------|-----------|---------------|
| Onboarding | Crypto wallet required | Email/passkey via Coinbase Smart Wallet |
| Gas fees | User pays gas on Polygon | Gasless via Base Paymaster (Phase 7) |
| AI | Palantir partnership (surveillance only) | AI-native: auto-creation, resolution, commentary, integrity |
| Oracle | UMA only | UMA + Pyth (automated price resolution) |
| Chain | Polygon | Base (Coinbase ecosystem, Smart Wallet, lower fees) |
| Social | Unmoderated comments | Purpose-built social layer (Phase 9) |
| Trading | CLOB only | AMM + CLOB hybrid (Phase 8) — AMM bootstraps, CLOB scales |
