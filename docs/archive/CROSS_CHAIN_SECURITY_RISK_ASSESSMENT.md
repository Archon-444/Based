# Cross-Chain Security Risk Assessment & Mitigation Strategy

## Executive Summary
- Multichain rollout requires strict chain-context validation across identity, data indexing, and business logic; current safeguards are partial and leave room for privilege escalation and event spoofing.
- Highest impact threats stem from chain-agnostic admin checks and shared payout logic that ignore divergent fee models, enabling unauthorized actions or user-facing financial mismatches.
- Indexer pipeline lacks cryptographic assurances that retrieved data belongs to the target chain, creating a pathway for cross-chain replay attacks unless chain IDs and uniqueness constraints are enforced.
- Wallet sessions persist when switching chains in the dApp, encouraging users to submit transactions with incompatible wallets—a usability issue that can translate into security exposure and support risk.
- A phased remediation plan prioritizes chain ID verification and business-logic branching (Phase 1), followed by per-chain authorization controls and wallet hygiene (Phase 2), then monitoring and governance hardening (Phase 3).

## Architecture Snapshot
- **Chains in scope:** Aptos (active), Sui (in progress), Movement (planned); contracts expose similar prediction-market primitives but with divergent operational parameters.
- **Backend:** Node/Express services backed by Prisma ORM and PostgreSQL, centralizing markets, events, and user role metadata without consistent chain scoping.
- **Frontend:** React dApp with `ChainContext` switching logic and multi-wallet adapters; chain changes do not invalidate incompatible sessions.
- **Indexing:** Dedicated `EventIndexer` class per chain responsible for ingesting on-chain events; current implementation does not authenticate chain provenance.

## Risk Matrix

| Risk Category | Severity | Likelihood | Current Mitigation | Required Action |
|---------------|----------|------------|--------------------|-----------------|
| Cross-Chain Identity Drift | **HIGH** | Medium | Partial (chain-tagged roles) | **PRIORITY 1** |
| Chain-Specific Business Logic Drift | **CRITICAL** | High | Weak (generic services) | **PRIORITY 1** |
| Event Indexer Replay/Spoof | **CRITICAL** | Medium | Weak (no chain ID enforcement) | **PRIORITY 1** |
| Wallet Session Confusion | **HIGH** | High | None | **PRIORITY 2** |
| Governance Token Manipulation | **HIGH** | Low | None (not implemented) | **PRIORITY 2** |
| Oracle Misrouting | **MEDIUM** | Low | None (single-chain oracle) | **PRIORITY 3** |
| Treasury Separation | **MEDIUM** | Low | Not applicable yet | **PRIORITY 3** |
| API Route Confusion | **MEDIUM** | Medium | Partial (discovered bug) | **PRIORITY 2** |

---

## Detailed Risk Analysis

### 1. Cross-Chain Identity & Authorization Drift (Priority 1)
**Threat.** Role assignments recorded in `RoleChange` include chain metadata, but the canonical `User` model (`backend/prisma/schema.prisma`) stores roles as an undifferentiated string array. Backend checks typically evaluate `user.roles.includes('ADMIN')` without validating that the privilege applies to the active chain. Result: an Aptos admin can unintentionally—or maliciously—exercise powers on Sui or Movement.

**Current Exposure.**
- API handlers that trust `user.roles` without chain qualifiers (e.g., admin flows in `backend/src/services/markets.service.ts`).
- No shared service offering chain-scoped role checks.
- Chain context headers are not consistently required or validated.

**Mitigation.**
1. **Immediate:** Introduce a `ChainRole` table with composite uniqueness `(walletAddress, chain, role)` and migrate role checks to query this table; mark legacy `roles` array deprecated.
2. **Backend Enforcement:** Provide a reusable service (e.g., `backend/src/services/roleVerification.ts`) and middleware (`backend/src/middleware/chainAuth.ts`) to assert `walletAddress`, `activeChain`, and required roles before entering sensitive handlers.
3. **Frontend Hygiene:** Ensure every API request carries `X-Active-Chain` and `X-Wallet-Address` headers; block UI actions when wallets lack per-chain authorization.

**Testing & Monitoring.**
- Unit tests for `hasRoleOnChain` and migration scripts.
- Integration tests verifying chain-specific routers reject mismatched roles.
- Alert on repeated 403 responses indicating attempted cross-chain escalation.

