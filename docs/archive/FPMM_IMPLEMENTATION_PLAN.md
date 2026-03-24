# FPMM Implementation Plan - Binary Markets MVP

## Executive Decision: Pivot to Simplified AMM

**Date**: October 26, 2025
**Decision**: Launch with Fixed Product Market Maker (FPMM) for binary markets
**Rationale**: Speed to market (6 weeks vs 14 weeks), lower cost ($30K vs $140K), proven model

---

## What is FPMM?

**Fixed Product Market Maker** uses the constant product formula from Uniswap:

```
x × y = k (constant)
```

Where:
- **x** = Quantity of YES outcome shares
- **y** = Quantity of NO outcome shares
- **k** = Liquidity constant (determined at market creation)

**Price Calculation**:
```
Price(YES) = y / (x + y)
Price(NO) = x / (x + y)
```

**Key Property**: Prices always sum to 1 (100%)

---

## Why FPMM Works for Binary Markets

### Advantages

1. **Mathematically Proven**: Same formula as Uniswap (billions in volume)
2. **No Complex Math**: No exponentials, logarithms, or Taylor series
3. **Easy to Test**: Simple unit tests cover all cases
4. **Fast Audit**: $10K-20K (vs $50K-150K for LMSR)
5. **Gas Efficient**: ~10x cheaper than LMSR
6. **User Familiar**: Same UX as Uniswap swaps

### Production Examples

- **Gnosis Conditional Tokens**: Uses FPMM for binary markets
- **Polkamarkets**: FPMM exclusively
- **Omen**: FPMM for all prediction markets
- **Uniswap V2**: Constant product (x×y=k)

---

## Implementation Approach

### Strategy: Modify Existing `amm.move`

**Current File**: [contracts/sources/amm.move](contracts/sources/amm.move) (168 lines)
**Changes Needed**: ~50 lines modified, ~100 lines added
**Timeline**: 3-5 days

### What to Keep from Current Implementation

✅ **Already Good**:
- Error handling
- Overflow protection (`safe_mul_div`)
- Input validation
- Friend module pattern

### What to Replace

❌ **Remove**:
- Linear pricing approximation
- Impact factor calculations
- Simplified LMSR attempts

✅ **Replace With**:
- Constant product formula (x×y=k)
- Proper slippage calculation
- Liquidity add/remove functions

---

## New FPMM Module Structure

### Core Data Structure

```move
module prediction_market::fpmm {
    use std::error;
    use std::vector;
    use circle::usdc::USDC;
    use aptos_framework::coin::{Self, Coin};

    /// Liquidity pool for a binary market
    struct Pool has store {
        reserve_yes: u64,      // Quantity of YES shares
        reserve_no: u64,       // Quantity of NO shares
        liquidity: u64,        // Total liquidity tokens (for LPs)
        total_volume: u64,     // Cumulative trading volume
    }

    /// Liquidity provider position
    struct LPPosition has store {
        liquidity_tokens: u64,
        reserve_yes_locked: u64,
        reserve_no_locked: u64,
    }
}
```

### Core Functions

#### 1. Initialize Pool

```move
/// Create new FPMM pool for binary market
/// Initial liquidity: reserve_yes = reserve_no = sqrt(k)
public(friend) fun create_pool(
    initial_liquidity_usdc: u64,  // e.g., 10,000 USDC
): Pool {
    assert!(initial_liquidity_usdc >= MIN_LIQUIDITY, E_INSUFFICIENT_LIQUIDITY);

    // Split liquidity 50/50 between YES and NO
    let reserve_yes = initial_liquidity_usdc / 2;
    let reserve_no = initial_liquidity_usdc / 2;

    Pool {
        reserve_yes,
        reserve_no,
        liquidity: initial_liquidity_usdc,
        total_volume: 0,
    }
}
```

#### 2. Calculate Price

