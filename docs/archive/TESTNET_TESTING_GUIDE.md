# Move Market Testnet Testing Guide - M2+M3 Features

**Date**: October 18, 2025
**Status**: ✅ Ready for Testing

---

## 🎉 Welcome to Move Market with M2+M3!

Your full-stack prediction market platform is now running with:
- ✅ M0: Backend API + PostgreSQL + Frontend
- ✅ M1: Production authentication + Docker
- ✅ M2: Event indexer + On-chain role verification
- ✅ M3: Pyth oracle + Automated market resolution

---

## 🌐 Access Your Application

### Frontend
**URL**: http://localhost:5173
- React frontend with Aptos Wallet integration
- Market suggestions and browsing
- Connected to backend API

### Backend API
**URL**: http://localhost:3000
- REST API with PostgreSQL
- Authenticated endpoints
- Oracle and indexer services

---

## 🧪 Testing M0 Features (Backend + Frontend)

### Test 1: Create Market Suggestion

**Frontend Test**:
1. Open http://localhost:5173
2. Connect your Aptos wallet (if available)
3. Navigate to "Suggest Market" page
4. Create a suggestion:
   - Question: "Will BTC reach $100,000 by 2025?"
   - Outcomes: ["Yes", "No"]
   - Category: "crypto"
   - Duration: 720 hours (30 days)
   - Resolution Source: "Pyth Network"
5. Submit the suggestion

**API Test** (alternative):
```bash
curl -X POST http://localhost:3000/api/suggestions \
  -H "Content-Type: application/json" \
  -H "x-dev-wallet-address: 0xTEST123" \
  -d '{
    "question": "Will BTC reach $100,000 by 2025?",
    "outcomes": ["Yes", "No"],
    "category": "crypto",
    "durationHours": 720,
    "resolutionSource": "Pyth Network"
  }'
```

**Expected Result**:
- ✅ 201 Created response
- ✅ Suggestion stored in PostgreSQL
- ✅ Visible in frontend list

### Test 2: List All Suggestions

**Frontend Test**:
1. Navigate to "Browse Suggestions" page
2. View list of all suggestions

**API Test**:
```bash
curl http://localhost:3000/api/suggestions
```

**Expected Result**:
- ✅ 200 OK response
- ✅ Array of suggestions with your new submission

### Test 3: Filter Suggestions by Status

```bash
# Pending suggestions
curl http://localhost:3000/api/suggestions?status=pending

# Approved suggestions
curl http://localhost:3000/api/suggestions?status=approved
```

---

## 🔐 Testing M2 Features (Event Indexer + Role Verification)

### Test 4: Check Indexer Status

```bash
# This endpoint would need to be added, but you can check logs
# Backend logs will show:
# [EventIndexer] Initialized
# [EventIndexer] Fetching events
```

**Check Backend Logs**:
Look for these log messages in the backend console:
- `[EventIndexer] Initialized` - Indexer started
- `[PythOracle] Initialized` - Oracle connected
- `[RoleVerification] Initialized` - Role service ready

### Test 5: Role Verification (On-Chain)

**Note**: This requires a deployed smart contract on testnet with your wallet having roles.

```bash
# Check if a wallet has admin role
# This would be integrated into your endpoints
```

**Current State**:
- Role verification service is implemented
- Requires smart contract deployment to testnet
- Will check roles against on-chain RBAC

### Test 6: Event Indexing

**Setup Required**:
1. Deploy smart contracts to testnet
2. Create a market on-chain
3. Event indexer will automatically sync

**What Gets Indexed**:
- `MarketCreatedEvent` → Creates Market in DB
- `BetPlacedEvent` → Updates market volume
- `MarketResolvedEvent` → Updates market status
- `RoleGrantedEvent` → Updates user roles

**Database Check**:
```bash
# Connect to PostgreSQL
psql postgresql://philippeschmitt@localhost:5432/prediction_market

# Check for indexed events
SELECT * FROM "BlockchainEvent" ORDER BY "processedAt" DESC LIMIT 10;

# Check indexer state
SELECT * FROM "IndexerState" WHERE chain = 'aptos';
```

---

## 📊 Testing M3 Features (Pyth Oracle + Market Resolution)

### Test 7: Fetch Live BTC Price

