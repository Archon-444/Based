# Deployment Runbook - Based

**Last Updated:** 2025-10-23
**Owner:** DevOps Team
**Version:** 1.0

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Environment Setup](#2-environment-setup)
3. [Database Migration](#3-database-migration)
4. [Smart Contract Deployment](#4-smart-contract-deployment)
5. [Backend API Deployment](#5-backend-api-deployment)
6. [Frontend Deployment](#6-frontend-deployment)
7. [Post-Deployment Verification](#7-post-deployment-verification)
8. [Rollback Procedure](#8-rollback-procedure)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Pre-Deployment Checklist

### 1.1 Code Quality Gates

- [ ] All tests passing (32/32 Move tests, backend tests, frontend tests)
- [ ] Security audit completed and signed off
- [ ] Code review approved (2+ reviewers)
- [ ] Documentation updated
- [ ] Changelog prepared

**Verification:**
```bash
# Run all tests
cd contracts && aptos move test
cd ../backend && npm test
cd ../dapp && npm test

# Check git status
git status  # Should be clean
git log -1  # Verify commit
```

### 1.2 Infrastructure Checklist

- [ ] Backup current database
- [ ] Monitoring systems operational (Prometheus/Grafana)
- [ ] Alert channels configured (Slack, PagerDuty)
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

### 1.3 Environment Variables

**Backend (.env):**
```bash
# Required for all environments
DATABASE_URL=postgresql://...
NODE_ENV=production|staging|development
PORT=3000
CORS_ORIGIN=https://based.app

# Blockchain
APTOS_NETWORK=mainnet|testnet
APTOS_MODULE_ADDRESS=0x...
APTOS_PRIVATE_KEY=0x...  # Multi-sig signer

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
JWT_SECRET=...

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=...  # Error tracking
```

**Frontend (.env.production):**
```bash
VITE_API_URL=https://api.based.app
VITE_APTOS_NETWORK=mainnet
VITE_MODULE_ADDRESS=0x...
VITE_ENVIRONMENT=production
```

---

## 2. Environment Setup

### 2.1 Server Provisioning

**Requirements:**
- **CPU:** 4 cores minimum
- **RAM:** 8GB minimum
- **Disk:** 50GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Network:** Public IP, HTTPS enabled

**Initial Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo apt install -y postgresql-15

# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install monitoring tools
docker compose -f monitoring/docker-compose.yml up -d
```

### 2.2 SSL Certificates

```bash
# Install certbot
sudo apt install -y certbot

# Generate certificates
sudo certbot certonly --standalone -d api.based.app
sudo certbot certonly --standalone -d based.app

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 2.3 Firewall Configuration

```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend API (via nginx proxy)
sudo ufw enable
```

---

## 3. Database Migration

### 3.1 Backup Current Database

```bash
# Create backup
pg_dump aptos_prediction_market > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3/backup storage
aws s3 cp backup_*.sql s3://based-backups/
```

### 3.2 Run Migrations

```bash
cd backend

# Check migration status
npx prisma migrate status

# Run pending migrations
npx prisma migrate deploy

# Verify schema
npx prisma studio  # Visual verification
```

### 3.3 Seed Data (Staging/Testnet Only)

```bash
# Staging environment only
npx prisma db seed
```

---

## 4. Smart Contract Deployment

### 4.1 Multi-Sig Preparation

**Signers Required:** 3 of 5

```bash
# Each signer runs:
aptos init --network mainnet
aptos account list --account <address>
```

### 4.2 Deploy Contracts

**Step 1: Compile Contracts**
```bash
cd contracts

# Update Move.toml with mainnet addresses
[addresses]
based = "0x..."  # Replace with deployer address
circle = "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa"  # Circle USDC mainnet

# Compile
aptos move compile --named-addresses based=<deployer_address>

# Verify build
ls build/Based/bytecode_modules/
```

**Step 2: Deploy via Multi-Sig**
```bash
# Proposer creates transaction
aptos multisig create-transaction \
  --multisig-address 0x<multi-sig> \
  --function-id <deployer_address>::market_manager::initialize \
  --args address:<admin_address>

# Signers approve (need 3 of 5)
aptos multisig approve \
  --multisig-address 0x<multi-sig> \
  --sequence-number 0

# Execute
aptos multisig execute-transaction \
  --multisig-address 0x<multi-sig> \
  --sequence-number 0
```

**Step 3: Initialize Modules**
```bash
# Initialize market manager
aptos move run \
  --function-id <module_address>::market_manager::initialize \
  --args address:<admin_address>

# Initialize access control
aptos move run \
  --function-id <module_address>::access_control::initialize \
  --args address:<admin_address>

# Initialize collateral vault (creates resource account internally)
aptos move run \
  --function-id <module_address>::collateral_vault::initialize \
  --args vector<u8>:0x7661756c74 address:0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832

# Verify vault resource account and shared USDC metadata
aptos move view \
  --function-id <module_address>::collateral_vault::get_vault_address

aptos move view \
  --function-id <module_address>::collateral_vault::get_metadata_object

# Expected: metadata object address must match Circle USDC on the target network.

# Initialize oracle staking registry (creates resource account internally)
aptos move run \
  --function-id <module_address>::oracle::initialize \
  --args vector<u8>:0x6f7261636c65

# The oracle registry now reuses the USDC metadata exposed by the vault. Ensure
# the collateral vault has been initialized before running this step so the
# shared object lookup succeeds.

# Grant roles to operators
aptos move run \
  --function-id <module_address>::access_control::grant_role \
  --args address:<resolver_address> u8:2  # ROLE_RESOLVER
```

### 4.3 Verify Deployment

```bash
# Check module exists
aptos account list --account <module_address>

# Test read function
aptos move view \
  --function-id <module_address>::market_manager::get_market_count

# Verify on explorer
open "https://explorer.aptoslabs.com/account/<module_address>?network=mainnet"
```

---

## 5. Backend API Deployment

### 5.1 Build Production Bundle

```bash
cd backend

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Verify build
ls dist/  # Should contain compiled .js files
```

### 5.2 Deploy with PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save

# Setup auto-start on reboot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Monitor
pm2 status
pm2 logs based-backend --lines 100
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'based-backend',
    script: './dist/index.js',
    instances: 2,  # 2 instances for load balancing
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
  }]
};
```

### 5.3 Configure Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/based-api
server {
    listen 443 ssl http2;
    server_name api.based.app;

    ssl_certificate /etc/letsencrypt/live/api.based.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.based.app/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/based-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 6. Frontend Deployment

### 6.1 Build Production Bundle

```bash
cd dapp

# Install dependencies
npm ci

# Build for production
npm run build

# Verify build
ls dist/  # Should contain index.html, assets/, etc.
```

### 6.2 Deploy to Static Hosting

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

**Option B: Nginx Static Files**
```bash
# Copy build to web root
sudo cp -r dist/* /var/www/based/

# Configure nginx
# /etc/nginx/sites-available/based
server {
    listen 443 ssl http2;
    server_name based.app www.based.app;

    ssl_certificate /etc/letsencrypt/live/based.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/based.app/privkey.pem;

    root /var/www/based;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Enable and reload
sudo ln -s /etc/nginx/sites-available/based /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Post-Deployment Verification

### 7.1 Health Checks

```bash
# Backend health
curl https://api.based.app/health
# Expected: {"status":"ok","uptime":123}

# API docs available
curl https://api.based.app/api-docs.json | jq '.info.version'

# Metrics endpoint
curl https://api.based.app/metrics | grep http_requests_total
```

### 7.2 Functional Tests

```bash
# Test suggestions API
curl -X POST https://api.based.app/api/suggestions \
  -H "Content-Type: application/json" \
  -H "x-dev-wallet-address: 0x123..." \
  -d '{"question":"Test?","outcomes":["Yes","No"],"durationHours":24}'

# List markets
curl https://api.based.app/api/markets | jq '.[0]'
```

### 7.3 Frontend Smoke Test

1. Open https://based.app
2. Connect wallet (Petra/Martian)
3. Browse markets
4. Click on a market (detail page should load)
5. Submit a suggestion (should succeed)

### 7.4 Monitoring Check

```bash
# Check Prometheus targets
curl http://monitoring.based.app:9090/api/v1/targets | jq '.data.activeTargets[].health'
# All should be "up"

# Check Grafana dashboards
open "http://monitoring.based.app:3001/dashboards"
```

---

## 8. Rollback Procedure

### 8.1 When to Rollback

Rollback immediately if:
- Critical functionality broken
- Data corruption detected
- Security vulnerability discovered
- >5% error rate for >5 minutes

### 8.2 Rollback Steps

**Backend Rollback:**
```bash
# Stop current version
pm2 stop based-backend

# Checkout previous version
git checkout <previous-tag>

# Rebuild
npm run build

# Rollback database (if needed)
psql aptos_prediction_market < backup_YYYYMMDD_HHMMSS.sql

# Restart
pm2 restart based-backend

# Verify
curl https://api.based.app/health
```

**Frontend Rollback:**
```bash
# Vercel (automatic)
vercel rollback

# Or nginx
sudo rm -rf /var/www/based/*
sudo cp -r dist-backup/* /var/www/based/
```

**Smart Contracts (NOT POSSIBLE):**
⚠️ **Contracts cannot be rolled back once deployed!**
- Instead: Deploy new version with fixes
- Or: Use emergency pause mechanism

```bash
# Emergency pause
aptos move run \
  --function-id <module_address>::access_control::pause_system
```

---

## 9. Troubleshooting

### 9.1 Common Issues

**Issue:** Backend not starting
```bash
# Check logs
pm2 logs based-backend --err

# Common causes:
# - Database connection failed → Check DATABASE_URL
# - Port already in use → lsof -i :3000
# - Missing environment variables → Check .env file
```

**Issue:** High latency
```bash
# Check database connection pool
psql -c "SELECT count(*) FROM pg_stat_activity;"
# Should be < 50

# Check API metrics
curl localhost:3000/metrics | grep http_request_duration
```

**Issue:** Smart contract calls failing
```bash
# Check gas prices
aptos node get-chain-id

# Verify module deployed
aptos account list --account <module_address>

# Check transaction on explorer
aptos transaction show --hash <tx_hash>
```

### 9.2 Emergency Contacts

**On-Call Engineer:** [Phone/Telegram]
**DevOps Lead:** [Phone/Email]
**Security Team:** security@based.app
**Aptos Support:** Discord #developer-support

### 9.3 Incident Response

See [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md)

---

## Appendix: Deployment Checklist

Print and check off during deployment:

```
PRE-DEPLOYMENT
[ ] All tests passing
[ ] Security audit approved
[ ] Backup database
[ ] Team notified

DEPLOYMENT
[ ] Contracts deployed and initialized
[ ] Backend deployed via PM2
[ ] Frontend deployed
[ ] Nginx configured

POST-DEPLOYMENT
[ ] Health checks passing
[ ] Functional tests passing
[ ] Monitoring operational
[ ] Team notified of success

ROLLBACK (IF NEEDED)
[ ] Issue identified and documented
[ ] Rollback executed
[ ] Verification complete
[ ] Post-mortem scheduled
```

---

**Document Status:** ✅ Ready for Use
**Last Deployment:** [Date]
**Next Review:** After each major deployment
