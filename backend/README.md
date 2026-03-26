# Based Backend

This service powers the DAO tooling, suggestion workflow, and Base chain integrations for the Based dApp. It is written in TypeScript using Express and Prisma, and exposes REST + WebSocket APIs.

## Getting Started

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # edit values for your environment
   ```

3. **Prepare the database**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:4000` by default.

### Required Environment Variables

Update `.env` with your project-specific details:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/based
CORS_ORIGIN=http://localhost:5173
SIGNATURE_TTL_MS=60000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
BASE_RPC_URL=https://sepolia.base.org
BASE_WS_URL=wss://sepolia.base.org
BASE_CHAIN_ID=84532
MARKET_FACTORY_ADDRESS=0x...
AMM_ADDRESS=0x...
CONDITIONAL_TOKENS_ADDRESS=0x...
USDC_ADDRESS=0x...
KEEPER_PRIVATE_KEY=0x...
RESOLVER_PRIVATE_KEY=0x...
```

## Project Structure

```
backend/
├── prisma/                # Prisma schema and migrations
├── src/
│   ├── blockchain/        # Chain adapters (Base EVM)
│   ├── config/            # Environment + logger config
│   ├── controllers/       # Express request handlers
│   ├── database/          # Prisma client
│   ├── middleware/        # Auth, role checks, rate limiting
│   ├── monitoring/        # Prometheus metrics
│   ├── routes/            # Express routers
│   ├── services/          # Business logic layer
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Helpers (signatures, dates, etc.)
└── tests/                 # Vitest suites
```

## Scripts

| Command         | Description                      |
|-----------------|----------------------------------|
| `npm run dev`   | Start server with hot reload      |
| `npm run build` | Compile TypeScript to `dist/`     |
| `npm start`     | Run compiled server               |
| `npm test`      | Run Vitest unit tests             |
| `npm run lint`  | Run ESLint on `src/`              |

## API Roadmap

- `POST /api/suggestions` – submit suggestion (wallet-signed)
- `GET /api/suggestions` – filter suggestions
- `PATCH /api/suggestions/:id/approve` – approve + publish
- `PATCH /api/suggestions/:id/vote` – community upvote
- `POST /api/roles/grant` – grant on-chain role (admin)
- `GET /api/roles/:address` – fetch roles + cache status
- `GET /api/markets` – cached on-chain market index

WebSocket channels provide real-time updates for suggestions and markets.

## Docker

Build and run the backend using Docker:

```bash
docker build -t based-backend ./backend
docker run --env-file .env -p 4000:4000 based-backend
```

## Continuous Integration

The repository ships with a GitHub Actions workflow (`.github/workflows/backend-ci.yml`) that installs dependencies, runs Prisma generate, executes lint/test, and builds the project on every push and pull request touching the backend code.

## Testing

All new logic should include unit or integration tests. Use `vitest` + `supertest` to validate controllers and services. See `tests/` for examples.

## Deployment

- Build container image using the provided `Dockerfile`
- Deploy to Render, Fly.io, or your preferred platform
- Point the frontend `VITE_API_URL` to the deployed endpoint
