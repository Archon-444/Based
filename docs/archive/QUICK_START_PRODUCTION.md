# Quick Start - Production Deployment
**5-Minute Deploy Guide**

---

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Aptos CLI installed
- [ ] Deployed contract address (or use Devnet: `0xb2329b6b...`)
- [ ] Domain name (optional but recommended)

---

## Step 1: Configure Environment (2 minutes)

```bash
cd dapp

# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

**Required**:
```bash
VITE_MODULE_ADDRESS=0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894
```

**Optional**:
```bash
VITE_NETWORK=mainnet  # or devnet/testnet
VITE_ENABLE_SERVICE_WORKER=true  # for PWA
VITE_LOG_LEVEL=WARN  # for production
```

---

## Step 2: Build (1 minute)

```bash
npm install
npm run build:check
```

**Expected Output**:
```
✓ built in ~3-4s
dist/ folder created
0 errors
```

---

## Step 3: Deploy (2 minutes)

### Option A: Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Option B: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option C: Custom Server
```bash
# Upload dist/ folder to your web server
# Configure nginx/apache for SPA routing
```

---

## Step 4: Verify (5 minutes)

1. **Open Production URL**
   - Check console for errors (F12)

2. **Test Wallet Connection**
   - Click "Connect Wallet"
   - Select Petra or Martian
   - Approve connection

3. **Browse Markets**
   - Navigate to /markets
   - Verify markets load correctly

4. **Place Test Bet** (Optional)
   - Select a market
   - Place minimum bet (1 USDC)
   - Confirm transaction

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build:check
```

### Module Address Error
```
Error: Invalid module address: using placeholder 0x1
```
**Fix**: Set `VITE_MODULE_ADDRESS` in `.env`

### Wallet Won't Connect
**Check**:
- [ ] Wallet extension installed
- [ ] Network matches (devnet/mainnet)
- [ ] Browser allows pop-ups

### Markets Don't Load
**Check**:
- [ ] Module address is correct
- [ ] Network matches deployed contract
- [ ] Console for specific error

---

## Production Checklist

### Before Launch
- [ ] Environment variables configured
- [ ] Build passes with 0 errors
- [ ] Local preview works (`npm run preview`)
- [ ] Wallet connection tested
- [ ] SSL certificate configured
- [ ] Custom domain set up

### After Launch
- [ ] Monitor error rates (Sentry recommended)
- [ ] Check analytics (Google Analytics / Plausible)
- [ ] Test on mobile devices
- [ ] Monitor gas usage
- [ ] Set up alerts for downtime

---

## Quick Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Type check
npm run build:check

# Run tests
npm test -- --run

# Production build
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_MODULE_ADDRESS` | ✅ Yes | `0x1` | Deployed contract address |
| `VITE_NETWORK` | No | `devnet` | Network: devnet/testnet/mainnet |
| `VITE_USDC_ADDRESS` | No | Module address | Separate USDC contract |
| `VITE_API_URL` | No | `/api` | Backend API endpoint |
| `VITE_VAPID_PUBLIC_KEY` | No | - | For push notifications |
| `VITE_ENABLE_SERVICE_WORKER` | No | `false` | Enable PWA features |
| `VITE_LOG_LEVEL` | No | `INFO` | DEBUG/INFO/WARN/ERROR |

---

## Support

- **Documentation**: See `/docs` folder
- **Issues**: Check console for error messages
- **Contract Address**: [View on Explorer](https://explorer.aptoslabs.com/account/0xb2329b6b3270c2577393cbe937de53f933545e29942331f452574f6afbd2d894?network=devnet)

---

## Next Steps

1. **Set Up Monitoring**
   - Add Sentry for error tracking
   - Set up uptime monitoring
   - Configure analytics

2. **Optimize Performance**
   - Enable CDN for static assets
   - Add code splitting
   - Optimize images

3. **Security**
   - Schedule professional audit
   - Launch bug bounty program
   - Set up security headers

4. **Growth**
   - Create social media presence
   - Write launch announcement
   - Engage Aptos community

---

**Ready to launch? Run the commands above and you're live in 10 minutes! 🚀**
