# 🏗️ Decoupled Architecture: Landing + dApp

## Strategic Architecture Decision

**Approach**: Two-tier deployment separating marketing from functionality

**Why This Matters**:
- 🚀 **Performance**: Lightning-fast landing page (CDN-cached, no Web3 bloat)
- 🔒 **Security**: Reduced attack surface, clear trust boundaries
- 📊 **Marketing**: A/B testing, SEO, conversion optimization independent of dApp
- 🎯 **User Experience**: No accidental wallet prompts, clear entry points
- 🔧 **DevOps**: Independent deployment pipelines reduce risk

---

## Architecture Overview

```
User Journey:
1. Visits predictapt.com (or chosen domain)
   └─> Marketing Landing Page (Static, Fast, SEO-optimized)
       ├─> Learn about platform
       ├─> See features/benefits
       ├─> Read documentation
       └─> Click "Launch App" button
           │
           └─> Redirects to app.predictapt.com
               └─> dApp Interface (React, Web3, Wallet)
                   ├─> Connect wallet
                   ├─> View markets
                   ├─> Place bets
                   └─> Claim winnings
```

### Domain Structure

```
Primary Domain: predictapt.com
├─ @ (root) → Marketing Landing Page
│  ├─ Tech: Next.js static export / Hugo
│  ├─ Host: Cloudflare Pages
│  ├─ Size: ~100KB
│  └─ Speed: < 0.5s First Paint
│
├─ app.predictapt.com → dApp Interface
│  ├─ Tech: React + Vite + TypeScript
│  ├─ Host: Vercel
│  ├─ Size: ~500KB
│  └─ Speed: < 2s Interactive
│
├─ docs.predictapt.com → Documentation
│  ├─ Tech: Docusaurus / VitePress
│  ├─ Host: Cloudflare Pages
│  └─ Content: User guides, API docs
│
└─ blog.predictapt.com → Blog/Updates (Optional)
   ├─ Tech: Ghost / WordPress
   ├─ Host: Managed hosting
   └─ Content: News, tutorials, updates
```

---

## Site 1: Marketing Landing Page

### Purpose
- First impression and trust building
- SEO for organic discovery
- Conversion funnel (visitor → app user)
- Educational content
- No wallet interaction

### Tech Stack

**Framework**: Next.js 14 (Static Export) or Hugo
```
Why Next.js:
✅ Static export = no server needed
✅ Image optimization built-in
✅ React components for reusability
✅ Excellent SEO capabilities
✅ Easy for developers to maintain

Why Hugo (Alternative):
✅ Blazing fast builds (< 1s)
✅ Single binary, no npm bloat
✅ Perfect for content-focused sites
✅ Lowest hosting cost
✅ Easy for non-technical content updates
```

**Hosting**: Cloudflare Pages
```
✅ Unlimited bandwidth (free)
✅ 1000+ global edge locations
✅ Auto-SSL + HTTP/3
✅ Direct Git integration
✅ Preview deployments
✅ Zero config needed
```

**Content Structure**:
```
/                    → Hero + Features + CTA
/features            → Detailed feature list
/how-it-works        → Step-by-step guide
/markets             → Live market previews (read-only)
/about               → Team, mission, vision
/roadmap             → Product roadmap
/faq                 → Common questions
/blog                → Latest updates
/docs                → Link to docs.predictapt.com
/app                 → Redirect to app.predictapt.com
```

### Key Features

**1. Hero Section**
```html
<section class="hero">
  <h1>Predict the Future on Aptos</h1>
  <p>Trade on real-world events with LMSR-powered prediction markets</p>

  <div class="cta-buttons">
    <a href="https://app.predictapt.com" class="btn-primary">
      Launch App →
    </a>
    <a href="/how-it-works" class="btn-secondary">
      Learn More
    </a>
  </div>

  <div class="trust-badges">
    <span>✓ Audited Smart Contracts</span>
    <span>✓ Non-Custodial</span>
    <span>✓ Open Source</span>
  </div>
</section>
```

**2. Features Grid**
```
Card 1: LMSR Pricing
- Mathematical fairness
- No manipulation
- Bounded loss

Card 2: Lightning Fast
- Built on Aptos
- Sub-second finality
- Low gas fees

Card 3: Secure
- Non-custodial
- Audited contracts
- Battle-tested

Card 4: Transparent
- On-chain settlement
- Open source code
- Public verification
```

