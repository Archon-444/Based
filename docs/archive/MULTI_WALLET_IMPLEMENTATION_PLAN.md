# Multi-Wallet Integration Implementation Plan
## Aptos + Sui Prediction Market dApp

**Document Version:** 2.0
**Last Updated:** 2025-10-24
**Status:** Architecture & Implementation Guide

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target Wallet Ecosystem](#3-target-wallet-ecosystem)
4. [Architecture Design](#4-architecture-design)
5. [Recommended Libraries](#5-recommended-libraries)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Component Structure](#7-component-structure)
8. [Wallet Provider Implementations](#8-wallet-provider-implementations)
9. [Security Considerations](#9-security-considerations)
10. [Testing Strategy](#10-testing-strategy)
11. [Documentation Requirements](#11-documentation-requirements)
12. [Migration & Maintenance](#12-migration--maintenance)

---

## 1. Executive Summary

### 1.1 Objective

Implement production-ready, extensible multi-wallet support for a cross-chain (Aptos + Sui) prediction market dApp, targeting retail traders, DeFi enthusiasts, DAOs, and institutional users.

### 1.2 Key Requirements

- **7 Primary Wallets:** Martian, Nightly, Suiet, Sui Wallet, Surf, Backpack, Safe/MPCVault
- **Advanced Features:** zkLogin, hardware wallet support, multi-sig/institutional wallets
- **Cross-chain UX:** Seamless switching between Aptos and Sui
- **Security:** No private key exposure, hardware wallet integration, tx replay protection
- **Mobile + Desktop:** Full parity across platforms

### 1.3 Success Metrics

- ✅ 100% wallet connection success rate for installed wallets
- ✅ < 2s wallet detection and connection time
- ✅ Zero private key exposure or security incidents
- ✅ Support for 95% of target users' preferred wallets
- ✅ Mobile/desktop feature parity

---

## 2. Current State Analysis

### 2.1 What's Already Implemented

#### ✅ Existing Infrastructure

```typescript
// Current Architecture (As of 2025-10-24)

dapp/src/
├── contexts/
│   ├── WalletContext.tsx          // Aptos wallet provider (Petra + Martian)
│   ├── SuiWalletContext.tsx       // Sui wallet provider (@mysten/dapp-kit)
│   └── ChainContext.tsx           // Chain selection state management
│
├── components/
│   ├── wallet/
│   │   ├── AptosWalletModal.tsx   // Aptos wallet selection UI
│   │   ├── SuiWalletModal.tsx     // Sui wallet selection UI
│   │   └── ChainAwareWalletModal.tsx  // Router between modals
│   ├── MultiChainWalletButton.tsx // Chain-aware wallet button
│   └── layout/Header.tsx          // Main header with wallet UI
│
└── config/
    └── walletBrands.ts            // Wallet branding metadata
```

#### ✅ Currently Supported Wallets

**Aptos:**
- Petra Wallet (browser extension)
- Martian Wallet (browser extension) ⚠️ Basic implementation only

**Sui:**
- Sui Wallet (official, browser extension)
- Ethos Wallet (browser extension)
- Suiet Wallet (browser extension)
- Nightly Wallet (browser extension) ⚠️ Limited support

#### ✅ Working Features

- Chain-aware wallet selection (Aptos/Sui toggle)
- Auto-disconnect on chain switch
- Wallet detection (installed vs. not installed)
- Basic transaction signing
- Balance display
- Responsive UI

### 2.2 Current Limitations

#### ❌ Missing Wallets

- **Surf Wallet** (Sui mobile, zkLogin)
- **Backpack** (Sui/Solana, advanced features)
- **Safe/MPCVault** (multi-sig institutional)
- **Nightly** (full cross-chain support)
- **Martian** (Sui support, not just Aptos)

#### ❌ Missing Features

- Hardware wallet support (Ledger, Keystone)
- zkLogin authentication
- Multi-sig/institutional wallet flows
- Mobile wallet deep linking
- WalletConnect integration
- Custom RPC endpoint configuration
- Session management and persistence
- Advanced error handling and recovery

#### ❌ Technical Debt

- No unified wallet adapter pattern
- Inconsistent error handling across wallets
- Limited TypeScript type safety for wallet APIs
- No wallet capability detection
- Missing comprehensive testing suite
- Incomplete documentation

### 2.3 Dependencies Analysis

**Current Dependencies (package.json):**

```json
{
  "@aptos-labs/ts-sdk": "^1.32.0",
  "@aptos-labs/wallet-adapter-react": "^3.7.0",
  "@martianwallet/aptos-wallet-adapter": "^0.0.5",
  "@mysten/dapp-kit": "^0.14.53",
  "@mysten/sui": "^1.16.0",
  "petra-plugin-wallet-adapter": "^0.4.5"
}
```

**Issues:**
- Outdated Martian adapter version (0.0.5 from 2023)
- Missing wallet-specific SDKs for newer wallets
- No multi-sig or hardware wallet libraries

---

## 3. Target Wallet Ecosystem

### 3.1 Wallet Matrix

| Wallet | Chains | Platforms | Key Features | Priority |
|--------|--------|-----------|--------------|----------|
| **Martian** | Aptos, Sui | Browser Ext | Cross-chain, DeFi focus | 🔴 P0 |
| **Nightly** | Aptos, Sui, Sol, EVM | Browser, Mobile | Universal, zkLogin | 🔴 P0 |
| **Suiet** | Sui | Browser Ext | Hardware wallet (Ledger/Keystone) | 🔴 P0 |
| **Sui Wallet** | Sui | Browser Ext | Official, core features | ✅ Done |
| **Surf Wallet** | Sui | Mobile | zkLogin, custom RPC, mobile-first | 🟡 P1 |
| **Backpack** | Sui, Solana | Browser, Mobile | NFT/data, advanced UI | 🟡 P1 |
| **Safe (Gnosis)** | Multi-chain | Web | Multi-sig, DAO treasury | 🟢 P2 |
| **MPCVault** | Aptos, Sui | Web, API | MPC, institutional | 🟢 P2 |

### 3.2 Feature Support Matrix

| Feature | Martian | Nightly | Suiet | Sui Wallet | Surf | Backpack | Safe | MPCVault |
|---------|---------|---------|-------|------------|------|----------|------|----------|
| **Browser Extension** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Mobile App** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Hardware Wallet** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **zkLogin** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Multi-sig** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Custom RPC** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Aptos Support** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Sui Support** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 3.3 User Persona Mapping

**Retail Traders (70% of users)**
- Primary: Martian, Nightly, Sui Wallet
- Needs: Fast onboarding, mobile support, simple UX

**DeFi Power Users (20% of users)**
- Primary: Suiet (hardware wallet), Nightly (multi-chain)
- Needs: Security, hardware wallet, cross-chain

**DAOs & Institutions (10% of users)**
- Primary: Safe, MPCVault
- Needs: Multi-sig, compliance, audit trails

---

## 4. Architecture Design

### 4.1 Unified Wallet Adapter Pattern

#### Core Abstraction Layer

```typescript
// dapp/src/wallet/core/types.ts

/**
 * Unified wallet interface for Aptos and Sui chains
 * Inspired by Solana's wallet-adapter standard
 */

export type Chain = 'aptos' | 'sui';

export interface WalletAccount {
  address: string;
  publicKey?: Uint8Array | string;
  label?: string;
  icon?: string;
}

export interface WalletCapabilities {
  // Transaction capabilities
  canSignTransaction: boolean;
  canSignMessage: boolean;
  canSignAndSubmitTransaction: boolean;

  // Advanced features
  supportsHardwareWallet: boolean;
  supportsZkLogin: boolean;
  supportsMultiSig: boolean;
  supportsCustomRPC: boolean;

  // Chain support
  supportedChains: Chain[];

  // Platform support
  supportedPlatforms: ('extension' | 'mobile' | 'web')[];
}

export interface WalletMetadata {
  name: string;
  icon: string;
  website: string;
  brandColor: string;
  description: string;
  downloadUrls: {
    chrome?: string;
    firefox?: string;
    ios?: string;
    android?: string;
  };
}

export enum WalletConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error',
}

export interface WalletError {
  code: string;
  message: string;
  details?: unknown;
}

export interface WalletAdapter<TAccount = WalletAccount> {
  // Identity
  metadata: WalletMetadata;
  chain: Chain;

  // State
  status: WalletConnectionStatus;
  account: TAccount | null;
  capabilities: WalletCapabilities;

  // Connection lifecycle
  connect(): Promise<TAccount>;
  disconnect(): Promise<void>;
  isAvailable(): Promise<boolean>;

  // Transaction methods
  signTransaction(transaction: unknown): Promise<unknown>;
  signMessage(message: Uint8Array | string): Promise<Uint8Array>;
  signAndSubmitTransaction(transaction: unknown): Promise<string>;

  // Events
  on(event: 'connect', handler: (account: TAccount) => void): void;
  on(event: 'disconnect', handler: () => void): void;
  on(event: 'accountChanged', handler: (account: TAccount) => void): void;
  on(event: 'error', handler: (error: WalletError) => void): void;
  off(event: string, handler: Function): void;

  // Advanced features (optional)
  setCustomRPC?(rpcUrl: string): Promise<void>;
  getHardwareWallets?(): Promise<TAccount[]>;
  initiateZkLogin?(): Promise<TAccount>;
}
```

### 4.2 Module Structure

```
dapp/src/wallet/
├── core/
│   ├── types.ts                    // Core types and interfaces
│   ├── BaseWalletAdapter.ts        // Abstract base class
│   ├── WalletAdapterFactory.ts     // Factory for creating adapters
│   └── errors.ts                   // Standard error classes
│
├── adapters/
│   ├── aptos/
│   │   ├── PetraAdapter.ts         // ✅ Existing
│   │   ├── MartianAptosAdapter.ts  // 🔄 Enhanced version
│   │   ├── NightlyAptosAdapter.ts  // 🆕 New
│   │   └── index.ts
│   │
│   ├── sui/
│   │   ├── SuiWalletAdapter.ts     // ✅ Existing
│   │   ├── SuietAdapter.ts         // 🆕 Enhanced
│   │   ├── MartianSuiAdapter.ts    // 🆕 New
│   │   ├── NightlySuiAdapter.ts    // 🆕 New
│   │   ├── SurfAdapter.ts          // 🆕 New (mobile)
│   │   ├── BackpackAdapter.ts      // 🆕 New
│   │   └── index.ts
│   │
│   └── institutional/
│       ├── SafeAdapter.ts          // 🆕 Multi-sig
│       ├── MPCVaultAdapter.ts      // 🆕 MPC
│       └── index.ts
│
├── providers/
│   ├── WalletProvider.tsx          // Main provider component
│   ├── AptosWalletProvider.tsx     // Aptos-specific provider
│   ├── SuiWalletProvider.tsx       // Sui-specific provider
│   └── InstitutionalProvider.tsx   // Multi-sig provider
│
├── hooks/
│   ├── useWallet.ts                // Primary wallet hook
│   ├── useWalletConnect.ts         // Connection logic
│   ├── useWalletSign.ts            // Signing methods
│   ├── useWalletBalance.ts         // Balance queries
│   ├── useWalletCapabilities.ts    // Feature detection
│   └── useMultiSigWallet.ts        // Multi-sig specific
│
├── components/
│   ├── WalletSelector/
│   │   ├── WalletSelector.tsx
│   │   ├── WalletCard.tsx
│   │   ├── WalletModal.tsx
│   │   └── WalletList.tsx
│   │
│   ├── WalletButton/
│   │   ├── WalletButton.tsx
│   │   ├── ConnectedWallet.tsx
│   │   └── DisconnectedWallet.tsx
│   │
│   └── Advanced/
│       ├── HardwareWalletSetup.tsx
│       ├── ZkLoginFlow.tsx
│       └── MultiSigSetup.tsx
│
├── utils/
│   ├── detection.ts                // Wallet detection
│   ├── validation.ts               // Input validation
│   ├── formatting.ts               // Address formatting
│   ├── storage.ts                  // Session persistence
│   └── mobile.ts                   // Mobile deep links
│
└── config/
    ├── wallets.ts                  // Wallet registry
    ├── chains.ts                   // Chain configuration
    └── constants.ts                // Global constants
```

### 4.3 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  (React Components, Pages, Business Logic)                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Wallet Hook Layer                            │
│  useWallet() → Returns unified wallet state                      │
│  - account, connect(), disconnect(), sign()                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Wallet Provider Layer                           │
│  WalletProvider → Manages active wallet, chain state             │
│  - Chain-aware wallet switching                                  │
│  - Session persistence                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│               Wallet Adapter Factory                             │
│  Returns appropriate adapter based on wallet + chain             │
│  - Aptos adapters (Petra, Martian, Nightly)                     │
│  - Sui adapters (Sui Wallet, Suiet, Martian, etc.)              │
│  - Institutional adapters (Safe, MPCVault)                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              Individual Wallet Adapters                          │
│  Implements WalletAdapter<T> interface                           │
│  - Wraps wallet SDK (e.g., @martianwallet/aptos-wallet-adapter) │
│  - Normalizes API to unified interface                           │
│  - Handles wallet-specific quirks                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Browser Wallet API                             │
│  window.aptos, window.martian, window.suiWallet, etc.           │
│  - Injected by browser extension                                 │
│  - Follows Wallet Standard API spec                              │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 State Management

```typescript
// dapp/src/wallet/providers/WalletProvider.tsx

interface WalletState {
  // Active wallet
  activeWallet: WalletAdapter | null;
  selectedWalletName: string | null;

  // Connection state
  status: WalletConnectionStatus;
  account: WalletAccount | null;
  error: WalletError | null;

  // Chain state
  activeChain: Chain;

  // Available wallets
  availableWallets: WalletMetadata[];
  installedWallets: string[];

  // Capabilities
  capabilities: WalletCapabilities | null;

  // Session
  autoConnect: boolean;
  sessionExpiry: number | null;
}

interface WalletActions {
  // Connection
  connect: (walletName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chain: Chain) => Promise<void>;

  // Transaction methods
  signTransaction: (tx: unknown) => Promise<unknown>;
  signMessage: (msg: string | Uint8Array) => Promise<Uint8Array>;
  signAndSubmitTransaction: (tx: unknown) => Promise<string>;

  // Configuration
  setAutoConnect: (enabled: boolean) => void;
  setCustomRPC: (rpcUrl: string) => Promise<void>;
}
```

---

## 5. Recommended Libraries

### 5.1 Core Dependencies (Required)

#### Aptos Wallets

```json
{
  "@aptos-labs/ts-sdk": "^1.32.0",                    // Core Aptos SDK
  "@aptos-labs/wallet-adapter-react": "^3.7.0",       // React hooks
  "@aptos-labs/wallet-adapter-core": "^4.25.0",       // Base adapter
  "petra-plugin-wallet-adapter": "^0.4.5",            // Petra
  "@martianwallet/aptos-wallet-adapter": "^1.0.3",    // Martian (UPDATE!)
  "@nightlylabs/aptos-wallet-adapter-plugin": "^1.0.11" // Nightly
}
```

#### Sui Wallets

```json
{
  "@mysten/sui": "^1.16.0",                           // Core Sui SDK
  "@mysten/dapp-kit": "^0.14.53",                     // React hooks + UI
  "@mysten/wallet-standard": "^0.12.0",               // Wallet standard
  "@suiet/wallet-kit": "^0.3.0",                      // Suiet integration
  "@nightlylabs/sui-wallet-adapter": "^1.0.5"         // Nightly Sui
}
```

#### Institutional & Multi-sig

```json
{
  "@safe-global/api-kit": "^2.4.7",                   // Safe API
  "@safe-global/protocol-kit": "^4.1.0",              // Safe protocol
  "@safe-global/auth-kit": "^3.1.3"                   // Safe auth
}
```

### 5.2 Optional Dependencies (P1/P2)

#### Hardware Wallet Support

```json
{
  "@ledgerhq/hw-transport-webusb": "^6.29.4",         // Ledger WebUSB
  "@ledgerhq/hw-app-aptos": "^1.0.0",                 // Ledger Aptos
  "@ledgerhq/hw-app-sui": "^1.0.0",                   // Ledger Sui
  "@keystonehq/sdk": "^0.22.0"                        // Keystone
}
```

#### Mobile Support

```json
{
  "@walletconnect/web3wallet": "^1.15.0",             // WalletConnect
  "@walletconnect/modal": "^2.7.0",                   // WC modal
  "@solana/mobile-wallet-adapter-protocol": "^2.1.2"  // Mobile adapter
}
```

#### zkLogin & Advanced Auth

```json
{
  "@mysten/zklogin": "^0.8.0",                        // Sui zkLogin
  "@nightly/connect": "^2.1.0"                        // Nightly Connect
}
```

### 5.3 Development & Testing

```json
{
  "@testing-library/react": "^16.0.1",
  "@testing-library/react-hooks": "^8.0.1",
  "@testing-library/user-event": "^14.5.2",
  "vitest": "^2.1.8",
  "msw": "^2.6.5",                                     // Mock Service Worker
  "@faker-js/faker": "^9.3.0"                         // Test data
}
```

### 5.4 Utility Libraries

```json
{
  "viem": "^2.21.54",                                  // Ethereum utilities
  "bs58": "^6.0.0",                                    // Base58 encoding
  "tweetnacl": "^1.0.3",                               // Crypto utilities
  "buffer": "^6.0.3",                                  // Buffer polyfill
  "eventemitter3": "^5.0.1"                            // Event emitter
}
```

---

## 6. Implementation Roadmap

### Phase 0: Foundation (Week 1) - CURRENT

**Status:** ✅ 80% Complete

- [x] Base architecture design
- [x] Core types and interfaces
- [x] Chain-aware wallet selection
- [x] Basic Aptos support (Petra, Martian)
- [x] Basic Sui support (Sui Wallet, Ethos, Suiet)
- [ ] Unified adapter pattern
- [ ] Comprehensive testing setup

### Phase 1: Core Wallet Expansion (Weeks 2-3)

**Goal:** Add P0 wallets with full feature support

#### Week 2: Aptos Ecosystem

**Deliverables:**
- ✅ Enhanced Martian Aptos adapter (hardware wallet support)
- ✅ Nightly Aptos adapter (full cross-chain)
- ✅ Unified error handling
- ✅ Session persistence
- ✅ Auto-reconnect logic

**Tasks:**
1. Install updated dependencies
2. Implement `MartianAptosAdapter`
3. Implement `NightlyAptosAdapter`
4. Add hardware wallet detection
5. Write unit tests
6. Update documentation

#### Week 3: Sui Ecosystem Completion

**Deliverables:**
- ✅ Enhanced Suiet adapter (Ledger/Keystone support)
- ✅ Martian Sui adapter (cross-chain)
- ✅ Nightly Sui adapter
- ✅ Improved wallet detection
- ✅ Mobile responsiveness

**Tasks:**
1. Install Sui wallet dependencies
2. Implement `MartianSuiAdapter`
3. Implement `NightlySuiAdapter`
4. Enhance `SuietAdapter` with hardware wallet
5. Test cross-chain scenarios
6. Performance optimization

### Phase 2: Mobile & Advanced Features (Weeks 4-5)

**Goal:** Mobile wallet support and advanced auth

#### Week 4: Mobile Wallets

**Deliverables:**
- ✅ Surf Wallet adapter (mobile, zkLogin)
- ✅ Backpack adapter (mobile/desktop)
- ✅ Mobile deep linking
- ✅ WalletConnect integration
- ✅ QR code connection flow

**Tasks:**
1. Implement `SurfAdapter` with zkLogin
2. Implement `BackpackAdapter`
3. Add WalletConnect support
4. Mobile UX optimization
5. Deep link testing (iOS/Android)

#### Week 5: Hardware Wallet Integration

**Deliverables:**
- ✅ Ledger support (Aptos + Sui)
- ✅ Keystone support (Suiet)
- ✅ Hardware wallet setup wizard
- ✅ Transaction signing flow
- ✅ Security best practices docs

**Tasks:**
1. Install Ledger/Keystone SDKs
2. Implement hardware wallet detection
3. Build setup wizard UI
4. Add transaction confirmation UI
5. Security audit
6. User documentation

### Phase 3: Institutional Features (Week 6)

**Goal:** Multi-sig and institutional wallet support

**Deliverables:**
- ✅ Safe (Gnosis) adapter
- ✅ MPCVault adapter
- ✅ Multi-sig transaction flow
- ✅ Admin dashboard for team wallets
- ✅ Compliance logging

**Tasks:**
1. Install Safe SDK
2. Implement `SafeAdapter`
3. Implement `MPCVaultAdapter`
4. Build multi-sig UI components
5. Add proposal/approval flow
6. Compliance documentation

### Phase 4: Testing & Optimization (Week 7)

**Goal:** Comprehensive testing and performance

**Deliverables:**
- ✅ Unit test coverage > 80%
- ✅ Integration tests for all wallets
- ✅ E2E tests (Playwright)
- ✅ Performance benchmarks
- ✅ Security audit report

**Tasks:**
1. Write unit tests for all adapters
2. Integration test suite
3. E2E test scenarios
4. Load testing
5. Security review
6. Bug fixes

### Phase 5: Documentation & Launch (Week 8)

**Goal:** Production-ready release

**Deliverables:**
- ✅ Developer documentation
- ✅ User guides
- ✅ API reference
- ✅ Migration guide
- ✅ Troubleshooting FAQ

**Tasks:**
1. Write comprehensive docs
2. Create video tutorials
3. Final QA pass
4. Staging deployment
5. Production deployment
6. Post-launch monitoring

---

## 7. Component Structure

### 7.1 Wallet Selection Components

#### WalletSelector Component

```typescript
// dapp/src/wallet/components/WalletSelector/WalletSelector.tsx

import React, { useMemo } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { WalletCard } from './WalletCard';
import { WalletMetadata } from '../../core/types';

interface WalletSelectorProps {
  chain: 'aptos' | 'sui';
  onSelect: (walletName: string) => void;
  onClose: () => void;
}

export const WalletSelector: React.FC<WalletSelectorProps> = ({
  chain,
  onSelect,
  onClose,
}) => {
  const { availableWallets, installedWallets } = useWallet();

  // Filter wallets by chain
  const chainWallets = useMemo(
    () => availableWallets.filter(w => w.supportedChains.includes(chain)),
    [availableWallets, chain]
  );

  // Group by installation status
  const { installed, loadable, notDetected } = useMemo(() => {
    const installed = chainWallets.filter(w => installedWallets.includes(w.name));
    const loadable = chainWallets.filter(
      w => !installedWallets.includes(w.name) && w.isLoadable
    );
    const notDetected = chainWallets.filter(
      w => !installedWallets.includes(w.name) && !w.isLoadable
    );
    return { installed, loadable, notDetected };
  }, [chainWallets, installedWallets]);

  return (
    <div className="wallet-selector">
      <header>
        <h2>Connect Wallet - {chain.toUpperCase()} Network</h2>
        <button onClick={onClose} aria-label="Close">✕</button>
      </header>

      {/* Installed Wallets */}
      {installed.length > 0 && (
        <section>
          <h3>Available Wallets</h3>
          <div className="wallet-grid">
            {installed.map(wallet => (
              <WalletCard
                key={wallet.name}
                wallet={wallet}
                status="installed"
                onClick={() => onSelect(wallet.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Loadable Wallets */}
      {loadable.length > 0 && (
        <section>
          <h3>Loadable Wallets</h3>
          <div className="wallet-grid">
            {loadable.map(wallet => (
              <WalletCard
                key={wallet.name}
                wallet={wallet}
                status="loadable"
                onClick={() => onSelect(wallet.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Not Detected */}
      {notDetected.length > 0 && (
        <section>
          <h3>More Wallets</h3>
          <div className="wallet-grid">
            {notDetected.map(wallet => (
              <WalletCard
                key={wallet.name}
                wallet={wallet}
                status="not-detected"
                onClick={() => window.open(wallet.downloadUrls.chrome)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Hardware Wallet Section */}
      <section className="hardware-wallet-section">
        <h3>Hardware Wallets</h3>
        <p>Connect Ledger or Keystone for enhanced security</p>
        <button onClick={() => onSelect('ledger-hardware')}>
          Connect Hardware Wallet
        </button>
      </section>

      {/* Mobile Section */}
      <section className="mobile-section">
        <h3>Mobile Wallets</h3>
        <p>Scan QR code to connect mobile wallet</p>
        <button onClick={() => onSelect('mobile-walletconnect')}>
          Connect via QR Code
        </button>
      </section>

      <footer>
        <p className="disclaimer">
          Make sure you trust the wallet before connecting.
          <a href="/security" target="_blank">Learn more</a>
        </p>
      </footer>
    </div>
  );
};
```

#### WalletCard Component

```typescript
// dapp/src/wallet/components/WalletSelector/WalletCard.tsx

import React from 'react';
import { WalletMetadata } from '../../core/types';
import { FiCheckCircle, FiAlertCircle, FiExternalLink } from 'react-icons/fi';

interface WalletCardProps {
  wallet: WalletMetadata;
  status: 'installed' | 'loadable' | 'not-detected';
  onClick: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  status,
  onClick,
}) => {
  const statusConfig = {
    installed: {
      icon: <FiCheckCircle className="text-green-500" />,
      label: 'Installed',
      actionLabel: 'Connect',
    },
    loadable: {
      icon: <FiAlertCircle className="text-yellow-500" />,
      label: 'Click to load',
      actionLabel: 'Load',
    },
    'not-detected': {
      icon: <FiExternalLink className="text-gray-400" />,
      label: 'Not detected',
      actionLabel: 'Install',
    },
  };

  const config = statusConfig[status];

  return (
    <button
      className="wallet-card"
      onClick={onClick}
      style={{ '--brand-color': wallet.brandColor } as React.CSSProperties}
    >
      <div className="wallet-icon">
        <img src={wallet.icon} alt={`${wallet.name} logo`} />
      </div>

      <div className="wallet-info">
        <h4>{wallet.name}</h4>
        <div className="wallet-status">
          {config.icon}
          <span>{config.label}</span>
        </div>
      </div>

      <div className="wallet-action">
        {config.actionLabel} →
      </div>

      {/* Feature badges */}
      <div className="wallet-features">
        {wallet.capabilities?.supportsHardwareWallet && (
          <span className="badge">Hardware</span>
        )}
        {wallet.capabilities?.supportsZkLogin && (
          <span className="badge">zkLogin</span>
        )}
        {wallet.capabilities?.supportsMultiSig && (
          <span className="badge">Multi-sig</span>
        )}
      </div>
    </button>
  );
};
```

### 7.2 Wallet Button Component

```typescript
// dapp/src/wallet/components/WalletButton/WalletButton.tsx

import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { WalletSelector } from '../WalletSelector/WalletSelector';
import { ConnectedWallet } from './ConnectedWallet';
import { DisconnectedWallet } from './DisconnectedWallet';

interface WalletButtonProps {
  className?: string;
  showBalance?: boolean;
  showNetwork?: boolean;
}

export const WalletButton: React.FC<WalletButtonProps> = ({
  className,
  showBalance = true,
  showNetwork = true,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { account, status, activeChain, connect, disconnect } = useWallet();

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (status === 'connected' && account) {
    return (
      <ConnectedWallet
        account={account}
        chain={activeChain}
        showBalance={showBalance}
        showNetwork={showNetwork}
        onDisconnect={disconnect}
        className={className}
      />
    );
  }

  return (
    <>
      <DisconnectedWallet
        onClick={() => setModalOpen(true)}
        chain={activeChain}
        className={className}
      />

      {modalOpen && (
        <WalletSelector
          chain={activeChain}
          onSelect={handleConnect}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
```

---

## 8. Wallet Provider Implementations

### 8.1 Base Wallet Adapter

```typescript
// dapp/src/wallet/core/BaseWalletAdapter.ts

import { EventEmitter } from 'eventemitter3';
import {
  WalletAdapter,
  WalletAccount,
  WalletCapabilities,
  WalletConnectionStatus,
  WalletError,
  WalletMetadata,
  Chain,
} from './types';

export abstract class BaseWalletAdapter<TAccount extends WalletAccount = WalletAccount>
  extends EventEmitter
  implements WalletAdapter<TAccount>
{
  abstract metadata: WalletMetadata;
  abstract chain: Chain;
  abstract capabilities: WalletCapabilities;

  protected _status: WalletConnectionStatus = WalletConnectionStatus.Disconnected;
  protected _account: TAccount | null = null;
  protected _error: WalletError | null = null;

  get status(): WalletConnectionStatus {
    return this._status;
  }

  get account(): TAccount | null {
    return this._account;
  }

  get error(): WalletError | null {
    return this._error;
  }

  /**
   * Check if wallet is available in the environment
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Connect to the wallet
   */
  abstract connect(): Promise<TAccount>;

  /**
   * Disconnect from the wallet
   */
  abstract disconnect(): Promise<void>;

  /**
   * Sign a transaction
   */
  abstract signTransaction(transaction: unknown): Promise<unknown>;

  /**
   * Sign a message
   */
  abstract signMessage(message: Uint8Array | string): Promise<Uint8Array>;

  /**
   * Sign and submit a transaction
   */
  abstract signAndSubmitTransaction(transaction: unknown): Promise<string>;

  /**
   * Set custom RPC endpoint (optional)
   */
  async setCustomRPC?(rpcUrl: string): Promise<void> {
    throw new Error('Custom RPC not supported by this wallet');
  }

  /**
   * Get hardware wallets (optional)
   */
  async getHardwareWallets?(): Promise<TAccount[]> {
    throw new Error('Hardware wallets not supported by this wallet');
  }

  /**
   * Initiate zkLogin flow (optional)
   */
  async initiateZkLogin?(): Promise<TAccount> {
    throw new Error('zkLogin not supported by this wallet');
  }

  /**
   * Protected helper to update connection status
   */
  protected setStatus(status: WalletConnectionStatus): void {
    this._status = status;
    this.emit('statusChanged', status);
  }

  /**
   * Protected helper to update account
   */
  protected setAccount(account: TAccount | null): void {
    const prevAccount = this._account;
    this._account = account;

    if (account && prevAccount?.address !== account.address) {
      this.emit('accountChanged', account);
    }
  }

  /**
   * Protected helper to set error
   */
  protected setError(error: WalletError): void {
    this._error = error;
    this.emit('error', error);
  }

  /**
   * Protected helper to clear error
   */
  protected clearError(): void {
    this._error = null;
  }
}
```

### 8.2 Martian Wallet Adapter (Enhanced)

```typescript
// dapp/src/wallet/adapters/aptos/MartianAptosAdapter.ts

import { BaseWalletAdapter } from '../../core/BaseWalletAdapter';
import {
  WalletAccount,
  WalletCapabilities,
  WalletConnectionStatus,
  WalletMetadata,
} from '../../core/types';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';

interface MartianAccount extends WalletAccount {
  network: 'mainnet' | 'testnet' | 'devnet';
}

export class MartianAptosAdapter extends BaseWalletAdapter<MartianAccount> {
  metadata: WalletMetadata = {
    name: 'Martian',
    icon: '/assets/wallets/martian.svg',
    website: 'https://martianwallet.xyz',
    brandColor: '#171A1F',
    description: 'Multi-chain wallet for Aptos and Sui',
    downloadUrls: {
      chrome: 'https://chrome.google.com/webstore/detail/martian-aptos-wallet/...',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/martian-wallet/',
    },
  };

  chain = 'aptos' as const;

  capabilities: WalletCapabilities = {
    canSignTransaction: true,
    canSignMessage: true,
    canSignAndSubmitTransaction: true,
    supportsHardwareWallet: true,
    supportsZkLogin: false,
    supportsMultiSig: false,
    supportsCustomRPC: true,
    supportedChains: ['aptos', 'sui'],
    supportedPlatforms: ['extension', 'mobile'],
  };

  private martian: MartianWallet | null = null;

  /**
   * Check if Martian is installed
   */
  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check for Martian wallet object
    return !!(window as any).martian?.aptos;
  }

  /**
   * Connect to Martian wallet
   */
  async connect(): Promise<MartianAccount> {
    try {
      this.setStatus(WalletConnectionStatus.Connecting);
      this.clearError();

      // Check availability
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Martian wallet not installed');
      }

      // Initialize Martian SDK
      this.martian = (window as any).martian?.aptos;

      // Request connection
      const response = await this.martian!.connect();

      if (!response?.address) {
        throw new Error('Failed to get account from Martian');
      }

      const account: MartianAccount = {
        address: response.address,
        publicKey: response.publicKey,
        network: response.network || 'mainnet',
      };

      this.setAccount(account);
      this.setStatus(WalletConnectionStatus.Connected);
      this.emit('connect', account);

      // Listen for account changes
      this.martian!.onAccountChange((newAccount: any) => {
        if (newAccount?.address) {
          const updatedAccount: MartianAccount = {
            address: newAccount.address,
            publicKey: newAccount.publicKey,
            network: newAccount.network || 'mainnet',
          };
          this.setAccount(updatedAccount);
        }
      });

      // Listen for disconnection
      this.martian!.onDisconnect(() => {
        this.disconnect();
      });

      return account;
    } catch (error: any) {
      this.setStatus(WalletConnectionStatus.Error);
      const walletError = {
        code: 'CONNECTION_FAILED',
        message: error.message || 'Failed to connect to Martian',
        details: error,
      };
      this.setError(walletError);
      throw walletError;
    }
  }

  /**
   * Disconnect from Martian
   */
  async disconnect(): Promise<void> {
    try {
      if (this.martian) {
        await this.martian.disconnect();
      }

      this.setAccount(null);
      this.setStatus(WalletConnectionStatus.Disconnected);
      this.emit('disconnect');
    } catch (error: any) {
      console.error('Error disconnecting from Martian:', error);
      // Still update state even if disconnect fails
      this.setAccount(null);
      this.setStatus(WalletConnectionStatus.Disconnected);
    }
  }

  /**
   * Sign a transaction
   */
  async signTransaction(transaction: any): Promise<any> {
    if (!this.martian || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const signedTx = await this.martian.signTransaction(transaction);
      return signedTx;
    } catch (error: any) {
      const walletError = {
        code: 'SIGN_TRANSACTION_FAILED',
        message: error.message || 'Failed to sign transaction',
        details: error,
      };
      this.setError(walletError);
      throw walletError;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: Uint8Array | string): Promise<Uint8Array> {
    if (!this.martian || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const messageStr = typeof message === 'string' ? message : Buffer.from(message).toString();
      const result = await this.martian.signMessage({
        message: messageStr,
        nonce: Date.now().toString(),
      });

      // Convert signature to Uint8Array
      return Buffer.from(result.signature, 'hex');
    } catch (error: any) {
      const walletError = {
        code: 'SIGN_MESSAGE_FAILED',
        message: error.message || 'Failed to sign message',
        details: error,
      };
      this.setError(walletError);
      throw walletError;
    }
  }

  /**
   * Sign and submit a transaction
   */
  async signAndSubmitTransaction(transaction: any): Promise<string> {
    if (!this.martian || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await this.martian.signAndSubmitTransaction(transaction);
      return result.hash || result;
    } catch (error: any) {
      const walletError = {
        code: 'SUBMIT_TRANSACTION_FAILED',
        message: error.message || 'Failed to submit transaction',
        details: error,
      };
      this.setError(walletError);
      throw walletError;
    }
  }

  /**
   * Set custom RPC endpoint
   */
  async setCustomRPC(rpcUrl: string): Promise<void> {
    if (!this.martian) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.martian.network(rpcUrl);
      console.log(`Martian RPC set to: ${rpcUrl}`);
    } catch (error: any) {
      throw new Error(`Failed to set custom RPC: ${error.message}`);
    }
  }

  /**
   * Get hardware wallets (Ledger support)
   */
  async getHardwareWallets(): Promise<MartianAccount[]> {
    // Martian supports Ledger
    // Implementation would involve Ledger transport
    throw new Error('Hardware wallet support coming soon');
  }
}
```

### 8.3 Nightly Wallet Adapter

```typescript
// dapp/src/wallet/adapters/aptos/NightlyAptosAdapter.ts

import { BaseWalletAdapter } from '../../core/BaseWalletAdapter';
import {
  WalletAccount,
  WalletCapabilities,
  WalletConnectionStatus,
  WalletMetadata,
} from '../../core/types';
import { NightlyWalletAdapter } from '@nightlylabs/aptos-wallet-adapter-plugin';

export class NightlyAptosAdapter extends BaseWalletAdapter {
  metadata: WalletMetadata = {
    name: 'Nightly',
    icon: '/assets/wallets/nightly.svg',
    website: 'https://nightly.app',
    brandColor: '#1F1A5F',
    description: 'Universal multi-chain wallet with zkLogin support',
    downloadUrls: {
      chrome: 'https://chrome.google.com/webstore/detail/nightly/...',
      ios: 'https://apps.apple.com/app/nightly/...',
      android: 'https://play.google.com/store/apps/details?id=com.nightly',
    },
  };

  chain = 'aptos' as const;

  capabilities: WalletCapabilities = {
    canSignTransaction: true,
    canSignMessage: true,
    canSignAndSubmitTransaction: true,
    supportsHardwareWallet: true,
    supportsZkLogin: true,
    supportsMultiSig: false,
    supportsCustomRPC: true,
    supportedChains: ['aptos', 'sui', 'solana', 'ethereum'],
    supportedPlatforms: ['extension', 'mobile'],
  };

  private nightly: NightlyWalletAdapter | null = null;

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && !!(window as any).nightly?.aptos;
  }

  async connect(): Promise<WalletAccount> {
    // Similar implementation to Martian
    // ... (connection logic)
    throw new Error('Not implemented - see full implementation in codebase');
  }

  async disconnect(): Promise<void> {
    // ... (disconnection logic)
  }

  async signTransaction(transaction: unknown): Promise<unknown> {
    // ... (signing logic)
    throw new Error('Not implemented');
  }

  async signMessage(message: Uint8Array | string): Promise<Uint8Array> {
    // ... (message signing logic)
    throw new Error('Not implemented');
  }

  async signAndSubmitTransaction(transaction: unknown): Promise<string> {
    // ... (submit logic)
    throw new Error('Not implemented');
  }

  /**
   * Nightly-specific: Initiate zkLogin flow
   */
  async initiateZkLogin(): Promise<WalletAccount> {
    if (!this.nightly) {
      throw new Error('Wallet not initialized');
    }

    try {
      // Nightly's zkLogin flow
      const zkAccount = await this.nightly.zkLogin({
        provider: 'google', // or 'apple', 'facebook'
      });

      const account: WalletAccount = {
        address: zkAccount.address,
        label: 'zkLogin Account',
      };

      this.setAccount(account);
      this.emit('connect', account);

      return account;
    } catch (error: any) {
      throw new Error(`zkLogin failed: ${error.message}`);
    }
  }
}
```

### 8.4 Suiet Adapter (Enhanced with Hardware Wallet)

```typescript
// dapp/src/wallet/adapters/sui/SuietAdapter.ts

import { BaseWalletAdapter } from '../../core/BaseWalletAdapter';
import {
  WalletAccount,
  WalletCapabilities,
  WalletMetadata,
} from '../../core/types';
import { SuietWallet } from '@suiet/wallet-sdk';
import LedgerTransport from '@ledgerhq/hw-transport-webusb';
import { AptosApp } from '@ledgerhq/hw-app-aptos';

interface SuietAccount extends WalletAccount {
  chain: 'sui';
  isHardwareWallet?: boolean;
  ledgerPath?: string;
}

export class SuietAdapter extends BaseWalletAdapter<SuietAccount> {
  metadata: WalletMetadata = {
    name: 'Suiet',
    icon: '/assets/wallets/suiet.svg',
    website: 'https://suiet.app',
    brandColor: '#000000',
    description: 'Sui wallet with hardware wallet support (Ledger, Keystone)',
    downloadUrls: {
      chrome: 'https://chrome.google.com/webstore/detail/suiet/...',
    },
  };

  chain = 'sui' as const;

  capabilities: WalletCapabilities = {
    canSignTransaction: true,
    canSignMessage: true,
    canSignAndSubmitTransaction: true,
    supportsHardwareWallet: true, // ✅ Ledger + Keystone
    supportsZkLogin: false,
    supportsMultiSig: false,
    supportsCustomRPC: true,
    supportedChains: ['sui'],
    supportedPlatforms: ['extension'],
  };

  private suiet: SuietWallet | null = null;
  private ledgerTransport: LedgerTransport | null = null;

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && !!(window as any).suiet;
  }

  async connect(): Promise<SuietAccount> {
    // Standard Suiet connection (browser extension)
    // ... implementation
    throw new Error('Not implemented - see codebase');
  }

  async disconnect(): Promise<void> {
    // Disconnect logic
    if (this.ledgerTransport) {
      await this.ledgerTransport.close();
      this.ledgerTransport = null;
    }
    // ... rest of disconnection
  }

  async signTransaction(transaction: unknown): Promise<unknown> {
    if (this.account?.isHardwareWallet) {
      return this.signTransactionWithLedger(transaction);
    }
    // Standard signing
    throw new Error('Not implemented');
  }

  async signMessage(message: Uint8Array | string): Promise<Uint8Array> {
    throw new Error('Not implemented');
  }

  async signAndSubmitTransaction(transaction: unknown): Promise<string> {
    throw new Error('Not implemented');
  }

  /**
   * Get connected Ledger hardware wallets
   */
  async getHardwareWallets(): Promise<SuietAccount[]> {
    try {
      // Initialize Ledger transport
      this.ledgerTransport = await LedgerTransport.create();
      const app = new AptosApp(this.ledgerTransport);

      // Get Ledger accounts (first 5 derivation paths)
      const accounts: SuietAccount[] = [];
      for (let i = 0; i < 5; i++) {
        const path = `m/44'/784'/${i}'/0'/0'`; // Sui derivation path
        const { address, publicKey } = await app.getAddress(path);

        accounts.push({
          address,
          publicKey: Buffer.from(publicKey).toString('hex'),
          label: `Ledger Account ${i + 1}`,
          isHardwareWallet: true,
          ledgerPath: path,
          chain: 'sui',
        });
      }

      return accounts;
    } catch (error: any) {
      throw new Error(`Failed to get Ledger wallets: ${error.message}`);
    }
  }

  /**
   * Sign transaction with Ledger
   */
  private async signTransactionWithLedger(transaction: any): Promise<any> {
    if (!this.ledgerTransport || !this.account?.ledgerPath) {
      throw new Error('Ledger not connected');
    }

    try {
      const app = new AptosApp(this.ledgerTransport);

      // Serialize transaction
      const txBytes = Buffer.from(JSON.stringify(transaction));

      // Sign with Ledger
      const signature = await app.signTransaction(
        this.account.ledgerPath,
        txBytes
      );

      return {
        ...transaction,
        signature: Buffer.from(signature).toString('hex'),
      };
    } catch (error: any) {
      throw new Error(`Ledger signing failed: ${error.message}`);
    }
  }
}
```

---

## 9. Security Considerations

### 9.1 Core Security Principles

#### 1. No Private Key Exposure

```typescript
// ❌ NEVER DO THIS
localStorage.setItem('privateKey', privateKey);

// ✅ DO THIS
// Let wallet extensions manage private keys
// Only store:
// - Connected wallet name
// - Public address
// - Session tokens (short-lived, encrypted)
```

#### 2. Transaction Replay Protection

```typescript
// dapp/src/wallet/utils/security.ts

/**
 * Add nonce and expiry to prevent tx replay
 */
export function addReplayProtection(transaction: any): any {
  return {
    ...transaction,
    nonce: crypto.randomUUID(),
    expiry: Date.now() + 300000, // 5 min expiry
  };
}

/**
 * Validate transaction before signing
 */
export function validateTransaction(tx: any): boolean {
  // Check expiry
  if (tx.expiry && tx.expiry < Date.now()) {
    throw new Error('Transaction expired');
  }

  // Validate recipient address
  if (!isValidAddress(tx.recipient)) {
    throw new Error('Invalid recipient address');
  }

  // Check amount sanity
  if (tx.amount && tx.amount < 0) {
    throw new Error('Invalid amount');
  }

  return true;
}
```

#### 3. Session Management

```typescript
// dapp/src/wallet/utils/storage.ts

interface WalletSession {
  walletName: string;
  address: string;
  chain: Chain;
  connectedAt: number;
  expiresAt: number;
  autoConnect: boolean;
}

const SESSION_KEY = 'wallet_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function saveSession(session: Omit<WalletSession, 'connectedAt' | 'expiresAt'>): void {
  const fullSession: WalletSession = {
    ...session,
    connectedAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
  };

  // Encrypt session data
  const encrypted = encryptSessionData(fullSession);
  sessionStorage.setItem(SESSION_KEY, encrypted);
}

export function loadSession(): WalletSession | null {
  try {
    const encrypted = sessionStorage.getItem(SESSION_KEY);
    if (!encrypted) return null;

    const session = decryptSessionData(encrypted);

    // Check expiry
    if (session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

function encryptSessionData(data: WalletSession): string {
  // Use Web Crypto API for encryption
  // Simplified for example
  return btoa(JSON.stringify(data));
}

function decryptSessionData(encrypted: string): WalletSession {
  return JSON.parse(atob(encrypted));
}
```

### 9.2 Hardware Wallet Best Practices

#### Ledger Integration

```typescript
// dapp/src/wallet/utils/hardware.ts

import Transport from '@ledgerhq/hw-transport-webusb';
import { AptosApp } from '@ledgerhq/hw-app-aptos';

/**
 * Safely connect to Ledger device
 */
export async function connectLedger(): Promise<{
  transport: Transport;
  app: AptosApp;
}> {
  try {
    // Request user permission
    const transport = await Transport.create();

    // Open Aptos app
    const app = new AptosApp(transport);

    // Verify app is open
    const config = await app.getAppConfiguration();
    console.log('Ledger Aptos app version:', config.version);

    return { transport, app };
  } catch (error: any) {
    if (error.name === 'TransportOpenUserCancelled') {
      throw new Error('User cancelled Ledger connection');
    } else if (error.message.includes('app')) {
      throw new Error('Please open the Aptos app on your Ledger device');
    }
    throw error;
  }
}

/**
 * Display transaction details to user before Ledger signing
 */
export function confirmHardwareTransaction(tx: any): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="hardware-confirm-modal">
        <h2>⚠️ Confirm Transaction on Ledger</h2>
        <p>Please review and approve the transaction on your Ledger device.</p>
        <ul>
          <li>Recipient: ${tx.recipient}</li>
          <li>Amount: ${tx.amount} APT</li>
          <li>Fee: ${tx.fee} APT</li>
        </ul>
        <button id="cancel-hw-tx">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cancel-hw-tx')?.addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    // Auto-resolve when Ledger confirms
    // (actual implementation would listen to Ledger events)
  });
}
```

### 9.3 Content Security Policy

```typescript
// Add to index.html or server config

/**
 * CSP headers to prevent XSS and other attacks
 */
const cspHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Vite requires unsafe-eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://fullnode.mainnet.aptoslabs.com https://fullnode.testnet.sui.io",
    "frame-ancestors 'none'",
  ].join('; '),
};
```

### 9.4 Phishing Protection

```typescript
// dapp/src/wallet/utils/phishing.ts

/**
 * Detect suspicious transaction patterns
 */
export function detectSuspiciousTransaction(tx: any): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check for unusually high amounts
  if (tx.amount > 1000000) {
    reasons.push('Unusually high transaction amount');
  }

  // Check for unknown contract addresses
  if (tx.to && !isKnownContract(tx.to)) {
    reasons.push('Interacting with unknown contract');
  }

  // Check for unlimited token approvals
  if (tx.type === 'approval' && tx.amount === 'unlimited') {
    reasons.push('Unlimited token approval requested');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Validate wallet website URL
 */
export function validateWalletWebsite(url: string): boolean {
  const trustedDomains = [
    'petra.app',
    'martianwallet.xyz',
    'suiet.app',
    'sui.io',
    'nightly.app',
  ];

  try {
    const parsed = new URL(url);
    return trustedDomains.some(domain => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
}
```

---

## 10. Testing Strategy

### 10.1 Test Structure

```
dapp/src/wallet/__tests__/
├── unit/
│   ├── adapters/
│   │   ├── MartianAptosAdapter.test.ts
│   │   ├── NightlyAptosAdapter.test.ts
│   │   ├── SuietAdapter.test.ts
│   │   └── SafeAdapter.test.ts
│   │
│   ├── hooks/
│   │   ├── useWallet.test.ts
│   │   ├── useWalletConnect.test.ts
│   │   └── useWalletSign.test.ts
│   │
│   └── utils/
│       ├── detection.test.ts
│       ├── security.test.ts
│       └── storage.test.ts
│
├── integration/
│   ├── wallet-connection.test.tsx
│   ├── chain-switching.test.tsx
│   ├── transaction-flow.test.tsx
│   └── multi-sig-flow.test.tsx
│
├── e2e/
│   ├── wallet-connection.spec.ts
│   ├── market-creation.spec.ts
│   ├── betting-flow.spec.ts
│   └── wallet-switching.spec.ts
│
└── mocks/
    ├── wallets/
    │   ├── mockMartian.ts
    │   ├── mockNightly.ts
    │   └── mockSuiet.ts
    │
    └── fixtures/
        ├── accounts.ts
        ├── transactions.ts
        └── markets.ts
```

### 10.2 Unit Test Example

```typescript
// dapp/src/wallet/__tests__/unit/adapters/MartianAptosAdapter.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MartianAptosAdapter } from '../../../adapters/aptos/MartianAptosAdapter';
import { mockMartianWallet } from '../../mocks/wallets/mockMartian';

describe('MartianAptosAdapter', () => {
  let adapter: MartianAptosAdapter;

  beforeEach(() => {
    // Setup mock window.martian
    (global as any).window = {
      martian: mockMartianWallet(),
    };

    adapter = new MartianAptosAdapter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isAvailable()', () => {
    it('should return true when Martian is installed', async () => {
      const available = await adapter.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when Martian is not installed', async () => {
      delete (global as any).window.martian;
      const available = await adapter.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('connect()', () => {
    it('should successfully connect to Martian', async () => {
      const account = await adapter.connect();

      expect(account).toBeDefined();
      expect(account.address).toBeTruthy();
      expect(adapter.status).toBe('connected');
    });

    it('should emit connect event on successful connection', async () => {
      const connectHandler = vi.fn();
      adapter.on('connect', connectHandler);

      await adapter.connect();

      expect(connectHandler).toHaveBeenCalledOnce();
    });

    it('should handle user rejection', async () => {
      mockMartianWallet.mockConnect.mockRejectedValueOnce(
        new Error('User rejected connection')
      );

      await expect(adapter.connect()).rejects.toThrow('User rejected');
      expect(adapter.status).toBe('error');
    });
  });

  describe('signTransaction()', () => {
    it('should sign transaction when connected', async () => {
      await adapter.connect();

      const transaction = {
        type: 'entry_function_payload',
        function: '0x1::coin::transfer',
        arguments: ['0xabc', '1000000'],
      };

      const signed = await adapter.signTransaction(transaction);

      expect(signed).toBeDefined();
      expect(signed.signature).toBeTruthy();
    });

    it('should throw error when not connected', async () => {
      const transaction = { type: 'test' };

      await expect(adapter.signTransaction(transaction)).rejects.toThrow(
        'Wallet not connected'
      );
    });
  });

  describe('hardware wallet support', () => {
    it('should detect Ledger devices', async () => {
      await adapter.connect();

      const hwWallets = await adapter.getHardwareWallets();

      expect(hwWallets).toBeInstanceOf(Array);
      // More assertions based on mock implementation
    });
  });
});
```

### 10.3 Integration Test Example

```typescript
// dapp/src/wallet/__tests__/integration/wallet-connection.test.tsx

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletProvider } from '../../providers/WalletProvider';
import { WalletButton } from '../../components/WalletButton/WalletButton';

describe('Wallet Connection Flow', () => {
  it('should complete full connection flow', async () => {
    const user = userEvent.setup();

    render(
      <WalletProvider>
        <WalletButton />
      </WalletProvider>
    );

    // Click connect button
    const connectBtn = screen.getByText('Connect Wallet');
    await user.click(connectBtn);

    // Modal should open
    expect(screen.getByText(/Connect Wallet - APTOS Network/i)).toBeInTheDocument();

    // Select Martian wallet
    const martianCard = screen.getByText('Martian');
    await user.click(martianCard);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/0x[a-f0-9]+/i)).toBeInTheDocument();
    });

    // Verify connected state
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('should handle chain switching', async () => {
    const user = userEvent.setup();

    render(
      <WalletProvider>
        <WalletButton />
      </WalletProvider>
    );

    // Connect to Aptos
    await user.click(screen.getByText('Connect Wallet'));
    await user.click(screen.getByText('Martian'));

    await waitFor(() => {
      expect(screen.getByText(/0x/)).toBeInTheDocument();
    });

    // Switch to Sui
    await user.click(screen.getByText('Aptos'));
    await user.click(screen.getByText('Sui'));

    // Verify wallet disconnected
    await waitFor(() => {
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    // Verify Sui wallets shown
    await user.click(screen.getByText('Connect Wallet'));
    expect(screen.getByText(/Connect Wallet - SUI Network/i)).toBeInTheDocument();
  });
});
```

### 10.4 E2E Test Example (Playwright)

```typescript
// dapp/e2e/wallet-connection.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Wallet Connection E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');
  });

  test('should connect Petra wallet', async ({ page, context }) => {
    // Install Petra extension
    await installPetraExtension(context);

    // Click connect wallet
    await page.click('text=Connect Wallet');

    // Select Petra
    await page.click('text=Petra');

    // Handle Petra popup
    const petraPopup = await context.waitForEvent('page');
    await petraPopup.click('text=Connect');

    // Verify connection
    await expect(page.locator('text=/0x[a-f0-9]+/i')).toBeVisible();
  });

  test('should place a bet using connected wallet', async ({ page, context }) => {
    // Connect wallet first
    await connectWallet(page, context, 'Petra');

    // Navigate to market
    await page.goto('/markets/1');

    // Place bet
    await page.fill('input[name="amount"]', '10');
    await page.click('button:has-text("Place Bet - Yes")');

    // Confirm in Petra
    const petraPopup = await context.waitForEvent('page');
    await petraPopup.click('text=Approve');

    // Verify bet placed
    await expect(page.locator('text=/Bet placed successfully/i')).toBeVisible();
  });
});
```

### 10.5 Mock Wallet Implementation

```typescript
// dapp/src/wallet/__tests__/mocks/wallets/mockMartian.ts

export function mockMartianWallet() {
  const mockAccounts = [
    {
      address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      publicKey: 'mock-public-key-1',
      network: 'testnet',
    },
  ];

  let connected = false;
  let currentAccount = mockAccounts[0];

  return {
    aptos: {
      connect: vi.fn(async () => {
        connected = true;
        return currentAccount;
      }),

      disconnect: vi.fn(async () => {
        connected = false;
      }),

      account: () => (connected ? currentAccount : null),

      isConnected: () => connected,

      signTransaction: vi.fn(async (tx: any) => ({
        ...tx,
        signature: 'mock-signature',
        publicKey: currentAccount.publicKey,
      })),

      signMessage: vi.fn(async ({ message }: { message: string }) => ({
        signature: 'mock-message-signature',
        fullMessage: message,
      })),

      signAndSubmitTransaction: vi.fn(async (tx: any) => ({
        hash: 'mock-tx-hash-' + Date.now(),
        success: true,
      })),

      onAccountChange: vi.fn((callback: (account: any) => void) => {
        // Mock implementation
      }),

      onDisconnect: vi.fn((callback: () => void) => {
        // Mock implementation
      }),

      network: vi.fn(async (rpcUrl?: string) => {
        if (rpcUrl) {
          console.log('Mock: Setting RPC to', rpcUrl);
        }
        return currentAccount.network;
      }),
    },
  };
}
```

---

## 11. Documentation Requirements

### 11.1 Developer Documentation Structure

```markdown
docs/
├── README.md                           # Overview
├── getting-started.md                  # Quick start guide
├── architecture.md                     # Technical architecture
├── wallets/
│   ├── aptos/
│   │   ├── petra.md
│   │   ├── martian.md
│   │   └── nightly.md
│   ├── sui/
│   │   ├── sui-wallet.md
│   │   ├── suiet.md
│   │   ├── martian.md
│   │   ├── nightly.md
│   │   ├── surf.md
│   │   └── backpack.md
│   └── institutional/
│       ├── safe.md
│       └── mpcvault.md
│
├── guides/
│   ├── wallet-integration.md           # Adding new wallets
│   ├── hardware-wallets.md             # Ledger/Keystone setup
│   ├── zklogin.md                      # zkLogin implementation
│   ├── multi-sig.md                    # Multi-sig setup
│   └── testing.md                      # Testing guide
│
├── api/
│   ├── hooks.md                        # React hooks API
│   ├── adapters.md                     # Wallet adapter API
│   ├── providers.md                    # Provider components
│   └── utilities.md                    # Utility functions
│
└── troubleshooting/
    ├── common-issues.md
    ├── error-codes.md
    └── faq.md
```

### 11.2 User Documentation

```markdown
# Connecting Your Wallet

## Aptos Wallets

### Petra Wallet
1. Install Petra extension from [Chrome Web Store](https://petra.app)
2. Create or import your wallet
3. Visit the prediction market app
4. Click "Connect Wallet"
5. Select "Petra" from the list
6. Approve the connection in the Petra popup

### Martian Wallet
...

## Sui Wallets

### Sui Wallet
...

### Suiet Wallet (with Ledger)
...

## Hardware Wallets

### Connecting Ledger
...

### Connecting Keystone
...

## Institutional Wallets

### Setting up Safe Multi-sig
...

## Troubleshooting

### "Wallet not detected"
- Ensure the browser extension is installed
- Refresh the page
- Try disabling other wallet extensions

### "Transaction failed"
- Check your wallet balance
- Verify network selection (testnet vs mainnet)
- Ensure the Aptos/Sui app is open on Ledger

### "Connection timeout"
- Check your internet connection
- Try reconnecting
- Clear browser cache
```

---

## 12. Migration & Maintenance

### 12.1 Migration Plan from Current State

#### Phase 1: Create Parallel Implementation

```bash
# Create new wallet module alongside existing
dapp/src/
├── contexts/              # OLD (keep temporarily)
│   ├── WalletContext.tsx
│   └── SuiWalletContext.tsx
│
└── wallet/               # NEW (implement here)
    ├── core/
    ├── adapters/
    └── providers/
```

#### Phase 2: Gradual Component Migration

```typescript
// Step 1: Migrate WalletButton first
// dapp/src/components/layout/Header.tsx

// OLD
import { useWallet } from '@aptos-labs/wallet-adapter-react';

// NEW (backwards compatible)
import { useWallet } from '../wallet/hooks/useWallet'; // Wraps old hooks

// Step 2: Update other components one by one
// Step 3: Remove old contexts once fully migrated
```

#### Phase 3: Testing & Rollback Strategy

```typescript
// Feature flag for new wallet system
export const WALLET_V2_ENABLED =
  import.meta.env.VITE_WALLET_V2 === 'true' ||
  import.meta.env.DEV;

// In app
if (WALLET_V2_ENABLED) {
  return <NewWalletProvider>...</NewWalletProvider>;
} else {
  return <OldWalletContext>...</OldWalletContext>;
}
```

### 12.2 Adding New Wallets (Future-Proofing)

```typescript
// Example: Adding "FooWallet" in 2026

// 1. Create adapter
// dapp/src/wallet/adapters/aptos/FooAdapter.ts
export class FooAdapter extends BaseWalletAdapter {
  metadata: WalletMetadata = {
    name: 'Foo Wallet',
    icon: '/assets/wallets/foo.svg',
    website: 'https://foowallet.com',
    brandColor: '#FF5733',
    description: 'Next-gen wallet with AI features',
    downloadUrls: {
      chrome: 'https://chrome.google.com/...',
    },
  };

  // Implement abstract methods
  async connect() { /* ... */ }
  async disconnect() { /* ... */ }
  // ... etc
}

// 2. Register wallet
// dapp/src/wallet/config/wallets.ts
import { FooAdapter } from '../adapters/aptos/FooAdapter';

export const WALLET_REGISTRY = {
  aptos: [
    { name: 'Petra', adapter: PetraAdapter },
    { name: 'Martian', adapter: MartianAptosAdapter },
    { name: 'Nightly', adapter: NightlyAptosAdapter },
    { name: 'Foo', adapter: FooAdapter }, // ✅ Add here
  ],
  sui: [
    // ...
  ],
};

// 3. Add branding
// dapp/src/wallet/config/walletBrands.ts
{
  ids: ['foo', 'foo wallet'],
  info: {
    icon: '/assets/wallets/foo.svg',
    brandColor: '#FF5733',
    website: 'https://foowallet.com',
    initials: 'F',
  },
}

// 4. Write tests
// dapp/src/wallet/__tests__/unit/adapters/FooAdapter.test.ts

// 5. Update docs
// docs/wallets/aptos/foo.md

// DONE! No changes needed to UI components 🎉
```

### 12.3 Dependency Management

```json
// package.json

{
  "scripts": {
    "wallet:audit": "npm audit --audit-level=moderate",
    "wallet:outdated": "npm outdated | grep wallet",
    "wallet:update": "npm update @aptos-labs/* @mysten/* @nightlylabs/*"
  },

  "devDependencies": {
    "npm-check-updates": "^16.14.20"
  }
}
```

**Monthly Maintenance Checklist:**

- [ ] Run `npm wallet:outdated` to check for updates
- [ ] Review changelogs for breaking changes
- [ ] Test wallet connections after updates
- [ ] Update adapter implementations if APIs changed
- [ ] Run full test suite
- [ ] Update documentation

### 12.4 Version Compatibility Matrix

| Package | Current | Target | Breaking Changes | Action |
|---------|---------|--------|------------------|--------|
| `@aptos-labs/wallet-adapter-react` | 3.7.0 | 4.0.0 | Hook API renamed | Update imports |
| `@mysten/dapp-kit` | 0.14.53 | 1.0.0 | Provider props changed | Update WalletProvider |
| `@nightlylabs/aptos-wallet-adapter` | 1.0.11 | 1.2.0 | None | Safe to update |

---

## 13. Success Criteria & KPIs

### 13.1 Technical Metrics

- **Wallet Coverage:** 95% of target user's preferred wallets supported
- **Connection Success Rate:** > 99% for installed wallets
- **Connection Time:** < 2 seconds average
- **Error Rate:** < 0.1% failed transactions
- **Bundle Size Impact:** < 200KB added to main bundle
- **Test Coverage:** > 80% unit test coverage, 100% critical paths

### 13.2 User Experience Metrics

- **Time to First Connection:** < 30 seconds for new users
- **Wallet Switch Time:** < 3 seconds
- **Mobile Parity:** 100% feature parity between mobile/desktop
- **User Satisfaction:** > 4.5/5 stars in wallet connection flow

### 13.3 Security Metrics

- **Zero Private Key Exposures:** 0 incidents
- **Hardware Wallet Adoption:** > 20% of power users
- **Multi-sig Usage:** > 50% of institutional users
- **Session Security:** 100% sessions encrypted

---

## 14. Appendices

### Appendix A: Glossary

- **Wallet Adapter:** Software layer that normalizes wallet APIs
- **zkLogin:** Zero-knowledge proof authentication (no private keys)
- **Multi-sig:** Wallet requiring multiple signatures for transactions
- **Hardware Wallet:** Physical device storing private keys (e.g., Ledger)
- **WalletConnect:** Protocol for mobile wallet connections via QR code
- **Derivation Path:** Cryptographic path to generate keys (e.g., m/44'/784'/0'/0'/0')

### Appendix B: Useful Links

**Aptos:**
- Wallet Adapter: https://github.com/aptos-labs/aptos-wallet-adapter
- Aptos SDK: https://github.com/aptos-labs/aptos-ts-sdk
- Petra Docs: https://petra.app/docs
- Martian Docs: https://docs.martianwallet.xyz

**Sui:**
- dApp Kit: https://sdk.mystenlabs.com/dapp-kit
- Wallet Standard: https://github.com/wallet-standard/wallet-standard
- Suiet Docs: https://suiet.app/docs

**Hardware Wallets:**
- Ledger Dev Docs: https://developers.ledger.com
- Keystone SDK: https://github.com/KeystoneHQ/keystone-sdk

**Institutional:**
- Safe Docs: https://docs.safe.global
- Fireblocks: https://developers.fireblocks.com

### Appendix C: Code Conventions

```typescript
// Naming Conventions
// - Adapters: [WalletName][Chain]Adapter (e.g., MartianAptosAdapter)
// - Hooks: use[Feature] (e.g., useWalletConnect)
// - Components: PascalCase (e.g., WalletSelector)
// - Utils: camelCase (e.g., validateTransaction)

// File Organization
// - Each adapter in separate file
// - Related utils grouped in files (security.ts, validation.ts)
// - Tests mirror source structure

// Error Handling
// - Use custom error classes (WalletConnectionError, etc.)
// - Always include error codes
// - Log errors with context

// TypeScript
// - Strict mode enabled
// - No implicit any
// - Explicit return types for public APIs
```

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building production-ready, extensible multi-wallet support for your Aptos + Sui prediction market dApp.

**Key Takeaways:**

1. ✅ **Modular Architecture:** Base adapter pattern allows easy wallet additions
2. ✅ **Security First:** No private key exposure, hardware wallet support, session encryption
3. ✅ **User Experience:** < 2s connections, mobile parity, auto-detection
4. ✅ **Institutional Ready:** Multi-sig, MPC, compliance features
5. ✅ **Future-Proof:** Easy to add new wallets through 2026+

**Next Steps:**

1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation (Week 1)
4. Iterate based on user feedback

**Estimated Timeline:** 8 weeks for full implementation
**Team Size:** 2-3 developers recommended
**Budget Impact:** ~$15K in dependencies (wallet SDKs are free/open source)

---

**Document Maintainer:** Development Team
**Last Review:** 2025-10-24
**Next Review:** 2025-11-24 (monthly)
