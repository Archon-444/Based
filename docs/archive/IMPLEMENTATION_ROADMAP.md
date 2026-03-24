# Move Market - Implementation Roadmap
## From localStorage Mocks to Production

**Last Updated**: 2025-10-18  
**Current Status**: Frontend complete with localStorage mocks, backend scaffold exists but unused

---

## Executive Summary

Your Move Market platform has:
- ✅ **Beautiful Frontend**: Complete React app with best-in-class UX
- ✅ **Smart Contracts**: Deployed on Aptos testnet and initialized
- ✅ **Documentation**: Interactive guides surpassing competitors
- ❌ **Backend Integration**: API stubs, no database connection
- ❌ **Data Persistence**: Everything in localStorage
- ❌ **Authentication**: No wallet signature verification
- ❌ **On-Chain Operations**: Placeholders only

**Goal**: Transform from demo to production in 6.5 weeks (32 days)

---

## Current Architecture

```
Frontend (React)
    ↓
localStorage (❌ Mock data)
    ↓
Backend Stubs (❌ Not running)
    ↓
PostgreSQL (❌ Not setup)
    ↓
Aptos Blockchain (✅ Contracts deployed but unused)
```

**Target Architecture:**

```
Frontend (React)
    ↓
REST API (✅ With JWT auth)
    ↓
PostgreSQL (✅ Real persistence)
    ↓ (sync)
Aptos Blockchain (✅ Live transactions)
    ↓
Pyth Oracle (✅ Automated resolution)
```

---

## Milestone 0: Backend Live (Week 1-2)
**Priority**: CRITICAL  
**Duration**: 6 days  
**Goal**: Replace localStorage with real backend API + PostgreSQL

### Day 1: Database Setup
```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb aptos_prediction_market

# Setup backend
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://localhost:5432/aptos_prediction_market"
NODE_ENV=development
PORT=3001
JWT_SECRET=change-me-in-production
APTOS_MODULE_ADDRESS=0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81
```

```bash
# Run migrations
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio  # Verify tables created
```

**Deliverable**: PostgreSQL running with tables: `users`, `market_suggestions`, `markets`, `roles`

### Day 2-4: API Endpoints

Create these routes in `backend/routes/`:

**Suggestions API** (`suggestions.ts`):
- `POST /api/suggestions` - Create suggestion
- `GET /api/suggestions` - List all (with filters)
- `PATCH /api/suggestions/:id/approve` - Approve (creates market)
- `PATCH /api/suggestions/:id/reject` - Reject with reason

**Markets API** (`markets.ts`):
- `GET /api/markets` - List all markets
- `GET /api/markets/:id` - Get details
- `GET /api/markets/:id/bets` - Get betting history

**Roles API** (`roles.ts`):
- `GET /api/roles/:address` - Check user roles
- `POST /api/roles/grant` - Grant role (admin only)

**Start backend**:
```bash
npm run dev  # Runs on localhost:3001
```

**Test API**:
```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy","database":true}

curl -X POST http://localhost:3001/api/suggestions \
  -H "Content-Type: application/json" \
  -d '{"question":"Test?","outcomes":["Yes","No"],"duration":24}'
```

**Deliverable**: Working REST API with Postman collection

### Day 5-6: Connect Frontend

Create `dapp/src/services/apiClient.ts`:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = {
  suggestions: {
    create: async (data) => {
      const res = await fetch(`${API_BASE}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    list: async (status?: string) => {
      const url = status 
        ? `${API_BASE}/api/suggestions?status=${status}`
        : `${API_BASE}/api/suggestions`;
      const res = await fetch(url);
      return res.json();
    },
    approve: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/suggestions/${id}/approve`, {
        method: 'PATCH',
      });
      return res.json();
    },
  },
  markets: {
    list: async () => {
      const res = await fetch(`${API_BASE}/api/markets`);
      return res.json();
    },
  },
};
```

Update `dapp/.env`:
```env
VITE_API_URL=http://localhost:3001
```

**Update Components**:
1. `CreateMarketPage.tsx` - Use `apiClient.suggestions.create()`
2. `AdminSuggestionsPage.tsx` - Use `apiClient.suggestions.list()`
3. `MarketsPage.tsx` - Use `apiClient.markets.list()`

**Test End-to-End**:
1. Submit market suggestion → Saved to PostgreSQL
2. Admin approves → Status updated in DB
3. Markets page → Shows real data

**Deliverable**: Frontend 100% off localStorage, using backend API

---

## Milestone 1: Production Hardening (Week 3)
**Duration**: 5 days  
**Goal**: Add authentication, Docker, monitoring

### Day 7-8: Wallet Authentication

Add signature verification middleware (`backend/middleware/auth.ts`):
```typescript
import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';