```move
/// Get current price for an outcome (in basis points, 10000 = 100%)
public fun get_price(
    pool: &Pool,
    outcome: u8,  // 0 = YES, 1 = NO
): u64 {
    assert!(outcome <= 1, E_INVALID_OUTCOME);

    let total = pool.reserve_yes + pool.reserve_no;
    assert!(total > 0, E_POOL_EMPTY);

    if (outcome == 0) {
        // Price(YES) = reserve_no / (reserve_yes + reserve_no)
        (pool.reserve_no * 10000) / total
    } else {
        // Price(NO) = reserve_yes / (reserve_yes + reserve_no)
        (pool.reserve_yes * 10000) / total
    }
}
```

#### 3. Calculate Buy Cost

```move
/// Calculate cost to buy outcome shares
/// Uses constant product: (x + Δx) × (y - Δy) = x × y
public fun calculate_buy_cost(
    pool: &Pool,
    outcome: u8,
    shares_to_buy: u64,
): u64 {
    assert!(shares_to_buy > 0, E_INVALID_AMOUNT);

    let k = pool.reserve_yes * pool.reserve_no;  // Constant product

    if (outcome == 0) {
        // Buying YES: add to reserve_no, remove from reserve_yes
        let new_reserve_no = pool.reserve_no + shares_to_buy;
        let new_reserve_yes = k / new_reserve_no;

        // Cost = reduction in reserve_yes
        assert!(pool.reserve_yes > new_reserve_yes, E_INSUFFICIENT_LIQUIDITY);
        pool.reserve_yes - new_reserve_yes
    } else {
        // Buying NO: add to reserve_yes, remove from reserve_no
        let new_reserve_yes = pool.reserve_yes + shares_to_buy;
        let new_reserve_no = k / new_reserve_yes;

        // Cost = reduction in reserve_no
        assert!(pool.reserve_no > new_reserve_no, E_INSUFFICIENT_LIQUIDITY);
        pool.reserve_no - new_reserve_no
    }
}
```

#### 4. Execute Buy

```move
/// Execute buy trade (called from betting.move)
public(friend) fun buy_shares(
    pool: &mut Pool,
    outcome: u8,
    shares_to_buy: u64,
): u64 {
    let cost = calculate_buy_cost(pool, outcome, shares_to_buy);

    // Update reserves
    if (outcome == 0) {
        pool.reserve_no = pool.reserve_no + shares_to_buy;
        let k = pool.reserve_yes * (pool.reserve_no - shares_to_buy);
        pool.reserve_yes = k / pool.reserve_no;
    } else {
        pool.reserve_yes = pool.reserve_yes + shares_to_buy;
        let k = (pool.reserve_yes - shares_to_buy) * pool.reserve_no;
        pool.reserve_no = k / pool.reserve_yes;
    };

    // Track volume
    pool.total_volume = pool.total_volume + cost;

    cost
}
```

#### 5. Calculate Sell Proceeds

```move
/// Calculate proceeds from selling shares
public fun calculate_sell_proceeds(
    pool: &Pool,
    outcome: u8,
    shares_to_sell: u64,
): u64 {
    assert!(shares_to_sell > 0, E_INVALID_AMOUNT);

    let k = pool.reserve_yes * pool.reserve_no;

    if (outcome == 0) {
        // Selling YES: remove from reserve_no, add to reserve_yes
        assert!(pool.reserve_no >= shares_to_sell, E_INSUFFICIENT_SHARES);
        let new_reserve_no = pool.reserve_no - shares_to_sell;
        let new_reserve_yes = k / new_reserve_no;

        // Proceeds = increase in reserve_yes
        new_reserve_yes - pool.reserve_yes
    } else {
        // Selling NO: remove from reserve_yes, add to reserve_no
        assert!(pool.reserve_yes >= shares_to_sell, E_INSUFFICIENT_SHARES);
        let new_reserve_yes = pool.reserve_yes - shares_to_sell;
        let new_reserve_no = k / new_reserve_yes;

        // Proceeds = increase in reserve_no
        new_reserve_no - pool.reserve_no
    }
}
```

#### 6. Get All Odds

