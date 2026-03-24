# Security Audit Firms Shortlist

This document captures the information required to engage an external Move security auditor for the Move Market.

## 1. Recommended Partners

| Firm | Primary Contact | Expertise | Notes |
|------|----------------|-----------|-------|
| **OtterSec** | hello@ottersec.com | Aptos, Move, Solana, Rust | Deep experience with Aptos core stack, published reports on Econia and Aries. |
| **MoveBit** | engagement@movebit.xyz | Move (Aptos & Sui), tooling authors | Maintainers of Move Prover workshops, currently preferred by Wormhole Foundation. |
| Zellic | contact@zellic.io | Cross-chain, Move, Rust | Premium pricing but strong research focus; good for follow-up review. |
| Trail of Bits | audit@trailofbits.com | Formal verification, Rust, Python | Consider if a second opinion is required pre-mainnet. |

## 2. Engagement Timeline

| Week | Milestone | Owner |
|------|-----------|-------|
| Week 0 | Finalise shortlist, send RFQs | Security lead |
| Week 1 | Receive quotes & tentative start dates | PM |
| Week 2 | Execute MSA & audit agreement | Legal |
| Week 3 | Kick-off audit (code freeze) | Engineering |
| Week 6 | Draft report & remediation | Auditor / Eng |
| Week 7 | Re-test fixes | Auditor |

## 3. Information to Send with Quote Request

When emailing, include:

- Project overview (one paragraph).
- Codebase links (GitHub repository & commit hash for audit branch).
- Scope summary (smart contracts, backend, infra).
- Lines of code estimate: ~5,400 Move LOC, 3,800 backend LOC.
- Desired timeline: mid/late Q1 2025 (flexible +/- two weeks).
- Contact persons: engineering lead + security lead.

## 4. Selection Criteria

1. **Move expertise** — demonstrable Aptos mainnet audits.
2. **Availability** — ability to start within 4 weeks.
3. **Depth of tooling** — static analysis, fuzzing, formal methods.
4. **Reporting quality** — actionable findings, severity classification.
5. **Cost** — budget target \$35k–\$55k for primary audit.

## 5. Action Items

- [ ] Send RFQs to OtterSec & MoveBit.
- [ ] Schedule introductory call this week.
- [ ] Prepare NDA templates if auditors require.
- [ ] Consolidate quotes + timelines in `AUDIT_PACKAGE.md`.
