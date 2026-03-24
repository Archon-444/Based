# Complete Testnet Deployment Guide - Ready to Go Live

**Date**: October 18, 2025
**Status**: ✅ Contracts Compiled Successfully - Ready for Deployment

---

## 🎉 Current Status

✅ **Smart contracts compiled successfully**
✅ **Move.toml configured for testnet**
✅ **Backend M0+M1+M2+M3 implemented**
✅ **Frontend configured**
✅ **PostgreSQL running**

**Deployment Account**: `0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162` (testnet-verify)

---

## 📋 Pre-Deployment Checklist

- [ ] Get testnet APT from faucet (need ~2 APT for deployment)
- [ ] Deploy smart contracts to testnet
- [ ] Initialize all contract modules
- [ ] Update backend/.env with deployed address
- [ ] Update dapp/.env with deployed address
- [ ] Start backend server
- [ ] Start frontend server
- [ ] Test end-to-end functionality

---

## 🚀 Step 1: Fund Your Testnet Account

Visit the Aptos testnet faucet and fund your account:

**Faucet URL**: https://aptos.dev/en/network/faucet

**Your Address**: `0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162`

Request **2 APT** (enough for deployment + initialization)

**Verify funds**:
```bash
/Users/philippeschmitt/.local/bin/aptos account list \
  --profile testnet-verify
```

---

## 🚀 Step 2: Deploy Smart Contracts

### Deploy to Testnet

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/contracts

/Users/philippeschmitt/.local/bin/aptos move publish \
  --profile testnet-verify \
  --named-addresses admin=0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162 \
  --assume-yes \
  --included-artifacts none
```

**Expected Output**:
```json
{
  "Result": {
    "transaction_hash": "0x...",
    "gas_used": 2537,
    "gas_unit_price": 100,
    "sender": "0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162",
    "success": true
  }
}
```

**✅ Success Indicator**: `"success": true`

**Your deployed contract address**: `0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162`

---

## 🚀 Step 3: Initialize Contract Modules

After deployment, you need to initialize each module:

### 3.1 Initialize market_manager

```bash
/Users/philippeschmitt/.local/bin/aptos move run \
  --function-id 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162::market_manager::initialize \
  --profile testnet-verify \
  --assume-yes
```

### 3.2 Initialize collateral_vault

```bash
/Users/philippeschmitt/.local/bin/aptos move run \
  --function-id 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162::collateral_vault::initialize \
  --args vector<u8>:0x7661756c74 address:0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832 \
  --profile testnet-verify \
  --assume-yes

# Inspect the derived vault address (needed by backend + scripts)
/Users/philippeschmitt/.local/bin/aptos move view \
  --function-id 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162::collateral_vault::get_vault_address

# Confirm the vault is pointing at the expected Circle USDC metadata object
/Users/philippeschmitt/.local/bin/aptos move view \
  --function-id 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162::collateral_vault::get_metadata_object
```

### 3.3 Initialize betting

```bash
/Users/philippeschmitt/.local/bin/aptos move run \
  --function-id 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162::betting::initialize \
  --profile testnet-verify \
  --assume-yes
```

### 3.4 Initialize oracle registry

```bash
/Users/philippeschmitt/.local/bin/aptos move run \
  --function-id 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162::oracle::initialize \
  --args vector<u8>:0x6f7261636c65 \
  --profile testnet-verify \
  --assume-yes

# Oracle registry initialization relies on the vault metadata view above.
```

**✅ All modules should return `"success": true`**

---

## 🔧 Step 4: Update Backend Configuration

Edit `backend/.env`:

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/backend
```

**Update these lines**:
```env
# Blockchain
APTOS_NETWORK=testnet
APTOS_MODULE_ADDRESS=0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162

# M2: Event Indexer Configuration
INDEXER_POLL_INTERVAL=10000
INDEXER_BATCH_SIZE=100
INDEXER_MAX_RETRIES=3
INDEXER_RETRY_DELAY=5000

# M2: Role Verification
ROLE_CACHE_TTL=300000

# M3: Pyth Oracle Configuration
PYTH_CACHE_TTL=30000
PYTH_MAX_CONFIDENCE_RATIO=0.01
PYTH_MAX_STALENESS=60
```

**Already configured** ✅

---

## 🔧 Step 5: Update Frontend Configuration

