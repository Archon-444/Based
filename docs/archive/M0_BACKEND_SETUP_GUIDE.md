# M0: Backend Live - Complete Setup Guide
## Replace localStorage with PostgreSQL + REST API

**Duration**: 6-8 days  
**Goal**: Eliminate localStorage and have working full-stack application

---

## Current Status

✅ **Backend scaffold exists**  
✅ **Prisma schema is perfect** (Suggestion, User, Market, RoleChange models)  
✅ **Dependencies installed** (node_modules exists)  
✅ **Frontend ready** (needs to connect to API)  
❌ **PostgreSQL not installed**  
❌ **Database not created**  
❌ **API endpoints not implemented**  
❌ **Frontend still using localStorage**

---

## Step 1: Install & Setup PostgreSQL (30 minutes)

### Install PostgreSQL
```bash
# Install PostgreSQL 15
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify installation
psql --version
# Should show: psql (PostgreSQL) 15.x
```

### Create Database
```bash
# Create database
createdb aptos_prediction_market

# Verify database exists
psql -l | grep aptos_prediction_market
```

###Configure Environment
```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/backend

# Create .env file
cat > .env << 'ENV_EOF'
DATABASE_URL="postgresql://$(whoami)@localhost:5432/aptos_prediction_market"
NODE_ENV=development
PORT=3001
JWT_SECRET=change-me-in-production-use-long-random-string
APTOS_MODULE_ADDRESS=0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81
APTOS_NETWORK=testnet
ENV_EOF
```

### Run Prisma Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Verify tables created
npx prisma studio
# Opens browser at http://localhost:5555
# You should see: Suggestion, User, Market, RoleChange, SuggestionEvent tables
```

**✅ Checkpoint**: PostgreSQL running, database created, tables exist

---

## Step 2: Check Backend Implementation (1 hour)

### Check Existing Routes
```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/backend

# List route files
ls -la src/routes/

# Expected files:
# - suggestions.ts (or suggestions.js)
# - markets.ts
# - roles.ts
# - health.ts
```

### Check Main Server File
```bash
# Find main entry point
cat package.json | grep "main\|start"

# Likely: src/index.ts or src/server.ts
ls -la src/index.ts src/server.ts
```

### Test Backend Starts
```bash
# Try starting backend
npm run dev

# Expected output:
# Server running on http://localhost:3001
# OR errors showing which routes/files need implementation
```

**If backend starts**: Great! Check http://localhost:3001/health

**If backend has errors**: Note which files need implementation (likely routes)

---

## Step 3: Implement Missing API Endpoints (2-3 days)

Based on Gemini audit, you need these endpoints:

### A. Suggestions Routes (`src/routes/suggestions.ts`)

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/suggestions - Create suggestion
router.post('/', async (req, res) => {
  try {
    const { question, outcomes, category, durationHours, resolutionSource, proposer } = req.body;

    // Validation
    if (!question || !outcomes || !proposer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (outcomes.length < 2) {
      return res.status(400).json({ error: 'At least 2 outcomes required' });
    }

    // Create suggestion
    const suggestion = await prisma.suggestion.create({
      data: {
        question,
        outcomes,
        category,
        durationHours,
        resolutionSource,
        proposer,
        status: 'pending',
        chain: 'aptos',
      },
    });

    // Create event
    await prisma.suggestionEvent.create({
      data: {
        suggestionId: suggestion.id,
        eventType: 'submitted',
        actorWallet: proposer,
      },
    });

    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Create suggestion error:', error);
    res.status(500).json({ error: 'Failed to create suggestion' });
  }
});

// GET /api/suggestions - List suggestions
router.get('/', async (req, res) => {
  try {
    const { status, proposer } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (proposer) where.proposer = proposer;

    const suggestions = await prisma.suggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });

    res.json(suggestions);
  } catch (error) {
    console.error('List suggestions error:', error);
    res.status(500).json({ error: 'Failed to list suggestions' });
  }
});

// PATCH /api/suggestions/:id/approve - Approve suggestion
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer } = req.body; // From authenticated user

    // TODO: Check if user has MARKET_CREATOR role

    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: {
        status: 'approved',
        reviewer,
        approvedAt: new Date(),
      },
    });

    // Create event
    await prisma.suggestionEvent.create({
      data: {
        suggestionId: id,
        eventType: 'approved',
        actorWallet: reviewer,
      },
    });

    // TODO M2: Create market on-chain here

    res.json(suggestion);
  } catch (error) {
    console.error('Approve suggestion error:', error);
    res.status(500).json({ error: 'Failed to approve suggestion' });
  }
});

// PATCH /api/suggestions/:id/reject - Reject suggestion
router.patch('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer, reason } = req.body;

    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewer,
        reviewReason: reason,
      },
    });

    // Create event
    await prisma.suggestionEvent.create({
      data: {
        suggestionId: id,
        eventType: 'rejected',
        actorWallet: reviewer,
        metadata: { reason },
      },
    });

    res.json(suggestion);
  } catch (error) {
    console.error('Reject suggestion error:', error);
    res.status(500).json({ error: 'Failed to reject suggestion' });
  }
});

export default router;
```

