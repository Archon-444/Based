# Wallet Connection Display Debug Guide

## Issue
Wallet connection button doesn't show connected state after user connects their wallet. The button continues to show "Connect Wallet" instead of displaying the wallet address and disconnect option.

## Debug Logging Added

I've added comprehensive logging to help diagnose the issue:

### 1. Header Component Logging
**File**: [dapp/src/components/layout/Header.tsx](dapp/src/components/layout/Header.tsx#L22-L30)

```typescript
useEffect(() => {
  console.log('[Header] Wallet State Changed:', {
    connected,
    hasAccount: !!account,
    address: account?.address,
    walletName: activeWallet?.name,
    walletsCount: wallets.length,
  });
}, [account, connected, wallets, activeWallet]);
```

### 2. WalletSessionManager Logging
**File**: [dapp/src/contexts/WalletContext.tsx](dapp/src/contexts/WalletContext.tsx#L31-L39)

```typescript
useEffect(() => {
  console.log('[WalletSessionManager] State:', {
    connected,
    hasAccount: !!account,
    address: account?.address,
    isSessionValid,
  });
}, [connected, account, isSessionValid]);
```

## Testing Instructions

### Step 1: Open the App
1. Navigate to **http://localhost:5173/**
2. Open browser DevTools (F12 or Cmd+Option+I)
3. Go to the **Console** tab

### Step 2: Check Initial State
You should see logs showing:
```
[Header] Wallet State Changed: {
  connected: false,
  hasAccount: false,
  address: undefined,
  walletName: undefined,
  walletsCount: 2
}
```

### Step 3: Connect Wallet
1. Click "Connect Wallet" button
2. Select Petra or Martian wallet
3. Approve the connection in the wallet extension

### Step 4: Analyze Console Logs
After connecting, you should see:

**Expected (Working):**
```
[WalletSessionManager] State: {
  connected: true,
  hasAccount: true,
  address: "0xabc...123",
  isSessionValid: true
}

[Header] Wallet State Changed: {
  connected: true,
  hasAccount: true,
  address: "0xabc...123",
  walletName: "Petra",
  walletsCount: 2
}

[Header] Wallet connected, closing picker
```

**Problematic (If Issue Persists):**
```
[WalletSessionManager] State: {
  connected: false,  // ❌ Still false
  hasAccount: false,
  address: undefined,
  isSessionValid: false
}

[Header] Wallet State Changed: {
  connected: false,  // ❌ Still false
  hasAccount: false,
  address: undefined,
  walletName: undefined,
  walletsCount: 2
}
```

## Common Issues & Solutions

### Issue 1: `connected` stays false
**Symptom**: Logs show `connected: false` even after wallet approval

**Possible Causes**:
1. Wallet extension not properly installed
2. Network mismatch (wallet on mainnet, app on devnet)
3. `autoConnect` interfering with manual connection

**Solution**:
```typescript
// In WalletContext.tsx line 126, try changing:
<AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
```

### Issue 2: `account` is undefined
**Symptom**: `connected: true` but `hasAccount: false`

**Possible Causes**:
1. Wallet connected but account not yet loaded (async delay)
2. Wallet extension permission issue

**Solution**: Add a small delay or loading state
```typescript
if (connected && !account) {
  return <div>Loading wallet...</div>;
}
```

### Issue 3: Session expiring immediately
**Symptom**: Connects briefly then disconnects

**Possible Causes**:
1. SessionContext invalidating too quickly
2. Auto-disconnect on session expiry (line 63 in WalletContext)

**Solution**: Check session timeout settings in SessionContext

### Issue 4: Multiple wallet adapters conflicting
**Symptom**: Inconsistent connection state

**Solution**: Ensure only one wallet is active at a time

## Current Configuration

### Provider Setup
**Location**: [dapp/src/App.tsx](dapp/src/App.tsx#L64-L68)

```typescript
<ErrorBoundary>
  <ThemeProvider>
    <SessionProvider>
      <AptosWalletProvider>  // ✅ Correctly placed
        <SDKProvider>
          <Router>
            <Header />  // ✅ Can access wallet context
```

### Wallet Adapters
**Location**: [dapp/src/contexts/WalletContext.tsx](dapp/src/contexts/WalletContext.tsx#L69-L88)

```typescript
const wallets = useMemo(() => {
  if (typeof window === 'undefined') {
    return [];
  }

  const adapters = [];
  try {
    adapters.push(new PetraWallet());
  } catch (error) {
    console.warn('[WalletProvider] Failed to initialize Petra wallet adapter:', error);
  }

  try {
    adapters.push(new MartianWallet());
  } catch (error) {
    console.warn('[WalletProvider] Failed to initialize Martian wallet adapter:', error);
  }

  return adapters;
}, []);
```

### Auto-Connect Setting
**Location**: [dapp/src/contexts/WalletContext.tsx](dapp/src/contexts/WalletContext.tsx#L126)

```typescript
<AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
```

**⚠️ Note**: `autoConnect={true}` might cause issues. Consider setting to `false` if problems persist.

## Next Steps

1. **Run the app**: Visit http://localhost:5173/
2. **Open console**: Press F12
3. **Connect wallet**: Click "Connect Wallet" button
4. **Copy console logs**: Share the output with me

Based on the console logs, I can determine:
- If the wallet is connecting at all
- If the state is updating correctly
- Where the issue is occurring (Header vs WalletContext vs SessionContext)

## Quick Fix Options

### Option 1: Disable autoConnect (Recommended)
```typescript
// WalletContext.tsx line 126
<AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
```

### Option 2: Add Loading State
```typescript
// Header.tsx
{connected ? (
  account?.address ? (
    // Show wallet info
  ) : (
    <div>Loading wallet...</div>
  )
) : (
  <Button>Connect Wallet</Button>
)}
```

### Option 3: Force Re-render on Connection
```typescript
// Header.tsx
const [forceUpdate, setForceUpdate] = useState(0);

useEffect(() => {
  if (connected && account) {
    setForceUpdate(prev => prev + 1);
  }
}, [connected, account]);
```

## Share These Logs

When you connect your wallet, please share:

1. ✅ All `[Header]` logs
2. ✅ All `[WalletSessionManager]` logs
3. ✅ Any error messages
4. ✅ Network tab (if requests are failing)

This will help me identify the exact issue and provide a targeted fix.

---

**Created**: 2025-10-17
**Status**: Debug logging active, awaiting test results
**App URL**: http://localhost:5173/