**3. Live Market Previews** (Read-Only)
```typescript
// Fetch from API (no wallet needed)
async function fetchTopMarkets() {
  const markets = await fetch('https://api.predictapt.com/markets?limit=5');
  return markets.json();
}

// Display:
- Market question
- Current odds (from LMSR)
- Volume
- Time remaining
- "Trade on App" button → app.predictapt.com
```

**4. Call-to-Action Strategy**
```
Primary CTA: "Launch App" (above fold)
Secondary CTA: "Learn More" (education)
Tertiary CTA: "View Markets" (engagement)

All CTAs lead to either:
- app.predictapt.com (ready to trade)
- Educational content (build trust)
```

### Performance Targets

```
Lighthouse Score:
├─ Performance: 100/100
├─ Accessibility: 100/100
├─ Best Practices: 100/100
└─ SEO: 100/100

Load Times:
├─ First Contentful Paint: < 0.5s
├─ Time to Interactive: < 1.0s
├─ Total Bundle Size: < 100KB gzipped
└─ Images: WebP/AVIF optimized
```

### SEO Optimization

**Meta Tags**:
```html
<title>PredictApt - Decentralized Prediction Markets on Aptos</title>
<meta name="description" content="Trade on future events with mathematically fair LMSR pricing. Secure, transparent, non-custodial prediction markets on Aptos blockchain.">
<meta name="keywords" content="prediction markets, aptos, blockchain, LMSR, decentralized, forecasting">

<!-- Open Graph -->
<meta property="og:title" content="PredictApt - Prediction Markets on Aptos">
<meta property="og:description" content="Trade on future events with LMSR pricing">
<meta property="og:image" content="https://predictapt.com/og-image.png">
<meta property="og:url" content="https://predictapt.com">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="PredictApt">
<meta name="twitter:description" content="Prediction Markets on Aptos">
<meta name="twitter:image" content="https://predictapt.com/og-image.png">
```

**Structured Data** (Schema.org):
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "PredictApt",
  "description": "Decentralized prediction markets on Aptos",
  "url": "https://predictapt.com",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

---

## Site 2: dApp Interface

### Purpose
- Wallet-connected functionality
- Trading interface
- Account management
- Transaction handling

### Tech Stack

**Framework**: React 18 + Vite 5 + TypeScript (Already Built!)
```
Current Stack:
✅ React 18.2
✅ TypeScript 5.3
✅ Vite 5.0 (fast builds)
✅ Tailwind CSS 3.4
✅ @aptos-labs/ts-sdk 1.32
✅ @aptos-labs/wallet-adapter-react 3.7
✅ Redux Toolkit 2.0
✅ React Router 6.21
```

**Hosting**: Vercel
```
✅ Zero-config deployment
✅ Automatic HTTPS
✅ Edge functions support
✅ Preview deployments
✅ GitHub integration
✅ Environment variables
```

**Entry Point**: Clear "Launch" Flow
```
User visits app.predictapt.com
    ↓
Landing screen with:
    ├─ "Connect Wallet" button (prominent)
    ├─ Supported wallets: Petra, Martian
    ├─ "New to Aptos?" → wallet setup guide
    └─ "Browse Markets" → read-only preview

After wallet connection:
    ├─ Full trading interface
    ├─ Account dashboard
    ├─ Portfolio management
    └─ Transaction history
```

### Security Features

**1. Content Security Policy (CSP)**
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self'
    https://*.aptoslabs.com
    https://fullnode.devnet.aptoslabs.com
    wss://*.aptoslabs.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

**2. Wallet Connection Security**
```typescript
// Only connect on explicit user action
const handleConnectWallet = async () => {
  // 1. User clicked "Connect Wallet"
  // 2. Show wallet selection modal
  // 3. Request permission
  // 4. Verify connection
  // 5. Store session (secure)
}

// Never auto-connect without user consent
// Never prompt wallet on page load
// Clear session on disconnect
```