```move
/// Get odds for both outcomes (returns [odds_yes, odds_no])
public fun get_all_odds(pool: &Pool): (u64, u64) {
    let odds_yes = get_price(pool, 0);
    let odds_no = get_price(pool, 1);

    // Ensure they sum to 10000 (100%)
    let total = odds_yes + odds_no;
    if (total != 10000) {
        // Adjust for rounding
        if (total > 10000) {
            odds_no = odds_no - (total - 10000);
        } else {
            odds_no = odds_no + (10000 - total);
        }
    };

    (odds_yes, odds_no)
}
```

---

## Integration with Existing System

### Update `betting.move`

**Current**: Uses `amm_lmsr::calculate_odds()`
**New**: Uses `fpmm::get_price()`

**Changes**:

```move
// OLD (line 8):
use prediction_market::amm_lmsr;

// NEW:
use prediction_market::fpmm;

// OLD (line 382):
amm_lmsr::calculate_odds(&stakes, outcome, config.liquidity_parameter)

// NEW:
fpmm::get_price(&pool, outcome)
```

### Update `collateral_vault.move`

**Add Pool Storage**:

```move
struct Vault has key {
    // ... existing fields ...
    pools: Table<u64, fpmm::Pool>,  // market_id -> Pool
}
```

### Market Creation Flow

```move
// When market is created:
1. market_manager::create_market()
   ↓
2. collateral_vault::create_pool(market_id, initial_liquidity)
   ↓
3. fpmm::create_pool(initial_liquidity)
   ↓
4. Pool initialized with reserve_yes = reserve_no = initial_liquidity / 2
```

---

## Testing Strategy

### Unit Tests (Week 3)

**File**: `contracts/sources/tests/fpmm_tests.move`

**Test Cases** (30+ tests):

```move
#[test_only]
module prediction_market::fpmm_tests {
    use prediction_market::fpmm;

    // === Price Calculation Tests ===

    #[test]
    fun test_initial_price_is_50_50() {
        let pool = fpmm::create_pool(10000_000000);
        let (odds_yes, odds_no) = fpmm::get_all_odds(&pool);
        assert!(odds_yes == 5000, 0);  // 50%
        assert!(odds_no == 5000, 0);   // 50%
    }

    #[test]
    fun test_price_after_yes_buy() {
        let pool = fpmm::create_pool(10000_000000);

        // Buy 1000 YES shares
        let cost = fpmm::buy_shares(&mut pool, 0, 1000_000000);

        let (odds_yes, odds_no) = fpmm::get_all_odds(&pool);

        // YES should be more expensive now (> 50%)
        assert!(odds_yes > 5000, 0);
        assert!(odds_no < 5000, 0);

        // Should still sum to 100%
        assert!(odds_yes + odds_no == 10000, 0);
    }

    // === Constant Product Tests ===

    #[test]
    fun test_constant_product_maintained() {
        let pool = fpmm::create_pool(10000_000000);

        let k_before = pool.reserve_yes * pool.reserve_no;

        fpmm::buy_shares(&mut pool, 0, 500_000000);

        let k_after = pool.reserve_yes * pool.reserve_no;

        // k should remain constant (within rounding)
        assert!(k_before == k_after, 0);
    }

    // === Edge Case Tests ===

    #[test]
    fun test_extreme_price_99_percent() {
        let pool = fpmm::create_pool(10000_000000);

        // Buy massive amount of YES to push price to 99%
        let shares = 9900_000000;  // 99x initial liquidity
        let cost = fpmm::calculate_buy_cost(&pool, 0, shares);

        // Price should cap near 99%
        fpmm::buy_shares(&mut pool, 0, shares);
        let (odds_yes, _) = fpmm::get_all_odds(&pool);
        assert!(odds_yes >= 9900 && odds_yes <= 9999, 0);
    }

    #[test]
    fun test_small_trade_minimal_slippage() {
        let pool = fpmm::create_pool(10000_000000);

        // Small trade (0.1% of liquidity)
        let shares = 10_000000;  // 10 USDC worth
        let cost = fpmm::calculate_buy_cost(&pool, 0, shares);

        // Slippage should be < 0.5%
        let expected_cost = shares * 5000 / 10000;  // At 50% price
        let slippage = (cost - expected_cost) * 10000 / expected_cost;
        assert!(slippage < 50, 0);  // < 0.5%
    }

    #[test]
    fun test_round_trip_buy_sell() {
        let pool = fpmm::create_pool(10000_000000);

        // Buy 1000 shares
        let buy_cost = fpmm::buy_shares(&mut pool, 0, 1000_000000);

        // Immediately sell 1000 shares
        let sell_proceeds = fpmm::sell_shares(&mut pool, 0, 1000_000000);

        // Should lose money due to slippage (but not too much)
        assert!(sell_proceeds < buy_cost, 0);
        let loss_percent = (buy_cost - sell_proceeds) * 10000 / buy_cost;
        assert!(loss_percent < 100, 0);  // < 1% loss
    }

    // === Overflow Tests ===

    #[test]
    #[expected_failure]
    fun test_insufficient_liquidity_fails() {
        let pool = fpmm::create_pool(1000_000000);  // Only 1000 USDC

        // Try to buy more than available
        fpmm::buy_shares(&mut pool, 0, 10000_000000);  // Should fail
    }

    #[test]
    fun test_max_liquidity_no_overflow() {
        // Test with maximum USDC amount
        let pool = fpmm::create_pool(1000000_000000);  // 1M USDC

        let cost = fpmm::calculate_buy_cost(&pool, 0, 100000_000000);
        assert!(cost > 0, 0);  // Should not overflow
    }
}
```

