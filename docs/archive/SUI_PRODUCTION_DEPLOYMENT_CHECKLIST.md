# Sui Production Deployment Checklist

**Last Updated:** October 21, 2025
**Status:** 🔴 NOT READY - Security testing required
**Target:** Mainnet Launch Q2 2026

---

## ⚠️ CRITICAL: DO NOT DEPLOY TO MAINNET UNTIL ALL ITEMS CHECKED

This checklist is based on:
- Move smart contract security research
- Sui-specific architectural requirements
- DeFi best practices
- Regulatory compliance standards

**Failure to complete ALL items creates unacceptable risk of fund loss, legal liability, and market failure.**

---

## Phase 1: Security Testing (Weeks 1-6)

### Move Unit Tests ✅ COMPLETE

- [x] Settlement determinism tests created ([tests/settlement_determinism_tests.move](contracts-sui/tests/settlement_determinism_tests.move))
- [x] Overflow protection tests created ([tests/overflow_protection_tests.move](contracts-sui/tests/overflow_protection_tests.move))
- [x] Oracle staleness tests created ([tests/oracle_staleness_tests.move](contracts-sui/tests/oracle_staleness_tests.move))
- [ ] **Run all tests:**
  ```bash
  cd contracts-sui
  sui move test
  ```
- [ ] **Verify 100% test pass rate**
- [ ] **Verify test coverage >95%**
  ```bash
  sui move test --coverage
  sui move coverage summary
  ```

### Load Testing 🔴 PENDING

- [ ] **Install load test dependencies:**
  ```bash
  cd contracts-sui/tests/load
  npm install
  ```
- [ ] **Deploy test market to testnet**
- [ ] **Run contention test with 100 users:**
  ```bash
  export SUI_PACKAGE_ID=<package-id>
  export TEST_MARKET_ID=<market-id>
  export CONCURRENT_USERS=100
  npm run test:contention
  ```
- [ ] **Verify P50 latency < 1000ms**
- [ ] **Verify P99 latency < 2000ms**
- [ ] **Run contention test with 1000 users:**
  ```bash
  export CONCURRENT_USERS=1000
  npm run test:contention
  ```
- [ ] **Verify 0% failed transactions**
- [ ] **Verify shard imbalance < 10x**
- [ ] **Document performance metrics**

### Formal Verification 🔴 PENDING

- [ ] **Install Move Prover:**
  ```bash
  cargo install --git https://github.com/move-language/move move-prover
  brew install z3 boogie
  ```
- [ ] **Add verification specs** (see [FORMAL_VERIFICATION.md](contracts-sui/FORMAL_VERIFICATION.md))
- [ ] **Verify market_manager_v2_secure.move:**
  ```bash
  move prove sources/market_manager_v2_secure.move
  ```
- [ ] **Verify oracle_validator.move:**
  ```bash
  move prove sources/oracle_validator.move
  ```
- [ ] **Verify access_control.move:**
  ```bash
  move prove sources/access_control.move
  ```
- [ ] **All invariants proven**
- [ ] **All pre/post-conditions verified**
- [ ] **All aborts documented**
- [ ] **Verification coverage >95%**

### External Security Audit 🔴 PENDING

- [ ] **Select auditor:** Trail of Bits, Zellic, or OpenZeppelin
- [ ] **Sign NDA and contract** ($20-30K budget)
- [ ] **Provide audit materials:**
  - [ ] All contract source code
  - [ ] Architecture documentation
  - [ ] Test suite results
  - [ ] Formal verification proofs
  - [ ] Known issues list
- [ ] **Schedule audit:** 3-4 weeks
- [ ] **Audit report received**
- [ ] **Zero critical findings** (must fix all critical/high)
- [ ] **Remediation plan for medium/low findings**
- [ ] **Re-audit after fixes** (if critical found)
- [ ] **Final audit approval received**
- [ ] **Public audit report published**

---

## Phase 2: Infrastructure (Weeks 7-10)

### Sui Network Configuration

- [ ] **Mainnet RPC node configured:**
  ```bash
  SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
  ```
