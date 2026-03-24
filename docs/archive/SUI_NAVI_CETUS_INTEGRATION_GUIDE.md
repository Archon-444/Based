# Aptos-to-Sui Prediction Market Migration: NAVI + Cetus Integration Guide

## Project Status: You Already Have Sui Deployed at 45%!

Your current architecture (Move Market, dual-chain) is **perfectly positioned** for NAVI + Cetus integration. This guide shows exactly how to fit your Aptos features into the Sui implementation.

---

## Part 1: Current Aptos Features → Sui Equivalents

### 1. Market Manager (marketmanager.move)

**Aptos Implementation:**
- Struct Market { question, outcomes, creator, endtime, resolved }
- Single oracle determines outcome
- Sequential market IDs

**Sui Enhancement (Your 45% Work):**
- Market as shared object (properly decentralized)
- Multi-oracle consensus built-in
- **NEW:** Creates Cetus liquidity pools automatically

**Why This Matters:**
Aptos couldn't efficiently create liquidity pools for YES/NO tokens. Sui's object model + Cetus integration means users can trade outcomes on a DEX from day 1.

---

### 2. Betting Module (betting.move)

**Current Aptos:**
```move
public entry fun place_bet(user: &signer, market_id: u64, outcome: u8, amount: u64)
```

**Enhanced Sui (Add These):**
```move
// Leveraged betting with NAVI collateral
public entry fun place_leveraged_bet(
    user: &signer,
    market_id: u64,
    outcome: u8,
    collateral_amount: u64,
    borrow_amount: u64  // NEW: From NAVI
)

// Flash loan arbitrage
public entry fun execute_arbitrage(
    user: &signer,
    market_a: u64,
    market_b: u64,
    flash_amount: u64  // NEW: From NAVI
)
```

**Implementation Priority: HIGH** - Add these functions to existing betting.move

---

### 3. Oracle System (multi-oracle.move)

**Current Status:** Your Aptos multi-oracle is complete with:
- ✅ Oracle registration (stake-based)
- ✅ 66% weighted consensus
- ✅ 20% slashing penalties
- ✅ 24-hour dispute resolution
- ✅ Reputation system (0-1000)

**Action Required:** **PORT THIS TO SUI ASAP!** This is your #1 competitive advantage.

**Changes needed:** 2-3 data structure conversions only:
- Aptos `table::Table<u64, Oracle>` → Sui `Shared<OracleRegistry>`
- Logic remains 99% identical
- ~500 lines of Move code

**Why:** Polymarket got exploited by UMA manipulation. Your system prevents this.

---

### 4. Collateral Vault (collateralvault.move)

**Current:** Stores user USDC stakes

**Enhanced with NAVI:**
```move
struct UserCollateral {
    amount: u64,
    in_navi: bool,  // Track NAVI deposits
    navi_receipt_token: ReceiptToken,  // nUSDC receipt
    yields_earned: u64,  // Passive income!
}
```

**Key Feature:** User deposits earn 3-8% APY automatically while waiting for market resolution.

---

### 5. AMM/LMSR (amm.move)

**Current:** Your LMSR pricing mechanism

**Integration with Cetus:**
- **KEEP:** Your LMSR for initial pool ratios
- **REPLACE:** YES/NO trading with Cetus CLMM
- **BENEFIT:** 10-100x capital efficiency + passive LP fees

**Flow:**
```
Your LMSR calculates: YES 65%, NO 35%
          ↓
   Creates Cetus pool with 65/35 ratio
          ↓
   LPs provide liquidity, earn fees
          ↓
   Traders trade YES/NO on Cetus DEX
          ↓
   Dynamic price discovery via CLMM
```

---

## Part 2: Feature Mapping