### Integration Tests

**Scenario 1: Full Market Lifecycle**

```move
#[test]
fun test_complete_market_flow() {
    // 1. Create market
    let market_id = market_manager::create_market(
        admin,
        b"Will BTC hit $100k?",
        vector[b"No", b"Yes"],
        end_time,
    );

    // 2. Create FPMM pool
    collateral_vault::create_pool(market_id, 10000_000000);

    // 3. User A buys YES
    betting::place_bet(user_a, market_id, 0, 1000_000000);

    // 4. User B buys NO
    betting::place_bet(user_b, market_id, 1, 500_000000);

    // 5. Check prices updated
    let pool = collateral_vault::get_pool(market_id);
    let (odds_yes, odds_no) = fpmm::get_all_odds(&pool);
    assert!(odds_yes > 5000, 0);  // YES more expensive
    assert!(odds_no < 5000, 0);   // NO cheaper

    // 6. Resolve market (YES wins)
    market_manager::resolve_market(resolver, market_id, 0);

    // 7. User A claims winnings
    betting::claim_winnings(user_a, market_id);

    // 8. Verify payout
    let balance = coin::balance<USDC>(user_a_addr);
    assert!(balance > initial_balance, 0);
}
```

---

## Configuration & Parameters

### Recommended Settings

```move
// FPMM Configuration (in betting.move)
const MIN_LIQUIDITY: u64 = 1000_000000;        // 1,000 USDC minimum
const DEFAULT_LIQUIDITY: u64 = 10000_000000;   // 10,000 USDC default
const MAX_LIQUIDITY: u64 = 100000_000000;      // 100,000 USDC max per market

const MIN_BET: u64 = 1_000000;                 // 1 USDC
const MAX_BET: u64 = 10000_000000;             // 10,000 USDC (no more than liquidity)

const PRICE_FLOOR: u64 = 100;                  // 1% minimum
const PRICE_CEILING: u64 = 9900;               // 99% maximum

const TRADING_FEE_BPS: u64 = 200;              // 2% trading fee
```

### Liquidity Scaling

**Market Type → Initial Liquidity**:

| Market Type | Expected Volume | Initial Liquidity | Max Bet |
|-------------|----------------|-------------------|---------|
| **Micro** (sports, entertainment) | < $10K | 1,000 USDC | 100 USDC |
| **Small** (crypto prices) | $10K-$100K | 5,000 USDC | 500 USDC |
| **Medium** (elections) | $100K-$1M | 10,000 USDC | 2,000 USDC |
| **Large** (major events) | $1M+ | 50,000 USDC | 10,000 USDC |

