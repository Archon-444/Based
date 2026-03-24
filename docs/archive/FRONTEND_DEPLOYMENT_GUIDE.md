# Frontend Deployment & Branding Strategy

## Website Name & Domain Strategy

### 🎯 Recommended Names

Based on the prediction market + Aptos theme, here are top name recommendations:

#### Tier 1: Premium Brandable Names
1. **AptosOracle** (.com, .io)
   - Clear, professional
   - "Oracle" = prediction/forecasting
   - Domain check: aptoracle.com, aptoracle.io

2. **ForesightMarket** (.com, .io)
   - Clean, descriptive
   - Not blockchain-specific (good for mainstream)
   - Domain check: foresightmarket.com, foresightmarket.io

3. **PredictApt** (.com, .io)
   - Short, catchy
   - "Apt" double meaning (Aptos + appropriate)
   - Domain check: predictapt.com, predictapt.io

#### Tier 2: Aptos-Branded Names
4. **MoveMarkets** (.com, .io)
   - References Move language
   - "Move markets" = active trading
   - Domain check: movemarkets.com, movemarkets.io

5. **AptosForecaster** (.io, .xyz)
   - Descriptive but longer
   - Domain check: aptosforecaster.io

6. **AptosBets** (.com, .io)
   - Direct, simple
   - May have regulatory concerns with "bets"
   - Domain check: aptosbets.com, aptosbets.io

#### Tier 3: Creative/Modern
7. **Predictr** (.io, .xyz)
   - Modern tech vibe
   - Droppped vowel trend
   - Domain check: predictr.io

8. **OddsOnChain** (.com, .io)
   - Clear blockchain connection
   - Domain check: oddsonchain.com, oddsonchain.io

9. **ChainSight** (.io)
   - Combines blockchain + foresight
   - Domain check: chainsight.io

10. **VeritasMarket** (.com, .io)
    - "Veritas" = truth (Latin)
    - Professional, timeless
    - Domain check: veritasmarket.com, veritasmarket.io

### 💰 Domain Purchasing Strategy

#### Recommended TLDs (in priority order):
1. **.com** - Best for credibility ($10-15/year)
2. **.io** - Tech-focused, crypto-friendly ($30-40/year)
3. **.xyz** - Modern, affordable ($1-15/year)
4. **.market** - Niche-specific ($20-30/year)

#### Budget Tiers:
- **Bootstrap**: .xyz or .io only ($30-40/year)
- **Standard**: .com + .io ($50-60/year)
- **Premium**: .com + .io + .xyz for protection ($80-100/year)

#### Where to Buy:
- **Namecheap** - Best prices, good UI
- **Cloudflare** - At-cost pricing (~$10/year .com)
- **GoDaddy** - Easy but more expensive
- **Porkbun** - Cheap with free WHOIS privacy

---

## Tech Stack Summary

### Frontend Architecture
```
React 18.2 + TypeScript 5.3
├─ Build Tool: Vite 5.0
├─ Styling: Tailwind CSS 3.4
├─ State: Redux Toolkit 2.0
├─ Routing: React Router 6.21
├─ Blockchain: @aptos-labs/ts-sdk 1.32
├─ Wallet: @aptos-labs/wallet-adapter-react 3.7
├─ Animations: Framer Motion 10.16
├─ Charts: Recharts 3.2
└─ Notifications: React Hot Toast 2.4
```

### Build Output
- **Format**: Static HTML/CSS/JS
- **Size**: ~500KB-2MB (estimated)
- **CDN-friendly**: ✅ Yes
- **SSR**: ❌ No (SPA)

---

## Hosting Options Comparison

### Option 1: Vercel (⭐ RECOMMENDED)

**Pros**:
- ✅ Zero config deployment from Git
- ✅ Automatic HTTPS + CDN
- ✅ Preview deployments for PRs
- ✅ Edge network (fast globally)
- ✅ Free tier: Unlimited bandwidth
- ✅ Perfect for React/Vite
- ✅ Built-in analytics

**Cons**:
- ❌ Vendor lock-in (but easy to move)

**Cost**:
- **Hobby (Free)**: Personal projects, unlimited bandwidth
- **Pro ($20/mo)**: Custom domains, team features
- **Start**: FREE TIER

**Setup Time**: 5 minutes

---

### Option 2: Netlify

**Pros**:
- ✅ Similar to Vercel (Git-based)
- ✅ Automatic HTTPS + CDN
- ✅ Form handling built-in
- ✅ Split testing / A/B tests
- ✅ 100GB bandwidth/month free

**Cons**:
- ❌ Slightly slower build times than Vercel
- ❌ Bandwidth limits on free tier

**Cost**:
- **Starter (Free)**: 100GB/month
- **Pro ($19/mo)**: 1TB bandwidth
- **Start**: FREE TIER

**Setup Time**: 5 minutes

---

### Option 3: Cloudflare Pages

**Pros**:
- ✅ Best CDN in the world
- ✅ Unlimited bandwidth (FREE)
- ✅ Unlimited sites
- ✅ Built-in Web3 IPFS gateway
- ✅ DDoS protection included