| Feature | Aptos | Sui Status | Required Action |
|---------|-------|-----------|------------------|
| Market Creation | ✅ Complete | ⚙️ 45% | Integrate NAVI oracle feeds |
| Betting Logic | ✅ Complete | ⚙️ 45% | Add leveraged betting |
| Outcome Resolution | ⚠️ Partial | ⚙️ In progress | **PORT multi-oracle system** |
| Claim Winnings | ✅ Complete | ⚙️ Partial | Wire with NAVI repayment |
| USDC Transfers | ⚠️ Test token | ⚠️ Test token | Add Circle bridge layer |
| Multi-Oracle System | ✅ Complete | ❌ Not ported | **PRIORITY: Port immediately** |
| Reentrancy Guards | ⚠️ Partial | ⚠️ Partial | Complete for production |
| Admin Controls | ⚠️ Partial | ⚠️ Partial | Finish before mainnet |
| Pause Mechanisms | ⚠️ Stubbed | ⚠️ Stubbed | Add emergency controls |

---

## Part 3: NAVI Integration Points

### Integration 1: Collateral Deposit → Automatic NAVI Yield

**User Experience:**
```
1. Deposit $10,000 USDC to vault
2. Vault automatically deposits to NAVI
3. User earns 5.5% APY on collateral
4. Can place bets while earning yield
5. On claim: Get winnings + accrued interest
```

**Smart Contract Changes:**

Modify `collateral_vault.move`:
```move
module prediction_market::collateral_vault_v2 {
    use navi_protocol::lending_core;
    
    // When user deposits, send to NAVI
    public entry fun deposit_to_vault_and_navi(
        user: &signer,
        usdc_amount: u64
    ) {
        // 1. Transfer USDC from user
        coin::transfer<USDC>(user_account, vault, usdc_amount);
        
        // 2. Deposit into NAVI (earns yield)
        lending_core::deposit(vault, USDC, usdc_amount);
        
        // 3. Store receipt token for withdrawal
        user_navi_receipts[user_addr] = lending_core::get_receipt();
    }
}
```

**Benefit:** Users earn passive income. Competitive advantage over Polymarket.

---

### Integration 2: Leveraged Betting

**Scenario:** User wants to bet $7,500 but only has $3,000

```move
public entry fun place_leveraged_bet(
    user: &signer,
    market_id: u64,
    outcome: u8,
    collateral: u64,  // User's $3,000
    borrow: u64      // NAVI borrows $4,500
) {
    // 1. Deposit collateral to NAVI
    navi::deposit(user, collateral);
    
    // 2. Borrow against it (50% LTV)
    let borrowed = navi::borrow(user, borrow, 50);
    
    // 3. Place bet with total ($3,000 + $4,500 = $7,500)
    place_bet(user, market_id, outcome, collateral + borrowed);
    
    // 4. Track debt
    user_leverage[user].borrowed = borrow;
    user_leverage[user].collateral = collateral;
}
```

**Claim with Auto-Repayment:**
```move
public entry fun claim_leveraged_winnings(
    user: &signer,
    market_id: u64
) {
    // 1. Get payout
    let payout = get_winnings(market_id, user);
    
    // 2. Calculate debt
    let borrowed = user_leverage[user].borrowed;
    let interest = (borrowed * 0.05) / 100;  // ~5% APR
    
    // 3. Repay NAVI automatically
    navi::repay(user, borrowed + interest);
    
    // 4. Withdraw collateral
    navi::withdraw(user, user_leverage[user].collateral);
    
    // 5. Send profit to user
    let profit = payout - (borrowed + interest);
    coin::transfer<USDC>(vault, user, profit);
}
```

---

### Integration 3: Flash Loan Arbitrage

**Scenario:** Price discrepancy detected
- Market A: YES at 60% ($0.60)
- Market B: YES at 70% ($0.70)
- Opportunity: Buy cheap, sell expensive, keep difference

