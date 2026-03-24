# Chain-Aware Wallet Selection - Detailed Specification

## 1. EXECUTIVE SUMMARY

**Problem:** When users switch between Aptos and Sui networks, the wallet selection UI does not update to show the appropriate wallets for the selected chain.

**Solution:** Implement chain-aware wallet management that automatically:
- Displays only wallets compatible with the selected chain
- Disconnects current wallet when switching chains
- Updates UI to reflect the active chain's wallet state
- Persists wallet preferences per chain

---

## 2. CURRENT STATE ANALYSIS

### 2.1 Current Architecture

```
App.tsx
  ├── ChainProvider (activeChain: 'aptos' | 'sui')
  ├── AptosWalletProvider (Petra, Martian)
  ├── SuiWalletProvider (Sui Wallet, Ethos, Suiet)
  └── Header
       ├── useWallet() ← ALWAYS APTOS (Bug)
       └── WalletModal ← ALWAYS SHOWS APTOS WALLETS (Bug)
```

### 2.2 Problems Identified

| Issue | Location | Impact |
|-------|----------|--------|
| Header uses Aptos-only hook | `Header.tsx:17` | Always shows Aptos wallet state |
| WalletModal not chain-aware | `WalletModal.tsx:59` | Only displays Aptos wallets |
| MultiChainWalletButton unused | `MultiChainWalletButton.tsx` | Correct implementation ignored |
| No auto-disconnect on chain switch | N/A | User remains connected to wrong chain |

---

## 3. DESIRED USER EXPERIENCE (UX)

### 3.1 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ SCENARIO 1: User on Aptos, Petra Wallet Connected          │
└─────────────────────────────────────────────────────────────┘

1. User sees: [Aptos ▼] [0x1234...abcd ⚡ 10.5 APT]
2. User clicks Chain Switcher → Selects "Sui"
3. System Actions:
   ✓ Disconnect Petra wallet
   ✓ Show notification: "Switched to Sui network. Please connect a Sui wallet."
   ✓ Update header to: [Sui ▼] [Connect Wallet]
4. User clicks "Connect Wallet"
5. Modal shows: ✓ Sui Wallet, ✓ Ethos, ✓ Suiet
              ✗ Petra (hidden), ✗ Martian (hidden)
6. User connects Sui Wallet
7. Header shows: [Sui ▼] [0xabcd...1234 ⚡ 5.2 SUI]

┌─────────────────────────────────────────────────────────────┐
│ SCENARIO 2: User on Sui, No Wallet Connected               │
└─────────────────────────────────────────────────────────────┘

1. User sees: [Sui ▼] [Connect Wallet]
2. User clicks "Connect Wallet"
3. Modal shows ONLY Sui wallets:
   - Sui Wallet (if installed)
   - Ethos (loadable)
   - Suiet (loadable)
   - Nightly (loadable)
4. User connects wallet
5. User switches to Aptos
6. System disconnects Sui wallet
7. Modal now shows ONLY Aptos wallets:
   - Petra (if installed)
   - Martian (if installed)
   - Fewcha (loadable)
   - Pontem (loadable)

┌─────────────────────────────────────────────────────────────┐
│ SCENARIO 3: Fresh User, No Chain Preference                │
└─────────────────────────────────────────────────────────────┘

