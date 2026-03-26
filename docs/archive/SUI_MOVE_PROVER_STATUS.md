# Sui Move Prover Status

Date: 2025-10-26

## Added Specifications

- `global_treasury.move`
  - Ensures the reentrancy guard is cleared after `record_claim` and `redeem_claim`.
  - Confirms that `record_claim` increases `total_claims_outstanding` by the claim amount.
- `market_manager_v2_secure.move`
  - Asserts that `execute_settlements` aborts when a market is paused.
  - Ensures `resolve_market` sets the status and winning outcome as expected after oracle validation.
- `oracle_validator.move`
  - Guarantees `require_fresh_aggregate` returns the median price from the supplied snapshot.

## Running the Prover

From the `contracts-sui` directory:

```bash
sui move prove
```

> Note: Move Prover currently emits warnings about duplicate aliases and deprecated `create_currency` usage. These do not affect the oracle/treasury specs and can be suppressed once the modules are refactored.

## Next Steps

- Extend specs to cover settlement queue invariants and oracle aggregation (multiple sources).
- Integrate prover execution into CI once warning suppression is configured.
