# Sui Native USDC Integration Guide

## Official Circle USDC Coin Types

| Environment | Coin Type | Details |
| --- | --- | --- |
| **Testnet** | `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC` | 6 decimals, issued by Circle. Testnet faucet: https://faucet.circle.com |
| **Mainnet** | `0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC` | Launched Oct 7, 2024. 6 decimals, redeemable 1:1 via Circle. |

> 🚫 **Do NOT accept bridged wUSDC** (`0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN`). It is not issued by Circle, cannot be redeemed through Circle Mint, and users risk permanent loss if they send it to Circle/Coinbase addresses.

## Update Checklist

1. Set `VITE_SUI_USDC_COIN_TYPE` (and backend equivalents) to the testnet coin type above for development.
2. When deploying to mainnet, update the environment variable and Move named address to the mainnet coin type.
3. Ensure contracts only accept `Coin<USDC>` from the Circle native coin type.
4. Detect bridged `wUSDC` balances in the dApp and show a migration prompt linking to Circle's migration guide.
5. Verify balances via `sui client coin-balance --owner <address>` and confirm the coin type string matches the values above.

## Move Integration Snippet

```move
module move_market::usdc_settlement {
    use sui::coin::{Self, Coin};
    use sui::tx_context::TxContext;

    struct USDC has drop {}

    public entry fun deposit_to_pool(
        usdc: Coin<USDC>,
        pool: &mut Coin<USDC>,
        ctx: &mut TxContext
    ) {
        coin::join(pool, usdc);
    }
}
```

Replace the `USDC` struct with an alias or ability tied to the coin type configured via `Move.toml` or module constants.

## Resources

- [Circle announcement – Native USDC on Sui](https://www.circle.com/blog/now-available-native-usdc-on-sui)
- [Migration guide (wUSDC → native USDC)](https://www.circle.com/blog/sui-migration-guide)
- [Circle CCTP Sui packages](https://developers.circle.com/cctp/sui-packages)
- [Sui mainnet USDC explorer link](https://suiscan.xyz/mainnet/coin/0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC)

Keep this document up to date whenever Circle publishes new environments or coin type changes.