1. App loads with default chain (Aptos, from env)
2. Header shows: [Aptos ▼] [Connect Wallet]
3. User clicks "Connect Wallet"
4. Modal shows Aptos wallets
5. localStorage.chainPreference = 'aptos'
6. On next visit, app loads with Aptos pre-selected
```

### 3.2 UI States

| State | Chain Switcher | Wallet Button | Wallet Modal | Notes |
|-------|----------------|---------------|--------------|-------|
| **Initial Load** | Shows active chain | "Connect Wallet" | Not visible | Default to env config |
| **Connected (Aptos)** | "Aptos ▼" | Shows address + balance | Not visible | Aptos wallet connected |
| **Connected (Sui)** | "Sui ▼" | Shows address + balance | Not visible | Sui wallet connected |
| **Switching Chains** | Updates immediately | Shows "Connect Wallet" | Not visible | Auto-disconnects old wallet |
| **Modal Open (Aptos)** | "Aptos ▼" | "Connect Wallet" | Shows Aptos wallets | Filters to Aptos only |
| **Modal Open (Sui)** | "Sui ▼" | "Connect Wallet" | Shows Sui wallets | Filters to Sui only |

### 3.3 Visual Design Specifications

#### Header Wallet Button States

```
┌─────────────────────────────────────────────────────────────┐
│ STATE: Not Connected (Aptos Selected)                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [🔗] Connect Wallet                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Text: White (#FFFFFF)                                        │
│ Background: Primary Blue (#3B82F6)                           │
│ Icon: Link icon                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STATE: Connected to Aptos (Petra)                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Petra Icon] 0x1234...abcd  ⚡ 10.5 APT  [↓]            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Shows: Wallet icon, truncated address, balance, dropdown     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STATE: Connected to Sui (Sui Wallet)                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Sui Icon] 0xabcd...1234  ⚡ 5.2 SUI  [↓]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Shows: Wallet icon, truncated address, balance, dropdown     │
└─────────────────────────────────────────────────────────────┘
```

#### Wallet Selection Modal

```
┌────────────────────────────────────────────────────────────┐
│  Connect Wallet - Aptos Network                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Installed Wallets                                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ [Petra Logo]  Petra Wallet           [Connect] │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ [Martian Logo] Martian Wallet        [Connect] │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  More Wallets                                         │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ [Fewcha Logo]  Fewcha Wallet         [Install] │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ [Pontem Logo]  Pontem Wallet         [Install] │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  🔒 Make sure you trust the wallet before connecting        │
└────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────┐
│  Connect Wallet - Sui Network                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Installed Wallets                                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ [Sui Logo]     Sui Wallet            [Connect] │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  More Wallets                                         │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ [Ethos Logo]   Ethos Wallet          [Install] │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ [Suiet Logo]   Suiet Wallet          [Install] │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ [Nightly Logo] Nightly Wallet        [Install] │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  🔒 Make sure you trust the wallet before connecting        │
└────────────────────────────────────────────────────────────┘
```

---

## 4. TECHNICAL IMPLEMENTATION

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  NEW ARCHITECTURE                                            │
└─────────────────────────────────────────────────────────────┘

App.tsx
  ├── ChainProvider (activeChain: 'aptos' | 'sui')
  │    └── Fires 'chainChanged' event
  ├── AptosWalletProvider
  ├── SuiWalletProvider
  └── Header
       ├── MultiChainWalletButton ← NEW: Chain-aware wrapper
       │    ├── useChain() ← Reads activeChain
       │    ├── useWallet() (Aptos) ← Only when activeChain === 'aptos'
       │    └── useSuiWallet() ← Only when activeChain === 'sui'
       └── ChainAwareWalletModal ← NEW: Filters wallets by chain
            ├── When activeChain === 'aptos':
            │    └── Show: Petra, Martian, Fewcha, Pontem
            └── When activeChain === 'sui':
                 └── Show: Sui Wallet, Ethos, Suiet, Nightly
```

### 4.2 Component Changes Required

#### 4.2.1 Header.tsx - Use MultiChainWalletButton

**Current:**
```tsx
// Line 17: Direct Aptos hook
const { account, disconnect, connected } = useWallet();
```

**New:**
```tsx
// Import MultiChainWalletButton
import { MultiChainWalletButton } from '../MultiChainWalletButton';

// Replace wallet button rendering with:
<MultiChainWalletButton />
```

#### 4.2.2 Create ChainAwareWalletModal.tsx

**New Component:** `/dapp/src/components/wallet/ChainAwareWalletModal.tsx`

