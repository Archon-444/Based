# Sui Integration Testing Guide - Complete Cycle

## ✅ Environment Status

**Backend**: Running on http://localhost:3001
**Frontend**: Running on http://localhost:5173
**Network**: Sui Devnet
**Package ID**: `0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3`

---

## 🎯 Testing Steps

### Step 1: Get Sui Devnet Tokens

1. Install Sui Wallet browser extension:
   - Chrome: https://chrome.google.com/webstore/detail/sui-wallet
   - Or use any Sui-compatible wallet (e.g., Suiet, Ethos)

2. Create/import a wallet and switch to **Devnet** network

3. Get test SUI tokens from the faucet:
   ```bash
   # Via CLI (if you have sui installed)
   sui client faucet

   # Or visit the web faucet
   # https://discord.com/channels/916379725201563759/971488439931392130
   ```

   Alternatively, use the Sui Discord faucet channel.

---

### Step 2: Connect Wallet to dApp

1. Open http://localhost:5173 in your browser

2. Click **"Connect Wallet"** button

3. Select **Sui** chain from the chain selector

4. Approve the wallet connection

5. Verify your wallet address appears in the UI

---

### Step 3: Create a Test Market

1. Navigate to **"Create Market"** page

2. Fill in market details:
   - **Question**: "Will Bitcoin reach $100k by end of 2025?"
   - **Outcomes**: ["Yes", "No"] (or any custom outcomes)
   - **End Date**: Select a future date
   - **Category**: Choose a category
   - **Initial Liquidity**: 10 SUI (or whatever you have)

3. Click **"Create Market"**

4. Approve the transaction in your Sui wallet

5. **IMPORTANT**: Copy the transaction digest/hash when it succeeds

---

### Step 4: Extract Object IDs from Transaction

Once the transaction is confirmed, you need to extract the created object IDs:

**Option A: Via Sui Explorer**

1. Go to https://suiscan.xyz/devnet or https://suivision.xyz/devnet

2. Paste your transaction digest/hash

3. Look for "Created Objects" section

4. You should see multiple objects created:
   - **Market object** (shared object)
   - **Shard objects** (array of shared objects)
   - **Queue object** (shared object)

5. Copy all these object IDs

**Option B: Via CLI**

```bash
# If you have sui CLI installed
sui client object <OBJECT_ID> --json

# Or query the transaction
sui client tx <TX_DIGEST> --json
```

---

### Step 5: Populate Database with Object IDs

Now wire up the backend database so betting works:

```bash
# Connect to your database
psql -U philippeschmitt -d prediction_market

# Or use the full path
/opt/homebrew/opt/postgresql@15/bin/psql -U philippeschmitt -d prediction_market
```

Then run this SQL (replace with your actual object IDs):

```sql
-- First, find your market's onChainId
SELECT id, "onChainId", chain, question FROM "Market" WHERE chain = 'sui' ORDER BY "createdAt" DESC LIMIT 1;

-- Update with Sui object IDs (replace these with your actual values)
UPDATE "Market"
SET "suiMarketObjectId" = '0xYOUR_MARKET_OBJECT_ID',
    "suiShardObjectIds" = ARRAY['0xSHARD1', '0xSHARD2', '0xSHARD3', '0xSHARD4'],
    "suiQueueObjectId" = '0xYOUR_QUEUE_OBJECT_ID'
WHERE "onChainId" = 'THE_ON_CHAIN_ID' AND "chain" = 'sui';

-- Verify the update
SELECT "onChainId", "suiMarketObjectId", "suiShardObjectIds", "suiQueueObjectId"
FROM "Market" WHERE chain = 'sui';
```

**Pro Tip**: The market creation transaction emits events that contain these IDs. Look for:
- `MarketCreated` event
- Object IDs in the transaction effects

---

### Step 6: Test the API Endpoint

Verify the backend can fetch object IDs:

```bash
# Test the endpoint (replace 0 with your market's onChainId)
curl http://localhost:3001/api/markets/sui/objects/0 | jq

# Expected response:
{
  "marketObjectId": "0x...",
  "shardObjectIds": ["0x...", "0x...", "0x...", "0x..."],
  "queueObjectId": "0x..."
}
```

If you get a 404, either:
- The market wasn't created in the database yet (check event indexer)
- The object IDs weren't populated in Step 5

---

### Step 7: Place a Bet

