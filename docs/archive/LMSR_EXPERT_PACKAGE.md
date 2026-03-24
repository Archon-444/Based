# LMSR Expert Review Package

## Quick Summary for Expert

**What We Need**: Mathematical validation of LMSR (Logarithmic Market Scoring Rule) implementation for a prediction market platform.

**Timeline**: 2-3 weeks
**Budget**: $5,000-$10,000
**Priority**: HIGH (blocking production launch)

---

## The Core Problem

We have **TWO different AMM implementations** and need to decide which to use:

### Option 1: True LMSR (Currently Active)
**File**: `contracts/sources/amm_lmsr.move`
- Implements: `C(q) = b × ln(Σ exp(q_i/b))`
- Uses Taylor series for exp/ln approximations
- Fixed-point arithmetic (10^8 precision)
- ~500k gas per trade (estimated)
- ✅ Theoretically correct
- ❌ Complex and expensive

### Option 2: Simplified Linear
**File**: `contracts/sources/amm.move`
- Simple linear pricing with impact factor
- ~50k gas per trade (estimated)
- ✅ Simple and cheap
- ❌ Not true LMSR (approximation)

**DECISION NEEDED**: Which should we use in production?

---

## 12 Critical Questions (In Priority Order)

### Must Answer (Critical)

1. **Architecture**: True LMSR vs. simplified - which is better for our use case?
2. **Liquidity Parameter `b`**: Is 10,000 USDC the right default?
3. **Mathematical Correctness**: Are the exp/ln Taylor series approximations sound?
4. **Error Bounds**: What's the maximum pricing error users will experience?
5. **Overflow Protection**: What input ranges cause overflow/underflow?

### Should Answer (Important)

6. **Price Clamping**: Should we cap at 1%-99% or allow 0.1%-99.9%?
7. **Rounding**: Is "always round up" fair, or should we round to nearest?
8. **Multi-Outcome Normalization**: Is adjusting the last outcome the fairest way to ensure probabilities sum to 100%?
9. **Market Seeding**: Should markets start at [0,0] or seed with initial liquidity?
10. **Anti-Manipulation**: What mechanisms prevent wash trading and exploitation?

### Nice to Have (Optimization)

11. **Gas Optimization**: Can we reduce costs without sacrificing accuracy?
12. **Reference Implementations**: Should we match Gnosis's approach more closely?

---

## Files to Review

### 1. PRIMARY: True LMSR Implementation (442 lines)
**Path**: `contracts/sources/amm_lmsr.move`

**Key Functions**:
```move
// Lines 42-77: Exponential approximation
fun fixed_exp(x: u64): u64 {
    // Taylor series: exp(x) = 1 + x + x²/2! + x³/3! + ...
    // 20 iterations max, convergence threshold 1e-6
}

// Lines 83-144: Natural logarithm approximation
fun fixed_ln(x: u64): u64 {
    // Reduces x to [1,2) range
    // Taylor series: ln(1+y) = y - y²/2 + y³/3 - ...
}

// Lines 148-182: Core LMSR cost function
public fun calculate_cost(q: &vector<u64>, b: u64): u64 {
    // C(q) = b × ln(Σ exp(q_i/b))
}

// Lines 197-226: Buy pricing
public fun calculate_buy_price(...): (u64, vector<u64>) {
    // Price = C(q_new) - C(q_current)
}

// Lines 263-301: Probability/odds calculation
public fun calculate_odds(...): u64 {
    // p_i = exp(q_i/b) / Σ exp(q_j/b)
}
```

**Key Configuration**:
- Precision: `10^8` (100 million)
- Max Taylor iterations: 20
- Convergence threshold: `1e-6`
- Price clamp: 1% to 99%

### 2. ALTERNATIVE: Simplified Implementation (168 lines)
**Path**: `contracts/sources/amm.move`

