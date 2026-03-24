# Oracle Architecture Documentation

## Executive Summary

The Aptos Prediction Market uses a **hybrid multi-tier oracle system** that combines automated price feeds, decentralized oracle consensus, and manual resolution fallbacks. This architecture prevents single points of failure, oracle manipulation attacks (like the $7M Polymarket UMA incident), and ensures accurate, trustworthy market resolution.

**Key Design Principles**:
1. **Automation First**: Pyth Network price feeds for instant, gas-efficient resolution
2. **Decentralization**: Multi-oracle consensus prevents manipulation
3. **Flexibility**: Support for multiple oracle types per market
4. **Security**: Stake-based incentives, reputation scoring, and slashing
5. **Reliability**: Manual fallback when automated oracles unavailable

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKET RESOLUTION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

                        Market Expires
                              │
                              ▼
                  ┌───────────────────────┐
                  │  resolve_market()     │
                  │  (market_manager.move)│
                  └───────────┬───────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │ 1. Try Pyth Resolution First    │
            │    oracle::try_pyth_resolution()│
            └─────────┬───────────────────────┘
                      │
                      ├─── SUCCESS ──────────────┐
                      │                          │
                      └─── FAILED ───┐           ▼
                                     │    ┌──────────────┐
                                     │    │ Market Auto  │
                                     │    │  Resolved    │
                                     │    └──────────────┘
                                     ▼
            ┌─────────────────────────────────┐
            │ 2. Check Oracle Consensus       │
            │    oracle::is_market_resolved() │
            └─────────┬───────────────────────┘
                      │
                      ├─── CONSENSUS REACHED ────┐
                      │                           │
                      └─── NO CONSENSUS ──┐       ▼
                                          │  ┌────────────────┐
                                          │  │ Verify outcome │
                                          │  │  matches vote  │
                                          │  └────────────────┘
                                          ▼
            ┌─────────────────────────────────┐
            │ 3. Manual Resolution Allowed    │
            │    - Market creator, or         │
            │    - RESOLVER role holder       │
            └─────────────────────────────────┘
```

---

## Module Breakdown

### 1. Primary Oracle Module: `oracle.move`

**Purpose**: Central coordinator for all oracle activities

**Responsibilities**:
- Market oracle registration
- Automated Pyth resolution attempts
- Multi-oracle vote aggregation
- Oracle reputation and slashing
- Consensus validation
- Resolution fallback logic

**Key Structs**:

```move
struct MarketOracle {
    market_id: u64,
    oracle_sources: vector<OracleSource>,  // Multiple sources per market
    oracle_votes: vector<OracleVote>,      // Votes from different oracles
    resolved: bool,
    resolution_value: u8,
    required_consensus: u64,               // e.g., 2 of 3 oracles
    resolution_strategy: u8,               // Which method to use
    pyth_threshold: u128,                  // For price-based markets
    pyth_configured: bool,
}

struct OracleRegistry {
    admin: address,
    market_oracles: SmartTable<u64, MarketOracle>,
    oracle_reputations: Table<address, OracleReputation>,
    staked_collateral: Coin<USDC>,         // Oracle stakes
    authorized_relayers: Table<address, bool>,
}
```

**Oracle Types**:
- `ORACLE_TYPE_MANUAL = 0` - Manual resolution only
- `ORACLE_TYPE_PYTH = 1` - Pyth Network price feeds
- `ORACLE_TYPE_CUSTOM = 2` - Custom on-chain oracle
- `ORACLE_TYPE_API = 3` - Off-chain API (via relayer)

**Resolution Strategies**:
- `RESOLUTION_STRATEGY_PYTH_ONLY = 0` - Automated Pyth only
- `RESOLUTION_STRATEGY_PYTH_WITH_OPTIMISTIC = 1` - Pyth preferred, consensus fallback
- `RESOLUTION_STRATEGY_OPTIMISTIC_ONLY = 2` - Multi-oracle consensus required

**Key Functions**:
- `register_market_oracle()` - Configure oracle settings for a market
- `try_pyth_resolution()` - Attempt automated Pyth resolution
- `submit_oracle_vote()` - Oracle submits outcome vote
- `resolve_market_auto()` - Finalize after consensus
- `slash_oracle()` - Penalize incorrect oracles

---

### 2. Pyth Network Integration: `pyth_reader.move`

**Purpose**: Cache and validate Pyth Network price feeds for gas-efficient reuse

**Why Pyth?**
- **Real-time prices**: Sub-second latency for 450+ assets
- **Decentralized**: 95+ publishers (exchanges, market makers)
- **Tamper-proof**: Cryptographic signatures + Wormhole bridge
- **Gas-efficient**: Cache validated prices, reuse for multiple markets

**Architecture**:

```
Pyth Network (Off-chain)
         │
         │ Signed Price Updates (VAAs)
         │
         ▼
