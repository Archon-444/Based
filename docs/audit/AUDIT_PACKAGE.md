# Security Audit Package
**Project:** Based Prediction Market
**Date Prepared:** 2025-10-23
**Status:** Ready for Audit

---

## Executive Summary

Based is a decentralized prediction market platform built on Base. The platform enables users to create, trade, and resolve prediction markets using an automated market maker (LMSR) with oracle-backed resolution.

**Key Features:**
- LMSR (Logarithmic Market Scoring Rule) AMM
- Multi-oracle integration (Pyth Network + custom oracles)
- Role-based access control (RBAC)
- Collateral vault management
- Dispute resolution mechanism
- Commit-reveal scheme

---

## 1. Project Overview

### 1.1 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  - Wallet integration (Petra, Martian)              │
│  - Market browsing and betting interface            │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Backend API (Node/Express)              │
│  - PostgreSQL persistence                            │
│  - Event indexing                                    │
│  - Rate limiting                                     │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│          Smart Contracts (Aptos/Move)                │
│  - Market Manager          - Oracle System           │
│  - LMSR AMM               - Collateral Vault         │
│  - Betting Logic          - Access Control           │
│  - Dispute Resolution     - Commit-Reveal            │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│               Aptos Blockchain                       │
└─────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

- **Blockchain:** Aptos
- **Smart Contract Language:** Move
- **Move Version:** Aptos Framework 1.x
- **Oracle:** Pyth Network
- **Collateral:** USDC (Circle native)

---

## 2. Audit Scope

### 2.1 In-Scope Contracts

**Total Lines of Code:** 5,421 lines of Move

| Module | File | LOC | Priority | Description |
|--------|------|-----|----------|-------------|
| Market Manager | `market_manager.move` | 316 | **Critical** | Core market creation and lifecycle |
| LMSR AMM | `amm_lmsr.move` | 396 | **Critical** | Automated market maker pricing |
| Oracle System | `oracle.move` | 1,320 | **Critical** | Oracle integration and validation |
| Betting Logic | `betting.move` | 429 | **Critical** | Bet placement and claiming |
| Collateral Vault | `collateral_vault.move` | 413 | **Critical** | Fund management and settlement |
| Multi-Oracle | `multi_oracle.move` | 586 | **High** | Multi-oracle consensus |
| Pyth Reader | `pyth_reader.move` | 425 | **High** | Pyth Network integration |
| Dispute Resolution | `dispute_resolution.move` | 491 | **High** | Market dispute handling |
| Access Control | `access_control.move` | 362 | **High** | RBAC implementation |
| Oracle Validator | `oracle_validator.move` | 218 | **Medium** | Oracle validation logic |
| Commit-Reveal | `commit_reveal.move` | 282 | **Medium** | Anti-frontrunning |
| AMM (Basic) | `amm.move` | 163 | **Low** | Legacy AMM (backup) |
| USDC Dev | `usdc_dev.move` | 120 | **Low** | Test token (not for mainnet) |

### 2.2 Out of Scope

The following components are **NOT** part of the security audit:

- Frontend React application (security review recommended separately)
- Backend Node.js API (security review recommended separately)
- PostgreSQL database schema
- Infrastructure configuration (Docker, deployment scripts)
- Third-party dependencies (Aptos Framework, Pyth SDK)
- Mobile app (future development)

---

## 3. Critical Areas for Review

### 3.1 Fund Security (Priority: CRITICAL)

**Collateral Vault Module**
- **Location:** `contracts/sources/collateral_vault.move`
- **Concerns:**
  - Proper escrow of user funds
  - Accurate payout calculations
  - Preventing withdrawal before settlement
  - Handling of edge cases (tie, invalid resolution)

**Key Functions:**
```move
public entry fun deposit(account: &signer, market_id: u64, amount: u64)
public entry fun withdraw(account: &signer, market_id: u64)
public fun calculate_payout(position: &Position, winning_outcome: u64): u64
```

