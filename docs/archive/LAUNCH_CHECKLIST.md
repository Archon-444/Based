# 🚀 Production Launch Checklist

## Current Status

✅ **Smart Contracts**: Deployed to Aptos Devnet
✅ **Backend**: LMSR + Safety validation complete
✅ **Frontend**: React app ready to build
⏳ **Domain**: Need to purchase
⏳ **Hosting**: Need to deploy
⏳ **Testing**: Need end-to-end validation

---

## Phase 1: Domain & Branding (30 minutes)

### Step 1: Check Domain Availability (5 min)

Visit: **https://www.namecheap.com/domains/domain-name-search/**

**Top Choices** (in priority order):
1. ✨ **PredictApt.com** (RECOMMENDED)
2. ForesightMarket.com
3. AptosOracle.com
4. MoveMarkets.io
5. ChainSight.io

**Action**:
```bash
# Check all 5 names and note which are available
1. [ ] PredictApt.com - Available? Yes / No
2. [ ] ForesightMarket.com - Available? Yes / No
3. [ ] AptosOracle.com - Available? Yes / No
4. [ ] MoveMarkets.io - Available? Yes / No
5. [ ] ChainSight.io - Available? Yes / No
```

### Step 2: Purchase Domain (10 min)

**Recommended**: Namecheap or Cloudflare

**Namecheap**:
1. Add domain to cart
2. Enable WhoisGuard (free privacy)
3. Checkout: ~$12/year for .com
4. Auto-renew: Enable

**Cloudflare** (cheaper):
1. Cloudflare Dashboard → Registrar
2. Register domain: ~$10/year
3. Auto-renew: Enable

**Cost**: $10-15/year

### Step 3: Logo & Branding Assets (15 min - optional for MVP)

**Minimum Required**:
- Favicon (32x32px)
- OG Image for social (1200x630px)

**Quick Options**:
1. **Canva**: Free templates
2. **Figma**: Design from scratch
3. **AI Generate**: DALL-E/Midjourney

**Placeholder**: Use text logo for now, upgrade later

---

## Phase 2: Frontend Build (15 minutes)

### Step 1: Update Contract Addresses (5 min)

Create/update: `frontend/src/config/constants.ts`

```typescript
// frontend/src/config/constants.ts
export const CONFIG = {
  NETWORK: "devnet", // Change to "mainnet" when ready
  MODULE_ADDRESS: "0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894",
  RPC_URL: "https://fullnode.devnet.aptoslabs.com/v1",
  FAUCET_URL: "https://faucet.devnet.aptoslabs.com",
};

export const CONTRACT_FUNCTIONS = {
  CREATE_MARKET: `${CONFIG.MODULE_ADDRESS}::market_manager::create_market`,
  PLACE_BET: `${CONFIG.MODULE_ADDRESS}::betting::place_bet`,
  GET_ODDS: `${CONFIG.MODULE_ADDRESS}::betting::get_odds`,
  CLAIM_WINNINGS: `${CONFIG.MODULE_ADDRESS}::betting::claim_winnings`,
};
```

### Step 2: Build Production Bundle (5 min)

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/frontend

# Install dependencies if needed
npm install

# Build for production
npm run build

# Output will be in: dist/
# Size should be: 500KB - 2MB

# Test locally
npm run preview
# Visit: http://localhost:4173
```

### Step 3: Verify Build (5 min)

**Checklist**:
- [ ] App loads without errors
- [ ] Wallet connection works
- [ ] UI is responsive (mobile/desktop)
- [ ] No console errors
- [ ] All routes work

---

## Phase 3: Deploy to Vercel (20 minutes)

### Option A: Vercel CLI (Fastest) ⭐

```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Login to Vercel
vercel login
# Follow browser auth

# Deploy from frontend directory
cd /Users/philippeschmitt/Documents/aptos-prediction-market/frontend

# Deploy to production
vercel --prod

# Answer prompts:
# ? Set up and deploy? [Y/n] Y
# ? Which scope? <your-username>
# ? Link to existing project? [y/N] N
# ? What's your project's name? prediction-market
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] N