┌──────────────────────┐
│  Authorized Relayer  │  ← Backend service or keeper bot
└──────────┬───────────┘
           │
           │ cache_pyth_price()
           │
           ▼
┌──────────────────────┐
│   pyth_reader.move   │  ← On-chain cache
│  - Validates VAAs    │
│  - Checks freshness  │
│  - Stores snapshot   │
└──────────┬───────────┘
           │
           │ get_cached_price()
           │
           ▼
┌──────────────────────┐
│    oracle.move       │  ← Resolution logic
│  - Compares price to │
│    threshold         │
│  - Auto-resolves     │
└──────────────────────┘
```

**Key Structs**:

```move
struct FeedConfig {
    feed_id: vector<u8>,           // 32-byte Pyth feed ID
    staleness_threshold_secs: u64, // Max age (e.g., 300s)
}

struct PriceSnapshot {
    price: u128,
    confidence: u64,
    expo: u64,                     // Exponent (e.g., -8 for 8 decimals)
    publish_time: u64,
    vaa_hash: vector<u8>,          // Prevent replay attacks
}
```

**Key Functions**:
- `configure_feed()` - Register Pyth feed ID for market
- `cache_pyth_price()` - Store validated price snapshot (relayer-only)
- `get_cached_price()` - Retrieve latest cached price
- `is_price_fresh()` - Check if cache is within staleness threshold

**Example Pyth Feeds**:
| Asset | Feed ID (Pyth Testnet) | Use Case |
|-------|------------------------|----------|
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` | "Will BTC reach $100k by Dec 31?" |
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` | "Will ETH flip BTC in 2025?" |
| APT/USD | `0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5` | "Will APT reach $50?" |

**Gas Optimization**:
- Cache prices once, reuse for multiple markets
- Batch validate multiple VAAs in single transaction
- Relayer pays gas for cache updates, users get free reads

---

### 3. Multi-Oracle Consensus: `multi_oracle.move`

**Purpose**: Prevent oracle manipulation via weighted consensus of independent oracles

**Motivation**: In October 2022, Polymarket lost $7M when a single UMA oracle voter manipulated outcomes. Our system requires **66% weighted consensus** from multiple staked oracles.

**Security Features**:
1. **Stake Requirement**: 100 APT minimum (~$1,000) prevents Sybil attacks
2. **Reputation Scoring**: Track record affects voting weight
3. **Slashing**: 20% stake penalty for incorrect votes
4. **Time Limits**: 24-hour submission window
5. **Evidence Hashes**: Oracles must provide supporting data

**Architecture**:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Oracle A    │  │  Oracle B    │  │  Oracle C    │
│ Stake: 100   │  │ Stake: 200   │  │ Stake: 150   │
│ Rep: 900/1000│  │ Rep: 750/1000│  │ Rep: 850/1000│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       │ Vote: Outcome 1  │ Vote: Outcome 1 │ Vote: Outcome 0
       │ Confidence: 95%  │ Confidence: 80% │ Confidence: 70%
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Weighted Consensus   │
              │                       │
              │  Outcome 1:           │
              │  - Oracle A: 95 votes │
              │  - Oracle B: 60 votes │
              │  Total: 155 / 235     │
              │  = 66% ✅ CONSENSUS   │
              └───────────────────────┘
```

