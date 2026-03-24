# Sui Security Testing Guide

**Purpose:** Verify critical security fixes before mainnet deployment
**Status:** 🔴 REQUIRED - Must pass ALL tests
**Last Updated:** October 21, 2025

---

## Test Categories

### 1. Shared Object Contention Tests
### 2. Settlement Determinism Tests
### 3. Overflow Protection Tests
### 4. Cross-Module Safety Tests
### 5. Oracle Manipulation Tests

---

## Test #1: Shared Object Contention Stress Test

**Objective:** Confirm latency stays <2s under 1000 concurrent bets

### Setup

```bash
# Install Sui load testing tool
cargo install --git https://github.com/MystenLabs/sui.git sui-test-validator

# Deploy contracts to testnet
./scripts/deploy-sui.sh testnet

# Get package ID
export PACKAGE_ID=<from-deployment>
export MARKET_ID=<create-test-market>
```

### Test Script

```typescript
// tests/load/contention-test.ts
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

async function runContentionTest() {
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
  const concurrentUsers = 1000;
  const results = [];

  console.log(`Starting contention test with ${concurrentUsers} users...`);

  // Create concurrent bet transactions
  const promises = [];
  for (let i = 0; i < concurrentUsers; i++) {
    const shard_id = i % 16; // 16 shards
    promises.push(placeBet(client, MARKET_ID, shard_id, i));
  }

  const startTime = Date.now();
  const settled = await Promise.allSettled(promises);
  const endTime = Date.now();

  // Analyze results
  const successful = settled.filter(r => r.status === 'fulfilled').length;
  const failed = settled.filter(r => r.status === 'rejected').length;
  const totalTime = endTime - startTime;
  const avgLatency = totalTime / successful;

  console.log(`\nResults:`);
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Average latency: ${avgLatency}ms`);
  console.log(`Success rate: ${(successful / concurrentUsers * 100).toFixed(2)}%`);

  // Success criteria
  const p50 = calculatePercentile(results, 0.5);
  const p99 = calculatePercentile(results, 0.99);

  console.log(`\nLatency percentiles:`);
  console.log(`P50: ${p50}ms`);
  console.log(`P99: ${p99}ms`);

  // Verify success criteria
  assert(p50 < 1000, `P50 latency ${p50}ms exceeds 1000ms threshold`);
  assert(p99 < 2000, `P99 latency ${p99}ms exceeds 2000ms threshold`);
  assert(failed === 0, `${failed} transactions failed`);

  console.log(`\n✅ Contention test PASSED`);
}
```

### Success Criteria

- [  ] P50 latency < 1000ms
- [ ] P99 latency < 2000ms
- [ ] 0% failed transactions
- [ ] No shard has >10x more contention than others

### Expected Results (Before Sharding)

```
Total time: 127000ms
P50: 5200ms
P99: 18000ms
❌ FAILED: Unacceptable latency
```

### Expected Results (After Sharding)

```
Total time: 2400ms
P50: 450ms
P99: 1800ms
✅ PASSED: Acceptable latency
```

---

## Test #2: Settlement Determinism Test

**Objective:** Verify same inputs produce same outputs regardless of execution order

### Test Script

```move
// contracts-sui/tests/settlement_determinism_test.move
#[test_only]
module prediction_market::settlement_determinism_test {
    use prediction_market::market_manager_v2::{Self, Market, SettlementQueue};
    use sui::test_scenario;
    use sui::clock;

    #[test]
    fun test_settlement_determinism() {
        let admin = @0xAD;
        let user_a = @0xA;
        let user_b = @0xB;

        // Scenario 1: A settles before B
        let mut scenario1 = test_scenario::begin(admin);
        {
            let ctx = test_scenario::ctx(&mut scenario1);
            market_manager_v2::init_for_testing(ctx);
        };

        // Create market and positions
        test_scenario::next_tx(&mut scenario1, admin);
        let (market1, queue1, position_a1, position_b1) = create_test_scenario(&mut scenario1);

        // Settle A then B
        let final_state_1 = settle_in_order(market1, queue1, vec![position_a1, position_b1]);

        // Scenario 2: B settles before A
        let mut scenario2 = test_scenario::begin(admin);
        {
            let ctx = test_scenario::ctx(&mut scenario2);
            market_manager_v2::init_for_testing(ctx);
        };

        test_scenario::next_tx(&mut scenario2, admin);
        let (market2, queue2, position_a2, position_b2) = create_test_scenario(&mut scenario2);

        // Settle B then A
        let final_state_2 = settle_in_order(market2, queue2, vec![position_b2, position_a2]);

        // CRITICAL: Final states must be identical
        assert!(final_state_1.user_a_payout == final_state_2.user_a_payout, 0);
        assert!(final_state_1.user_b_payout == final_state_2.user_b_payout, 0);
        assert!(final_state_1.remaining_pool == final_state_2.remaining_pool, 0);

        test_scenario::end(scenario1);
        test_scenario::end(scenario2);
    }