```move
public entry fun execute_arbitrage(
    user: &signer,
    market_a: u64,
    market_b: u64,
    amount: u64
) {
    // 1. Flash loan (no collateral!)
    navi::flashloan(user, amount, |borrowed| {
        
        // 2. Buy YES on Market A (cheap at 60%)
        let yes_tokens = swap_on_market(market_a, borrowed);
        
        // 3. Sell YES on Market B (expensive at 70%)
        let proceeds = swap_on_market_reverse(market_b, yes_tokens);
        
        // 4. Must repay in same transaction
        assert!(proceeds > borrowed, ERROR_NOT_PROFITABLE);
        navi::repay_flashloan(borrowed);
        
        // 5. Profit = (proceeds - borrowed - flash fee)
    });
}
```

**Why This Matters:** Professional traders use this to correct market prices instantly.

---

## Part 4: Cetus Liquidity Pool Integration

### When Market is Created

**Your LMSR calculates odds** (e.g., YES 65%, NO 35%)

**Then automatically:**
1. Creates Cetus CLMM pool for YES/NO tokens
2. Initializes with correct ratio
3. Enables LP fee generation
4. Users can trade YES/NO on Cetus DEX

```move
module prediction_market::cetus_integration {
    use cetus_clmm::pool;
    
    public entry fun create_market_with_pool(
        admin: &signer,
        market_id: u64,
        yes_odds: u64,  // From your LMSR
        initial_liquidity: u64
    ) {
        // 1. Calculate pool ratio
        let no_odds = 100 - yes_odds;
        
        // 2. Create Cetus pool
        let pool_id = pool::create_pool(
            YES_TOKEN,
            NO_TOKEN,
            30,  // 0.3% fee
            yes_odds  // seed with correct price
        );
        
        // 3. Add liquidity
        pool::add_liquidity(
            admin,
            pool_id,
            initial_liquidity * yes_odds / 100,  // YES amount
            initial_liquidity * no_odds / 100    // NO amount
        );
        
        // 4. Store reference
        market_to_pool[market_id] = pool_id;
    }
}
```

### Users Can Swap YES ↔ NO

```move
public entry fun swap_outcomes(
    user: &signer,
    market_id: u64,
    from_outcome: u8,  // 0=YES, 1=NO
    amount: u64,
    min_out: u64
) {
    let pool_id = market_to_pool[market_id];
    
    // Execute swap on Cetus
    pool::swap_exact_input(
        user,
        from_outcome == 0 ? YES_TOKEN : NO_TOKEN,
        from_outcome == 0 ? NO_TOKEN : YES_TOKEN,
        amount,
        min_out,
        pool_id
    );
}
```

### Collect LP Fees for DAO

```move
public entry fun collect_pool_fees(
    admin: &signer,
    market_id: u64
) {
    let pool_id = market_to_pool[market_id];
    let fees = pool::collect_fees(admin, pool_id);
    
    // Split fees:
    // 60% → DAO treasury
    // 30% → referrers
    // 10% → back to LPs
}
```

---

## Part 5: Your Multi-Oracle System Port Priority

**This is worth $10M+ in competitive advantage.**

### What You Have (Aptos)
- ✅ Oracle registration (stake-based)
- ✅ 66% weighted consensus
- ✅ 20% slashing
- ✅ 24-hour dispute resolution
- ✅ Reputation tracking

### Port Strategy (Sui)

**Step 1: Change Data Structures**
```move
// APTOS:
table::Table<u64, Oracle>

// SUI:
struct OracleRegistry has key {
    id: UID,  // Sui object ID
    oracles: table::Table<address, OracleInfo>,
}
```

**Step 2: Keep Logic (99% identical)**
- registerOracle() → same logic
- submitResolution() → same logic
- calculateConsensus() → same logic
- slashOracle() → same logic
- disputeResolution() → same logic

**Step 3: Integrate with Resolution**
```move
public entry fun resolve_market_with_consensus(
    admin: &signer,
    market_id: u64
) {
    // 1. Get oracle submissions
    let submissions = oracle_registry.get_submissions(market_id);
    
    // 2. Calculate consensus
    let (outcome, confidence) = calculate_weighted_consensus(submissions);
    
    // 3. Check 66% threshold
    assert!(confidence >= 66, ERROR_NO_CONSENSUS);
    
    // 4. Resolve market
    market.resolved = true;
    market.winning_outcome = outcome;
    
    // 5. Update oracle reputations (reward/slash)
    update_oracle_reputations(outcome, submissions);
}
```

