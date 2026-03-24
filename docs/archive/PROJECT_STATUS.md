# Move Market – Project Status

**Last Updated:** May 2025  
**Overall Status:** 🟡 ~50% complete (dual-chain MVP in progress)  
**Launch Target:** Aptos & Sui testnet beta in ~6 months (security/audit critical path)

---

## Executive Summary

Move Market remains a work-in-progress. The foundational pieces for both Aptos and Sui exist, but key safeguards, USDC plumbing, and oracle integrations are unfinished. Documentation previously claimed 80–85% readiness; the latest audit (COMPREHENSIVE_AUDIT_REPORT_OCT2025.md) recalibrates reality to roughly **40–60% completion**. The next phase is about finishing core functionality safely—not adding new scope.

### Current Highlights
- Dual wallet UX (Aptos Connect + Sui Connect) operating with chain switch and session handling.
- MoveMarketSDK.ts exposes the Aptos contract surface; analogous Sui helpers pending.
- Drafted runbooks, audit prep notes, and monitoring manifests ready for validation.
- Sui contract architecture (shared-object market shards) implemented but untested end-to-end.

### Major Gaps
1. **Security Hardening** – Reentrancy guards, atomic resolution, RBAC, and pause controls incomplete on both chains.
2. **USDC Integration** – Only dev shims exist. Real Circle/LayerZero flows must be chosen and implemented.
3. **Oracle Strategy** – Pyth integration and optimistic fallback are documented but not wired into contracts/backend.
4. **Backend Parity** – Chain-aware payouts, Sui settlement APIs, and replay protection need implementation.
5. **Testing & Observability** – Integration tests, fuzz/load testing, Prometheus deployment, and incident drills outstanding.
6. **External Audit** – No vendor engaged; code freeze + audit package prep TBD.

---

## Area Breakdown

| Area | Completion | Production Readiness | Notes |
| --- | --- | --- | --- |
| Aptos contracts | ~60% | ~35% | Betting lifecycle works locally; safety gaps + USDC missing. |
| Sui contracts | ~45% | ~25% | Shared-object pools in place; requires USDC path, queue validation, full QA. |
| Backend (Express/Prisma) | ~55% | ~30% | REST endpoints exist; chain-aware logic & RBAC incomplete. |
| Frontend (React/Vite) | ~70% | ~50% | Deployed to Vercel! Markets, betting modal, wallet UX function; create/resolve & payouts need backend parity. |
| Ops/Security | ~30% | ~15% | Draft runbooks and monitoring manifests; nothing deployed or tested. |

---

## Immediate Priorities (Phase 0–1)

1. **Align scope & documentation** – All public docs now state 40–60% completion and dual-chain goal. Token/governance deferred.
2. **Security backlog** – Implement reentrancy guards, atomic resolution, RBAC, pause controls on both chains.
3. **USDC plumbing** – Select integration path (Circle API vs bridge) and build end-to-end deposit/withdraw flows.
4. **Oracle integration** – Finalise Pyth interface and optimistic fallback; update backend indexer & contracts.
5. **Testing & Observability** – Stand up integration tests, fuzz/load framework, Prometheus/Grafana deployment.
6. **Audit preparation** – Produce final specs, test coverage evidence, and schedule professional audit once blockers cleared.

See [`docs/DUAL_CHAIN_GAP_CHECKLIST.md`](docs/DUAL_CHAIN_GAP_CHECKLIST.md) for a granular task list.

---

## Deliverables in Progress

- **Contracts:** `contracts/` (Aptos) and `contracts-sui/` (Sui) contain market manager, collateral vault, oracle, and RBAC modules. Safety checks + USDC upgrades required.
- **Backend:** `backend/` Express service with Prisma, rate limiting stubs, and chain-aware controllers. Needs payout parity, Sui object hydration, and monitoring.
- **Frontend:** `dapp/` React app deployed to Vercel with wallet adapters, market views, and betting UI. Requires create/resolve completion, payout alerts, and admin gating.
- **Docs & Ops:** Architecture notes, audit report (Oct 2025), runbooks, and monitoring manifests drafted—must be validated via real exercises.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Security guardrails incomplete | Loss of funds | Prioritise reentrancy + atomic fixes before feature work; code freeze for audit. |
| USDC integration unclear | Platform unusable | Select integration path in Week 1, assign owners, track dual-chain parity. |
| Oracle not wired | Unresolvable markets | Implement Pyth + fallback, add backend indexer validation. |
| Documentation drift | Misaligned stakeholders | Weekly review of README, Project Status, gap checklist. |
| Token/governance distraction | Scope creep | Explicitly deferred until MVP success. |

---

## Near-Term Timeline (subject to change)

| Week | Focus |
| --- | --- |
| Week 0–1 | Update docs, align scope, finalise security backlog, confirm USDC/oracle direction. |
| Week 2–4 | Implement security fixes, USDC plumbing, backend parity; start integration tests. |
| Week 5–8 | Observability deployment, load/fuzz testing, audit prep; engage external auditor. |
| Month 3–4 | Address audit findings, finish Sui parity, run combined testnet. |
| Month 5 | Invite beta users on Aptos & Sui testnets, collect feedback. |
| Month 6 | Consider mainnet launch if audit clean, metrics stable, ops ready. |

Budget guidance from audit report: **≈$250k** (audit, engineering runway, ops, legal).

---

## Reporting Cadence

- Update this file and README once per milestone or major decision.
- Maintain `docs/DUAL_CHAIN_GAP_CHECKLIST.md` weekly with owners & due dates.
- Link audit findings and remediation in `COMPREHENSIVE_AUDIT_REPORT_OCT2025.md` as they close.

Move Market can still succeed, but only with disciplined focus on security, dual-chain parity, and truthful status reporting. The next updates should demonstrate progress on the blockers above before any new scope is considered.