    #[test]
    fun test_settlement_fairness() {
        // Two users with equal positions
        // Both should receive equal payouts regardless of order
        let user_a_position = create_position(100, 1); // 100 SUI on "yes"
        let user_b_position = create_position(100, 1); // 100 SUI on "yes"

        let payouts = execute_settlements(vec![user_a_position, user_b_position]);

        // Verify fairness
        assert!(payouts.user_a == payouts.user_b, 0);
        assert!(payouts.user_a == 100, 0); // Each gets back their investment
    }

    #[test]
    #[expected_failure(abort_code = E_SEQUENCE_VIOLATION)]
    fun test_cannot_skip_sequence() {
        // Attempt to settle sequence #5 before sequence #3
        // Should fail with sequence violation
        let mut queue = create_settlement_queue();

        add_settlement(&mut queue, 1, user_a, 100);
        add_settlement(&mut queue, 2, user_b, 200);
        add_settlement(&mut queue, 3, user_c, 150);

        // Try to execute #2 before #1 - should fail
        execute_out_of_order(&mut queue, 2);
    }
}
```

### Success Criteria

- [ ] Identical outputs for different input orders
- [ ] Fair payout distribution
- [ ] Cannot skip sequence numbers
- [ ] Settlement queue maintains order

---

## Test #3: Overflow Protection Test

**Objective:** Verify no overflow in price calculations

### Test Script

```move
// contracts-sui/tests/overflow_protection_test.move
#[test_only]
module prediction_market::overflow_protection_test {
    use prediction_market::market_manager_v2;

    #[test]
    fun test_max_value_multiplication() {
        // Test with boundary values
        let max_u64 = 0xFFFFFFFFFFFFFFFF;

        // Should not overflow when calculating shares
        let shares = market_manager_v2::calculate_shares_safe(
            yes_pool: max_u64 - 1000,
            no_pool: max_u64 - 1000,
            amount: 1000,
        );

        // Verify result is valid
        assert!(shares > 0, 0);
        assert!(shares <= max_u64, 0);
    }

    #[test]
    #[expected_failure(abort_code = E_OVERFLOW)]
    fun test_overflow_detection() {
        // This should abort with E_OVERFLOW
        let max_u64 = 0xFFFFFFFFFFFFFFFF;

        // Intentionally cause overflow
        let _result = market_manager_v2::safe_multiply_with_precision(
            max_u64,
            max_u64,
        );
        // Should never reach here
    }

    #[test]
    fun test_lmsr_price_calculation() {
        // Test LMSR with various pool ratios
        let test_cases = vector[
            // (yes_pool, no_pool, expected_price_min, expected_price_max)
            (1000, 1000, 450000000000000000, 550000000000000000), // 50% ± 5%
            (2000, 1000, 630000000000000000, 700000000000000000), // 66% ± 4%
            (1000, 2000, 300000000000000000, 370000000000000000), // 33% ± 4%
        ];

        let mut i = 0;
        while (i < vector::length(&test_cases)) {
            let case = vector::borrow(&test_cases, i);
            let (yes, no, min, max) = *case;

            let price = market_manager_v2::calculate_lmsr_price(yes, no, 100, 100);

            assert!(price >= min, i);
            assert!(price <= max, i);

            i = i + 1;
        };
    }

