# M2 + M3: On-Chain Integration & Oracle Integration

**Date**: October 18, 2025
**Milestones**: M2 (On-Chain Integration) + M3 (Oracle Integration)
**Duration**: 14 days (estimated)
**Prerequisites**: M0 ✅ + M1 ✅ Complete

---

## Executive Summary

Milestones 2 and 3 connect the backend suggestion/approval system with on-chain smart contracts, enabling:

1. **M2**: Approved suggestions → On-chain market creation
2. **M2**: Event indexer to sync blockchain data
3. **M2**: Role verification against on-chain access control
4. **M3**: Pyth Network price feed integration
5. **M3**: Automated market resolution
6. **M3**: Oracle-based verification system

---

## Smart Contract Analysis

### Deployed Contract Information:
- **Network**: Testnet
- **Module Address**: `0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81`
- **Modules**: 12 comprehensive Move modules

### Key Modules:

#### 1. **market_manager.move**
**Purpose**: Core market lifecycle management

**Key Functions**:
```move
public entry fun initialize(account: &signer)
// Initializes the market store and RBAC system
// Called once by module publisher

public entry fun create_market(
    creator: &signer,
    question: vector<u8>,
    outcomes: vector<vector<u8>>,
    duration_hours: u64,
) acquires MarketStore
// Creates a new prediction market
// Requires: MARKET_CREATOR role or admin
// Emits: MarketCreatedEvent

public entry fun resolve_market(
    resolver: &signer,
    market_id: u64,
    winning_outcome: u8,
) acquires MarketStore
// Resolves a market with winning outcome
// Requires: Oracle or admin role
// Emits: MarketResolvedEvent
```

**Events**:
- `MarketCreatedEvent` - market_id, creator, question, outcomes, end_time
- `MarketResolvedEvent` - market_id, winning_outcome, total_stakes

**Access Control**:
- ✅ Role-based permissions (MARKET_CREATOR required)
- ✅ Pause mechanism
- ✅ Overflow protection
- ✅ Input validation (2-10 outcomes, max 1 year duration)

#### 2. **access_control.move**
**Purpose**: RBAC system with on-chain roles

**Roles**:
- `ROLE_ADMIN` (0) - Full system access
- `ROLE_MARKET_CREATOR` (1) - Can create markets
- `ROLE_RESOLVER` (2) - Can resolve markets
- `ROLE_ORACLE_MANAGER` (3) - Manages oracle sources
- `ROLE_PAUSER` (4) - Emergency pause/unpause

**Key Functions**:
```move
public entry fun grant_role(admin: &signer, account: address, role: u8)
public entry fun revoke_role(admin: &signer, account: address, role: u8)
public fun has_role(account: address, role: u8): bool
public fun require_not_paused()
```

#### 3. **pyth_reader.move**
**Purpose**: Pyth Network price feed integration

**Key Functions**:
```move
public fun get_price(price_feed_id: vector<u8>): (u64, u64, u64)
// Returns: (price, expo, timestamp)
// Example: BTC/USD, ETH/USD, etc.
```

**Pyth Price Feed IDs** (Testnet):
- BTC/USD: `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- ETH/USD: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- SOL/USD: `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d`

#### 4. **oracle.move**
**Purpose**: Market resolution with data verification

**Key Functions**:
```move
public entry fun submit_result(
    oracle: &signer,
    market_id: u64,
    result: vector<u8>,
) acquires OracleStore

