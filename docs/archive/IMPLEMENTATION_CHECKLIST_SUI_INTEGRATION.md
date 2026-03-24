# Implementation Checklist: Sui + NAVI + Cetus Integration

**Project Status:** Move Market at 45% completion on Sui
**Target:** 100% with NAVI + Cetus features by Week 8
**Timeline:** 8 weeks

---

## Phase 1: Foundation (Week 1-2) | 45% → 70%

### Smart Contracts

#### collateral_vault_v2.move - NAVI Integration
- [ ] Create new module in `contracts-sui/sources/`
- [ ] Struct: UserCollateral with navi_receipt_token field
- [ ] Function: deposit_to_vault_and_navi()
  - Transfer USDC from user
  - Call lending_core::deposit()
  - Store receipt token
  - Emit event
- [ ] Function: claim_navi_yield()
  - Get accrued interest from NAVI
  - Withdraw without touching principal
  - Credit user
- [ ] Function: get_user_balance()
  - Return principal + accrued yield
- [ ] Error handling for NAVI failures
- [ ] Unit tests (target: 80% coverage)

#### betting.move - Wire NAVI Repayment
- [ ] Modify claim_winnings() function
- [ ] Add NAVI repayment logic before payout
- [ ] Calculate interest owed
- [ ] Auto-repay borrowed amount
- [ ] Return remaining winnings to user
- [ ] Emit ClaimWithNaviRepayment event
- [ ] Tests for claim flow

#### market_manager.move - Add Oracle Integration Point
- [ ] Modify resolve_market() function
- [ ] Accept oracle consensus data
- [ ] Validate 66% threshold
- [ ] Update market.resolved status
- [ ] Store winning outcome
- [ ] Emit MarketResolved event
- [ ] Tests for resolution flow

### Backend (Node.js)

#### USDC Routing
- [ ] Testnet: Configure test USDC token address
- [ ] Mainnet placeholder: Document Circle bridge requirements
- [ ] Add USDC balance query endpoints
- [ ] Transaction simulation for gas estimation

#### NAVI Client Wrapper
- [ ] Create `backend/src/blockchain/sui/naviClient.ts`
- [ ] Class methods:
  - getUserYield(address): Promise<number>
  - depositToNavi(address, amount): Promise<tx>
  - borrowFromNavi(address, amount, ltv): Promise<tx>
  - repayNavi(address, amount): Promise<tx>
  - withdrawFromNavi(address, amount): Promise<tx>
- [ ] Error handling & retry logic
- [ ] Event logging

#### Settlement Logic
- [ ] Modify backend payout calculation
- [ ] Include NAVI interest in yield calculation
- [ ] Update settlement queue processing
- [ ] Test payout accuracy

### Frontend (React)

#### Wallet Integration
- [ ] Ensure Sui wallet selector working
- [ ] Verify chain switching (Aptos ↔ Sui)
- [ ] Test transaction signing

#### Basic NAVI UI
- [ ] Display collateral balance
- [ ] Show APY (hardcoded 5.5% for now)
- [ ] Display yield earned (optional for MVP)

#### Test Suite
- [ ] Integration test: deposit → bet → claim flow
- [ ] Test NAVI calls firing correctly
- [ ] Mock NAVI responses

### Testing

- [ ] Unit tests: collateral_vault_v2.move (80%+ coverage)
- [ ] Unit tests: betting.move changes
- [ ] Integration test: Market creation → bet → claim with NAVI
- [ ] Devnet end-to-end test
- [ ] Error case testing

### Deployment

- [ ] Deploy collateral_vault_v2 to Sui testnet
- [ ] Deploy betting.move updates to Sui testnet
- [ ] Deploy market_manager.move updates to Sui testnet
- [ ] Update frontend .env with new contract addresses
- [ ] Update backend config with NAVI addresses

**Week 1-2 Deliverables:**
- ✅ Sui contracts deployed to testnet
- ✅ NAVI integration working (deposit/withdraw/interest)
- ✅ Backend settlement logic updated
- ✅ Frontend shows collateral + yield
- ✅ End-to-end flow tested

---

## Phase 2: Features (Week 3-4) | 70% → 90%