```tsx
import { useChain } from '../../contexts/ChainContext';
import { AptosWalletModal } from './AptosWalletModal';
import { SuiWalletModal } from './SuiWalletModal';

export function ChainAwareWalletModal({ open, onClose }) {
  const { activeChain } = useChain();

  if (activeChain === 'aptos') {
    return <AptosWalletModal open={open} onClose={onClose} />;
  } else if (activeChain === 'sui') {
    return <SuiWalletModal open={open} onClose={onClose} />;
  }

  return null;
}
```

#### 4.2.3 Refactor WalletModal.tsx → AptosWalletModal.tsx

**Current:** `WalletModal.tsx` (Aptos-only)
**New:** Rename to `AptosWalletModal.tsx` (explicit Aptos modal)

No logic changes needed, just rename and clarify purpose.

#### 4.2.4 Create SuiWalletModal.tsx

**New Component:** `/dapp/src/components/wallet/SuiWalletModal.tsx`

Use `@mysten/dapp-kit`'s built-in `ConnectModal` component or create custom UI similar to AptosWalletModal.

```tsx
import { ConnectModal } from '@mysten/dapp-kit';
import { useSuiWallet } from '../../contexts/SuiWalletContext';

export function SuiWalletModal({ open, onClose }) {
  return (
    <ConnectModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    />
  );
}
```

#### 4.2.5 Update MultiChainWalletButton.tsx

**Enhancements needed:**

1. **Add auto-disconnect on chain switch:**

```tsx
// Add effect to listen for chain changes
useEffect(() => {
  const handleChainChange = () => {
    // Disconnect both wallets when chain changes
    if (aptosConnected) {
      aptosDisconnect();
    }
    if (suiConnected) {
      suiDisconnect();
    }
  };

  window.addEventListener('chainChanged', handleChainChange);
  return () => window.removeEventListener('chainChanged', handleChainChange);
}, [aptosConnected, suiConnected, aptosDisconnect, suiDisconnect]);
```

2. **Add notification on chain switch:**

```tsx
// Show toast notification
if (chainJustSwitched) {
  toast.info(`Switched to ${activeChain.toUpperCase()} network. Please connect a wallet.`);
}
```

#### 4.2.6 Update ChainSwitcher.tsx

**Add confirmation before switch if wallet connected:**

```tsx
const handleChainSwitch = (newChain) => {
  if (connected) {
    if (window.confirm(
      `Switching chains will disconnect your current wallet. Continue?`
    )) {
      setActiveChain(newChain);
    }
  } else {
    setActiveChain(newChain);
  }
};
```

### 4.3 State Management

#### 4.3.1 ChainContext Enhancements

**Add to ChainContext.tsx:**

```tsx
interface ChainContextType {
  activeChain: Chain;
  availableChains: Chain[];
  setActiveChain: (chain: Chain) => void;
  isChainAvailable: (chain: Chain) => boolean;
  // NEW:
  walletConnected: boolean;
  setWalletConnected: (connected: boolean) => void;
}
```

#### 4.3.2 Session Persistence

**localStorage Keys:**
- `selectedChain` - Current active chain ('aptos' | 'sui')
- `aptos_lastWallet` - Last used Aptos wallet name
- `sui_lastWallet` - Last used Sui wallet name
- `aptos_autoConnect` - Auto-connect preference for Aptos
- `sui_autoConnect` - Auto-connect preference for Sui

**Behavior:**
- When user switches chain, persist preference
- On app load, restore last used chain
- Per-chain wallet preferences are remembered
- Auto-reconnect only works for same chain

### 4.4 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  USER INTERACTION: Switch from Aptos to Sui                 │
└─────────────────────────────────────────────────────────────┘

1. User clicks ChainSwitcher
2. ChainSwitcher.onClick()
   └─> ChainContext.setActiveChain('sui')
        ├─> localStorage.setItem('selectedChain', 'sui')
        ├─> Dispatch 'chainChanged' event
        └─> Re-render all consumers

3. MultiChainWalletButton hears 'chainChanged'
   └─> useEffect() triggered
        ├─> Call aptosDisconnect()
        ├─> Clear Aptos wallet session
        └─> Show notification: "Switched to Sui"