**Weight Calculation**:
```
Vote Weight = (Stake Amount) × (Reputation / 1000) × (Confidence / 100)

Example:
Oracle A = 100 APT × (900/1000) × (95/100) = 85.5 weighted votes
Oracle B = 200 APT × (750/1000) × (80/100) = 120 weighted votes
```

**Key Structs**:

```move
struct OracleInfo {
    oracle_address: address,
    reputation_score: u64,      // 0-1000
    total_resolutions: u64,
    correct_resolutions: u64,
    stake_amount: u64,          // In APT
    status: u8,                 // ACTIVE, SUSPENDED, SLASHED
}

struct OracleSubmission {
    oracle_address: address,
    outcome: u64,
    confidence: u64,            // 0-100%
    evidence_hash: vector<u8>,  // IPFS hash of evidence
    submitted_at: u64,
}

struct MarketResolution {
    market_id: u64,
    submissions: vector<OracleSubmission>,
    submission_deadline: u64,
    resolved: bool,
    final_outcome: u64,
}
```

**Key Functions**:
- `register_oracle()` - Stake APT to become oracle
- `submit_outcome()` - Submit vote with confidence and evidence
- `calculate_consensus()` - Compute weighted outcome
- `finalize_resolution()` - Lock in consensus result
- `slash_incorrect_oracles()` - Penalize wrong voters
- `reward_correct_oracles()` - Increase reputation

**Slashing Mechanism**:
```
IF oracle voted incorrectly:
  - Stake penalty: 20% (redistributed to correct oracles)
  - Reputation loss: -150 points
  - Status: Suspended if reputation < 300

IF oracle voted correctly:
  - Reputation gain: +100 points
  - Proportional reward from slashed stakes
```

---

## Resolution Flow by Market Type

### Type 1: Price-Based Markets (Pyth Automated)

**Example**: "Will BTC reach $100,000 by Dec 31, 2025?"

**Configuration**:
```move
oracle::register_market_oracle(
    market_id: 123,
    oracle_type: ORACLE_TYPE_PYTH,
    resolution_strategy: RESOLUTION_STRATEGY_PYTH_ONLY,
    pyth_feed_id: "0xe62df...",  // BTC/USD
    threshold: 100000_00000000,  // $100k with 8 decimals
    outcome_above: 1,            // Yes
    outcome_below: 0,            // No
);
```

**Resolution Process**:
1. Market expires on Dec 31, 2025 23:59:59 UTC
2. Anyone calls `resolve_market()`
3. System calls `oracle::try_pyth_resolution()`
4. Pyth reader fetches cached BTC/USD price
5. If price > $100k → Outcome 1 (Yes)
6. If price < $100k → Outcome 0 (No)
7. Market instantly resolved, payouts enabled

**Advantages**:
- ✅ Instant resolution (single transaction)
- ✅ No human intervention needed
- ✅ Gas-efficient
- ✅ Tamper-proof (Pyth signatures)
- ✅ Real-time price data

**Limitations**:
- ❌ Only works for price feeds Pyth supports
- ❌ Requires relayer to cache prices (or users pay gas)
- ❌ Not suitable for subjective outcomes

---

### Type 2: Hybrid Markets (Pyth + Optimistic Fallback)

**Example**: "Will ETH reach $10,000 by June 30, 2025?"

**Configuration**:
```move
oracle::register_market_oracle_multi(
    market_id: 456,
    primary_strategy: RESOLUTION_STRATEGY_PYTH_WITH_OPTIMISTIC,
    pyth_feed_id: "0xff6149...",  // ETH/USD
    threshold: 10000_00000000,
    fallback_oracles: [oracle_a, oracle_b, oracle_c],
    required_consensus: 2,  // 2 of 3 oracles
);
```

**Resolution Process**:

**Scenario A: Pyth Available**
1. Market expires
2. Resolver calls `resolve_market()`
3. Pyth price available and fresh → **Auto-resolve**

**Scenario B: Pyth Unavailable (Outage, Stale Data)**
1. Market expires
2. Pyth price unavailable or too old
3. System opens oracle voting period (24 hours)
4. Oracles A, B, C submit votes with evidence
5. System calculates weighted consensus
6. If 66%+ agree → **Consensus resolution**
7. Incorrect oracles slashed, correct oracles rewarded