**Timeline:** 2-3 weeks for experienced Sui developer

---

## Part 6: Implementation Roadmap

### Week 1-2: Foundation (45% → 70%)
- [ ] Complete market creation with Cetus pool init
- [ ] Implement USDC routing (testnet = local, mainnet = Circle)
- [ ] Add NAVI collateral_vault integration
- [ ] Wire betting → NAVI borrowing
- [ ] Complete backend settlement logic

### Week 3-4: Features (70% → 90%)
- [ ] Implement place_leveraged_bet()
- [ ] Implement claim_leveraged_winnings()
- [ ] Add flash_loan_arbitrage()
- [ ] Create Cetus pool fee collection
- [ ] Wire frontend for new features

### Week 5-6: Quality (90% → 99%)
- [ ] Port multi-oracle system to Sui
- [ ] Add oracle consensus to resolution
- [ ] Complete reentrancy guards
- [ ] Add pause/emergency mechanisms
- [ ] Full integration test suite

### Week 7-8: Security & Launch (99% → 100%)
- [ ] Professional security audit ($50K-$150K)
- [ ] Fix critical findings
- [ ] Deploy to Sui mainnet
- [ ] Launch marketing
- [ ] 24/7 production monitoring

---

## Part 7: New Frontend Components

### 1. Leveraged Betting Modal
```typescript
// Input: Collateral Amount
// Auto-calculate: Max Borrow (50% LTV)
// Show: Total Bet, Leverage Ratio, Interest Cost
// CTA: "Place Leveraged Bet"
```

### 2. YES/NO Swap Panel
```typescript
// Select: YES → NO or NO → YES
// Input: Amount
// Show: Price Impact, Min Out (slippage)
// CTA: "Swap on Cetus DEX"
```

### 3. Collateral Yield Dashboard
```typescript
// Display:
// - Principal Balance
// - APY (5.5% from NAVI)
// - Earned This Month
// - Earn Rate (daily)
```

### 4. Oracle Resolution Widget
```typescript
// Show:
// - Oracle submissions (count)
// - Consensus reached (YES/NO %)
// - Individual oracle votes + weights
// - Dispute time remaining
```

---

## Part 8: Critical Implementation Details

### NAVI Integration Checklist

- [ ] Install @naviprotocol/lending SDK
- [ ] Configure NAVI contract addresses (testnet/mainnet)
- [ ] Implement deposit() → nUSDC receipt token flow
- [ ] Implement borrow() with LTV validation
- [ ] Implement repay() with interest calculation
- [ ] Implement withdraw() with receipt token burning
- [ ] Add error handling for NAVI failures
- [ ] Test with NAVI testnet

### Cetus Integration Checklist

- [ ] Install @cetusprotocol/cetus-sui-clmm-sdk
- [ ] Configure pool addresses
- [ ] Implement create_pool() for new markets
- [ ] Implement add_liquidity() for seeding
- [ ] Implement swap_exact_input() for YES/NO trades
- [ ] Implement collect_fees() for revenue
- [ ] Handle CLMM price calculations
- [ ] Test with Cetus testnet

### Backend Changes

**Node.js SDK additions:**
```typescript
// navi-integration.ts
export async function getUserYield(userAddress: string) {
    const receipt = await naviSDK.getReceiptToken(userAddress);
    return naviSDK.getAccruedYield(receipt);
}

// cetus-integration.ts
export async function createMarketPool(
    marketId: number,
    yesOdds: number
) {
    const pool = await cetusSDK.createPool({
        tokenA: YES_TOKEN_ADDRESS,
        tokenB: NO_TOKEN_ADDRESS,
        fee: 30,  // 0.3%
        initialPrice: yesOdds
    });
    return pool.id;
}
```

---

## Part 9: Risk Mitigation

### What Could Go Wrong