### Smart Contracts

#### cetus_integration.move - YES/NO Liquidity Pools
- [ ] Create new module
- [ ] Struct: MarketPool { market_id, pool_id, yes_token, no_token, current_price, lp_fees }
- [ ] Function: create_market_with_pool()
  - Calculate YES odds from LMSR
  - Call Cetus create_pool()
  - Add initial liquidity (50/50 in USDC value)
  - Store pool reference
  - Emit event
- [ ] Function: swap_outcomes()
  - Accept from_outcome, amount, min_out
  - Call Cetus swap_exact_input()
  - Update pool price in state
  - Emit SwapExecuted event
- [ ] Function: collect_pool_fees()
  - Collect accumulated fees from Cetus
  - Split: 60% treasury, 30% referrers, 10% back to LPs
  - Emit FeesCollected event
- [ ] Unit tests for Cetus interactions

#### betting.move - Leveraged Betting
- [ ] Function: place_leveraged_bet()
  - Parameters: market_id, outcome, collateral, borrow_amount
  - Call navi::deposit(collateral)
  - Call navi::borrow(borrow_amount) with 50% LTV
  - Call existing place_bet() with total amount
  - Store UserLeveragePosition { borrowed, collateral, market_id, outcome }
  - Emit LeveragedBetPlaced event
- [ ] Function: claim_leveraged_winnings()
  - Get winnings from market
  - Calculate NAVI interest owed
  - Call navi::repay(borrowed + interest)
  - Call navi::withdraw(collateral)
  - Transfer net profit to user
  - Emit LeveragedBetClaimed event
- [ ] Error handling: insufficient winnings to repay
- [ ] Unit tests for leverage flows

#### flash_arbitrage.move - Flash Loan Arbitrage
- [ ] Create new module
- [ ] Function: execute_arbitrage_opportunity()
  - Parameters: market_a, market_b, flash_amount
  - Call navi::flashloan(amount)
  - Swap on market_a (buy cheap outcome)
  - Swap on market_b (sell expensive outcome)
  - Assert profitability (proceeds > borrowed + fee)
  - Flashloan automatically repays
  - Emit ArbitrageExecuted event
- [ ] Helper: detect_arbitrage_opportunity() - returns (market_a, market_b, profit_estimate)
- [ ] Unit tests with mock price data

#### market_manager.move - Cetus Pool Creation
- [ ] Modify create_market() function
- [ ] After market creation, call cetus_integration::create_market_with_pool()
- [ ] Pass LMSR-calculated odds as initial price
- [ ] Store pool_id in market struct
- [ ] Emit event with pool details

### Backend (Node.js)

#### Cetus Client Wrapper
- [ ] Create `backend/src/blockchain/sui/cetusClient.ts`
- [ ] Class methods:
  - createPool(tokenA, tokenB, fee): Promise<poolId>
  - addLiquidity(poolId, amountA, amountB, range): Promise<tx>
  - swap(poolId, fromToken, toToken, amount, minOut): Promise<swapResult>
  - getPoolPrice(poolId): Promise<price>
  - collectFees(poolId): Promise<amount>
- [ ] Price calculation utilities
- [ ] Event monitoring for pool changes

#### Arbitrage Detection Service
- [ ] Create `backend/src/services/arbitrageDetector.ts`
- [ ] Function: detectArbitrages()
  - Query all active markets
  - Calculate YES/NO prices for each
  - Compare across markets
  - Identify profitable spreads
  - Return top 5 opportunities
- [ ] Run periodically (every 10s)
- [ ] Alert users of opportunities via WebSocket

#### API Endpoints (New)
- [ ] GET /api/markets/:id/pool
  - Return pool details (price, volume, fees)
- [ ] POST /api/markets/:id/swap
  - Execute YES/NO swap on Cetus
- [ ] GET /api/arbitrage/opportunities
  - Return current arbitrage opportunities
- [ ] POST /api/arbitrage/execute
  - Execute arbitrage transaction
- [ ] GET /api/markets/:id/pool-fees
  - Return accumulated fees

### Frontend (React)

