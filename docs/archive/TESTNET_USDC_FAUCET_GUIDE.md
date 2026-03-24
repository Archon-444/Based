# How to Get Testnet USDC for Testing

## Circle Official Faucet

**URL**: https://faucet.circle.com

### What You'll Get
- **Real Circle testnet USDC** (not a dev shim)
- Behaves identically to production USDC
- No real monetary value (testnet only)

### Supported Networks
✅ Aptos Testnet
✅ Sui Testnet (verify availability)
✅ And many other chains

### How to Use

#### For Aptos Testing

1. **Visit**: https://faucet.circle.com
2. **Connect Wallet**: Use Petra, Martian, or Pontem wallet
3. **Select Network**: Choose "Aptos Testnet"
4. **Request USDC**: Click "Get Test USDC"
5. **Amount**: Up to 10,000 USDC per request
6. **Wait**: Transaction confirms in ~2-5 seconds

**USDC Address (Testnet)**: `0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832`

#### For Sui Testing

1. **Visit**: https://faucet.circle.com
2. **Connect Wallet**: Use Sui Wallet or Suiet
3. **Select Network**: Choose "Sui Testnet"
4. **Request USDC**: Click "Get Test USDC"
5. **Amount**: Check faucet for limits
6. **Wait**: Transaction confirms in ~2-3 seconds

**USDC Coin Type (Testnet)**:
```
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

---

## Why This is Better Than Dev Shims

| Feature | Circle Testnet USDC | Custom Dev Shim |
|---------|---------------------|-----------------|
| **Realism** | Identical to production | Simplified test version |
| **Security** | Audited by Circle | Unaudited |
| **Behavior** | Real USDC mechanics | May differ from production |
| **Trust** | Official Circle module | Custom implementation |
| **Testing Value** | High confidence | Lower confidence |

---

## Testing Workflow

### 1. Get Testnet USDC
```bash
# Visit Circle faucet and request USDC for your test wallet
```

### 2. Register for USDC (First Time Only)

**Aptos**:
```bash
aptos move run \
  --function-id 0x1::coin::register \
  --type-args 0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832::usdc::USDC
```

**Sui**:
```typescript
// Registration happens automatically when receiving USDC
```

### 3. Verify Balance

**Aptos**:
```bash
aptos account list --query resources \
  | grep -A 10 "0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832::usdc::USDC"
```

**Sui**:
```bash
sui client gas --coin-type 0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

### 4. Test Your Application

Now you can:
- ✅ Deposit USDC into vault
- ✅ Place bets with USDC
- ✅ Withdraw USDC
- ✅ Claim winnings after resolution

---

## Troubleshooting

### Issue: "USDC not registered"

**Solution (Aptos)**:
```bash
# Register for USDC first
aptos move run \
  --function-id 0x1::coin::register \
  --type-args 0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832::usdc::USDC
```

**Solution (Sui)**:
Sui registers coins automatically on first receipt.

### Issue: "Faucet rate limited"

**Solutions**:
1. Wait 24 hours and try again
2. Use a different wallet address
3. Contact Circle developer relations for bulk allocation: devrel@circle.com
4. For urgent needs: Mention you're testing their official USDC integration

### Issue: "Can't find Circle faucet for Sui"

**Alternative**:
If Circle faucet doesn't support Sui yet:
1. Bridge USDC from another testnet using Wormhole or LayerZero
2. Contact Circle: https://www.circle.com/en/developers
3. Temporarily use dev shim for local-only testing

---

## For Mainnet Deployment

### DO NOT use faucets in production!

**Aptos Mainnet USDC**: `0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b`

**Sui Mainnet USDC**: `0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC`

### How Users Get Mainnet USDC:

1. **Centralized Exchanges**: Buy USDC on Coinbase, Kraken, Binance, etc. and withdraw to wallet
2. **DEXs**: Swap other tokens for USDC on Pancake Swap, Thala, Cetus, etc.
3. **Circle Mint**: Institutions can mint/redeem directly through Circle
4. **On-Ramps**: Use services like MoonPay, Ramp Network to buy with fiat

---

## Quick Reference

### Aptos Testnet
- **Faucet**: https://faucet.circle.com
- **USDC Address**: `0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832`
- **Max per Request**: 10,000 USDC

### Sui Testnet
- **Faucet**: https://faucet.circle.com
- **USDC Coin Type**: `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC`
- **Max per Request**: Check faucet

### Support
- **Circle Docs**: https://developers.circle.com/stablecoins/usdc-contract-addresses
- **Circle Support**: https://www.circle.com/en/support
- **Developer Relations**: devrel@circle.com

---

**Last Updated**: October 26, 2025
**Circle USDC Version**: Native (not bridged)
