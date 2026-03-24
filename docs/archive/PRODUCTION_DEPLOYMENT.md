# 🚀 Production Deployment Guide - Prophecy.market

## Executive Summary

**Domain**: prophecy.market (or prophecy.pm as alternative)
**Hosting**: Vercel + Cloudflare CDN
**Architecture**: Static React app with CI/CD from GitHub
**Timeline**: 2-3 hours to live
**Cost**: $27-40/year minimum

---

## Domain Strategy

### Primary Domain: **prophecy.market** ⭐

**Why this name**:
- ✅ **Memorable**: Single word, easy to spell
- ✅ **On-brand**: Prophecy = predicting the future
- ✅ **Professional**: .market TLD designed for trading platforms
- ✅ **SEO-friendly**: Unique keyword, high searchability
- ✅ **Regulatory-safe**: No gambling connotations ("bet", "wager")

**Pricing**: $27-64/year depending on registrar

### Alternative Options:

| Domain | TLD | Price/year | Availability | Score |
|--------|-----|------------|--------------|-------|
| **prophecy.market** | .market | $27-40 | ⭐ Check | 10/10 |
| **prophecy.pm** | .pm | $30-50 | ⭐ Check | 9/10 |
| predictapt.com | .com | $12 | ⭐ Likely | 8/10 |
| foresightmarket.com | .com | $12 | ⭐ Likely | 9/10 |

### Subdomain Architecture

```
prophecy.market              → Main landing page
├─ app.prophecy.market       → dApp interface (React app)
├─ docs.prophecy.market      → Documentation
├─ api.prophecy.market       → Future API (optional)
└─ testnet.prophecy.market   → Testnet version
```

---

## Phase 1: Domain Registration (15 minutes)

### Step 1: Check Availability

**Recommended Registrars** (in order):

1. **Cloudflare** (at-cost, no markup) ⭐
   - Visit: https://dash.cloudflare.com/sign-up
   - Registrar → Register Domain
   - Search: "prophecy.market"
   - Price: ~$27/year (.market)

2. **Namecheap** (good UI, fair pricing)
   - Visit: https://www.namecheap.com
   - Search: "prophecy.market"
   - Price: ~$32/year + free WHOIS privacy

3. **Porkbun** (cheap, reliable)
   - Visit: https://porkbun.com
   - Search: "prophecy.market"
   - Price: ~$28/year + free WHOIS

### Step 2: Purchase Domain

**Recommended**: Cloudflare (integrated CDN + DNS)

```bash
# Via Cloudflare:
1. Create Cloudflare account
2. Go to Registrar section
3. Search "prophecy.market"
4. Add to cart
5. Complete purchase (~$27/year)
6. Enable auto-renewal

# Included FREE with domain:
✅ WHOIS privacy
✅ DNS management
✅ SSL certificate
✅ CDN (unlimited bandwidth)
✅ DDoS protection
```

**Cost**: $27/year for .market TLD

---

## Phase 2: GitHub Repository Setup [✅ COMPLETED]

### Prepare Repository for CI/CD

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market

# Ensure Git is initialized
git init

# Add all files
git add .

# Commit
git commit -m "Production ready - LMSR integration + safety validation"

# Create GitHub repo (if not exists)
# Visit: https://github.com/new
# Name: aptos-prediction-market
# Public or Private

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/aptos-prediction-market.git

# Push
git push -u origin main
```

### Create Production Branch (optional but recommended)

```bash
# Create production branch
git checkout -b production

# Push production branch
git push -u origin production

# Strategy:
# - main = development
# - production = live site
```

---

## Phase 3: Vercel Deployment with CI/CD [✅ COMPLETED]

### Step 1: Connect GitHub to Vercel

1. Visit: **https://vercel.com/signup**
2. Click "Continue with GitHub"
3. Authorize Vercel to access repositories
4. Select: `aptos-prediction-market`

### Step 2: Configure Project

**Framework Preset**: Vite (auto-detected)

**Build & Output Settings**:
```
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Environment Variables**:
```env
VITE_NETWORK=devnet
VITE_MODULE_ADDRESS=0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894
VITE_RPC_URL=https://fullnode.devnet.aptoslabs.com/v1
VITE_FAUCET_URL=https://faucet.devnet.aptoslabs.com
```

### Step 3: Deploy

Click **"Deploy"**

Vercel will:
- Clone your repository
- Install dependencies
- Build the project
- Deploy to edge network
- Generate preview URL

**Result**: `https://aptos-prediction-market-abc123.vercel.app`

**Time**: 2-5 minutes

### Step 4: Enable CI/CD

**Automatic** - Vercel now watches your GitHub repo:

