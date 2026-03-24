# Remaining Work Before Deployment

## Current Status
- Fixed: Integer precision loss in payout calculation (using u128)
- Partially Fixed: Added reentrancy_guard field to Vault struct
- Operational updates (Jan 20, 2025): Load-test tooling, Swagger docs, monitoring manifests, audit package, runbooks.

## Operational Checklist (Q1 2025)

| Task | Status | Notes |
|------|--------|-------|
| Start load testing - verify rate limiting under stress | ⚙️ In Progress | Autocannon scripts in `backend/loadtests`. First baseline run scheduled this week. |
| Add Swagger/OpenAPI documentation for API | ✅ Complete | `/api-docs` served via Swagger UI, spec at `/api-docs.json`. |
| Contact audit firms (OtterSec, MoveBit) for quotes | 📨 Pending | `AUDIT_FIRMS.md` prepared; outreach emails to be sent by security lead. |
| Prepare audit package and documentation | ✅ Complete | See `AUDIT_PACKAGE.md` for scope & logistics. |
| Deploy Prometheus/Grafana monitoring | 🛠️ Ready | `monitoring/docker-compose.yml` available; deploy to staging/prod and configure credentials. |
| Create deployment and incident response runbooks | ✅ Complete | Refer to `DEPLOYMENT_RUNBOOK.md` and `INCIDENT_RESPONSE_RUNBOOK.md`. |

## Critical Tasks Remaining

### 1. Complete Reentrancy Guard Implementation
**File**: contracts/sources/collateral_vault.move
**Status**: Struct updated, need to implement guard logic
- [ ] Update initialize() to set reentrancy_guard: false
- [ ] Add guard checks to deposit()
- [ ] Add guard checks to claim_winnings()
- [ ] Add guard checks to lock_collateral()
- [ ] Add guard checks to unlock_collateral()

### 2. Make Market Resolution Atomic
**File**: frontend/src/services/MoveMarketSDK.ts
**Issue**: resolveMarket() calls two separate transactions (resolve + unlock)
**Risk**: If first succeeds but second fails, market is in inconsistent state
**Solutions**:
- [ ] Option A: Create single smart contract function that does both atomically
- [ ] Option B: Add rollback mechanism in SDK if second transaction fails
- [ ] Option C: Use transaction batching if Aptos supports it

### 3. Integrate RBAC with market_manager
**File**: contracts/sources/market_manager.move
**Issue**: Line 84 uses hardcoded @admin address
**Fix**:
- [ ] Import access_control module
- [ ] Replace hardcoded admin checks with RBAC role checks
- [ ] Update resolve_market to use RESOLVER role instead of admin/creator

### 4. Add Emergency Pause Mechanism
**Files**: All contract modules
**Required**:
- [ ] Add paused: bool to MarketStore struct
- [ ] Create pause_market() entry function (PAUSER role only)
- [ ] Create unpause_market() entry function (PAUSER role only)
- [ ] Add pause checks to place_bet(), create_market()
- [ ] Emit pause/unpause events

### 5. Integrate Oracle with Market Resolution
**Files**: market_manager.move, oracle.move
**Current**: Manual resolution by admin/creator
**Required**:
- [ ] Update resolve_market() to call oracle::check_consensus()
- [ ] Only allow resolution if oracle consensus reached
- [ ] Add fallback mechanism if oracles fail to reach consensus
- [ ] Document oracle dispute process

### 6. Add Transaction Simulation
**File**: frontend/src/services/MoveMarketSDK.ts
**Required**:
- [ ] Add simulateTransaction() helper method
- [ ] Call simulation before placeBet()
- [ ] Show gas estimates to user
- [ ] Warn if simulation fails

### 7. Add Route Guards
**File**: frontend/src/App.tsx
**Required**:
- [ ] Create ProtectedRoute component
- [ ] Wrap /dashboard, /market/:id betting actions
- [ ] Redirect to / with toast message if wallet not connected

## Medium Priority

### 8. Improve LMSR Implementation
**File**: contracts/sources/amm.move
**Issue**: Simplified linear approximation instead of true LMSR
**Required**:
- [ ] Implement logarithmic cost function: C(q) = b * ln(Σ exp(q_i/b))
- [ ] Add proper liquidity parameter bounds validation
- [ ] Add slippage tolerance parameter

### 9. Add Integration Tests
**Required**:
- [ ] Full bet lifecycle test (create -> bet -> resolve -> claim)
- [ ] Multi-user betting scenarios
- [ ] Oracle consensus testing
- [ ] Emergency pause testing
- [ ] RBAC permission testing

### 10. Run Move Prover
**File**: All .move files
**Required**:
- [ ] Add formal specifications with spec blocks
- [ ] Define invariants for Vault balance consistency
- [ ] Verify no overflow/underflow possible
- [ ] Verify access control correctness

## Deployment Checklist

### Pre-Testnet
- [ ] Complete all Critical Tasks (1-7)
- [ ] Run `aptos move compile` successfully
- [ ] Run `aptos move test` - all tests pass
- [ ] Manual testing on local devnet
- [ ] Gas optimization review

### Pre-Mainnet
- [ ] Professional security audit (CertiK/Trail of Bits)
- [ ] Complete Medium Priority tasks (8-10)
- [ ] Bug bounty program setup
- [ ] Comprehensive integration tests
- [ ] Load testing
- [ ] Documentation complete
- [ ] Emergency response plan documented

## Code Review Summary

### Fixed
✅ Integer precision loss in payout (u128 intermediate)
✅ Reentrancy guard struct added

### High Priority Remaining
🔴 Complete reentrancy guard implementation
🔴 Atomic market resolution
🔴 RBAC integration
🔴 Emergency pause mechanism
🔴 Oracle integration

### Medium Priority Remaining
🟡 LMSR improvement
🟡 Transaction simulation
🟡 Route guards
🟡 Integration tests
🟡 Move Prover verification
