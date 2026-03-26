# Monitoring Stack

The monitoring stack uses Prometheus, Grafana, Node Exporter, and Alertmanager to observe the Based backend.

## Quick Start

```bash
cd monitoring
docker compose up -d
```

Services:

| Service | URL | Notes |
|---------|-----|-------|
| Prometheus | http://localhost:9090 | Scrapes `/metrics` exposed by backend |
| Grafana | http://localhost:3001 | Login with `admin/changeme` (configure via `GRAFANA_ADMIN_PASSWORD`) |
| Alertmanager | http://localhost:9093 | Routes alerts to email/Slack/etc |

Ensure environment variables (e.g., `ALERTMANAGER_SMTP_PASSWORD`) are supplied when starting the stack.

## Backend Integration

The backend exposes `/metrics` (Prometheus format) with the following key metrics:

- `based_http_requests_total`
- `based_http_request_duration_seconds`
- `based_settlement_executions_total`
- `based_settlement_batch_request`
- `based_claim_ticket_build_total`
- `based_market_resolution_total`
- `based_sui_indexer_polls_total`
- `based_sui_events_processed_total`
- `process_*` and `nodejs_*` metrics (from `prom-client` default collectors)

> ℹ️ The latest metrics extend Sui coverage: settlement batches, market resolution outcomes, and indexer poll throughput. After deploying the updated backend, import the refreshed **Backend Overview** dashboard (see below) and confirm Prometheus is scraping the backend job so the panels populate.

Add the backend target in `prometheus/prometheus.yml` if the API is running on a non-default host.

## Dashboards

Dashboards reside in `grafana/dashboards`. Grafana is configured to auto-provision dashboards from this directory on startup. Modify or add new panels, then export the JSON back to this folder.

- `backend-overview.json` now includes:
  - Settlement queue execution rate (success vs failure)
  - Settlement batch sizes (p50/p95)
  - Claim ticket transaction build throughput
  - Market resolution outcomes by chain (success vs failure)
  - Sui event indexer poll success rate and processed event counts

After deploying the updated backend, open Grafana → *Dashboards → Manage → Backend Overview* and confirm the new panels display data.

## Alerts

Alert rules live in `prometheus/alerts.yml`. Typical rules included:

- High request latency (p95 > 500 ms)
- Burst of HTTP 5xx responses
- Backend metric exporter down

New alerts were added for settlement health:

- `SettlementExecutionsFailing` – triggers when failed settlement executions exceed 1/min for 5 minutes.
- `SettlementQueueStalled` – triggers if no successful settlements are observed for 15 minutes while there are recent settlement requests.
- `MarketResolutionsFailing` – notifies when backend-driven market resolutions begin to error (per chain).
- `SuiIndexerStalled` / `SuiIndexerErrors` – highlight gaps or failures in the Sui event indexer poll loop.

Alertmanager routes notifications via email by default. Update `alertmanager/alertmanager.yml` to match your notification channel.

## Maintenance Checklist

- Rotate Grafana admin password (`GRAFANA_ADMIN_PASSWORD`)
- Configure SMTP / Slack secrets via `.env` or Docker secrets
- Backup `prometheus-data` and `grafana-data` volumes periodically
- Run `docker compose pull` monthly to keep images patched
