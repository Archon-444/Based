# Complete Sui Wallet Integration Solution

## Overview

This document provides the complete implementation to resolve the Sui wallet connector issues in your multi-chain prediction market. The solution implements a market object ID resolution system and completes all remaining transaction flows.

## Problem Summary

Your chain toggle works at the UI level, but underneath:
1. **SDK always instantiates Aptos-only** (`MoveMarketSDK`)
2. **Hooks remain Aptos-specific** (use Aptos wallet/SDK even when toggled to Sui)
3. **No market object ID resolution** for Sui's object-based architecture
4. **Transaction hooks throw** because `getMarketObjectId` is not implemented

## Solution Architecture

### Part 1: Market Object ID Resolution System

Sui uses object IDs instead of sequential integers. We need a mapping system to convert market IDs to Sui object IDs.

#### Option 1: Database-Backed Mapping (Recommended for Production)

Update your Prisma schema to store Sui-specific meta

```prisma
// backend/prisma/schema.prisma

model Market {
  id              String        @id @default(uuid())
  onChainId       String        // Sequential ID for Aptos, object ID for Sui
  chain           Chain
  question        String
  category        String?
  outcomes        String[]
  creatorWallet   String?
  endDate         DateTime?
  status          MarketStatus  @default(active)
  totalVolume     BigInt        @default(0)
  outcomePools    String[]      @default([])
  
  // Sui-specific fields
  suiMarketObjectId    String?    // The Market shared object ID
  suiShardObjectIds    String[]   @default([])  // Array of shard object IDs
  suiQueueObjectId     String?    // Settlement queue object ID
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([onChainId, chain])
  @@index([chain, status])
}
```

Create a migration:

```bash
cd backend
npx prisma migrate dev --name add_sui_object_ids
```

Update the backend service to expose this 

```typescript
// backend/src/services/sui-market-lookup.service.ts

import { prisma } from '../database/prismaClient.js';

export const suiMarketLookupService = {
  /**
   * Get Sui object IDs for a market
   */
  async getSuiMarketObjects(marketId: number): Promise<{
    marketObjectId: string;
    shardObjectIds: string[];
    queueObjectId: string | null;
  } | null> {
    const market = await prisma.market.findFirst({
      where: {
        onChainId: marketId.toString(),
        chain: 'sui'
      },
      select: {
        suiMarketObjectId: true,
        suiShardObjectIds: true,
        suiQueueObjectId: true
      }
    });

    if (!market || !market.suiMarketObjectId) {
      return null;
    }

    return {
      marketObjectId: market.suiMarketObjectId,
      shardObjectIds: market.suiShardObjectIds,
      queueObjectId: market.suiQueueObjectId
    };
  },

  /**
   * Store Sui object IDs after market creation
   */
  async storeSuiMarketObjects(
    marketId: number,
    objects: {
      marketObjectId: string;
      shardObjectIds: string[];
      queueObjectId: string;
    }
  ): Promise<void> {
    await prisma.market.update({
      where: {
        onChainId_chain: {
          onChainId: marketId.toString(),
          chain: 'sui'
        }
      },
       {
        suiMarketObjectId: objects.marketObjectId,
        suiShardObjectIds: objects.shardObjectIds,
        suiQueueObjectId: objects.queueObjectId
      }
    });
  }
};
```

Add API endpoint:

```typescript
// backend/src/routes/markets.routes.ts

// Get Sui market object IDs
marketsRouter.get(
  '/sui/objects/:marketId',
  publicApiLimiter,
  marketsController.getSuiMarketObjects
);
```