4. Header.tsx re-renders
   └─> MultiChainWalletButton detects activeChain === 'sui'
        ├─> Stops rendering AptosWalletButton
        ├─> Starts rendering SuiWalletButtonWrapper
        └─> Shows "Connect Wallet" (not connected)

5. User clicks "Connect Wallet"
   └─> SuiWalletButtonWrapper.onClick()
        └─> Open SuiWalletModal
             └─> Shows only Sui wallets:
                  - Sui Wallet
                  - Ethos
                  - Suiet
                  - Nightly

6. User connects Sui Wallet
   └─> SuiWalletContext updates
        ├─> suiWallet.connected = true
        ├─> suiWallet.address = '0x...'
        └─> localStorage.setItem('sui_lastWallet', 'Sui Wallet')

7. Header updates
   └─> Shows: [Sui ▼] [Sui Icon] 0xabcd...1234  ⚡ 5.2 SUI
```

---

## 5. IMPLEMENTATION STEPS

### Phase 1: Refactoring (File Organization)

```bash
Step 1.1: Rename WalletModal.tsx → AptosWalletModal.tsx
  - File: dapp/src/components/wallet/WalletModal.tsx
  - New:  dapp/src/components/wallet/AptosWalletModal.tsx
  - Update all imports

Step 1.2: Create SuiWalletModal.tsx
  - File: dapp/src/components/wallet/SuiWalletModal.tsx
  - Implement using @mysten/dapp-kit ConnectModal

Step 1.3: Create ChainAwareWalletModal.tsx
  - File: dapp/src/components/wallet/ChainAwareWalletModal.tsx
  - Route to AptosWalletModal or SuiWalletModal based on activeChain
```

### Phase 2: Update Header Component

```bash
Step 2.1: Modify Header.tsx
  - Remove direct useWallet() import from @aptos-labs/wallet-adapter-react
  - Import MultiChainWalletButton
  - Replace wallet button JSX with <MultiChainWalletButton />

Step 2.2: Update imports in Header.tsx
  - Add: import { MultiChainWalletButton } from '../MultiChainWalletButton'
  - Remove Aptos-specific wallet code
```

### Phase 3: Enhance MultiChainWalletButton

```bash
Step 3.1: Add auto-disconnect on chain switch
  - Listen for 'chainChanged' event
  - Call disconnect() for current wallet
  - Clear session storage

Step 3.2: Add notification system
  - Install/use existing toast library
  - Show message when chain switches
  - Show message when wallet disconnects

Step 3.3: Improve wallet state management
  - Track which chain's wallet is connected
  - Prevent showing wrong chain's wallet info
```

### Phase 4: Update ChainSwitcher

```bash
Step 4.1: Add confirmation dialog
  - Check if wallet is connected before switching
  - Show confirmation: "This will disconnect your wallet"
  - Only switch if user confirms

Step 4.2: Add visual feedback
  - Show loading state while switching
  - Animate chain icon transition
```

### Phase 5: Testing

```bash
Step 5.1: Test Aptos → Sui switch
  - Connect Petra wallet on Aptos
  - Switch to Sui
  - Verify Petra disconnects
  - Verify Sui wallets appear in modal

Step 5.2: Test Sui → Aptos switch
  - Connect Sui Wallet
  - Switch to Aptos
  - Verify Sui Wallet disconnects
  - Verify Aptos wallets appear in modal

Step 5.3: Test persistence
  - Connect wallet on Aptos
  - Refresh page
  - Verify stays on Aptos with wallet connected

Step 5.4: Test edge cases
  - Switch chains multiple times rapidly
  - Open modal while switching chains
  - Connect wallet while chain is switching