**Cons**:
- ❌ Less polished UI than Vercel
- ❌ Build time limits (10 min free)

**Cost**:
- **Free**: Unlimited everything
- **Pro ($20/mo)**: Priority support, build minutes
- **Start**: FREE TIER

**Setup Time**: 10 minutes

---

### Option 4: AWS Amplify

**Pros**:
- ✅ AWS ecosystem integration
- ✅ Full control & scalability
- ✅ Custom build configs

**Cons**:
- ❌ More complex setup
- ❌ Higher cost
- ❌ Steeper learning curve

**Cost**:
- **Build**: $0.01 per build minute
- **Hosting**: $0.15/GB served
- **Estimate**: $5-20/month
- **Start**: Requires AWS account

**Setup Time**: 30+ minutes

---

### Option 5: IPFS + ENS (Web3 Native)

**Pros**:
- ✅ Fully decentralized
- ✅ Censorship-resistant
- ✅ Perfect for crypto ethos
- ✅ ENS domain (predictapt.eth)

**Cons**:
- ❌ Slower than traditional CDN
- ❌ More complex setup
- ❌ IPFS gateway required for HTTP
- ❌ Higher technical barrier

**Cost**:
- **Pinata (IPFS)**: $0-20/month
- **ENS Domain**: $5/year + gas
- **Estimate**: $50 first year
- **Start**: Requires ETH wallet

**Setup Time**: 2-4 hours

---

## Recommended Hosting Strategy

### 🏆 Phase 1: Vercel (Launch MVP)
- **Why**: Fastest time to market, zero config
- **Cost**: FREE
- **Domain**: Connect custom domain
- **Timeline**: Deploy in 1 hour

### 🔄 Phase 2: Cloudflare Pages (Scale)
- **When**: After 1000+ daily users
- **Why**: Better CDN, unlimited bandwidth
- **Cost**: Still FREE
- **Migration**: Easy (just change DNS)

### 🌐 Phase 3: Multi-CDN (Enterprise)
- **When**: 10k+ daily users
- **Why**: Redundancy, regional optimization
- **Setup**: Vercel (US) + Cloudflare (Global)
- **Cost**: $20-40/month

---

## Deployment Steps

### Step 1: Prepare Frontend for Production

#### Update Contract Address
```typescript
// frontend/src/config/constants.ts
export const NETWORK = "devnet"; // or "mainnet"
export const MODULE_ADDRESS = "0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894";
```

#### Build Production Bundle
```bash
cd frontend
npm install
npm run build

# Output: dist/ folder with static files
```

#### Test Production Build Locally
```bash
npm run preview
# Visit: http://localhost:4173
```

---

### Step 2: Deploy to Vercel (RECOMMENDED)

#### Option A: Vercel CLI (Fastest)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from frontend directory
cd /Users/philippeschmitt/Documents/aptos-prediction-market/frontend
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - What's your project name? prediction-market
# - In which directory is your code? ./
# - Override settings? N

# Vercel automatically detects Vite and deploys!
# You get: https://prediction-market-xxx.vercel.app
```

#### Option B: Vercel Dashboard (More Control)
1. Visit https://vercel.com/new
2. Import Git Repository
3. Select `aptos-prediction-market`
4. **Framework Preset**: Vite
5. **Root Directory**: `frontend`
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. Click "Deploy"

---

### Step 3: Connect Custom Domain

#### On Vercel:
1. Go to Project Settings → Domains
2. Add domain: `predictapt.com`
3. Vercel gives you DNS records

#### On Domain Registrar (Namecheap/Cloudflare):
1. Add **A Record**: `76.76.21.21` (Vercel IP)
2. Add **CNAME**: `cname.vercel-dns.com`
3. Wait 5-60 minutes for DNS propagation

#### Verify:
```bash
# Check DNS
dig predictapt.com

