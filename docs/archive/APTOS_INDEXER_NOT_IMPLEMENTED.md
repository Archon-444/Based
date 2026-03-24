# Aptos Event Indexer Not Implemented

**Status:** ❌ **CRITICAL ISSUE DISCOVERED**
**Date:** 2025-10-27
**Impact:** Betting on Aptos markets cannot work until this is resolved

---

## 🔍 Root Cause

The Aptos event indexer in the backend is **not actually implemented**. The code at [backend/src/services/eventIndexer.ts:350-355](backend/src/services/eventIndexer.ts#L350-L355) shows:

```typescript
// Note: Simplified event fetching for now
// TODO: Implement proper event fetching when indexer is needed
const response: RawEvent[] = [];

// For now, we'll rely on manual indexing or direct contract queries
// Real implementation would use Aptos indexer API or node events endpoint
```

**What this means:**
- The indexer polls every 10 seconds but always returns an empty array
- It never actually fetches events from the Aptos blockchain
- Markets created on-chain are **never** automatically synced to the database
- Betting transactions fail because the backend doesn't have market/vault data

---

## 📊 Evidence

### Backend Logs
```
[EventIndexer] Fetching events (fromVersion: 0)
[EventIndexer] No new events found
[EventIndexer] Fetching events (fromVersion: 0)
[EventIndexer] No new events found
... (repeats every 10 seconds)
```

### Database State
```sql
SELECT * FROM "IndexerState" WHERE "chain" = 'aptos';
-- Result: lastProcessedVersion = 0 (never advances)

SELECT COUNT(*) FROM "Market" WHERE chain = 'aptos';
-- Result: 0 (no markets indexed)
```

### User's Aptos Market
- ✅ Market exists on-chain (user successfully created it)
- ❌ Market NOT in database (indexer never found it)
- ❌ Betting fails with `E_INVALID_ARGUMENT` (contract can't find market data)

---

## 🛠️ Solutions

### Option 1: Implement Full Event Indexer (Recommended for Production)

The Aptos SDK provides methods to fetch events. You need to implement:

```typescript
// In fetchModuleEvents()
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

// Fetch events from account's event store
const events = await aptos.getAccountEventsByEventType({
  accountAddress: this.config.moduleAddress,
  eventType: `${this.config.moduleAddress}::market_manager::MarketCreatedEvent`,
  minimumLedgerVersion: fromVersion,
  options: {
    limit: 100
  }
});
```

**Files to modify:**
- [backend/src/services/eventIndexer.ts](backend/src/services/eventIndexer.ts#L322-L393)

**Estimated work:** 2-4 hours
- Implement event fetching for all event types
- Handle pagination for large result sets
- Add proper error handling
- Test with existing on-chain markets

---

### Option 2: Manual Market Sync (Quick Workaround)

Create an admin endpoint that syncs a market by transaction hash:

**Step 1: Create sync endpoint**

```typescript
// backend/src/routes/markets.ts
router.post('/markets/aptos/sync', async (req, res) => {
  const { transactionHash } = req.body;

  // Fetch transaction from Aptos
  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
  const tx = await aptos.getTransactionByHash({ transactionHash });

  // Extract market creation event
  const events = tx.events?.filter(e =>
    e.type.includes('MarketCreatedEvent')
  );

  if (events.length === 0) {
    return res.status(404).json({ error: 'Market creation event not found' });
  }

  // Process event and create market in database
  await processMarketCreatedEvent(events[0]);

  res.json({ success: true, marketId: events[0].data.market_id });
});
```

**Step 2: Find your market creation transaction hash**

Check your Petra wallet transaction history or use Aptos Explorer:
- https://explorer.aptoslabs.com/account/YOUR_WALLET_ADDRESS?network=testnet
- Look for the most recent `create_market` transaction

**Step 3: Sync the market**

```bash
MARKET_TX_HASH="YOUR_TRANSACTION_HASH_HERE"

curl -X POST http://localhost:4000/api/markets/aptos/sync \
  -H "Content-Type: application/json" \
  -d "{\"transactionHash\": \"$MARKET_TX_HASH\"}"
```

---

### Option 3: Query Markets Directly from Chain (No Database)

Instead of relying on the database, query market state directly from the Aptos contract when betting:

**Pros:**
- No indexer needed
- Always up-to-date with on-chain state
- Simpler architecture

**Cons:**
- Higher latency (blockchain query for every request)
- More expensive (more RPC calls)
- Harder to implement complex queries/filters

**Implementation:**
- Modify [backend/src/controllers/markets.controller.ts](backend/src/controllers/markets.controller.ts)
- Use Aptos SDK to query `market_manager` resource directly
- Cache results briefly to reduce RPC load

---

## 🚨 Why Sui Markets Work

The Sui event indexer **is fully implemented** at [backend/src/services/suiEventIndexer.ts](backend/src/services/suiEventIndexer.ts). It uses:

```typescript
const events = await this.suiClient.queryEvents({
  query: {
    MoveEventType: `${packageId}::${module}::${eventType}`
  },
  cursor: this.cursor,
  limit: this.batchSize,
  order: 'ascending'
});
```

This is why:
- ✅ Sui market was successfully indexed (1 market found)
- ✅ Sui betting would work (if you tried it)

---

## 📋 Immediate Action Items

### For Testing Right Now

**Option A: Implement Manual Sync Endpoint (Fastest)**
1. Create the sync endpoint described in Option 2
2. Find your market creation transaction hash from Petra wallet
3. Call the sync endpoint to index your market
4. Try betting again

**Option B: Use Sui Instead**
1. You already have a working Sui market
2. Sui event indexer is fully implemented
3. Test the betting flow on Sui first
4. Implement Aptos indexer properly later

---

## 🎯 For Production Deployment

**You MUST implement Option 1** (Full Event Indexer) before production:

**Required features:**
- [ ] Fetch `MarketCreatedEvent` from Aptos blockchain
- [ ] Fetch `BetPlacedEvent` for position tracking
- [ ] Fetch `MarketResolvedEvent` for resolution updates
- [ ] Fetch `WinningsClaimedEvent` for payout tracking
- [ ] Handle pagination (markets created in batches)
- [ ] Implement retry logic for failed fetches
- [ ] Add monitoring/alerts for indexer lag

**Estimated timeline:** 1-2 days for full implementation + testing

---

## 📝 Technical Details

### Aptos SDK Event Fetching

The Aptos TypeScript SDK provides these methods:

```typescript
// Get events by event type
const events = await aptos.getAccountEventsByEventType({
  accountAddress: moduleAddress,
  eventType: `${moduleAddress}::market_manager::MarketCreatedEvent`,
  minimumLedgerVersion: lastProcessedVersion,
  options: { limit: 100 }
});

// Or get events by creation number
const events = await aptos.getAccountEventsByCreationNumber({
  accountAddress: moduleAddress,
  creationNumber: 0, // Event handle creation number
  minimumLedgerVersion: lastProcessedVersion
});

// Or query transaction events directly
const tx = await aptos.getTransactionByHash({ transactionHash });
const events = tx.events; // All events from transaction
```

### Event Structure

Your Aptos contract emits events like:

```move
struct MarketCreatedEvent has drop, store {
    market_id: u64,
    question: String,
    outcomes: vector<String>,
    creator: address,
    end_date: u64,
    liquidity_param: u64,
    collateral_token_type: String,
}
```

These need to be transformed into your database schema:

```typescript
// backend/src/types/blockchain.ts
interface ProcessedEvent {
  type: EventType;
  marketId?: string;
  // ... other fields
}
```

---

## 🔗 References

- **Aptos SDK Events Docs:** https://aptos.dev/guides/typescript-sdk/events
- **Current Stub Implementation:** [backend/src/services/eventIndexer.ts:322](backend/src/services/eventIndexer.ts#L322)
- **Working Sui Implementation:** [backend/src/services/suiEventIndexer.ts](backend/src/services/suiEventIndexer.ts)
- **Event Handlers:** [backend/src/services/eventHandlers.ts](backend/src/services/eventHandlers.ts)

---

## ✅ Verification Steps

After implementing the fix:

1. **Check indexer advances:**
   ```sql
   SELECT "lastProcessedVersion" FROM "IndexerState" WHERE "chain" = 'aptos';
   -- Should increase over time, not stay at 0
   ```

2. **Check markets appear:**
   ```sql
   SELECT COUNT(*) FROM "Market" WHERE chain = 'aptos';
   -- Should show 1 (your market)
   ```

3. **Check backend API:**
   ```bash
   curl -s "http://localhost:4000/api/markets?chain=aptos" | python3 -m json.tool
   # Should return your market with full details
   ```

4. **Try betting:**
   - Navigate to your market in the dApp
   - Select an outcome
   - Enter bet amount
   - **Should succeed with transaction confirmation**

---

## 💡 Why This Wasn't Caught Earlier

1. **Sui worked fine** - The Sui indexer is fully implemented, so markets appeared correctly
2. **Backend started without errors** - The stub indexer runs but silently does nothing
3. **Logs look normal** - "Fetching events... No new events found" seems plausible
4. **Market creation succeeded** - The on-chain transaction works fine, issue is only with backend sync

This is a **silent failure** - the system appears to work but doesn't actually sync data.

---

**Next Step:** Choose Option 1, 2, or 3 above and implement it to unblock betting on Aptos markets.
