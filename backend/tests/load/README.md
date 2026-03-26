# Load Testing Guide

This directory contains load tests for the Based backend API using k6.

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

## Quick Start

### 1. Start Backend Server

```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

### 2. Run Load Tests

**Basic Test (Suggestions API):**
```bash
cd backend/tests/load
k6 run scenarios/suggestions.loadtest.ts
```

**Rate Limit Test:**
```bash
k6 run scenarios/ratelimit.loadtest.ts
```

**Against Staging:**
```bash
k6 run -e API_URL=https://staging-api.based.app scenarios/suggestions.loadtest.ts
```

## Test Scenarios

### 1. Suggestions Load Test
**File:** `scenarios/suggestions.loadtest.ts`

Tests normal API operations:
- List suggestions (read-heavy)
- Create suggestions (write operations)
- Vote on suggestions (updates)
- Filter suggestions (queries)

**Configuration:**
- 50 concurrent users
- 5 minute duration
- ~15,000 requests total

**Run:**
```bash
k6 run scenarios/suggestions.loadtest.ts
```

**Expected Results:**
- p95 response time < 500ms
- Error rate < 1%
- Throughput: ~50 req/s

### 2. Rate Limit Verification Test
**File:** `scenarios/ratelimit.loadtest.ts`

Specifically tests rate limiting:
- Single user spam (100 requests)
- Multiple users within limits
- Rate limit recovery
- Different endpoint limits

**Run:**
```bash
k6 run scenarios/ratelimit.loadtest.ts
```

**Expected Results:**
- Rate limits triggered after 60 requests/min (public)
- 429 responses with proper format
- System recovers after window expires
- Different limits for different endpoints

### 3. Spike Test
**File:** `scenarios/spike.loadtest.ts` (create this)

Tests recovery from sudden traffic spikes:
- 10 users → 100 users → 10 users

### 4. Stress Test
**File:** `scenarios/stress.loadtest.ts` (create this)

Finds breaking point:
- Gradually increase from 50 to 200 users
- Monitor when system starts degrading

### 5. Soak Test
**File:** `scenarios/soak.loadtest.ts` (create this)

Tests stability over time:
- 50 users for 30 minutes
- Check for memory leaks, connection pool exhaustion

## Key Metrics

### Response Time
- **p50**: 50th percentile (median)
- **p95**: 95th percentile (SLO target: <500ms)
- **p99**: 99th percentile (should be <1s)

### Error Rate
- Target: <1%
- Includes 4xx and 5xx responses

### Throughput
- Requests per second (req/s)
- Expected: 50-100 req/s for normal load

### Rate Limiting
- Rate limit hits (429 responses)
- Rate limit recoveries

## Interpreting Results

### Good Results ✅
```
✓ checks.........................: 99.50% ✓ 14925 ✗ 75
  http_req_duration..............: avg=180ms  p95=450ms
  http_req_failed................: 0.50%
  rate_limit_hits................: 45 (rate limiting working)
```

### Warning Signs ⚠️
```
✓ checks.........................: 95.00% ✓ 14250 ✗ 750
  http_req_duration..............: avg=350ms  p95=800ms
  http_req_failed................: 5.00%
```
→ Response times increasing, error rate high

### Critical Issues 🔴
```
✓ checks.........................: 80.00% ✓ 12000 ✗ 3000
  http_req_duration..............: avg=1200ms  p95=3000ms
  http_req_failed................: 20.00%
```
→ System overloaded, needs optimization

## Advanced Usage

### Custom Configuration

**Environment Variables:**
```bash
# Test against different environments
export API_URL=https://staging-api.based.app
k6 run scenarios/suggestions.loadtest.ts

# Adjust load
k6 run --vus 100 --duration 10m scenarios/suggestions.loadtest.ts
```

### Output Options

**HTML Report:**
```bash
k6 run --out json=results.json scenarios/suggestions.loadtest.ts
k6 report results.json --output report.html
```

**InfluxDB + Grafana:**
```bash
# Send metrics to InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 scenarios/suggestions.loadtest.ts
```

**Cloud (k6 Cloud):**
```bash
k6 login cloud
k6 cloud scenarios/suggestions.loadtest.ts
```

## Troubleshooting

### Rate Limits Triggering Immediately
**Cause:** Previous test run didn't complete cooldown
**Fix:** Wait 1 minute or restart backend server

### Connection Errors
**Cause:** Backend not running or wrong URL
**Fix:**
```bash
curl http://localhost:3000/health
# Should return 200 OK
```

### High Error Rates
**Cause:** Database connection pool exhausted
**Fix:** Check PostgreSQL connections:
```bash
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Memory Issues
**Cause:** Memory leak in backend
**Fix:** Monitor with:
```bash
# Linux
htop

# macOS
Activity Monitor
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Load Test

on:
  push:
    branches: [main, staging]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Start Backend
        run: |
          cd backend
          npm install
          npm run build
          npm start &
          sleep 10

      - name: Run Load Tests
        run: |
          cd backend/tests/load
          k6 run scenarios/suggestions.loadtest.ts

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

## Continuous Monitoring

For production, set up continuous load testing:

1. **Scheduled Tests:** Run load tests nightly
2. **Synthetic Monitoring:** Use k6 Cloud or Datadog Synthetics
3. **Alerting:** Alert on SLO violations (p95 > 500ms, errors > 1%)

## Next Steps

After completing load tests:

1. **Analyze Results:** Review metrics and identify bottlenecks
2. **Optimize:** Database queries, connection pooling, caching
3. **Scale:** Horizontal scaling if needed (add more instances)
4. **Document:** Record baseline metrics for future comparison

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://github.com/grafana/k6-examples)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/api-load-testing/)