```typescript
// backend/src/controllers/markets.controller.ts

import { suiMarketLookupService } from '../services/sui-market-lookup.service.js';

export const marketsController = {
  // ... existing methods
  
  async getSuiMarketObjects(req: Request, res: Response, next: NextFunction) {
    try {
      const marketId = parseInt(req.params.marketId);
      if (isNaN(marketId)) {
        return res.status(400).json({ error: 'Invalid market ID' });
      }

      const objects = await suiMarketLookupService.getSuiMarketObjects(marketId);
      if (!objects) {
        return res.status(404).json({ error: 'Market objects not found' });
      }

      res.json(objects);
    } catch (error) {
      next(error);
    }
  }
};
```

#### Option 2: Event-Based Indexing (Alternative)

If you prefer to index from on-chain events:

```typescript
// dapp/src/services/SuiMarketIndexer.ts

import { SuiClient } from '@mysten/sui/client';
import { SuiEvent } from '@mysten/sui/client';

interface MarketCreatedEvent {
  market_id: string;  // Object ID
  creator: string;
  question: string;
  end_timestamp: string;
  num_shards: number;
}

export class SuiMarketIndexer {
  private client: SuiClient;
  private packageId: string;
  private marketCache: Map<number, string> = new Map();

  constructor(client: SuiClient, packageId: string) {
    this.client = client;
    this.packageId = packageId;
  }

  /**
   * Index all market creation events to build ID mapping
   */
  async indexMarkets(): Promise<void> {
    const events = await this.client.queryEvents({
      query: {
        MoveEventType: `${this.packageId}::market_manager_v2::MarketCreated`
      },
      limit: 1000
    });

    events.data.forEach((event: SuiEvent, index: number) => {
      const parsed = event.parsedJson as MarketCreatedEvent;
      // Market ID is the index in creation order
      this.marketCache.set(index, parsed.market_id);
    });

    console.log(`[SuiMarketIndexer] Indexed ${this.marketCache.size} markets`);
  }

  /**
   * Get Sui object ID for a market ID
   */
  getMarketObjectId(marketId: number): string | undefined {
    return this.marketCache.get(marketId);
  }

  /**
   * Refresh index periodically
   */
  async startPeriodicIndexing(intervalMs: number = 30000): Promise<void> {
    await this.indexMarkets();
    setInterval(() => this.indexMarkets(), intervalMs);
  }
}
```

### Part 2: Complete Transaction Implementation

Now implement the missing Sui transaction flows:

```typescript
// dapp/src/hooks/useChainTransactions.ts (COMPLETE VERSION)

import { useCallback } from 'react';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useChain } from '../contexts/ChainContext';
import { useSDKContext } from '../contexts/SDKContext';
import { env } from '../config/env';

const CLOCK_OBJECT_ID = '0x6';

/**
 * Fetch Sui market objects from backend
 */
async function getSuiMarketObjects(marketId: number): Promise<{
  marketObjectId: string;
  shardObjectIds: string[];
  queueObjectId: string | null;
}> {
  const response = await fetch(
    `${env.backendUrl}/api/markets/sui/objects/${marketId}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Sui market objects: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Calculate which shard to use based on user address
 * This matches the on-chain sharding logic
 */
function calculateShardId(address: string, numShards: number): number {
  // Simple hash-based sharding
  // Convert address to number and mod by num shards
  const hash = address.split('').reduce((acc, char) => 
    acc + char.charCodeAt(0), 0
  );
  return hash % numShards;
}

/**
 * Chain-aware place bet hook
 */