### 2. Chain-Specific Business Logic Drift (Priority 1)
**Threat.** Market payout logic in `backend/src/services/markets.service.ts` calculates odds, liquidity, and fees without branching on `market.chain`. As fee schedules or LMSR parameters diverge by chain, users receive incorrect quotes or settlements, damaging trust and potentially creating arbitrage.

**Mitigation.**
1. **Config Registry:** Add `backend/src/config/chainConfig.ts` describing per-chain fee structure, liquidity parameters, bet limits, and RPC endpoints.
2. **Service Refactor:** Extract payout calculations to `backend/src/services/payout.service.ts`, injecting the chain config and ensuring fee + LMSR parameters respect the originating chain.
3. **Validation Hooks:** Enforce bet limits per chain prior to accepting transactions; surface chain-specific fee breakdowns to the frontend.

**Testing & Monitoring.**
- Unit coverage for payout differences (e.g., Aptos 1.5% vs Sui 2.0% trading fee).
- Snapshot tests for API responses to ensure chain field influences logic.
- Metrics comparing on-chain settlements with projected payouts to detect drift.

### 3. Event Indexer Replay / Spoof (Priority 1)
**Threat.** The Aptos indexer (`backend/src/services/eventIndexer.ts`) instantiates an RPC client but never verifies the connected chain ID. A compromised node could replay Aptos events into the Sui pipeline, seeding the database with phantom markets or duplicated transactions.

**Mitigation.**
1. **Chain ID Verification:** On startup, invoke ledger info APIs (Aptos: `getLedgerInfo`, Sui: chain identifier) and abort if IDs mismatch a curated constant map.
2. **Database Constraints:** Amend `BlockchainEvent` model to enforce `@@unique([chain, transactionHash, sequenceNumber])`, preventing cross-chain duplicates.
3. **Runtime Guards:** Require successful `verifyChainId()` before polling; block processing if verification state is missing.
4. **Health Monitoring:** Implement `ChainHealthMonitor` to detect anomalous event rates, cross-chain hash duplicates, and log alerts when thresholds break.

**Testing & Monitoring.**
- Integration tests that mock an incorrect chain ID response and assert the indexer stops.
- Database migration tests covering uniqueness enforcement.
- Observability dashboards tracking chain verification timestamps and failure counts.

### 4. Wallet Session Confusion (Priority 2)
**Threat.** The React `ChainContext` allows switching between Aptos and Sui without disconnecting incompatible wallets, leaving Petra session data active on a Sui view. Users may attempt to sign Sui transactions with Aptos wallets, generating friction and potential phishing confusion.

**Mitigation.**
1. **Chain-Aware Switching:** Update `ChainContext` to detect existing wallet connections, prompt users, and disconnect incompatible sessions before applying the new chain.
2. **Global Guard:** Introduce `WalletCompatibilityGuard` UI overlay to warn when wallet chain and active chain diverge, offering a one-click disconnect.
3. **Secure Transaction Hook:** Provide `useSecureTransaction` to enforce compatibility checks before invoking SDK calls, centralizing wallet-chain validation.

**Testing & Monitoring.**
- UI e2e tests verifying chain switch prompts and wallet disconnections.
- Analytics on guard warnings to measure frequency of mismatches.
- Error tracking for blocked transactions due to wallet-chain mismatch.

### 5. Governance Token Manipulation (Priority 2)
**Threat.** Governance token and DAO mechanics are not yet deployed; without guardrails, cross-chain vote aggregation or admin functions could be abused (e.g., address re-use across chains or replay of governance proposals).

**Mitigation.**
- Design per-chain vote registries tied to unique resource identifiers.
- Require quorum calculations that consider chain weight separately before aggregation.
- Implement on-chain proof logging (transaction hashes) when writing governance actions to the database.

**Pre-Launch Checklist.**
- Threat modeling session dedicated to DAO interactions.
- Simulation tests covering Sybil and whale mitigation strategies.
- Monitoring for anomalous vote concentrations across chains.

### 6. Oracle Misrouting (Priority 3)
**Threat.** Oracle adapters presently serve a single chain. If extended to Sui/Movement without explicit routing, the backend might request the wrong oracle endpoint, producing stale or incorrect price feeds.