**Advantages**:
- ✅ Automated when possible
- ✅ Resilient to oracle outages
- ✅ Multi-oracle security
- ✅ Incentive-aligned oracles

**Trade-offs**:
- 🟡 Slower if fallback needed (24h+ delay)
- 🟡 Higher complexity
- 🟡 Requires oracle ecosystem

---

### Type 3: Subjective Markets (Optimistic Only)

**Example**: "Will SpaceX successfully land humans on Mars before 2030?"

**Configuration**:
```move
oracle::register_market_oracle_multi(
    market_id: 789,
    resolution_strategy: RESOLUTION_STRATEGY_OPTIMISTIC_ONLY,
    oracles: [oracle_a, oracle_b, oracle_c, oracle_d, oracle_e],
    required_consensus: 3,  // 3 of 5 oracles
    consensus_deadline: timestamp + 86400,  // 24 hours
);
```

**Resolution Process**:
1. Market expires on Jan 1, 2030
2. Voting period opens (24 hours)
3. Each oracle researches and submits:
   - `outcome`: 0 (No) or 1 (Yes)
   - `confidence`: 0-100%
   - `evidence_hash`: IPFS link to sources
4. After deadline, system calculates weighted consensus
5. If 66%+ weighted votes agree → **Resolved**
6. If no consensus → Extend deadline or allow manual resolution

**Voting Example**:
| Oracle | Stake | Reputation | Outcome | Confidence | Weight |
|--------|-------|------------|---------|------------|--------|
| A | 100 APT | 900/1000 | Yes (1) | 80% | 72 |
| B | 200 APT | 850/1000 | Yes (1) | 90% | 153 |
| C | 150 APT | 700/1000 | No (0) | 70% | 73.5 |
| D | 100 APT | 950/1000 | Yes (1) | 85% | 80.75 |
| E | 120 APT | 800/1000 | Yes (1) | 75% | 72 |

**Result**:
- Yes votes: 72 + 153 + 80.75 + 72 = 377.75
- No votes: 73.5
- Total: 451.25
- Yes percentage: 377.75 / 451.25 = **83.7%** ✅ Consensus reached

**Advantages**:
- ✅ Supports any outcome type
- ✅ Decentralized verification
- ✅ Stake-based security
- ✅ Evidence trail (IPFS hashes)

**Limitations**:
- ❌ Requires active oracle ecosystem
- ❌ 24-48 hour delay for voting
- ❌ Vulnerable if too few oracles (< 3)

---

### Type 4: Manual Fallback

**When Manual Resolution Is Allowed**:
1. No oracle sources configured (`ORACLE_TYPE_MANUAL`)
2. Oracle consensus failed (< 66% agreement)
3. Consensus deadline passed without sufficient votes
4. Emergency situations (oracle outage, dispute)

**Who Can Manually Resolve**:
- **Market Creator**: Always allowed (created the market, knows ground truth)
- **RESOLVER Role**: Admin-designated trusted resolvers
- **Dispute Resolution**: After formal challenge process

**Process**:
```move
// Check if oracle already resolved
if (!oracle::is_market_resolved(market_id)) {
    // Manual resolution allowed
    assert!(
        is_creator || has_resolver_role,
        ERROR_NOT_AUTHORIZED
    );

    // Resolve market
    market.resolved = true;
    market.winning_outcome = outcome;
}
```

**Safeguards**:
- ✅ Dispute mechanism (future M4)
- ✅ Time delay before manual resolution (3-7 days)
- ✅ Reputation tracking for resolvers
- ✅ Event logging for transparency

---

## Oracle Reputation & Incentives

### Reputation Scoring

**Initial Score**: 100 (new oracles start neutral)
**Range**: 0-1000

**Reputation Changes**:
```
Correct vote:     +10 reputation
Incorrect vote:   -15 reputation
Slash event:      -50 reputation

Weight multiplier = reputation_score / 1000
```

