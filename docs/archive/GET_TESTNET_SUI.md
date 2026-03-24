# Get Testnet SUI Tokens

The faucet API is currently rate-limited. Please use the web interface to get testnet SUI tokens.

## Your Testnet Address

```
0xf60393042570375e6a747d1baa9bffb2ef85826d7980d6fa77019328e5bf718d
```

## Option 1: Web Faucet (Recommended)

**Click this link:**
https://faucet.sui.io/?address=0xf60393042570375e6a747d1baa9bffb2ef85826d7980d6fa77019328e5bf718d

Then:
1. Complete the captcha
2. Click "Request SUI Tokens"
3. Wait for confirmation

## Option 2: Discord Faucet

1. Join Sui Discord: https://discord.gg/sui
2. Go to #testnet-faucet channel
3. Send this command:
   ```
   !faucet 0xf60393042570375e6a747d1baa9bffb2ef85826d7980d6fa77019328e5bf718d
   ```

## Verify You Received Tokens

After requesting tokens, verify with:

```bash
sui client gas
```

You should see something like:
```
╭────────────────────────────────────────────────────────────────────┬────────────────┬──────────────────╮
│ gasCoinId                                                          │ mistBalance    │ suiBalance       │
├────────────────────────────────────────────────────────────────────┼────────────────┼──────────────────┤
│ 0x...                                                              │ 1000000000     │ 1.00             │
╰────────────────────────────────────────────────────────────────────┴────────────────┴──────────────────╯
```

## Once You Have Tokens

Run the deployment:

```bash
cd contracts-sui
./deploy-testnet.sh
```

Or deploy manually:

```bash
sui client publish --gas-budget 500000000 --skip-dependency-verification
```