**Key Functions**:
```move
// Lines 24-57: Simple proportional odds
public fun calculate_odds(outcome_stakes: &vector<u64>, outcome_index: u8): u64 {
    // odds = (outcome_stake / total_stakes) × 10000
    // Clamp to [1%, 99%]
}

// Lines 61-84: Linear pricing with impact
public fun calculate_buy_cost(...): u64 {
    // base_cost = amount × current_price
    // impact_cost = base_cost × (amount / liquidity)
    // total = base_cost + impact_cost
}
```

### 3. Integration Point (how it's used)
**Path**: `contracts/sources/betting.move`
- Line 8: `use prediction_market::amm_lmsr;` ← Currently using true LMSR
- Line 61: Default `b = 10,000 USDC`
- Lines 28-30: `MIN_BET = 1 USDC`, `MAX_BET = 2,000 USDC`, `MAX_STAKE_RATIO = 30%`

---

## Expected Deliverables

1. **✅ Validation Report**
   - Mathematical correctness assessment
   - Bug identification (if any)
   - Numerical accuracy analysis
   - Maximum error bounds

2. **📊 Parameter Recommendations**
   - Optimal liquidity parameter `b` (currently 10,000 USDC)
   - Min/max bet limits (currently 1-2,000 USDC)
   - Price bounds (currently 1%-99%)
   - Max outcomes limit (currently 10)

3. **🔬 Stress Test Scenarios**
   - Edge cases that could fail
   - Expected behavior in each scenario
   - Circuit breaker thresholds
   - Attack vectors and mitigations

4. **⚖️ Architecture Decision**
   - **Recommendation**: Use true LMSR, simplified, or hybrid?
   - **Rationale**: Why? Trade-offs analysis
   - **Alternative approaches**: If neither is optimal

5. **📝 Improvements List**
   - Gas optimization opportunities
   - Numerical stability enhancements
   - Anti-manipulation mechanisms
   - Best practices from other platforms

6. **✅ Production Sign-Off**
   - Statement that implementation is ready, OR
   - Required changes before launch

---

## Reference Materials