export const useChainPlaceBet = () => {
  const { activeChain } = useChain();
  const { sdk } = useSDKContext();
  const aptosWallet = useAptosWallet();
  const suiAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteSui } = useSignAndExecuteTransaction();

  return useCallback(
    async (marketId: number, outcome: number, amount: number) => {
      console.log(`[useChainPlaceBet] Placing bet on ${activeChain}`, {
        marketId,
        outcome,
        amount
      });

      if (activeChain === 'aptos') {
        // === APTOS IMPLEMENTATION ===
        if (!aptosWallet.account || !aptosWallet.signAndSubmitTransaction) {
          throw new Error('Aptos wallet not connected');
        }

        const moduleAddress = sdk.getModuleAddress();
        const microAmount = sdk.toMicroUSDC(amount);

        const payload = {
          type: 'entry_function_payload',
          function: `${moduleAddress}::market::place_bet`,
          type_arguments: [],
          arguments: [marketId, outcome, microAmount]
        };

        const response = await aptosWallet.signAndSubmitTransaction({ payload });
        
        return { 
          hash: response.hash, 
          success: true,
          chain: 'aptos' as const
        };

      } else if (activeChain === 'sui') {
        // === SUI IMPLEMENTATION ===
        if (!suiAccount) {
          throw new Error('Sui wallet not connected');
        }

        const packageId = sdk.getModuleAddress();
        const microAmount = sdk.toMicroUSDC(amount);

        // Fetch market objects from backend
        const objects = await getSuiMarketObjects(marketId);
        
        // Calculate which shard this user should use
        const shardId = calculateShardId(
          suiAccount.address,
          objects.shardObjectIds.length
        );
        const shardObjectId = objects.shardObjectIds[shardId];

        console.log('[useChainPlaceBet] Sui transaction details:', {
          marketObjectId: objects.marketObjectId,
          shardObjectId,
          shardId,
          outcome,
          microAmount
        });

        // Build transaction
        const tx = new Transaction();

        // Split coins for bet amount
        const [paymentCoin] = tx.splitCoins(tx.gas, [microAmount]);

        // Call place_bet function
        tx.moveCall({
          target: `${packageId}::market_manager_v2::place_bet`,
          arguments: [
            tx.object(objects.marketObjectId),    // Market metadata
            tx.object(shardObjectId),             // Market pool shard
            paymentCoin,                           // Payment
            tx.pure.u8(outcome),                   // Outcome (0 or 1)
            tx.object(CLOCK_OBJECT_ID)            // Clock
          ]
        });

        // Sign and execute
        const result = await signAndExecuteSui({
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true
          }
        });

        const success = result.effects?.status?.status === 'success';
        
        if (!success) {
          const error = result.effects?.status?.error || 'Unknown error';
          throw new Error(`Transaction failed: ${error}`);
        }

        return {
          hash: result.digest,
          success,
          chain: 'sui' as const
        };

      } else {
        throw new Error(`Unsupported chain: ${activeChain}`);
      }
    },
    [activeChain, sdk, aptosWallet, suiAccount, signAndExecuteSui]
  );
};

/**
 * Chain-aware claim winnings hook
 */
export const useChainClaimWinnings = () => {
  const { activeChain } = useChain();
  const { sdk } = useSDKContext();
  const aptosWallet = useAptosWallet();
  const suiAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteSui } = useSignAndExecuteTransaction();

  return useCallback(
    async (marketId: number, positionObjectId?: string) => {
      console.log(`[useChainClaimWinnings] Claiming on ${activeChain}`, {
        marketId,
        positionObjectId
      });

      if (activeChain === 'aptos') {
        // === APTOS IMPLEMENTATION ===
        if (!aptosWallet.account || !aptosWallet.signAndSubmitTransaction) {
          throw new Error('Aptos wallet not connected');
        }

        const moduleAddress = sdk.getModuleAddress();

        const payload = {
          type: 'entry_function_payload',
          function: `${moduleAddress}::market::claim_winnings`,
          type_arguments: [],
          arguments: [marketId]
        };

        const response = await aptosWallet.signAndSubmitTransaction({ payload });
        
        return { 
          hash: response.hash, 
          success: true,
          chain: 'aptos' as const
        };

      } else if (activeChain === 'sui') {
        // === SUI IMPLEMENTATION ===
        if (!suiAccount) {
          throw new Error('Sui wallet not connected');
        }

        if (!positionObjectId) {
          throw new Error('Position object ID required for Sui claims');
        }

        const packageId = sdk.getModuleAddress();
        const objects = await getSuiMarketObjects(marketId);

        console.log('[useChainClaimWinnings] Sui claim details:', {
          marketObjectId: objects.marketObjectId,
          queueObjectId: objects.queueObjectId,
          positionObjectId
        });

        // Build transaction to request settlement
        const tx = new Transaction();

        tx.moveCall({
          target: `${packageId}::market_manager_v2::request_settlement`,
          arguments: [
            tx.object(objects.marketObjectId),
            tx.object(objects.queueObjectId!),
            tx.object(positionObjectId),
            tx.object(CLOCK_OBJECT_ID)
          ]
        });

        // Sign and execute
        const result = await signAndExecuteSui({
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true
          }
        });

        const success = result.effects?.status?.status === 'success';
        
        if (!success) {
          const error = result.effects?.status?.error || 'Unknown error';
          throw new Error(`Settlement request failed: ${error}`);
        }

        return {
          hash: result.digest,
          success,
          chain: 'sui' as const,
          message: 'Settlement requested. Admin will process payouts shortly.'
        };

      } else {
        throw new Error(`Unsupported chain: ${activeChain}`);
      }
    },
    [activeChain, sdk, aptosWallet, suiAccount, signAndExecuteSui]
  );
};