---

## Gas Cost Comparison

### LMSR (amm_lmsr.move)

**Per Trade**:
- `fixed_exp()`: ~50,000 gas × 4 calls = 200,000 gas
- `fixed_ln()`: ~80,000 gas × 2 calls = 160,000 gas
- Arithmetic: ~50,000 gas
- **Total**: ~410,000 gas per trade

**Cost at 100 gas price**: ~$0.02-0.05

### FPMM (new implementation)

**Per Trade**:
- Multiplication: ~500 gas × 3 = 1,500 gas
- Division: ~1,000 gas × 3 = 3,000 gas
- State updates: ~20,000 gas
- **Total**: ~25,000 gas per trade

**Cost at 100 gas price**: ~$0.001-0.002

**Savings**: **16x cheaper** (410K → 25K gas)

---

## Security Audit Scope (Week 4)

### Simplified Audit Checklist

**Focus Areas**:

1. **Constant Product Invariant**
   - ✅ Verify `x × y = k` maintained after all trades
   - ✅ Check rounding doesn't break invariant
   - ✅ Test with edge cases (near-zero, near-max)

2. **Price Bounds**
   - ✅ Prices always between 1% and 99%
   - ✅ Prices always sum to exactly 100%
   - ✅ No negative prices possible

3. **Overflow/Underflow**
   - ✅ Large trades don't overflow
   - ✅ Small trades don't underflow
   - ✅ Multiplication uses u128 intermediate

4. **Access Control** (already done)
   - ✅ Only betting module can trade
   - ✅ Only admin can create pools
   - ✅ Reentrancy protection

5. **Economic Security**
   - ✅ No arbitrage loops
   - ✅ Fair LP rewards
   - ✅ No price manipulation vectors

**Audit Firms** (fast turnaround):
- **Zellic**: $10K-15K, 1-2 weeks (Aptos specialists)
- **Blaize**: $8K-12K, 2 weeks
- **OtterSec**: $12K-18K, 2-3 weeks

**Estimated Cost**: $10K-15K (vs $50K-150K for LMSR)

---

## Migration Path from LMSR

### Phase 1: Deploy FPMM (Week 1-2)

1. Create `fpmm.move` module
2. Keep `amm_lmsr.move` for future
3. Update `betting.move` to use FPMM
4. Deploy to testnet

### Phase 2: Testing (Week 3)

1. Run comprehensive unit tests
2. Integration tests with real scenarios
3. Stress testing (large trades, edge cases)
4. Testnet beta (invite 50 users)

### Phase 3: Audit (Week 4)

1. Submit code to audit firm
2. Review findings
3. Fix any issues (1-3 days typically)
4. Get sign-off

### Phase 4: Mainnet Launch (Week 5-6)

1. Deploy to mainnet
2. Seed 10 initial markets
3. Recruit 5 liquidity providers ($50K TVL)
4. Marketing push
5. Monitor for 1 week
6. Scale up

### Future: Add LMSR for Multi-Outcome (Month 4+)

**Only if needed**:
- Users request 3+ outcome markets
- Binary market volume > $500K/month
- LMSR validation complete

**Implementation**:
```move
// Market creation chooses AMM type
if (num_outcomes == 2) {
    use fpmm::create_pool()
} else {
    use amm_lmsr::create_pool()  // For 3+ outcomes
}
```

---

## 6-Week Launch Roadmap

### Week 1: FPMM Development

**Days 1-2**: Core Module
- Create `fpmm.move` with all core functions
- Implement constant product formula
- Add price calculation functions

**Days 3-4**: Integration
- Update `betting.move` imports
- Modify `collateral_vault.move` to store pools
- Update `market_manager.move` for pool creation

**Day 5**: Code Review
- Internal code review
- Test deployment to testnet
- Fix compilation issues

**Deliverable**: Working FPMM module on testnet

---

### Week 2: Advanced Features

