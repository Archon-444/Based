# Sui Wallet Connection Debugging Guide

## Step 1: Check if you have a Sui Wallet Extension Installed

Open your browser and check if you have one of these Sui wallet extensions installed:

- **Sui Wallet** (official): https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil
- **Suiet Wallet**: https://chromewebstore.google.com/detail/suiet-sui-wallet/khpkpbbcccdmmclmpigdgddabeilkdpd
- **Ethos Wallet**: https://chromewebstore.google.com/detail/ethos-sui-wallet/mcbigmjiafegjnnogedioegffbooigli

**Install at least one wallet extension** if you don't have any installed.

---

## Step 2: Verify Wallet is on Devnet

1. Click the wallet extension icon in your browser toolbar
2. Look for a network selector (usually in settings or top bar)
3. Make sure it's set to **Devnet** (not Testnet or Mainnet)

---

## Step 3: Browser Console Debugging

1. Open http://localhost:5173 in your browser
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Look for any error messages (red text)

**Check for these specific issues:**

### Issue A: Chain not switching to Sui
Look for log messages like:
```
[ChainContext] Active chain: sui
```

If you see `aptos` instead, the chain switcher isn't working. Make sure you've clicked the chain switcher dropdown and selected "Sui".

### Issue B: Wallet detection errors
Look for errors like:
```
Error: No wallets detected
ConnectModal is not defined
@mysten/dapp-kit error
```

### Issue C: Environment variable errors
Look for warnings like:
```
Missing required environment variables
```

---

## Step 4: Manual Chain Switching

If the chain switcher isn't visible:

1. Open browser console (F12)
2. Type this command:
```javascript
localStorage.setItem('selectedChain', 'sui')
```
3. Refresh the page (F5)
4. Try connecting wallet again

---

## Step 5: Test Wallet Detection

In browser console, type:
```javascript
// Check if Sui wallets are detected
window.suiWallet || window.suietWallet || window.ethosWallet
```

If this returns `undefined`, no Sui wallet is installed or enabled.

---

## Step 6: Verify Environment Variables

In browser console, type:
```javascript
// Check Sui config
console.log('Sui Package ID:', import.meta.env.VITE_SUI_PACKAGE_ID)
console.log('Sui Network:', import.meta.env.VITE_SUI_NETWORK)
console.log('Active Chains:', import.meta.env.VITE_ACTIVE_CHAINS)
```

Expected output:
```
Sui Package ID: 0x10dff5b48f1ea4cf9ad452a7a4b7a35719e890554ab9788029713d32df77dce3
Sui Network: devnet
Active Chains: aptos,sui
```

---

## Common Fixes

### Fix 1: No Sui Wallet Installed
**Problem**: No popup appears because no wallet extension is installed.

**Solution**: Install one of the Sui wallets listed in Step 1, then restart your browser.

### Fix 2: Wrong Network
**Problem**: Wallet is on Testnet or Mainnet instead of Devnet.

**Solution**: Open wallet extension → Settings → Network → Select "Devnet"

### Fix 3: Chain Not Switching
**Problem**: App is still on Aptos chain when you click Connect.

**Solution**:
1. Look for a chain switcher button (usually in the header)
2. Click it and select "Sui"
3. The button text should change to show "SUI" or Sui logo
4. Then try connecting wallet

### Fix 4: Modal Not Opening
**Problem**: ConnectModal from @mysten/dapp-kit not rendering.

**Solution**: Kill and restart frontend dev server:
```bash
# In terminal, press Ctrl+C to stop
# Then run:
cd dapp && npm run dev
```

---

## What to Look For in Console

When you click "Connect Wallet" on the Sui chain, you should see:

✅ **Expected logs:**
```
[ChainContext] Active chain: sui
[Header] Wallet State Changed: { activeChain: 'sui', connected: false, ... }
```

❌ **Error indicators:**
```
[ChainContext] Active chain: aptos  ← Wrong! Should be 'sui'
Error: @mysten/dapp-kit not found
ConnectModal is not defined
```

---

## Still Not Working?

If you've tried all the above and still can't connect:

1. **Share the console output**:
   - Copy any error messages from browser console
   - Take a screenshot of the console

2. **Verify installations**:
   ```bash
   cd dapp
   npm list @mysten/dapp-kit @mysten/sui
   ```

3. **Try a clean restart**:
   ```bash
   # Stop all servers (Ctrl+C in each terminal)
   # Kill any lingering processes
   killall node

   # Restart backend
   cd backend && PORT=3001 npm run dev

   # Restart frontend
   cd dapp && npm run dev
   ```

4. **Check if ChainSwitcher component exists**:
   The app should have a chain selector in the header. Look for a button or dropdown that says "Aptos" or has a chain icon. Click it to switch to "Sui".

---

## Expected Behavior When Working

When everything is configured correctly:

1. ✅ You open http://localhost:5173
2. ✅ You see a chain switcher in the header (shows "Aptos" or "Sui")
3. ✅ You click the switcher and select "Sui"
4. ✅ The UI updates to show Sui branding/colors
5. ✅ You click "Connect Wallet"
6. ✅ A modal opens showing detected Sui wallets
7. ✅ You click your wallet (e.g., "Sui Wallet")
8. ✅ The browser extension opens asking for approval
9. ✅ You approve
10. ✅ The modal closes and your address appears in the header

---

Report back with:
- What you see in the console
- Which step fails
- Any error messages
