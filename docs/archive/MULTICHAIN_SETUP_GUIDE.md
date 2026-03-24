# Multi-Chain Setup Guide - Frontend

**Created:** 2024-10-22
**Status:** ✅ Complete - Ready for Testing

This guide explains the new multi-chain infrastructure that enables seamless switching between Aptos and Sui blockchains in the frontend.

---

## Overview

The frontend now supports multiple blockchain networks with automatic wallet selection based on the active chain. Users can switch between Aptos and Sui seamlessly, and the UI adapts to show the appropriate wallet connection options.

**Key Features:**
- ✅ Dynamic chain switching (Aptos ↔ Sui)
- ✅ Chain-specific wallet integration
- ✅ Persistent chain selection (localStorage)
- ✅ Automatic wallet context switching
- ✅ Environment-based chain configuration

---

## Architecture

### New Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **ChainContext** | Manages active chain state | `dapp/src/contexts/ChainContext.tsx` |
| **SuiWalletContext** | Sui wallet integration | `dapp/src/contexts/SuiWalletContext.tsx` |
| **ChainSwitcher** | Chain selection UI | `dapp/src/components/ChainSwitcher.tsx` |
| **MultiChainWalletButton** | Chain-aware wallet button | `dapp/src/components/MultiChainWalletButton.tsx` |

### Provider Hierarchy

```
<ErrorBoundary>
  <ThemeProvider>
    <ChainProvider>           ← NEW: Manages active chain
      <SessionProvider>
        <AptosWalletProvider>  ← Existing Aptos wallet
          <SuiWalletProvider>  ← NEW: Sui wallet integration
            <SDKProvider>
              {/* App content */}
            </SDKProvider>
          </SuiWalletProvider>
        </AptosWalletProvider>
      </SessionProvider>
    </ChainProvider>
  </ThemeProvider>
</ErrorBoundary>
```

---

## Configuration

### Environment Variables

Update your `.env` file to specify active chains:

```bash
# Active Chains (comma-separated: 'aptos', 'sui', or 'aptos,sui')
VITE_ACTIVE_CHAINS=aptos

# Or for multi-chain:
VITE_ACTIVE_CHAINS=aptos,sui

# Aptos Configuration (required if using Aptos)
VITE_APTOS_MODULE_ADDRESS=0x...
VITE_APTOS_NETWORK=testnet

# Sui Configuration (required if using Sui)
VITE_SUI_PACKAGE_ID=0x...
VITE_SUI_NETWORK=testnet
```

**Configuration Scenarios:**

1. **Aptos Only:**
   ```bash
   VITE_ACTIVE_CHAINS=aptos
   VITE_APTOS_MODULE_ADDRESS=0x...
   # Sui vars not needed
   ```

2. **Sui Only:**
   ```bash
   VITE_ACTIVE_CHAINS=sui
   VITE_SUI_PACKAGE_ID=0x...
   # Aptos vars not needed
   ```

3. **Multi-Chain:**
   ```bash
   VITE_ACTIVE_CHAINS=aptos,sui
   VITE_APTOS_MODULE_ADDRESS=0x...
   VITE_SUI_PACKAGE_ID=0x...
   # Both required
   ```

---

## Usage

### 1. ChainContext Hook

Access the active chain and switch functionality:

```typescript
import { useChain } from '../contexts/ChainContext';

function MyComponent() {
  const { activeChain, setActiveChain, availableChains, isChainAvailable } = useChain();

  return (
    <div>
      <p>Current chain: {activeChain}</p>

      {isChainAvailable('sui') && (
        <button onClick={() => setActiveChain('sui')}>
          Switch to Sui
        </button>
      )}
    </div>
  );
}
```

**API:**
- `activeChain: 'aptos' | 'sui'` - Currently selected chain
- `setActiveChain(chain)` - Switch to a different chain
- `availableChains: Chain[]` - List of configured chains
- `isChainAvailable(chain)` - Check if a chain is available

---

### 2. Aptos Wallet (Existing)

No changes to Aptos wallet usage:

```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';

function MyComponent() {
  const { account, connect, disconnect, connected } = useWallet();

  // Use as before
}
```

---

### 3. Sui Wallet (New)

