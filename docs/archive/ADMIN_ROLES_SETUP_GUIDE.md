# Admin Roles Setup Guide

This guide explains how to grant admin roles to wallets on both Aptos and Sui chains without using hard-coded allowlists. All roles are stored on-chain and synced to the backend.

## Overview

**Aptos Admin Wallet:** `0x99b343076f69086476524bdc410f34284581424eb20679155c34f3e90cfd596f`
**Sui Admin Wallet:** `0xd1c482bc55fa881bde37ff2fabc2e18dfa0304e01e7890b6c30e06c00562617f`

---

## ✅ Completed Steps

### 1. Grant Admin Role on Aptos

**Status:** ✅ **COMPLETED**

The admin role has been successfully granted on-chain.

**Transaction Hash:** `0x2f54c9cf4b73b496533ec6ffdd1d6a9adfe1addc297dd0db530e7b2e707aabb3`
**Explorer:** https://explorer.aptoslabs.com/txn/0x2f54c9cf4b73b496533ec6ffdd1d6a9adfe1addc297dd0db530e7b2e707aabb3?network=testnet

**Verification:**
```bash
# Verify the role was granted
aptos move view \
  --function-id 0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81::access_control::get_user_roles \
  --args address:0x99b343076f69086476524bdc410f34284581424eb20679155c34f3e90cfd596f \
  --profile testnet-deploy
```

**Expected Result:** `["0x00"]` (ROLE_ADMIN)

---

### 2. Grant Admin Role on Sui

**Status:** ✅ **COMPLETED**

The admin role has been successfully granted on-chain.

**Transaction Digest:** `HFH9AMctJ7x4mUTWnZpe3SL7DrR7WJFodhBCvHeeTvpK`
**Explorer:** https://suiexplorer.com/txblock/HFH9AMctJ7x4mUTWnZpe3SL7DrR7WJFodhBCvHeeTvpK?network=testnet

**Verification:**
You can verify the role in the Sui Explorer by viewing the RoleRegistry object:
https://suiexplorer.com/object/0x45a425fe9b5c6120b046bffa91fe6bba43758503676cd2e24e390f0a7f5b30b3?network=testnet

---

## 📋 Remaining Steps

### 3. Sync Backend Roles

**Status:** ⏳ **PENDING**

After starting your backend server, you need to sync the on-chain roles to the backend database.

#### Start the Backend

```bash
cd backend
npm run dev
```

#### Sync Roles for Both Wallets

**Option 1: Using the provided script (RECOMMENDED)**

```bash
./scripts/sync-backend-roles.sh
```

**Option 2: Manual API calls**

```bash
# Sync Aptos wallet
curl -X POST http://localhost:3000/roles/sync \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x99b343076f69086476524bdc410f34284581424eb20679155c34f3e90cfd596f",
    "chain": "aptos",
    "actor": "admin"
  }'

# Sync Sui wallet
curl -X POST http://localhost:3000/roles/sync \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xd1c482bc55fa881bde37ff2fabc2e18dfa0304e01e7890b6c30e06c00562617f",
    "chain": "sui",
    "actor": "admin"
  }'
```

**Expected Response:**
```json
{
  "walletAddress": "0x99b343076f69086476524bdc410f34284581424eb20679155c34f3e90cfd596f",
  "roles": ["ROLE_ADMIN"],
  "chain": "aptos",
  "syncedAt": "2025-10-27T..."
}
```

---

### 4. Verify in Admin UI

**Status:** ⏳ **PENDING**

Once the backend sync is complete:

1. Open your Admin Roles UI
2. Search for the Aptos wallet: `0x99b343076f69086476524bdc410f34284581424eb20679155c34f3e90cfd596f`
3. Search for the Sui wallet: `0xd1c482bc55fa881bde37ff2fabc2e18dfa0304e01e7890b6c30e06c00562617f`
4. Both should display **ROLE_ADMIN**

---

## 🛠️ Available Scripts

We've created several helper scripts in the `scripts/` directory:

