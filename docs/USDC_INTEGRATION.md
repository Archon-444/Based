# 🪙 USDC Integration Guide

Complete USDC integration for the Based, replacing AptosCoin with native USDC for all betting operations.

## 📋 What's Been Added

### Smart Contracts (Move)
- **`collateral_vault.move`** - Manages all USDC deposits, locks, and payouts
- **`betting.move`** - Betting logic using USDC, integrates with existing market_manager
- **`usdc.move` (dev shim)** - Circle-compatible USDC contract for devnet/testing
- **Integration tests** - Comprehensive test coverage for all modules

### Frontend Integration (TypeScript)
- **`BasedSDK.ts`** - Complete TypeScript SDK for frontend
- **Deployment script** - Automated deployment with initialization

## 🚀 Quick Start

### 1. Deploy Contracts

```bash
# Make script executable
chmod +x scripts/deploy-usdc.sh

# Run deployment
./scripts/deploy-usdc.sh
```

The script will:
- ✅ Initialize your Aptos account
- ✅ Fund it with devnet APT
- ✅ Compile all Move modules
- ✅ Run comprehensive tests
- ✅ Deploy to devnet
- ✅ Initialize all contracts
- ✅ Create frontend .env file

### 2. Test the Integration

```bash
cd contracts
aptos move test --named-addresses prediction_market=<YOUR_ADDRESS>,admin=<YOUR_ADDRESS>
```

### 3. Use in Frontend

```typescript
import { BasedSDK } from './services/BasedSDK';
import { Network } from "@aptos-labs/ts-sdk";

const sdk = new BasedSDK(
  Network.DEVNET,
  import.meta.env.VITE_MODULE_ADDRESS!,
  import.meta.env.VITE_USDC_MODULE_ADDRESS
);

// Get USDC balance
const balance = await sdk.getUSDCBalance(userAddress);

// Claim test USDC (devnet only)
await sdk.registerForUSDC(account);
await sdk.claimUSDCFromFaucet(account);

// Place a bet
const betAmount = sdk.toMicroUSDC(100); // 100 USDC
await sdk.placeBet(account, marketId, outcome, betAmount);
```

## 💰 USDC Implementation Details

### Currency Standard
- **Decimals**: 6 (same as native USDC)
- **Minimum Bet**: 1 USDC (1,000,000 micro-USDC)
- **Maximum Bet**: 1M USDC (1,000,000,000,000 micro-USDC)

### Architecture

```
User Wallet (USDC)
    ↓
Betting Module
    ↓
Collateral Vault
    ↓
Position Tracking
```

### Key Features

✅ **Secure USDC Custody**
- All USDC locked in secure vault contract
- Automated escrow management
- Funds released only after market resolution

✅ **Position Tracking**
- Each user's positions tracked per market
- Support for multiple bets on same outcome
- Automatic payout calculation

✅ **Integration with Existing System**
- Works seamlessly with your existing `market_manager`
- Uses Table-based storage for efficiency
- Friend module pattern for security

## 📚 Module Overview

### `collateral_vault.move`
Manages all USDC operations:
- `deposit()` - Accept USDC from users when placing bets
- `lock_collateral()` - Lock USDC for active markets
- `unlock_collateral()` - Unlock when market resolves
- `claim_winnings()` - Let winners claim their payouts

### `betting.move`
Handles betting logic:
- `place_bet()` - Place a bet with USDC
- `claim_winnings()` - Claim winnings after resolution
- `calculate_payout()` - Calculate potential returns
- `get_odds()` - Get current market odds

### `usdc.move` (dev shim)
Devnet/testing only:
- `initialize()` - Deploy the Circle-compatible USDC type at `circle::usdc`
- `faucet()` - Mint 1000 USDC for local testing
- `register()` - Register to receive USDC

> ⚠️ **Important:** This module must never be published to mainnet. In production,
> point the `circle` named address to Circle's official deployment and exclude
> the dev shim from your release package.

## 🧪 Testing

### Run All Tests
```bash
cd contracts
aptos move test --named-addresses prediction_market=default,admin=default
```

### Test Coverage
- ✅ Complete betting lifecycle
- ✅ Multiple bets on same outcome
- ✅ Multi-outcome markets
- ✅ Payout calculations
- ✅ Odds calculation
- ✅ Error cases (insufficient funds, expired markets, etc.)
- ✅ Faucet functionality

### Manual Testing on Devnet

1. **Get Test USDC**
```bash
aptos move run \
  --function-id <USDC_MODULE_ADDR>::usdc::faucet \
  --args address:<USDC_MODULE_ADDR>
```

2. **Create Market**
```bash
aptos move run \
  --function-id <MODULE_ADDR>::market_manager::create_market \
  --args 'string:Will BTC hit $100k?' \
         'vector<vector<u8>>:[[89, 101, 115], [78, 111]]' \
         u64:24
```