# Test HTTPS
curl -I https://predictapt.com
```

---

### Step 4: Configure Environment Variables

#### On Vercel Dashboard:
Settings → Environment Variables → Add:

```env
VITE_NETWORK=devnet
VITE_MODULE_ADDRESS=0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894
VITE_RPC_URL=https://fullnode.devnet.aptoslabs.com
```

#### Update vite.config.ts if needed:
```typescript
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_MODULE_ADDRESS': JSON.stringify(process.env.VITE_MODULE_ADDRESS)
  }
})
```

---

## SEO & Metadata Setup

### Update index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary Meta Tags -->
    <title>PredictApt - Decentralized Prediction Markets on Aptos</title>
    <meta name="title" content="PredictApt - Decentralized Prediction Markets on Aptos">
    <meta name="description" content="Trade on the future with PredictApt. Decentralized prediction markets powered by LMSR on Aptos blockchain.">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://predictapt.com/">
    <meta property="og:title" content="PredictApt - Prediction Markets">
    <meta property="og:description" content="Decentralized prediction markets on Aptos">
    <meta property="og:image" content="https://predictapt.com/og-image.png">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://predictapt.com/">
    <meta property="twitter:title" content="PredictApt">
    <meta property="twitter:description" content="Decentralized prediction markets on Aptos">
    <meta property="twitter:image" content="https://predictapt.com/og-image.png">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Domain Name Decision Matrix

| Name | .com Price | Availability | Brandability | SEO Value | Overall Score |
|------|-----------|--------------|--------------|-----------|---------------|
| AptosOracle | $12/yr | ✅ Likely | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 9/10 |
| ForesightMarket | $12/yr | ✅ Check | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 10/10 |
| PredictApt | $12/yr | ✅ Likely | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 9/10 |
| MoveMarkets | $12/yr | ⚠️ May be taken | ⭐⭐⭐⭐ | ⭐⭐⭐ | 7/10 |
| ChainSight | $12/yr | ✅ Likely | ⭐⭐⭐⭐ | ⭐⭐⭐ | 7/10 |

### 🏆 **RECOMMENDATION: PredictApt.com**

**Why**:
- Short (10 characters)
- Easy to spell and remember
- Clear purpose (prediction)
- "Apt" = clever wordplay (Aptos + appropriate)
- .com availability likely
- Good for SEO ("predict" keyword)

---

## Quick Start Deployment (30 Minutes)

### Checklist:

```bash
# 1. Check domain availability (5 min)
- [ ] Visit namecheap.com/domains
- [ ] Search: predictapt.com
- [ ] Purchase domain ($12)

# 2. Build frontend (2 min)
cd /Users/philippeschmitt/Documents/aptos-prediction-market/frontend
npm run build

# 3. Deploy to Vercel (5 min)
npm install -g vercel
vercel login
vercel --prod

# 4. Configure domain (10 min)
- [ ] Add domain in Vercel dashboard
- [ ] Update DNS in Namecheap
- [ ] Wait for DNS propagation

# 5. Test deployment (5 min)
- [ ] Visit https://predictapt.com
- [ ] Connect wallet
- [ ] Create test market
- [ ] Place test bet

# 6. Announce (3 min)
- [ ] Tweet launch
- [ ] Post on Aptos Discord
- [ ] Share with community
```

---

## Post-Deployment Monitoring

### Analytics Setup

#### Add Vercel Analytics (Free):
```typescript
// Add to src/main.tsx
import { Analytics } from '@vercel/analytics/react';

root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

#### Or Google Analytics:
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Key Metrics to Track:
- Unique visitors
- Wallet connections
- Markets created
- Bets placed
- Average session duration
- Bounce rate

---

## Cost Summary

### Minimum Viable Launch (Year 1):
```
Domain (.com):              $12
Vercel Hosting (Free):      $0
Cloudflare DNS (Free):      $0
SSL Certificate (Auto):     $0
CDN (Included):             $0
─────────────────────────────
TOTAL YEAR 1:              $12/year ($1/month)
```

### Growth Phase (Year 1, 1000+ users):
```
Domain (.com + .io):        $52
Vercel Pro (optional):      $240
Cloudflare Pro (optional):  $240
Analytics (Vercel free):    $0
Monitoring:                 $0
─────────────────────────────
TOTAL YEAR 1 (Pro):        $52-$532/year
```

### Enterprise (10k+ daily users):
```
Multi-domain protection:    $100
Multi-CDN (Vercel+CF):      $480
Advanced analytics:         $300
Monitoring (Datadog):       $360
Security (Cloudflare):      $240
─────────────────────────────
TOTAL YEAR 1 (Enterprise):  $1,480/year ($123/month)
```

---

## Next Steps - Action Plan

### Immediate (Today):
1. **Choose name**: Decide between top 3 options
2. **Check availability**: namecheap.com/domains
3. **Purchase domain**: $12 for .com
4. **Deploy to Vercel**: `vercel` command (5 min)

### This Week:
1. **Connect domain**: Update DNS records
2. **Test production**: Full user flow testing
3. **Setup analytics**: Vercel Analytics
4. **Create OG image**: 1200x630px social share image

### Next Sprint:
1. **SEO optimization**: Meta tags, sitemap
2. **Performance audit**: Lighthouse score
3. **Mobile testing**: iOS/Android wallet connection
4. **Documentation**: User guide, FAQ

---

## Domain Purchase Instructions

### Using Namecheap (Recommended):

1. Visit: https://www.namecheap.com
2. Search: "predictapt"
3. Add .com to cart ($12.98/year)
4. Checkout
5. **IMPORTANT**: Enable WhoisGuard (free first year)
6. After purchase:
   - Dashboard → Domain List → Manage
   - Advanced DNS tab
   - Add records (provided by Vercel)

### Using Cloudflare (At-Cost):

1. Visit: https://dash.cloudflare.com
2. Registrar → Register Domain
3. Search: "predictapt.com"
4. Purchase (~$10/year, no markup)
5. DNS automatically configured
6. Add records for Vercel

---

**Status**: Ready to deploy
**Estimated Time to Live**: 1-2 hours
**Monthly Cost**: $1 (domain only)
**Recommended Name**: **PredictApt.com** ⭐

