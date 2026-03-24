# 📊 Data Storage Architecture

## Current Status

### ✅ On-Chain Storage (Implemented)

**Smart Contract State:**
- **Markets:** Question, outcomes, creator, timestamps, resolution status
- **User Positions:** Stake amounts, outcomes, claimed status
- **Collateral:** Locked funds per market
- **USDC Balances:** User balances, faucet claims

**What's Stored:**
```move
// market_manager.move
struct Market has store {
    question: vector<u8>,
    outcomes: vector<vector<u8>>,
    outcome_stakes: vector<u64>,
    end_time: u64,
    resolved: bool,
    winning_outcome: u8,
    total_stakes: u64,
    creator: address,
    created_at: u64,
    resolution_time: u64,
}

// collateral_vault.move
struct UserPosition has store {
    outcome: u8,
    stake: u64,
    claimed: bool,
}
```

---

## ⚠️ Missing: Historical Data for Charts

**Charts Need:**
- Odds changes over time (7-day history)
- Volume accumulation (daily totals)
- Bet activity feed (recent transactions)
- User transaction history

**Current Limitation:**
- Blockchain only stores **current state**, not historical snapshots
- No built-in time-series data

---

## 💡 Production Solutions

### **Option 1: Aptos Indexer + Database (Recommended)**

**Architecture:**
```
┌─────────────────┐
│ Aptos Blockchain│
│   (Events)      │
└────────┬────────┘
         │
    ┌────▼────────┐
    │   Indexer   │
    │  (Listens)  │
    └────┬────────┘
         │
    ┌────▼────────┐
    │  PostgreSQL │
    │   Database  │
    └────┬────────┘
         │
    ┌────▼────────┐
    │  Backend API│
    │   (Express) │
    └────┬────────┘
         │
    ┌────▼────────┐
    │   Frontend  │
    │   (React)   │
    └─────────────┘
```

**Step 1: Add Events to Smart Contracts**

```move
// contracts/sources/betting.move

module prediction_market::betting {
    use aptos_framework::event;

    struct BetPlacedEvent has drop, store {
        market_id: u64,
        user: address,
        outcome: u8,
        amount: u64,
        odds: u64,
        timestamp: u64,
    }

    struct MarketOddsUpdatedEvent has drop, store {
        market_id: u64,
        outcome_stakes: vector<u64>,
        odds: vector<u64>,
        timestamp: u64,
    }

    public entry fun place_bet(
        account: &signer,
        market_id: u64,
        outcome: u8,
        amount: u64
    ) acquires BettingConfig {
        // ... existing betting logic ...

        // Emit event
        event::emit(BetPlacedEvent {
            market_id,
            user: signer::address_of(account),
            outcome,
            amount,
            odds: calculate_odds(market_id, outcome),
            timestamp: timestamp::now_seconds(),
        });

        // Emit odds update
        let new_odds = get_all_odds(market_id);
        event::emit(MarketOddsUpdatedEvent {
            market_id,
            outcome_stakes: get_stakes(market_id),
            odds: new_odds,
            timestamp: timestamp::now_seconds(),
        });
    }
}
```

**Step 2: Set Up Indexer**

```bash
# Install Aptos Indexer
npm install @aptos-labs/aptos-indexer
```

```typescript
// indexer/index.ts
import { AptosClient } from '@aptos-labs/ts-sdk';
import { Pool } from 'pg';

const client = new AptosClient('https://fullnode.devnet.aptoslabs.com');
const db = new Pool({
  host: 'localhost',
  database: 'prediction_market',
  user: 'postgres',
  password: 'password',
});

const MODULE_ADDRESS = '0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710';

async function indexEvents() {
  let lastVersion = await getLastIndexedVersion();

  while (true) {
    const transactions = await client.getTransactions({
      start: lastVersion,
      limit: 100,
    });

    for (const tx of transactions) {
      if (tx.success && tx.events) {
        for (const event of tx.events) {
          if (event.type.includes('BetPlacedEvent')) {
            await storeBetEvent(event);
          }
          if (event.type.includes('MarketOddsUpdatedEvent')) {
            await storeOddsSnapshot(event);
          }
        }
      }
      lastVersion = tx.version + 1;
    }

    await saveLastIndexedVersion(lastVersion);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
  }
}

async function storeBetEvent(event: any) {
  await db.query(
    `INSERT INTO bets (market_id, user_address, outcome, amount, odds, timestamp)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6))`,
    [
      event.data.market_id,
      event.data.user,
      event.data.outcome,
      event.data.amount,
      event.data.odds,
      event.data.timestamp,
    ]
  );
}

async function storeOddsSnapshot(event: any) {
  await db.query(
    `INSERT INTO odds_history (market_id, outcome_stakes, odds, timestamp)
     VALUES ($1, $2, $3, to_timestamp($4))`,
    [
      event.data.market_id,
      JSON.stringify(event.data.outcome_stakes),
      JSON.stringify(event.data.odds),
      event.data.timestamp,
    ]
  );
}
```

**Step 3: Database Schema**

```sql
-- Database schema
CREATE TABLE markets (
  id BIGINT PRIMARY KEY,
  question TEXT NOT NULL,
  outcomes JSONB NOT NULL,
  creator TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  winning_outcome INT
);

CREATE TABLE bets (
  id SERIAL PRIMARY KEY,
  market_id BIGINT REFERENCES markets(id),
  user_address TEXT NOT NULL,
  outcome INT NOT NULL,
  amount BIGINT NOT NULL,
  odds BIGINT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  tx_hash TEXT NOT NULL
);

CREATE TABLE odds_history (
  id SERIAL PRIMARY KEY,
  market_id BIGINT REFERENCES markets(id),
  outcome_stakes JSONB NOT NULL,
  odds JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL
);

CREATE TABLE volume_snapshots (
  id SERIAL PRIMARY KEY,
  market_id BIGINT REFERENCES markets(id),
  total_volume BIGINT NOT NULL,
  timestamp TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_bets_market ON bets(market_id);
CREATE INDEX idx_bets_user ON bets(user_address);
CREATE INDEX idx_odds_market_time ON odds_history(market_id, timestamp DESC);
CREATE INDEX idx_volume_market_time ON volume_snapshots(market_id, timestamp DESC);
```

