# Sui Testnet Deployment Guide

**Status:** ⚠️ Ready to Deploy (Waiting for Faucet Funds)
**Date:** October 21, 2025

---

## Current Setup Status

### ✅ Completed
- [x] Sui CLI installed (v1.58.2-homebrew)
- [x] Testnet configuration created
- [x] Deployment wallet generated
- [x] Smart contracts compile successfully
- [x] Deployment script created

### ⏳ Pending
- [ ] Fund wallet with testnet SUI
- [ ] Execute deployment
- [ ] Initialize contracts
- [ ] Test on testnet

---

## Deployment Wallet

**Address:** `0xf60393042570375e6a747d1baa9bffb2ef85826d7980d6fa77019328e5bf718d`

**Mnemonic (TESTNET ONLY - DO NOT USE FOR MAINNET):**
```
ceiling setup decide present hidden lawsuit relief gap math derive civil visa
```

**Alias:** blissful-carnelian

---

## Step 1: Fund the Wallet

### Option A: Web Faucet (Recommended)
1. Visit: https://faucet.sui.io/?address=0xf60393042570375e6a747d1baa9bffb2ef85826d7980d6fa77019328e5bf718d
2. Complete captcha
3. Click "Request SUI Tokens"
4. Wait for transaction confirmation

### Option B: CLI Faucet
```bash
sui client faucet
```

### Option C: Discord Faucet
1. Join Sui Discord: https://discord.gg/sui
2. Go to #testnet-faucet channel
3. Send: `!faucet 0xf60393042570375e6a747d1baa9bffb2ef85826d7980d6fa77019328e5bf718d`

### Verify Funding
```bash
sui client gas
```

You should see gas coins listed. You need at least **0.5 SUI** for deployment (gas budget = 500 million MIST = 0.5 SUI).

---

## Step 2: Deploy to Testnet

### Automated Deployment (Recommended)

```bash
cd contracts-sui
./deploy-testnet.sh
```

The script will:
- ✅ Check Sui CLI installation
- ✅ Verify environment is set to testnet
- ✅ Check gas balance
- ✅ Build contracts
- ✅ Deploy to testnet
- ✅ Parse and save deployment info
- ✅ Generate deployment-testnet.json

### Manual Deployment

If you prefer manual deployment:

```bash
cd contracts-sui

# 1. Build contracts
sui move build

# 2. Deploy
sui client publish --gas-budget 500000000 --skip-dependency-verification

# 3. Save the package ID from output
# Look for: packageId or Published Objects section
```

---

## Step 3: Verify Deployment

After deployment, you'll receive output like:

```
╭──────────────────────────────────────────────────────────────────╮
│ Published Objects                                                │
├──────────────────────────────────────────────────────────────────┤
│ PackageID: 0xabcd1234...                                        │
│ Version: 1                                                       │
│ Digest: xxx...                                                   │
│ Modules: market_manager, market_manager_v2, oracle_validator... │
╰──────────────────────────────────────────────────────────────────╯
```

### Save the Package ID

```bash
# Set environment variable
export SUI_PACKAGE_ID="0xabcd1234..."  # Replace with your actual package ID

# Verify
sui client object $SUI_PACKAGE_ID
```

### Check Deployment Details

```bash
# View published package
sui client object $SUI_PACKAGE_ID --json

# List all objects created
sui client objects
```

---

## Step 4: Initialize Contracts

After deployment, you need to initialize the system:

### 4.1 Find Shared Objects

The deployment creates several shared objects:
- `AdminCap` (owned by deployer)
- `ResolverCap` (owned by deployer)
- `OracleAdminCap` (owned by deployer)
- `RoleRegistry` (shared)
- `OracleRegistry` (shared)

```bash
# List all owned objects
sui client objects

# Find capability objects
sui client objects | grep -i "cap"
```

### 4.2 Initialize Oracle Registry

First, you need to whitelist oracle sources:

```bash
# This is a template - adjust based on actual function signatures
sui client call \
  --package $SUI_PACKAGE_ID \
  --module oracle_validator \
  --function whitelist_source \
  --args "0xOracleAdminCapID" "0xOracleRegistryID" "Pyth" true \
  --gas-budget 10000000
```

### 4.3 Create First Test Market

```bash
sui client call \
  --package $SUI_PACKAGE_ID \
  --module market_manager_v2 \
  --function create_market \
  --args \
    "\"Will Bitcoin reach $100k by end of 2025?\"" \
    "[\"Yes\", \"No\"]" \
    168 \
    "\"Manual\"" \
    16 \
    "0x6" \
  --gas-budget 100000000
```

---

## Step 5: Test the Deployment

### 5.1 Place a Test Bet

```bash
# Get market ID from previous transaction
export MARKET_ID="0x..."

# Get shard ID (usually 0-15 based on your address)
export SHARD_ID="0x..."

# Place bet (1 SUI on "Yes")
sui client call \
  --package $SUI_PACKAGE_ID \
  --module market_manager_v2 \
  --function place_bet \
  --args $MARKET_ID $SHARD_ID "1000000000" 1 "0x6" \
  --gas-budget 50000000
```