**Example**:
- Oracle with 900 reputation: 0.9x weight multiplier
- Oracle with 500 reputation: 0.5x weight multiplier (untrusted)
- Oracle with 100 reputation: 0.1x weight multiplier (new/unreliable)

**Status Transitions**:
```
Reputation > 300: ACTIVE (can vote)
Reputation 100-300: SUSPENDED (cannot vote until reputation restored)
Reputation < 100: SLASHED (permanently banned)
```

---

### Economic Incentives

**Oracle Staking**:
- **Minimum Stake**: 10,000 USDC (~$10k)
- **Maximum Stake**: 10,000,000 USDC (whale protection)
- **Stake Use**: Voting weight, slashing collateral

**Rewards**:
1. **Resolution Fees**: Markets pay 0.5-2% of total volume to oracles
2. **Slashing Redistribution**: Incorrect oracle stakes → correct oracles
3. **Reputation Bonuses**: High-reputation oracles earn premium fees

**Penalties**:
1. **Slashing**: 20% of stake for incorrect votes
2. **Reputation Loss**: Reduces future voting weight
3. **Suspension**: Cannot participate if reputation too low

**Example Economics**:

**Market**: "Will BTC hit $100k?"
- **Total Volume**: $1,000,000
- **Oracle Fee**: 1% = $10,000
- **Oracle Configuration**: 3 oracles required

**Scenario: All Vote Correctly**
- Each oracle receives: $10,000 / 3 = $3,333
- Plus reputation gain

**Scenario: 1 Oracle Incorrect**
- Incorrect oracle:
  - Loses 20% of 10,000 USDC = -$2,000
  - Reputation -15
- Correct oracles (2):
  - Each receives: ($10,000 + $2,000) / 2 = $6,000
  - Reputation +10

**ROI for Honest Oracle**:
```
Annual resolution opportunities: ~100 markets
Average fee per market: $3,000
Annual revenue: $300,000
Stake required: $10,000
ROI: 3,000% annually (if consistently correct)
```

**Cost of Attack**:
```
To manipulate 1 market with 3 oracles:
- Need to control 2 of 3 oracles
- Stake requirement: 2 × $10,000 = $20,000
- Slashing risk: 20% × $20,000 = $4,000 loss
- Reputation destruction: -30 points × 2 = -60
- Future earning loss: Can't participate until reputation restored

For high-value markets ($1M+), ratio of attack cost to potential gain
makes manipulation economically irrational.
```

---

## Integration Guide

### For Market Creators

**Step 1: Choose Oracle Strategy**

```typescript
// Price-based market (automated)
if (marketType === 'price_comparison') {
  oracleConfig = {
    strategy: 'PYTH_ONLY',
    pythFeedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    threshold: 100000_00000000,
  };
}

// Subjective market (multi-oracle)
else if (marketType === 'subjective') {
  oracleConfig = {
    strategy: 'OPTIMISTIC_ONLY',
    requiredOracles: 3,
    consensusPercentage: 66,
  };
}

// Hybrid (best of both)
else {
  oracleConfig = {
    strategy: 'PYTH_WITH_OPTIMISTIC',
    pythFeedId: '...',
    fallbackOracles: 3,
  };
}
```

**Step 2: Create Market with Oracle Config**

```move
market_manager::create_market(
    creator: &signer,
    question: b"Will BTC reach $100k by Dec 31?",
    outcomes: vector[b"No", b"Yes"],
    end_time: 1735689599,  // Dec 31, 2025 23:59:59 UTC
);

// Separately register oracle
oracle::register_market_oracle(
    market_id: 123,
    oracle_type: ORACLE_TYPE_PYTH,
    resolution_strategy: RESOLUTION_STRATEGY_PYTH_ONLY,
    // ... pyth config
);
```

---

### For Oracle Operators

**Step 1: Register as Oracle**

```bash
aptos move run \
  --function-id 0x{PACKAGE}::oracle::register_oracle \
  --args u64:10000000000 \  # 10,000 USDC stake
         hex:0x{YOUR_ED25519_PUBLIC_KEY}
```

**Step 2: Monitor Markets**

