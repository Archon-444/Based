# P0 Wallet Implementation Guide
## Martian, Nightly, Suiet - Production Ready

**Status:** Ready for Implementation
**Target:** Testnet Deployment
**Timeline:** 2-3 weeks
**Last Updated:** 2025-01-24

---

## Executive Summary

This guide provides **actionable implementation steps** for the three priority wallets:

1. **Martian** - Cross-chain (Aptos + Sui), web + mobile
2. **Nightly** - Universal wallet (Aptos + Sui + more), web + mobile
3. **Suiet** - Sui-focused, web extension

**Key Decisions:**
- ✅ Hardware wallets: Post-beta (upon demand)
- ✅ Institutional wallets: Post-beta (upon demand)
- ✅ Mobile support: Via WalletConnect + deep linking
- ✅ Web support: Browser extensions

---

## Table of Contents

1. [Dependencies](#dependencies)
2. [Architecture](#architecture)
3. [Implementation Steps](#implementation-steps)
4. [Martian Wallet](#martian-wallet)
5. [Nightly Wallet](#nightly-wallet)
6. [Suiet Wallet](#suiet-wallet)
7. [Mobile Support](#mobile-support)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Dependencies

### Required Package Updates

```bash
# Navigate to dapp directory
cd dapp

# Update Martian adapter (from 0.0.5 to latest)
npm install @martianwallet/aptos-wallet-adapter@latest

# Add Nightly support
npm install @nightlylabs/aptos-wallet-adapter-plugin@latest
npm install @nightlylabs/sui-wallet-adapter@latest

# Update Suiet
npm install @suiet/wallet-kit@latest

# Mobile support (WalletConnect)
npm install @walletconnect/web3wallet@latest
npm install @walletconnect/modal@latest
```

### Verify Installations

```bash
npm list @martianwallet/aptos-wallet-adapter
npm list @nightlylabs/aptos-wallet-adapter-plugin
npm list @suiet/wallet-kit
```

---

## Architecture

### Module Structure

```
dapp/src/wallet/
├── adapters/
│   ├── aptos/
│   │   ├── MartianAdapter.ts          # ✅ NEW
│   │   ├── NightlyAdapter.ts          # ✅ NEW
│   │   └── index.ts
│   │
│   ├── sui/
│   │   ├── MartianSuiAdapter.ts       # ✅ NEW
│   │   ├── NightlySuiAdapter.ts       # ✅ NEW
│   │   ├── SuietAdapter.ts            # ✅ ENHANCE
│   │   └── index.ts
│   │
│   └── mobile/
│       ├── WalletConnectAdapter.ts    # ✅ NEW
│       └── index.ts
│
├── hooks/
│   ├── useWalletAdapter.ts            # ✅ NEW
│   ├── useWalletConnect.ts            # ✅ ENHANCE
│   └── useMobileWallet.ts             # ✅ NEW
│
├── utils/
│   ├── walletDetection.ts             # ✅ NEW
│   ├── mobileDetection.ts             # ✅ NEW
│   └── deepLinks.ts                   # ✅ NEW
│
└── config/
    └── wallets.config.ts              # ✅ UPDATE
```

---

## Implementation Steps

### Phase 1: Setup (Day 1)

#### Step 1.1: Install Dependencies

```bash
cd dapp
npm install @martianwallet/aptos-wallet-adapter@latest \
            @nightlylabs/aptos-wallet-adapter-plugin@latest \
            @nightlylabs/sui-wallet-adapter@latest \
            @suiet/wallet-kit@latest \
            @walletconnect/web3wallet@latest \
            @walletconnect/modal@latest
```

#### Step 1.2: Create Wallet Config

```typescript
// dapp/src/wallet/config/wallets.config.ts

export const WALLET_CONFIG = {
  // Martian
  martian: {
    name: 'Martian',
    chains: ['aptos', 'sui'],
    platforms: ['extension', 'mobile'],
    icon: '/assets/wallets/martian.svg',
    brandColor: '#171A1F',
    downloadUrls: {
      chrome: 'https://chrome.google.com/webstore/detail/martian-aptos-wallet/efbglgofoippbgcjepnhiblaibcnclgk',
      ios: 'https://apps.apple.com/app/martian-wallet/id6443824542',
      android: 'https://play.google.com/store/apps/details?id=com.martianwallet',
    },
    deepLink: 'martian://',
    universalLink: 'https://martianwallet.xyz/app',
  },

  // Nightly
  nightly: {
    name: 'Nightly',
    chains: ['aptos', 'sui', 'solana', 'ethereum'],
    platforms: ['extension', 'mobile'],
    icon: '/assets/wallets/nightly.svg',
    brandColor: '#1F1A5F',
    downloadUrls: {
      chrome: 'https://chrome.google.com/webstore/detail/nightly/fiikommddbeccaoicoejoniammnalkfa',
      ios: 'https://apps.apple.com/app/nightly/id1592588017',
      android: 'https://play.google.com/store/apps/details?id=com.nightly.app',
    },
    deepLink: 'nightly://',
    universalLink: 'https://nightly.app/connect',
  },

  // Suiet
  suiet: {
    name: 'Suiet',
    chains: ['sui'],
    platforms: ['extension'],
    icon: '/assets/wallets/suiet.svg',
    brandColor: '#000000',
    downloadUrls: {
      chrome: 'https://chrome.google.com/webstore/detail/suiet/khpkpbbcccdmmclmpigdgddabeilkdpd',
    },
  },
};

export type WalletName = keyof typeof WALLET_CONFIG;
```

### Phase 2: Martian Integration (Days 2-3)

#### Martian Aptos Adapter

```typescript
// dapp/src/wallet/adapters/aptos/MartianAdapter.ts

import { WalletName } from '@aptos-labs/wallet-adapter-react';

interface MartianWindow {
  martian?: {
    aptos?: {
      connect(): Promise<{ address: string; publicKey: string }>;
      disconnect(): Promise<void>;
      isConnected(): boolean;
      account(): Promise<{ address: string; publicKey: string } | null>;
      signTransaction(transaction: any): Promise<any>;
      signMessage(message: { message: string; nonce: string }): Promise<any>;
      signAndSubmitTransaction(transaction: any): Promise<{ hash: string }>;
      onAccountChange(callback: (account: any) => void): void;
      onDisconnect(callback: () => void): void;
      network(): Promise<string>;
    };
  };
}

declare const window: MartianWindow & Window;

export class MartianAptosAdapter {
  private _connecting = false;
  private _connected = false;
  private _account: { address: string; publicKey: string } | null = null;

  get name(): WalletName {
    return 'Martian' as WalletName;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return this._connected;
  }

  get account() {
    return this._account;
  }

  /**
   * Check if Martian is installed
   */
  async isInstalled(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return !!(window.martian?.aptos);
  }

  /**
   * Connect to Martian wallet
   */
  async connect(): Promise<{ address: string; publicKey: string }> {
    try {
      this._connecting = true;

      // Check if installed
      const installed = await this.isInstalled();
      if (!installed) {
        throw new Error('Martian wallet is not installed. Please install it from the Chrome Web Store.');
      }

      // Connect
      const result = await window.martian!.aptos!.connect();

      this._account = result;
      this._connected = true;
      this._connecting = false;

      // Setup listeners
      this.setupListeners();

      console.log('[Martian] Connected:', result.address);
      return result;
    } catch (error: any) {
      this._connecting = false;
      this._connected = false;
      console.error('[Martian] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Martian
   */
  async disconnect(): Promise<void> {
    try {
      if (window.martian?.aptos) {
        await window.martian.aptos.disconnect();
      }
      this._account = null;
      this._connected = false;
      console.log('[Martian] Disconnected');
    } catch (error) {
      console.error('[Martian] Disconnect failed:', error);
      // Still update state even if API call fails
      this._account = null;
      this._connected = false;
    }
  }

  /**
   * Sign a transaction
   */
  async signTransaction(transaction: any): Promise<any> {
    if (!this._connected || !window.martian?.aptos) {
      throw new Error('Martian wallet not connected');
    }

    try {
      const signed = await window.martian.aptos.signTransaction(transaction);
      console.log('[Martian] Transaction signed');
      return signed;
    } catch (error: any) {
      console.error('[Martian] Sign transaction failed:', error);
      throw error;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<any> {
    if (!this._connected || !window.martian?.aptos) {
      throw new Error('Martian wallet not connected');
    }

    try {
      const result = await window.martian.aptos.signMessage({
        message,
        nonce: Date.now().toString(),
      });
      console.log('[Martian] Message signed');
      return result;
    } catch (error: any) {
      console.error('[Martian] Sign message failed:', error);
      throw error;
    }
  }

  /**
   * Sign and submit a transaction
   */
  async signAndSubmitTransaction(transaction: any): Promise<string> {
    if (!this._connected || !window.martian?.aptos) {
      throw new Error('Martian wallet not connected');
    }

    try {
      const result = await window.martian.aptos.signAndSubmitTransaction(transaction);
      console.log('[Martian] Transaction submitted:', result.hash);
      return result.hash;
    } catch (error: any) {
      console.error('[Martian] Submit transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get current network
   */
  async getNetwork(): Promise<string> {
    if (!window.martian?.aptos) {
      throw new Error('Martian wallet not available');
    }

    try {
      return await window.martian.aptos.network();
    } catch (error) {
      console.error('[Martian] Get network failed:', error);
      return 'mainnet';
    }
  }

  /**
   * Setup event listeners
   */
  private setupListeners(): void {
    if (!window.martian?.aptos) return;

    // Account changed
    window.martian.aptos.onAccountChange((newAccount: any) => {
      console.log('[Martian] Account changed:', newAccount);
      this._account = newAccount;
    });

    // Disconnected
    window.martian.aptos.onDisconnect(() => {
      console.log('[Martian] Disconnected via event');
      this._account = null;
      this._connected = false;
    });
  }
}

// Export singleton instance
export const martianAptosAdapter = new MartianAptosAdapter();
```

#### Martian Sui Adapter

```typescript
// dapp/src/wallet/adapters/sui/MartianSuiAdapter.ts

interface MartianSuiWindow {
  martian?: {
    sui?: {
      connect(): Promise<{ address: string; publicKey: string }>;
      disconnect(): Promise<void>;
      isConnected(): boolean;
      getAccounts(): Promise<string[]>;
      signAndExecuteTransaction(transaction: any): Promise<{ digest: string }>;
      signMessage(message: { message: string }): Promise<{ signature: string }>;
      onAccountChange(callback: (accounts: string[]) => void): void;
      onDisconnect(callback: () => void): void;
    };
  };
}

declare const window: MartianSuiWindow & Window;

export class MartianSuiAdapter {
  private _connecting = false;
  private _connected = false;
  private _account: { address: string; publicKey: string } | null = null;

  get name() {
    return 'Martian';
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return this._connected;
  }

  get account() {
    return this._account;
  }

  async isInstalled(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return !!(window.martian?.sui);
  }

  async connect(): Promise<{ address: string; publicKey: string }> {
    try {
      this._connecting = true;

      const installed = await this.isInstalled();
      if (!installed) {
        throw new Error('Martian wallet is not installed');
      }

      const result = await window.martian!.sui!.connect();

      this._account = result;
      this._connected = true;
      this._connecting = false;

      this.setupListeners();

      console.log('[Martian Sui] Connected:', result.address);
      return result;
    } catch (error: any) {
      this._connecting = false;
      this._connected = false;
      console.error('[Martian Sui] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (window.martian?.sui) {
        await window.martian.sui.disconnect();
      }
      this._account = null;
      this._connected = false;
      console.log('[Martian Sui] Disconnected');
    } catch (error) {
      console.error('[Martian Sui] Disconnect failed:', error);
      this._account = null;
      this._connected = false;
    }
  }

  async signAndExecuteTransaction(transaction: any): Promise<string> {
    if (!this._connected || !window.martian?.sui) {
      throw new Error('Martian wallet not connected');
    }

    try {
      const result = await window.martian.sui.signAndExecuteTransaction(transaction);
      console.log('[Martian Sui] Transaction executed:', result.digest);
      return result.digest;
    } catch (error: any) {
      console.error('[Martian Sui] Execute transaction failed:', error);
      throw error;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this._connected || !window.martian?.sui) {
      throw new Error('Martian wallet not connected');
    }

    try {
      const result = await window.martian.sui.signMessage({ message });
      console.log('[Martian Sui] Message signed');
      return result.signature;
    } catch (error: any) {
      console.error('[Martian Sui] Sign message failed:', error);
      throw error;
    }
  }

  private setupListeners(): void {
    if (!window.martian?.sui) return;

    window.martian.sui.onAccountChange((accounts: string[]) => {
      console.log('[Martian Sui] Account changed:', accounts);
      if (accounts.length > 0 && this._account) {
        this._account.address = accounts[0];
      }
    });

    window.martian.sui.onDisconnect(() => {
      console.log('[Martian Sui] Disconnected via event');
      this._account = null;
      this._connected = false;
    });
  }
}

export const martianSuiAdapter = new MartianSuiAdapter();
```

### Phase 3: Nightly Integration (Days 4-5)

#### Nightly Aptos Adapter

```typescript
// dapp/src/wallet/adapters/aptos/NightlyAdapter.ts

import { NightlyConnectAdapter } from '@nightlylabs/aptos-wallet-adapter-plugin';

export class NightlyAptosAdapter {
  private adapter: NightlyConnectAdapter | null = null;
  private _connecting = false;
  private _connected = false;

  constructor() {
    this.initializeAdapter();
  }

  private initializeAdapter(): void {
    try {
      this.adapter = new NightlyConnectAdapter({
        appMetadata: {
          name: 'Move Market',
          description: 'Decentralized prediction market on Aptos',
          icon: 'https://yourapp.com/logo.png',
        },
        network: 'Testnet', // or 'Mainnet'
      });
    } catch (error) {
      console.error('[Nightly] Failed to initialize adapter:', error);
    }
  }

  get name() {
    return 'Nightly';
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return this._connected;
  }

  get account() {
    return this.adapter?.publicAccount ?? null;
  }

  async isInstalled(): Promise<boolean> {
    // Nightly Connect works even without extension (uses QR code)
    return true;
  }

  async connect(): Promise<any> {
    if (!this.adapter) {
      throw new Error('Nightly adapter not initialized');
    }

    try {
      this._connecting = true;

      await this.adapter.connect();

      this._connected = this.adapter.connected;
      this._connecting = false;

      console.log('[Nightly] Connected:', this.account?.address);
      return this.account;
    } catch (error: any) {
      this._connecting = false;
      this._connected = false;
      console.error('[Nightly] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.adapter) return;

    try {
      await this.adapter.disconnect();
      this._connected = false;
      console.log('[Nightly] Disconnected');
    } catch (error) {
      console.error('[Nightly] Disconnect failed:', error);
      this._connected = false;
    }
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.adapter || !this._connected) {
      throw new Error('Nightly wallet not connected');
    }

    try {
      const signed = await this.adapter.signTransaction(transaction);
      console.log('[Nightly] Transaction signed');
      return signed;
    } catch (error: any) {
      console.error('[Nightly] Sign transaction failed:', error);
      throw error;
    }
  }

  async signMessage(message: { message: string; nonce: string }): Promise<any> {
    if (!this.adapter || !this._connected) {
      throw new Error('Nightly wallet not connected');
    }

    try {
      const signed = await this.adapter.signMessage(message);
      console.log('[Nightly] Message signed');
      return signed;
    } catch (error: any) {
      console.error('[Nightly] Sign message failed:', error);
      throw error;
    }
  }

  async signAndSubmitTransaction(transaction: any): Promise<string> {
    if (!this.adapter || !this._connected) {
      throw new Error('Nightly wallet not connected');
    }

    try {
      const result = await this.adapter.signAndSubmitTransaction(transaction);
      console.log('[Nightly] Transaction submitted:', result.hash);
      return result.hash;
    } catch (error: any) {
      console.error('[Nightly] Submit transaction failed:', error);
      throw error;
    }
  }
}

export const nightlyAptosAdapter = new NightlyAptosAdapter();
```

#### Nightly Sui Adapter

```typescript
// dapp/src/wallet/adapters/sui/NightlySuiAdapter.ts

import { NightlyConnectSuiAdapter } from '@nightlylabs/sui-wallet-adapter';

export class NightlySuiAdapter {
  private adapter: NightlyConnectSuiAdapter | null = null;
  private _connecting = false;
  private _connected = false;

  constructor() {
    this.initializeAdapter();
  }

  private initializeAdapter(): void {
    try {
      this.adapter = new NightlyConnectSuiAdapter({
        appMetadata: {
          name: 'Move Market',
          description: 'Decentralized prediction market on Sui',
          icon: 'https://yourapp.com/logo.png',
        },
      });
    } catch (error) {
      console.error('[Nightly Sui] Failed to initialize adapter:', error);
    }
  }

  get name() {
    return 'Nightly';
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return this._connected;
  }

  get account() {
    return this.adapter?.accounts?.[0] ?? null;
  }

  async isInstalled(): Promise<boolean> {
    return true; // Works with QR code
  }

  async connect(): Promise<any> {
    if (!this.adapter) {
      throw new Error('Nightly adapter not initialized');
    }

    try {
      this._connecting = true;

      await this.adapter.connect();

      this._connected = this.adapter.connected;
      this._connecting = false;

      console.log('[Nightly Sui] Connected:', this.account);
      return this.account;
    } catch (error: any) {
      this._connecting = false;
      this._connected = false;
      console.error('[Nightly Sui] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.adapter) return;

    try {
      await this.adapter.disconnect();
      this._connected = false;
      console.log('[Nightly Sui] Disconnected');
    } catch (error) {
      console.error('[Nightly Sui] Disconnect failed:', error);
      this._connected = false;
    }
  }

  async signAndExecuteTransactionBlock(transactionBlock: any): Promise<string> {
    if (!this.adapter || !this._connected) {
      throw new Error('Nightly wallet not connected');
    }

    try {
      const result = await this.adapter.signAndExecuteTransactionBlock({
        transactionBlock,
      });
      console.log('[Nightly Sui] Transaction executed:', result.digest);
      return result.digest;
    } catch (error: any) {
      console.error('[Nightly Sui] Execute transaction failed:', error);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<any> {
    if (!this.adapter || !this._connected) {
      throw new Error('Nightly wallet not connected');
    }

    try {
      const signed = await this.adapter.signMessage({ message });
      console.log('[Nightly Sui] Message signed');
      return signed;
    } catch (error: any) {
      console.error('[Nightly Sui] Sign message failed:', error);
      throw error;
    }
  }
}

export const nightlySuiAdapter = new NightlySuiAdapter();
```

### Phase 4: Enhanced Suiet Integration (Day 6)

```typescript
// dapp/src/wallet/adapters/sui/SuietAdapter.ts

import { WalletProvider, useWallet } from '@suiet/wallet-kit';

/**
 * Enhanced Suiet adapter
 * Already integrated via @mysten/dapp-kit, but we add direct access
 */
export class SuietAdapter {
  private wallet: any = null;

  get name() {
    return 'Suiet';
  }

  get connected(): boolean {
    return this.wallet?.connected ?? false;
  }

  get account() {
    return this.wallet?.account ?? null;
  }

  /**
   * Initialize with Suiet wallet instance from hook
   */
  initialize(walletInstance: any): void {
    this.wallet = walletInstance;
  }

  async isInstalled(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return !!(window as any).suiWallet;
  }

  async connect(): Promise<any> {
    if (!this.wallet) {
      throw new Error('Suiet wallet not initialized. Use within SuietProvider.');
    }

    try {
      await this.wallet.connect();
      console.log('[Suiet] Connected:', this.account);
      return this.account;
    } catch (error: any) {
      console.error('[Suiet] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.wallet) return;

    try {
      await this.wallet.disconnect();
      console.log('[Suiet] Disconnected');
    } catch (error) {
      console.error('[Suiet] Disconnect failed:', error);
    }
  }

  async signAndExecuteTransactionBlock(transactionBlock: any): Promise<string> {
    if (!this.wallet || !this.connected) {
      throw new Error('Suiet wallet not connected');
    }

    try {
      const result = await this.wallet.signAndExecuteTransactionBlock({
        transactionBlock,
      });
      console.log('[Suiet] Transaction executed:', result.digest);
      return result.digest;
    } catch (error: any) {
      console.error('[Suiet] Execute transaction failed:', error);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<any> {
    if (!this.wallet || !this.connected) {
      throw new Error('Suiet wallet not connected');
    }

    try {
      const signed = await this.wallet.signMessage({ message });
      console.log('[Suiet] Message signed');
      return signed;
    } catch (error: any) {
      console.error('[Suiet] Sign message failed:', error);
      throw error;
    }
  }
}

export const suietAdapter = new SuietAdapter();
```

### Phase 5: Mobile Support (Days 7-8)

#### WalletConnect Integration

```typescript
// dapp/src/wallet/adapters/mobile/WalletConnectAdapter.ts

import { Web3Wallet } from '@walletconnect/web3wallet';
import { WalletConnectModal } from '@walletconnect/modal';

interface WalletConnectConfig {
  projectId: string; // Get from https://cloud.walletconnect.com
  chains: string[];
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

export class WalletConnectAdapter {
  private web3wallet: Web3Wallet | null = null;
  private modal: WalletConnectModal | null = null;
  private config: WalletConnectConfig;
  private _connected = false;
  private _session: any = null;

  constructor(config: WalletConnectConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Web3Wallet
      this.web3wallet = await Web3Wallet.init({
        projectId: this.config.projectId,
        metadata: this.config.metadata,
      });

      // Initialize modal
      this.modal = new WalletConnectModal({
        projectId: this.config.projectId,
        chains: this.config.chains,
      });

      console.log('[WalletConnect] Initialized');
    } catch (error) {
      console.error('[WalletConnect] Initialization failed:', error);
      throw error;
    }
  }

  async connect(): Promise<{ address: string }> {
    if (!this.web3wallet || !this.modal) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      // Open modal for QR code
      const { uri, approval } = await this.web3wallet.connect({
        requiredNamespaces: {
          aptos: {
            methods: ['aptos_signTransaction', 'aptos_signMessage'],
            chains: this.config.chains,
            events: [],
          },
        },
      });

      if (uri) {
        await this.modal.openModal({ uri });
      }

      // Wait for approval
      this._session = await approval();
      this._connected = true;

      this.modal.closeModal();

      const address = this._session.namespaces.aptos.accounts[0].split(':')[2];

      console.log('[WalletConnect] Connected:', address);
      return { address };
    } catch (error: any) {
      console.error('[WalletConnect] Connection failed:', error);
      this.modal?.closeModal();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.web3wallet || !this._session) return;

    try {
      await this.web3wallet.disconnectSession({
        topic: this._session.topic,
        reason: {
          code: 6000,
          message: 'User disconnected',
        },
      });

      this._connected = false;
      this._session = null;

      console.log('[WalletConnect] Disconnected');
    } catch (error) {
      console.error('[WalletConnect] Disconnect failed:', error);
      this._connected = false;
      this._session = null;
    }
  }

  get connected(): boolean {
    return this._connected;
  }

  get session() {
    return this._session;
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.web3wallet || !this._session) {
      throw new Error('WalletConnect not connected');
    }

    try {
      const result = await this.web3wallet.request({
        topic: this._session.topic,
        chainId: this.config.chains[0],
        request: {
          method: 'aptos_signTransaction',
          params: { transaction },
        },
      });

      console.log('[WalletConnect] Transaction signed');
      return result;
    } catch (error: any) {
      console.error('[WalletConnect] Sign transaction failed:', error);
      throw error;
    }
  }
}

// Configuration
export const walletConnectConfig: WalletConnectConfig = {
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  chains: ['aptos:1'], // Aptos mainnet
  metadata: {
    name: 'Move Market',
    description: 'Decentralized prediction market',
    url: 'https://yourapp.com',
    icons: ['https://yourapp.com/logo.png'],
  },
};
```

#### Deep Link Utilities

```typescript
// dapp/src/wallet/utils/deepLinks.ts

import { WALLET_CONFIG } from '../config/wallets.config';

/**
 * Check if user is on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get platform (iOS or Android)
 */
export function getPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent;

  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Open wallet app via deep link
 */
export function openWalletApp(walletName: keyof typeof WALLET_CONFIG): void {
  const wallet = WALLET_CONFIG[walletName];

  if (!wallet || !isMobile()) {
    console.warn('[DeepLink] Not on mobile or wallet not configured');
    return;
  }

  const platform = getPlatform();

  // Try deep link first
  if (wallet.deepLink) {
    window.location.href = wallet.deepLink;

    // Fallback to app store if deep link doesn't work
    setTimeout(() => {
      if (platform === 'ios' && wallet.downloadUrls.ios) {
        window.location.href = wallet.downloadUrls.ios;
      } else if (platform === 'android' && wallet.downloadUrls.android) {
        window.location.href = wallet.downloadUrls.android;
      }
    }, 1500);
  }
  // Try universal link
  else if (wallet.universalLink) {
    window.location.href = wallet.universalLink;
  }
}

/**
 * Check if wallet app is installed on mobile
 */
export async function isWalletAppInstalled(
  walletName: keyof typeof WALLET_CONFIG
): Promise<boolean> {
  const wallet = WALLET_CONFIG[walletName];

  if (!wallet || !isMobile() || !wallet.deepLink) {
    return false;
  }

  // Try to open deep link in hidden iframe
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = wallet.deepLink!;

    document.body.appendChild(iframe);

    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      resolve(false); // Timeout = app not installed
    }, 1000);

    // If app opens, page will be hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(timeout);
        document.body.removeChild(iframe);
        resolve(true); // App opened = installed
      }
    });
  });
}
```

---

## Testing

### Unit Tests

```typescript
// dapp/src/wallet/__tests__/MartianAdapter.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { martianAptosAdapter } from '../adapters/aptos/MartianAdapter';

describe('MartianAptosAdapter', () => {
  beforeEach(() => {
    // Mock window.martian
    (global as any).window = {
      martian: {
        aptos: {
          connect: vi.fn(() =>
            Promise.resolve({
              address: '0x1234567890abcdef',
              publicKey: 'mock-public-key',
            })
          ),
          disconnect: vi.fn(() => Promise.resolve()),
          isConnected: vi.fn(() => true),
          signTransaction: vi.fn((tx) =>
            Promise.resolve({ ...tx, signature: 'mock-signature' })
          ),
          signAndSubmitTransaction: vi.fn(() =>
            Promise.resolve({ hash: 'mock-tx-hash' })
          ),
          onAccountChange: vi.fn(),
          onDisconnect: vi.fn(),
          network: vi.fn(() => Promise.resolve('testnet')),
        },
      },
    };
  });

  it('should detect Martian installation', async () => {
    const installed = await martianAptosAdapter.isInstalled();
    expect(installed).toBe(true);
  });

  it('should connect to Martian', async () => {
    const account = await martianAptosAdapter.connect();

    expect(account).toBeDefined();
    expect(account.address).toBe('0x1234567890abcdef');
    expect(martianAptosAdapter.connected).toBe(true);
  });

  it('should sign transaction', async () => {
    await martianAptosAdapter.connect();

    const transaction = { type: 'entry_function_payload' };
    const signed = await martianAptosAdapter.signTransaction(transaction);

    expect(signed.signature).toBe('mock-signature');
  });

  it('should disconnect', async () => {
    await martianAptosAdapter.connect();
    await martianAptosAdapter.disconnect();

    expect(martianAptosAdapter.connected).toBe(false);
    expect(martianAptosAdapter.account).toBeNull();
  });
});
```

### Integration Tests

```bash
# Create test suite
mkdir -p dapp/src/wallet/__tests__

# Run tests
npm test
```

---

## Deployment

### Environment Variables

```bash
# dapp/.env

# WalletConnect (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# App metadata
VITE_APP_NAME=Move Market
VITE_APP_DESCRIPTION=Decentralized prediction market
VITE_APP_URL=https://yourapp.com
VITE_APP_ICON=https://yourapp.com/logo.png
```

### Build for Production

```bash
cd dapp

# Build
npm run build

# Preview
npm run preview
```

### Deploy to Testnet

```bash
# Your hosting provider (Vercel, Netlify, etc.)
# Example for Vercel:
vercel --prod

# Or manual deployment:
# Upload dist/ folder to your hosting
```

### Verify Deployment

1. **Test Martian Connection**
   - Open app on desktop with Martian installed
   - Click "Connect Wallet" → Select "Martian"
   - Verify connection works

2. **Test Nightly Connection**
   - Try with Nightly extension
   - Try QR code flow on mobile

3. **Test Suiet Connection**
   - Connect Suiet wallet
   - Sign a test transaction

4. **Test Mobile Wallets**
   - Open on mobile device
   - Try deep linking to Martian/Nightly app
   - Test WalletConnect QR code

---

## Success Checklist

### Pre-Launch

- [ ] All P0 wallets installed: Martian, Nightly, Suiet
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Desktop browser extension wallets working
- [ ] Mobile wallet deep links working
- [ ] WalletConnect QR code flow working
- [ ] Error handling tested
- [ ] Documentation complete

### Post-Launch

- [ ] Monitor wallet connection success rates
- [ ] Track user-reported issues
- [ ] Collect feedback on wallet UX
- [ ] Plan hardware wallet integration (if needed)
- [ ] Plan institutional wallet integration (if needed)

---

## Support & Troubleshooting

### Common Issues

**Issue: "Martian not detected"**
- Solution: Install from Chrome Web Store
- Link: https://chrome.google.com/webstore/detail/martian-aptos-wallet/efbglgofoippbgcjepnhiblaibcnclgk

**Issue: "Nightly connection timeout"**
- Solution: Check network connectivity
- Try refreshing QR code
- Ensure mobile app is latest version

**Issue: "Deep link not working on mobile"**
- Solution: Verify wallet app is installed
- Check deep link URL format
- Test universal link fallback

---

## Next Steps

1. **Week 1:** Implement Martian + Nightly adapters
2. **Week 2:** Add mobile support + testing
3. **Week 3:** Deploy to testnet + collect feedback
4. **Post-Beta:** Add hardware wallets if requested
5. **Post-Beta:** Add institutional wallets if requested

---

**Document Status:** Ready for Implementation
**Last Updated:** 2025-01-24
**Maintainer:** Development Team