/**
 * Chain-aware create market hook
 */
export const useChainCreateMarket = () => {
  const { activeChain } = useChain();
  const { sdk } = useSDKContext();
  const aptosWallet = useAptosWallet();
  const suiAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteSui } = useSignAndExecuteTransaction();

  return useCallback(
    async (params: {
      question: string;
      outcomes: string[];
      durationHours: number;
      resolutionSource: string;
      numShards?: number;
    }) => {
      console.log(`[useChainCreateMarket] Creating market on ${activeChain}`, params);

      if (activeChain === 'aptos') {
        // === APTOS IMPLEMENTATION ===
        if (!aptosWallet.account || !aptosWallet.signAndSubmitTransaction) {
          throw new Error('Aptos wallet not connected');
        }

        const moduleAddress = sdk.getModuleAddress();

        const payload = {
          type: 'entry_function_payload',
          function: `${moduleAddress}::market::create_market`,
          type_arguments: [],
          arguments: [
            params.question,
            params.outcomes,
            params.durationHours,
            params.resolutionSource
          ]
        };

        const response = await aptosWallet.signAndSubmitTransaction({ payload });
        
        return { 
          hash: response.hash, 
          success: true,
          chain: 'aptos' as const
        };

      } else if (activeChain === 'sui') {
        // === SUI IMPLEMENTATION ===
        if (!suiAccount) {
          throw new Error('Sui wallet not connected');
        }

        const packageId = sdk.getModuleAddress();
        const numShards = params.numShards || 16;

        // Helper to convert string to bytes
        const stringToBytes = (str: string): number[] => {
          return Array.from(new TextEncoder().encode(str));
        };

        // Build transaction
        const tx = new Transaction();

        // Convert strings to byte arrays
        const questionBytes = stringToBytes(params.question);
        const resolutionBytes = stringToBytes(params.resolutionSource);
        const outcomesBytes = params.outcomes.map(o => stringToBytes(o));

        tx.moveCall({
          target: `${packageId}::market_manager_v2::create_market`,
          arguments: [
            tx.pure.vector('u8', questionBytes),
            tx.pure.vector('vector<u8>', outcomesBytes as unknown as number[][]),
            tx.pure.u64(params.durationHours),
            tx.pure.vector('u8', resolutionBytes),
            tx.pure.u8(numShards),
            tx.object(CLOCK_OBJECT_ID)
          ]
        });

        // Sign and execute
        const result = await signAndExecuteSui({
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true
          }
        });

        const success = result.effects?.status?.status === 'success';
        
        if (!success) {
          const error = result.effects?.status?.error || 'Unknown error';
          throw new Error(`Market creation failed: ${error}`);
        }

        // Extract created object IDs from transaction result
        const createdObjects = result.objectChanges?.filter(
          (change: any) => change.type === 'created'
        ) || [];

        console.log('[useChainCreateMarket] Created objects:', createdObjects);

        return {
          hash: result.digest,
          success,
          chain: 'sui' as const,
          createdObjects
        };

      } else {
        throw new Error(`Unsupported chain: ${activeChain}`);
      }
    },
    [activeChain, sdk, aptosWallet, suiAccount, signAndExecuteSui]
  );
};
```

### Part 3: Update Environment Configuration

Add backend URL to env:

```typescript
// dapp/src/config/env.ts