```
Workflow:
1. Push to GitHub → Vercel builds → Deploys automatically
2. Pull Requests → Generate preview URLs
3. Merge to main → Deploy to production
```

**Configuration** (vercel.json):
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "devCommand": "cd frontend && npm run dev",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

Save this in project root.

---

## Phase 4: Cloudflare DNS Configuration (30 minutes)

### Step 1: Add Site to Cloudflare

1. Cloudflare Dashboard → Add Site
2. Enter: `prophecy.market`
3. Select Plan: **Free** (plenty for MVP)
4. Cloudflare scans existing DNS records

### Step 2: Update Nameservers (if purchased elsewhere)

If you bought domain from Namecheap/GoDaddy:

1. Copy Cloudflare nameservers:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

2. In your registrar (Namecheap):
   - Domain List → Manage
   - Nameservers → Custom DNS
   - Enter Cloudflare nameservers
   - Save

3. Wait 5-60 minutes for propagation

### Step 3: Configure DNS Records

**In Cloudflare DNS tab**:

#### Root Domain → Vercel
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy status: Proxied (orange cloud)
TTL: Auto
```

#### WWW Subdomain → Root
```
Type: CNAME
Name: www
Target: prophecy.market
Proxy status: Proxied (orange cloud)
TTL: Auto
```

#### App Subdomain (dApp)
```
Type: CNAME
Name: app
Target: cname.vercel-dns.com
Proxy status: Proxied (orange cloud)
TTL: Auto
```

#### Docs Subdomain (future)
```
Type: CNAME
Name: docs
Target: cname.vercel-dns.com
Proxy status: Proxied (orange cloud)
TTL: Auto
```

### Step 4: SSL/TLS Settings

**Cloudflare → SSL/TLS tab**:

1. **SSL/TLS encryption mode**: Full (strict)
2. **Edge Certificates**:
   - Enable "Always Use HTTPS"
   - Enable "Automatic HTTPS Rewrites"
   - Enable "HSTS" (max-age: 31536000)
3. **Minimum TLS Version**: TLS 1.2

### Step 5: Performance Settings

**Cloudflare → Speed tab**:

**Auto Minify**:
- ✅ JavaScript
- ✅ CSS
- ✅ HTML

**Brotli Compression**: ✅ Enable

**Rocket Loader**: ⚠️ Test (can break React apps, disable if issues)

**Cache Rules**:
```
Rule 1: Static Assets
- If: File extension matches (js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2)
- Then: Cache TTL = 7 days
- Browser Cache TTL = 7 days

Rule 2: HTML
- If: File extension matches html
- Then: Cache TTL = 1 hour
- Browser Cache TTL = 1 hour
```

---

## Phase 5: Vercel Domain Connection (15 minutes)

### Step 1: Add Custom Domain in Vercel

1. Vercel Dashboard → Your Project
2. Settings → Domains
3. Add Domain: `prophecy.market`
4. Add Domain: `www.prophecy.market`
5. Add Domain: `app.prophecy.market`

Vercel will verify DNS automatically.

### Step 2: Set Primary Domain

1. Click "..." next to `prophecy.market`
2. Select "Set as Primary"
3. Enable "Redirect www → root" (or vice versa)

### Step 3: Verify SSL

Wait 1-5 minutes, then:

```bash
# Check SSL certificate
curl -I https://prophecy.market

# Should show:
# HTTP/2 200
# server: Vercel
# x-vercel-id: ...
```

Visit: **https://prophecy.market**

Should load with valid HTTPS certificate! 🎉

---

## Phase 6: Subdomain Configuration (20 minutes)

### App Subdomain (Main dApp)

**Vercel Project 1** (existing):
- **Domain**: app.prophecy.market
- **Root**: `frontend/`
- **Purpose**: React dApp interface

### Docs Subdomain (Documentation)

**Option A**: Vercel Project 2
```bash
# Create new Vercel project for docs
cd /Users/philippeschmitt/Documents/aptos-prediction-market

# Create docs directory structure
mkdir -p docs-site
cd docs-site

# Initialize simple static site
npm create vite@latest . -- --template vanilla

# Add markdown files
cp ../TESTNET_DEPLOYMENT.md ./public/
cp ../BET_LIMITS_AND_SAFETY.md ./public/
cp ../LMSR_INTEGRATION_COMPLETE.md ./public/

# Deploy
vercel --prod