    #[test]
    fun test_no_bitwise_operations() {
        // Verify that financial calculations don't use bitwise ops
        // This is a static analysis test - would be checked by linter

        // Example of FORBIDDEN operation:
        // let scaled = amount << precision;  // ❌ NEVER DO THIS

        // Correct approach:
        let amount = 1000u64;
        let precision = 18u8;

        // Use explicit multiplication
        let scaled = (amount as u128) * 1_000_000_000_000_000_000u128;
        assert!(scaled > 0, 0);
    }
}
```

### Success Criteria

- [ ] Max value multiplication doesn't overflow
- [ ] Overflow detection works correctly
- [ ] LMSR prices are within expected ranges
- [ ] No bitwise operations in financial code

---

## Test #4: Cross-Module Safety Test

**Objective:** Verify permissions enforced during module interactions

### Test Script

```move
// contracts-sui/tests/cross_module_safety_test.move
#[test_only]
module prediction_market::cross_module_safety_test {
    use prediction_market::market_manager_v2;
    use prediction_market::mock_ausd; // Mock external module

    #[test]
    fun test_state_verification_after_external_call() {
        let mut market = create_test_market();
        let initial_balance = market_manager_v2::get_balance(&market);

        // Call external module
        let payout_amount = 1000;
        mock_ausd::transfer(winner, payout_amount);

        // CRITICAL: Verify state hasn't been corrupted
        let final_balance = market_manager_v2::get_balance(&market);
        let expected_balance = initial_balance - payout_amount;

        assert!(final_balance == expected_balance, E_STATE_CORRUPTION);
    }

    #[test]
    #[expected_failure(abort_code = E_MODULE_NOT_OPERATIONAL)]
    fun test_rejects_calls_during_upgrade() {
        let mut market = create_test_market();

        // Simulate external module in upgrade mode
        mock_ausd::set_upgrade_mode(true);

        // This should fail
        market_manager_v2::settle_with_ausd(&mut market, winner, 1000);
    }

    #[test]
    fun test_module_registry_check() {
        let registry = create_module_registry();

        // Add operational module
        registry::register(ausd_module, true);

        // Verify operational
        assert!(registry::is_operational(ausd_module), 0);

        // Set to non-operational
        registry::set_operational(ausd_module, false);

        // Verify non-operational
        assert!(!registry::is_operational(ausd_module), 0);
    }
}
```

### Success Criteria

- [ ] State verification catches corruption
- [ ] Calls rejected during module upgrade
- [ ] Module registry tracks operational status
- [ ] Permission checks not bypassed

---

## Test #5: Oracle Staleness Test

**Objective:** Verify stale oracle prices are rejected

### Test Script

```move
// contracts-sui/tests/oracle_staleness_test.move
#[test_only]
module prediction_market::oracle_staleness_test {
    use prediction_market::oracle_validator;
    use sui::clock;

    #[test]
    fun test_accepts_fresh_price() {
        let mut clock = clock::create_for_testing(test_scenario::ctx());
        clock::set_for_testing(&mut clock, 1000000);

        // Price from 2 seconds ago (fresh)
        let price_info = create_mock_price(
            price: 50000,
            timestamp: 998000,
        );

        // Should accept
        let price = oracle_validator::verify_price(&price_info, &clock);
        assert!(price == 50000, 0);

        clock::destroy_for_testing(clock);
    }

    #[test]
    #[expected_failure(abort_code = E_STALE_ORACLE)]
    fun test_rejects_stale_price() {
        let mut clock = clock::create_for_testing(test_scenario::ctx());
        clock::set_for_testing(&mut clock, 1000000);

        // Price from 10 seconds ago (stale)
        let price_info = create_mock_price(
            price: 50000,
            timestamp: 990000,
        );

        // Should reject with E_STALE_ORACLE
        let _price = oracle_validator::verify_price(&price_info, &clock);
    }

    #[test]
    fun test_price_deviation_circuit_breaker() {
        let last_price = 50000;
        let max_deviation = 10; // 10%

        // Test acceptable price movement
        let new_price = 54000; // +8%
        assert!(
            oracle_validator::is_price_valid(last_price, new_price, max_deviation),
            0
        );

        // Test excessive price movement
        let extreme_price = 60000; // +20%
        assert!(
            !oracle_validator::is_price_valid(last_price, extreme_price, max_deviation),
            0
        );
    }
}
```

### Success Criteria

- [ ] Fresh prices accepted
- [ ] Stale prices rejected (>5s old)
- [ ] Price deviation circuit breaker works
- [ ] Invalid prices rejected

---

## Integration Test Suite

### Run All Tests

```bash
# Move unit tests
cd contracts-sui
sui move test

# TypeScript integration tests
cd ../tests
npm test

# Load tests
npm run test:load

