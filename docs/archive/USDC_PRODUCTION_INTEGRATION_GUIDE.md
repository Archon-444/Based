# USDC Production Integration Guide

## Executive Summary

**Current Status**: Dev/test USDC shims (NOT production-ready)
**Target**: Circle's official native USDC on Aptos and Sui
**Effort**: ~2-3 weeks (configuration + testing + backend updates)
**Blocker Status**: ✅ **NO BLOCKERS** - Circle's native USDC is live on both chains

---

## Official Circle USDC Addresses (January 2025)

### Aptos

| Network | Address | Type |
|---------|---------|------|
| **Mainnet** | `0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b` | Dispatchable Fungible Asset |
| **Testnet** | `0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832` | Dispatchable Fungible Asset |

- **Token Name**: USDC
- **Token Symbol**: USDC
- **Decimals**: 6
- **Faucet**: https://faucet.circle.com (testnet only)

### Sui

| Network | Full Coin Type |
|---------|----------------|
| **Mainnet** | `0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC` |
| **Testnet** | `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC` |

- **Token Name**: USD Coin
- **Token Symbol**: USDC
- **Decimals**: 6

---

## Current Implementation Analysis

### Aptos - What Needs to Change

**Current Setup** ([contracts/Move.toml:8-10](contracts/Move.toml#L8-L10)):
```toml
[addresses]
prediction_market = "0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81"
# Dev shim deployed at same address
circle = "0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81"
```

**Issue**: Using custom [usdc_dev.move](contracts/sources/usdc_dev.move) with unlimited minting

**Contract Usage** (Already Correct ✅):
```move
// contracts/sources/collateral_vault.move:9
use circle::usdc::USDC;

// All code references circle::usdc::USDC - NO CHANGES NEEDED
```

---

### Sui - What Needs to Change

**Current Setup** ([contracts-sui/Move.toml:10-12](contracts-sui/Move.toml#L10-L12)):
```toml
[addresses]
prediction_market = "0x0"
circle_usdc = "0x0"
```

**Issue**: Custom [usdc.move](contracts-sui/sources/usdc.move) module with test coin

**Contract Usage**:
```move
// Sui contracts reference circle_usdc::usdc::USDC
// Need to update to reference Circle's official package
```

---

## Migration Plan

### Phase 1: Aptos Integration (Week 1)

#### Step 1.1: Update Move.toml Configuration

**For Testnet Development**:
```toml
[addresses]
prediction_market = "0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81"
# Circle's official testnet USDC
circle = "0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832"
```

**For Mainnet Deployment**:
```toml
[addresses]
prediction_market = "0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81"
# Circle's official mainnet USDC
circle = "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b"
```

#### Step 1.2: Remove Dev Shim

**Action**: Delete or archive [contracts/sources/usdc_dev.move](contracts/sources/usdc_dev.move)

**Reason**: Cannot coexist with real USDC module (namespace conflict)

**Backup Strategy**: Keep file in `contracts/sources/deprecated/usdc_dev.move` for local-only testing

#### Step 1.3: Test Compilation

```bash
cd contracts
aptos move compile --named-addresses prediction_market=0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81,circle=0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832
```

**Expected**: Clean compilation (no code changes needed - already references `circle::usdc::USDC`)

#### Step 1.4: Update Backend Configuration

**File**: `backend/.env`

```bash
# Add testnet USDC address
APTOS_USDC_ADDRESS=0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832

# For mainnet
APTOS_USDC_ADDRESS=0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b
```

#### Step 1.5: Update Frontend Configuration

**File**: `dapp/.env`

```bash
# Testnet
VITE_APTOS_USDC_ADDRESS=0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832

# Mainnet
VITE_APTOS_USDC_ADDRESS=0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b
```

#### Step 1.6: Get Testnet USDC

**Circle Faucet**: https://faucet.circle.com

**Process**:
1. Connect wallet
2. Select Aptos Testnet
3. Claim up to 10,000 testnet USDC per request
4. Use for testing deposits/bets

#### Step 1.7: Integration Testing

**Test Cases**:
```bash
# 1. Verify users can register for USDC
aptos move run \
  --function-id 0x1::coin::register \
  --type-args 0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832::usdc::USDC

# 2. Verify vault can accept USDC deposits
# 3. Verify betting with real USDC works
# 4. Verify withdrawals work
# 5. Verify claims work after resolution
```

---

### Phase 2: Sui Integration (Week 2)

#### Step 2.1: Update Move.toml Configuration

**For Testnet**:
```toml
[addresses]
prediction_market = "0x7634cdd3e628a9bf3c42ddbc4282649ed30cdc06d6e17e28df09729ecb6ea1fb"
# Circle's official testnet USDC package
circle_usdc = "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29"
```

**For Mainnet**:
```toml
[addresses]
prediction_market = "0x7634cdd3e628a9bf3c42ddbc4282649ed30cdc06d6e17e28df09729ecb6ea1fb"
# Circle's official mainnet USDC package
circle_usdc = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7"
```

#### Step 2.2: Remove Dev Shim

**Action**: Delete or move [contracts-sui/sources/usdc.move](contracts-sui/sources/usdc.move)

**Backup**: Move to `contracts-sui/sources/deprecated/usdc.move`

#### Step 2.3: Update Contract References

**Search for**: `circle_usdc::usdc::USDC`

**Verify**: All references point to the named address (already correct ✅)

**No code changes needed** if contracts already use:
```move
use circle_usdc::usdc::USDC;
```

#### Step 2.4: Test Compilation

```bash
cd contracts-sui
sui move build
```

#### Step 2.5: Update Backend Configuration

**File**: `backend/.env`

```bash
# Testnet - Full coin type
SUI_USDC_COIN_TYPE=0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC

# Mainnet
SUI_USDC_COIN_TYPE=0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC
```

**Update**: `backend/src/blockchain/sui/suiClient.ts`

```typescript
// Replace hardcoded USDC type with env var
const USDC_COIN_TYPE = process.env.SUI_USDC_COIN_TYPE ||
  '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';
```

#### Step 2.6: Update Frontend Configuration

**File**: `dapp/.env`

```bash
# Testnet
VITE_SUI_USDC_COIN_TYPE=0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC

# Mainnet
VITE_SUI_USDC_COIN_TYPE=0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC
```

#### Step 2.7: Get Testnet USDC

**Option 1**: Circle Faucet (if available for Sui)
**Option 2**: Use Sui Bridge from another testnet
**Option 3**: Contact Circle developer relations for testnet allocation

#### Step 2.8: Re-publish Contracts

```bash
cd contracts-sui
sui client publish --gas-budget 500000000
```

**Update**:
- New package ID in all environments
- All object IDs in backend/frontend .env files
- Bootstrap database with new package

---

### Phase 3: Backend Integration (Week 2-3)

#### Step 3.1: Update TypeScript Interfaces

**File**: `backend/src/types/blockchain.ts`

```typescript
export interface USDCConfig {
  // Aptos
  aptosTestnetAddress: string;
  aptosMainnetAddress: string;

  // Sui
  suiTestnetCoinType: string;
  suiMainnetCoinType: string;
}

export const USDC_CONFIG: USDCConfig = {
  aptosTestnetAddress: '0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832',
  aptosMainnetAddress: '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b',
  suiTestnetCoinType: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
  suiMainnetCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
};
```

#### Step 3.2: Remove Faucet Endpoints

**Files to Update**:
- `backend/src/routes/aptos.routes.ts`
- `backend/src/routes/sui.routes.ts`

**Action**: Remove or disable any `/faucet` endpoints that minted test USDC

**Reason**: Cannot mint production USDC (defeats the purpose)

**Alternative**: Redirect users to Circle's official faucet for testnet

#### Step 3.3: Add USDC Balance Checks

**Create**: `backend/src/services/usdcService.ts`

```typescript
export class USDCService {
  async getAptosBalance(address: string, network: 'testnet' | 'mainnet'): Promise<number> {
    const usdcAddress = network === 'testnet'
      ? USDC_CONFIG.aptosTestnetAddress
      : USDC_CONFIG.aptosMainnetAddress;

    // Query balance using Aptos SDK
  }

  async getSuiBalance(address: string, network: 'testnet' | 'mainnet'): Promise<number> {
    const coinType = network === 'testnet'
      ? USDC_CONFIG.suiTestnetCoinType
      : USDC_CONFIG.suiMainnetCoinType;

    // Query balance using Sui SDK
  }
}
```

#### Step 3.4: Update Transaction Building

**Verify**: All deposit/withdraw transactions reference correct USDC types

**Aptos**: Should use `coin::transfer<USDC>` with correct type parameter
**Sui**: Should use correct coin type in `coin::split` and `transfer` calls

---

### Phase 4: Frontend Updates (Week 3)

#### Step 4.1: Update USDC Display

**Components to Update**:
- Balance display components
- Deposit modals
- Betting interface
- Withdrawal interface

**Changes**:
- Use env var for USDC address/coin type
- Show "USDC" instead of "Test USDC"
- Add Circle branding/trust indicators

#### Step 4.2: Add USDC Acquisition Flow

**For Testnet**:
```typescript
// Add helper to direct users to Circle faucet
const getTestnetUSDC = () => {
  window.open('https://faucet.circle.com', '_blank');
};
```

**For Mainnet**:
- Link to centralized exchanges (Coinbase, Kraken, etc.)
- Link to DEXs with USDC pairs
- Explain on-ramp options

#### Step 4.3: Update Wallet Integration

**Ensure**:
- Wallet automatically suggests USDC registration if not registered
- Clear error messages if user lacks USDC
- Proper handling of USDC decimals (6 vs 18)

---

## Testing Strategy

### Unit Tests

**Aptos**:
```move
#[test]
fun test_deposit_production_usdc() {
    // Mock Circle USDC deposit
    // Verify vault accepts it
}
```

**Sui**:
```move
#[test]
fun test_betting_with_production_usdc() {
    // Use Circle USDC coin type
    // Verify all flows work
}
```

### Integration Tests

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| User registers for USDC | Account can receive USDC | ⬜ |
| User deposits USDC to vault | Balance increases correctly | ⬜ |
| User places bet with USDC | Bet recorded, USDC locked | ⬜ |
| Market resolves | Winners can claim | ⬜ |
| User withdraws USDC | USDC returns to wallet | ⬜ |
| Check Circle faucet works | Can get testnet USDC | ⬜ |

### End-to-End Testing

**Testnet Validation**:
1. Deploy with production USDC addresses
2. Create test market
3. Have 3+ users bet with Circle USDC
4. Resolve market
5. Verify all payouts work
6. Check gas costs are reasonable

**Mainnet Preparation**:
- All tests pass on testnet
- Security audit includes USDC integration review
- Monitor first transactions closely

---

## Risk Mitigation

### Risk 1: Circle USDC API Changes

**Likelihood**: LOW
**Impact**: HIGH

**Mitigation**:
- Subscribe to Circle developer updates
- Monitor Circle's changelog
- Have rollback plan to previous version

### Risk 2: USDC Testnet Availability

**Likelihood**: MEDIUM (faucet rate limits)
**Impact**: MEDIUM (testing blocked)

**Mitigation**:
- Request bulk testnet allocation from Circle
- Maintain small dev USDC pool for internal testing
- Document alternative testing approaches

### Risk 3: User Confusion (Test vs Production USDC)

**Likelihood**: HIGH
**Impact**: MEDIUM

**Mitigation**:
- Clear UI labeling (Testnet / Mainnet)
- Warnings before transactions
- Separate deployments (never mix test/prod)

### Risk 4: Gas Costs Higher Than Expected

**Likelihood**: MEDIUM
**Impact**: MEDIUM

**Mitigation**:
- Benchmark gas costs before launch
- Optimize transaction batching
- Communicate costs to users upfront

---

## Rollback Strategy

**If Production USDC Integration Fails**:

1. **Immediate**: Pause contract operations via emergency pause
2. **Investigate**: Determine if issue is config, code, or Circle-side
3. **Fix or Revert**:
   - **Config issue**: Update addresses, redeploy
   - **Code issue**: Fix contracts, get audit approval, redeploy
   - **Circle issue**: Contact Circle support, wait for resolution
4. **Resume**: Unpause once verified working

**Maintain Dev Shim for Local Development**:
```toml
# Local-only Move.toml.dev
[addresses]
circle = "0x1"  # Deploy dev shim locally for isolated testing
```

---

## Timeline & Budget

| Phase | Duration | Cost | Dependencies |
|-------|----------|------|--------------|
| Phase 1: Aptos Integration | 1 week | $8k-$12k | None (ready to start) |
| Phase 2: Sui Integration | 1 week | $8k-$12k | Phase 1 complete |
| Phase 3: Backend Updates | 1 week | $6k-$10k | Phases 1-2 complete |
| Phase 4: Frontend Updates | 3-5 days | $4k-$6k | Phase 3 complete |
| Testing & Validation | 3-5 days | $4k-$6k | All phases complete |
| **Total** | **2.5-3 weeks** | **$30k-$46k** | Audit overlap possible |

**Accelerated Timeline** (parallel work):
- Aptos + Sui integration: 1 week (same patterns)
- Backend + Frontend: 1 week (parallel teams)
- Testing: 3-5 days
- **Total: 2-2.5 weeks** with dedicated resources

---

## Success Criteria

✅ **Must Have**:
- [ ] All contracts reference Circle's official USDC addresses
- [ ] Dev shims removed from production deployments
- [ ] Backend correctly queries Circle USDC balances
- [ ] Frontend displays real USDC balances
- [ ] End-to-end test passes on testnet with Circle USDC
- [ ] Gas costs documented and acceptable
- [ ] Security audit includes USDC integration review

✅ **Nice to Have**:
- [ ] Automatic USDC registration for new users
- [ ] Clear on-ramp guidance for mainnet users
- [ ] USDC balance warnings before transactions
- [ ] Circle branding/trust indicators in UI

---

## Next Steps

**Immediate Actions**:

1. ✅ **Read this guide** - Understand the full scope
2. 📋 **Approve approach** - Confirm this plan matches your vision
3. 🔧 **Start Phase 1** - Update Aptos Move.toml and test compilation
4. 💰 **Register for Circle testnet faucet** - Get USDC for testing
5. 📅 **Schedule integration** - Block 2-3 weeks for this work

**Questions to Answer**:
- Do you want to maintain a dev shim for local testing, or test exclusively against testnets?
- Should we complete Aptos first, then Sui? Or do both in parallel?
- Do you have Circle developer contacts for bulk testnet USDC allocation?

---

**Report Created**: October 26, 2025
**Based On**: Circle official documentation and developer resources
**Verified**: USDC is live on both Aptos and Sui (mainnet + testnet)
**Status**: ✅ NO BLOCKERS - Ready to begin integration