Access Sui wallet functionality:

```typescript
import { useSuiWallet } from '../contexts/SuiWalletContext';

function MyComponent() {
  const { account, connected, disconnect, getSuiClient } = useSuiWallet();

  const handleTransaction = async () => {
    const client = getSuiClient();
    // Use Sui client for transactions
  };

  return (
    <div>
      {connected && <p>Sui Address: {account?.address}</p>}
    </div>
  );
}
```

**Note:** For connecting wallets, use the built-in `SuiConnectButton`:

```typescript
import { SuiConnectButton } from '../contexts/SuiWalletContext';

function MyComponent() {
  return <SuiConnectButton />;
}
```

---

### 4. Chain Switcher Component

Add to any part of your UI:

```typescript
import { ChainSwitcher } from '../components/ChainSwitcher';

function MyComponent() {
  return (
    <div>
      <ChainSwitcher />
    </div>
  );
}
```

**Features:**
- Automatically hides if only one chain is available
- Shows icons and labels for each chain
- Persists selection to localStorage
- Emits `chainChanged` custom event

---

### 5. Multi-Chain Wallet Button

Replace existing wallet buttons with the multi-chain version:

```typescript
import { MultiChainWalletButton } from '../components/MultiChainWalletButton';

function MyComponent() {
  return (
    <div>
      <MultiChainWalletButton />
    </div>
  );
}
```

**Behavior:**
- Shows Aptos wallet UI when Aptos is active
- Shows Sui wallet UI when Sui is active
- Automatically adapts to chain changes

---

## Chain-Aware Development

### Pattern 1: Conditional Rendering

Render different UI based on active chain:

```typescript
import { useChain } from '../contexts/ChainContext';

function MarketCard() {
  const { activeChain } = useChain();

  return (
    <div>
      {activeChain === 'aptos' && (
        <AptosMarketDetails />
      )}

      {activeChain === 'sui' && (
        <SuiMarketDetails />
      )}
    </div>
  );
}
```

---

### Pattern 2: Chain-Specific Hooks

Create hooks that adapt to the active chain:

```typescript
import { useChain } from '../contexts/ChainContext';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useSuiWallet } from '../contexts/SuiWalletContext';

function useActiveWallet() {
  const { activeChain } = useChain();
  const aptosWallet = useAptosWallet();
  const suiWallet = useSuiWallet();

  return activeChain === 'aptos' ? aptosWallet : suiWallet;
}

// Usage
function MyComponent() {
  const { account, connected } = useActiveWallet();

  return <div>{account?.address}</div>;
}
```

---

### Pattern 3: Listen to Chain Changes

React to chain switching:

```typescript
useEffect(() => {
  const handleChainChange = (event: CustomEvent) => {
    console.log('Chain changed to:', event.detail.chain);
    // Refresh data, clear cache, etc.
  };

  window.addEventListener('chainChanged', handleChainChange as EventListener);

  return () => {
    window.removeEventListener('chainChanged', handleChainChange as EventListener);
  };
}, []);
```

---

## Testing

### Manual Testing Checklist

#### Aptos Only Configuration
- [ ] Set `VITE_ACTIVE_CHAINS=aptos`
- [ ] App starts without errors
- [ ] ChainSwitcher is hidden (only one chain)
- [ ] Aptos wallet connection works
- [ ] Can connect Petra wallet
- [ ] Can connect Martian wallet
- [ ] Can disconnect wallet
- [ ] Session persists on reload

#### Sui Only Configuration
- [ ] Set `VITE_ACTIVE_CHAINS=sui`
- [ ] App starts without errors
- [ ] ChainSwitcher is hidden
- [ ] Sui wallet connection works
- [ ] SuiConnectButton appears
- [ ] Can connect Sui wallet
- [ ] Can disconnect wallet

#### Multi-Chain Configuration
- [ ] Set `VITE_ACTIVE_CHAINS=aptos,sui`
- [ ] App starts without errors
- [ ] ChainSwitcher appears in header
- [ ] Default chain is Aptos
- [ ] Can switch from Aptos to Sui
- [ ] Can switch from Sui to Aptos
- [ ] Wallet button changes based on chain
- [ ] Chain selection persists on reload
- [ ] Connecting Aptos wallet on Aptos chain works
- [ ] Connecting Sui wallet on Sui chain works
- [ ] Switching chains while connected works