```typescript
// Query markets needing oracle votes
const markets = await client.view({
  function: `${PACKAGE}::oracle::get_markets_awaiting_votes`,
  arguments: [oracleAddress],
});

for (const market of markets) {
  // Research outcome
  const outcome = await researchMarketOutcome(market.question);
  const evidence = await gatherEvidence(market.id);

  // Upload evidence to IPFS
  const evidenceHash = await uploadToIPFS(evidence);

  // Submit vote
  await submitOracleVote(market.id, outcome, confidenceScore, evidenceHash);
}
```

**Step 3: Submit Votes**

```move
oracle::submit_oracle_vote(
    oracle: &signer,
    market_id: 456,
    outcome_value: 1,      // 0 or 1
    confidence: 85,        // 0-100%
    evidence_hash: b"Qm...",  // IPFS hash
);
```

**Step 4: Claim Rewards**

```move
oracle::claim_oracle_rewards(
    oracle: &signer,
    market_id: 456,
);
```

---

### For Backend/Relayer Services

**Pyth Price Caching** (Gas Optimization):

```typescript
import { PriceServiceConnection } from '@pythnetwork/price-service-client';

const pythService = new PriceServiceConnection('https://hermes.pyth.network');

async function cachePythPrices() {
  // Get latest price updates for all feeds
  const priceFeeds = await getActivePriceFeeds();

  for (const feed of priceFeeds) {
    const priceUpdate = await pythService.getLatestPriceUpdates([feed.feedId]);

    // Cache on-chain (relayer pays gas)
    await aptosClient.submitTransaction({
      function: `${PACKAGE}::pyth_reader::cache_pyth_price`,
      arguments: [
        feed.marketId,
        priceUpdate.vaa,
        priceUpdate.price,
        priceUpdate.conf,
        priceUpdate.expo,
        priceUpdate.publishTime,
      ],
    });
  }
}

// Run every 60 seconds
setInterval(cachePythPrices, 60_000);
```

**Auto-Resolution Service**:

```typescript
async function resolveExpiredMarkets() {
  // Query markets past end_time but not resolved
  const expiredMarkets = await getExpiredMarkets();

  for (const market of expiredMarkets) {
    try {
      // Attempt resolution (will try Pyth first, then oracles)
      await aptosClient.submitTransaction({
        function: `${PACKAGE}::market_manager::resolve_market`,
        arguments: [market.id, 0], // Outcome will be determined by oracle
      });

      console.log(`Resolved market ${market.id}`);
    } catch (e) {
      console.log(`Market ${market.id} requires oracle votes`);
    }
  }
}

// Run every 5 minutes
setInterval(resolveExpiredMarkets, 300_000);
```

---

## Security Considerations

### Pyth Network Security

**Threat**: Pyth publisher collusion
**Mitigation**: Pyth aggregates 95+ independent publishers (Binance, Coinbase, Jump, etc.). Would require majority collusion.

**Threat**: Wormhole bridge exploit
**Mitigation**: Pyth uses cryptographic signatures. VAAs are verified on-chain.

**Threat**: Stale price manipulation
**Mitigation**: Staleness threshold (default 300s). Reject old prices.

**Threat**: Price flash crash manipulation
**Mitigation**: Can configure TWAP (time-weighted average price) or use confidence intervals.

---

### Multi-Oracle Security

**Threat**: Sybil attack (one entity controls multiple oracles)
**Mitigation**:
- High stake requirement (10,000 USDC = $10k)
- Reputation system (new oracles have low weight)
- KYC for high-reputation oracles (future)

**Threat**: Oracle collusion
**Mitigation**:
- Slashing: 20% stake loss
- Reputation destruction
- Economic irrationality (lose more than potential gain)

**Threat**: Oracle bribery
**Mitigation**:
- Transparent vote history
- Slashing mechanism
- Dispute resolution (future M4)

**Threat**: Oracle failure/absence
**Mitigation**:
- Manual fallback resolution
- Deadline extensions
- Incentivize participation with fees

---

### Manual Resolution Security

**Threat**: Market creator manipulation
**Mitigation**:
- Dispute mechanism (future M4)
- Reputation tracking
- Time delay before manual resolution
- Multi-sig for high-value markets