- [ ] **Backup RPC nodes configured** (minimum 2)
- [ ] **RPC failover tested**
- [ ] **RPC rate limits understood**
- [ ] **RPC authentication configured** (if using private node)

### Key Management

- [ ] **Hardware wallet acquired** (Ledger or Trezor)
- [ ] **Admin private key generated on hardware wallet**
- [ ] **Private key NEVER touches disk/cloud**
- [ ] **Backup seed phrase stored in secure vault**
- [ ] **Multi-sig wallet configured** (recommended: 3-of-5)
- [ ] **Key rotation procedure documented**
- [ ] **Emergency key recovery tested**

### Database & Backend

- [ ] **PostgreSQL production database configured**
- [ ] **Database encrypted at rest**
- [ ] **Database backups automated** (daily + continuous WAL)
- [ ] **Backup restoration tested**
- [ ] **Connection pooling configured**
- [ ] **Read replicas configured** (for scaling)
- [ ] **Database monitoring active**

### Monitoring & Alerting

- [ ] **Application monitoring:** Datadog/New Relic/Grafana
- [ ] **Blockchain monitoring:** Sui Explorer webhooks
- [ ] **Error tracking:** Sentry
- [ ] **Uptime monitoring:** Pingdom/UptimeRobot
- [ ] **Alerts configured for:**
  - [ ] Contract errors
  - [ ] Unusual transaction patterns
  - [ ] Oracle failures
  - [ ] Circuit breaker triggers
  - [ ] Database issues
  - [ ] RPC node failures
- [ ] **PagerDuty/on-call rotation configured**
- [ ] **Incident response playbook created**

---

## Phase 3: Smart Contract Deployment (Weeks 11-12)

### Pre-Deployment

- [ ] **Final code freeze** (no changes after audit)
- [ ] **Git tag created:** `v1.0.0-mainnet`
- [ ] **Build artifacts reproducible:**
  ```bash
  sui move build --release
  sha256sum build/PredictionMarketSui/bytecode_modules/*.mv
  ```
- [ ] **Deployment checklist reviewed by team**
- [ ] **Go/no-go meeting held**

### Testnet Final Validation

- [ ] **Deploy to testnet one final time**
- [ ] **Create 10 test markets**
- [ ] **Execute 100+ test bets**
- [ ] **Resolve 5 markets**
- [ ] **Process settlements**
- [ ] **Verify all functions work**
- [ ] **Monitor for 48 hours**
- [ ] **Zero errors observed**

### Mainnet Deployment

- [ ] **Admin account funded:** Minimum 10 SUI for gas
- [ ] **Deploy contracts to mainnet:**
  ```bash
  sui client publish --gas-budget 200000000
  ```
- [ ] **Save deployment output** (CRITICAL!)
- [ ] **Verify package ID**:
  ```bash
  sui client object <PACKAGE_ID>
  ```
- [ ] **Verify on Sui Explorer:** https://suiexplorer.com/object/<PACKAGE_ID>?network=mainnet
- [ ] **Extract object IDs:**
  - [ ] AdminCap ID
  - [ ] ResolverCap ID
  - [ ] OracleAdminCap ID
  - [ ] RoleRegistry ID
  - [ ] OracleRegistry ID
- [ ] **Transfer capabilities to multi-sig wallet** (NOT individual address)
- [ ] **Update backend .env:**
  ```bash
  SUI_PACKAGE_ID=<package-id>
  SUI_ADMIN_CAP_ID=<admin-cap-id>
  SUI_RESOLVER_CAP_ID=<resolver-cap-id>
  SUI_ORACLE_REGISTRY_ID=<oracle-registry-id>
  ```
- [ ] **Verify capabilities owned by multi-sig**

### Post-Deployment Verification

- [ ] **Create first mainnet market** (small test)
- [ ] **Place test bet from team wallet**
- [ ] **Verify transaction on explorer**
- [ ] **Check database indexing works**
- [ ] **Verify frontend displays correctly**
- [ ] **Monitor for 24 hours**
- [ ] **Zero errors in production**

