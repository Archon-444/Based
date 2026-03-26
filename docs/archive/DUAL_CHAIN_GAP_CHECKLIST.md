# Move Market Dual-Chain Gap Checklist

Status: May 2025  
Owner: Core engineering (contracts + backend + dApp)

This checklist captures the remaining delta between the Aptos and Sui implementations so we can deliver a feature-complete dual-chain MVP. Items are grouped by track; each entry should have an owner and target date once work begins.

---

## 1. Smart Contracts

| Item | Aptos | Sui | Notes |
| --- | --- | --- | --- |
| Reentrancy guards on entry points | **In progress** – partial coverage | ⚙️ Treasury guarded, rest pending | Extend guards to remaining entry points (`execute_settlements`, etc.). |
| Atomic market resolution | **Not implemented** | **Not implemented** | Ensure outcome write + funds transfer happen in one transaction (shared object queue on Sui). |
| Native USDC integration | ⚙️ Testnet coin wired (Circle) | ⚙️ Testnet coin wired (Circle) | Contracts updated to Coin<USDC>; backend/env need deposit/withdraw guardrails + mainnet rollout. |
| Oracle integration (Pyth + fallback) | **Stubs only** | ⚙️ Snapshot enforced | Move requires aggregated snapshot; multi-source + fallback logic outstanding. |
| RBAC / pause controls | **Hard-coded admin** | ⚙️ Role registry enforced | Additional pause guards / resolver automation in progress. |
| Settlement queue (Sui) | N/A | **Needs end-to-end testing** | Validate sharded pools + queue drain logic. |
| Formal specs & Move Prover | **Drafted** | **Not started** | Produce invariants + run prover jobs for both packages. |

## 2. Backend & Indexer

| Item | Status | Notes |
| --- | --- | --- |
| Chain-aware payout service | ⚠️ Partial | Ensure fees, odds, and limits respect chain config. |
| Sui market object API (`/api/markets/sui/objects/:id`) | ⚠️ Partial | Verify caching, error handling, and hydration in dApp. |
| Indexer replay protection | ❌ Missing for Sui | Needs chain ID verification + unique constraints. |
| Role/RBAC endpoints | ✅ Complete | `/roles/sync` added; backend fetches Sui dynamic fields & Aptos view functions. |
| Monitoring/metrics | ⚙️ In progress | Prom stack defined with Sui indexer/resolution metrics; production deployment pending. |

## 3. Frontend (dApp)

| Item | Status | Notes |
| --- | --- | --- |
| Chain switch UX | ✅ Complete | Keep verifying wallet session disconnect on mismatched chains. |
| Create market (Aptos) | ⚠️ Fails due to legacy payload | Fixed in latest patch; regression tests needed. |
| Create market (Sui) | ❌ Incomplete | Wire USDC + settlement args once backend ready. |
| Payout estimates | ⚠️ Aptos-only | Extend to Sui using backend chain-aware service. |
| Resolution/admin tools | ⚙️ Partial | Chain-aware admin UI, role sync + Sui market banners live; resolver controls/tests outstanding. |
| Error handling + toasts | ⚠️ Partial | Ensure chain-specific fallback messages. |

## 4. DevOps & Security

| Item | Status | Notes |
| --- | --- | --- |
| External audit engagement | ❌ Not scheduled | Prepare package once security issues fixed. |
| Monitoring & alerts | ⚙️ In progress | Prometheus/Grafana updated with Sui metrics & alerts; rollout validation pending. |
| Incident response drill | ❌ Not run | Tabletop exercise required pre-beta. |
| Load / fuzz testing | ❌ Not executed | Use existing tooling to test both chains. |

## 5. Documentation & Process

| Item | Status | Notes |
| --- | --- | --- |
| README / status docs | ⚙️ Updated | Progress/status docs refreshed with Phase 2 & observability work. |
| API docs (dual-chain) | ❌ Incomplete | Ensure swagger + marketing pages reflect both chains. |
| Runbooks (deploy, incident) | ⚠️ Draft | Validate through dry runs. |
| Audit prep checklist | ❌ Missing | Capture scope, code freeze policy, contact info. |

---

### Next Steps
1. Assign owners and deadlines for every ❌ / ⚠️ item.
2. Track progress in the project board (Aptos lane vs Sui lane).
3. Revisit weekly during engineering sync.

_This document should live alongside PROJECT_STATUS.md and be updated when tasks move to “done”._ 