**Mitigation.**
- Extend chain config to include oracle endpoints and enforce selection based on `market.chain`.
- Add signature validation or attestation metadata per oracle response.
- Integrate fallback/consensus logic so cross-chain expansions require explicit onboarding steps.

**Testing.**
- Contract or integration tests verifying oracle IDs align with the requested chain.
- Chaos experiments that simulate wrong-endpoint responses and ensure they are rejected.

### 7. Treasury Separation (Priority 3)
**Threat.** Treasury operations are slated for future phases. Without early design discipline, multi-chain treasuries could share keys or addresses, risking loss if chains are confused.

**Mitigation.**
- Define treasury custody model per chain (separate multi-sig, clear accounting).
- Document fund flow and reconciliation requirements before treasury code lands.
- Prepare monitoring dashboards to track balances per chain.

### 8. API Route Confusion (Priority 2)
**Threat.** Previously discovered bugs (e.g., chain-neutral `/markets/:id` routes) demonstrate that API layers can drop chain context, returning or mutating resources on the wrong chain.

**Mitigation.**
- Require `chain` parameter or header on every multichain route and validate against resource ownership.
- Adopt middleware (`validateChainContext`) to enforce active-chain alignment with route parameters.
- Contract tests ensuring chain mismatch requests return 400/403 as appropriate.

---

## Implementation Roadmap

| Phase | Timeline | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| **Phase 1** | Week 1–2 | Chain authenticity & business logic | Chain ID verification in indexers; `chainConfig` registry; payout service refactor; DB uniqueness migration |
| **Phase 2** | Week 2–3 | Authorization & wallet hygiene | `ChainRole` schema + migration; chain-aware auth middleware; wallet compatibility guard; secure transaction hook |
| **Phase 3** | Week 3–4 | Monitoring & governance hardening | Chain health monitor; anomaly alerts; governance token security design; oracle routing validations |

Dependencies: Phase 2 migrations depend on Phase 1 chain metadata (e.g., consistent `market.chain`). Health monitoring utilizes telemetry introduced during earlier phases.

---

## Testing & Validation Checklist
- **Unit:** chain config lookup, payout fee calculations per chain, `hasRoleOnChain` behavior, indexer chain ID validator.
- **Integration:** API rejects mismatched chain headers; payout endpoints return chain-specific fee breakdown; wallet guard disconnects incompatible sessions.
- **E2E:** Aptos admin blocked from resolving Sui market; cross-chain event replay attempt rejected; frontend shows distinct fees after chain switch.
- **Security:** Adversarial tests for chain ID spoofing, oracle misrouting, governance privilege escalation simulations.

---

## Monitoring & Telemetry
- **Indexer Health:** Verification success flag, event throughput per chain, number of duplicate transaction hashes rejected.
- **Authorization Metrics:** Count of denied actions by chain/role, time since last on-chain-to-DB role sync, suspicious surge in privilege elevation requests.
- **Wallet UX:** Frequency of wallet-chain mismatch warnings, transaction failures due to compatibility guard, chain switch counts per session.
- **Business Logic:** Fee discrepancy alerts between projected and realized payouts, bet-limit violation attempts, oracle response freshness per chain.

---

## Residual Risks & Assumptions
- Assumes smart contracts enforce role separation on-chain; backend must remain in sync via scheduled role synchronization jobs.
- Relies on environment variables for RPC endpoints and module addresses; missing or misconfigured values will degrade new safeguards.
- Movement chain parameters remain placeholders; full risk assessment must be revisited once Move contracts and infrastructure are finalized.
- Governance token features are scoped for future phases; security posture must be re-evaluated prior to launch.

---

## References
1. `DATA_STORAGE_GUIDE.md` – existing data model overview and role tracking context.  
2. `COMPREHENSIVE_DEEP_DIVE_ANALYSIS.md` – prior findings on wallet session handling and chain switch UX.  
3. Sui and Aptos address similarity risks — aInvest (2025).  
4. Binance Square: Sui/Aptos key incompatibility guidance (2024).  
5. Turnkey: Cross-chain technology and wallet security risks (2025).  
6. Conduit: Blockchain indexers explained (2024).  
7. Academic and industry analyses on DAO governance manipulation and double-spend defenses (Frontiers in Blockchain 2024; Gate.com 2025).  