Edit `dapp/.env`:

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/dapp
```

**Update these lines**:
```env
# Network Configuration
VITE_NETWORK=testnet

# Contract Address (IMPORTANT - use your deployed address!)
VITE_MODULE_ADDRESS=0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162

# API Configuration
VITE_API_URL=http://localhost:3000
```

**Check current frontend config**:
```bash
cat /Users/philippeschmitt/Documents/aptos-prediction-market/dapp/.env
```

**Update if needed**.

---

## 🚀 Step 6: Start All Services

### Kill all zombie processes first

```bash
killall -9 node 2>/dev/null
killall -9 tsx 2>/dev/null
sleep 3
```

### Start PostgreSQL (if not running)

```bash
/opt/homebrew/bin/brew services start postgresql@15
```

### Start Backend Server

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/backend
npm run dev
```

**Expected Output**:
```
[PythOracle] Initialized
[EventIndexer] Initialized
[RoleVerification] Initialized
Backend listening on port 3000
```

Leave this terminal running.

### Start Frontend Server (new terminal)

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/dapp
npm run dev
```

**Expected Output**:
```
VITE v5.4.20  ready in 142 ms
➜  Local:   http://localhost:5173/
```

Leave this terminal running.

---

## ✅ Step 7: Verify Deployment

### 7.1 Check Smart Contract Deployed

```bash
# View market_manager module
curl "https://fullnode.testnet.aptoslabs.com/v1/accounts/0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162/module/market_manager"
```

**Expected**: JSON response with module bytecode (not an error)

### 7.2 Check Backend API

```bash
# Test suggestions endpoint
curl http://localhost:3000/api/suggestions
```

**Expected**: `[]` or array of suggestions

### 7.3 Check Frontend

Open browser: http://localhost:5173

**Expected**:
- ✅ Page loads without errors
- ✅ Wallet connection works
- ✅ No "Module not found" errors in console

---

## 🧪 Step 8: End-to-End Test

### Test 1: Create Market Suggestion (Backend API)

```bash
curl -X POST http://localhost:3000/api/suggestions \
  -H "Content-Type: application/json" \
  -H "x-dev-wallet-address: 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162" \
  -d '{
    "question": "Will BTC reach $100,000 by 2025?",
    "outcomes": ["Yes", "No"],
    "category": "crypto",
    "durationHours": 720,
    "resolutionSource": "Pyth Network"
  }'
```

**Expected**: 201 Created with suggestion data

### Test 2: Create Market On-Chain (via CLI)

```bash
/Users/philippeschmitt/.local/bin/aptos move run \
  --function-id 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162::market_manager::create_market \
  --args string:"Will ETH reach $10,000?" \
  --args 'vector<string>:["Yes","No"]' \
  --args u64:720 \
  --profile testnet-verify \
  --assume-yes
```

**Expected**: Transaction succeeds, `MarketCreatedEvent` emitted

### Test 3: Verify Event Indexer Syncs

Check backend logs for:
```
[EventIndexer] Fetching events
[EventHandler] Processing MarketCreatedEvent
[EventHandler] Market created in database
```

Check database:
```bash
psql postgresql://philippeschmitt@localhost:5432/prediction_market \
  -c "SELECT * FROM \"Market\" ORDER BY \"createdAt\" DESC LIMIT 5;"
```

**Expected**: New market record in database

### Test 4: Test Pyth Oracle

```bash
# Add this test endpoint to backend/src/routes/index.ts first:
# router.get('/api/test/oracle', async (req, res) => {
#   const pythService = getPythOracleService();
#   const btc = await pythService.getPrice('BTC/USD');
#   const eth = await pythService.getPrice('ETH/USD');
#   res.json({ btc, eth });
# });

curl http://localhost:3000/api/test/oracle
```

**Expected**: Current BTC and ETH prices from Pyth Network

---

## 📊 System Status Dashboard

### Check All Services Running

```bash
# PostgreSQL
/opt/homebrew/bin/brew services list | grep postgresql

# Backend
lsof -i :3000

# Frontend
lsof -i :5173
```

### Check Blockchain Data

```bash
# Get market count
/Users/philippeschmitt/.local/bin/aptos move view \
  --function-id 0xc13beff7c0135927cfb2b4872ded9fb554e64eee7fad2c47c699aede68358162::market_manager::get_market_count \
  --profile testnet-verify