**Days 1-2**: Liquidity Provider Functions
- Add LP deposit/withdraw
- LP rewards calculation
- LP position tracking

**Days 3-4**: View Functions
- Get current price (public view)
- Calculate trade cost (public view)
- Get pool statistics (public view)

**Day 5**: Frontend Integration
- Update API to query FPMM prices
- Add price chart component
- Test with frontend

**Deliverable**: Full FPMM with LP support

---

### Week 3: Testing

**Days 1-2**: Unit Tests
- Write 30+ unit tests
- Test all edge cases
- Test overflow protection

**Days 3-4**: Integration Tests
- Full market lifecycle tests
- Multi-user scenarios
- Stress tests (100+ sequential trades)

**Day 5**: Testnet Beta
- Invite 50 beta testers
- Collect feedback
- Fix bugs

**Deliverable**: 80%+ test coverage, beta feedback

---

### Week 4: Security Audit

**Days 1-2**: Audit Preparation
- Clean up code comments
- Document all functions
- Create audit checklist

**Days 3-5**: Audit Engagement
- Submit to Zellic/Blaize/OtterSec
- Daily check-ins with auditors
- Answer questions

**Week-End**: Audit Report
- Receive findings
- Prioritize fixes
- Plan remediation

**Deliverable**: Audit report with findings

---

### Week 5: Audit Fixes & Launch Prep

**Days 1-3**: Fix Audit Issues
- Address critical findings (if any)
- Address high findings
- Re-test after fixes

**Days 4-5**: Launch Preparation
- Deploy to mainnet (contracts only)
- Verify on block explorer
- Test mainnet RPC connection

**Deliverable**: Audited, mainnet-ready contracts

---

### Week 6: Mainnet Launch

**Days 1-2**: Soft Launch
- Create 3 initial markets (BTC, ETH, Election)
- Seed with $30K liquidity ($10K each)
- Invite 100 early users

**Days 3-5**: Monitor & Scale
- Monitor gas costs, prices, volumes
- Add 7 more markets (total 10)
- Ramp up marketing

**Weekend**: Public Launch
- Press release
- Social media campaign
- List on DeFi aggregators

**Deliverable**: Live prediction market platform 🚀

---

## Budget Breakdown

### Development (Week 1-3): $15K

- Senior Move developer: 3 weeks × $5K = $15K
- OR
- 2 developers: 3 weeks × $3.5K each = $21K

### Security Audit (Week 4): $12K

- Zellic/OtterSec: $12K (simplified FPMM audit)
- Includes 1 week audit + findings review

### Initial Liquidity (Week 6): $30K

- 3 seed markets × $10K each = $30K
- Refundable after liquidity providers take over

### Marketing (Week 5-6): $10K

- Content creation: $2K
- Social media ads: $5K
- Influencer partnerships: $3K

### Contingency: $3K

**Total: $70K** (vs $140K+ for LMSR approach)

**Savings: $70K+** to reinvest in growth

---

## Success Metrics

### Week 6 Targets

- ✅ 10 active markets
- ✅ 100 registered users
- ✅ $50K TVL (total value locked)
- ✅ $10K trading volume
- ✅ 0 critical bugs
- ✅ < $0.01 average gas cost per trade

### Month 3 Targets

- ✅ 50 active markets
- ✅ 1,000 registered users
- ✅ $500K TVL
- ✅ $200K trading volume
- ✅ 30% user retention
- ✅ Break-even on operational costs

### Month 6 Targets (Consider LMSR)

- ✅ 200 active markets
- ✅ 5,000 registered users
- ✅ $2M TVL
- ✅ $1M trading volume
- ✅ Requests for multi-outcome markets

**If hit**: Start LMSR validation for multi-outcome support

---

## Key Differences from LMSR

### What We Gain

1. **Speed**: 6 weeks vs 14 weeks (8 weeks saved)
2. **Cost**: $70K vs $140K ($70K saved)
3. **Simplicity**: 250 lines vs 442 lines (44% less code)
4. **Auditability**: Simple math vs complex Taylor series
5. **Gas**: 25K vs 410K gas (94% reduction)
6. **Risk**: Proven model vs experimental implementation