public fun get_result(market_id: u64): Option<vector<u8>>
```

#### 5. **betting.move** & **amm_lmsr.move**
**Purpose**: Betting logic with LMSR (Logarithmic Market Scoring Rule) AMM

**Features**:
- ✅ Automated market maker for price discovery
- ✅ Liquidity parameter for market depth
- ✅ Multi-outcome support (up to 10 outcomes)
- ✅ Slippage protection

---

## M2: On-Chain Integration Implementation

### Task 1: Enhance Backend Blockchain Client

**Status**: STARTED (lazy initialization already done)
**Files**: `backend/src/blockchain/aptos/aptosClient.ts`
**Duration**: 2 days

#### Current State:
```typescript
// backend/src/blockchain/aptos/aptosClient.ts
export class AptosClientAdapter implements IBlockchainClient {
  async createMarket(params: CreateMarketParams): Promise<string> {
    this.initialize();
    const admin = this.assertAdminAccount();

    const payload: InputEntryFunctionData = {
      function: `${this.moduleAddress}::market_manager::create_market`,
      typeArguments: [],
      functionArguments: [
        Array.from(textEncoder.encode(params.question)),
        params.outcomes.map((outcome) => Array.from(textEncoder.encode(outcome))),
        params.durationHours,
        Array.from(textEncoder.encode(params.resolutionSource)),
      ],
    };

    const transaction = await this.aptos!.transaction.build.simple({
      sender: admin.accountAddress,
      data: payload,
    });

    const committed = await this.aptos!.signAndSubmitTransaction({
      signer: admin,
      transaction,
    });

    await this.aptos!.waitForTransaction({ transactionHash: committed.hash });
    return committed.hash;
  }
}
```

#### Enhancement Needed:
1. Remove `resolutionSource` parameter (not in smart contract)
2. Add error handling for transaction failures
3. Add transaction status polling
4. Add event parsing from transaction receipt

**Updated Implementation**:
```typescript
async createMarket(params: CreateMarketParams): Promise<string> {
  this.initialize();
  const admin = this.assertAdminAccount();

  const payload: InputEntryFunctionData = {
    function: `${this.moduleAddress}::market_manager::create_market`,
    typeArguments: [],
    functionArguments: [
      Array.from(textEncoder.encode(params.question)),
      params.outcomes.map((outcome) => Array.from(textEncoder.encode(outcome))),
      params.durationHours,
      // Note: resolutionSource not used in smart contract
    ],
  };

  try {
    const transaction = await this.aptos!.transaction.build.simple({
      sender: admin.accountAddress,
      data: payload,
    });

    const committedTxn = await this.aptos!.signAndSubmitTransaction({
      signer: admin,
      transaction,
    });

    // Wait for transaction confirmation
    const executedTxn = await this.aptos!.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (!executedTxn.success) {
      throw new Error(`Transaction failed: ${executedTxn.vm_status}`);
    }

    // Parse events to get market_id
    const events = executedTxn.events || [];
    const marketCreatedEvent = events.find(
      (e: any) => e.type.includes('MarketCreatedEvent')
    );

    if (marketCreatedEvent) {
      const marketId = marketCreatedEvent.data.market_id;
      logger.info({ marketId, txHash: committedTxn.hash }, 'Market created on-chain');
    }

    return committedTxn.hash;
  } catch (error: any) {
    logger.error({ error, params }, 'Failed to create market on-chain');
    throw new Error(`On-chain market creation failed: ${error.message}`);
  }
}
```

---

### Task 2: Update Suggestion Approval Flow

**Status**: READY TO IMPLEMENT
**Files**: `backend/src/services/suggestions.service.ts`
**Duration**: 1 day

#### Current Flow:
```typescript
// backend/src/services/suggestions.service.ts:61-114
async approveSuggestion(params: { id: string; reviewer: string; publishOnChain: boolean }) {
  // 1. Update suggestion status to 'approved'
  // 2. Create event log
  // 3. If publishOnChain:
  //    - Call chainRouter.getClient().createMarket()
  //    - Update suggestion with market ID
  //    - Create published event
}
```

#### Issue:
The current implementation tries to publish immediately, but we need:
1. Admin to explicitly approve
2. Separate "publish" action that creates on-chain market
3. Better error handling for blockchain failures

**Recommended Flow**:
```
Suggestion Created (status: pending)
    ↓
Admin Reviews
    ↓
Admin Approves (status: approved) ← Stays in DB
    ↓
Admin Clicks "Publish to Chain"
    ↓
Backend calls create_market()
    ↓
Transaction confirmed
    ↓