**Step 4: Backend API**

```typescript
// backend/server.ts
import express from 'express';
import { Pool } from 'pg';

const app = express();
const db = new Pool(/* config */);

// Get odds history for charts
app.get('/api/markets/:id/odds-history', async (req, res) => {
  const { id } = req.params;
  const { days = 7 } = req.query;

  const result = await db.query(
    `SELECT odds, timestamp
     FROM odds_history
     WHERE market_id = $1
       AND timestamp >= NOW() - INTERVAL '${days} days'
     ORDER BY timestamp ASC`,
    [id]
  );

  res.json(result.rows);
});

// Get volume history
app.get('/api/markets/:id/volume-history', async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT DATE(timestamp) as date, SUM(amount) as volume
     FROM bets
     WHERE market_id = $1
     GROUP BY DATE(timestamp)
     ORDER BY date ASC`,
    [id]
  );

  res.json(result.rows);
});

// Get recent activity
app.get('/api/markets/:id/activity', async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT * FROM bets
     WHERE market_id = $1
     ORDER BY timestamp DESC
     LIMIT 50`,
    [id]
  );

  res.json(result.rows);
});

app.listen(3001, () => console.log('API running on port 3001'));
```

**Step 5: Frontend Integration**

```typescript
// frontend/src/hooks/useMarketChartData.ts
import { useState, useEffect } from 'react';

export const useOddsHistory = (marketId: number) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/markets/${marketId}/odds-history`)
      .then(res => res.json())
      .then(data => {
        setData(data.map(d => ({
          timestamp: new Date(d.timestamp).getTime(),
          yesOdds: d.odds[0] / 100,
          noOdds: d.odds[1] / 100,
          label: formatDate(d.timestamp),
        })));
        setLoading(false);
      });
  }, [marketId]);

  return { data, loading };
};
```

---

### **Option 2: The Graph (Subgraph)**

Use The Graph protocol for decentralized indexing:

```yaml
# subgraph.yaml
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: aptos
    name: PredictionMarket
    network: aptos-devnet
    source:
      address: "0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710"
    mapping:
      kind: aptos/events
      apiVersion: 0.0.1
      language: wasm/assemblyscript
      entities:
        - Bet
        - OddsSnapshot
      eventHandlers:
        - event: BetPlacedEvent
          handler: handleBetPlaced
        - event: MarketOddsUpdatedEvent
          handler: handleOddsUpdate
```

---

### **Option 3: Client-Side Aggregation (Quick Fix)**

For prototyping, aggregate data on the client:

```typescript
// Fetch all transactions and build history
async function buildOddsHistory(marketId: number) {
  const sdk = useSDK();
  const history = [];

  // Get market creation time
  const market = await sdk.getMarket(marketId);
  const startTime = market.createdAt;

  // Sample current odds daily
  for (let days = 7; days >= 0; days--) {
    const timestamp = Date.now() - days * 24 * 60 * 60 * 1000;

    // This is a workaround - you'd need to query historical state
    // which isn't directly supported
    const odds = await sdk.getOdds(marketId);

    history.push({
      timestamp,
      yesOdds: odds[0] / 100,
      noOdds: odds[1] / 100,
    });
  }

  return history;
}
```

**⚠️ Limitation:** Can only get current state, not true historical data.

---

## 🎯 Recommended Approach

**For MVP/Demo:**
- Use mock data (current implementation) ✅
- Focus on core betting functionality

**For Production:**
1. Add events to smart contracts
2. Set up Aptos Indexer + PostgreSQL
3. Build REST API for historical data
4. Update frontend hooks to fetch from API

**Quick Start:**
```bash
# 1. Add events to contracts (requires redeployment)
# 2. Set up database
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres

# 3. Run indexer
cd indexer
npm install
npm start

# 4. Run API server
cd backend
npm install
npm start

# 5. Update frontend to use real data
```

---

## 📈 Data Flow (Production)

```
User Places Bet
       ↓
Smart Contract emits BetPlacedEvent
       ↓
Indexer catches event
       ↓
Stores in PostgreSQL
       ↓
Frontend queries API
       ↓
Charts display real-time data
```

---

## 🚀 Next Steps

1. **Add Events to Contracts** (requires redeployment)
2. **Set Up Indexer** (local or hosted)
3. **Create Database Schema**
4. **Build API Server**
5. **Update Frontend Hooks**

**Timeline:** 2-3 days for full implementation

---

## 📝 Alternative: Use Aptos Labs Indexer API

Aptos provides a hosted indexer:

```typescript
const INDEXER_URL = 'https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql';

const query = `
  query GetBets($marketId: String!) {
    events(
      where: {
        type: {_eq: "BetPlacedEvent"}
        data: {_contains: {market_id: $marketId}}
      }
      order_by: {transaction_version: desc}
    ) {
      data
      transaction_version
    }
  }
`;
```

This avoids running your own indexer but requires GraphQL knowledge.

---

**Current Status:** Mock data for charts ✅
**Production Ready:** Needs indexer + database
**Estimated Effort:** 2-3 days for full historical data support
