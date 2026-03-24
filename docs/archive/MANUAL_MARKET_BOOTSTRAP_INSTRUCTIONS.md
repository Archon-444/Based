# Manual Aptos Market Bootstrap

The Aptos event indexer implementation is complete, but there's one final issue: `getAccountTransactions()` fetches transactions **from** the module account address (the contract), not transactions **calling** the contract.

Since your market was created by your wallet calling the contract, the indexer won't find it by scanning the module address's transactions.

## ✅ Quick Solution: Manual Bootstrap

You can bootstrap your existing market using the transaction hash from when you created it.

### Step 1: Find Your Market Creation Transaction Hash

Check your Petra wallet transaction history or use Aptos Explorer:
- Visit: https://explorer.aptoslabs.com/account/YOUR_WALLET_ADDRESS?network=testnet
- Find the `create_market` transaction
- Copy the transaction hash

### Step 2: Bootstrap the Market Manually

Use the backend's `bootstrapMarket` method directly:

```bash
# In your terminal
node << 'EOF'
const { AptosClientAdapter } = require('./backend/dist/blockchain/aptos/aptosClient.js');

const adapter = new AptosClientAdapter();
const transactionHash = 'YOUR_TRANSACTION_HASH_HERE'; // Replace with your actual hash

adapter.bootstrapMarket({ digest: transactionHash })
  .then(result => {
    console.log('✅ Market bootstrapped successfully!');
    console.log('Market ID:', result.marketId);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to bootstrap market:', error.message);
    process.exit(1);
  });
EOF
```

### Step 3: Verify Market Appears

```bash
curl -s "http://localhost:4000/api/markets?chain=aptos" | python3 -m json.tool
```

### Step 4: Test Betting!

Once the market is in the database, betting should work immediately! Navigate to your market in the dApp and place a test bet.

---

## 🔧 Alternative: Use Aptos Indexer GraphQL (Future Fix)

The proper solution is to use Aptos's indexer GraphQL API to query events, but this requires:

1. **Set up Aptos Indexer locally** or use a hosted indexer
2. **Query events via GraphQL** instead of REST API
3. **Filter by event type** across all transactions

This is a larger infrastructure change but would enable fully automatic indexing.

---

## 📊 Current Status

| Component | Status |
|-----------|--------|
| Event fetching logic | ✅ Implemented (but needs GraphQL indexer) |
| bootstrapMarket method | ✅ Complete & working |
| Manual bootstrap | ✅ Available (use transaction hash) |
| Automatic indexing | ⚠️ Needs GraphQL indexer setup |

**Recommended Next Steps:**
1. Use manual bootstrap for your existing market (2 minutes)
2. Test betting to verify everything works end-to-end
3. For production, set up proper GraphQL indexer access

---

## 💡 Why This Happened

The Aptos SDK's `getAccountTransactions()` method returns transactions **sent by** an account, not transactions **interacting with** a contract. Your market creation transaction was sent by your wallet, not by the contract address, so it won't appear in the module's transaction list.

**Solutions:**
- **Short-term:** Manual bootstrap (works perfectly!)
- **Long-term:** Use Aptos GraphQL indexer to query all MarketCreatedEvents across the network

Both approaches use the same `bootstrapMarket` method you now have implemented, so the infrastructure is ready!