### Browser Console Testing

```javascript
// Check active chain
const chain = localStorage.getItem('selectedChain');
console.log('Active chain:', chain);

// Listen for chain changes
window.addEventListener('chainChanged', (e) => {
  console.log('Chain changed:', e.detail.chain);
});

// Check environment config
console.log('Active chains:', import.meta.env.VITE_ACTIVE_CHAINS);
```

---

## Migration from Old Setup

### Step 1: Update Environment Variables

**Before:**
```bash
VITE_MODULE_ADDRESS=0x...
VITE_NETWORK=testnet
```

**After:**
```bash
VITE_ACTIVE_CHAINS=aptos
VITE_APTOS_MODULE_ADDRESS=0x...
VITE_APTOS_NETWORK=testnet
```

### Step 2: Update Code References

**Before:**
```typescript
import { env } from '../config/env';
const address = env.contractAddress;
```

**After:**
```typescript
import { env } from '../config/env';
const address = env.aptosModuleAddress;
```

### Step 3: Update Wallet Usage

**Existing Aptos wallet code works unchanged!** No migration needed for:
- `useWallet()` hook
- `connect()` / `disconnect()` functions
- Wallet modal components

**Optional:** Upgrade to `MultiChainWalletButton` for better UX:

**Before:**
```typescript
import WalletButton from '../components/WalletButton';

<WalletButton />
```

**After:**
```typescript
import { MultiChainWalletButton } from '../components/MultiChainWalletButton';

<MultiChainWalletButton />
```

---

## Troubleshooting

### ChainSwitcher Not Appearing

**Cause:** Only one chain configured
**Solution:** Set `VITE_ACTIVE_CHAINS=aptos,sui` and configure both chains

---

### Wallet Connection Fails

**Cause:** Wrong chain selected
**Solution:** Ensure you're on the correct chain before connecting wallet

Check:
```typescript
const { activeChain } = useChain();
console.log('Active chain:', activeChain);
```

---

### Chain Selection Not Persisting

**Cause:** localStorage not accessible
**Solution:** Check browser privacy settings, ensure localStorage is enabled

Debug:
```javascript
try {
  localStorage.setItem('test', 'value');
  console.log('localStorage works');
} catch (e) {
  console.error('localStorage blocked:', e);
}
```

---

### Sui Wallet Not Loading

**Cause:** Missing Sui configuration
**Solution:** Ensure `VITE_SUI_PACKAGE_ID` is set

Check:
```typescript
import { env } from '../config/env';
console.log('Sui config:', {
  packageId: env.suiPackageId,
  network: env.suiNetwork,
  active: env.activeChains.includes('sui')
});
```

---

### React Query Conflicts

**Cause:** Multiple QueryClientProvider instances
**Solution:** The SuiWalletProvider has its own QueryClient. This is intentional and won't conflict with the main app QueryClient.

---

## Performance Considerations

### Lazy Loading

Wallet providers are always loaded, but you can lazy load chain-specific components:

```typescript
const SuiMarketDetails = lazy(() => import('./SuiMarketDetails'));

function MarketView() {
  const { activeChain } = useChain();

  return (
    <Suspense fallback={<Loading />}>
      {activeChain === 'sui' && <SuiMarketDetails />}
    </Suspense>
  );
}
```

### Bundle Size

The Sui wallet integration adds approximately:
- `@mysten/sui`: ~150KB
- `@mysten/dapp-kit`: ~80KB
- **Total:** ~230KB (gzipped: ~70KB)

This is acceptable for multi-chain support.

---

## Advanced Usage

### Custom Chain Icons

Update `ChainSwitcher.tsx`:

```typescript
const getChainIcon = (chain: Chain): string => {
  switch (chain) {
    case 'aptos':
      return '🔷'; // Or import actual icon
    case 'sui':
      return '💧'; // Or import actual icon
    default:
      return '•';
  }
};
```

### Chain-Specific Styling