**3. Transaction Signing Flow**
```typescript
// Always show transaction preview before signing
const placeBet = async (marketId: number, outcome: number, amount: number) => {
  // 1. Validate inputs locally
  if (amount > MAX_BET) throw new Error("Exceeds max bet");

  // 2. Show transaction preview modal
  const confirmed = await showTransactionPreview({
    action: "Place Bet",
    market: marketId,
    outcome: outcome,
    amount: `${amount / 1e6} USDC`,
    gasEstimate: "~0.002 APT"
  });

  if (!confirmed) return;

  // 3. Build transaction
  const transaction = await buildTransaction(...);

  // 4. Request signature from wallet
  const signed = await wallet.signAndSubmitTransaction(transaction);

  // 5. Wait for confirmation
  await waitForTransaction(signed.hash);

  // 6. Update UI
  showSuccess("Bet placed successfully!");
};
```

**4. API Rate Limiting**
```typescript
// Client-side rate limit helper
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(endpoint: string, limit: number, window: number): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(endpoint) || [];

  // Remove old requests outside window
  const recent = requests.filter(time => now - time < window);

  if (recent.length >= limit) {
    return false; // Rate limited
  }

  recent.push(now);
  rateLimiter.set(endpoint, recent);
  return true;
}

// Usage:
if (!checkRateLimit('/api/markets', 100, 60000)) {
  throw new Error("Rate limit exceeded. Please try again in a minute.");
}
```

### Performance Optimization

**1. Code Splitting**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-aptos': ['@aptos-labs/ts-sdk', '@aptos-labs/wallet-adapter-react'],
          'vendor-ui': ['framer-motion', 'react-hot-toast', 'recharts'],
        }
      }
    }
  }
})
```

**2. Lazy Loading Routes**
```typescript
import { lazy, Suspense } from 'react';