### Academic Papers
- **Original LMSR Paper**: Hanson, R. (2002). "Logarithmic Market Scoring Rules for Modular Combinatorial Information Aggregation" [[PDF](https://mason.gmu.edu/~rhanson/mktscore.pdf)]
- **Practical Analysis**: Chen, Y., Pennock, D. (2007). "A Utility Framework for Bounded-Loss Market Makers"

### Production Systems
- **Gnosis Prediction Markets**: [GitHub](https://github.com/gnosis/conditional-tokens-contracts) - Uses similar LMSR
- **Polymarket**: CLOB (order book), not LMSR
- **Zeitgeist**: LMSR + CPMM hybrid [[GitHub](https://github.com/zeitgeistpm/zeitgeist)]

### Context Documents
- [ORACLE_ARCHITECTURE.md](ORACLE_ARCHITECTURE.md) - How markets resolve
- [AUDIT_RECONCILIATION_OCT26.md](AUDIT_RECONCILIATION_OCT26.md) - Project status
- [LMSR_EXPERT_REVIEW_REQUIRED.md](LMSR_EXPERT_REVIEW_REQUIRED.md) - Full question list (this document's companion)

---

## Project Context

**Platform**: Aptos Prediction Market (multi-chain: Aptos, Sui, Movement)
**Completion**: 85-90%
**Blockers**: LMSR validation + security audit
**Target Launch**: 3-4 weeks

**What's Already Done**:
- ✅ Core market creation/betting/resolution
- ✅ Multi-oracle system (Pyth + consensus)
- ✅ RBAC, reentrancy protection, emergency pause
- ✅ USDC integration (Circle's official)
- ✅ Frontend + backend
- 🟡 **LMSR validation** ← YOU ARE HERE
- ⏸️ Professional security audit (waiting on LMSR validation)

---

## How to Engage

**Step 1**: Review this package and [LMSR_EXPERT_REVIEW_REQUIRED.md](LMSR_EXPERT_REVIEW_REQUIRED.md)

**Step 2**: Send us:
- Your rate (hourly or fixed project)
- Estimated timeline
- Any clarifying questions
- Relevant experience/credentials

**Step 3**: We provide:
- Full codebase access
- Test environment
- Direct communication channel
- Payment terms (50% upfront, 50% on completion)

**Contact**: [Your Email/Contact Info]

---

## Payment Structure

**Option 1: Fixed Price**
- $7,500 for complete review and recommendations
- Milestone 1 (50%): Initial validation report (Week 1)
- Milestone 2 (50%): Final recommendations + sign-off (Week 2-3)

**Option 2: Hourly**
- $300-400/hour (depending on experience)
- Estimated 20-25 hours
- Weekly progress reports
- Capped at $10,000

**Payment Methods**: Wire, USDC, ACH

---

## Expert Profile (Ideal)

**Must Have**:
- PhD or 10+ years in Economics, Mathematics, or related field
- Deep understanding of market microstructure and AMMs
- Experience with LMSR or similar mechanisms

**Nice to Have**:
- Built or audited prediction markets (Augur, Gnosis, Polymarket)
- Smart contract expertise (Solidity, Move, Rust)
- Published research in algorithmic game theory
- Industry experience (Jane Street, Jump Trading, Citadel, etc.)

**Suggested Experts**:
- Robin Hanson (George Mason University) - LMSR creator
- Gnosis/Polymarket engineering leads
- Augur core team members
- Academic researchers in prediction markets
- Quant researchers from trading firms

---

## Quick Start (15-Minute Review)

**Can't commit to full review yet? Do this first**:

1. Open [contracts/sources/amm_lmsr.move](contracts/sources/amm_lmsr.move)
2. Look at `fixed_exp()` (lines 42-77) and `fixed_ln()` (lines 83-144)
3. Check `calculate_cost()` (lines 148-182)
4. Answer these 3 questions:
   - Is the Taylor series approach fundamentally sound?
   - Do you see any obvious bugs or numerical issues?
   - Would you use this in production (yes/no/maybe)?

If you see major red flags, let us know immediately!
If it looks reasonable but needs deeper review, let's discuss engagement terms.

---

## Appendix: Code Snippets

### Current Default Configuration
```move
// From betting.move
const MIN_BET_AMOUNT: u64 = 1000000;              // 1 USDC
const MAX_BET_AMOUNT: u64 = 2000_000000;          // 2,000 USDC
const MAX_STAKE_RATIO: u64 = 300000;              // 30% of pool
const DEFAULT_LIQUIDITY: u64 = 10000_000000;      // 10,000 USDC (b parameter)
```

### Example Market State
```move
// Binary market: "Will BTC hit $100k by Dec 31?"
q = [5000_000000, 3000_000000]  // 5000 "No" shares, 3000 "Yes" shares
b = 10000_000000                // 10,000 USDC liquidity

// LMSR calculates:
C(q) = 10000 × ln(exp(5000/10000) + exp(3000/10000))
     = 10000 × ln(exp(0.5) + exp(0.3))
     = 10000 × ln(1.6487 + 1.3499)
     = 10000 × ln(2.9986)
     = 10000 × 1.0981
     = 10,981 USDC

Implied odds:
p_No = exp(0.5) / 2.9986 = 54.98%
p_Yes = exp(0.3) / 2.9986 = 45.02%
```

### Potential Issue Example
```move
// What happens with extreme bet?
q = [1000, 1000]           // Balanced market
buy_amount = 50000         // Huge bet (5x the liquidity)

// Does exp(50000/10000) = exp(5) overflow?
// exp(5) ≈ 148.4, scaled = 148.4 × 10^8 = 14,840,000,000
// This fits in u64 (max ~18 × 10^18)
// But exp(10) = 22,026... might overflow after scaling
// Where is the overflow boundary?
```

---

**Document Created**: October 26, 2025
**Status**: Ready for expert review
**Priority**: HIGH
**Next Step**: Share with qualified expert