---

## Phase 4: Oracle Integration (Weeks 13-14)

### Oracle Setup

- [ ] **Pyth Network configured:**
  - [ ] Pyth oracle integrated
  - [ ] Price feed IDs configured
  - [ ] Update frequency tested
- [ ] **Chainlink configured** (if using)
- [ ] **Binance Oracle API configured** (if using)
- [ ] **Minimum 2 oracle sources active**

### Oracle Security

- [ ] **Whitelist oracle sources:**
  ```bash
  sui client call --function whitelist_source \
    --module oracle_validator \
    --package $PACKAGE_ID \
    --args $ORACLE_ADMIN_CAP "pyth"
  ```
- [ ] **Set staleness threshold verified:** 5000ms
- [ ] **Set deviation threshold verified:** 1000 bps (10%)
- [ ] **Circuit breaker tested**
- [ ] **Oracle failover tested**
- [ ] **Monitor oracle uptime >99.9%**

---

## Phase 5: Liquidity Bootstrap (Weeks 15-20)

### Funding Secured

- [ ] **Sui Foundation grant application submitted**
- [ ] **Grant approved:** Target $500K
- [ ] **Grant funds received**
- [ ] **Market maker agreements signed:**
  - [ ] Wintermute
  - [ ] Jump Trading
  - [ ] GSR
  - [ ] Or equivalent
- [ ] **Liquidity commitments documented:** Minimum $1M total

### Liquidity Mining

- [ ] **Liquidity mining contract deployed** (if using)
- [ ] **Reward parameters configured**
- [ ] **Initial liquidity seeded:** Minimum $100K per market
- [ ] **Market maker incentives active:**
  - [ ] 0% trading fees for 6 months
  - [ ] $100K SUI rewards allocated
  - [ ] API access provided

### Market Depth

- [ ] **Spreads <1%** on top 10 markets
- [ ] **Daily volume >$100K**
- [ ] **30+ active markets**
- [ ] **Professional traders onboarded:** Minimum 5 firms
- [ ] **Monitor liquidity metrics daily**

---

## Phase 6: Regulatory & Legal (Weeks 21-22)

### Legal Review

- [ ] **Terms of Service drafted**
- [ ] **Privacy Policy created**
- [ ] **Risk disclosures prominent**
- [ ] **Jurisdiction analysis complete**
- [ ] **OFAC screening implemented** (if US users)
- [ ] **AML/KYC policy defined** (if required)
- [ ] **Legal counsel review complete**

### Compliance

- [ ] **Securities law review:** Ensure markets don't violate securities regs
- [ ] **Gambling law review:** Ensure compliant in target jurisdictions
- [ ] **Data protection:** GDPR/CCPA compliance (if applicable)
- [ ] **Tax reporting:** IRS Form 1099 (if US users)
- [ ] **Insurance:** D&O and cyber insurance secured
- [ ] **Entity formation:** LLC/Foundation established

---

## Phase 7: User Testing & Launch (Weeks 23-24)

### Beta Testing

- [ ] **Closed beta:** 100 invited users
- [ ] **Beta feedback collected**
- [ ] **Critical bugs fixed**
- [ ] **UI/UX improvements made**
- [ ] **Performance optimized**

### Public Launch

- [ ] **Marketing materials ready:**
  - [ ] Website
  - [ ] Blog posts
  - [ ] Social media
  - [ ] Press releases
- [ ] **Community channels active:**
  - [ ] Discord/Telegram
  - [ ] Twitter
  - [ ] Medium
- [ ] **Documentation complete:**
  - [ ] User guides
  - [ ] API docs
  - [ ] FAQ
  - [ ] Troubleshooting
- [ ] **Support team trained**
- [ ] **24/7 on-call support available**

### Launch Execution

- [ ] **Launch announcement:** 1 week notice
- [ ] **Gradual rollout:** Start with caps
- [ ] **Initial market cap:** $10K per market
- [ ] **Monitor closely for 72 hours**
- [ ] **Gradually increase caps**
- [ ] **Full launch after 2 weeks stable operation**