### Grant Admin Roles

```bash
# Grant admin role on Aptos (already executed)
./scripts/grant-aptos-admin.sh [wallet_address]

# Grant admin role on Sui (already executed)
./scripts/grant-sui-admin.sh [wallet_address]
```

### Sync Backend

```bash
# Sync both wallets to backend
./scripts/sync-backend-roles.sh
```

### Verify On-Chain Roles

```bash
# Verify roles are set correctly on-chain
./scripts/verify-admin-roles.sh
```

---

## 📚 Role Constants

From [contracts/sources/access_control.move:20-25](contracts/sources/access_control.move#L20-L25):

```move
const ROLE_ADMIN: u8 = 0;           // Full control
const ROLE_MARKET_CREATOR: u8 = 1;  // Can create markets
const ROLE_RESOLVER: u8 = 2;        // Can resolve markets
const ROLE_ORACLE_MANAGER: u8 = 3;  // Can manage oracles
const ROLE_PAUSER: u8 = 4;          // Can pause system in emergencies
```

---

## 🔐 Security Notes

1. **No Allowlists:** All roles are stored entirely on-chain in the `AccessRegistry` (Aptos) and `RoleRegistry` (Sui)
2. **Backend Mirrors On-Chain State:** The backend database simply caches the on-chain role data for faster queries
3. **Single Source of Truth:** The blockchain is always the authoritative source for roles
4. **Admin Protection:** The access control modules prevent admins from revoking their own admin role (see [contracts/sources/access_control.move:164-166](contracts/sources/access_control.move#L164-L166))

---

## 🔄 Granting Additional Roles

To grant additional roles (e.g., ROLE_MARKET_CREATOR, ROLE_RESOLVER) to these or other wallets:

### Aptos

```bash
aptos move run \
  --function-id 0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81::access_control::grant_role \
  --args address:<WALLET_ADDRESS> u8:<ROLE_ID> \
  --profile testnet-deploy
```

### Sui

```bash
# Find your AdminCap object ID first
ADMIN_CAP=$(sui client objects --json | jq -r '.[] | select(.data.type == "0x7634cdd3e628a9bf3c42ddbc4282649ed30cdc06d6e17e28df09729ecb6ea1fb::access_control::AdminCap") | .data.objectId' | head -1)

# Grant role
sui client call \
  --package 0x7634cdd3e628a9bf3c42ddbc4282649ed30cdc06d6e17e28df09729ecb6ea1fb \
  --module access_control \
  --function grant_role \
  --args $ADMIN_CAP 0x45a425fe9b5c6120b046bffa91fe6bba43758503676cd2e24e390f0a7f5b30b3 <WALLET_ADDRESS> <ROLE_ID> \
  --gas-budget 10000000
```

Then sync to backend:

```bash
curl -X POST http://localhost:3000/roles/sync \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"<WALLET_ADDRESS>","chain":"<aptos|sui>","actor":"admin"}'
```

---

## 📖 Reference Files

- **Aptos Access Control:** [contracts/sources/access_control.move](contracts/sources/access_control.move)
- **Sui Access Control:** [contracts-sui/sources/access_control.move](contracts-sui/sources/access_control.move)
- **Backend Roles Service:** [backend/src/services/roles.service.ts](backend/src/services/roles.service.ts)
- **Backend Roles Routes:** [backend/src/routes/roles.routes.ts](backend/src/routes/roles.routes.ts)

---

## ✅ Summary

### Completed
- ✅ Aptos admin role granted on-chain (Transaction: 0x2f54c9cf...)
- ✅ Sui admin role granted on-chain (Transaction: HFH9AMctJ...)

### To Do
- ⏳ Start backend server
- ⏳ Sync Aptos wallet roles to backend
- ⏳ Sync Sui wallet roles to backend
- ⏳ Verify both wallets show ROLE_ADMIN in Admin UI

**Once these steps are complete, both wallets will have full admin access with no hard-coded allowlists!**
