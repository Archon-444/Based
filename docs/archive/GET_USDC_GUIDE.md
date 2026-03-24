# 💰 How to Get Testnet USDC

You need testnet USDC to place bets on your markets. Here are the methods for both chains:

---

## 🟦 Aptos Testnet USDC

### Method 1: Circle Faucet (Recommended)
Circle provides official testnet USDC for Aptos.

**Step 1:** Go to Circle's faucet
- URL: https://faucet.circle.com
- Select "Aptos Testnet"

**Step 2:** Enter your wallet address
- Copy your Aptos wallet address from Petra/Martian
- Example: `0x99b343076f69086476524bdc410f34284581424eb20679155c34f3e90cfd596f`

**Step 3:** Request USDC
- Click "Get Test USDC"
- You'll receive 10 USDC (or their current limit)
- Wait ~10 seconds for confirmation

**USDC Contract on Aptos:**
```
0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832
```

### Method 2: Aptos Faucet + Manual Transfer
If Circle faucet is rate-limited:

1. **Get APT tokens** from https://faucet.aptoslabs.com
2. **Get USDC** from someone who has testnet USDC
3. Or wait for Circle faucet rate limit to reset (usually 24 hours)

---

## 🔵 Sui Testnet USDC

### Method 1: Circle Faucet (Recommended)
Circle also provides testnet USDC for Sui.

**Step 1:** Go to Circle's faucet
- URL: https://faucet.circle.com
- Select "Sui Testnet"

**Step 2:** Enter your wallet address
- Copy your Sui wallet address from Suiet/Sui Wallet
- Example: `0xd1c482bc55fa881bde37ff2fabc2e18dfa0304e01e7890b6c30e06c00562617f`

**Step 3:** Request USDC
- Click "Get Test USDC"
- You'll receive 10 USDC (or their current limit)
- Wait ~10 seconds for confirmation

**USDC Coin Type on Sui:**
```
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

### Method 2: Sui Faucet + Swap (Alternative)
If you need an alternative:

1. **Get SUI tokens** from https://faucet.sui.io
2. Use a Sui testnet DEX to swap SUI → USDC (if available)
3. Or wait for Circle faucet rate limit to reset

---

## 🔍 Verify Your USDC Balance

### Aptos
**Via Wallet:**
- Open Petra/Martian wallet
- Check "Assets" tab
- Look for USDC balance

**Via Explorer:**
```
https://explorer.aptoslabs.com/account/YOUR_ADDRESS?network=testnet
```
Look for USDC coin in "Coins" section

**Via CLI:**
```bash
aptos account list --account YOUR_ADDRESS --network testnet
```

### Sui
**Via Wallet:**
- Open Suiet/Sui Wallet
- Check main balance view
- Look for USDC

**Via Explorer:**
```
https://suiexplorer.com/address/YOUR_ADDRESS?network=testnet
```
Look for USDC coin object

**Via CLI:**
```bash
sui client objects --address YOUR_ADDRESS
```

---

## 💡 Quick Start Testing

### For Your Admin Wallets

**Aptos Admin:**
```
Address: 0x99b343076f69086476524bdc410f34284581424eb20679155c34f3e90cfd596f

1. Go to: https://faucet.circle.com
2. Select: Aptos Testnet
3. Enter: 0x99b343076f69086476524bdc410f34284581424eb20679155c34f3e90cfd596f
4. Click: Get Test USDC
```

**Sui Admin:**
```
Address: 0xd1c482bc55fa881bde37ff2fabc2e18dfa0304e01e7890b6c30e06c00562617f

1. Go to: https://faucet.circle.com
2. Select: Sui Testnet
3. Enter: 0xd1c482bc55fa881bde37ff2fabc2e18dfa0304e01e7890b6c30e06c00562617f
4. Click: Get Test USDC
```

---

## 🎮 In-App Faucet (Future Feature)

Your DApp may have a built-in faucet feature that:
- Automatically requests USDC from Circle
- Or provides USDC from a treasury for testing
- Check the "Faucet" page in your app

---

## 🐛 Troubleshooting

### Circle Faucet Shows Error
**"Daily limit reached"**
- Wait 24 hours and try again
- Use a different wallet address if you have one
- Each address has its own daily limit

**"Invalid address"**
- Verify you copied the full address
- Check you selected the correct network (Aptos vs Sui)
- Remove any extra spaces

**"Network error"**
- Circle faucet might be down temporarily
- Try again in a few minutes
- Check https://status.circle.com

### USDC Not Showing in Wallet
**Wait a bit:**
- Testnet can be slow sometimes
- Wait 30-60 seconds and refresh

**Check explorer:**
- Search your address on the blockchain explorer
- Verify the USDC transaction went through

**Wrong network?**
- Make sure your wallet is on Testnet, not Mainnet
- Check network selector in wallet

---

## 📊 How Much USDC Do You Need?

### For Testing Betting
- **Minimum bet:** 1 USDC
- **Recommended:** 10-20 USDC per wallet
- **For multiple bets:** 50-100 USDC

### Circle Faucet Limits
- **Per request:** Usually 10 USDC
- **Per day:** Varies by network load
- **Cooldown:** 24 hours between requests

---

## 🔗 Useful Links

### Faucets
- **Circle USDC:** https://faucet.circle.com
- **Aptos Faucet:** https://faucet.aptoslabs.com (for APT tokens)
- **Sui Faucet:** https://faucet.sui.io (for SUI tokens)

### Explorers
- **Aptos:** https://explorer.aptoslabs.com
- **Sui:** https://suiexplorer.com

### Contract Addresses
- **Aptos USDC:** `0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832`
- **Sui USDC:** `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC`

---

## ✅ Quick Checklist

Before requesting USDC:
- [ ] Wallet connected to correct network (Testnet)
- [ ] Wallet address copied correctly
- [ ] Selected correct blockchain on faucet (Aptos vs Sui)
- [ ] Browser not blocking pop-ups (some faucets use them)

After requesting USDC:
- [ ] Wait 30-60 seconds
- [ ] Refresh wallet
- [ ] Check balance in wallet UI
- [ ] Verify transaction on explorer if needed
- [ ] Try placing a small test bet (1-2 USDC)

---

## 🎉 Ready to Bet!

Once you have USDC in your wallet:

1. **Navigate** to your created market
2. **Select** an outcome (Yes/No)
3. **Enter** bet amount (e.g., 5 USDC)
4. **Review** odds and potential payout
5. **Submit** transaction
6. **Wait** for confirmation (~5-10 seconds)
7. **Check** your position in Dashboard

**Happy testing!** 🚀
