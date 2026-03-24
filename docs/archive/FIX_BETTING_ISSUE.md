# 🔧 Fix Betting Transaction Failure

Your betting transaction is failing with "Generic error" because the backend event indexer hasn't synced your Aptos market yet. Here's how to fix it:

---

## ✅ Current Status

- ✅ Backend running on port 4000
- ✅ Event indexer is running
- ✅ Sui market indexed (1 market found)
- ❌ Aptos market NOT indexed yet (0 markets found)

---

## 🔍 Why Betting Fails

The Aptos smart contract (`betting::place_bet`) requires:

1. **Market exists in contract** ✅ (You created it on-chain)
2. **Backend has synced market state** ❌ (Event indexer hasn't picked it up yet)
3. **Your wallet is registered for USDC** ❓ (Need to check)

The transaction simulation fails because the backend hasn't indexed your market's `collateral_vault` data, so the contract aborts with `E_INVALID_ARGUMENT`.

---

## 🛠️ Solution Steps

### Step 1: Verify Your Market Exists On-Chain

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/contracts

# Check total market count
aptos move view \
  --function-id 0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81::market_manager::get_active_market_count \
  --profile testnet-deploy

# If result > 0, your market exists! Get details:
aptos move view \
  --function-id 0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81::market_manager::get_market_full \
  --args u64:0 \
  --profile testnet-deploy
```

**Expected:** Should show your market with question, outcomes, etc.

---

### Step 2: Force Backend to Index Your Market

The event indexer polls every 10 seconds from version 0. If your market was created recently, wait 30-60 seconds for it to be picked up.

**Check if indexed:**
```bash
curl -s "http://localhost:4000/api/markets?chain=aptos" | python3 -m json.tool
```

**If still empty after 60 seconds:**

The indexer might have started after your market was created. You need to either:

**Option A: Bootstrap the market manually** (fastest)
```bash
# Find your market creation transaction hash from Petra wallet history
TX_HASH="YOUR_MARKET_CREATION_TX_HASH"

# Use backend to bootstrap
curl -X POST http://localhost:4000/api/markets/aptos/bootstrap \
  -H "Content-Type: application/json" \
  -d "{\"transactionHash\": \"$TX_HASH\"}"
```

**Option B: Reset indexer to scan from beginning**
```sql
# Connect to database
/opt/homebrew/opt/postgresql@15/bin/psql -U philippeschmitt -d prediction_market

# Reset Aptos indexer state
UPDATE "IndexerState"
SET "lastProcessedVersion" = 0, "isRunning" = false
WHERE "chain" = 'aptos';

# Exit and restart backend
\q
```

Then restart the backend - it will rescan from version 0.

---

### Step 3: Register for USDC (If Needed)

Even with USDC balance, your wallet must be "registered" for the USDC coin store.

**Check if registered:**
```bash
aptos account list \
  --account YOUR_WALLET_ADDRESS \
  --network testnet | grep 69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832
```

**If not found, register:**

In your dApp, look for:
- "Register USDC" button
- "Claim USDC" button
- Or any initialization step

**Or via CLI:**
```bash
# This needs to call the USDC register function
# Usually done automatically by the dApp when you first interact
```

---

## 📋 Complete Checklist

Before attempting to bet again:

- [ ] Backend running on port 4000
- [ ] Event indexer running (check logs)
- [ ] Your Aptos market shows in: `curl http://localhost:4000/api/markets?chain=aptos`
- [ ] Market has valid state (pools, liquidityParam, etc.)
- [ ] You have USDC in wallet (check Petra)
- [ ] Wallet is registered for USDC coin

---

## 🧪 Test Betting Again

Once your market is indexed:

1. **Refresh the dApp page** (hard refresh: Cmd+Shift+R)
2. **Navigate to your market**
3. **Select an outcome** (Yes/No)
4. **Enter bet amount** (try small first, like 1 USDC)
5. **Submit transaction**
6. **Check simulation** - should pass now!
7. **Sign and confirm**

---

## 🔍 Debugging Commands

### Check Backend Health
```bash
curl http://localhost:4000/health
```

### Check Aptos Markets in DB
```bash
curl -s "http://localhost:4000/api/markets?chain=aptos" | python3 -m json.tool
```

### Check Indexer Status
```bash
# View backend logs
tail -f /tmp/backend-*.log | grep EventIndexer
```

### Check Database State
```sql
psql -U philippeschmitt -d prediction_market -c "SELECT * FROM \"Market\" WHERE chain = 'aptos';"
psql -U philippeschmitt -d prediction_market -c "SELECT * FROM \"IndexerState\" WHERE chain = 'aptos';"
```

### Check On-Chain Market
```bash
cd contracts
aptos move view \
  --function-id 0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81::market_manager::get_market_full \
  --args u64:0 \
  --profile testnet-deploy
```

---

## 🚨 Common Issues

### "Market not found" error
**Problem:** Backend hasn't indexed your market
**Solution:** Follow Step 2 above to force indexing

### "E_INVALID_ARGUMENT" error
**Problem:** Market state missing from database
**Solution:** Ensure backend event indexer has synced

### "Insufficient USDC" error
**Problem:** Not enough USDC or not registered
**Solution:** Get USDC from faucet + register wallet

### Transaction simulation fails
**Problem:** Any of the above
**Solution:** Work through checklist systematically

---

## 💡 Quick Fix (Most Common)

**If backend just started:**
1. Wait 60 seconds for indexer to catch up
2. Refresh dApp page
3. Try betting again

**If market created before backend started:**
1. Reset indexer: `UPDATE "IndexerState" SET "lastProcessedVersion" = 0`
2. Restart backend
3. Wait 60 seconds
4. Try betting again

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ `curl http://localhost:4000/api/markets?chain=aptos` returns your market
2. ✅ Market has non-empty `outcomePools` array
3. ✅ Transaction simulation passes in wallet
4. ✅ You can sign and submit the bet
5. ✅ Bet appears in your positions

---

## 📞 Still Having Issues?

If betting still fails after following these steps:

1. **Check backend logs** for errors:
   ```bash
   tail -100 /tmp/backend-*.log | grep -i error
   ```

2. **Verify market on-chain** matches database:
   ```bash
   # On-chain
   aptos move view --function-id ...::market_manager::get_market_full --args u64:0

   # In database
   curl http://localhost:4000/api/markets?chain=aptos
   ```

3. **Try creating a new market** and betting on that one instead

4. **Check the smart contract** is deployed and accessible

---

**The key issue is: Backend event indexer needs to sync your market before you can bet!**