**Threat**: Resolver role abuse
**Mitigation**:
- Admin-only role granting
- Revocable permissions
- Transparent resolution logs
- Slashing for incorrect resolutions (future)

---

## Future Enhancements (M4+)

### 1. UMA Optimistic Oracle Integration

**Timeline**: M4 (3-4 months post-launch)

**Benefits**:
- Optimistic resolution (instant if no disputes)
- Escalation game for disputes
- $UMA token incentives

**Integration**:
```move
const ORACLE_TYPE_UMA: u8 = 4;

oracle::register_market_oracle(
    market_id,
    oracle_type: ORACLE_TYPE_UMA,
    resolution_strategy: RESOLUTION_STRATEGY_UMA_OPTIMISTIC,
    uma_identifier: b"YES_OR_NO_QUERY",
);
```

---

### 2. Chainlink Price Feeds

**Timeline**: M5 (6 months post-launch)

**Benefits**:
- Additional price feed provider (redundancy)
- More asset coverage
- Battle-tested infrastructure

---

### 3. AI Oracle Integration

**Timeline**: M6 (9-12 months)

**Use Cases**:
- Verify image/video evidence (deepfake detection)
- Natural language outcome verification
- Sentiment analysis for subjective markets

**Example**:
```
Market: "Did Tesla announce a new model in Q1 2025?"
AI Oracle: Scans Tesla website, press releases, SEC filings
→ Submits vote with confidence score and evidence links
```

---

### 4. DAO Governance for Disputes

**Timeline**: M7 (12-18 months)

**Mechanism**:
- Token holders vote on disputed resolutions
- Escalation: Oracle → DAO → Court system
- Staking for voting rights

---

## Monitoring & Observability

### Key Metrics to Track

**Oracle Health**:
- Active oracles count
- Average reputation score
- Slash events per week
- Consensus success rate

**Resolution Performance**:
- Pyth auto-resolution rate (target: 80%+)
- Average time to resolution
- Manual resolution fallback rate (target: <5%)
- Dispute rate (target: <1%)

**Economic Metrics**:
- Total value staked by oracles
- Oracle fee earnings
- Slashing penalties collected
- ROI for oracles (attractiveness)

**Dashboard Query** (View Functions):
```typescript
// Get oracle statistics
const stats = await client.view({
  function: `${PACKAGE}::oracle::get_oracle_stats`,
  arguments: [oracleAddress],
});

console.log({
  reputation: stats.reputation_score,
  totalVotes: stats.total_votes,
  accuracy: stats.correct_votes / stats.total_votes,
  stake: stats.staked_amount,
});
```

---

## Conclusion

The Aptos Prediction Market oracle architecture achieves **security, decentralization, and efficiency** through:

1. **Automated Resolution** (Pyth): Instant, gas-efficient for 80%+ of markets
2. **Multi-Oracle Consensus**: Manipulation-resistant for subjective outcomes
3. **Economic Incentives**: Stake + reputation align oracle behavior
4. **Manual Fallback**: Ensures markets always resolve
5. **Extensibility**: Easy to add new oracle types (UMA, Chainlink, AI)

**Production Readiness**:
- ✅ Core oracle module implemented
- ✅ Pyth integration functional
- ✅ Multi-oracle consensus tested
- ✅ Reputation/slashing mechanisms in place
- 🟡 Needs: Production relayer, oracle ecosystem bootstrap
- 🟡 Recommended: Professional security audit before mainnet

**Next Steps**:
1. Deploy oracle modules to testnet
2. Register 3-5 test oracles
3. Create markets with different oracle strategies
4. Test resolution flows end-to-end
5. Build relayer service for Pyth caching
6. Recruit oracle operators for mainnet

---

**Document Version**: 1.0
**Last Updated**: October 26, 2025
**Author**: Aptos Prediction Market Team
**Related Modules**:
- [contracts/sources/oracle.move](contracts/sources/oracle.move)
- [contracts/sources/pyth_reader.move](contracts/sources/pyth_reader.move)
- [contracts/sources/multi_oracle.move](contracts/sources/multi_oracle.move)