1. **NAVI Liquidity Constraints**
   - Mitigation: Monitor utilization, have backup lending sources

2. **Cetus Pool Imbalance**
   - Mitigation: Rebalance concentr liquidity, adjust fee tier

3. **Oracle Manipulation**
   - Mitigation: Use your multi-oracle consensus (port immediately!)

4. **Smart Contract Bugs**
   - Mitigation: Professional audit before mainnet

5. **User Confusion on New Features**
   - Mitigation: Extensive UI/UX testing, user education

---

## Part 10: Success Metrics

### By End of Week 8 (100% Complete)

- ✅ All Aptos features ported to Sui
- ✅ NAVI integration live (collateral yield working)
- ✅ Cetus pools active (YES/NO trading live)
- ✅ Multi-oracle consensus deployed
- ✅ Leveraged betting functional
- ✅ Flash loan arbitrage available
- ✅ Professional audit completed
- ✅ Zero critical security issues
- ✅ Mainnet deployed
- ✅ 500+ active users in first week

---

## Files to Create/Modify

### New Smart Contracts
```
contracts-sui/
├── sources/
│   ├── collateral_vault_v2.move       (NAVI integration)
│   ├── cetus_integration.move         (liquidity pools)
│   ├── flash_arbitrage.move           (flash loans)
│   ├── multi_oracle_sui.move          (PORT FROM APTOS)
│   └── dispute_resolution.move        (PORT FROM APTOS)
```

### Updated Modules
```
contracts-sui/sources/
├── betting.move                       (add leveraged functions)
├── market_manager.move                (add Cetus pool creation)
└── oracle.move                        (wire to NAVI oracles)
```

### Backend
```
backend/src/
├── blockchain/sui/
│   ├── naviIntegration.ts            (NEW)
│   ├── cetusIntegration.ts           (NEW)
│   └── suiClient.ts                  (update with new functions)
└── api/
    ├── routes/navi.ts                (NEW)
    ├── routes/cetus.ts               (NEW)
    └── routes/oracle.ts              (update)
```

### Frontend
```
dapp/src/
├── components/
│   ├── LeveragedBettingModal.tsx     (NEW)
│   ├── YesNoSwapPanel.tsx            (NEW)
│   ├── CollateralYieldDash.tsx       (NEW)
│   └── OracleResolutionWidget.tsx    (NEW)
├── hooks/
│   ├── useNaviLending.ts             (NEW)
│   ├── useCetusSwap.ts               (NEW)
│   └── useLeveragedBet.ts            (NEW)
└── pages/
    └── Markets.tsx                   (update with new UX)
```

---

## Quick Reference: Function Signatures

### NAVI Integration
```move
public entry fun deposit_to_navi(user: &signer, amount: u64);
public entry fun borrow_from_navi(user: &signer, amount: u64, ltv: u64);
public entry fun repay_navi_loan(user: &signer, amount: u64);
public entry fun withdraw_from_navi(user: &signer, amount: u64);
public fun get_user_yield(user_addr: address): u64;
```

### Cetus Integration
```move
public entry fun create_market_pool(admin: &signer, market_id: u64, yes_odds: u64);
public entry fun swap_outcomes(user: &signer, market_id: u64, from: u8, amount: u64, min_out: u64);
public entry fun collect_pool_fees(admin: &signer, market_id: u64): u64;
```

### Leveraged Betting
```move
public entry fun place_leveraged_bet(user: &signer, market_id: u64, outcome: u8, collateral: u64, borrow: u64);
public entry fun claim_leveraged_winnings(user: &signer, market_id: u64): u64;
```

---

## Next Steps

1. **This Week:** Review this guide with your team
2. **Next Week:** Start implementation with Priority 1
3. **Week 3:** Begin feature implementation
4. **Week 5:** Engage security audit firm
5. **Week 7:** Deploy to testnet
6. **Week 8:** Mainnet launch

**Questions?** Focus on Part 5 (Multi-Oracle Port) - that's your biggest leverage point.
