# Move Market – Audit Package

This package contains the artefacts and context required for an external security audit.

## 1. Repository & Code Freeze

- **GitHub:** [link to internal repo] (provide access to auditors)
- **Audit Branch:** `audit/v1` (freeze commits once scope agreed)
- **Commit Hash:** _TBD when code freeze occurs_

```
git checkout -b audit/v1 main
git push origin audit/v1
```

## 2. Scope Overview

| Layer | Included? | Notes |
|-------|-----------|-------|
| Move smart contracts (Aptos) | ✅ | Modules in `contracts/sources` – focus on `market_manager`, `betting`, `collateral_vault`, `oracle`, `multi_oracle`, `amm_lmsr`. |
| Move smart contracts (Sui) | ⚠️ Optional | Located in `contracts-sui/`; currently deferred unless extending scope. |
| Backend (Node/Express) | ✅ | Authentication, rate limiting, market ingestion logic. |
| Frontend (React) | ✅ (light) | Review wallet signature flows, API integration. |
| Infrastructure (monitoring, deployment) | ✅ | Docker, Prometheus/Grafana, incident response. |
| Dev tooling / scripts | ✅ | Load testing scripts, deployment automation, runbooks. |

## 3. Architectural Summary

```
[React/Vite dApp] --(REST + wallet headers)--> [Express API]
   |                                              |
   |                                  [Prisma/PostgreSQL]
   v                                              |
[Wallet Adapter / SDK]               [ChainRouter (Aptos/Sui)]
   |                                              |
   |                              [Aptos Move modules (5,421 LOC)]
   v                                              |
[Aptos Blockchain] <----- Oracles (Pyth/Multi-Oracle) ---->
```

Key properties:
- Non-custodial: users hold keys; collateral stored in `collateral_vault`.
- Automated market making (LMSR) with dynamic odds.
- Oracle aggregation with dispute resolution & commit/reveal.
- USDC currently mocked in dev; production integration tracked separately.

## 4. Threat Model & Assumptions

| ID | Assumption | Notes |
|----|------------|-------|
| TM-1 | Users sign transactions client-side | Wallet signature bypass (`x-dev-wallet-address`) only enabled in development. |
| TM-2 | Auditor has full read access to repo & history | Sensitive secrets excluded by `.gitignore`. |
| TM-3 | Backend operates behind load balancer with TLS termination | Rate limiting enforced per wallet/IP. |
| TM-4 | USDC contract will be swapped for Circle mainnet deployment pre-launch | See `USDC_INTEGRATION.md` for plan. |

Known out-of-scope items:
- Formal verification of Move modules (planned post-audit).
- Sui deployment (targeted for later release).

## 5. Recent Changes (Audit Changelog)

- ✅ Frontend now consumes live API (no localStorage mocks).
- ✅ Move test suite: all 32 scenarios passing (53% → 100%).
- ✅ Rate limiting + Prometheus metrics live.
- 🔄 Native USDC integration pending (dev shim active).
- 🔄 Audit runbooks and monitoring dashboards drafted (see docs).

## 6. Supporting Artefacts

| Document | Description |
|----------|-------------|
| `AUDIT_FIRMS.md` | Contact & selection criteria. |
| `monitoring/docker-compose.yml` | Prometheus/Grafana stack. |
| `DEPLOYMENT_RUNBOOK.md` | Step-by-step deployment procedure. |
| `INCIDENT_RESPONSE_RUNBOOK.md` | Incident handling checklist. |
| `docs/USDC_INTEGRATION.md` | Plan to swap dev token for native USDC. |
| `docs/analysis/GAP_ANALYSIS.md` | Current production readiness assessment. |
| `PROJECT_STATUS.md` | High-level status report (updated). |

## 7. Audit Logistics

- **Primary contact:** _Name / email / Telegram handle_
- **Availability:** Provide core engineer coverage during audit window.
- **Communication channel:** Shared Slack or Matrix room with auditor.
- **Bug bounty:** Not yet launched; planned after mainnet.
- **Remediation window:** 1 week for critical/high, 2 weeks for medium, 4 weeks for low.

## 8. Deliverables Requested from Auditor

1. Executive summary (severity breakdown, timeline).
2. Detailed findings with reproduction steps.
3. Suggested fixes or references.
4. Retest confirmation.
5. Optional: formal verification recommendations.

## 9. Post-Audit Checklist

- [ ] Triage findings, assign owners in Linear/Jira.
- [ ] Address critical/high findings before mainnet.
- [ ] Publish public-facing audit report summary.
- [ ] Schedule follow-up audit (if necessary).
- [ ] Update documentation to reflect fixes.

## 10. Pricing Expectations

| Scope | Estimated Duration | Budget |
|-------|--------------------|--------|
| Primary Move audit (Aptos contracts) | 3 weeks | \$35k–\$45k |
| Backend + infrastructure review | 1 week (overlap) | \$10k–\$15k |
| Re-test | 3–5 days | Included / \$5k |

These figures are based on quotes received for comparable Aptos DeFi projects in 2024.

---

**Prepared by:** _Security Lead_  
**Last updated:** 2025-01-20  
For edits, update this file and notify the audit contact group.
