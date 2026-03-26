# Oracle Launch Partner Outreach Plan

**Date**: 2025-10-18  
**Owner**: Partnerships + Protocol Team  
**Objective**: Secure launch commitments from at least two independent oracle providers ahead of mainnet by showcasing the completed SDK/oracle tooling and outlining mutual value.

---

## 1. Why Partners Should Care
- **Security moat**: Multi-oracle consensus with slashing + transparent reputation trail (`submitOracleVote`, `getOracleReputation`)
- **Frictionless integration**: Stake + key management handled by `registerOracle` and automatic nonce/signature helpers in the SDK
- **Revenue share**: Shared protocol fees + BRO staking incentives for early oracle operators
- **Marketing halo**: Co-announcements across Based + partner channels; inclusion in Polymarket-competitive narrative

---

## 2. Target Partner Matrix
| Partner | Primary Contact | Value Proposition | Current Status | Next Step |
|---------|----------------|-------------------|----------------|-----------|
| **Chainlink** | ecosystems@chain.link | Showcase Aptos speed + micro-market demand | Warm intro requested via Aptos BD | Prep tailored deck slide + schedule call (Owner: Philippe) |
| **Pyth Network** | partnerships@pyth.network | Native Aptos support + price feeds | Awaiting follow-up from Aptos Summit | Send SDK demo snippet + request integration workshop (Owner: Mira) |
| **Band Protocol** | bd@bandprotocol.com | DeFi specialization + cross-chain expertise | Cold outreach required | Send intro email + attach one-pager (Owner: Andre) |
| **API3** | partnerships@api3.org | First-party oracles for crypto data | Exploring Move ecosystem | Invite to technical deep dive session (Owner: Mira) |
| **Custom Validators** | Aptos validator guild | Expand quorum, fast dispute coverage | List of 5 validators identified | Schedule roundtable on Oct-28 (Owner: Partnerships) |

---

## 3. Enablement Package
1. **SDK Playbook** (`sdk/src/client.ts`)
   - `registerOracle` – stake + public key bootstrap with 32-byte validation
   - `submitOracleVote` – handles nonce discovery, message serialization, Ed25519 signature, and transaction submission
   - `getOracleReputation` – exposes live reputation, stake, and nonce for dashboards
2. **Developer Ops**
   - Updated pause/admin helpers (`isSystemPaused`, `pauseSystem`, `unpauseSystem`) for incident response
   - Dispute tooling (`getDisputeStatus`, `createDispute`, `voteOnDispute`) for oracle-backed arbitration
3. **Documentation**
   - Strategic overview: `STRATEGIC_REVIEW_AND_NEXT_FEATURES.md`
   - Oracle narrative + market comparison: `POLYMARKET_KILLER_SUMMARY.md`
   - Technical spec: `MULTI_ORACLE_SYSTEM.md`

---

## 4. Outreach Timeline
| Week | Milestone | Owner |
|------|-----------|-------|
| Week 0 (Oct 21) | Circulate one-pager & SDK snippet to all targets | Partnerships |
| Week 1 | Host technical walkthrough (30 mins) with Pyth + Chainlink | Engineering Lead |
| Week 2 | Agree on integration checklist (stake amounts, alerting, KPI) | Joint taskforce |
| Week 3 | Confirm launch-day commitments + joint announcement draft | Marketing |

---

## 5. Communications Templates
**Intro Email Snippet**
```
Subject: Launching Based with <Partner> as founding oracle

Hi <Name>,

We just shipped full end-to-end oracle tooling for Based on Aptos—
including stake onboarding, automated nonce/signature handling, and real-time reputation APIs.

We’d love to feature <Partner> as a launch oracle. Quick 30-minute sync next week?

Best,
<Your Name>
```

**Call Agenda (30 min)**
1. 5 min – Context: Polymarket weakness, Based security moat
2. 10 min – Live demo: `registerOracle` + `submitOracleVote` flow
3. 10 min – Incentives + co-marketing opportunities
4. 5 min – Next steps, technical contact exchange

---

## 6. KPIs & Tracking
- **Commitment goal**: ≥2 external oracles signed LOIs by Week 3
- **Technical readiness**: Partners confirm ability to run staking + vote script with SDK
- **Marketing**: At least one co-branded announcement scheduled before mainnet

---

## 7. Open Items
- Draft lightweight partnership LOI template (Legal, due Oct 25)
- Stand up oracle dashboard wireframe (Product, due Oct 30)
- Prepare FAQ on staking requirements + slashing (Engineering, due Oct 22)
