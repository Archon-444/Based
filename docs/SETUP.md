# Development Setup Guide

## Prerequisites

- **Node.js** v18 or higher
- **Rust** (latest stable)
- **Aptos CLI**
- **Git**
- **Code Editor** (VS Code recommended with Move extension)

## Step 1: Install Aptos CLI

### macOS/Linux

```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

### Verify Installation

```bash
aptos --version
```

## Step 2: Clone Repository

```bash
cd ~/Documents  # or your preferred location
git clone https://github.com/Archon-444/Based.git
cd Based
```

## Step 3: Configure Aptos CLI

```bash
# Initialize for testnet
aptos init --network testnet

# This will create a new wallet and save credentials to .aptos/config.yaml
```

## Step 4: Fund Your Testnet Wallet

Visit the [Aptos Testnet Faucet](https://aptoslabs.com/testnet-faucet) and enter your wallet address to receive test APT tokens.

Or use CLI:

```bash
aptos account fund-with-faucet --account default
```

## Step 5: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install:
- React and React DOM
- Aptos TypeScript SDK
- Aptos Wallet Adapter
- React Router
- TypeScript and Vite

## Step 6: Set Up Environment Variables

```bash
# Create .env from example
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

Update these values:
- `VITE_APTOS_NETWORK=testnet`
- `VITE_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1`
- `VITE_MODULE_ADDRESS=0x...` *(deployed prediction_market package address — required for the dApp to target the correct modules)*

Copy the Aptos CLI profile template and keep the real keys out of source control:

```bash
cd contracts/.aptos
cp config.yaml.example config.yaml
# edit config.yaml with your private keys locally (do not commit this file)
```

## Step 7: Test Smart Contracts

```bash
cd contracts

# Compile contracts
aptos move compile

# Run tests
aptos move test

# Run with coverage
aptos move test --coverage
```

Expected output:
```
Running Move unit tests
[ PASS    ] 0xcafe::market_tests::test_initialize
[ PASS    ] 0xcafe::market_tests::test_create_market
...
Test result: OK. Total tests: 5; passed: 5; failed: 0
```

## Step 8: Deploy to Testnet (Optional)

```bash
# From contracts directory
aptos move publish \
  --named-addresses prediction_market=default \
  --profile testnet \
  --assume-yes
```

Save the deployed contract address and update `.env`:
```
VITE_MARKET_MANAGER_ADDRESS=0x... # your deployed address
```

## Step 9: Start Development Server

```bash
cd frontend
npm run dev
```

Visit: http://localhost:5173

## Step 10: Verify Everything Works

### Test Contract Compilation
```bash
cd contracts
aptos move test
# Should see all tests pass
```

### Test Frontend
```bash
cd frontend
npm run dev
# Should open browser at localhost:5173
```

### Test Wallet Connection
1. Open http://localhost:5173
2. Install Petra Wallet extension
3. Connect wallet
4. Should see your address

## Common Issues & Troubleshooting

### Issue: Aptos CLI not found

**Solution:**
```bash
# Add to PATH (for macOS/Linux)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
aptos --version
```

### Issue: Node version too old

**Solution:**
```bash
# Using nvm (Node Version Manager)
nvm install 18
nvm use 18
node --version  # Should show v18.x.x
```

### Issue: Move compilation fails

**Solution:**
```bash
cd contracts
rm -rf build
aptos move clean
aptos move compile
```

### Issue: Port 5173 already in use

**Solution:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### Issue: Wallet connection fails

**Solution:**
1. Ensure Petra Wallet is installed
2. Check wallet is on Testnet network
3. Refresh the page
4. Check browser console for errors

## Next Steps

Now that your environment is set up:

1. **Review Documentation**
   - Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
   - Check [ROADMAP.md](ROADMAP.md) for development plan
   - See [GAP_ANALYSIS.md](GAP_ANALYSIS.md) for current status

2. **Start Development**
   - Check [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines
   - Look for `good-first-issue` labels on GitHub
   - Join Discord for help

3. **Critical Next Steps**
   - Implement USDC integration
   - Add AMM/LMSR pricing
   - Integrate Pyth oracle
   - Set up compliance framework

## Development Workflow

### Daily Development

```bash
# 1. Update from main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Start development
cd frontend && npm run dev
# In another terminal
cd contracts && aptos move test --watch

# 4. Commit changes
git add .
git commit -m "feat: your feature description"

# 5. Push and create PR
git push origin feature/your-feature
```

### Testing Workflow

```bash
# Smart contracts
cd contracts
aptos move test
aptos move test --coverage

# Frontend
cd frontend
npm test
npm run lint
npm run type-check

# Integration tests (when available)
npm run test:e2e
```

## Resources

- [Aptos Documentation](https://aptos.dev)
- [Move Language Book](https://move-book.com)
- [Aptos TypeScript SDK](https://aptos.dev/sdks/ts-sdk)
- [Petra Wallet](https://petra.app)
- [Aptos Explorer (Testnet)](https://explorer.aptoslabs.com/?network=testnet)

## Getting Help

- **Documentation**: Check docs/ folder
- **GitHub Issues**: Report bugs or ask questions
- **Discord**: Join for real-time help
- **Stack Overflow**: Tag with `aptos` and `move`

---

**Congratulations! Your development environment is ready. Happy building! 🚀**