3. **Place Bet**
```bash
aptos move run \
  --function-id <MODULE_ADDR>::betting::place_bet \
  --args u64:0 u8:0 u64:100000000  # market_id=0, outcome=0, 100 USDC
```

4. **Check Your Position**
```bash
aptos move view \
  --function-id <MODULE_ADDR>::collateral_vault::get_user_position \
  --args address:<YOUR_ADDRESS> u64:0
```

## 🔄 Migration Path to Mainnet

Circle operates native USDC on Aptos under the following coin types:

| Network | Type Tag |
|---------|---------|
| **Mainnet** | `0xc0de4c979914cc543a8b57829b4eca3829a4362791ccaf153d7c8dafc9d5dd37::Coins::USDC` |
| **Testnet** | `0x4610f80e1668139b98b813d4577f145ec5a9b46b4fd7bc2f973c78aa427cdca4::coins::USDC` |

When moving to staging/mainnet:

1. **Supply the Circle address at build/publish time**
   ```bash
   # Local / dev
   aptos move test --named-addresses circle=0xcafe

   # Testnet
   aptos move build --named-addresses circle=0x4610f80e1668139b98b813d4577f145ec5a9b46b4fd7bc2f973c78aa427cdca4

   # Mainnet
   aptos move publish --named-addresses circle=0xc0de4c979914cc543a8b57829b4eca3829a4362791ccaf153d7c8dafc9d5dd37
   ```

2. **Retain the dev shim for tests only**
   - `circle::usdc` functions are tagged with `#[test_only]` and exist solely
     for automated tests and faucets.

3. **Update frontend/backend configuration**
   - Set `VITE_APTOS_USDC_ADDRESS`, `.env` `APTOS_USDC_ADDRESS`, etc. to match
     the target network.

## 📊 Gas Estimates (Devnet)

| Operation | Approximate Gas |
|-----------|----------------|
| Register USDC | ~1,500 APT |
| Create Market | ~2,000 APT |
| Place Bet | ~3,000 APT |
| Claim Winnings | ~2,500 APT |
| Resolve Market | ~2,000 APT |

## 🐛 Common Issues & Solutions

### "Module not found" error
- Verify module address is correct in `.env`
- Ensure contracts are deployed: `aptos account list --profile default`

### "Insufficient funds" when placing bet
- Check USDC balance: `sdk.getUSDCBalance(address)`
- Claim from faucet: `sdk.claimUSDCFromFaucet(account)`

### "Coin not registered" error
- Register for USDC first: `sdk.registerForUSDC(account)`

### Tests failing
- Ensure you're using correct named addresses
- Check that timestamp is set in tests
- Verify all modules are properly initialized

## 🎯 What's Next

Now that USDC integration is complete, you can:

1. ✅ **Test thoroughly on devnet**
2. ⏭️ **Add Oracle integration** (Pyth Network for price feeds)
3. ⏭️ **Implement AMM pricing** (LMSR for dynamic odds)
4. ⏭️ **Build frontend UI components**
5. ⏭️ **Prepare for mainnet** (switch to Circle USDC)

## 📝 SDK Reference

### Conversion Helpers
```typescript
// Convert to micro-USDC
const microAmount = sdk.toMicroUSDC(100); // 100 USDC → 100,000,000

// Convert from micro-USDC
const usdcAmount = sdk.fromMicroUSDC(100_000_000); // → 100

// Format for display
sdk.formatUSDC(100_000_000); // → "$100.00"

// Format odds
sdk.formatOdds(6543); // → "65.43%"
```

### Core Operations
```typescript
// Market operations
await sdk.createMarket(account, question, outcomes, durationHours);
await sdk.getMarket(marketId);
await sdk.isMarketActive(marketId);

// Betting operations
await sdk.placeBet(account, marketId, outcome, amountMicroUSDC);
await sdk.calculatePayout(marketId, stake, outcome);
await sdk.getOdds(marketId);

// Claiming
await sdk.claimWinnings(account, marketId);

// User data
await sdk.getUserPosition(userAddress, marketId);
await sdk.hasPosition(userAddress, marketId);
```

## 🔒 Security Considerations

- Access control: Only admin/creator can resolve markets
- Initialization guards prevent double-initialization
- Safe math operations (no overflow)
- Friend module pattern restricts vault access
- Comprehensive error handling with specific abort codes

## 📞 Support

For issues:
1. Check test files for usage examples
2. Review SDK documentation above
3. Examine deployment script output
4. Run tests with `--verbose` flag

---

**Status**: ✅ USDC integration complete and tested
**Ready for**: Devnet testing and frontend integration
**Next milestone**: Oracle integration (Option D from roadmap)