#### New Hooks
- [ ] `hooks/useLeveragedBet.ts`
  - placeLeveragedBet(collateral, borrow, market, outcome)
  - claimWithNaviRepayment(market_id)
  - State: isLoading, error, tx
- [ ] `hooks/useCetusSwap.ts`
  - swapYesNo(market_id, from_outcome, amount, min_out)
  - State: swappedAmount, priceImpact, isLoading
- [ ] `hooks/useArbitrageOpportunities.ts`
  - Fetch opportunities from backend
  - Auto-refresh every 10s
  - Execute arbitrage function

#### New Components
- [ ] LeveragedBettingModal.tsx
  - Input: Collateral amount (slider)
  - Auto-calc: Max borrow based on 50% LTV
  - Show: Total bet, leverage ratio, interest cost
  - Button: "Place Leveraged Bet"
- [ ] YesNoSwapPanel.tsx
  - Dropdown: YES → NO / NO → YES
  - Input: Amount
  - Show: Price impact %, min out, slippage
  - Button: "Swap on Cetus DEX"
- [ ] ArbitrageAlert.tsx
  - Display: Top 3 arbitrage opportunities
  - Show: Market A price, Market B price, potential profit
  - Button: "Execute Arbitrage"
  - Auto-hide after 5 minutes

#### Market Page Updates
- [ ] Add "Swap Outcomes" button next to "Place Bet"
- [ ] Add "Leveraged Bet" option in betting modal
- [ ] Display pool stats (volume, fees, liquidity)
- [ ] Add arbitrage alert banner at top

### Testing

- [ ] Unit tests: cetus_integration.move (80%+ coverage)
- [ ] Unit tests: leveraged betting functions
- [ ] Unit tests: flash arbitrage module
- [ ] Integration test: Market creation → pool creation → swap
- [ ] Integration test: Leveraged bet flow end-to-end
- [ ] Integration test: Flash arbitrage execution
- [ ] Arbitrage detector tests (mock price data)
- [ ] Frontend component tests

### Deployment

- [ ] Deploy cetus_integration.move to testnet
- [ ] Deploy updated betting.move to testnet
- [ ] Deploy flash_arbitrage.move to testnet
- [ ] Deploy updated market_manager.move to testnet
- [ ] Update frontend with new contract addresses
- [ ] Deploy backend services to staging
- [ ] Update backend .env with Cetus addresses

**Week 3-4 Deliverables:**
- ✅ Cetus integration live (create pools, swap YES/NO)
- ✅ Leveraged betting functional
- ✅ Flash loan arbitrage available
- ✅ Arbitrage detection service running
- ✅ Frontend UX for all new features
- ✅ All integration tests passing

---

## Phase 3: Quality (Week 5-6) | 90% → 99%

### Smart Contracts

#### Multi-Oracle System Port (FROM APTOS)
- [ ] Create `contracts-sui/sources/multi_oracle.move`
- [ ] Copy logic from Aptos `multioracle.move`
- [ ] Change data structures to Sui shared objects
- [ ] Struct: OracleRegistry (shared object)
- [ ] Struct: OracleInfo { stake, reputation, confidence }
- [ ] Function: registerOracle()
  - Accept stake amount (1 SUI minimum)
  - Create oracle entry
  - Track stake in registry
- [ ] Function: submitResolution()
  - Accept oracle submissions within 24hr window
  - Store weighted votes
- [ ] Function: calculateConsensus()
  - Aggregate votes by outcome
  - Calculate weighted percentages
  - Return outcome with >66% consensus
- [ ] Function: updateOracleReputations()
  - Increase reputation +10 for correct votes
  - Decrease -50 for incorrect votes
  - Slash 20% of stake for incorrect
- [ ] Function: createDispute()
  - Accept dispute within 24hr of resolution
  - Select random jury of 5
  - Start voting period
- [ ] Function: submitJuryVote()
  - Accept jury member vote
  - Count votes
  - Finalize after 24hr or 5/5 votes
- [ ] Comprehensive error handling
- [ ] Unit tests: 90%+ coverage
- [ ] Integration tests with market_manager