```typescript
const { activeChain } = useChain();

const chainColors = {
  aptos: 'border-blue-500',
  sui: 'border-cyan-500',
};

return (
  <div className={`border-2 ${chainColors[activeChain]}`}>
    {/* Content */}
  </div>
);
```

### Programmatic Chain Switching

```typescript
import { useChain } from '../contexts/ChainContext';

function MyComponent() {
  const { setActiveChain } = useChain();

  const handleSwitchToOptimalChain = () => {
    // Your logic here
    const optimal = determineOptimalChain();
    setActiveChain(optimal);
  };

  return <button onClick={handleSwitchToOptimalChain}>Auto Switch</button>;
}
```

---

## API Reference

### ChainContext

```typescript
interface ChainContextType {
  activeChain: Chain;                // Current active chain
  setActiveChain: (chain: Chain) => void;  // Switch chain
  availableChains: Chain[];           // List of available chains
  isChainAvailable: (chain: Chain) => boolean;  // Check availability
}

type Chain = 'aptos' | 'sui';
```

### SuiWalletContext

```typescript
interface SuiWalletContextType {
  account: { address: string } | null;  // Connected account
  connected: boolean;                    // Connection status
  connect: () => void;                   // Connect wallet
  disconnect: () => void;                // Disconnect wallet
  getSuiClient: () => SuiClient;        // Get Sui client
}
```

---

## Best Practices

### 1. Always Check Chain Availability

```typescript
const { isChainAvailable } = useChain();

if (isChainAvailable('sui')) {
  // Show Sui features
}
```

### 2. Handle Chain Switches Gracefully

```typescript
useEffect(() => {
  // Reset state when chain changes
  setMarkets([]);
  setSelectedMarket(null);
}, [activeChain]);
```

### 3. Validate Configuration on Startup

```typescript
import { validateEnv } from '../config/env';

// In App.tsx or main.tsx
try {
  validateEnv();
} catch (error) {
  console.error('Environment configuration error:', error);
}
```

### 4. Provide Fallbacks

```typescript
const { activeChain } = useChain();

return (
  <div>
    {activeChain === 'aptos' ? (
      <AptosFeature />
    ) : activeChain === 'sui' ? (
      <SuiFeature />
    ) : (
      <GenericFeature />
    )}
  </div>
);
```

---

## Security Considerations

### 1. Chain Validation

Always validate the active chain before executing transactions:

```typescript
const { activeChain } = useChain();

const executeTx = async () => {
  if (activeChain !== 'aptos') {
    throw new Error('This transaction requires Aptos');
  }
  // Execute Aptos transaction
};
```

### 2. Wallet Verification

Ensure the wallet matches the active chain:

```typescript
const { activeChain } = useChain();
const { connected: aptosConnected } = useWallet();
const { connected: suiConnected } = useSuiWallet();

const isWalletValid =
  (activeChain === 'aptos' && aptosConnected) ||
  (activeChain === 'sui' && suiConnected);
```

### 3. Transaction Context

Always pass chain context to backend:

```typescript
const createMarket = async (data) => {
  const { activeChain } = useChain();

  const response = await fetch('/api/markets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      chain: activeChain,  // Include chain context
    }),
  });
};
```

---

## Future Enhancements

Potential improvements for future iterations:

1. **Chain-Specific Themes**
   - Different color schemes per chain
   - Chain-specific branding

2. **Cross-Chain Bridge UI**
   - Transfer assets between chains
   - Unified balance view

3. **Multi-Chain Analytics**
   - Compare metrics across chains
   - Aggregate statistics

4. **Chain Health Monitoring**
   - Network status indicators
   - Gas price tracking

---

## Support

### Resources
- [Aptos Wallet Adapter Docs](https://github.com/aptos-labs/aptos-wallet-adapter)
- [Sui dApp Kit Docs](https://sdk.mystenlabs.com/dapp-kit)
- [Project STATUS.md](STATUS.md)
- [Environment Configuration Guide](dapp/.env.example)

### Common Issues
- See [Troubleshooting](#troubleshooting) section above
- Check browser console for errors
- Verify environment configuration
- Test with devtools network tab

---

**Last Updated:** 2024-10-22
**Version:** 1.0
**Status:** ✅ Production Ready (pending testing)