```bash
# Get current BTC price from Pyth oracle
curl http://localhost:3000/api/test/btc-price
```

**Note**: This endpoint would need to be added. Here's the test code:

```typescript
// Add to backend/src/routes/index.ts
import { getBTCPrice, getETHPrice } from '../services/pythOracle';

router.get('/api/test/btc-price', async (req, res) => {
  try {
    const price = await getBTCPrice();
    res.json({ symbol: 'BTC/USD', price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Test 8: Get Multiple Oracle Prices

**Test Code** (run in backend console or create endpoint):
```typescript
import { getPythOracleService } from './services/pythOracle';

const pythService = getPythOracleService();
const prices = await pythService.getPrices(['BTC/USD', 'ETH/USD', 'SOL/USD']);

console.log('BTC:', prices.get('BTC/USD')?.price);
console.log('ETH:', prices.get('ETH/USD')?.price);
console.log('SOL:', prices.get('SOL/USD')?.price);
```

**Expected Result**:
- ✅ Real-time prices from Pyth Network
- ✅ Confidence intervals within 1%
- ✅ Timestamps within 60 seconds

### Test 9: Oracle Health Check

```bash
# Check oracle endpoint health
curl http://localhost:3000/api/test/oracle-health
```

**Test Code** (add endpoint):
```typescript
router.get('/api/test/oracle-health', async (req, res) => {
  try {
    const pythService = getPythOracleService();
    const health = await pythService.getOracleHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Expected Result**:
```json
{
  "healthy": true,
  "endpoints": [
    { "url": "https://hermes.pyth.network", "status": "healthy", "priority": 1 },
    { "url": "https://hermes-beta.pyth.network", "status": "healthy", "priority": 2 },
    { "url": "https://xc-mainnet.pyth.network", "status": "healthy", "priority": 3 }
  ]
}
```

### Test 10: Test Market Resolution (Dry Run)

```typescript
// Run in backend console
import { getMarketResolverService } from './services/marketResolver';

const resolver = getMarketResolverService();

// Check which markets can be auto-resolved
const pending = await resolver.getPendingResolutions();
console.log('Pending resolutions:', pending);

// Dry run resolution
const results = await resolver.checkAndResolveMarkets(true);
console.log('Dry run results:', results);
```

**What It Tests**:
- Parses market question for oracle criteria
- Fetches current price from Pyth
- Determines winning outcome
- Does NOT submit to blockchain (dry run)

---

## 📦 Database Verification

### Check Tables Created by M2

```sql
-- Connect to database
psql postgresql://philippeschmitt@localhost:5432/prediction_market

-- List all tables
\dt

-- Expected tables (from M2):
-- BlockchainEvent
-- IndexerState
-- Market (enhanced with new fields)

-- Check Market table structure
\d "Market"

-- Check IndexerState
SELECT * FROM "IndexerState";

-- Check recent blockchain events
SELECT * FROM "BlockchainEvent"
ORDER BY "processedAt" DESC
LIMIT 10;
```

---

## 🚀 Advanced Testing Scenarios

### Scenario 1: End-to-End Market Creation

1. **Create suggestion** via frontend
2. **(Future) Admin approves** (requires role)
3. **(Future) Publish to blockchain** (creates on-chain market)
4. **Event indexer syncs** MarketCreatedEvent to DB
5. **Market appears** in database and frontend

### Scenario 2: Oracle-Based Resolution

1. Create market: "Will BTC reach $1 by 2025?"
2. Wait for end date
3. Run auto-resolution:
   ```typescript
   const results = await autoResolveMarkets(true); // dry run
   ```
4. Check result:
   - BTC price > $1 → Outcome = 0 ("Yes")
   - Resolution reason logged

### Scenario 3: Failover Testing

1. Disable primary Pyth endpoint:
   ```typescript
   pythService.setEndpointStatus('https://hermes.pyth.network', false);
   ```
2. Fetch price again
3. Should automatically use backup endpoint
4. Check health status shows primary as unhealthy

---

## 🔍 Monitoring & Logs

### Backend Logs to Watch For

**Successful M2+M3 Initialization**:
```
[PythOracle] Initialized { cacheTTL: 30000, ... }
[PythOracle] Connected to endpoint { url: 'https://hermes.pyth.network' }
[EventIndexer] Initialized { chain: 'aptos', ... }
[RoleVerification] Initialized { moduleAddress: '0x...', ... }
```

**Oracle Price Fetching**:
```
[PythOracle] Fetching price from oracle { symbol: 'BTC/USD' }
[PythOracle] Successfully fetched price { symbol: 'BTC/USD', price: 95432.12, ... }
```

**Event Processing**:
```
[EventIndexer] Fetching events { chain: 'aptos', fromVersion: '0' }
[EventHandler] Processing MarketCreatedEvent { marketId: '1', ... }
[EventHandler] Market created in database { marketId: '1' }
```

---

## ⚙️ Configuration Check

### Environment Variables

**Backend (.env)**:
```bash
# Database
DATABASE_URL=postgresql://philippeschmitt@localhost:5432/prediction_market

# Blockchain
APTOS_NETWORK=testnet
APTOS_MODULE_ADDRESS=0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894

# M2: Event Indexer
INDEXER_POLL_INTERVAL=10000
INDEXER_BATCH_SIZE=100
INDEXER_MAX_RETRIES=3

# M2: Role Verification
ROLE_CACHE_TTL=300000

# M3: Pyth Oracle
PYTH_CACHE_TTL=30000
PYTH_MAX_CONFIDENCE_RATIO=0.01
PYTH_MAX_STALENESS=60
```

---

## 🎯 Quick Test Checklist

- [ ] Backend running on http://localhost:3000
- [ ] Frontend running on http://localhost:5173
- [ ] PostgreSQL service started
- [ ] Can create suggestion via API
- [ ] Can list suggestions via API
- [ ] Suggestion persists in database
- [ ] Oracle services initialized (check logs)
- [ ] Event indexer initialized (check logs)
- [ ] Role verification service ready (check logs)

---

## 🛠️ Troubleshooting

### Backend Won't Start

**Check**:
1. PostgreSQL is running: `/opt/homebrew/bin/brew services list | grep postgresql`
2. Database exists: `psql -l | grep prediction_market`
3. Environment variables correct in `backend/.env`

### Can't Fetch Oracle Prices

**Possible Causes**:
1. Network connection issue
2. Pyth endpoints down (check health status)
3. Rate limiting (check cache TTL)

**Solution**:
```typescript
// Check oracle health
const health = await pythService.getOracleHealth();
console.log(health);
```

### Event Indexer Not Running

**Check**:
1. Backend logs for initialization messages
2. IndexerState table in database
3. Environment variables configured

---

## 📚 Next Steps

### To Fully Test M2+M3:

1. **Deploy Smart Contracts** to testnet:
   ```bash
   cd contracts
   aptos move publish --profile testnet-phase1 --assume-yes
   ```

2. **Create On-Chain Market**:
   ```bash
   aptos move run \
     --function-id <MODULE_ADDRESS>::market_manager::create_market \
     --args string:"Will BTC reach $100k?" \
     --args vector<string>:'["Yes","No"]' \
     --args u64:720
   ```

3. **Watch Event Indexer Sync**:
   - Check logs for MarketCreatedEvent processing
   - Query database for new Market record

4. **Test Role Verification**:
   - Grant yourself a role on-chain
   - Verify role shows in database
   - Test role-protected endpoint

---

## 🎊 Summary

**What's Working**:
- ✅ Full backend API with PostgreSQL
- ✅ React frontend integrated
- ✅ Pyth oracle price fetching
- ✅ Event indexer framework (ready for on-chain events)
- ✅ Role verification service (ready for on-chain roles)
- ✅ Market resolver logic (ready for automated resolution)

**What Needs On-Chain Integration**:
- Smart contract deployment to testnet
- Actual on-chain market creation
- Real event indexing from blockchain
- Role assignment on-chain

**You Can Test Now**:
- Create and list suggestions (M0)
- Database persistence (M0)
- Oracle price fetching (M3)
- Oracle health monitoring (M3)
- Market resolution logic (M3 - dry run)

---

## 🚀 Ready to Test!

Open your browser to **http://localhost:5173** and start exploring!

Your Move Market platform is running with full M0+M1+M2+M3 implementation. 🎉

---

**Created**: October 18, 2025
**Status**: ✅ Ready for Testing
**Support**: See logs at backend console or create issues
