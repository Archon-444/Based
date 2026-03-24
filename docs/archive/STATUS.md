# Move Market – Current Status

**Last Updated:** May 2025  
**Status:** 🟡 In Development (Aptos & Sui MVP ≈ 40–60% complete)  
**Launch Outlook:** 6+ months of focused work (security, USDC, audits) before mainnet is viable

---

## Summary

The Move Market codebase supports both Aptos and Sui, but neither chain is production ready. Contract safety mechanisms, USDC integration, oracle wiring, and backend parity are incomplete. Previous documentation overstated readiness (~85%); the latest audit reset expectations to ~50% complete.

- **What works:** Dual-chain wallet UI, basic market/bet flows, MoveMarketSDK for Aptos, drafted ops runbooks.
- **What doesn’t:** Reentrancy/atomic safeguards, USDC plumbing, oracle integration, Sui settlement queue validation, monitoring, and external audit.
- **Immediate focus:** Security hardening, USDC integration, backend parity, automated testing, and audit preparation across both chains.

Refer to [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for detailed roadmap and [`docs/DUAL_CHAIN_GAP_CHECKLIST.md`](docs/DUAL_CHAIN_GAP_CHECKLIST.md) for task-level gaps.

---

## Chain-by-Chain Snapshot

| Area | Aptos | Sui | Notes |
| --- | --- | --- | --- |
| Market lifecycle | ✅ basic flow | ⚠️ partial | Sui shared-object settlement queue untested end-to-end. |
| USDC handling | ❌ dev shim | ❌ dev shim | Decide Circle/LayerZero path, implement withdraw/deposit logic. |
| Oracle integration | ⚠️ stubs only | ❌ none | Pyth + optimistic fallback to be implemented. |
| Security guards | ⚠️ partial | ❌ missing | Need reentrancy guards, atomic resolution, RBAC, pause controls. |
| Backend support | ⚠️ mostly aptos | ❌ minimal | Chain-aware payouts, Sui object endpoints, replay protection outstanding. |
| Testing | ⚠️ unit tests | ❌ none | Integration/fuzz/load tests not started. |

---

## Critical Workstreams

1. **Security Hardening**  
   Implement reentrancy guard, atomic resolution, RBAC, and pause controls on both chains. Produce Move Prover specs.

2. **USDC Integration**  
   Replace dev coins with real Circle/LayerZero flows; ensure settlement queue logic for Sui matches Aptos behaviour.

3. **Oracle & Backend Parity**  
   Wire Pyth integration, handle fallback disputes, and ensure backend indexer/payout logic support both chains.

4. **Testing & Observability**  
   Build automated integration tests, fuzz/load suites, and deploy monitoring (Prometheus/Grafana, alerting). Run incident drills.

5. **Audit Preparation**  
   Complete the security backlog, freeze code, produce audit package, and schedule a Move-specialist audit firm.

6. **Documentation Accuracy**  
   Keep README, status docs, and marketing copy aligned with actual progress; token/governance work is explicitly deferred.

---

## Risks (High)

| Risk | Impact | Action |
| --- | --- | --- |
| Incomplete safeguards → fund loss | Critical | Prioritise guard implementation before any new features. |
| USDC path undecided | Platform unusable | Select integration approach immediately; parallelise Aptos & Sui work. |
| Oracle not wired | Markets cannot resolve | Finalise oracle strategy, integrate contracts + backend. |
| Documentation drift | Misaligned stakeholders | Weekly documentation review. |
| Premature token/governance work | Scope creep | Remain deferred until MVP secure. |

---

## Next Checkpoints

- End of Week 1: Updated backlog with owners/dates for every gap item; USDC integration plan locked.
- End of Week 4: Security hardening tasks implemented; integration tests and monitoring deployed in staging.
- Month 3–4: External audit scheduled/completed, parity across Aptos & Sui validated, testnet beta ready.

Progress will be tracked in `PROJECT_STATUS.md` and `docs/DUAL_CHAIN_GAP_CHECKLIST.md`. No new features should start until the critical gaps above are closed. 