1. Go back to the frontend (http://localhost:5173)

2. Find your newly created market

3. Select an outcome to bet on

4. Enter bet amount (e.g., 1 SUI)

5. Click **"Place Bet"**

6. Approve the transaction in your wallet

7. Verify:
   - Transaction succeeds
   - Your bet appears in the UI
   - Market odds update
   - Your balance decreases

---

### Step 8: Test Market Resolution (Oracle)

For markets with oracle resolution:

1. Wait for the market end date to pass (or create a market with a very short duration)

2. The backend market resolver will automatically check for resolvable markets every 5 minutes

3. Or manually trigger resolution via the admin panel (if implemented)

4. Check the backend logs for resolution activity:
   ```bash
   # Backend logs will show:
   [MarketResolver] Checking markets for resolution...
   [PythOracle] Fetching price for BTC/USD...
   ```

---

### Step 9: Claim Winnings

1. After market is resolved, go to the market page

2. If you bet on the winning outcome, click **"Claim Winnings"**

3. Approve the transaction

4. Verify you receive your payout

---

## 🔍 Troubleshooting

### Wallet Connection Issues

- Make sure you're on **Devnet** in your Sui wallet
- Clear browser cache and refresh
- Check browser console for errors
- Ensure wallet extension is updated

### Transaction Failures

**"Insufficient gas"**
- Get more SUI from the faucet

**"Object not found"**
- The object IDs in the database may be incorrect
- Verify object IDs on Sui Explorer
- Re-run the database UPDATE query with correct IDs

**"Invalid signer"**
- Make sure you're connected with the correct wallet
- Some actions require admin capabilities

### Backend API Issues

**404 on /api/markets/sui/objects/:marketId**
- Market may not exist in database
- Check if event indexer is running (backend logs)
- Verify object IDs were populated in database

**CORS errors**
- Backend CORS is set to http://localhost:5173
- Make sure you're accessing from the correct origin

### Database Issues

```bash
# Check if markets exist
/opt/homebrew/opt/postgresql@15/bin/psql -U philippeschmitt -d prediction_market -c "SELECT * FROM \"Market\" WHERE chain = 'sui';"

# Check if object IDs are set
/opt/homebrew/opt/postgresql@15/bin/psql -U philippeschmitt -d prediction_market -c "SELECT \"onChainId\", \"suiMarketObjectId\", \"suiShardObjectIds\" FROM \"Market\" WHERE chain = 'sui';"
```

---

## 📊 Monitoring

### Backend Logs

The backend automatically indexes events and syncs markets. Watch for:

```
[EventIndexer] Fetching events
[EventIndexer] Processing MarketCreated event
[MarketResolver] Checking markets for resolution
[PythOracle] Fetching price data
```

### Frontend Console

Open browser DevTools (F12) and check:
- Network requests to backend API
- Wallet connection status
- Transaction signing events
- Any JavaScript errors

### Sui Explorer

Monitor all on-chain activity:
- https://suiscan.xyz/devnet (recommended)
- https://suivision.xyz/devnet
- https://explorer.sui.io/?network=devnet

---

## 🎉 Success Criteria

You've successfully completed the full cycle when:

✅ Wallet connects to dApp on Sui chain
✅ Market creation transaction succeeds
✅ Backend API returns object IDs for the market
✅ You can place a bet and transaction confirms
✅ Market odds update in the UI
✅ (Optional) Market resolves automatically
✅ (Optional) You can claim winnings

---

## 📝 Notes

- **Market Creation Gas**: Creating a market costs more gas than betting (~0.1-0.5 SUI)
- **Sharding**: Markets use 4 shards by default for parallel betting
- **Object IDs**: Must be manually populated until auto-indexing is implemented
- **Devnet**: All testing is on Devnet - no real money involved

---

## 🚀 Next Steps

Once testing is successful:

1. **Automate Object ID Indexing**
   - Implement a service to watch Sui events
   - Auto-populate database when markets are created
   - See `SUI_WALLET_INTEGRATION_SOLUTION.md` for details

2. **Add Admin UI**
   - Create admin panel for manual market resolution
   - Add tools to populate object IDs manually

3. **Deploy to Testnet**
   - Once devnet testing passes, deploy to Sui testnet
   - Update environment variables
   - Test with testnet tokens

4. **Production Readiness**
   - Security audit
   - Load testing
   - Monitoring and alerts setup

---

## 🆘 Getting Help

If you encounter issues:

1. Check backend logs for errors
2. Check frontend console for errors
3. Verify transaction on Sui Explorer
4. Check database state
5. Review this guide step-by-step

For Sui-specific issues:
- Sui Discord: https://discord.gg/sui
- Sui Docs: https://docs.sui.io

---

**Happy Testing!** 🎲