Update suggestion (status: published, publishedMarketId: txHash)
```

**Implementation**:
```typescript
// Add new endpoint: POST /api/suggestions/:id/publish
async publishSuggestion(params: { id: string; publisher: string }) {
  // 1. Get suggestion (must be 'approved')
  const suggestion = await prisma.suggestion.findUnique({
    where: { id: params.id },
  });

  if (!suggestion) {
    throw new Error('Suggestion not found');
  }

  if (suggestion.status !== 'approved') {
    throw new Error('Only approved suggestions can be published');
  }

  if (suggestion.publishedMarketId) {
    throw new Error('Suggestion already published');
  }

  // 2. Create market on-chain
  try {
    const client = chainRouter.getClient(suggestion.chain);
    const txHash = await client.createMarket({
      question: suggestion.question,
      outcomes: suggestion.outcomes,
      durationHours: suggestion.durationHours,
    });

    // 3. Update suggestion
    const updatedSuggestion = await prisma.suggestion.update({
      where: { id: params.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        publishedMarketId: txHash,
        publishedBy: params.publisher,
      },
    });

    // 4. Create event log
    await prisma.suggestionEvent.create({
      data: {
        suggestionId: suggestion.id,
        actorWallet: params.publisher,
        eventType: 'published',
        metadata: { txHash, chain: suggestion.chain },
      },
    });

    return updatedSuggestion;
  } catch (error) {
    logger.error({ error, suggestionId: params.id }, 'Failed to publish market on-chain');
    throw error;
  }
}
```

---

### Task 3: Event Indexer for Blockchain Data

**Status**: NEW IMPLEMENTATION NEEDED
**Files**: `backend/src/services/eventIndexer.service.ts` (to create)
**Duration**: 3 days

#### Purpose:
Sync on-chain events back to PostgreSQL for:
- Market creation confirmation
- Market resolution status
- Betting activity
- Role changes

#### Implementation:

**Create Event Indexer Service**:
```typescript
// backend/src/services/eventIndexer.service.ts
import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';
import { prisma } from '../database/prismaClient.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export class EventIndexer {
  private aptos: Aptos;
  private moduleAddress: string;
  private lastProcessedVersion: bigint = 0n;

  constructor() {
    const config = new AptosConfig({ network: env.APTOS_NETWORK });
    this.aptos = new Aptos(config);
    this.moduleAddress = env.APTOS_MODULE_ADDRESS;
  }

  async start() {
    logger.info('Starting event indexer...');

    // Load last processed version from DB
    const lastIndexed = await this.getLastIndexedVersion();
    this.lastProcessedVersion = BigInt(lastIndexed || 0);

    // Poll for events every 10 seconds
    setInterval(() => this.indexEvents(), 10000);
  }

  private async indexEvents() {
    try {
      // Fetch MarketCreatedEvent
      const marketEvents = await this.aptos.getModuleEventsByEventType({
        eventType: `${this.moduleAddress}::market_manager::MarketCreatedEvent`,
        options: {
          start: this.lastProcessedVersion,
          limit: 100,
        },
      });

      for (const event of marketEvents) {
        await this.handleMarketCreatedEvent(event);
      }

      // Fetch MarketResolvedEvent
      const resolvedEvents = await this.aptos.getModuleEventsByEventType({
        eventType: `${this.moduleAddress}::market_manager::MarketResolvedEvent`,
        options: {
          start: this.lastProcessedVersion,
          limit: 100,
        },
      });

      for (const event of resolvedEvents) {
        await this.handleMarketResolvedEvent(event);
      }

      // Update last processed version
      if (marketEvents.length > 0 || resolvedEvents.length > 0) {
        const maxVersion = Math.max(
          ...marketEvents.map((e: any) => Number(e.version)),
          ...resolvedEvents.map((e: any) => Number(e.version))
        );
        this.lastProcessedVersion = BigInt(maxVersion);
        await this.saveLastIndexedVersion(maxVersion);
      }
    } catch (error) {
      logger.error({ error }, 'Event indexer error');
    }
  }

  private async handleMarketCreatedEvent(event: any) {
    const { market_id, creator, question, outcomes, end_time, created_at } = event.data;

    logger.info({ market_id, creator }, 'Indexing market created event');

    // Create or update Market in DB
    await prisma.market.upsert({
      where: {
        onChainId_chain: {
          onChainId: market_id.toString(),
          chain: 'aptos',
        },
      },
      create: {
        onChainId: market_id.toString(),
        chain: 'aptos',
        question,
        creatorWallet: creator,
        endDate: new Date(Number(end_time) * 1000),
        status: 'active',
        totalVolume: '0',
        yesPool: '0',
        noPool: '0',
      },
      update: {
        status: 'active',
      },
    });
  }

  private async handleMarketResolvedEvent(event: any) {
    const { market_id, winning_outcome, resolution_time, total_stakes } = event.data;

    logger.info({ market_id, winning_outcome }, 'Indexing market resolved event');

    // Update Market in DB
    await prisma.market.update({
      where: {
        onChainId_chain: {
          onChainId: market_id.toString(),
          chain: 'aptos',
        },
      },
      data: {
        status: 'resolved',
        resolvedOutcome: winning_outcome === 0,
        resolvedAt: new Date(Number(resolution_time) * 1000),
        totalVolume: total_stakes.toString(),
      },
    });
  }

  private async getLastIndexedVersion(): Promise<number> {
    // Store in a simple table or cache
    // For now, return 0
    return 0;
  }

  private async saveLastIndexedVersion(version: number) {
    // Save to DB or cache
    logger.info({ version }, 'Saved last indexed version');
  }
}