#### Dispute Resolution Module
- [ ] Create `contracts-sui/sources/dispute_resolution.move`
- [ ] Struct: Dispute { market_id, disputer, reason, evidence, votes, final_outcome }
- [ ] Function: createDispute() - covered above
- [ ] Function: submitJuryVote() - covered above
- [ ] Function: finalizeDispute()
  - Check jury threshold (3/5 majority)
  - Update market outcome if jury overturns
  - Refund disputer if upheld
  - Slash disputer if frivolous
- [ ] Tests: dispute flows, jury selection, finalization

#### Reentrancy Guards (Complete)
- [ ] Add to all write functions in market_manager.move
  - Use Guard pattern: borrow_mut_global
  - Check no recursive calls
  - Restore before returns
- [ ] Add to betting.move
  - Protect place_bet()
  - Protect claim_winnings()
- [ ] Add to collateral_vault_v2.move
  - Protect deposit()
  - Protect withdraw()
- [ ] Add to cetus_integration.move
  - Protect swap_outcomes()
  - Protect collect_fees()
- [ ] Tests for reentrancy attempts (should fail)

#### Pause Mechanisms
- [ ] Add AdminCap capability checks
- [ ] Add isPaused flag to each module
- [ ] Function: pause_module() (admin only)
- [ ] Function: unpause_module() (admin only)
- [ ] Guard all critical functions with pause check
- [ ] Emit PauseToggled events
- [ ] Tests: pause/unpause flows

### Backend

#### Oracle Integration
- [ ] Create `backend/src/blockchain/sui/oracleClient.ts`
- [ ] Class methods:
  - registerAsOracle(stake): Promise<tx>
  - submitResolution(marketId, outcome, confidence): Promise<tx>
  - getOracleReputation(address): Promise<score>
  - getMarketConsensus(marketId): Promise<consensus>
- [ ] Automated oracle submission for Pyth feeds
- [ ] Monitor oracle health (accuracy, response time)

#### Dispute Monitoring
- [ ] Create `backend/src/services/disputeMonitor.ts`
- [ ] Watch for dispute creation events
- [ ] Select jury members (random from active users)
- [ ] Notify jury of participation
- [ ] Monitor vote submissions
- [ ] Execute jury vote counting
- [ ] Finalize disputes after threshold

#### Comprehensive Testing
- [ ] Unit tests for all new backend modules
- [ ] Integration tests for oracle flows
- [ ] Integration tests for dispute flows
- [ ] Load tests: 100 markets resolving simultaneously
- [ ] Fuzz tests: invalid inputs, edge cases

### Frontend

#### Oracle Dashboard (for oracle operators)
- [ ] Component: OraclePanel.tsx
  - Show oracle reputation score
  - Show pending markets for resolution
  - Form to submit resolution
  - Show past votes accuracy
- [ ] Show oracle earnings
- [ ] Webhook alerts for market deadlines

#### Dispute UI
- [ ] Component: DisputeModal.tsx
  - Show dispute reason options
  - Evidence upload field
  - Stake amount input (0.1 SUI)
  - Button: "File Dispute"
- [ ] Component: JuryPanel.tsx
  - List juror's pending votes
  - For each: show market, current consensus, jury options
  - Vote submission form
  - Time remaining countdown

#### Oracle Resolution Transparency
- [ ] Update market detail page
- [ ] Show all oracle submissions
- [ ] Display each oracle: vote, weight, reputation
- [ ] Show consensus calculation
- [ ] Display dispute history

### Full Integration Testing

- [ ] Test: Market creation → oracle submission → resolution
- [ ] Test: Dispute filed → jury selected → verdict executed
- [ ] Test: Multi-chain balance reconciliation
- [ ] Test: Reentrancy attempt fails safely
- [ ] Test: Pause mechanism halts all operations
- [ ] Test: Resume mechanism restores normal operation
- [ ] Load test: 1000 concurrent bets
- [ ] Stress test: 100 markets resolving together

### Deployment to Testnet

- [ ] Deploy all smart contracts to Sui testnet
- [ ] Deploy backend services to staging
- [ ] Deploy frontend to staging environment
- [ ] Point all services to testnet
- [ ] Run full E2E test suite
- [ ] Load testing for 48 hours
- [ ] Monitor logs for errors