```

---

## 6. ACCEPTANCE CRITERIA

### 6.1 Functional Requirements

- [ ] **FR-1:** When activeChain is 'aptos', only Aptos wallets appear in modal
- [ ] **FR-2:** When activeChain is 'sui', only Sui wallets appear in modal
- [ ] **FR-3:** Switching chains auto-disconnects the current wallet
- [ ] **FR-4:** User sees notification when chain switches
- [ ] **FR-5:** Header shows correct wallet info for active chain
- [ ] **FR-6:** Wallet preferences persist per chain in localStorage
- [ ] **FR-7:** Page refresh maintains chain and wallet state
- [ ] **FR-8:** Cannot see Aptos wallet info when Sui is active (and vice versa)

### 6.2 UI/UX Requirements

- [ ] **UX-1:** Chain switcher shows confirmation if wallet connected
- [ ] **UX-2:** Smooth animation when switching chains
- [ ] **UX-3:** Clear visual feedback during wallet connection
- [ ] **UX-4:** Modal title shows active chain name
- [ ] **UX-5:** Wallet icons are correct for each chain
- [ ] **UX-6:** No flickering or layout shift during switch
- [ ] **UX-7:** Mobile responsive design works correctly

### 6.3 Technical Requirements

- [ ] **TR-1:** No console errors during chain switching
- [ ] **TR-2:** Event listeners cleaned up properly
- [ ] **TR-3:** No memory leaks from wallet adapters
- [ ] **TR-4:** TypeScript types are correct throughout
- [ ] **TR-5:** All imports resolve correctly after refactoring
- [ ] **TR-6:** Backwards compatible with existing wallet sessions

---

## 7. TESTING PLAN

### 7.1 Unit Tests

```typescript
// Test: ChainContext
describe('ChainContext', () => {
  it('should switch active chain', () => {});
  it('should fire chainChanged event', () => {});
  it('should persist chain to localStorage', () => {});
});

// Test: MultiChainWalletButton
describe('MultiChainWalletButton', () => {
  it('should show Aptos button when chain is aptos', () => {});
  it('should show Sui button when chain is sui', () => {});
  it('should disconnect wallet on chain change', () => {});
});

// Test: ChainAwareWalletModal
describe('ChainAwareWalletModal', () => {
  it('should render AptosWalletModal when chain is aptos', () => {});
  it('should render SuiWalletModal when chain is sui', () => {});
  it('should filter wallets by chain', () => {});
});
```

### 7.2 Integration Tests

```typescript
// Test: Full chain switching flow
describe('Chain Switching Integration', () => {
  it('should disconnect Aptos wallet when switching to Sui', async () => {
    // 1. Connect Petra on Aptos
    // 2. Switch to Sui
    // 3. Verify Petra disconnected
    // 4. Verify Sui wallet modal shows
  });

  it('should maintain wallet connection after page refresh', async () => {
    // 1. Connect wallet
    // 2. Refresh page
    // 3. Verify still connected
    // 4. Verify correct chain active
  });
});
```

### 7.3 Manual Testing Checklist

```
[ ] Fresh install flow:
    [ ] Load app first time
    [ ] Default chain is correct
    [ ] Can connect wallet
    [ ] Wallet persists on refresh

[ ] Aptos → Sui flow:
    [ ] Connect Petra wallet
    [ ] Click chain switcher
    [ ] See confirmation dialog
    [ ] Confirm switch
    [ ] Petra disconnects
    [ ] Sui wallets appear
    [ ] Can connect Sui wallet
    [ ] Sui wallet info shows in header

[ ] Sui → Aptos flow:
    [ ] Connect Sui wallet
    [ ] Switch to Aptos
    [ ] Sui disconnects
    [ ] Aptos wallets appear
    [ ] Can connect Aptos wallet

[ ] Edge cases:
    [ ] Rapid chain switching
    [ ] Opening modal during switch
    [ ] Network errors during switch
    [ ] Browser back/forward navigation
    [ ] Multiple tabs open simultaneously