const aptos = new Aptos(new AptosConfig({ network: 'testnet' }));

export const authenticateWallet = async (req, res, next) => {
  const { signature, message, publicKey } = req.headers;

  if (!signature || !message || !publicKey) {
    return res.status(401).json({ error: 'Missing auth headers' });
  }

  try {
    const isValid = await aptos.verifySignature({
      message,
      signature,
      publicKey,
    });

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    req.user = { address: publicKey };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Auth failed' });
  }
};
```

Apply to routes:
```typescript
router.post('/suggestions', authenticateWallet, async (req, res) => {
  // User is authenticated, req.user.address available
});
```

Frontend: Sign messages before requests (`dapp/src/utils/auth.ts`):
```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export const useAuthenticatedRequest = () => {
  const { signMessage, account } = useWallet();

  return async (url, options = {}) => {
    const message = JSON.stringify({
      timestamp: Date.now(),
      ...options.body,
    });

    const { signature } = await signMessage({ message });

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-Signature': signature,
        'X-Message': message,
        'X-Public-Key': account.publicKey,
      },
    });
  };
};
```

**Deliverable**: All API endpoints require wallet signature

### Day 9-10: Docker Setup

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aptos_prediction_market
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/aptos_prediction_market
      NODE_ENV: production

  frontend:
    build: ./dapp
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://backend:3001

volumes:
  postgres_data:
```

**Run entire stack**:
```bash
docker-compose up -d
```

**Deliverable**: One-command deployment

### Day 11: Monitoring

Add Winston logger (`backend/utils/logger.ts`):
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

