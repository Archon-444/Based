# Testnet Deployment Status

**Last Updated**: 2025-10-12
**Network**: Aptos Devnet
**Contract Address**: `0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894`

## ✅ Deployment Verification Complete

### Contract Configuration

All smart contracts are **successfully deployed and initialized** on Aptos Devnet with the following configuration:

| Parameter | Value | Status |
|-----------|-------|--------|
| **Liquidity Parameter (b)** | 10,000 USDC | ✅ Verified |
| **Minimum Bet** | 1 USDC | ✅ Verified |
| **Maximum Bet** | 2,000 USDC | ✅ Verified |
| **System Status** | Not Paused | ✅ Active |
| **Market Count** | 0 | ✅ Ready |

### Deployed Modules

All 11 modules successfully deployed:

1. ✅ **access_control** - RBAC and system pause functionality
2. ✅ **amm** - Linear AMM (legacy)
3. ✅ **amm_lmsr** - LMSR implementation with safety validation
4. ✅ **usdc (dev shim)** - Circle-compatible test USDC
5. ✅ **oracle** - Oracle integration
6. ✅ **market_manager** - Core market creation and resolution
7. ✅ **commit_reveal** - Anti-front-running protection
8. ✅ **collateral_vault** - USDC collateral management
9. ✅ **betting** - Betting logic with LMSR integration
10. ✅ **dispute_resolution** - Dispute handling
11. ✅ **multi_oracle** - Multi-oracle aggregation

### Initialized Resources

| Resource | Status | Details |
|----------|--------|---------|
| **BettingConfig** | ✅ Initialized | b=10,000 USDC, min=1, max=2,000 |
| **Vault** | ✅ Initialized | Balance: 0 USDC, Admin set |
| **MarketStore** | ✅ Initialized | Ready for market creation |
| **AccessRegistry** | ✅ Initialized | System active (not paused) |
| **MarketCollateral** | ✅ Initialized | Ready to track positions |

## LMSR Safety Validation

The deployed contracts enforce **industry-standard safety mechanisms**:

### Ratio Enforcement: q/b < 0.3

```move
// From betting.move:151-160
fun validate_bet_ratio(new_stake: u64, liquidity_parameter: u64) {
    let ratio = (new_stake * 1_000000) / liquidity_parameter;
    assert!(ratio < MAX_STAKE_RATIO, E_BET_EXCEEDS_SAFE_RATIO);
}
```

**Configuration**:
- `MAX_STAKE_RATIO` = 300000 (0.3 = 30%)
- Error code: `E_BET_EXCEEDS_SAFE_RATIO` (13)

### Supported Bet Ranges

With b=10,000 USDC and q/b < 0.3 enforcement:

| Scenario | Current Stake | Max Additional Bet | Total Allowed |
|----------|--------------|-------------------|---------------|
| New outcome | 0 USDC | 2,000 USDC | 2,000 USDC |
| Light betting | 500 USDC | 2,000 USDC | 2,500 USDC |
| Moderate betting | 1,500 USDC | 1,500 USDC | 3,000 USDC |
| Heavy betting | 2,500 USDC | 500 USDC | 3,000 USDC |
| At safety limit | 2,999 USDC | 1 USDC | 3,000 USDC |
| **Exceeds limit** | 3,000+ USDC | ❌ Rejected | - |

## Transaction Details

### Deployment Transaction
- **Transaction Hash**: `0xd5b8aff15d873b13d16ca20809661dcffd3fd56998d0d3adda82596c8bf6e44c`
- **Gas Used**: 21,656 units (~0.002 APT)
- **Status**: Success ✅
- **Timestamp**: 2025-10-12

### Initialization Transactions
1. ✅ market_manager::initialize
2. ✅ collateral_vault::initialize (seed=b"vault", metadata=USDC object)
3. ✅ betting::initialize (reads vault address from config)
4. ✅ oracle::initialize (seed=b"oracle")

## Frontend Integration

### TypeScript SDK Connection

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

const CONTRACT_ADDRESS = "0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894";
```

### Query Liquidity Parameter

```typescript
const liquidityParam = await aptos.view({
  function: `${CONTRACT_ADDRESS}::betting::get_liquidity_parameter`,
  typeArguments: [],
  functionArguments: [],
});

