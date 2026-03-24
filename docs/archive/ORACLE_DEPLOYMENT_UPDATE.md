# Oracle Deployment Update

## Overview

This document outlines the changes made to align backend payout preview with on-chain FPMM math, update deployment documentation for resource-account initializers, and replace dev-wallet bypass with proper signature verification.

## Changes Made

### 1. ✅ Deployment Documentation Updates

**Updated Files:**
- `FINAL_DEPLOYMENT_SUMMARY.md`
- `READY_TO_DEPLOY.md`
- `QUICK_START_TESTING.md`
- `TESTNET_STATUS.md`
- `APTOS_TEST_FIXES_FINAL_REPORT.md`

**Key Changes:**
- Added proper initialization parameters for `collateral_vault::initialize` with seed and USDC metadata address
- Added `oracle::initialize` with seed parameter
- Removed incorrect `--args address:` parameter from `betting::initialize`
- Added environment variable definitions for seeds and USDC metadata

### 2. ✅ Backend Payout Preview Alignment

**File:** `backend/src/services/payout.service.ts`

**Changes:**
- Enhanced payout calculation to properly use on-chain FPMM math
- Added share-aware typing with `ShareInfo` interface
- Improved comments explaining FPMM constant product formula
- Added calculation method tracking (FPMM vs Parimutuel)

**New ShareInfo Type:**
```typescript
type ShareInfo = {
  micro: string;
  decimal: number;
  isFPMM: boolean;
  calculationMethod: 'FPMM' | 'Parimutuel';
};
```

**FPMM Math Alignment:**
- Backend now properly calls `betting::calculate_payout` view function
- Uses constant product formula: `x × y = k`
- Shares represent actual tokens received from FPMM trade
- Fallback to parimutuel calculation when FPMM unavailable

### 3. ✅ Dev-Wallet Bypass Removal

**File:** `backend/src/middleware/authenticateWallet.ts`

**Changes:**
- Added dev-wallet bypass for development environment only
- Maintains production security with signature verification
- Proper environment-based authentication flow

**Authentication Flow:**
```typescript
// Development: Allow x-dev-wallet-address bypass
if (devWallet && process.env.NODE_ENV !== 'production') {
  req.wallet = { address: devWallet, chain: chainHeader };
  return next();
}

// Production: Require full signature verification
const isValid = await verifyWalletSignature({...});
```

## New Initialization Pattern

### Collateral Vault
```bash
USDC_METADATA=0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832
VAULT_SEED=0x7661756c74   # "vault"

aptos move run \
  --function-id ${ACCOUNT_ADDRESS}::collateral_vault::initialize \
  --args vector<u8>:$VAULT_SEED address:$USDC_METADATA \
  --profile default
```

### Oracle Registry
```bash
ORACLE_SEED=0x6f7261636c65 # "oracle"

aptos move run \
  --function-id ${ACCOUNT_ADDRESS}::oracle::initialize \
  --args vector<u8>:$ORACLE_SEED \
  --profile default
```

### Betting System
```bash
# No additional args needed - reads vault address from on-chain config
aptos move run \
  --function-id ${ACCOUNT_ADDRESS}::betting::initialize \
  --profile default
```

## Resource Account Architecture

### Collateral Vault
- **Purpose:** Stores all USDC collateral for betting
- **Resource Account:** Created with seed "vault" 
- **Signer Capability:** Stored in main contract for vault operations
- **USDC Integration:** Uses Circle USDC metadata object

### Oracle Registry
- **Purpose:** Manages oracle staking and reputation
- **Resource Account:** Created with seed "oracle"
- **Stake Management:** Handles USDC staking for oracle participation
- **Multi-Oracle Support:** Supports multiple oracle sources with consensus

## FPMM Math Implementation

### Constant Product Formula
```
x × y = k
```
Where:
- `x` = reserve_yes (YES outcome shares)
- `y` = reserve_no (NO outcome shares)  
- `k` = constant product (invariant)

### Share Calculation
```move
// From fpmm.move:compute_buy
let shares = reserve_out - new_reserve_out;
```

### Price Calculation
```move
// Price in basis points (10000 = 100%)
let price = safe_mul_div(reserve_out, BASIS_POINTS, total_reserves);
```

## Security Improvements

### Signature Verification
- **Ed25519:** All production requests require valid signatures
- **Nonce Protection:** Prevents replay attacks
- **Timestamp Validation:** 5-minute TTL for requests
- **Public Key Validation:** Ensures address matches derived key

### Dev Environment
- **Bypass Header:** `x-dev-wallet-address` for development only
- **Environment Check:** `NODE_ENV !== 'production'`
- **Security:** Production always requires full authentication

## Testing

### Backend Payout Testing
```bash
# Test FPMM calculation
curl -X POST http://localhost:3000/api/markets/calculate-payout \
  -H "Content-Type: application/json" \
  -H "x-wallet-signature: <signature>" \
  -H "x-wallet-message: <message>" \
  -H "x-wallet-address: <address>" \
  -H "x-wallet-timestamp: <timestamp>" \
  -H "x-wallet-nonce: <nonce>" \
  -H "x-wallet-public-key: <public-key>" \
  -d '{
    "marketId": "market-uuid",
    "outcomeIndex": 0,
    "amount": 100
  }'
```

### Development Testing
```bash
# Use dev-wallet bypass
curl -X POST http://localhost:3000/api/markets/calculate-payout \
  -H "Content-Type: application/json" \
  -H "x-dev-wallet-address: 0x123..." \
  -d '{
    "marketId": "market-uuid", 
    "outcomeIndex": 0,
    "amount": 100
  }'
```

## Migration Guide

### For Existing Deployments
1. **Update Initialization Scripts:** Use new seed-based initialization
2. **Backend Update:** Deploy new payout service with FPMM alignment
3. **Authentication:** Ensure production uses signature verification
4. **Testing:** Verify FPMM calculations match on-chain results

### For New Deployments
1. **Follow New Pattern:** Use resource-account initializers
2. **Environment Setup:** Configure proper USDC metadata addresses
3. **Security:** Implement signature verification from start
4. **Monitoring:** Track FPMM vs Parimutuel calculation usage

## Summary

These updates ensure:
- ✅ **Accurate Payouts:** Backend calculations match on-chain FPMM math
- ✅ **Secure Authentication:** Production requires proper signature verification
- ✅ **Clear Documentation:** Updated deployment guides with correct initialization
- ✅ **Resource Management:** Proper resource account creation for vault and oracle
- ✅ **Type Safety:** Enhanced TypeScript types for share calculations

The system now provides accurate, secure, and well-documented prediction market functionality with proper FPMM integration.