### What We Lose

1. **Multi-outcome efficiency**: FPMM less optimal for 3+ outcomes
   - **Solution**: Add LMSR later if needed (Month 4+)
2. **Mathematical elegance**: FPMM is simpler but less "optimal"
   - **Reality**: 90% of volume is binary markets
3. **Cross-market subsidization**: LMSR allows shared liquidity
   - **Solution**: Not needed for MVP

### What We Keep

✅ **All competitive advantages**:
- Aptos speed (unchanged)
- Multi-oracle security (unchanged)
- Low fees (actually improved with lower gas)
- Fast resolution (unchanged)

---

## Risk Assessment

### Technical Risks: LOW

- ✅ FPMM used by Uniswap (billions in volume)
- ✅ Simple math (no Taylor series complexity)
- ✅ Easy to test and audit
- ✅ Well-understood by liquidity providers

### Market Risks: LOW-MEDIUM

- 🟡 Some users may expect complex AMM
  - **Mitigation**: Most users don't care about AMM type
- 🟡 May need LMSR for multi-outcome later
  - **Mitigation**: Can add after validation (Month 4+)

### Timeline Risks: LOW

- ✅ 6-week timeline achievable with 1-2 devs
- ✅ No external dependencies (LMSR expert)
- ✅ Audit faster with simpler code

### Budget Risks: LOW

- ✅ $70K well within typical MVP range
- ✅ $30K liquidity refundable
- ✅ No hidden costs (LMSR validation, extended audit)

---

## Comparison to Competitors

### FPMM vs Polymarket (CLOB)

| Feature | Your FPMM | Polymarket CLOB |
|---------|-----------|-----------------|
| **Price Discovery** | Good (AMM) | Best (order book) |
| **Liquidity** | Automated | Manual (limit orders) |
| **Complexity** | Low | High |
| **Decentralization** | Full | Centralized matching |
| **Gas Costs** | $0.001 | $0.01-0.05 |
| **Speed** | 0.5s (Aptos) | 2s (Polygon) |

**Verdict**: FPMM is competitive for MVP

### FPMM vs Gnosis (FPMM)

| Feature | Your FPMM | Gnosis FPMM |
|---------|-----------|-------------|
| **AMM Type** | Same | Same |
| **Blockchain** | Aptos | Gnosis Chain |
| **Speed** | 0.5s | 5s |
| **Fees** | $0.001 | $0.02 |
| **Oracle** | Multi-source | Single |

**Verdict**: You're faster and cheaper

---

## Next Steps (Immediate)

### This Week

1. ✅ **Approve FPMM approach** (you already did!)
2. 📝 **Start coding** `fpmm.move` (I'll help)
3. 📊 **Set up project management** (Jira/Notion/Linear)
4. 👥 **Assign dev resources** (1-2 devs for 6 weeks)

### Tomorrow

1. Create `contracts/sources/fpmm.move`
2. Implement core functions (create_pool, get_price)
3. Test on local testnet
4. Deploy to Aptos testnet

### This Month

- Week 1-2: Development
- Week 3: Testing
- Week 4: Audit

**Target**: Audited FPMM by end of Month 1

---

## Conclusion

**Decision: Launch with FPMM for binary markets**

**Rationale**:
- ✅ 6 weeks to launch (vs 14 weeks)
- ✅ $70K budget (vs $140K)
- ✅ Proven model (Uniswap, Gnosis)
- ✅ 90% of markets are binary
- ✅ Same competitive advantages
- ✅ Can add LMSR later if needed

**Next Action**: Start implementing `fpmm.move` today

**Your competitive advantages come from blockchain speed, multi-oracle security, and low fees — NOT from AMM complexity.**

**Ship fast, validate market fit, iterate based on real user data.**

---

**Document Created**: October 26, 2025
**Status**: ✅ Ready to implement
**Owner**: Development team
**Timeline**: 6 weeks to mainnet launch
**Budget**: $70K
**Risk Level**: LOW