const Markets = lazy(() => import('./pages/Markets'));
const CreateMarket = lazy(() => import('./pages/CreateMarket'));
const MarketDetail = lazy(() => import('./pages/MarketDetail'));
const Portfolio = lazy(() => import('./pages/Portfolio'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/market/:id" element={<MarketDetail />} />
        <Route path="/create" element={<CreateMarket />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
    </Suspense>
  );
}
```

**3. Image Optimization**
```typescript
// Use next-gen formats
<img
  src="/images/logo.avif"
  srcset="/images/logo.avif 1x, /images/logo@2x.avif 2x"
  alt="PredictApt"
  loading="lazy"
  decoding="async"
/>
```

---

## DNS & SSL Configuration

### Cloudflare DNS Setup

```
Domain: predictapt.com (Primary)

DNS Records:
┌─────────────────────────────────────────────────────┐
│ Type  │ Name  │ Content                 │ Proxied │
├───────┼───────┼─────────────────────────┼─────────┤
│ CNAME │ @     │ predictapt.pages.dev    │ ✅ Yes  │
│ CNAME │ www   │ predictapt.com          │ ✅ Yes  │
│ CNAME │ app   │ cname.vercel-dns.com    │ ✅ Yes  │
│ CNAME │ docs  │ predictapt-docs.pages.dev│ ✅ Yes │
└─────────────────────────────────────────────────────┘

SSL/TLS Settings:
├─ Mode: Full (strict)
├─ Always Use HTTPS: ✅ On
├─ Automatic HTTPS Rewrites: ✅ On
├─ Minimum TLS Version: 1.2
└─ HSTS: max-age=31536000, includeSubDomains, preload
```

### Security Headers (Cloudflare Workers/Rules)

**For Landing Page** (predictapt.com):
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**For dApp** (app.predictapt.com):
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [see CSP section above]
```

---

## CI/CD Pipelines

### Pipeline 1: Marketing Site (Cloudflare Pages)

**Trigger**: Push to `main` branch in `/landing` directory

```yaml
# .github/workflows/deploy-landing.yml
name: Deploy Landing Page

on:
  push:
    branches: [main]
    paths:
      - 'landing/**'
      - '.github/workflows/deploy-landing.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./landing
        run: npm ci

      - name: Build
        working-directory: ./landing
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: predictapt-landing
          directory: ./landing/out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Build Time**: ~1 minute
**Risk**: Low (content changes only)
**Rollback**: Instant (Cloudflare Pages history)

---

### Pipeline 2: dApp (Vercel)

**Trigger**: Push to `production` branch OR release tag

```yaml
# .github/workflows/deploy-app.yml
name: Deploy dApp

on:
  push:
    branches: [production]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-app.yml'
  release:
    types: [published]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Lint
        working-directory: ./frontend
        run: npm run lint

      - name: Type check
        working-directory: ./frontend
        run: npx tsc --noEmit

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_MODULE_ADDRESS: ${{ secrets.VITE_MODULE_ADDRESS }}
          VITE_NETWORK: devnet

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
```

**Build Time**: ~2-3 minutes
**Risk**: Medium (user-facing functionality)
**Rollback**: Instant (Vercel deployments history)

---

## Analytics & Monitoring

### Marketing Site Analytics

**Google Analytics 4**:
```html
<!-- In landing/pages/_document.tsx -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Key Events to Track**:
```javascript
// CTA clicks
gtag('event', 'click_launch_app', {
  location: 'hero_section'
});

// Content engagement
gtag('event', 'page_view', {
  page_path: window.location.pathname
});

// Conversion funnel
gtag('event', 'begin_checkout', {
  intent: 'connect_wallet'
});
```

**Metrics Dashboard**:
- Page views
- Unique visitors
- CTA click-through rate
- Time on page
- Bounce rate
- Referral sources
- Geographic distribution

---

### dApp Analytics

**Segment / Mixpanel**:
```typescript
// frontend/src/analytics.ts
import { Analytics } from '@segment/analytics-next';

const analytics = Analytics.load({
  writeKey: import.meta.env.VITE_SEGMENT_KEY
});

// Track wallet connection
export const trackWalletConnected = (walletType: string) => {
  analytics.track('Wallet Connected', {
    wallet_type: walletType,
    timestamp: new Date().toISOString()
  });
};

// Track bet placement
export const trackBetPlaced = (marketId: number, amount: number, outcome: number) => {
  analytics.track('Bet Placed', {
    market_id: marketId,
    amount_usdc: amount / 1e6,
    outcome: outcome,
    timestamp: new Date().toISOString()
  });
};

// Track errors
export const trackError = (errorType: string, errorMessage: string) => {
  analytics.track('Error Occurred', {
    error_type: errorType,
    error_message: errorMessage,
    page: window.location.pathname,
    timestamp: new Date().toISOString()
  });
};
```

**Key Metrics**:
- Wallet connection rate
- Bet placement rate
- Average bet size
- Markets created
- Transaction success rate
- Error frequency
- User retention

---

## Operational Guardrails

### Rate Limiting (Cloudflare WAF)

**Rule 1: API Endpoints**
```
Expression: (http.request.uri.path contains "/api/")
Rate: 100 requests per minute per IP
Action: Block for 10 minutes
```

**Rule 2: Market Creation**
```
Expression: (http.request.uri.path eq "/api/markets" and http.request.method eq "POST")
Rate: 5 requests per hour per IP
Action: Challenge (CAPTCHA)
```

**Rule 3: Bet Placement**
```
Expression: (http.request.uri.path contains "/api/bets")
Rate: 50 requests per minute per IP
Action: Block for 5 minutes
```

---

### Health Checks

**Landing Page Health Check**:
```bash
# Cloudflare Worker
export default {
  async scheduled(event, env, ctx) {
    const response = await fetch('https://predictapt.com');

    if (response.status !== 200) {
      // Alert via webhook
      await fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
          content: '🚨 Landing page is down!'
        })
      });
    }
  }
};
```

**dApp Health Check**:
```bash
# Vercel serverless function
// api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA
  });
}

// Monitor via UptimeRobot
// https://app.predictapt.com/api/health
// Check interval: 5 minutes
// Alert on: 3 consecutive failures
```

**Uptime SLA Target**: 99.9% (< 43 minutes downtime/month)

---

### Security Scans

**SAST (Static Analysis)**:
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, production]
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run npm audit
        run: npm audit --production --audit-level=high
```

**DAST (Dynamic Analysis)** (Optional):
```bash
# Use OWASP ZAP or similar
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://app.predictapt.com \
  -r report.html