```

---

## 8. ROLLOUT PLAN

### 8.1 Development Phases

**Phase 1 (Day 1):** Refactoring
- Rename WalletModal → AptosWalletModal
- Create SuiWalletModal
- Create ChainAwareWalletModal
- Update imports

**Phase 2 (Day 1):** Header Integration
- Update Header.tsx to use MultiChainWalletButton
- Test basic rendering
- Verify no regressions

**Phase 3 (Day 2):** Auto-disconnect Logic
- Implement chainChanged listener
- Add disconnect logic
- Add notifications
- Test switching behavior

**Phase 4 (Day 2):** Polish & Testing
- Add confirmation dialogs
- Improve animations
- Run full test suite
- Fix bugs

**Phase 5 (Day 3):** QA & Deployment
- Manual testing
- Cross-browser testing
- Mobile testing
- Deploy to staging
- Final production deployment

### 8.2 Rollback Plan

If critical issues arise:
1. Revert Header.tsx to use direct useWallet() hook
2. Restore original WalletModal.tsx
3. Disable Sui chain in VITE_ACTIVE_CHAINS
4. Deploy hotfix
5. Investigate and fix issues
6. Re-deploy with fixes

---

## 9. MONITORING & METRICS

### 9.1 Success Metrics

- **Wallet Connection Rate:** % of users who successfully connect wallet
- **Chain Switch Rate:** % of users who switch chains
- **Connection Errors:** Number of wallet connection failures
- **Session Persistence:** % of returning users with persisted wallet

### 9.2 Error Tracking

Log the following events:
- Chain switch initiated
- Chain switch completed
- Wallet connection attempted
- Wallet connection succeeded
- Wallet connection failed
- Wallet disconnected (manual vs automatic)

---

## 10. FUTURE ENHANCEMENTS

### 10.1 Post-Launch Improvements

- **Auto-reconnect:** Automatically reconnect last used wallet for active chain
- **Multi-wallet:** Support connecting both Aptos and Sui wallets simultaneously
- **Wallet history:** Show recently used wallets first
- **Network switching:** Support testnet/mainnet toggle per chain
- **Deep linking:** URL parameter to specify chain (e.g., ?chain=sui)
- **Wallet recommendations:** Suggest best wallet based on user's OS/browser

### 10.2 Performance Optimizations

- Lazy load wallet adapters only when needed
- Preload wallet modals for faster open
- Cache wallet availability checks
- Optimize re-renders on chain switch

---

## APPENDIX A: File Structure

```
dapp/src/
├── components/
│   ├── layout/
│   │   └── Header.tsx ← UPDATE: Use MultiChainWalletButton
│   ├── wallet/
│   │   ├── AptosWalletModal.tsx ← RENAME from WalletModal.tsx
│   │   ├── SuiWalletModal.tsx ← NEW
│   │   └── ChainAwareWalletModal.tsx ← NEW
│   ├── ChainSwitcher.tsx ← UPDATE: Add confirmation
│   └── MultiChainWalletButton.tsx ← UPDATE: Add auto-disconnect
├── contexts/
│   ├── ChainContext.tsx ← UPDATE: Add walletConnected state
│   ├── WalletContext.tsx (Aptos) ← NO CHANGES
│   └── SuiWalletContext.tsx ← NO CHANGES
└── config/
    └── walletBrands.ts ← NO CHANGES
```

## APPENDIX B: Key Dependencies

```json
{
  "@aptos-labs/wallet-adapter-react": "^3.7.1",
  "@mysten/dapp-kit": "^0.14.28",
  "petra-plugin-wallet-adapter": "^0.4.4",
  "@martianwallet/aptos-wallet-adapter": "^1.0.3"
}
```

## APPENDIX C: Environment Variables

```bash
# Enable both chains
VITE_ACTIVE_CHAINS=aptos,sui

# Aptos Configuration
VITE_APTOS_MODULE_ADDRESS=0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81
VITE_APTOS_NETWORK=testnet

# Sui Configuration
VITE_SUI_PACKAGE_ID=0x0000000000000000000000000000000000000000000000000000000000000000
VITE_SUI_NETWORK=testnet
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Author:** Claude Code Assistant
**Status:** Ready for Implementation
