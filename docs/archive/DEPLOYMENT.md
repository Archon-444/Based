# 🚀 Deployment Guide - Move Market

## ✅ Deployment Successful!

**Network:** Aptos Devnet
**Contract Address:** `0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710`
**Transaction Hash:** `0x9e4e8ed6078c488243189f4ef566726dd6521a5159819931b98e41966d9574ff`
**Explorer:** [View on Aptos Explorer](https://explorer.aptoslabs.com/txn/0x9e4e8ed6078c488243189f4ef566726dd6521a5159819931b98e41966d9574ff?network=devnet)

---

## 📦 Deployed Modules

All 6 modules deployed successfully:

1. **`amm`** - Automated Market Maker (LMSR pricing)
2. **`oracle`** - Oracle integration (Manual, Pyth, API, Custom)
3. **`market_manager`** - Market creation and management
4. **`usdc` (dev shim)** - Dev/test Circle USDC with faucet
5. **`collateral_vault`** - Collateral and position management
6. **`betting`** - Betting logic with reentrancy protection

---

## 🔧 Deployment Steps (Completed)

### 1. Initialize Aptos Account ✅
```bash
cd contracts
aptos init --network devnet --assume-yes
```

**Result:**
- Account: `0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710`
- Funded with: 100000000 Octas (1 APT)

### 2. Compile Contracts ✅
```bash
aptos move compile \
  --named-addresses prediction_market=0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710,admin=0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710
```

**Result:** All modules compiled successfully (with minor warnings)

### 3. Publish to Devnet ✅
```bash
aptos move publish \
  --named-addresses prediction_market=0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710,admin=0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710 \
  --assume-yes
```

**Result:**
- Gas used: 13,959 units
- Status: ✅ Executed successfully
- Package size: 25,919 bytes

### 4. Update Frontend Config ✅
Updated `frontend/.env`:
```bash
REACT_APP_MODULE_ADDRESS=0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710
REACT_APP_NETWORK=DEVNET
```

---

## 🧪 Testing the Deployment

### Test 1: Claim Test USDC from Faucet
```typescript
import { useUSDCFaucet } from './hooks/useTransactions';

// In your component:
const { claimFromFaucet, isLoading } = useUSDCFaucet();

// Claim 1000 USDC
await claimFromFaucet();
```

**Expected Module Call:**
```
<USDC_MODULE_ADDR>::usdc::faucet
```

### Test 2: Create a Market
```typescript
import { useCreateMarket } from './hooks/useTransactions';

const { createMarket, isLoading } = useCreateMarket();

await createMarket(
  "Will Bitcoin reach $100k by end of 2025?",
  ["Yes", "No"],
  720 // 30 days in hours
);
```

**Expected Module Call:**
```
0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710::market_manager::create_market
```

### Test 3: Place a Bet
```typescript
import { usePlaceBet } from './hooks/useTransactions';

const { placeBet, isLoading } = usePlaceBet();

await placeBet(
  0,    // marketId
  0,    // outcome (0 = Yes, 1 = No)
  10    // amount in USDC
);
```

**Expected Module Call:**
```
0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710::betting::place_bet
```

### Test 4: Check USDC Balance
```typescript
import { useUSDCBalance } from './hooks/useUSDC';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const { account } = useWallet();
const { balanceUSDC, formatted } = useUSDCBalance(account?.address);

console.log(`Balance: ${formatted}`); // e.g., "$1,000.00"
```

**Expected Module Call:**
```
<USDC_MODULE_ADDR>::usdc::balance
```

---

## 🔍 Verification

### Check Deployment on Explorer
Visit: https://explorer.aptoslabs.com/account/0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710?network=devnet

**You should see:**
- All 6 modules listed under "Modules"
- Transaction history showing the publish transaction
- Account balance

### Verify Module Functions
You can query functions directly using the Aptos CLI:

```bash
# Get market count (should be 0 initially)
aptos move run \
  --function-id 0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710::market_manager::get_market_count
```

---

## 📱 Frontend Integration Status

### ✅ Completed
- [x] SDK configured with deployed address
- [x] All hooks point to correct module address
- [x] Environment variables updated
- [x] Build successful

### 🔄 Ready to Test
- [ ] Connect wallet (Petra/Martian)
- [ ] Claim USDC from faucet
- [ ] Create test market
- [ ] Place bets
- [ ] Check balances
- [ ] View user positions

---

## 🔐 Account Information

**Deployer Account:**
```
Address: 0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710
Network: Devnet
Private Key: Stored in .aptos/config.yaml (DO NOT SHARE)
```

**⚠️ SECURITY WARNING:**
- The `.aptos/config.yaml` file contains your private key
- Never commit this file to version control
- For production, use a hardware wallet or secure key management

---

## 🛠️ Troubleshooting

### Issue: "Module not found"
**Solution:** Ensure frontend `.env` has correct address:
```
REACT_APP_MODULE_ADDRESS=0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710
```

### Issue: "Insufficient balance"
**Solution:** Fund account via faucet:
```bash
aptos account fund-with-faucet --account 0xe77d3b5e1d1d54218bd8a2c2ad5a32da9acc058c682ca7fa0db259e01f68a710
```

### Issue: "Transaction failed"
**Solution:** Check transaction on explorer and verify:
1. Correct function arguments
2. Sufficient gas
3. Module address is correct

---

## 📊 Gas Costs

**Deployment:** 13,959 gas units × 100 octas = ~0.0014 APT

**Estimated Transaction Costs:**
- Create Market: ~500-1000 gas units
- Place Bet: ~300-500 gas units
- Claim Winnings: ~300-500 gas units
- USDC Faucet: ~200-400 gas units

---

## 🚀 Next Steps

1. **Start Frontend Dev Server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Install Petra Wallet**
   - Chrome Extension: https://petra.app/
   - Switch to Devnet in wallet settings

3. **Connect & Test**
   - Connect wallet to app
   - Claim test USDC
   - Create a market
   - Place test bets

4. **Deploy to Testnet (Optional)**
   ```bash
   aptos init --network testnet
   aptos move publish --network testnet
   ```

5. **Deploy to Mainnet (Production)**
   - Audit smart contracts
   - Test extensively on testnet
   - Use secure key management
   - Update frontend to mainnet

---

## 📝 Important Notes

- **Test USDC:** This deployment uses a test USDC token with a faucet. For production, integrate real USDC.
- **Oracle Integration:** Currently supports manual resolution. Integrate Pyth or custom oracles for automated resolution.
- **Admin Functions:** Market resolution requires admin account (`0xe77d...`). Implement proper governance for production.

---

**Deployment Date:** 2025-10-08
**Aptos CLI Version:** 7.9.1
**Network:** Devnet
**Status:** ✅ Live and Ready for Testing