# Add domain: docs.prophecy.market
```

**Option B**: Cloudflare Pages (simpler)
```bash
# Cloudflare Pages → Create Project
# Connect Git: aptos-prediction-market
# Root: docs/
# Build: None (static files)
# Custom domain: docs.prophecy.market
```

---

## Phase 7: Performance Optimization (30 minutes)

### Frontend Build Optimizations

#### Update vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'aptos-vendor': ['@aptos-labs/ts-sdk', '@aptos-labs/wallet-adapter-react'],
          'ui-vendor': ['framer-motion', 'react-hot-toast', 'recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### Image Optimization

```bash
# Install image optimizer
npm install --save-dev vite-plugin-image-optimizer

# Add to vite.config.ts
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

plugins: [
  react(),
  ViteImageOptimizer({
    png: { quality: 80 },
    jpeg: { quality: 80 },
    webp: { quality: 80 }
  })
]
```

### Lazy Loading Routes

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react'

const Markets = lazy(() => import('./pages/Markets'))
const CreateMarket = lazy(() => import('./pages/CreateMarket'))
const MarketDetail = lazy(() => import('./pages/MarketDetail'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/create" element={<CreateMarket />} />
        <Route path="/market/:id" element={<MarketDetail />} />
      </Routes>
    </Suspense>
  )
}
```

### Performance Targets

```
Lighthouse Score Goals:
├─ Performance: 90+
├─ Accessibility: 95+
├─ Best Practices: 95+
├─ SEO: 100
└─ PWA: Optional

Load Times:
├─ First Contentful Paint: < 1.5s
├─ Time to Interactive: < 3.5s
├─ Total Bundle Size: < 500KB gzipped
└─ Lighthouse Mobile: 85+
```

---

## Phase 8: Monitoring & Analytics (15 minutes)

### Vercel Analytics (Recommended)

```bash
cd frontend
npm install @vercel/analytics @vercel/speed-insights
```

```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

root.render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
)
```

**Free tier includes**:
- Page views
- Unique visitors
- Top pages
- Referrer tracking
- Real User Metrics (Core Web Vitals)

### Cloudflare Analytics (Included)

**Cloudflare Dashboard → Analytics**:
- Traffic overview
- Geographic distribution
- Threats blocked
- Cache performance
- Bandwidth saved

### Optional: Google Analytics 4

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Phase 9: Security Hardening (20 minutes)

### Security Headers (Vercel)

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.aptoslabs.com https://fullnode.devnet.aptoslabs.com wss://*.aptoslabs.com; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

### Cloudflare Firewall Rules (Free)

**Cloudflare → Security → WAF**:

**Rule 1**: Block known bots
```
Expression: (cf.client.bot)
Action: Block
```

**Rule 2**: Rate limit API calls
```
Expression: (http.request.uri.path contains "/api/")
Action: Challenge (if > 100 requests/minute)
```

**Rule 3**: Geo-restrict (optional)
```
Expression: (ip.geoip.country ne "US" and ip.geoip.country ne "CA")
Action: Challenge (or Allow, depending on target market)
```

---

## Phase 10: Production Testing (30 minutes)

### Pre-Launch Checklist

```
DNS & SSL:
[ ] prophecy.market resolves
[ ] www.prophecy.market redirects to root
[ ] app.prophecy.market loads dApp
[ ] HTTPS certificate valid (A+ on SSL Labs)
[ ] HSTS header present

Performance:
[ ] Lighthouse score > 90 (mobile)
[ ] First paint < 1.5s
[ ] Time to interactive < 3.5s
[ ] Bundle size < 500KB gzipped
[ ] Images optimized (WebP)

Functionality:
[ ] Wallet connection works (Petra/Martian)
[ ] Create market transaction succeeds
[ ] Place bet transaction succeeds
[ ] Odds display correctly (LMSR)
[ ] Claim winnings works
[ ] Max bet enforced (2000 USDC)
[ ] Ratio validation works (q/b < 0.3)

Security:
[ ] CSP headers present
[ ] HSTS enabled
[ ] XSS protection enabled
[ ] Frame options deny
[ ] No console.log in production
[ ] API keys not exposed

Analytics:
[ ] Vercel Analytics tracking
[ ] Cloudflare Analytics tracking
[ ] Error tracking configured
```

### Load Testing

```bash
# Install k6
brew install k6

# Create load test script
cat > loadtest.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  let response = http.get('https://prophecy.market');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF

# Run test
k6 run loadtest.js
```

---

## Deployment Timeline

### Fast Track (2-3 hours)