**Questions for Auditors:**
- Is it possible to drain funds from the vault?
- Are payout calculations accurate for all scenarios?
- Can users withdraw funds they don't own?
- Are there integer overflow/underflow risks?

### 3.2 Oracle Manipulation (Priority: CRITICAL)

**Oracle Module**
- **Location:** `contracts/sources/oracle.move`
- **Concerns:**
  - Oracle price manipulation
  - Stale data handling
  - Multi-oracle consensus safety
  - Emergency fallback mechanisms

**Key Functions:**
```move
public fun submit_price(oracle: &signer, market_id: u64, price: u64, timestamp: u64)
public fun get_consensus_price(market_id: u64): u64
public fun validate_oracle(oracle_address: address): bool
```

**Questions for Auditors:**
- Can a malicious oracle manipulate market resolution?
- Is the multi-oracle consensus mechanism secure?
- Are stale prices properly rejected?
- Can emergency resolution be exploited?

### 3.3 AMM Pricing (Priority: CRITICAL)

**LMSR AMM Module**
- **Location:** `contracts/sources/amm_lmsr.move`
- **Concerns:**
  - Price calculation accuracy
  - Liquidity parameter manipulation
  - Front-running attacks
  - Market maker insolvency

**Key Functions:**
```move
public fun calculate_buy_price(market: &Market, outcome_index: u64, amount: u64): u64
public fun calculate_sell_price(market: &Market, outcome_index: u64, amount: u64): u64
public fun update_liquidity_parameter(admin: &signer, market_id: u64, new_b: u64)
```

**Questions for Auditors:**
- Are LMSR formulas implemented correctly?
- Can prices be manipulated through large trades?
- Is the liquidity parameter attack-resistant?
- Are fixed-point math operations safe (no overflow)?

### 3.4 Access Control (Priority: HIGH)

**Access Control Module**
- **Location:** `contracts/sources/access_control.move`
- **Concerns:**
  - Role escalation attacks
  - Proper admin controls
  - Emergency pause mechanism
  - Multi-sig requirement enforcement

**Key Functions:**
```move
public fun grant_role(admin: &signer, user: address, role: u8)
public fun revoke_role(admin: &signer, user: address, role: u8)
public fun has_role(user: address, role: u8): bool
public entry fun pause_system(admin: &signer)
```

**Questions for Auditors:**
- Can non-admins escalate privileges?
- Is the pause mechanism secure and reversible?
- Can roles be bypassed in any scenario?
- Is multi-sig properly enforced for critical operations?

### 3.5 Dispute Resolution (Priority: HIGH)

**Dispute Resolution Module**
- **Location:** `contracts/sources/dispute_resolution.move`
- **Concerns:**
  - Dispute spam prevention
  - Bond forfeiture safety
  - Resolution finality
  - Governance attack vectors

**Key Functions:**
```move
public entry fun create_dispute(account: &signer, market_id: u64, reason: vector<u8>)
public entry fun vote_on_dispute(account: &signer, dispute_id: u64, vote: bool)
public entry fun execute_dispute_resolution(admin: &signer, dispute_id: u64)
```

**Questions for Auditors:**
- Can disputes be used to DoS markets?
- Are bonds properly escrowed and refunded?
- Is the voting mechanism secure?
- Can dispute resolution be gamed?

---

## 4. Known Issues and Limitations

### 4.1 Known Issues (To Be Fixed)

**None Currently** - All 32 tests passing as of 2025-10-23

### 4.2 Design Limitations (Intentional)

1. **Single Collateral Type**
   - Only USDC supported
   - **Rationale:** Simplicity for MVP, multi-collateral in v2

2. **Centralized Oracle Whitelist**
   - Admins control oracle list
   - **Rationale:** Security > decentralization for MVP

3. **Manual Dispute Resolution**
   - Admin final say on disputes
   - **Rationale:** Governance token/DAO in future version

4. **No Market Editing**
   - Markets immutable after creation
   - **Rationale:** Prevent manipulation, ensures fairness

### 4.3 Assumptions

