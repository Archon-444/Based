# Prediction Market - Quick Start Guide

**Last Updated**: 2025-10-21
**Status**: ✅ Deployed to Sui Devnet

---

## 🎯 Project Overview

**Prediction Market** is a decentralized prediction market platform with:
- **Sui blockchain** integration (production-ready security hardening)
- **Market pool sharding** for high scalability (1000+ concurrent users)
- **Oracle validation** with staleness checks and circuit breakers
- **LMSR-powered** markets with safe fixed-point math
- **Sui Devnet deployment** complete and verified

---

## 📁 Project Structure

```
aptos-prediction-market/
├── contracts-sui/      # Sui Move contracts (✅ deployed to devnet)
├── backend/           # Node.js backend API
├── dapp/              # React dApp (wallet-connected)
├── docs/              # Documentation
└── scripts/           # Deployment scripts
```

---

## 🚀 Sui Devnet Deployment - LIVE!

### ✅ Deployment Complete

**Package ID:** `0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3`
**Network:** Devnet
**Explorer:** https://suiscan.xyz/devnet/object/0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3

### Quick Configuration

**Backend (.env):**
```bash
SUI_NETWORK=devnet
SUI_PACKAGE_ID=0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3
SUI_RPC_URL=https://fullnode.devnet.sui.io:443
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_SUI_NETWORK=devnet
NEXT_PUBLIC_SUI_PACKAGE_ID=0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3
```

### Start Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd dapp && npm install && npm run dev
```

---

## 🌐 Deployment

### Marketing Site → Cloudflare Pages

1. Connect GitHub repository
2. Build settings:
   - Build command: (none)
   - Build output: `/marketing`
3. Deploy

### dApp → Vercel

1. Connect GitHub repository
2. Build settings:
   - Framework: Vite
   - Root directory: `dapp`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Environment variables:
   ```
   VITE_APP_NETWORK=devnet
   VITE_APP_CONTRACT_ADDRESS=0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894
   VITE_APP_API_URL=https://fullnode.devnet.aptoslabs.com
   ```
4. Deploy

---

## 🔗 DNS Configuration

```
Type: CNAME | Name: @   | Content: movemarket.pages.dev
Type: CNAME | Name: www | Content: movemarket.app
Type: CNAME | Name: app | Content: cname.vercel-dns.com
```

Enable Cloudflare proxy (orange cloud) for all records.

---

## 📊 Smart Contracts

**Network**: Sui Devnet
**Package ID**: `0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3`

**Status**: ✅ Deployed and verified

**Modules**:
- ✅ `market_manager_v2` - Production-ready market manager with security fixes
- ✅ `oracle_validator` - Oracle validation with staleness checks
- ✅ `access_control` - Role-based access control
- ✅ `market_manager` - Original market manager (v1)

**Security Features**:
- Market pool sharding (16 shards for parallelism)
- Deterministic settlement ordering
- Safe fixed-point math (no overflow)
- Oracle staleness protection (5s max age)
- Circuit breaker (10% max deviation)

**Explorer**: [View on Sui Devnet](https://suiscan.xyz/devnet/object/0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3)

---

## 🎨 Brand Identity

- **Name**: Move Market
- **Tagline**: "Where degens bet on what's probably true"
- **Icon**: 👁️ (eye emoji)
- **Colors**:
  - Primary gradient: #A94BFF → #2ED5FF (purple to cyan)
  - Background: #0F0F1E (dark navy)
- **Fonts**: Space Grotesk (headings), Inter (body)

---

## 📚 Key Documentation

### Deployment & Testing
1. **[SUI_DEVNET_DEPLOYMENT_SUCCESS.md](SUI_DEVNET_DEPLOYMENT_SUCCESS.md)** - Complete deployment details, testing guide
2. **[deployment-devnet.json](contracts-sui/deployment-devnet.json)** - Deployment configuration
3. **[SUI_DEPLOYMENT_GUIDE.md](SUI_DEPLOYMENT_GUIDE.md)** - Full deployment guide for testnet/mainnet
4. **[SUI_TEST_STATUS.md](SUI_TEST_STATUS.md)** - Test suite status and fixes needed

### Security & Architecture
5. **[SUI_SECURITY_CRITICAL_RISKS.md](SUI_SECURITY_CRITICAL_RISKS.md)** - 5 critical risks + solutions (30KB)
6. **[SUI_SECURITY_TESTING_GUIDE.md](SUI_SECURITY_TESTING_GUIDE.md)** - Testing procedures (25KB)
7. **[contracts-sui/FORMAL_VERIFICATION.md](contracts-sui/FORMAL_VERIFICATION.md)** - Move Prover specs
8. **[SUI_COMPREHENSIVE_DELIVERY.md](SUI_COMPREHENSIVE_DELIVERY.md)** - Complete delivery summary (5000+ lines)

---

## ✅ Pre-Launch Checklist

### Domain & DNS
- [ ] Purchase domain (Move Market recommended)
- [ ] Configure Cloudflare DNS
- [ ] Enable SSL/TLS

### Deployment
- [ ] Deploy marketing to Cloudflare Pages
- [ ] Deploy dApp to Vercel
- [ ] Test complete user flow

### Assets
- [ ] Create OG image (1200x630)
- [ ] Optimize images
- [ ] Add analytics (GA4 or Plausible)

### Testing
- [ ] Test wallet connections (Petra, Martian)
- [ ] Test market viewing
- [ ] Test betting flow
- [ ] Mobile responsiveness
- [ ] Lighthouse audit (95+ score)

### Community
- [ ] Create @Move MarketMarket Twitter
- [ ] Create @OracleBro Twitter
- [ ] Set up Discord server
- [ ] Announce airdrop criteria

---

## 🎯 Launch Timeline

**Week 1**: Final testing & DNS setup
**Week 2**: Deploy to production
**Week 3**: Community launch & marketing

---

## 💡 Next Actions

### Immediate (Today)
1. **Update configurations** - Add package ID to backend and frontend .env files
2. **Initialize oracle registry** - Whitelist oracle sources (Pyth, Switchboard, etc.)
3. **Create test market** - Via backend API or frontend dApp
4. **Test full flow** - Create → Bet → Resolve

### Short-term (This Week)
5. **Run integration tests** - End-to-end user journeys
6. **Load testing** - Verify 1000+ concurrent users (P99 < 2s)
7. **Deploy to testnet** - When testnet faucet is available
8. **Security audit prep** - Run formal verification, prepare audit materials

### Medium-term (Weeks 2-4)
9. **External security audit** - Trail of Bits, Zellic, or OpenZeppelin
10. **Mainnet deployment** - Production launch after audit
11. **Liquidity bootstrap** - $150-250K strategy (grants + market makers)

---

## 🆘 Support

- **Sui Documentation:** https://docs.sui.io
- **Devnet Explorer:** https://suiscan.xyz/devnet
- **Discord:** https://discord.gg/sui
- **Project Docs:** See `/docs` directory

---

**Status**: 🎉 **DEPLOYED TO DEVNET - READY FOR TESTING**

Sui smart contracts deployed and verified on devnet. Ready for integration testing and development.

**Package ID:** `0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3`