# Security audit
npm run audit
```

### CI/CD Pipeline

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install Sui CLI
        run: cargo install --git https://github.com/MystenLabs/sui.git sui

      - name: Build contracts
        run: cd contracts-sui && sui move build

      - name: Run unit tests
        run: cd contracts-sui && sui move test

      - name: Run overflow tests
        run: sui move test --filter overflow

      - name: Run determinism tests
        run: sui move test --filter determinism

      - name: Run cross-module tests
        run: sui move test --filter cross_module

      - name: Run oracle tests
        run: sui move test --filter oracle

      - name: Security audit
        run: |
          cargo install cargo-audit
          cargo audit

      - name: Fail if any test fails
        run: exit $?
```

---

## Formal Verification

### Move Prover Setup

```bash
# Install Move Prover
cargo install --git https://github.com/move-language/move move-prover

# Run verification
cd contracts-sui
move prove sources/market_manager_v2_secure.move
```

### Verification Specifications

```move
// Add to market_manager_v2_secure.move

/// Formal verification specifications
spec module {
    /// Invariant: Market pools always balance
    invariant forall market: Market:
        market.status == 1 ==>
            (sum_all_shards(market.yes_balance) + sum_all_shards(market.no_balance) ==
             market.total_volume);

    /// Invariant: Shares never exceed deposits
    invariant forall pool: MarketPoolShard:
        pool.yes_shares <= balance::value(&pool.yes_balance) &&
        pool.no_shares <= balance::value(&pool.no_balance);

    /// Invariant: Settlement sequence is monotonic
    invariant forall queue: SettlementQueue:
        is_sequence_monotonic(queue.pending);
}

spec fun place_bet {
    /// Pre-condition: Market must be active
    requires market.status == 0;
    requires !market.paused;
    requires clock::timestamp_ms(clock) < market.end_timestamp;

    /// Post-condition: Pool balance increased
    ensures pool.total_volume == old(pool.total_volume) + coin::value(payment);

    /// Post-condition: Shares assigned correctly
    ensures pool.yes_shares + pool.no_shares ==
            old(pool.yes_shares) + old(pool.no_shares) + shares;
}

spec fun execute_settlements {
    /// Pre-condition: Queue is sorted
    requires is_sequence_sorted(queue.pending);

    /// Post-condition: Processed count increased
    ensures queue.processed_count >= old(queue.processed_count);

    /// Post-condition: No settlements skipped
    ensures forall i in 0..queue.processed_count:
        queue.pending[i].sequence_number == old(queue.pending[0].sequence_number) + i;
}
```

---

## External Security Audit

### Recommended Auditors

1. **Trail of Bits** ($30-50K)
   - Specialized in Move/Sui
   - 2-4 week timeline
   - Comprehensive report

2. **Zellic** ($25-40K)
   - DeFi focus
   - 2-3 week timeline
   - Public report option

3. **OpenZeppelin** ($40-60K)
   - Industry standard
   - 3-4 week timeline
   - Remediation support

### Audit Preparation Checklist

- [ ] All unit tests passing
- [ ] Integration tests complete
- [ ] Formal verification done
- [ ] Code freeze (no changes during audit)
- [ ] Documentation complete
- [ ] Architecture diagrams ready
- [ ] Threat model documented
- [ ] Previous audit findings addressed

---

## Success Criteria Summary

**All tests must pass before mainnet deployment:**

### Critical Tests (BLOCKING)
- [ ] Shared object contention < 2s P99 latency
- [ ] Settlement determinism verified
- [ ] Overflow protection working
- [ ] Cross-module safety enforced
- [ ] Oracle staleness checks active

### High Priority Tests
- [ ] Formal verification passes
- [ ] External audit complete
- [ ] No high/critical findings
- [ ] Load tests pass at 10x expected volume

### Production Readiness
- [ ] All automated tests in CI/CD
- [ ] Monitoring and alerting setup
- [ ] Incident response plan ready
- [ ] Circuit breakers tested
- [ ] Governance timelock active

---

## Timeline

**Minimum time to complete all tests: 4-6 weeks**

| Week | Tasks |
|------|-------|
| 1 | Unit tests, overflow tests |
| 2 | Integration tests, determinism tests |
| 3 | Load tests, oracle tests |
| 4 | Formal verification |
| 5-6 | External audit |

**Status:** 🔴 Testing not started - deployment blocked

---

**This testing is NOT optional. Skipping any test creates production risk.**