Add health check:
```typescript
app.get('/health', async (req, res) => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`;
  res.json({
    status: 'healthy',
    database: !!dbHealthy,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
```

**Deliverable**: Production logging and health monitoring

---

## Milestone 2: On-Chain Integration (Week 4-5)
**Duration**: 9 days  
**Goal**: Connect backend to Aptos for real transactions

### Day 12-14: Aptos Service

Create `backend/services/aptosService.ts`:
```typescript
import { Aptos, AptosConfig, Network, Account } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

const MODULE_ADDRESS = process.env.APTOS_MODULE_ADDRESS!;

// Admin account for creating markets
const adminAccount = Account.fromPrivateKey({
  privateKey: process.env.ADMIN_PRIVATE_KEY!,
});

export const aptosService = {
  async createMarket(question: string, outcomes: string[], endTime: number, category: number) {
    const transaction = await aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::market_manager::create_market`,
        typeArguments: [],
        functionArguments: [question, outcomes, endTime, category],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction,
    });

    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    return { hash: committedTxn.hash, marketId: /* parse from event */ };
  },

  async getMarket(marketId: number) {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::market_manager::get_market_info`,
        typeArguments: [],
        functionArguments: [marketId],
      },
    });

    return parseMarketData(result);
  },

  async grantRole(userAddress: string, role: number) {
    const transaction = await aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::access_control::grant_role`,
        typeArguments: [],
        functionArguments: [userAddress, role],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction,
    });

    return await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  },
};
```

Update suggestion approval to create on-chain market:
```typescript
router.patch('/:id/approve', authenticateWallet, async (req, res) => {
  // Check user has MARKET_CREATOR role
  const hasRole = await checkRole(req.user.address, 'MARKET_CREATOR');
  if (!hasRole) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const suggestion = await prisma.suggestion.findUnique({ where: { id } });

  // Create market on-chain
  const { marketId, hash } = await aptosService.createMarket(
    suggestion.question,
    suggestion.outcomes,
    suggestion.endTime,
    suggestion.category
  );

  // Update database
  await prisma.suggestion.update({
    where: { id },
    data: {
      status: 'APPROVED',
      onChainMarketId: marketId,
      transactionHash: hash,
    },
  });

  res.json({ success: true, marketId, hash });
});
```

**Deliverable**: Backend can create markets on-chain

### Day 15-17: Event Indexer

Create market indexer (`backend/services/indexer.ts`):
```typescript
export const indexMarkets = async () => {
  const marketCount = await aptosService.getMarketCount();

  for (let i = 0; i < marketCount; i++) {
    const onChainMarket = await aptosService.getMarket(i);

    // Upsert to database
    await prisma.market.upsert({
      where: { onChainId: i },
      update: {
        question: onChainMarket.question,
        outcomes: onChainMarket.outcomes,
        endTime: new Date(onChainMarket.endTime * 1000),
        isResolved: onChainMarket.isResolved,
        winningOutcome: onChainMarket.winningOutcome,
      },
      create: {
        onChainId: i,
        ...onChainMarket,
      },
    });
  }

  logger.info(`Indexed ${marketCount} markets`);
};

// Run every 30 seconds
setInterval(indexMarkets, 30000);
```

Listen for events:
```typescript
export const listenForEvents = async () => {
  const events = await aptos.getAccountEventsByEventType({
    address: MODULE_ADDRESS,
    eventType: `${MODULE_ADDRESS}::market_manager::MarketCreated`,
  });

  for (const event of events) {
    await handleMarketCreatedEvent(event);
  }
};
```

**Deliverable**: Real-time blockchain synchronization

### Day 18-20: Frontend Integration

Update frontend to show on-chain data:
```typescript
// dapp/src/hooks/useMarkets.ts
export const useMarkets = () => {
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      const data = await apiClient.markets.list();
      setMarkets(data);
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  return { markets };
};
```

Test flow:
1. Submit suggestion
2. Admin approves → Transaction sent to blockchain
3. Markets page shows new market with on-chain data
4. Place bet (user transaction)
5. Market resolves
6. Claim winnings

**Deliverable**: End-to-end on-chain market lifecycle

---

## Milestone 3: Oracle Integration (Week 6)
**Duration**: 5 days  
**Goal**: Automated resolution using Pyth

### Day 21-22: Pyth Integration

Create oracle service (`backend/services/oracleService.ts`):
```typescript
import { PriceServiceConnection } from '@pythnetwork/price-service-client';

const pythClient = new PriceServiceConnection('https://hermes.pyth.network');

export const oracleService = {
  async getCurrentPrice(feedId: string) {
    const priceFeeds = await pythClient.getLatestPriceFeeds([feedId]);
    const price = priceFeeds[0].getPriceNoOlderThan(60); // Max 60s old

    return {
      price: price.price,
      expo: price.expo,
      confidence: price.conf,
    };
  },

  async resolveMarket(marketId: number) {
    const market = await prisma.market.findUnique({ where: { id: marketId } });

    if (!market.priceFeedId) {
      throw new Error('No price feed configured for market');
    }

    const { price } = await this.getCurrentPrice(market.priceFeedId);

    // Determine winner: if price > target, outcome 0 wins; else outcome 1
    const winningOutcome = price > market.targetPrice ? 0 : 1;

    // Resolve on-chain
    await aptosService.resolveMarket(market.onChainId, winningOutcome);

    // Update database
    await prisma.market.update({
      where: { id: marketId },
      data: {
        isResolved: true,
        winningOutcome,
        resolvedAt: new Date(),
      },
    });

    logger.info(`Market ${marketId} resolved with outcome ${winningOutcome}`);
  },
};
```

**Deliverable**: Oracle price fetching works

### Day 23-24: Scheduled Resolution

Add cron job (`backend/jobs/marketResolution.ts`):
```typescript
import cron from 'node-cron';

// Run every minute
cron.schedule('*/1 * * * *', async () => {
  const marketsToResolve = await prisma.market.findMany({
    where: {
      endTime: { lt: new Date() },
      isResolved: false,
      priceFeedId: { not: null },
    },
  });

  logger.info(`Found ${marketsToResolve.length} markets to resolve`);

  for (const market of marketsToResolve) {
    try {
      await oracleService.resolveMarket(market.id);
    } catch (error) {
      logger.error(`Failed to resolve market ${market.id}:`, error);
    }
  }
});
```

**Deliverable**: Automated market resolution

### Day 25: Multi-Oracle Support

Create oracle abstraction:
```typescript
interface IOracleProvider {
  getCurrentPrice(feedId: string): Promise<number>;
}

class PythOracle implements IOracleProvider { /* ... */ }
class ChainlinkOracle implements IOracleProvider { /* ... */ }
class SupraOracle implements IOracleProvider { /* ... */ }

// Factory pattern
export const getOracle = (type: string): IOracleProvider => {
  switch (type) {
    case 'pyth': return new PythOracle();
    case 'chainlink': return new ChainlinkOracle();
    case 'supra': return new SupraOracle();
    default: throw new Error('Unknown oracle');
  }
};
```

**Deliverable**: Support for multiple oracle providers

---

## Milestone 4: Production Ready (Week 7)
**Duration**: 7 days  
**Goal**: Testing, docs, deployment

### Day 26-28: Testing

Integration tests:
```typescript
describe('Market Creation Flow', () => {
  it('should create market suggestion, approve, and place bet', async () => {
    // 1. Submit suggestion
    const suggestion = await apiClient.suggestions.create({
      question: 'Will BTC hit $100k?',
      outcomes: ['Yes', 'No'],
      duration: 24,
    });

    // 2. Admin approves
    await apiClient.suggestions.approve(suggestion.id);

    // 3. Verify on-chain
    const market = await aptosService.getMarket(suggestion.onChainMarketId);
    expect(market.question).toBe('Will BTC hit $100k?');

    // 4. Place bet
    await placeBet(market.id, 0, 100);

    // 5. Verify bet recorded
    const bets = await apiClient.markets.getBets(market.id);
    expect(bets).toHaveLength(1);
  });
});
```

**Deliverable**: 80%+ test coverage

### Day 29-30: Documentation

Update `backend/README.md`:
```markdown
# Move Market Backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup PostgreSQL:
   ```bash
   createdb aptos_prediction_market
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start server:
   ```bash
   npm run dev
   ```

## API Documentation

### Endpoints

- `POST /api/suggestions` - Create market suggestion
- `GET /api/markets` - List markets
- ... (full API docs)

## Architecture

(Add diagrams here)
```

**Deliverable**: Complete developer onboarding

### Day 31-32: Production Deployment

Deploy to production:
```bash
# Setup production server (AWS/GCP/Azure)
# Configure domain & SSL
# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Verify
curl https://api.movemarket.com/health
```

**Deliverable**: Live production environment

---

## Summary & Next Steps

### Timeline
- **Week 1-2**: Backend Live (M0) - 6 days
- **Week 3**: Production Hardening (M1) - 5 days  
- **Week 4-5**: On-Chain Integration (M2) - 9 days
- **Week 6**: Oracle Integration (M3) - 5 days
- **Week 7**: Production Ready (M4) - 7 days
- **Total**: 32 days (~6.5 weeks)

### Start Today
```bash
# 1. Setup PostgreSQL
brew install postgresql@15
createdb aptos_prediction_market

# 2. Setup backend
cd backend
npm install
npx prisma migrate dev --name init

# 3. Start backend
npm run dev

# 4. Update frontend .env
cd ../dapp
echo "VITE_API_URL=http://localhost:3001" >> .env

# 5. Test
curl http://localhost:3001/health
```

### Success Metrics
- [ ] Frontend creates suggestion via API (not localStorage)
- [ ] Suggestions persisted in PostgreSQL
- [ ] Admin can approve via API
- [ ] Markets page shows database data
- [ ] On-chain market created when approved
- [ ] Users can place bets on-chain
- [ ] Markets auto-resolve via Pyth oracle
- [ ] Production deployment live

**Once M0 is complete**, you'll have eliminated all localStorage and have a working full-stack app with real persistence. Then authentication (M1), blockchain (M2), oracles (M3), and production (M4) follow naturally.

Good luck! 🚀
