# Based

A decentralized prediction market on **Base** (Coinbase L2). Trade outcomes on real-world events using USDC, with AI-powered market operations and gasless onboarding.

## What's Under the Hood

- **Gnosis Conditional Token Framework** (ERC-1155) for outcome tokens
- **Dual oracle system** — UMA Optimistic Oracle for subjective events, Pyth Network for automated price resolution
- **CPMM + LMSR AMM** — constant-product for binary markets, logarithmic scoring for multi-outcome
- **AI agents** — auto-resolution, integrity guardian (dispute detection), market commentary, market creation (Anthropic Claude)
- **Coinbase Smart Wallet + RainbowKit** — email/passkey onboarding, no seed phrases
- **Gasless transactions** via Base Paymaster (Phase 7)

## Project Status

**Phase 6 complete** (March 2026) — testnet deployed to Base Sepolia. See [CONTEXT.md](CONTEXT.md) for the full living status document.

| Component | Status | Details |
| --- | --- | --- |
| Smart contracts | 121 tests passing | MarketFactory, AMM, UMA adapter, Pyth adapter |
| Backend | Deployed on Render | Express + Prisma + viem, event indexer, keeper, WebSocket |
| Frontend | Deployed on Vercel | React 18, wagmi v2, RainbowKit, 18 routes |
| AI agents | Feature-flagged | Resolution, integrity, commentary, market creator |

**Honest status:** Pre-audit. Testnet only. USDC integration is a dev shim (no real Circle plumbing yet). Not production-ready.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Contracts | Solidity 0.8.24, Foundry, OpenZeppelin v5, PRBMath SD59x18 |
| Backend | Node.js, Express, Prisma, viem, PostgreSQL |
| Frontend | React 18, Vite, TypeScript, wagmi v2, RainbowKit, TailwindCSS |
| AI | Anthropic Claude SDK (optional, feature-flagged) |
| Oracles | UMA Optimistic Oracle V3, Pyth Network |
| Deployment | Vercel (frontend), Render (backend), Base Sepolia (contracts) |

## Deployed Contracts (Base Sepolia)

| Contract | Address |
| --- | --- |
| MarketFactory | `0x51baebd534f1b56003dcf11587874f9c9fa6f41a` |
| PredictionMarketAMM | `0x5c775990facaddcc608a7770f78a8e57f401b93e` |
| ConditionalTokens | `0xaf64d3778a5c065499e2ce22bf94d949ea353c87` |
| USDC (testnet) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Pyth | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` |
| UMA OOV3 | `0x0F7fC5E6482f096380db6158f978167b57388deE` |

## Quick Start

### Prerequisites

- Node.js 18+
- [Foundry](https://getfoundry.sh/) (for contract development)
- PostgreSQL

### Install & Run

```bash
# Clone
git clone https://github.com/Archon-444/Based.git
cd Based

# Frontend
cd dapp
npm install
npm run dev          # http://localhost:5173

# Backend (separate terminal)
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev          # http://localhost:4000

# Contract tests
cd contracts-base
forge test           # 121 tests
```

## Repository Structure

```
based/
├── contracts-base/       # Solidity contracts (Foundry)
│   ├── src/              # ConditionalTokens, MarketFactory, AMM, Oracle adapters
│   ├── test/             # 121 tests (MarketFactory, AMM, UMA, Pyth)
│   └── script/           # Deployment scripts
├── backend/              # Node.js API + services
│   ├── src/
│   │   ├── agents/       # AI agents (resolution, integrity, commentary)
│   │   ├── blockchain/   # viem clients, ABIs, event indexer
│   │   ├── routes/       # REST API endpoints
│   │   ├── services/     # Keeper, transaction, market services
│   │   └── websocket/    # Real-time updates
│   └── prisma/           # Database schema & migrations
├── dapp/                 # React frontend
│   ├── src/
│   │   ├── pages/        # 18 routes (markets, trading, admin, LP)
│   │   ├── hooks/        # 40+ custom hooks (wagmi, API, contracts)
│   │   ├── config/       # wagmi config, contract ABIs
│   │   └── components/   # UI components
│   └── public/
├── docs/                 # Architecture, security, oracle docs
│   ├── audit/            # Audit prep materials
│   ├── analysis/         # Competitive & gap analysis
│   ├── runbooks/         # Ops runbooks
│   └── archive/          # Historical docs
├── monitoring/           # Prometheus/Grafana manifests
├── CONTEXT.md            # Living project status (start here)
├── Dockerfile            # Backend container
├── render.yaml           # Render deployment config
└── vercel.json           # Vercel frontend config
```

## Environment Variables

Key variables for local development. See `.env.example` for the full list.

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BASE_RPC_URL` | Base RPC endpoint (default: `https://sepolia.base.org`) |
| `MARKET_FACTORY_ADDRESS` | MarketFactory contract address |
| `AMM_ADDRESS` | PredictionMarketAMM contract address |
| `CONDITIONAL_TOKENS_ADDRESS` | ConditionalTokens contract address |
| `VITE_BASE_CHAIN_ID` | Chain ID (`84532` for Base Sepolia) |
| `VITE_FACTORY_ADDRESS` | MarketFactory address (frontend) |
| `VITE_API_URL` | Backend API URL |
| `AGENT_ENABLED` | Master switch for AI agents (default: `false`) |
| `ANTHROPIC_API_KEY` | Anthropic API key (only if agents enabled) |

## API

The backend exposes REST + WebSocket:

- `GET /api/markets` — list markets (with chain filter)
- `GET /api/markets/:chain/:onChainId` — market detail
- `GET /api/trades/:marketId` — trade history (paginated)
- `GET /api/portfolio/:address` — user positions + P&L
- `GET /api/leaderboard` — trader rankings
- `WebSocket /ws` — real-time trade, price, and commentary updates (per-market subscriptions)

## Documentation

- **[CONTEXT.md](CONTEXT.md)** — Living project status and architecture overview
- **[docs/SETUP.md](docs/SETUP.md)** — Detailed setup guide
- **[docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)** — Roadmap and upcoming phases
- **[docs/USDC_INTEGRATION.md](docs/USDC_INTEGRATION.md)** — USDC integration details
- **[docs/HYBRID_ARCHITECTURE_SECURITY.md](docs/HYBRID_ARCHITECTURE_SECURITY.md)** — Security architecture
- **[docs/audit/](docs/audit/)** — Audit preparation materials

## Security

Smart contracts have **not been externally audited**. The project is on testnet only. Do not use with real funds.

If you find a security issue, please open a GitHub issue or reach out directly.

## License

MIT — see [LICENSE](LICENSE).