# Vercel auto-detects Vite and deploys!
```

**Output**: You'll get a URL like:
```
https://prediction-market-abc123.vercel.app
```

**Time**: 2-5 minutes

### Option B: Vercel Dashboard (More Control)

1. Visit: **https://vercel.com/new**
2. Click "Import Git Repository"
3. Authenticate with GitHub
4. Select repository: `aptos-prediction-market`
5. Configure project:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variables (optional):
   ```
   VITE_MODULE_ADDRESS=0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894
   VITE_NETWORK=devnet
   ```
7. Click **"Deploy"**

**Time**: 5-10 minutes

---

## Phase 4: Connect Custom Domain (15 minutes)

### Step 1: Add Domain in Vercel (5 min)

1. Go to your Vercel project
2. Settings → Domains
3. Click **"Add"**
4. Enter your domain: `predictapt.com`
5. Vercel will show DNS records needed

**DNS Records from Vercel**:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 2: Configure DNS in Namecheap (10 min)

1. Namecheap Dashboard → Domain List
2. Click **"Manage"** next to your domain
3. **Advanced DNS** tab
4. Add New Record:

**For Root Domain**:
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

**For WWW Subdomain**:
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

5. **Remove** any placeholder records
6. Click **"Save All Changes"**

### Step 3: Verify & Wait (5-60 min)

**Check DNS Propagation**:
```bash
# Check A record
dig predictapt.com

# Should show: 76.76.21.21

# Check CNAME
dig www.predictapt.com

# Should show: cname.vercel-dns.com
```

**Or use**: https://www.whatsmydns.net/

**Typical wait**: 5-30 minutes (can be up to 48 hours)

---

## Phase 5: Production Testing (30 minutes)

### Critical Path Test

```
Test User Flow:
1. [ ] Visit https://predictapt.com
2. [ ] Connect Petra/Martian wallet
3. [ ] Create test market
4. [ ] Place bet (100 USDC)
5. [ ] Check odds update (LMSR)
6. [ ] Try max bet (2000 USDC)
7. [ ] Try exceeding ratio (should fail)
8. [ ] Resolve market (admin)
9. [ ] Claim winnings
10. [ ] Verify funds received
```

### Edge Cases

```
Safety Tests:
1. [ ] Bet exactly 2000 USDC (max)
2. [ ] Try to bet 2001 USDC (should fail E_MAX_BET_EXCEEDED)
3. [ ] Stack bets to reach 30% ratio
4. [ ] Try to exceed 30% (should fail E_BET_EXCEEDS_SAFE_RATIO)
5. [ ] Multi-outcome: 3000 USDC per outcome
```

### Browser Compatibility

```
Desktop:
[ ] Chrome
[ ] Firefox
[ ] Safari
[ ] Edge

Mobile:
[ ] iOS Safari + Petra wallet
[ ] Android Chrome + Martian wallet
```

---

## Phase 6: Analytics & Monitoring (10 minutes)

### Add Vercel Analytics (Free)

```bash
cd frontend
npm install @vercel/analytics

# Update src/main.tsx
```

```typescript
import { Analytics } from '@vercel/analytics/react';

root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

Redeploy:
```bash
vercel --prod
```

### Monitor Dashboard

**Vercel Dashboard**: https://vercel.com/dashboard

**Key Metrics**:
- Page views
- Unique visitors
- Top pages
- Devices (mobile/desktop)
- Countries

---

## Phase 7: Announcement & Launch (30 minutes)

### Pre-Launch Checklist

```
Technical:
[ ] Smart contracts deployed to devnet
[ ] Frontend deployed and live
[ ] Custom domain connected
[ ] SSL certificate active (https)
[ ] Analytics working
[ ] Wallet connection tested
[ ] All critical paths tested

Content:
[ ] Create OG image (social share)
[ ] Write launch tweet
[ ] Prepare Discord announcement
[ ] Update GitHub README
[ ] Create demo video (optional)
```

### Launch Announcement Template

**Twitter**:
```
🚀 Launching PredictApt - Decentralized Prediction Markets on @Aptos

✨ Features:
• LMSR pricing (mathematically correct)
• 10,000 USDC liquidity per market
• Safety-validated (q/b < 30%)
• Zero-knowledge bet commitment

Try it: https://predictapt.com

Built with Move 💙
```

**Discord (Aptos Community)**:
```
Hey Aptos fam! 👋

Excited to announce PredictApt - a decentralized prediction market dApp built on Aptos.

🎯 What makes it special:
- True LMSR pricing (industry standard from Polymarket/Augur)
- Built-in safety validation to prevent overflow
- Clean React frontend with Petra wallet integration
- Open source: [GitHub link]

📍 Deployed on Devnet: https://predictapt.com
📊 Contract: 0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894

Would love feedback from the community! 🙏
```

### Community Channels

```
Post to:
[ ] Twitter/X
[ ] Aptos Discord (#showcase)
[ ] Reddit (r/aptos, r/CryptoCurrency)
[ ] Telegram (Aptos community)
[ ] Product Hunt (optional)
```

---

## Cost Summary