---

## Continuous Monitoring (Ongoing)

### Daily Checks

- [ ] **Monitor error rates** (target: <0.1%)
- [ ] **Check transaction success rate** (target: >99%)
- [ ] **Review oracle uptime** (target: >99.9%)
- [ ] **Monitor liquidity depth**
- [ ] **Check user complaints**

### Weekly Reviews

- [ ] **Review security logs**
- [ ] **Analyze performance metrics**
- [ ] **Check gas costs** (optimize if needed)
- [ ] **Review market participation**
- [ ] **Update risk assessments**

### Monthly Reviews

- [ ] **Security audit followup** (if findings)
- [ ] **Code review of changes**
- [ ] **Penetration testing**
- [ ] **Liquidity strategy review**
- [ ] **Compliance check**
- [ ] **Financial review**

---

## Emergency Procedures

### Circuit Breaker

- [ ] **Pause contract procedure documented:**
  ```bash
  sui client call --function pause_market \
    --module market_manager_v2 \
    --args $ADMIN_CAP $MARKET_ID
  ```
- [ ] **Emergency contacts list**
- [ ] **Communication templates**
- [ ] **Incident response team assigned**

### Disaster Recovery

- [ ] **Database backup/restore tested monthly**
- [ ] **Hot wallet rotation procedure**
- [ ] **Contract upgrade path documented** (if possible)
- [ ] **User communication plan**
- [ ] **Liquidity withdrawal procedure**

---

## Sign-Off

**This checklist must be signed off by all stakeholders before mainnet launch.**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **CTO** | ________________ | ________________ | ______ |
| **Security Lead** | ________________ | ________________ | ______ |
| **Legal Counsel** | ________________ | ________________ | ______ |
| **External Auditor** | ________________ | ________________ | ______ |
| **CEO** | ________________ | ________________ | ______ |

---

## Completion Status

### Phase 1: Security Testing (Weeks 1-6)
- **Status:** 🔴 40% Complete
- **Blockers:** Load testing, formal verification, external audit
- **ETA:** 6 weeks

### Phase 2: Infrastructure (Weeks 7-10)
- **Status:** 🟡 20% Complete
- **Blockers:** Production database, monitoring
- **ETA:** 4 weeks

### Phase 3: Smart Contract Deployment (Weeks 11-12)
- **Status:** 🟢 80% Complete
- **Blockers:** Final audit approval
- **ETA:** 2 weeks after audit

### Phase 4: Oracle Integration (Weeks 13-14)
- **Status:** 🟡 30% Complete
- **Blockers:** Oracle contracts, testing
- **ETA:** 2 weeks

### Phase 5: Liquidity Bootstrap (Weeks 15-20)
- **Status:** 🔴 10% Complete
- **Blockers:** Grant approval, MM agreements
- **ETA:** 6 weeks

### Phase 6: Regulatory & Legal (Weeks 21-22)
- **Status:** 🔴 0% Complete
- **Blockers:** Legal review
- **ETA:** 2 weeks

### Phase 7: Launch (Weeks 23-24)
- **Status:** 🔴 0% Complete
- **Blockers:** All above phases
- **ETA:** 2 weeks

---

**OVERALL STATUS:** 🔴 30% Complete
**ESTIMATED TIME TO MAINNET:** 22-24 weeks (Q2 2026)
**CURRENT BLOCKING ITEMS:**
1. External security audit
2. Formal verification
3. Load testing validation
4. Liquidity commitments
5. Legal review

**NEXT ACTIONS (This Week):**
1. ⏳ Run Move unit tests
2. ⏳ Set up load testing environment
3. ⏳ Contact external auditors (get quotes)
4. ⏳ Begin Sui Foundation grant application
5. ⏳ Engage legal counsel

---

**Last Updated:** October 21, 2025
**Next Review:** Weekly until launch
**Document Owner:** Security Team

**⚠️ This is a living document. Update after each phase completion.**