```

### Check Database Tables

```bash
psql postgresql://philippeschmitt@localhost:5432/prediction_market -c "\dt"
```

**Expected tables**:
- Suggestion
- SuggestionEvent
- User
- RoleChange
- Market
- BlockchainEvent
- IndexerState

---

## 🎯 Go Live Checklist

- [ ] ✅ Smart contracts deployed to testnet
- [ ] ✅ All modules initialized
- [ ] ✅ Backend configured with deployed address
- [ ] ✅ Frontend configured with deployed address
- [ ] ✅ PostgreSQL running
- [ ] ✅ Backend server running (port 3000)
- [ ] ✅ Frontend server running (port 5173)
- [ ] ✅ Can create suggestions via API
- [ ] ✅ Can create markets on-chain
- [ ] ✅ Event indexer syncing blockchain to database
- [ ] ✅ Pyth oracle fetching prices
- [ ] ✅ Frontend loads without errors

---

## 🐛 Troubleshooting

### Issue: "Module not found"

**Solution**: Make sure VITE_MODULE_ADDRESS in dapp/.env matches your deployed address

### Issue: Backend can't connect to database

**Solution**:
```bash
# Check PostgreSQL running
/opt/homebrew/bin/brew services start postgresql@15

# Verify database exists
psql -l | grep prediction_market
```

### Issue: Event indexer not syncing

**Solution**: Check backend logs for errors. Verify APTOS_MODULE_ADDRESS matches deployed address.

### Issue: Can't create markets on-chain

**Solution**:
1. Check testnet funds: `aptos account list --profile testnet-verify`
2. Verify modules initialized (Step 3)
3. Check if you have MarketCreator role

---

## 🎊 Success Criteria

### ✅ Fully Deployed When:

1. **Smart Contract**: Deployed and verified on testnet explorer
2. **Backend API**: Running and responding to requests
3. **Frontend**: Loads and connects to wallet
4. **Database**: Storing suggestions and markets
5. **Event Indexer**: Syncing on-chain events to database
6. **Oracle**: Fetching live prices from Pyth Network
7. **End-to-End**: Can create suggestion → approve → publish → on-chain market

---

## 📝 Next Steps After Deployment

1. **Test Frontend UX**: Navigate all pages, test wallet connection
2. **Create Test Markets**: Create 5-10 test markets on-chain
3. **Test Role System**: Grant/revoke roles, test permissions
4. **Monitor Event Indexer**: Watch logs for event processing
5. **Test Oracle Resolution**: Create price-based market, test resolution logic
6. **Performance Testing**: Test with multiple concurrent users
7. **Security Review**: Review access controls, test edge cases

---

## 🚀 Production Deployment (After Testnet)

Once tested on testnet, for mainnet deployment:

1. Create new mainnet profile: `aptos init --profile mainnet`
2. Fund mainnet account (real APT needed)
3. Update Move.toml with mainnet addresses
4. Deploy to mainnet: `aptos move publish --profile mainnet`
5. Update backend/frontend .env to `mainnet`
6. Add monitoring (Sentry, Datadog)
7. Set up alerting
8. Enable HTTPS/SSL
9. Configure CDN
10. Launch! 🎉

---

## 📊 Monitoring & Analytics

### Backend Logs

Watch for:
- `[EventIndexer]` - Event sync activity
- `[PythOracle]` - Price fetch requests
- `[RoleVerification]` - Role check requests
- API request logs

### Database Queries

```sql
-- Count markets
SELECT COUNT(*) FROM "Market";

-- Recent events
SELECT * FROM "BlockchainEvent"
ORDER BY "processedAt" DESC
LIMIT 10;

-- Indexer status
SELECT * FROM "IndexerState";

-- User roles
SELECT * FROM "User"
WHERE "onChainRolesSynced" = true;
```

---

## 🎉 You're Ready to Deploy!

Follow the steps above in order and you'll have a fully functional testnet deployment with:

- ✅ Smart contracts on Aptos testnet
- ✅ Backend API with M0+M1+M2+M3 features
- ✅ Event indexer syncing blockchain
- ✅ Pyth oracle integration
- ✅ Role-based access control
- ✅ Automated market resolution (framework)

**Start with Step 1** (fund your account) and work through each step sequentially.

---

**Document Created**: October 18, 2025
**Status**: Ready for Deployment
**Estimated Time**: 30-45 minutes for full deployment
