# Incident Response Runbook - Based

**Last Updated:** 2025-10-23
**Owner:** Security & DevOps Team
**Version:** 1.0

---

## Quick Reference

### Emergency Actions

| Issue | Immediate Action | Command |
|-------|-----------------|---------|
| **Funds at risk** | Pause system | `aptos move run --function-id <addr>::access_control::pause_system` |
| **API down** | Restart backend | `pm2 restart based-backend` |
| **Database breach** | Rotate credentials | `./scripts/rotate-db-credentials.sh` |
| **DDoS attack** | Enable rate limiting | `sudo ufw deny from <ip-range>` |

### Emergency Contacts

- **On-Call Engineer:** +1-XXX-XXX-XXXX (Telegram: @oncall)
- **Security Lead:** security@based.app
- **DevOps Lead:** devops@based.app
- **CEO/Founder:** +1-XXX-XXX-XXXX

---

## Table of Contents

1. [Incident Classification](#1-incident-classification)
2. [Incident Response Process](#2-incident-response-process)
3. [Severity 1: Critical (Funds at Risk)](#3-severity-1-critical-funds-at-risk)
4. [Severity 2: High (Service Down)](#4-severity-2-high-service-down)
5. [Severity 3: Medium (Degraded Service)](#5-severity-3-medium-degraded-service)
6. [Severity 4: Low (Monitoring Alert)](#6-severity-4-low-monitoring-alert)
7. [Post-Incident Review](#7-post-incident-review)
8. [Runbook for Specific Scenarios](#8-runbook-for-specific-scenarios)

---

## 1. Incident Classification

### Severity Levels

**SEV-1: CRITICAL** 🔴
- User funds at risk
- Smart contract vulnerability discovered
- Complete service outage (>5 minutes)
- Data breach/leak
- **Response Time:** <15 minutes
- **Escalation:** Immediate (all hands)

**SEV-2: HIGH** 🟠
- Partial service outage
- Authentication bypass
- Database corruption
- API error rate >10%
- **Response Time:** <30 minutes
- **Escalation:** On-call + lead

**SEV-3: MEDIUM** 🟡
- Performance degradation
- Single feature broken
- Rate limiting triggered
- Minor security issue
- **Response Time:** <2 hours
- **Escalation:** On-call engineer

**SEV-4: LOW** 🟢
- Monitoring alerts
- Non-critical bugs
- Documentation issues
- **Response Time:** <24 hours
- **Escalation:** Normal priority

---

## 2. Incident Response Process

### Step-by-Step Process

```
1. DETECT → 2. ASSESS → 3. CONTAIN → 4. MITIGATE → 5. RECOVER → 6. REVIEW
```

### 2.1 Detection (0-5 minutes)

**How incidents are detected:**
- Monitoring alerts (Prometheus/Grafana)
- User reports (support tickets, Discord)
- Team member observation
- Automated health checks

**Initial Actions:**
1. Acknowledge alert in PagerDuty/Slack
2. Join incident response channel (#incident-response)
3. Assess severity (use classification above)

### 2.2 Assessment (5-15 minutes)

**Questions to answer:**
- What is the impact? (users affected, funds at risk)
- What is the root cause? (if known)
- What is the severity? (SEV-1 to SEV-4)
- Is escalation needed?

**Assessment Checklist:**
```bash
# Check system health
curl https://api.based.app/health
curl https://api.based.app/metrics | grep error

# Check database
psql -c "SELECT count(*) FROM users;" # Should return count
psql -c "SELECT pg_database_size('based');" # Check size

# Check smart contracts
aptos move view --function-id <addr>::market_manager::is_paused
# Should return false (unless intentionally paused)

# Check monitoring
open "http://monitoring.based.app:3001/dashboards"
```

### 2.3 Containment (Immediate)

**Goal:** Stop the bleeding

**For SEV-1 (Funds at Risk):**
```bash
# PAUSE SYSTEM IMMEDIATELY
aptos move run \
  --function-id <module_addr>::access_control::pause_system \
  --private-key-file ~/.aptos/admin_key.json

# Verify pause
aptos move view --function-id <module_addr>::access_control::is_paused
# Should return true

# Announce on frontend
# Update status page: https://status.based.app
```

**For SEV-2 (Service Down):**
```bash
# Enable maintenance mode
pm2 stop based-backend
# Update nginx to serve maintenance page

# Or rollback if recent deployment
vercel rollback  # Frontend
pm2 restart based-backend --update-env  # Backend
```

### 2.4 Mitigation (15-60 minutes)

**Identify root cause:**
- Review logs: `pm2 logs based-backend --lines 500`
- Review metrics: Check Grafana dashboards
- Review recent changes: `git log --since="2 hours ago"`
- Review blockchain transactions: Aptos Explorer

**Common root causes and fixes:**
- Database connection pool exhausted → Restart backend
- Rate limiting misconfigured → Adjust limits
- Smart contract bug → Deploy fix or keep paused
- DDoS attack → Update firewall rules

### 2.5 Recovery (30 minutes - 2 hours)

**Restore normal operations:**
1. Deploy fix (if needed)
2. Verify fix in staging/testnet
3. Deploy to production
4. Monitor for recurrence
5. Unpause system (if paused)

**Unpause checklist:**
```bash
# 1. Verify fix deployed
curl https://api.based.app/health

# 2. Test critical functions
curl -X POST https://api.based.app/api/suggestions \
  -H "Content-Type: application/json" \
  -H "x-dev-wallet-address: 0x123..." \
  -d '{"question":"Test","outcomes":["A","B"],"durationHours":1}'

# 3. Unpause system
aptos move run \
  --function-id <module_addr>::access_control::unpause_system \
  --private-key-file ~/.aptos/admin_key.json

# 4. Announce recovery
# Update status page, Discord, Twitter
```

### 2.6 Communication

**Internal:**
- Post updates in #incident-response every 15 minutes
- Use incident.io or similar for tracking

**External:**
- Update status page: https://status.based.app
- Post on Discord: #announcements
- Tweet from @Based
- Email users (if SEV-1 or SEV-2 with user impact)

**Communication Template:**
```
[SEV-1] INCIDENT: Brief description

STATUS: Investigating / Mitigating / Resolved
IMPACT: What users are experiencing
ETR: Estimated time to resolution
UPDATES: Will provide updates every 15 minutes

Last updated: [timestamp]
```

---

## 3. Severity 1: Critical (Funds at Risk)

### Scenario 1: Smart Contract Vulnerability

**Symptoms:**
- Unusual withdrawals detected
- Exploit reported by white hat
- Funds moving unexpectedly

**Immediate Actions:**
```bash
# 1. PAUSE SYSTEM (DO NOT DELAY)
aptos move run --function-id <addr>::access_control::pause_system

# 2. Document the exploit
# Take screenshots, copy transaction hashes

# 3. Alert security team
# Email: security@based.app
# Signal: +1-XXX-XXX-XXXX

# 4. Contact audit firm (if available)
# OtterSec emergency: hello@osec.io

# 5. Assess damage
aptos move view --function-id <addr>::collateral_vault::get_total_collateral
# Compare to expected value
```

**Mitigation:**
1. Keep system paused
2. Work with security firm to develop fix
3. Deploy patched contracts (new address)
4. Migrate user funds (if possible)
5. Compensate affected users

**Communication:**
```
🚨 SECURITY INCIDENT - SYSTEM PAUSED

We've detected a potential vulnerability and have paused the system as a precautionary measure. User funds are safe and secured in the vault.

We're working with our security auditors to investigate and resolve the issue. We'll provide updates every 30 minutes.

Thank you for your patience.
```

### Scenario 2: Oracle Manipulation

**Symptoms:**
- Markets resolving with incorrect outcomes
- Unusual oracle price submissions
- Large payouts to specific addresses

**Immediate Actions:**
```bash
# 1. Pause affected markets (if possible)
# Note: May need to pause entire system

# 2. Investigate oracle data
aptos move view --function-id <addr>::oracle::get_price_feed \
  --args u64:<market_id>

# 3. Check oracle whitelist
aptos move view --function-id <addr>::oracle::is_whitelisted_oracle \
  --args address:<oracle_addr>

# 4. Remove malicious oracle
aptos move run --function-id <addr>::oracle::remove_oracle \
  --args address:<malicious_oracle>
```

### Scenario 3: Database Breach

**Symptoms:**
- Unauthorized access detected
- Unusual query patterns
- Data exfiltration suspected

**Immediate Actions:**
```bash
# 1. Isolate database
sudo ufw deny from any to any port 5432
# Only allow from backend IP

# 2. Kill all connections
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid();"

# 3. Rotate credentials
./scripts/rotate-db-credentials.sh

# 4. Review audit logs
psql -c "SELECT * FROM pg_stat_statements ORDER BY calls DESC LIMIT 100;"

# 5. Check for data exfiltration
# Review server logs for unusual queries
```

---

## 4. Severity 2: High (Service Down)

### Scenario 1: API Completely Down

**Symptoms:**
- Health check failing
- All API requests returning errors
- Frontend can't connect

**Investigation:**
```bash
# 1. Check if process is running
pm2 status

# 2. Check logs
pm2 logs based-backend --err --lines 100

# 3. Check system resources
htop  # CPU/memory usage
df -h  # Disk space
```

**Resolution:**
```bash
# Common fixes:

# A) Process crashed - restart
pm2 restart based-backend

# B) Out of memory
pm2 restart based-backend --update-env
# Then increase PM2 memory limit in ecosystem.config.js

# C) Database connection pool exhausted
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"
pm2 restart based-backend

# D) Recent bad deployment - rollback
git checkout <previous-tag>
npm run build
pm2 restart based-backend
```

### Scenario 2: Database Down

**Investigation:**
```bash
# 1. Check PostgreSQL status
sudo systemctl status postgresql

# 2. Check logs
sudo tail -100 /var/log/postgresql/postgresql-15-main.log

# 3. Check disk space
df -h /var/lib/postgresql
```

**Resolution:**
```bash
# A) PostgreSQL crashed - restart
sudo systemctl restart postgresql

# B) Out of disk space
# Clean up logs, old backups
sudo du -sh /var/log/postgresql/*
sudo find /backups -mtime +30 -delete

# C) Corrupted data
# Restore from backup
psql < backup_latest.sql
```

---

## 5. Severity 3: Medium (Degraded Service)

### Scenario 1: Slow API Responses

**Investigation:**
```bash
# Check p95 latency
curl localhost:3000/metrics | grep http_request_duration_seconds_bucket

# Check database query performance
psql -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

**Resolution:**
- Add database indexes
- Optimize slow queries
- Scale horizontally (add more backend instances)
- Enable caching (Redis)

### Scenario 2: High Error Rate (5-10%)

**Investigation:**
```bash
# Check error types
pm2 logs based-backend | grep "ERROR"

# Check specific endpoints
curl localhost:3000/metrics | grep http_requests_total | grep status=\"5
```

**Resolution:**
- Fix bugs causing errors
- Add better error handling
- Scale if resource constrained

---

## 6. Severity 4: Low (Monitoring Alert)

### Scenario 1: High CPU Usage

**Investigation:**
```bash
# Check process CPU
top

# Check what's causing load
pm2 monit
```

**Resolution:**
- Restart if memory leak suspected
- Scale if sustained high load
- Optimize inefficient code

---

## 7. Post-Incident Review

### Required After SEV-1 or SEV-2

**Within 48 hours of resolution:**

1. **Timeline Document**
   - Detection time
   - Response time
   - Mitigation time
   - Resolution time
   - Total impact duration

2. **Root Cause Analysis**
   - What happened?
   - Why did it happen?
   - How did we detect it?
   - How did we fix it?

3. **Impact Assessment**
   - Users affected
   - Funds at risk/lost
   - Reputation damage
   - Financial cost

4. **Action Items**
   - What went well?
   - What went poorly?
   - What will we change?
   - Who is responsible for each action item?

5. **Follow-up**
   - Schedule review meeting (all stakeholders)
   - Update runbooks based on learnings
   - Implement preventive measures

**Post-Mortem Template:**
```markdown
# Post-Incident Review: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** SEV-X
**Duration:** X hours Y minutes
**Lead:** [Name]

## Summary
[Brief description of what happened]

## Timeline
- HH:MM - Incident detected
- HH:MM - Team alerted
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Impact
- Users affected: X
- Downtime: X minutes
- Funds at risk: $X

## Root Cause
[Detailed explanation]

## Resolution
[What we did to fix it]

## Action Items
- [ ] [Action item 1] - Owner: [Name] - Due: [Date]
- [ ] [Action item 2] - Owner: [Name] - Due: [Date]

## Lessons Learned
### What Went Well
- [Item 1]

### What Went Poorly
- [Item 1]

### What We'll Change
- [Item 1]
```

---

## 8. Runbook for Specific Scenarios

### 8.1 DDoS Attack

**Symptoms:**
- Extremely high request rate
- Rate limiting triggering constantly
- Legitimate users can't connect

**Actions:**
```bash
# 1. Identify attack source
sudo tail -f /var/log/nginx/access.log | grep -E "POST|GET"

# 2. Block malicious IPs
sudo ufw deny from <ip-address>

# Or block IP range
sudo ufw deny from 1.2.3.0/24

# 3. Enable Cloudflare DDoS protection (if using)
# Login to Cloudflare dashboard → Security → DDoS

# 4. Temporarily increase rate limits
# Edit backend/src/config/env.ts
RATE_LIMIT_MAX=300  # Increase temporarily
```

### 8.2 Failed Deployment

**Rollback procedure:**
```bash
# Backend rollback
cd backend
git checkout <previous-tag>
npm run build
pm2 restart based-backend

# Frontend rollback
cd dapp
vercel rollback
# Or: git checkout <previous-tag> && npm run build && deploy

# Database rollback (if migrations failed)
psql based < backup_pre_deployment.sql
```

### 8.3 Monitoring System Down

**Fix Prometheus/Grafana:**
```bash
# Restart monitoring stack
cd monitoring
docker-compose restart

# Check logs
docker-compose logs prometheus
docker-compose logs grafana

# Reconfigure if needed
vim prometheus/prometheus.yml
docker-compose up -d
```

---

## Appendix A: Emergency Scripts

### Pause System
```bash
#!/bin/bash
# scripts/emergency-pause.sh

echo "⚠️  EMERGENCY PAUSE - Pausing all systems"
echo "Are you sure? (yes/no)"
read confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted"
  exit 1
fi

# Pause smart contracts
aptos move run \
  --function-id $MODULE_ADDR::access_control::pause_system \
  --private-key-file ~/.aptos/admin_key.json

echo "✅ System paused"
echo "📢 Remember to:"
echo "   1. Update status page"
echo "   2. Notify users on Discord/Twitter"
echo "   3. Alert the team"
```

### Rotate Database Credentials
```bash
#!/bin/bash
# scripts/rotate-db-credentials.sh

NEW_PASSWORD=$(openssl rand -base64 32)

# Update PostgreSQL
sudo -u postgres psql -c "ALTER USER based WITH PASSWORD '$NEW_PASSWORD';"

# Update backend .env
sed -i "s/DATABASE_URL=.*/DATABASE_URL=postgresql://based:$NEW_PASSWORD@localhost:5432/based/" backend/.env

# Restart backend
pm2 restart based-backend

echo "✅ Database credentials rotated"
```

---

## Appendix B: Monitoring Queries

### Check System Health
```bash
# Full health check script
#!/bin/bash

echo "=== System Health Check ==="

# API
echo -n "API: "
curl -s https://api.based.app/health | jq -r '.status'

# Database
echo -n "Database: "
psql -c "SELECT 1" > /dev/null 2>&1 && echo "OK" || echo "FAIL"

# Smart Contracts
echo -n "Contracts: "
aptos move view --function-id $MODULE_ADDR::access_control::is_paused | grep -q "false" && echo "ACTIVE" || echo "PAUSED"

# Monitoring
echo -n "Prometheus: "
curl -s http://localhost:9090/-/healthy > /dev/null && echo "OK" || echo "FAIL"

echo "=== End Health Check ==="
```

---

**Document Status:** ✅ Ready for Use
**Last Incident:** [Date] - [Brief description]
**Next Drill:** [Date] - Schedule quarterly incident response drills