// Start indexer on server startup
export const eventIndexer = new EventIndexer();
```

**Add to server startup**:
```typescript
// backend/src/index.ts
import { eventIndexer } from './services/eventIndexer.service.js';

server.listen(port, () => {
  logger.info(`Backend listening on port ${port}`);

  // Start event indexer
  eventIndexer.start();
});
```

---

### Task 4: Role Verification Against On-Chain Access Control

**Status**: READY TO IMPLEMENT
**Files**: `backend/src/services/roles.service.ts`
**Duration**: 1 day

#### Purpose:
Sync user roles from on-chain RBAC system to PostgreSQL

**Implementation**:
```typescript
// backend/src/services/roles.service.ts
export const roleService = {
  async syncRolesFromChain(walletAddress: string): Promise<string[]> {
    try {
      const client = chainRouter.getClient('aptos');

      // Call view functions to check roles
      const roles: string[] = [];

      // Check each role
      const isAdmin = await client.aptos!.view({
        payload: {
          function: `${client.moduleAddress}::access_control::is_admin`,
          typeArguments: [],
          functionArguments: [walletAddress],
        },
      });

      if (isAdmin[0]) roles.push('ROLE_ADMIN');

      const canCreate = await client.aptos!.view({
        payload: {
          function: `${client.moduleAddress}::access_control::can_create_markets`,
          typeArguments: [],
          functionArguments: [walletAddress],
        },
      });

      if (canCreate[0]) roles.push('ROLE_MARKET_CREATOR');

      // Update user in DB
      await prisma.user.upsert({
        where: { walletAddress },
        create: {
          walletAddress,
          roles,
          onChainRolesSynced: true,
          lastRoleSync: new Date(),
        },
        update: {
          roles,
          onChainRolesSynced: true,
          lastRoleSync: new Date(),
        },
      });

      return roles;
    } catch (error) {
      logger.error({ error, walletAddress }, 'Failed to sync roles from chain');
      throw error;
    }
  },
};
```

---

## M3: Oracle Integration Implementation

### Task 1: Pyth Network Price Feed Integration

**Status**: READY TO IMPLEMENT
**Files**: `backend/src/services/pyth.service.ts` (to create)
**Duration**: 2 days

#### Purpose:
Fetch real-time price data from Pyth Network for automated resolution

**Implementation**:
```typescript
// backend/src/services/pyth.service.ts
import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class PythService {
  private aptos: Aptos;
  private moduleAddress: string;

  constructor() {
    const config = new AptosConfig({ network: env.APTOS_NETWORK });
    this.aptos = new Aptos(config);
    this.moduleAddress = env.APTOS_MODULE_ADDRESS;
  }

  // Pyth Price Feed IDs (Testnet)
  private readonly PRICE_FEEDS = {
    'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  };

  async getPrice(symbol: string): Promise<{ price: number; timestamp: number }> {
    const feedId = this.PRICE_FEEDS[symbol];
    if (!feedId) {
      throw new Error(`Price feed not found for ${symbol}`);
    }

    try {
      // Call view function on smart contract
      const result = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::pyth_reader::get_price`,
          typeArguments: [],
          functionArguments: [Array.from(Buffer.from(feedId.slice(2), 'hex'))],
        },
      });

      const [price, expo, timestamp] = result as [string, string, string];

      // Pyth prices use exponential notation
      // price = price * 10^expo
      const actualPrice = Number(price) * Math.pow(10, Number(expo));

      logger.info({ symbol, price: actualPrice, timestamp }, 'Fetched Pyth price');

      return {
        price: actualPrice,
        timestamp: Number(timestamp),
      };
    } catch (error) {
      logger.error({ error, symbol }, 'Failed to fetch Pyth price');
      throw error;
    }
  }
}

export const pythService = new PythService();
```

---

### Task 2: Automated Market Resolution

**Status**: READY TO IMPLEMENT
**Files**: `backend/src/services/resolution.service.ts` (to create)
**Duration**: 3 days

#### Purpose:
Automatically resolve markets when end_time is reached using oracle data

**Implementation**:
```typescript
// backend/src/services/resolution.service.ts
import { prisma } from '../database/prismaClient.js';
import { logger } from '../config/logger.js';
import { pythService } from './pyth.service.js';
import { chainRouter } from '../blockchain/chainRouter.js';

export class ResolutionService {
  async start() {
    logger.info('Starting automated resolution service...');

    // Check for markets to resolve every 60 seconds
    setInterval(() => this.resolveExpiredMarkets(), 60000);
  }

  private async resolveExpiredMarkets() {
    try {
      // Find markets that are expired but not resolved
      const expiredMarkets = await prisma.market.findMany({
        where: {
          status: 'active',
          endDate: {
            lt: new Date(),
          },
        },
      });

      for (const market of expiredMarkets) {
        await this.resolveMarket(market);
      }
    } catch (error) {
      logger.error({ error }, 'Resolution service error');
    }
  }

  private async resolveMarket(market: any) {
    logger.info({ marketId: market.onChainId }, 'Attempting to resolve market');

    try {
      // Determine winning outcome based on resolution criteria
      const winningOutcome = await this.determineWinningOutcome(market);

      if (winningOutcome === null) {
        logger.warn({ marketId: market.onChainId }, 'Unable to determine winning outcome');
        return;
      }

      // Call smart contract to resolve market
      const client = chainRouter.getClient(market.chain);
      await client.resolveMarket(market.onChainId, winningOutcome);

      logger.info({
        marketId: market.onChainId,
        winningOutcome,
      }, 'Market resolved successfully');

      // Update market status in DB (will be updated by event indexer too)
      await prisma.market.update({
        where: { id: market.id },
        data: {
          status: 'resolving',
        },
      });
    } catch (error) {
      logger.error({ error, marketId: market.onChainId }, 'Failed to resolve market');
    }
  }

  private async determineWinningOutcome(market: any): Promise<number | null> {
    // Parse market question to determine resolution criteria
    const question = market.question.toLowerCase();

    // Example: "Will BTC reach $100k by end of 2024?"
    if (question.includes('btc') || question.includes('bitcoin')) {
      const priceData = await pythService.getPrice('BTC/USD');

      // Extract target price from question (simple regex)
      const priceMatch = question.match(/\$?([\d,]+)k/);
      if (!priceMatch) return null;

      const targetPrice = parseInt(priceMatch[1].replace(',', '')) * 1000;

      // Compare actual price with target
      return priceData.price >= targetPrice ? 0 : 1; // 0 = Yes, 1 = No
    }

    // Add more resolution logic for other question types
    // For now, return null if we can't determine
    return null;
  }
}

export const resolutionService = new ResolutionService();
```

---

## Testing Checklist

### M2 Tests:
- [ ] Approve suggestion updates DB correctly
- [ ] Publish button creates on-chain market
- [ ] Transaction hash is saved to suggestion
- [ ] Event indexer syncs MarketCreatedEvent
- [ ] Event indexer syncs MarketResolvedEvent
- [ ] Role sync fetches on-chain roles correctly
- [ ] Admin can only publish approved suggestions

### M3 Tests:
- [ ] Pyth price feed returns valid data
- [ ] Resolution service detects expired markets
- [ ] Winning outcome is determined correctly
- [ ] On-chain resolve_market is called
- [ ] Market status updates to 'resolved'
- [ ] Resolved event is indexed

---

## Implementation Timeline

### Week 4-5 (M2 - On-Chain Integration):
**Days 1-2**: Backend blockchain client enhancements
**Days 3-4**: Event indexer implementation
**Day 5**: Role verification system
**Days 6-7**: Testing and integration

### Week 6 (M3 - Oracle Integration):
**Days 1-2**: Pyth Network integration
**Days 3-4**: Automated resolution service
**Day 5**: Testing and verification

---

## Success Criteria

M2+M3 Complete when:
- [ ] Approved suggestions can be published on-chain
- [ ] Transaction confirmations are tracked
- [ ] Event indexer syncs blockchain data
- [ ] Roles are verified against smart contracts
- [ ] Pyth price feeds are integrated
- [ ] Markets resolve automatically when expired
- [ ] End-to-end flow works: Suggestion → Approval → Publish → Resolve

---

**Document Version**: 1.0
**Last Updated**: October 18, 2025
**Status**: READY FOR IMPLEMENTATION
**Estimated Completion**: November 1, 2025 (14 days)