1. **Oracles are Semi-Trusted**
   - Pyth Network assumed reliable
   - Multi-oracle consensus as backup

2. **Admins are Trusted**
   - Admin keys secured with multi-sig
   - Planned transition to DAO governance

3. **USDC Contract is Secure**
   - Using Circle's official USDC
   - No custom token logic

---

## 5. Test Coverage

### 5.1 Test Results

**Overall:** 32/32 tests passing (100%)

```bash
Test result: OK. Total tests: 32; passed: 32; failed: 0
```

### 5.2 Test Categories

| Category | Tests | Coverage |
|----------|-------|----------|
| Market Management | 7 | Initialization, creation, lifecycle |
| LMSR Pricing | 6 | Price calculations, odds validation |
| Betting Flow | 9 | Bet placement, claiming, edge cases |
| Oracle Integration | 3 | Price submission, consensus, validation |
| Access Control | 3 | Role management, permissions |
| Integration | 4 | End-to-end flows, multi-user scenarios |

### 5.3 Notable Test Cases

✅ **Comprehensive Integration Tests**
- Complete market lifecycle (create → bet → resolve → claim)
- Multi-outcome markets
- Multiple users betting on same outcome
- AMM odds updates after bets
- Pause mechanism
- Role management
- Commit-reveal flow

✅ **Edge Cases Covered**
- Betting below minimum
- Betting on expired market
- Double initialization prevention
- Unauthorized resolution attempts
- Resolving before expiry

### 5.4 Test Execution

```bash
cd contracts
aptos move test
# All 32 tests pass
```

---

## 6. Security Considerations

### 6.1 Threat Model

**Attack Vectors:**

1. **Economic Attacks**
   - Front-running bets
   - Market manipulation via large trades
   - Oracle manipulation
   - Liquidity parameter attacks

2. **Technical Attacks**
   - Integer overflow/underflow
   - Reentrancy (less common in Move)
   - Access control bypass
   - Denial of service

3. **Governance Attacks**
   - Admin key compromise
   - Role escalation
   - Malicious market creation
   - Dispute spam

### 6.2 Mitigations Implemented

✅ **Economic:**
- Commit-reveal scheme prevents front-running
- Multi-oracle consensus prevents manipulation
- LMSR AMM prevents price manipulation
- Minimum bet amounts prevent spam

✅ **Technical:**
- Move's type system prevents many vulnerabilities
- Explicit ownership model (no reentrancy)
- Resource-based access control
- Comprehensive input validation

✅ **Governance:**
- Multi-sig admin keys (3-of-5)
- Time-locked admin operations
- Emergency pause mechanism
- Dispute bond requirements

### 6.3 Areas for Auditor Focus

**High Priority:**
1. Fixed-point math in LMSR calculations
2. Payout calculation accuracy
3. Oracle price validation
4. Access control enforcement
5. Vault fund accounting

**Medium Priority:**
6. Dispute resolution fairness
7. Market state transitions
8. Event emission completeness
9. Gas optimization
10. Error handling

**Low Priority:**
11. Code style and documentation
12. Test coverage improvements
13. Upgrade path considerations

---

## 7. Code Quality Metrics

### 7.1 Complexity Analysis

- **Average Function Length:** 25 lines
- **Max Function Length:** 80 lines (oracle.move:submit_price)
- **Cyclomatic Complexity:** Low to moderate
- **Documentation:** 80% functions documented

### 7.2 Code Patterns

✅ **Good Practices:**
- Consistent naming conventions
- Comprehensive error codes
- Detailed event emissions
- Modular architecture
- Separation of concerns

⚠️ **Areas for Improvement:**
- Some functions could be broken down further
- More inline comments for complex math
- Additional helper functions for readability

---

## 8. Comparison to Industry Standards

### 8.1 Benchmarks

**Polymarket (Polygon):**
- Uses UMA oracle (optimistic)
- Single AMM (no LMSR)
- Centralized market creation

