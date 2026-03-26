# `pyth_reader` Module Design

This document describes the implemented `prediction_market::pyth_reader` Move module so downstream components understand the contract it offers.

## 1. Responsibilities

1. Store global configuration (Pyth contract address, trusted relayers).
2. Maintain per-market feed metadata (feed ID and freshness threshold).
3. Cache the latest price snapshot supplied by an authorized relayer.
4. Expose friend helpers and public view functions so `oracle.move` can resolve markets with Pyth data.
5. Emit events that mirror cached updates for monitoring and auditing.

> **Note:** The module trusts designated relayers. VAA validation happens off-chain before the relayer submits a transaction. On-chain we enforce freshness, monotonic timestamps, and replay protection via hashed VAAs.

## 2. Storage Layout

```move
struct GlobalConfig has key {
    admin: address,
    pyth_contract: address,
    price_service: address,
    relayers: Table<address, bool>,          // Authorized submitters
    feeds: Table<u64, FeedConfig>,           // market_id -> feed config
    price_snapshots: Table<u64, PriceSnapshot>,
    update_events: EventHandle<PriceUpdateEvent>,
}

public struct FeedConfig has store, drop {
    feed_id: vector<u8>,                     // 32 bytes
    staleness_threshold_secs: u64,
}

public struct PriceSnapshot has store, drop {
    price: u128,                             // Magnitude of the Pyth price
    price_negative: bool,                    // Whether the price was negative
    confidence: u64,                         // Confidence interval magnitude
    expo: u64,                               // Exponent magnitude
    expo_negative: bool,                     // Exponent sign
    publish_time: u64,                       // Pyth publish timestamp (seconds)
    received_at: u64,                        // On-chain write timestamp
    vaa_hash: vector<u8>,                    // 32-byte replay guard
}

struct PriceUpdateEvent has drop, store {
    market_id: u64,
    feed_id: vector<u8>,
    price: u128,
    price_negative: bool,
    confidence: u64,
    expo: u64,
    expo_negative: bool,
    publish_time: u64,
    received_at: u64,
    vaa_hash: vector<u8>,
    resolution_hint: option::Option<u8>,
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| `E_NOT_INITIALIZED` | Module has not been initialized |
| `E_ALREADY_INITIALIZED` | Initialization attempted twice |
| `E_NOT_AUTHORIZED` | Caller lacks admin/relayer permissions |
| `E_MARKET_NOT_REGISTERED` | No feed configured for the market |
| `E_STALE_PRICE` | Submitted price exceeds freshness threshold |
| `E_INVALID_FEED_ID` | Feed ID must be exactly 32 bytes |
| `E_DUPLICATE_VAA` | VAA hash already processed |
| `E_INVALID_VAA_HASH` | Hash must be exactly 32 bytes |
| `E_PUBLISH_TIME_REGRESSION` | New publish time older than cached snapshot |

## 3. Entry Functions

- `initialize(admin, pyth_contract, price_service)` – one-time setup by `@prediction_market`.
- `register_feed(admin, market_id, feed_id, staleness_threshold_secs)` – adds/updates feed metadata.
- `unregister_feed(admin, market_id)` – removes feed config and cached snapshot.
- `add_relayer(admin, relayer)` / `remove_relayer(admin, relayer)` – manage authorized submitters.
- `submit_price_update(relayer, market_id, price, price_negative, confidence, expo, expo_negative, publish_time, vaa_hash, resolution_hint)` – caches a fresh snapshot after performing validation checks and emits `PriceUpdateEvent`.

## 4. View & Friend APIs

Public views:

- `get_feed_config(market_id): Option<FeedConfig>`
- `get_price_snapshot(market_id): Option<PriceSnapshot>`
- `is_snapshot_fresh(market_id, freshness_secs): bool`

Friend utilities (accessible to `oracle`):

- `has_price_snapshot(market_id): bool`
- `borrow_price_snapshot(market_id): &PriceSnapshot`
- `borrow_feed_config(market_id): &FeedConfig`

### Freshness Rules

- `publish_time` must be ≥ the previous cached value.
- `timestamp::now_seconds() - publish_time` must be ≤ both:
  - `FeedConfig.staleness_threshold_secs`
  - `PYTH_MAX_AGE_SECONDS` (defined in `oracle`).

## 5. Integration Notes

- `oracle::submit_pyth_price` forwards to `pyth_reader::submit_price_update` after verifying market configuration.
- `oracle::try_pyth_resolution` pulls the cached snapshot, checks freshness, verifies exponent/sign alignment with the configured threshold, and compares magnitudes using `signed_ge`.
- When a market is cleared (`clear_pyth_feed`), the feed config and cached snapshot are dropped, and `pyth_configured` is reset.

## 6. Off-Chain Relayer Workflow

1. Fetch VAAs from the Pyth price service.
2. Verify signatures and payloads off-chain.
3. Normalize values into `(price magnitude, sign, exponent magnitude, sign, publish_time)`.
4. Hash the VAA payload (32 bytes) and call `submit_price_update`.
5. Repeat for each target market feed.

Relayers must maintain monotonic publish times per market and skip submissions when fresh data is unavailable. The optimistic oracle path takes over when snapshots are missing or stale.

## 7. Monitoring

- Indexers can subscribe to `PriceUpdateEvent` to track incoming updates, detect delayed relayers, and audit the `resolution_hint` (when provided).
- Admins should monitor feeds whose cached snapshots age past their configured staleness thresholds so they can intervene (e.g., trigger optimistic fallback).