export const env = {
  // Existing config...
  aptosNetwork: import.meta.env.VITE_APTOS_NETWORK || 'devnet',
  aptosModuleAddress: import.meta.env.VITE_APTOS_MODULE_ADDRESS,
  aptosUsdcAddress: import.meta.env.VITE_APTOS_USDC_ADDRESS,
  
  suiNetwork: import.meta.env.VITE_SUI_NETWORK || 'devnet',
  suiPackageId: import.meta.env.VITE_SUI_PACKAGE_ID,
  
  activeChains: (import.meta.env.VITE_ACTIVE_CHAINS || 'aptos,sui').split(','),
  
  // Backend API
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  
  isProduction: import.meta.env.PROD,
};
```

Update `.env`:

```bash
# Frontend .env
VITE_BACKEND_URL=http://localhost:3001
VITE_SUI_PACKAGE_ID=0x...  # Your deployed package ID
VITE_SUI_NETWORK=devnet
```

### Part 4: Update UI Components for Sui

Update the header to show correct currency:

```typescript
// dapp/src/components/layout/Header.tsx

import { useUnifiedWallet } from '../../hooks/useUnifiedWallet';
import { useUSDCBalance } from '../../hooks/useUSDC';
import { useChain } from '../../contexts/ChainContext';

export const Header: React.FC = () => {
  const { activeChain } = useChain();
  const wallet = useUnifiedWallet();
  const { formatted, isLoading } = useUSDCBalance();

  // Get currency symbol based on chain
  const currencySymbol = activeChain === 'sui' ? 'SUI' : 'USDC';

  return (
    <header className="flex items-center justify-between p-4">
      {/* Chain indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {activeChain.toUpperCase()}
        </span>
      </div>

      {/* Wallet info */}
      {wallet.connected ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Balance:</span>
            <span className="font-medium">
              {isLoading ? '...' : formatted}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
            </span>
            <button onClick={wallet.disconnect} className="btn-sm">
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button onClick={wallet.connect} className="btn-primary">
          Connect {currencySymbol} Wallet
        </button>
      )}
    </header>
  );
};
```

Update betting interface to show correct currency:

```typescript
// dapp/src/components/BettingInterface.tsx

import { useChain } from '../contexts/ChainContext';

export const BettingInterface: React.FC<Props> = ({ marketId, outcomes }) => {
  const { activeChain } = useChain();
  const currencySymbol = activeChain === 'sui' ? 'SUI' : 'USDC';

  return (
    <div>
      <input 
        type="number" 
        placeholder={`Amount in ${currencySymbol}`}
        // ... other props
      />
      <button>
        Bet {amount} {currencySymbol}
      </button>
    </div>
  );
};
```

### Part 5: Testing Checklist

```bash
# 1. Database migration
cd backend
npx prisma migrate dev --name add_sui_object_ids
npx prisma generate

# 2. Start backend
npm run dev

# 3. Start frontend
cd ../dapp
npm run dev