**Week 5-6 Deliverables:**
- ✅ Multi-oracle system ported and tested
- ✅ Dispute resolution working
- ✅ Reentrancy guards implemented
- ✅ Pause mechanisms functional
- ✅ 90%+ test coverage across codebase
- ✅ Backend oracle/dispute services deployed
- ✅ Frontend oracle/jury dashboards built
- ✅ 48-hour load test completed

---

## Phase 4: Security & Launch (Week 7-8) | 99% → 100%

### External Security Audit

- [ ] Week 1: Reach out to audit firms (OtterSec, CertiK, Move Prover team)
  - Request quotes
  - Define scope (all Sui Move contracts)
  - Negotiate timeline (2-3 week turnaround)
  - Budget: $50K-$150K
- [ ] Week 2: Provide code to auditors
  - All Move source files
  - Architecture documentation
  - Test suite
  - Deployment procedures
- [ ] Week 3-4: Address findings
  - Critical: Fix within 48 hours
  - High: Fix within 1 week
  - Medium: Fix before mainnet
  - Low: Track for future iterations
- [ ] Week 4: Re-audit critical fixes
- [ ] Week 5: Receive final audit report

### Pre-Mainnet Checklist

- [ ] All audit findings resolved (0 critical remaining)
- [ ] 95%+ smart contract test coverage
- [ ] 90%+ backend test coverage
- [ ] 80%+ frontend test coverage
- [ ] Performance benchmarks met:
  - Bet placement: <1s
  - Market creation: <2s
  - Claim winnings: <1s
  - Oracle submission: <2s
- [ ] Security audit completed and passed
- [ ] Wallet integration tested (Sui Wallet, Suiet, Ethos)
- [ ] Mobile responsive tested on iOS/Android
- [ ] USDC integration ready (testnet tokens working)
- [ ] Monitoring/alerting deployed
- [ ] Incident response procedures documented
- [ ] On-call rotation established

### Mainnet Deployment

- [ ] Week 7 Monday: Deploy to Sui mainnet
  - Contracts: market_manager, betting, collateral_vault_v2, cetus_integration, multi_oracle, dispute_resolution, flash_arbitrage
  - Update .env files in frontend/backend
  - Verify all contract addresses
  - Deploy backend services
  - Deploy frontend
  - Test critical flows (should take ~1 hour)
- [ ] Week 7 Tuesday: Internal testing (24 hours)
  - Create test markets
  - Place test bets
  - Use leveraged betting
  - Swap YES/NO tokens
  - Test oracle submission
  - Verify NAVI integration
  - Monitor logs
- [ ] Week 7 Wednesday: Limited public launch
  - 10,000 USDC max bet total
  - Marketing: announce on Twitter
  - Community: Discord channel monitoring
  - Support: 24/7 on-call team
- [ ] Week 7 Thursday-Friday: Monitoring & adjustments
  - Monitor transaction fees
  - Monitor TVL growth
  - Monitor oracle submissions
  - Handle any issues
- [ ] Week 8 Monday: Full public launch
  - Increase bet limits
  - Full marketing campaign
  - Partner announcements (NAVI, Cetus)
  - Exchange listings (CoinGecko, etc)

### Marketing Launch

- [ ] Twitter Spaces: "Polymarket on Sui" announcement
- [ ] Blog post: Technical architecture
- [ ] Blog post: Multi-oracle advantage vs Polymarket
- [ ] Blog post: NAVI + Cetus integration benefits
- [ ] Press releases (crypto media)
- [ ] Discord channel activation
- [ ] Telegram group launch
- [ ] Reddit post in r/SuiNetwork, r/cryptocurrency
- [ ] Community incentives:
  - Liquidity mining: $50K/week for LPs on YES/NO pools
  - User rewards: 0.1% APY bonus on collateral deposits
  - Oracle rewards: 25% of platform fees to oracle network
  - Referral program: 5% of referred user fees

### Production Monitoring

- [ ] Prometheus metrics for all key functions
- [ ] Grafana dashboards:
  - Markets created/day
  - Total volume
  - Active users
  - Average bet size
  - Oracle submission rate
  - NAVI integration health
  - Cetus pool health
