/**
 * Chain Currency — Compatibility shim.
 * Always returns USDC on Base.
 */
export const useChainCurrency = () => ({
  symbol: 'USDC',
  unitLabel: 'USDC',
  chain: 'base' as const,
  presets: [10, 25, 50, 100],
  presetAmounts: [10, 25, 50, 100],
  decimals: 6,
  symbolPrefix: '$',
  formatDisplay: (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
});