### B. Markets Routes (`src/routes/markets.ts`)

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/markets - List markets
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const markets = await prisma.market.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(markets);
  } catch (error) {
    console.error('List markets error:', error);
    res.status(500).json({ error: 'Failed to list markets' });
  }
});

// GET /api/markets/:id - Get market details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const market = await prisma.market.findUnique({
      where: { id },
    });

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // TODO M2: Fetch on-chain data and merge

    res.json(market);
  } catch (error) {
    console.error('Get market error:', error);
    res.status(500).json({ error: 'Failed to get market' });
  }
});

export default router;
```

### C. Update Main Server (`src/index.ts` or `src/server.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import suggestionsRouter from './routes/suggestions';
import marketsRouter from './routes/markets';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/suggestions', suggestionsRouter);
app.use('/api/markets', marketsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
```

### Test API Endpoints
```bash
# Start backend
cd backend
npm run dev

# In another terminal, test endpoints:

# 1. Health check
curl http://localhost:3001/health

# 2. Create suggestion
curl -X POST http://localhost:3001/api/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Will BTC hit $100k by 2026?",
    "outcomes": ["Yes", "No"],
    "category": "crypto",
    "durationHours": 168,
    "proposer": "0x123abc"
  }'

# 3. List suggestions
curl http://localhost:3001/api/suggestions