### Minimum Launch Budget

```
Domain (1 year):              $12
Vercel Hosting:               $0 (free tier)
SSL Certificate:              $0 (included)
CDN:                          $0 (included)
Analytics:                    $0 (Vercel free)
Gas for deployment:           $0.002 APT (~$0.01)
────────────────────────────────────
TOTAL YEAR 1:                $12.01
```

### Recommended Budget (Better Experience)

```
Domain (.com + .io):          $52
Vercel Pro:                   $240/year
Logo design:                  $50 (Fiverr)
OG Image design:              $25 (Fiverr)
────────────────────────────────────
TOTAL YEAR 1:                $367
```

---

## Timeline

### Fastest Path to Live (2-3 hours)

```
Hour 1: Domain & Setup
├─ 0:00 - 0:10 → Check domains, purchase
├─ 0:10 - 0:20 → Build frontend
├─ 0:20 - 0:40 → Deploy to Vercel
└─ 0:40 - 1:00 → Connect domain

Hour 2: Testing & Polish
├─ 1:00 - 1:20 → Critical path testing
├─ 1:20 - 1:40 → Edge case testing
└─ 1:40 - 2:00 → Analytics setup

Hour 3: Launch
├─ 2:00 - 2:20 → Final checks
├─ 2:20 - 2:40 → Announcement posts
└─ 2:40 - 3:00 → Monitor & respond
```

### Recommended Path (1 day)

```
Morning (9am - 12pm):
- Purchase domain
- Build & deploy frontend
- Configure DNS
- Wait for propagation

Afternoon (1pm - 5pm):
- Comprehensive testing
- Fix any bugs
- Create social assets
- Write announcements

Evening (6pm - 8pm):
- Launch announcement
- Monitor metrics
- Respond to community
```

---

## Post-Launch Monitoring (Week 1)

### Daily Checks

```
Day 1-7:
[ ] Check Vercel Analytics (traffic)
[ ] Monitor error rates
[ ] Test wallet connections
[ ] Check smart contract events
[ ] Respond to user feedback
[ ] Fix critical bugs
```

### Key Metrics

```
Success Indicators:
- 100+ unique visitors (Day 1)
- 10+ wallet connections (Day 1)
- 1+ market created (Day 1)
- 5+ bets placed (Week 1)
- 0 critical errors
- < 3 second page load
```

---

## Emergency Contacts & Resources

### If Something Breaks

**Vercel Support**:
- Free tier: Community forum
- Pro tier: support@vercel.com

**Domain Issues**:
- Namecheap: Live chat (24/7)
- Cloudflare: Dashboard support

**Smart Contract Issues**:
- Aptos Discord: #dev-discussion
- Docs: https://aptos.dev

### Rollback Plan

```
If critical bug found:
1. Revert to previous Vercel deployment
   → Deployments tab → ... → Promote to Production

2. Fix bug locally

3. Redeploy when ready
```

---

## Next Sprint: Phase 2 (After Launch)

**Per-Market Liquidity** (2-3 weeks):
- [ ] Architecture design
- [ ] Smart contract updates
- [ ] Frontend UI for tier selection
- [ ] Testing & deployment
- [ ] User documentation

**Features**:
- Market creators choose liquidity tier
- 4 tiers: Micro/Small/Medium/Large
- 100/1k/10k/100k USDC options
- Better capital efficiency

---

## Quick Reference Commands

```bash
# Build frontend
cd frontend && npm run build

# Deploy to Vercel
vercel --prod

# Check DNS
dig predictapt.com

# Test production locally
npm run preview

# View Vercel logs
vercel logs

# Rollback deployment
vercel rollback
```

---

## Launch Day Checklist

```
Pre-Launch (T-1 hour):
[ ] All tests passing
[ ] Domain resolves correctly
[ ] SSL certificate active
[ ] Analytics configured
[ ] Announcement posts drafted
[ ] Screenshot/demo ready

Launch (T+0):
[ ] Final smoke test
[ ] Post announcements (Twitter/Discord)
[ ] Monitor analytics dashboard
[ ] Watch for errors in Vercel
[ ] Respond to community

Post-Launch (T+1 hour):
[ ] Check first user activity
[ ] Verify transactions on-chain
[ ] Monitor wallet connections
[ ] Document any issues
[ ] Thank early users
```

---

**Status**: Ready to Launch 🚀
**Estimated Time**: 2-3 hours
**Total Cost**: $12 (MVP) or $367 (recommended)
**Risk Level**: 🟢 LOW

**Recommended Start**: Purchase domain first (10 min), then deploy while DNS propagates (30 min wait time).

