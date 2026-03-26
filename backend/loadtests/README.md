# Backend Load Testing

This directory contains scripted load tests for the Based backend.  
The scenarios target the `suggestions` API to validate baseline throughput and confirm that
rate limiting behaves correctly when subjected to bursts of traffic.

## Prerequisites

- Node.js 20+
- Backend service running locally (`npm run dev` or `npm run start`)
- A development wallet address enabled via the `x-dev-wallet-address` bypass header

Install dependencies from the backend root:

```bash
cd backend
npm install
```

## Environment Configuration

Load tests read configuration from environment variables (see `loadtest.config.ts`):

| Variable | Description | Default |
|----------|-------------|---------|
| `LOADTEST_BASE_URL` | Base URL for the API | `http://localhost:3000` |
| `LOADTEST_CONNECTIONS` | Concurrent connections | `50` |
| `LOADTEST_DURATION` | Duration in seconds | `60` |
| `LOADTEST_WARMUP` | Warm-up time in seconds | `10` |
| `LOADTEST_SUBMITTER_ADDRESS` | Wallet used for suggestions | random dev address |
| `LOADTEST_ADMIN_ADDRESS` | Admin wallet (for future scenarios) | random dev address |
| `LOADTEST_WALLET_HEADER` | Value for `x-dev-wallet-address` | submitter address |

Example `.env.loadtest`:

```bash
LOADTEST_BASE_URL=http://localhost:3000
LOADTEST_CONNECTIONS=100
LOADTEST_DURATION=120
LOADTEST_WARMUP=15
LOADTEST_SUBMITTER_ADDRESS=0xabc123...
```

Execute commands with:

```bash
LOADTEST_BASE_URL=http://localhost:3000 npm run loadtest:suggestions
```

## Available Scenarios

### Suggestions Throughput
```
npm run loadtest:suggestions
```
- Loads both `GET /api/suggestions` and `POST /api/suggestions`
- Measures request throughput, latency percentiles, and rate-limit hits

### Rate Limiting Verification
```
npm run loadtest:ratelimit
```
- Hammers `POST /api/suggestions` to intentionally trigger rate limiting
- Reports `429` vs. `5xx` response counts to ensure graceful throttling

## Adding New Scenarios

1. Create a `*.loadtest.ts` script (reuse helper functions from `loadtest.config.ts`)
2. Add an npm script in `package.json`
3. Document the scenario in this README

## Reporting

Each script prints a textual summary. For CI-friendly output, redirect stdout to a file:

```bash
npm run loadtest:suggestions > loadtest-report.txt
```

The reports can be attached to monitoring dashboards or PR comments to track performance over time.
