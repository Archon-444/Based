# Sui Integration Parity Status – October 2025

This summary captures the current readiness of the Sui implementation relative to the Aptos stack. It aggregates the work logged in `SUI_PARITY_PROGRESS.md` and highlights remaining tasks before the audit rerun.

## Phase 1 – Core On-Chain Parity

✅ **Treasury Reentrancy Guard**  
- Added `reentrancy_guard` and `E_REENTRANCY` to `global_treasury`.  
- Wrapped `record_claim` / `redeem_claim` in guard checks.

✅ **RBAC Enforcement & Pause Controls**  
- `market_manager_v2::create_market`, `resolve_market`, `pause_market`, and `unpause_market` now require role checks via `RoleRegistry`.  
- Settlement queue operations respect the `paused` flag.

✅ **Oracle Snapshot Requirements**  
- `resolve_market` consumes an aggregated oracle snapshot (validated via `oracle_validator::require_fresh_aggregate`).  
- Backend `marketResolver` forwards latest oracle data (from Pyth) to the Sui client.  
- Frontend/backend env configs now manage `SUI_ORACLE_REGISTRY_ID` / `VITE_SUI_ORACLE_REGISTRY_ID`.

⚠️ **Remaining Phase 1 Work**  
- Multi-source aggregation in Move (`aggregate_prices`) still assumes a pre-validated snapshot from off-chain; consider wiring the full on-chain median path once multiple feeds are available.  
- Complete pause/resume guards in any remaining entry functions (`execute_settlements` queue drain) and ensure oracle circuit breaker states are observable.  
- Add Move Prover specs for new invariants (treasury guard, oracle validation).

## Phase 2 – Backend Services

✅ **Sui Event Indexer**  
- Dedicated poller persists `MarketCreated` events and shares lifecycle with the Aptos indexer.  
- Bootstrap flow reuses the existing queue/market lookups to populate Prisma metadata.

✅ **Resolver Automation (Snapshot-Aware)**  
- Backend resolver scheduler now forwards flattened oracle aggregates (value/source/timestamp/verified) to Sui.  
- Added `movemarket_market_resolution_total` metric to monitor per-chain resolution outcomes.

✅ **Role Synchronization Endpoint**  
- `POST /roles/sync` refreshes DB state from on-chain registries (Aptos view functions or Sui dynamic fields).  
- Frontend/Admin tooling consumes the endpoint to keep RBAC state aligned.

⚠️ **Remaining Phase 2 Items**  
- Full resolver scheduling policy (batching/prioritisation) still mirrors the Aptos defaults; may need chain-specific tuning once live traffic appears.

## Phase 3 – Frontend Parity (Upcoming)

✅ **Admin Tools Surface Sui Roles**  
- Admin Roles page now respects the active chain, calls the backend role-sync endpoint, and renders canonical RBAC names.  
- Added sync button plus guidance banner to make Sui role management explicit.

✅ **Markets View Chain Awareness**  
- Markets list highlights the active chain and includes guidance for Sui indexer latency.  
- Sui-specific adapters hydrate markets from shared bootstrap cache.

⚠️ **Remaining Phase 3 Items**  
- Wire resolver scheduling controls into the UI (cron management, manual retry).  
- Expand E2E coverage for Sui bet/settle flows once wallet hooks are finalised.

## Phase 4 – Observability & Ops

✅ **Sui Metrics Instrumentation**  
- Prometheus now tracks `movemarket_sui_indexer_polls_total` and `movemarket_sui_events_processed_total`.  
- Grafana backend dashboard gains panels for Sui indexer throughput and resolution success rates.  
- New alerts monitor stalled indexer loops and failing resolution transactions.

⚠️ **Remaining Phase 4 Items**  
- Runbook updates & alert routing for Sui metrics.  
- CI step to execute Sui integration tests (mock localnet) still pending.

## Readiness Snapshot

| Area | Status | Notes |
|------|--------|-------|
| Move modules | ⚙️ Hardening in progress | Treasury guard, RBAC, oracle snapshot done; initial Move Prover specs added. Multi-source aggregation still documented |
| Backend resolver/eventing | ✅ Core services online | Oracle snapshots flow through scheduler, Sui event indexer live, RBAC sync endpoint shipped |
| Frontend | ⚙️ Partial | Chain-aware admin tooling and markets UX live; resolver UI & Sui E2E tests remain |
| Docs/tests | ⚙️ Tracking | Progress log maintained; monitoring docs & alerts refreshed. Test harness updates next |

Once the remaining Phase 1 items are closed (oracle aggregation, settlement pause guards, specs) we will proceed with the audit rerun prep, including a refreshed status section in `DUAL_CHAIN_GAP_CHECKLIST.md`.