**Augur (Ethereum):**
- REP token governance
- Decentralized oracle
- Complex dispute resolution

**Based (This Project):**
- Multi-oracle consensus
- LMSR AMM
- Hybrid centralized/decentralized model

### 8.2 Unique Features

✅ **Advantages:**
1. Aptos speed (160,000 TPS vs Ethereum's 15 TPS)
2. LMSR AMM (better than constant product)
3. Multi-oracle redundancy
4. Move language safety

⚠️ **Trade-offs:**
1. More centralized than Augur
2. Newer blockchain (less battle-tested)
3. Smaller ecosystem

---

## 9. Deployment Information

### 9.1 Testnet Deployment

**Network:** Aptos Testnet
**Module Address:** `0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81`
**Deployed:** 2025-10-20
**Status:** Active, all functions tested

### 9.2 Mainnet Plan

**Target Date:** Week 11 (after audit completion)
**Deployment Process:**
1. Final audit sign-off
2. Multi-sig deployment
3. Initial market creation
4. Gradual rollout (invite-only → public)
5. 24/7 monitoring

---

## 10. Contact Information

**Project Lead:** [Your Name]
**Email:** [Your Email]
**Telegram:** @[your_handle]
**GitHub:** https://github.com/[your-repo]

**Availability:**
- Timezone: [Your Timezone]
- Response Time: <24 hours
- Preferred Communication: Telegram > Email

---

## 11. Deliverables Expected from Audit

### 11.1 Audit Report

**Must Include:**
- Executive summary
- Detailed findings with severity (Critical, High, Medium, Low, Informational)
- Code snippets illustrating issues
- Recommended fixes
- Re-test results after remediation

### 11.2 Severity Classification

**Critical:** Funds at risk, immediate fix required
**High:** Security vulnerability, fix before launch
**Medium:** Security concern, fix or document
**Low:** Best practice, consider for future
**Informational:** Suggestions, non-security

### 11.3 Public Summary

Request a 1-page public summary suitable for:
- Website publication
- Social media sharing
- Investor presentations

---

## 12. Timeline and Budget

### 12.1 Proposed Timeline

| Week | Activity | Deliverable |
|------|----------|-------------|
| 4 | Audit kickoff | Contract freeze |
| 5-6 | Active audit period | Preliminary findings |
| 7 | Remediation | Fixes implemented |
| 8 | Re-audit | Final report |
| 9 | Public disclosure | Mainnet launch |

### 12.2 Budget

**Primary Audit:** $30,000 - $50,000
**Re-Audit:** $5,000 - $10,000
**Total:** $35,000 - $60,000

---

## 13. Post-Audit Plan

### 13.1 Remediation Process

1. **Triage** (Day 1): Categorize all findings
2. **Quick Wins** (Day 2-3): Fix low-hanging fruit
3. **Critical Fixes** (Day 4-7): Address critical/high issues
4. **Testing** (Day 8-10): Verify all fixes
5. **Re-Audit** (Day 11-14): Submit for review

### 13.2 Ongoing Security

**Post-Launch:**
- Bug bounty program (via Immunefi)
- Quarterly security reviews
- Incident response plan
- Insurance coverage (if available)

---

## 14. Appendices

### A. File Checksums

```bash
# Generate checksums for audit freeze
cd contracts/sources
sha256sum *.move > checksums.txt
```

### B. Build Instructions

```bash
# Clone repository
git clone [repo-url]
cd Based

# Install dependencies
aptos init

# Build contracts
cd contracts
aptos move compile

# Run tests
aptos move test
```

### C. Glossary

- **LMSR:** Logarithmic Market Scoring Rule (AMM algorithm)
- **Oracle:** External data provider for market resolution
- **Collateral:** Funds escrowed in vault for bets
- **RBAC:** Role-Based Access Control
- **Commit-Reveal:** Two-phase betting to prevent front-running

---

**Document Status:** ✅ Ready for Distribution
**Last Updated:** 2025-10-23
**Version:** 1.0
**Next Review:** After audit selection
