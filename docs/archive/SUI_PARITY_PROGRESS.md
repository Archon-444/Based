# Sui Parity Progress Log

This log tracks the incremental work to bring the Sui implementation to feature parity with the Aptos stack. Updates are recorded as work proceeds through the parity phases.

## Phase Checklist

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| Phase 1 | Core on-chain parity (treasury guards, RBAC, oracle integration) | In progress | RBAC, pause, oracle hooks in progress |
| Phase 2 | Backend services (indexer, resolver automation, RBAC sync) | In progress | Sui event indexer running |
| Phase 3 | Frontend & UX parity | Pending | – |
| Phase 4 | Observability & Ops parity | Pending | – |

## 2025-10-26 — Phase 1 Planning

- Reviewed current Sui Move modules (`market_manager_v2`, `global_treasury`, `access_control`) to map missing safeguards.
- Identified first implementation targets:
  - Add pause checks to market creation/settlement functions where absent.
  - Implement reentrancy guard flow inside `global_treasury` (lock/unlock around `record_claim` & `redeem_claim_entry`).
  - Introduce centralized RBAC assertions (use `ResolverCap` / pause roles instead of open access).
- Next step: draft concrete task list and begin applying treasury guard updates.

## 2025-10-26 — Phase 1 Execution (Iteration 1)

- Added reentrancy guard state to `global_treasury::GlobalTreasury` along with `E_REENTRANCY` error.
- Wrapped `record_claim` and `redeem_claim` in guard checks to prevent nested ticket operations.
- Verified the Move package builds cleanly (`sui move build`).
- Next step: extend RBAC enforcement and pause checks within `market_manager_v2` entry functions.

## 2025-10-26 — Phase 1 Execution (Iteration 2)

- Integrated role registry checks into `market_manager_v2::create_market`, `resolve_market`, `pause_market`, and `unpause_market` to enforce Market Creator, Resolver, and Pauser roles.
- Updated backend Sui client, frontend SDK/hooks, and env config to supply the shared `RoleRegistry` object ID when constructing transactions.
- Ensured the Move package, backend (`npm run build && npm test -- --run`), and frontend (`npm run build`) all succeed with the new signatures.
- Added a future timestamp guard to `create_market` to reject impossible duration inputs.
- Extended settlement queue processing to respect market pause state.
- Next step: integrate oracle consensus logic into `resolve_market` and add pause hooks to any remaining flows.

## 2025-10-26 — Phase 1 Execution (Iteration 3)

- Extended `request_settlement` guard to prevent queue processing while a market is paused.
- Added oracle registry wiring to the backend + frontend so future oracle verification can run against the shared object.
- Validated the Move package (`sui move build`), backend (`npm run build && npm test -- --run`), and frontend (`npm run build`) after the signature updates.
- Introduced aggregated oracle validation utilities (`new_aggregated_price`, `require_fresh_aggregate`) and updated `resolve_market` to require a fresh oracle snapshot.
- Updated backend resolver pipeline to pass oracle snapshots through to the Sui client when resolving markets.
- Next step: finalize oracle consensus logic (e.g., multi-source aggregation) and expose resolver helpers so Sui matches Aptos resolution flows.

## 2025-10-26 — Phase 2 Execution (Iteration 1)

- Added pause guard to Sui `execute_settlements` flow for consistency with Aptos safeguards.
- Implemented `SuiEventIndexer` to poll `MarketCreated` events and reuse the existing bootstrapping logic to persist markets automatically.
- Backend now starts/stops the Sui event indexer alongside the Aptos indexer during service lifecycle.
- Authored initial Move Prover specs covering the treasury reentrancy guard, settlement pause checks, and oracle snapshot validation (`docs/SUI_MOVE_PROVER_STATUS.md`).
- Next step: extend resolver automation to consume oracle snapshots for Sui and build out the remaining role sync endpoints.

## 2025-10-26 — Phase 2 Execution (Iteration 2)

- Resolver scheduler now carries flattened oracle aggregates (price, sources, timestamp, verified) into Sui market resolutions and enforces the 5s freshness window mandated by `oracle_validator::require_fresh_aggregate`.
- Backend metrics extended with `movemarket_market_resolution_total`, `movemarket_sui_indexer_polls_total`, and `movemarket_sui_events_processed_total`; Prometheus alerts cover stalled indexer loops and resolution failures.
- Delivered `/roles/sync` endpoint plus Sui dynamic-field reader so RBAC state can be synced from either chain; Admin UI consumes the endpoint and renders canonical role names for Aptos/Sui.
- Markets page now surfaces the active chain with Sui-specific guidance; Admin role tooling includes explicit sync controls for Sui registries.
- Next step: layer resolver scheduling controls into the UI and add integration tests around Sui betting/settlement flows.
