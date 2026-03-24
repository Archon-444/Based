# Frontend Integration Guide: RBAC + Pause + Oracle

**Date**: 2025-10-10
**For**: React/TypeScript Frontend Developers
**Contract Version**: v1.5 (RBAC + Pause + Oracle integrated)

---

## Overview

The Move Market smart contracts now include three critical security features that require frontend integration:

1. **RBAC (Role-Based Access Control)** - Permission management
2. **Pause Mechanism** - Emergency shutdown capability
3. **Oracle Integration** - Automated market resolution

This guide explains how to integrate these features into your frontend application.

---

## Table of Contents

1. [RBAC Integration](#1-rbac-integration)
2. [Pause Mechanism Integration](#2-pause-mechanism-integration)
3. [Oracle Status Integration](#3-oracle-status-integration)
4. [SDK Updates Required](#4-sdk-updates-required)
5. [UI/UX Recommendations](#5-uiux-recommendations)
6. [Code Examples](#6-code-examples)

---

## 1. RBAC Integration

### Roles Available

The access_control module defines 5 roles:

```typescript
enum Role {
  ADMIN = 0,           // Full system control
  MARKET_CREATOR = 1,  // Can create markets
  RESOLVER = 2,        // Can resolve markets
  ORACLE_MANAGER = 3,  // Can manage oracles
  PAUSER = 4          // Can pause/unpause system
}
```

### View Functions to Call

#### Check if User Has Role
```typescript
// Module: access_control
// Function: has_role(user: address, role: u8): bool

async function userHasRole(userAddress: string, role: Role): Promise<boolean> {
  const payload = {
    function: `${CONTRACT_ADDRESS}::access_control::has_role`,
    type_arguments: [],
    arguments: [userAddress, role]
  };

  const result = await aptos.view(payload);
  return result[0] as boolean;
}
```

#### Check if User is Admin
```typescript
// Module: access_control
// Function: is_admin(user: address): bool

async function isAdmin(userAddress: string): Promise<boolean> {
  const payload = {
    function: `${CONTRACT_ADDRESS}::access_control::is_admin`,
    type_arguments: [],
    arguments: [userAddress]
  };

  const result = await aptos.view(payload);
  return result[0] as boolean;
}
```

### Entry Functions for Admin

#### Grant Role to User
```typescript
// Module: access_control
// Function: grant_role(admin: &signer, user: address, role: u8)

async function grantRole(
  adminSigner: AptosAccount,
  userAddress: string,
  role: Role
): Promise<string> {
  const payload = {
    type: "entry_function_payload",
    function: `${CONTRACT_ADDRESS}::access_control::grant_role`,
    type_arguments: [],
    arguments: [userAddress, role]
  };

  const txn = await aptos.generateSignSubmitTransaction(adminSigner, payload);
  await aptos.waitForTransaction(txn);
  return txn;
}
```

#### Revoke Role from User
```typescript
// Module: access_control
// Function: revoke_role(admin: &signer, user: address, role: u8)

async function revokeRole(
  adminSigner: AptosAccount,
  userAddress: string,
  role: Role
): Promise<string> {
  const payload = {
    type: "entry_function_payload",
    function: `${CONTRACT_ADDRESS}::access_control::revoke_role`,
    type_arguments: [],
    arguments: [userAddress, role]
  };

  const txn = await aptos.generateSignSubmitTransaction(adminSigner, payload);
  await aptos.waitForTransaction(txn);
  return txn;
}
```

### UI Components to Add

#### 1. Role Management Dashboard (Admin Only)
```tsx
// Show only if user is admin
const RoleManagementPanel: React.FC = () => {
  const { account } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (account) {
      checkIfAdmin(account.address).then(setIsAdmin);
    }
  }, [account]);

  if (!isAdmin) return null;

  return (
    <div className="role-management">
      <h2>Role Management</h2>
      <GrantRoleForm />
      <RevokeRoleForm />
      <UserRolesList />
    </div>
  );
};
```

#### 2. Permission-Based UI Hiding
```tsx
// Show "Create Market" button only if user can create markets
const CreateMarketButton: React.FC = () => {
  const { account } = useWallet();
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    if (account) {
      userHasRole(account.address, Role.MARKET_CREATOR)
        .then(setCanCreate);
    }
  }, [account]);

  if (!canCreate) {
    return <p>You need MARKET_CREATOR role to create markets</p>;
  }

  return <button onClick={createMarket}>Create Market</button>;
};
```

#### 3. Resolve Market Authorization
```tsx
// Check if user can resolve a specific market
async function canResolveMarket(
  userAddress: string,
  marketId: number
): Promise<boolean> {
  // Check if user is market creator
  const market = await getMarket(marketId);
  if (market.creator === userAddress) return true;

  // Check if user has RESOLVER role
  return await userHasRole(userAddress, Role.RESOLVER);
}
```

---

## 2. Pause Mechanism Integration

### View Functions

#### Check if System is Paused
```typescript
// Module: access_control
// Function: is_paused(): bool

async function isSystemPaused(): Promise<boolean> {
  const payload = {
    function: `${CONTRACT_ADDRESS}::access_control::is_paused`,
    type_arguments: [],
    arguments: []
  };

  const result = await aptos.view(payload);
  return result[0] as boolean;
}
```

### Entry Functions (Admin/Pauser Only)

#### Pause System
```typescript
// Module: access_control
// Function: pause(admin: &signer)

async function pauseSystem(adminSigner: AptosAccount): Promise<string> {
  const payload = {
    type: "entry_function_payload",
    function: `${CONTRACT_ADDRESS}::access_control::pause`,
    type_arguments: [],
    arguments: []
  };

  const txn = await aptos.generateSignSubmitTransaction(adminSigner, payload);
  await aptos.waitForTransaction(txn);
  return txn;
}
```

#### Unpause System
```typescript
// Module: access_control
// Function: unpause(admin: &signer)

async function unpauseSystem(adminSigner: AptosAccount): Promise<string> {
  const payload = {
    type: "entry_function_payload",
    function: `${CONTRACT_ADDRESS}::access_control::unpause`,
    type_arguments: [],
    arguments: []
  };

  const txn = await aptos.generateSignSubmitTransaction(adminSigner, payload);
  await aptos.waitForTransaction(txn);
  return txn;
}
```

### UI Components

#### 1. Global Pause Banner
```tsx
const PauseBanner: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkPause = async () => {
      const paused = await isSystemPaused();
      setIsPaused(paused);
    };

    checkPause();
    const interval = setInterval(checkPause, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  if (!isPaused) return null;

  return (
    <div className="pause-banner">
      ⚠️ System is currently paused.
      Market creation and betting are disabled.
      You can still claim winnings.
    </div>
  );
};
```

#### 2. Pause/Unpause Control (Admin Only)
```tsx
const EmergencyControls: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [isPaused, setIsPaused] = useState(false);
  const [canPause, setCanPause] = useState(false);

  useEffect(() => {
    if (account) {
      Promise.all([
        isSystemPaused(),
        userHasRole(account.address, Role.PAUSER)
      ]).then(([paused, hasPauserRole]) => {
        setIsPaused(paused);
        setCanPause(hasPauserRole);
      });
    }
  }, [account]);

  if (!canPause) return null;

  const togglePause = async () => {
    const payload = {
      type: "entry_function_payload",
      function: `${CONTRACT_ADDRESS}::access_control::${isPaused ? 'unpause' : 'pause'}`,
      type_arguments: [],
      arguments: []
    };

    await signAndSubmitTransaction(payload);
    setIsPaused(!isPaused);
  };

  return (
    <button
      onClick={togglePause}
      className={isPaused ? 'btn-success' : 'btn-danger'}
    >
      {isPaused ? '▶️ Unpause System' : '⏸️ Pause System'}
    </button>
  );
};
```

#### 3. Disable Actions When Paused
```tsx
const PlaceBetButton: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    isSystemPaused().then(setIsPaused);
  }, []);

  return (
    <button
      onClick={placeBet}
      disabled={isPaused}
      title={isPaused ? "System is paused" : "Place bet"}
    >
      {isPaused ? '⏸️ Betting Paused' : 'Place Bet'}
    </button>
  );
};
```

---

## 3. Oracle Status Integration

### View Functions

#### Check if Market Has Oracle Resolution
```typescript
// Module: oracle
// Function: is_market_resolved(market_id: u64): bool

async function hasOracleResolution(marketId: number): Promise<boolean> {
  const payload = {
    function: `${CONTRACT_ADDRESS}::oracle::is_market_resolved`,
    type_arguments: [],
    arguments: [marketId]
  };

  const result = await aptos.view(payload);
  return result[0] as boolean;
}
```

#### Get Oracle Resolution
```typescript
// Module: oracle
// Function: get_oracle_resolution(market_id: u64): (bool, u8)

async function getOracleResolution(
  marketId: number
): Promise<{ resolved: boolean; outcome: number }> {
  const payload = {
    function: `${CONTRACT_ADDRESS}::oracle::get_oracle_resolution`,
    type_arguments: [],
    arguments: [marketId]
  };

  const result = await aptos.view(payload);
  return {
    resolved: result[0] as boolean,
    outcome: result[1] as number
  };
}
```

### UI Components

#### Resolution Metadata & Pyth Snapshot

The contracts now expose rich metadata describing how a market resolved and the latest cached Pyth price:

```typescript
// Module: oracle
// Function: get_resolution_source(market_id: u64): u8
// Function: get_resolution_strategy(market_id: u64): u8
// Function: get_pyth_price(market_id: u64): (bool, u128, bool, u64, u64, bool, u64, u64)
```

The dApp wraps these calls via `sdk.getResolutionMetadata` and `sdk.getPythPriceSnapshot`, and surfaces the
information inside `MarketResolutionPanel`. This component shows:

- Which path resolved the market (Pyth vs optimistic vs manual)
- The configured fallback strategy
- The most recent Pyth price + confidence interval with human-readable formatting
- Snapshot freshness based on publish and cached timestamps

Tooltips on the resolution badges explain the meaning of each enum so users understand why a fallback occurred.

#### 1. Oracle Status Badge
```tsx
const OracleStatusBadge: React.FC<{ marketId: number }> = ({ marketId }) => {
  const [oracleStatus, setOracleStatus] = useState<{
    hasOracle: boolean;
    resolved: boolean;
    outcome?: number;
  } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const hasOracle = await hasOracleResolution(marketId);
      if (hasOracle) {
        const resolution = await getOracleResolution(marketId);
        setOracleStatus({
          hasOracle: true,
          ...resolution
        });
      } else {
        setOracleStatus({ hasOracle: false, resolved: false });
      }
    };

    fetchStatus();
  }, [marketId]);

  if (!oracleStatus) return null;

  if (!oracleStatus.hasOracle) {
    return <span className="badge badge-gray">Manual Resolution</span>;
  }

  if (oracleStatus.resolved) {
    return (
      <span className="badge badge-success">
        ✓ Oracle Resolved: Outcome {oracleStatus.outcome}
      </span>
    );
  }

  return <span className="badge badge-warning">🔮 Oracle Pending</span>;
};
```

#### 2. Resolution Method Display
```tsx
const MarketResolutionInfo: React.FC<{ market: Market }> = ({ market }) => {
  const [hasOracle, setHasOracle] = useState(false);

  useEffect(() => {
    hasOracleResolution(market.id).then(setHasOracle);
  }, [market.id]);

  if (market.resolved) {
    return (
      <div className="resolution-info">
        <h4>Resolved</h4>
        <p>Winning Outcome: {market.winning_outcome}</p>
        {hasOracle && (
          <p className="oracle-badge">
            ✓ Verified by Oracle Consensus
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="resolution-info">
      <h4>Resolution Method</h4>
      {hasOracle ? (
        <p>🔮 This market will be resolved automatically by oracle consensus</p>
      ) : (
        <p>👤 This market will be resolved manually by the creator or resolver</p>
      )}
    </div>
  );
};
```

---

## 4. SDK Updates Required

### Update MoveMarketSDK.ts

Add these methods to your SDK class:

```typescript
class MoveMarketSDK {
  // ... existing methods ...

  /** Check if user has a specific role */
  async hasRole(userAddress: string, role: number): Promise<boolean> {
    const payload = {
      function: `${this.moduleAddress}::access_control::has_role`,
      type_arguments: [],
      arguments: [userAddress, role]
    };

    const result = await this.aptos.view(payload);
    return result[0] as boolean;
  }

  /** Check if system is paused */
  async isSystemPaused(): Promise<boolean> {
    const payload = {
      function: `${this.moduleAddress}::access_control::is_paused`,
      type_arguments: [],
      arguments: []
    };

    const result = await this.aptos.view(payload);
    return result[0] as boolean;
  }

  /** Check if market has oracle resolution */
  async hasOracleResolution(marketId: number): Promise<boolean> {
    const payload = {
      function: `${this.moduleAddress}::oracle::is_market_resolved`,
      type_arguments: [],
      arguments: [marketId]
    };

    const result = await this.aptos.view(payload);
    return result[0] as boolean;
  }

  /** Grant role (admin only) */
  async grantRole(
    admin: AptosAccount,
    userAddress: string,
    role: number
  ): Promise<string> {
    const payload = {
      type: "entry_function_payload",
      function: `${this.moduleAddress}::access_control::grant_role`,
      type_arguments: [],
      arguments: [userAddress, role]
    };

    const txn = await this.signAndSubmitTransaction(admin, payload);
    await this.aptos.waitForTransaction(txn);
    return txn;
  }

  /** Pause system (admin/pauser only) */
  async pauseSystem(admin: AptosAccount): Promise<string> {
    const payload = {
      type: "entry_function_payload",
      function: `${this.moduleAddress}::access_control::pause`,
      type_arguments: [],
      arguments: []
    };

    const txn = await this.signAndSubmitTransaction(admin, payload);
    await this.aptos.waitForTransaction(txn);
    return txn;
  }

  /** Unpause system (admin/pauser only) */
  async unpauseSystem(admin: AptosAccount): Promise<string> {
    const payload = {
      type: "entry_function_payload",
      function: `${this.moduleAddress}::access_control::unpause`,
      type_arguments: [],
      arguments: []
    };

    const txn = await this.signAndSubmitTransaction(admin, payload);
    await this.aptos.waitForTransaction(txn);
    return txn;
  }
}
```

---

## 5. UI/UX Recommendations

### Visual Indicators

1. **Pause Status**
   - Show prominent banner at top when paused
   - Red/yellow color scheme for paused state
   - Disable all betting/market creation buttons

2. **Role Badges**
   - Display role badges next to user avatar
   - Different colors for different roles:
     - ADMIN: Red/Gold
     - RESOLVER: Blue
     - MARKET_CREATOR: Green
     - ORACLE_MANAGER: Purple
     - PAUSER: Orange

3. **Oracle Status**
   - Show oracle icon on markets with oracle resolution
   - Display "Oracle Verified" badge on resolved markets
   - Show pending oracle status

### Error Handling

```typescript
// Handle pause-related errors
try {
  await sdk.placeBet(marketId, outcome, amount);
} catch (error) {
  if (error.message.includes('paused') || error.message.includes('PAUSED')) {
    toast.error('System is currently paused. Please try again later.');
  } else if (error.message.includes('NOT_AUTHORIZED')) {
    toast.error('You don\'t have permission to perform this action.');
  } else {
    toast.error('Transaction failed: ' + error.message);
  }
}
```

### User Onboarding

Add tooltips/help text:

```tsx
<InfoTooltip>
  <h4>What is RBAC?</h4>
  <p>Role-Based Access Control allows the platform to delegate specific
  permissions to trusted users:</p>
  <ul>
    <li><strong>Market Creators</strong> can create new prediction markets</li>
    <li><strong>Resolvers</strong> can resolve market outcomes</li>
    <li><strong>Oracle Managers</strong> can configure automated resolution</li>
  </ul>
</InfoTooltip>
```

---

## 6. Code Examples

### Complete Role Check Hook
```typescript
// hooks/useUserRoles.ts
import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export function useUserRoles() {
  const { account } = useWallet();
  const [roles, setRoles] = useState({
    isAdmin: false,
    canCreateMarkets: false,
    canResolveMarkets: false,
    canManageOracles: false,
    canPause: false,
    loading: true
  });

  useEffect(() => {
    if (!account) {
      setRoles({
        isAdmin: false,
        canCreateMarkets: false,
        canResolveMarkets: false,
        canManageOracles: false,
        canPause: false,
        loading: false
      });
      return;
    }

    const checkRoles = async () => {
      const [isAdmin, canCreate, canResolve, canManage, canPause] = await Promise.all([
        sdk.hasRole(account.address, Role.ADMIN),
        sdk.hasRole(account.address, Role.MARKET_CREATOR),
        sdk.hasRole(account.address, Role.RESOLVER),
        sdk.hasRole(account.address, Role.ORACLE_MANAGER),
        sdk.hasRole(account.address, Role.PAUSER)
      ]);

      setRoles({
        isAdmin,
        canCreateMarkets: canCreate || isAdmin,
        canResolveMarkets: canResolve || isAdmin,
        canManageOracles: canManage || isAdmin,
        canPause: canPause || isAdmin,
        loading: false
      });
    };

    checkRoles();
  }, [account]);

  return roles;
}
```

### Complete Pause Status Hook
```typescript
// hooks/usePauseStatus.ts
import { useState, useEffect } from 'react';

export function usePauseStatus() {
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPause = async () => {
      try {
        const paused = await sdk.isSystemPaused();
        setIsPaused(paused);
      } finally {
        setLoading(false);
      }
    };

    checkPause();

    // Poll every 30 seconds
    const interval = setInterval(checkPause, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isPaused, loading };
}
```

---

## Testing Checklist

### RBAC Testing
- [ ] Admin can grant roles
- [ ] Admin can revoke roles
- [ ] Non-admin cannot grant/revoke roles
- [ ] Users with RESOLVER role can resolve markets
- [ ] Users without roles cannot perform restricted actions
- [ ] Role badges display correctly in UI

### Pause Testing
- [ ] Admin can pause system
- [ ] Admin can unpause system
- [ ] Pause banner appears when system is paused
- [ ] Market creation disabled when paused
- [ ] Betting disabled when paused
- [ ] Claiming winnings still works when paused
- [ ] Error messages are clear

### Oracle Testing
- [ ] Oracle status badge shows correctly
- [ ] Markets with oracles show "Oracle" indicator
- [ ] Oracle-resolved markets show verification badge
- [ ] Manual resolution markets show "Manual" indicator

---

## Deployment Notes

1. **Contract Address**: Update `CONTRACT_ADDRESS` in your SDK after deploying to devnet
2. **Role Assignment**: Grant initial roles after deployment using the admin account
3. **Monitoring**: Set up monitoring for pause events and role changes
4. **Documentation**: Update user-facing docs with role requirements

---

## Support & Resources

- **Smart Contract Docs**: See [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md)
- **Deployment Guide**: See [deploy_devnet.sh](./contracts/scripts/deploy_devnet.sh)
- **Module Reference**: Check `contracts/sources/` for full contract code

---

**Last Updated**: 2025-10-10
**Contract Version**: v1.5
**Frontend SDK Version**: Update required
