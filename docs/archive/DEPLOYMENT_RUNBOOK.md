# Deployment Runbook – Move Market

This runbook describes the steps to deploy the Move Market to staging and production environments.

## 1. Prerequisites

- GitHub Actions pipeline green on the release branch.
- Smart contracts compiled and tests passing (`aptos move test`).
- Backend integration tests passing (`npm run test`).
- Monitoring stack (Prometheus/Grafana) deployed and reachable.
- Secrets stored in your secret manager (Aptos private keys, database URL, SMTP, Grafana admin password).

## 2. Release Branch Management

```bash
git checkout main
git pull origin main
git checkout -b release/vX.Y.Z
```

- Update version numbers in `package.json`, `Move.toml`, and `PROJECT_STATUS.md`.
- Run `npm run build` in both `backend` and `dapp`.
- Commit and push the release branch. Open a release PR.
- Ensure code freeze once approval workflow begins.

## 3. Smart Contract Deployment (Aptos)

1. Set environment variables:
   ```bash
   export APTOS_PROFILE=production
   export APTOS_USDC_ADDRESS=<circle_usdc_address>
   export CIRCLE_USDC_ADDRESS=<circle_usdc_address>   # matches native USDC coin type
   ```
2. Publish updated modules:
   ```bash
   cd contracts
   # Override the circle named address with the native USDC deployment for your target network
   aptos move publish \
     --profile $APTOS_PROFILE \
     --named-addresses circle=$CIRCLE_USDC_ADDRESS \
     --included-artifacts none
   ```
3. Run post-deploy scripts (`scripts/deploy-usdc.sh` or custom).
4. Verify state:
   - `aptos account list --profile production`
   - `aptos move view --function <module>::market_manager::get_market_count`
5. Record transaction hash in the release notes.

## 4. Backend Deployment

### 4.1 Build & Push Docker Image
```bash
cd backend
docker build -t registry.example.com/movemarket/backend:X.Y.Z .
docker push registry.example.com/movemarket/backend:X.Y.Z
```

### 4.2 Database Migration
```bash
npm run prisma:migrate:deploy
```

### 4.3 Update Kubernetes / Docker Swarm
- Update image tag in `deployment.yaml` or Compose stack.
- Apply configuration:
  ```bash
  kubectl apply -f k8s/deployment.yaml
  kubectl rollout status deployment/movemarket-backend
  ```
- Verify pods: `kubectl get pods -l app=movemarket-backend`.
- Tail logs during rollout: `kubectl logs -f deployment/movemarket-backend`.

### 4.4 Configuration Checklist

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Managed Postgres connection string |
| `APTOS_NETWORK` | `mainnet` |
| `APTOS_MODULE_ADDRESS` | Published module address |
| `RATE_LIMIT_*` | Use production thresholds |
| `METRICS_AUTH_TOKEN` | Random 32 byte token |
| `CORS_ORIGIN` | Production domains |

## 5. Frontend Deployment

1. Build assets:
   ```bash
   cd dapp
   npm install
   npm run build
   ```
2. Upload to CDN/S3:
   ```bash
   aws s3 sync dist/ s3://movemarket-app --delete
   aws cloudfront create-invalidation --distribution-id XYZ --paths "/*"
   ```
3. Smoke test:
   - Confirm wallet connection.
   - Create a suggestion (dev environment).
   - Fetch active markets.

## 6. Post-Deployment Validation

| Check | Command |
|-------|---------|
| Health endpoint | `curl https://api.movemarket.com/health` |
| Metrics endpoint | `curl -H "x-metrics-token: <token>" https://api.movemarket.com/metrics` |
| Prometheus | Check `movemarket_http_requests_total` increasing |
| Grafana | Dashboard `Backend Overview` shows traffic |
| Load testing | `npm run loadtest:all` against staging |

## 7. Rollback Procedure

1. Revert frontend by redeploying previous build (`npm run deploy -- --tag X.Y.(Z-1)`).
2. Backend:
   ```bash
   kubectl rollout undo deployment/movemarket-backend
   ```
3. Contracts: If required, pause markets via `betting::pause` and coordinate with auditors.
4. Document incident in `INCIDENT_RESPONSE_RUNBOOK.md`.

## 8. Communication

- Notify stakeholders in `#release-announcements`.
- Update status page with "Deployment in progress".
- After validation, move ticket to "Released".

## 9. Artifacts to Archive

- Build logs (CI).
- Contract publish transaction IDs.
- Load test reports.
- Monitoring screenshots (latency/requests).

## 10. Appendix

- `MONITORING/README.md` for observability stack.
- `AUDIT_PACKAGE.md` for security references.
- `USDC_INTEGRATION.md` for token swap checklist.