```
Hour 1: Domain & Infrastructure
├─ 0:00-0:15 → Purchase prophecy.market ($27)
├─ 0:15-0:30 → Connect GitHub to Vercel
├─ 0:30-0:45 → Deploy to Vercel
└─ 0:45-1:00 → Configure Cloudflare DNS

Hour 2: Configuration & Testing
├─ 1:00-1:20 → SSL verification
├─ 1:20-1:40 → Performance optimization
├─ 1:40-1:55 → Security headers
└─ 1:55-2:00 → Analytics setup

Hour 3: Testing & Launch
├─ 2:00-2:20 → Critical path testing
├─ 2:20-2:40 → Load testing
├─ 2:40-2:55 → Final smoke tests
└─ 2:55-3:00 → Go live! 🚀
```

---

## Cost Breakdown

### Year 1 Costs

#### Minimum (MVP)
```
prophecy.market domain:      $27/year
Vercel (Free tier):          $0
Cloudflare (Free tier):      $0
SSL Certificate:             $0 (included)
────────────────────────────────────
TOTAL YEAR 1:               $27/year
```

#### Recommended (Production)
```
prophecy.market domain:      $27/year
prophecy.pm backup:          $30/year
Vercel Pro:                  $240/year
Cloudflare Pro:              $240/year
────────────────────────────────────
TOTAL YEAR 1:               $537/year ($45/month)
```

### Scaling Costs (10k+ daily users)

```
Domain protection bundle:    $100/year
Vercel Enterprise:           $480/year
Cloudflare Business:         $2,400/year
Monitoring (Datadog):        $360/year
────────────────────────────────────
TOTAL (High Scale):         $3,340/year ($278/month)
```

---

## Post-Launch Checklist

### Week 1

```
Daily:
[ ] Monitor Vercel Analytics (traffic, errors)
[ ] Check Cloudflare analytics (threats blocked)
[ ] Review error logs
[ ] Test wallet connections
[ ] Verify transactions on-chain
[ ] Respond to user feedback

Weekly:
[ ] Lighthouse audit
[ ] Security scan
[ ] Performance review
[ ] Backup configuration
```

### Month 1

```
[ ] Review analytics trends
[ ] Optimize bundle size
[ ] A/B test UI improvements
[ ] Security audit
[ ] User feedback survey
[ ] Plan Phase 2 features
```

---

## Emergency Procedures

### If Site Goes Down

1. **Check Vercel Status**: https://www.vercel-status.com
2. **Check Cloudflare Status**: https://www.cloudflarestatus.com
3. **Check DNS**: `dig prophecy.market`
4. **Rollback**: Vercel → Deployments → Previous version → Promote

### If Performance Degrades

1. **Clear Cloudflare Cache**: Dashboard → Caching → Purge Everything
2. **Check bundle size**: `npm run build --report`
3. **Review Lighthouse**: Check for regressions
4. **Monitor RUM**: Vercel Speed Insights

### If SSL Certificate Fails

1. **Cloudflare**: SSL/TLS → Edge Certificates → Delete & Recreate
2. **Vercel**: Remove domain → Re-add
3. **DNS**: Verify CNAME points to cname.vercel-dns.com

---

## Success Metrics

### Launch Goals (Week 1)

```
Traffic:
├─ 500+ unique visitors
├─ 100+ wallet connections
└─ 10+ markets created

Performance:
├─ 99.9% uptime
├─ < 2s average load time
└─ Lighthouse score > 90

Engagement:
├─ 50+ bets placed
├─ 3+ minute average session
└─ < 60% bounce rate
```

---

## Next Steps: Action Plan

### Step 1: Domain Purchase (NOW - 15 min)
```bash
1. Visit: https://dash.cloudflare.com
2. Registrar → Register Domain
3. Search: "prophecy.market"
4. Purchase: ~$27/year
5. Enable: Auto-renewal
```

### Step 2: Deploy Frontend (30 min)
```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market
git push origin main

# Then in browser:
1. https://vercel.com/new
2. Import GitHub repo
3. Configure build settings
4. Deploy!
```

### Step 3: Configure DNS (30 min)
```bash
# Cloudflare DNS:
1. Add CNAME: @ → cname.vercel-dns.com
2. Add CNAME: www → prophecy.market
3. Add CNAME: app → cname.vercel-dns.com
4. Wait 5-15 minutes
```

### Step 4: Verify & Test (30 min)
```bash
# Check:
curl -I https://prophecy.market
# Should return 200 OK

# Test:
- Connect wallet
- Create market
- Place bet
- Verify on-chain
```

### Step 5: Announce Launch (15 min)
```
Post to:
- Twitter/X
- Aptos Discord
- Reddit r/aptos
- LinkedIn (professional)
```

---

**Status**: Ready to Deploy 🚀
**Domain**: prophecy.market
**Timeline**: 2-3 hours to live
**Cost**: $27/year (MVP) or $537/year (Pro)

Would you like me to help you execute any of these steps?