```

---

## Deployment Checklist

### Pre-Launch (Tonight)

**Landing Page**:
```
[ ] Create Next.js/Hugo project in /landing
[ ] Design hero section
[ ] Write feature copy
[ ] Create "Launch App" CTA
[ ] Add FAQ section
[ ] Optimize images (WebP/AVIF)
[ ] Add meta tags for SEO
[ ] Test Lighthouse score (target: 100)
[ ] Deploy to Cloudflare Pages
[ ] Configure custom domain
[ ] Verify SSL certificate
```

**dApp** (Already Built!):
```
[✅] React app exists in /frontend
[ ] Update contract address
[ ] Test wallet connection
[ ] Test bet placement
[ ] Add analytics tracking
[ ] Configure CSP headers
[ ] Deploy to Vercel
[ ] Configure app.predictapt.com subdomain
[ ] Verify SSL certificate
```

**DNS**:
```
[ ] Purchase domain (predictapt.com or alternative)
[ ] Add to Cloudflare
[ ] Configure DNS records:
    [ ] @ → Landing page
    [ ] www → Landing page
    [ ] app → dApp
    [ ] docs → Documentation (future)
[ ] Enable HSTS
[ ] Configure WAF rules
```

---

## Launch Day Timeline

### Two-Site Deployment (3-4 hours)

```
9:00 AM - 10:30 AM: Landing Page
├─ 9:00  → Create landing page project
├─ 9:30  → Build hero + features
├─ 10:00 → Deploy to Cloudflare Pages
└─ 10:30 → Configure predictapt.com domain

10:30 AM - 12:00 PM: dApp
├─ 10:30 → Update frontend config
├─ 11:00 → Deploy to Vercel
├─ 11:30 → Configure app.predictapt.com
└─ 12:00 → Test wallet connection

12:00 PM - 1:00 PM: Integration & Testing
├─ 12:00 → Test full user journey
├─ 12:30 → Verify analytics tracking
└─ 12:45 → Final security check

1:00 PM - 2:00 PM: Buffer / Fixes

2:00 PM: LAUNCH! 🚀
```

---

## Cost Summary (Year 1)

### Decoupled Architecture Costs

```
Domain: predictapt.com                $12/year
Landing Page (Cloudflare Pages):      $0 (free tier)
dApp (Vercel):                        $0 (free tier)
SSL Certificates:                     $0 (included)
CDN Bandwidth:                        $0 (unlimited on CF)
Analytics (GA4):                      $0 (free)
────────────────────────────────────────────────
TOTAL (MVP):                          $12/year

With Pro Features:
────────────────────────────────────────────────
Domain: predictapt.com                $12/year
Cloudflare Pro:                       $240/year
Vercel Pro:                           $240/year
Segment Analytics:                    $120/year
UptimeRobot:                          $84/year
────────────────────────────────────────────────
TOTAL (Production):                   $696/year ($58/month)
```

---

## Benefits Summary

### Why This Architecture Wins

**1. Performance**
- Landing page: < 0.5s load time (pure static)
- dApp: Only loads Web3 when needed
- Global CDN for both
- Independent optimization

**2. Security**
- Clear boundaries (marketing vs. wallet)
- Reduced attack surface on landing
- Strict CSP on dApp
- No accidental wallet prompts

**3. Marketing**
- A/B test landing without touching dApp
- SEO optimized marketing site
- Clear conversion funnel
- Professional first impression

**4. DevOps**
- Independent deployment pipelines
- Lower risk of breaking changes
- Easy rollbacks
- Faster iteration

**5. User Experience**
- Fast first impression
- Clear "Enter App" action
- No wallet confusion
- Smooth onboarding

---

## Next Steps (Tonight)

**Choose One**:

**Option A: Quick Launch (Use Existing Frontend)**
```
1. Deploy current /frontend to app.predictapt.com
2. Create simple one-page landing at predictapt.com
3. Launch tomorrow with decoupled architecture
```

**Option B: Full Build (New Landing Page)**
```
1. Build professional landing page tonight
2. Deploy landing + dApp tomorrow
3. Launch with complete two-tier architecture
```

**Recommendation**: **Option A** for speed, upgrade landing page post-launch.

---

**Status**: Architecture Designed ✅
**Ready to Deploy**: Yes
**Timeline**: 3-4 hours (two sites)
**Risk**: Low (proven architecture)

This is the production-grade approach used by:
- Uniswap (uniswap.org → app.uniswap.org)
- Aave (aave.com → app.aave.com)
- Compound (compound.finance → app.compound.finance)

**Your turn**: Choose Option A or B, and we'll execute tomorrow! 🚀