# 4. List suggestions by status
curl "http://localhost:3001/api/suggestions?status=pending"
```

**✅ Checkpoint**: Backend running, API endpoints working, data persisting to PostgreSQL

---

## Step 4: Create Frontend API Client (1 day)

### Create API Client Service
```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/dapp
```

Create `src/services/apiClient.ts`:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = {
  suggestions: {
    async create(data: {
      question: string;
      outcomes: string[];
      category?: string;
      durationHours: number;
      resolutionSource?: string;
      proposer: string;
    }) {
      const response = await fetch(`${API_BASE}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create suggestion');
      }

      return response.json();
    },

    async list(status?: string) {
      const url = status
        ? `${API_BASE}/api/suggestions?status=${status}`
        : `${API_BASE}/api/suggestions`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      return response.json();
    },

    async approve(id: string, reviewer: string) {
      const response = await fetch(`${API_BASE}/api/suggestions/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve suggestion');
      }

      return response.json();
    },

    async reject(id: string, reviewer: string, reason: string) {
      const response = await fetch(`${API_BASE}/api/suggestions/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject suggestion');
      }

      return response.json();
    },
  },

  markets: {
    async list() {
      const response = await fetch(`${API_BASE}/api/markets`);

      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }

      return response.json();
    },

    async get(id: string) {
      const response = await fetch(`${API_BASE}/api/markets/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch market');
      }

      return response.json();
    },
  },
};
```

### Update .env
```bash
echo "VITE_API_URL=http://localhost:3001" >> dapp/.env
```

---

## Step 5: Update Frontend Pages (1-2 days)

### A. Update CreateMarketPage

Find and replace the `submitMarketSuggestion` call:

**Before (localStorage)**:
```typescript
import { submitMarketSuggestion } from '../services/suggestionsApi';

// In handleSubmitSuggestion:
await submitMarketSuggestion({
  proposer: account.address,
  question,
  outcomes,
  category,
  durationHours,
  resolutionSource,
});
```

**After (API)**:
```typescript
import { apiClient } from '../services/apiClient';

// In handleSubmitSuggestion:
await apiClient.suggestions.create({
  proposer: account.address,
  question,
  outcomes,
  category,
  durationHours,
  resolutionSource,
});
```

### B. Update AdminSuggestionsPage

Replace localStorage calls with API:

```typescript
import { apiClient } from '../services/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch suggestions
const { data: suggestions, isLoading } = useQuery({
  queryKey: ['suggestions', status],
  queryFn: () => apiClient.suggestions.list(status),
});

// Approve mutation
const queryClient = useQueryClient();
const approveMutation = useMutation({
  mutationFn: (id: string) => apiClient.suggestions.approve(id, userAddress),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    toast.success('Suggestion approved!');
  },
});

// Reject mutation
const rejectMutation = useMutation({
  mutationFn: ({ id, reason }: { id: string; reason: string }) =>
    apiClient.suggestions.reject(id, userAddress, reason),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    toast.success('Suggestion rejected');
  },
});
```

### C. Update MarketsPage

```typescript
import { apiClient } from '../services/apiClient';
import { useQuery } from '@tanstack/react-query';

// Fetch markets
const { data: markets, isLoading } = useQuery({
  queryKey: ['markets'],
  queryFn: () => apiClient.markets.list(),
  refetchInterval: 30000, // Refresh every 30 seconds
});
```

### Install React Query (if not already)
```bash
cd dapp
npm install @tanstack/react-query
```

Add provider in `App.tsx`:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

---

## Step 6: Test End-to-End (1 day)

### Test Flow
1. **Start both servers**:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd dapp && npm run dev
   ```

2. **Test suggestion creation**:
   - Visit http://localhost:5173/create
   - Connect wallet
   - Fill out form
   - Submit suggestion
   - Check backend logs: Should see POST /api/suggestions
   - Check database: `npx prisma studio` - suggestion should appear

3. **Test admin review**:
   - Visit admin page (exact route depends on your setup)
   - See pending suggestions
   - Click approve/reject
   - Verify database updated

4. **Test markets page**:
   - Visit http://localhost:5173/markets
   - Should show markets from database (empty initially)

### Verification Checklist
- [ ] Backend running on :3001
- [ ] Frontend running on :5173
- [ ] Suggestion created via UI → saved to PostgreSQL
- [ ] Admin can see pending suggestions
- [ ] Approve/reject updates database
- [ ] No more localStorage usage
- [ ] Browser console: no errors
- [ ] Network tab: API calls successful

---

## Step 7: Remove localStorage (30 minutes)

Once API is working, remove old localStorage code:

```bash
cd dapp

# Find and remove localStorage usage
grep -r "localStorage" src/

# Delete old suggestionsApi.ts if it used localStorage
rm src/services/suggestionsApi.ts  # Only if obsolete
```

---

## Success Criteria

✅ **Backend**:
- PostgreSQL running
- Database tables created
- API endpoints implemented
- Server starts without errors
- Health check responds

✅ **Frontend**:
- API client created
- All pages use API instead of localStorage
- React Query for data fetching
- No localStorage references remain

✅ **Integration**:
- Create suggestion → Saves to database
- Admin approve → Updates database
- Markets page → Fetches from database
- Data persists across page refreshes

✅ **Testing**:
- Manual E2E flow works
- No console errors
- API requests successful

---

## Next Steps (After M0 Complete)

Once M0 is done, you'll have:
- ✅ Real data persistence
- ✅ Working REST API
- ✅ Full-stack application functional

**Then move to M1 (Production Hardening)**:
1. Add wallet signature authentication
2. Input validation
3. Docker setup
4. CI/CD pipeline
5. Monitoring/logging

**See**: [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) for full plan

---

## Troubleshooting

### PostgreSQL won't start
```bash
# Check if already running
brew services list | grep postgresql

# Force restart
brew services restart postgresql@15

# Check logs
tail -f /usr/local/var/log/postgres.log
```

### Database connection error
```bash
# Verify DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL

# Test connection
psql -d aptos_prediction_market -c "SELECT 1;"
```

### Prisma client errors
```bash
# Regenerate client
cd backend
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Port already in use
```bash
# Find process on port 3001
lsof -ti:3001

# Kill it
kill -9 $(lsof -ti:3001)
```

### CORS errors in browser
Check backend has:
```typescript
app.use(cors()); // Allow all origins (dev only)
```

---

## Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Install PostgreSQL | 30 min | ⏳ TODO |
| Create database | 15 min | ⏳ TODO |
| Run migrations | 15 min | ⏳ TODO |
| Implement API endpoints | 2 days | ⏳ TODO |
| Create API client | 4 hours | ⏳ TODO |
| Update frontend pages | 1 day | ⏳ TODO |
| Test E2E | 4 hours | ⏳ TODO |
| Remove localStorage | 30 min | ⏳ TODO |
| **Total** | **~6 days** | |

---

## Questions?

Check:
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Full 32-day plan
- [GEMINI_AUDIT_REPORT.md](./GEMINI_AUDIT_REPORT.md) - Security audit findings
- Backend README.md (if exists)

**You're ready to start M0! Begin with Step 1: Install PostgreSQL** 🚀