### 5.2 Check Market State

```bash
sui client object $MARKET_ID
```

### 5.3 View Transaction History

```bash
# Get recent transactions
sui client transactions --address $DEPLOYER_ADDRESS

# View specific transaction
sui client transaction <DIGEST>
```

---

## Step 6: Update Backend Configuration

Update your `backend/.env`:

```bash
# Sui Configuration
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_PACKAGE_ID=0xYOUR_PACKAGE_ID_HERE

# Admin Keys (TESTNET ONLY)
SUI_ADMIN_PRIVATE_KEY=YOUR_PRIVATE_KEY  # Export from sui.keystore
```

### Export Private Key

```bash
# View keystore
cat ~/.sui/sui_config/sui.keystore

# The format is: ["flag||private_key_base64"]
# Extract the base64 part after the ||
```

---

## Step 7: Connect Frontend

Update `dapp/.env`:

```bash
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_PACKAGE_ID=0xYOUR_PACKAGE_ID_HERE
```

Update the dApp configuration to use testnet:

```typescript
// dapp/src/config/sui.ts
export const suiConfig = {
  network: 'testnet' as const,
  packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID!,
  rpcUrl: 'https://fullnode.testnet.sui.io:443',
};
```

---

## Troubleshooting

### Issue: "No gas coins"

**Solution:** Fund your wallet using one of the faucet options above.

### Issue: "Insufficient gas"

**Solution:** Request more tokens from faucet or increase gas budget in publish command.

### Issue: "Version mismatch warning"

**Solution:** This is a warning, not an error. The CLI (1.58.2) is slightly older than the testnet (1.59.0). Update CLI if needed:

```bash
brew upgrade sui
# or
cargo install --locked --git https://github.com/MystenLabs/sui.git sui --force
```

### Issue: "Module not found" when calling functions

**Solution:** Check the exact module and function names in the deployed package:

```bash
sui client object $SUI_PACKAGE_ID --json | jq '.content.modules'
```

### Issue: "Entry function expected, public function found"

**Solution:** Some functions are marked `public` instead of `public entry`. You need to use them in programmable transactions or call via the RPC API.

---

## Alternative: Deploy to Devnet

If testnet faucet is unavailable, you can deploy to devnet:

```bash
# Switch to devnet
sui client switch --env devnet

# Or add devnet environment
sui client new-env --alias devnet --rpc https://fullnode.devnet.sui.io:443

# Request devnet tokens (usually less rate-limited)
sui client faucet

# Deploy
sui client publish --gas-budget 500000000
```

**Note:** Devnet resets periodically, so only use for testing.

---

## Deployment Checklist

Before deploying to testnet, ensure:

- [ ] Sui CLI installed and configured
- [ ] Wallet has sufficient SUI tokens (0.5+ SUI)
- [ ] Contracts compile successfully (`sui move build`)
- [ ] You've reviewed the deployment script
- [ ] Backend .env is ready to update
- [ ] Frontend .env is ready to update
- [ ] You have a plan for oracle data sources

After deployment:

- [ ] Package ID saved to deployment-testnet.json
- [ ] Package ID added to backend .env
- [ ] Package ID added to frontend .env
- [ ] Oracle registry initialized
- [ ] Test market created
- [ ] Test bet placed successfully
- [ ] Transaction explorer verified: https://testnet.suivision.xyz/

---

## Useful Commands

```bash
# Check Sui CLI version
sui --version

# View all environments
sui client envs

# Switch environment
sui client switch --env testnet

# View active address
sui client active-address

# List all addresses
sui client addresses

# Switch active address
sui client switch --address <ADDRESS>

# View gas coins
sui client gas

# View all owned objects
sui client objects

# View specific object
sui client object <OBJECT_ID>

# View transaction
sui client transaction <DIGEST>

# Execute dry run (test without committing)
sui client call --dry-run ...
```

---

## Next Steps After Deployment

1. **Security Testing**
   - Run load tests (see contracts-sui/tests/load/)
   - Test all contract functions
   - Verify oracle integration
   - Test settlement queue

2. **Integration Testing**
   - Connect backend to testnet
   - Test API endpoints
   - Connect frontend
   - End-to-end user flow testing

3. **Performance Testing**
   - Load test with 100 concurrent users
   - Verify P99 latency < 2s
   - Test market pool sharding
   - Monitor gas costs

4. **Prepare for Audit**
   - Document all functions
   - Create test reports
   - Run formal verification (Move Prover)
   - Schedule external audit

---

## Resources

- **Sui Documentation:** https://docs.sui.io
- **Sui Explorer (Testnet):** https://testnet.suivision.xyz/
- **Sui RPC Endpoints:** https://docs.sui.io/build/sui-api
- **Faucet:** https://faucet.sui.io/
- **Discord:** https://discord.gg/sui

---

**Deployment prepared by:** Claude Code
**Date:** October 21, 2025
**Estimated deployment time:** 5-10 minutes (once funded)