- [ ] Alert on:
  - Transaction failures
  - Oracle consensus failures
  - NAVI errors
  - Cetus pool imbalance
  - Extreme slippage
- [ ] Daily reports to leadership
- [ ] Weekly retrospectives

### Post-Launch Support (Week 8+)

- [ ] Community support: Discord, Telegram, Twitter
- [ ] Bug triage: Daily reviews
- [ ] Performance optimization: Monitor and improve
- [ ] User education: Guides, FAQs, video tutorials
- [ ] Partnership development:
  - Work with NAVI on co-marketing
  - Work with Cetus on liquidity incentives
  - Approach other Sui protocols

**Week 7-8 Deliverables:**
- ✅ Professional security audit completed
- ✅ All findings resolved
- ✅ Mainnet deployed
- ✅ Limited launch successful
- ✅ Monitoring operational
- ✅ Full launch announced
- ✅ Marketing campaign live
- ✅ 500+ active users by end of week 8

---

## Success Metrics

### Technical KPIs
- Uptime: >99.5%
- Transaction success rate: >99%
- Average bet confirmation: <1s
- Oracle consensus: 100% (all markets resolve with consensus)
- Smart contract audit: 0 critical issues

### Business KPIs
- Active users: 500+ by week 8
- Total volume: $100K+ by week 8
- Markets created: 50+ by week 8
- NAVI integration: $50K+ collateral
- Cetus pools: $100K+ liquidity
- Fee revenue: $1K+ week 1

### Community KPIs
- Discord members: 1K+
- Twitter followers: 2K+ (from 0)
- Media mentions: 20+
- Partnerships: NAVI, Cetus, 2 others

---

## Risk Contingencies

### If NAVI Integration Fails
- Fallback: Use only collateral vault (no yield earning)
- Workaround: Manual yield distribution
- Timeline: 1 week to fix

### If Cetus Pool Fails
- Fallback: Use your LMSR for all YES/NO pricing
- Workaround: Run internal LP
- Timeline: 2 days

### If Oracle Consensus Fails
- Fallback: Use admin resolution temporarily
- Workaround: Pause new markets until fixed
- Timeline: 24 hours for hotfix

### If Audit Finds Critical Issues
- Budget: Extra 1-2 weeks for fixes
- Cost: +$20K for re-audit
- Timeline: Delay mainnet by 1-2 weeks

### If Mainnet Launch Fails
- Rollback: Revert to last working testnet state
- Debug: 24-48 hours to identify issue
- Retry: Mainnet deployment week 2 if needed

---

## Sign-Offs Required

- [ ] CTO: Tech stack, architecture approved
- [ ] Security Lead: Audit scope defined, team chosen
- [ ] Product: Feature prioritization approved
- [ ] Operations: Monitoring/alerting setup approved
- [ ] Legal: Terms of service reviewed
- [ ] Finance: Budget approved ($462K-$809K total)

---

## Next Immediate Actions (This Week)

1. [ ] Schedule team alignment meeting
2. [ ] Review this checklist with technical lead
3. [ ] Prioritize Phase 1 tasks
4. [ ] Start work on collateral_vault_v2.move
5. [ ] Begin NAVI SDK integration in backend
6. [ ] Reach out to audit firms for quotes

Estimated effort per phase:
- Phase 1: 160 hours (2 devs, 2 weeks)
- Phase 2: 160 hours (2 devs, 2 weeks)
- Phase 3: 120 hours (2 devs, 1.5 weeks)
- Phase 4: 80 hours (1 dev + external auditors, 1 week)
- **Total: 520 hours (~6 months at 20hrs/week per dev)**

Estimated costs:
- Salaries: $300K-$400K (2 devs × 6 months)
- Audit: $50K-$150K
- Infrastructure: $15K
- Oracle partnerships: $30K
- Marketing: $30K
- Liquidity seeding: $50K
- **Total: $475K-$675K**

Break-even after launch:
- 1% fee on $1M volume = $10K/month
- At this rate, ROI in ~18 months
- Breakeven at $500K volume