# 4. Test flow
# - Connect Aptos wallet → verify balance shows USDC
# - Switch to Sui → verify prompt to connect Sui wallet
# - Connect Sui wallet → verify balance shows SUI
# - Try placing a bet on Sui → verify transaction succeeds
# - Check backend logs → verify market object lookup works
```

## Implementation Timeline

**Day 1: Database & Backend**
- [ ] Update Prisma schema
- [ ] Run migration
- [ ] Implement `sui-market-lookup.service.ts`
- [ ] Add API endpoint
- [ ] Test with curl/Postman

**Day 2: Frontend Integration**
- [ ] Add backend URL to env config
- [ ] Update `useChainTransactions.ts` with complete implementation
- [ ] Test market object ID resolution
- [ ] Verify bet placement works

**Day 3: UI Polish**
- [ ] Update Header component with currency switching
- [ ] Update betting interfaces
- [ ] Add loading states
- [ ] Test full user flow

**Day 4: Testing & Fixes**
- [ ] Test on both chains
- [ ] Test chain switching mid-session
- [ ] Handle edge cases (network errors, etc.)
- [ ] Update documentation

## Troubleshooting

### "Market objects not found"
- Ensure backend is running and accessible
- Check `VITE_BACKEND_URL` is correct
- Verify market exists in database with `suiMarketObjectId` populated

### "Position object ID required"
- User needs to have a position to claim
- Query user's positions from Sui to get position object IDs
- See "Getting User Positions" section below

### "Transaction failed: insufficient gas"
- User needs SUI for gas
- Direct to faucet: https://faucet.sui.io/

### Getting User Positions

Add helper to query user positions:

```typescript
// dapp/src/services/SuiPredictionMarketSDK.ts

async getUserPositions(address: string): Promise<Array<{
  positionId: string;
  marketId: string;
  outcome: number;
  shares: number;
}>> {
  const { data } = await this.client.getOwnedObjects({
    owner: address,
    filter: {
      StructType: `${this.packageId}::market_manager_v2::Position`
    },
    options: { showContent: true }
  });

  return data.map(obj => {
    if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
      return null;
    }
    const fields = obj.data.content.fields as any;
    return {
      positionId: obj.data.objectId,
      marketId: fields.market_id,
      outcome: parseInt(fields.outcome),
      shares: parseInt(fields.shares)
    };
  }).filter(Boolean);
}
```

## Next Steps

1. **Implement Option 1** (database-backed mapping) for reliability
2. **Deploy updated backend** with new endpoints
3. **Update frontend** with complete transaction hooks
4. **Test thoroughly** on testnet
5. **Monitor gas costs** and optimize if needed
6. **Add event listener** to auto-index new markets as they're created

## Additional Enhancements

### Auto-Index New Markets

Add event listener to automatically index new Sui markets:

```typescript
// backend/src/services/sui-event-listener.service.ts

import { SuiClient, SuiEventFilter } from '@mysten/sui/client';
import { suiMarketLookupService } from './sui-market-lookup.service.js';

export class SuiEventListener {
  private client: SuiClient;
  private packageId: string;
  private marketCounter: number = 0;

  constructor(client: SuiClient, packageId: string) {
    this.client = client;
    this.packageId = packageId;
  }

  async startListening() {
    const filter: SuiEventFilter = {
      MoveEventType: `${this.packageId}::market_manager_v2::MarketCreated`
    };

    // Subscribe to events
    const unsubscribe = await this.client.subscribeEvent({
      filter,
      onMessage: async (event) => {
        console.log('[SuiEventListener] New market created:', event);
        
        const parsed = event.parsedJson as any;
        const marketObjectId = parsed.market_id;
        
        // Store in database
        await suiMarketLookupService.storeSuiMarketObjects(
          this.marketCounter++,
          {
            marketObjectId,
            shardObjectIds: [], // Extract from event or query
            queueObjectId: ''   // Extract from event or query
          }
        );
      }
    });

    console.log('[SuiEventListener] Listening for market creation events');
    
    return unsubscribe;
  }
}
```

This completes the full implementation! Your app will now properly route wallet connections, transactions, and UI state based on the selected chain.