console.log("Liquidity parameter:", liquidityParam[0]); // 10000000000 (10,000 USDC)
```

### Query Market Count

```typescript
const marketCount = await aptos.view({
  function: `${CONTRACT_ADDRESS}::market_manager::get_market_count`,
  typeArguments: [],
  functionArguments: [],
});

console.log("Active markets:", marketCount[0]); // 0
```

### Check System Status

```typescript
const isPaused = await aptos.view({
  function: `${CONTRACT_ADDRESS}::access_control::is_paused`,
  typeArguments: [],
  functionArguments: [],
});

console.log("System paused:", isPaused[0]); // false
```

## CLI Testing Commands

All commands assume you're in the `/contracts` directory with the testnet-phase1 profile configured.

### View Functions (Read-Only)

```bash
# Check liquidity parameter (b)
aptos move view \
  --function-id 0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894::betting::get_liquidity_parameter \
  --profile testnet-phase1

# Check market count
aptos move view \
  --function-id 0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894::market_manager::get_market_count \
  --profile testnet-phase1

# Check if system is paused
aptos move view \
  --function-id 0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894::access_control::is_paused \
  --profile testnet-phase1
```

## Known Limitations

### CLI Market Creation

**Issue**: The `create_market` function uses `vector<vector<u8>>` for outcomes, which cannot be passed directly via Aptos CLI `aptos move run`.

**Impact**: Market creation must be done via:
1. TypeScript SDK (recommended)
2. Frontend dApp
3. Custom transaction builder

**Workaround**: Use the TypeScript SDK for testing:

```typescript
const transaction = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${CONTRACT_ADDRESS}::market_manager::create_market`,
    functionArguments: [
      "Will Bitcoin reach $100k by end of 2025?",
      [
        new TextEncoder().encode("Yes"),
        new TextEncoder().encode("No")
      ],
      168 // duration in hours
    ],
  },
});
```

## Next Steps

### Phase 1 Complete ✅
- [x] Deploy contracts to devnet
- [x] Initialize all modules
- [x] Verify LMSR configuration (b=10k)
- [x] Validate safety parameters (q/b < 0.3)
- [x] Confirm system is active

### Phase 2: Frontend Integration 🚀
- [ ] Connect frontend to deployed contract
- [ ] Test market creation from dApp
- [ ] Test betting flow with test USDC
- [ ] Validate odds calculation with LMSR
- [ ] Test safety rejection (bets > 3,000 USDC per outcome)

### Phase 3: Production Deployment 📦
- [ ] Choose domain name (PredictApt.com recommended)
- [ ] Deploy frontend to Vercel
- [ ] Configure DNS and SSL
- [ ] Deploy to Aptos Mainnet
- [ ] Announce launch

## Resources

- **Explorer**: [View contract on Aptos Explorer](https://explorer.aptoslabs.com/account/0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894?network=devnet)
- **Fullnode**: https://fullnode.devnet.aptoslabs.com
- **Faucet**: https://faucet.devnet.aptoslabs.com

## Security Considerations

### Mainnet Checklist
Before deploying to mainnet:

1. ✅ **LMSR Safety**: Enforced via validate_bet_ratio()
2. ✅ **Reentrancy Protection**: Guards in BettingConfig
3. ✅ **Access Control**: RBAC system initialized
4. ⚠️ **Test USDC**: Must replace with Circle's native USDC on mainnet
5. ⏳ **Audit**: Consider third-party security audit before mainnet
6. ⏳ **Gradual Launch**: Start with low liquidity parameters

### Admin Functions

The following functions require admin privileges:
- `betting::update_liquidity_parameter()` - Adjust b value
- `market_manager::resolve_market()` - Resolve market outcomes
- `betting::unlock_market_collateral()` - Unlock after resolution
- `access_control::pause()` / `unpause()` - Emergency controls

**Admin Address**: `0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894`

## Support

- **Documentation**: See `/docs` directory
- **Architecture**: [ARCHITECTURE_DECOUPLED.md](./ARCHITECTURE_DECOUPLED.md)
- **Deployment Guide**: [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md)
- **Safety Features**: [BET_LIMITS_AND_SAFETY.md](./BET_LIMITS_AND_SAFETY.md)

---

**Status**: ✅ **READY FOR FRONTEND INTEGRATION**

All smart contracts are deployed, initialized, and verified on Aptos Devnet. The platform is ready for frontend testing and user acceptance testing before mainnet deployment.
