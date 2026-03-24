/**
 * Base Chain Event Indexer
 *
 * Indexes all EVM events from the 4 prediction market contracts on Base.
 * - Historical backfill via getLogs (2000-block chunks)
 * - Real-time via watchContractEvent (WebSocket)
 * - Per-contract IndexerState tracking
 * - Idempotent (unique constraint on txHash+logIndex)
 * - Reorg handling (delete above reorg block, re-index)
 *
 * Follows the EventIndexer singleton pattern from eventIndexer.ts.
 */

import { type Abi, type Log, parseEventLogs } from 'viem';

import {
  contractAddresses,
  marketFactoryAbi,
  predictionMarketAmmAbi,
  pythOracleAdapterAbi,
  umaCtfAdapterAbi,
} from '../blockchain/base/abis/index.js';
import { getPublicClient, getWsClient } from '../blockchain/base/viemClient.js';
import { logger } from '../config/logger.js';
import { prisma } from '../database/prismaClient.js';
import { recordBaseIndexerBlock } from '../monitoring/metrics.js';
import {
  handleAssertionDisputed,
  handleAssertionSettled,
  handleLiquidityAdded,
  handleLiquidityRemoved,
  handleMarketCancelled,
  handleMarketCreated,
  handleMarketReset,
  handleMarketResolved,
  handleMarketStatusChanged,
  handleOutcomeAsserted,
  handlePoolInitialized,
  handlePythMarketRegistered,
  handlePythMarketResolved,
  handleTrade,
  handleUmaMarketRegistered,
} from './baseEventHandlers.js';

// ---------- Types ----------

interface ContractConfig {
  name: string;
  address: `0x${string}`;
  abi: Abi;
}

// ---------- Constants ----------

const BACKFILL_CHUNK_SIZE = 2000n;

// ---------- Contract Registry ----------

function getContractConfigs(): ContractConfig[] {
  const configs: ContractConfig[] = [];

  if (contractAddresses.marketFactory) {
    configs.push({
      name: 'MarketFactory',
      address: contractAddresses.marketFactory,
      abi: marketFactoryAbi as unknown as Abi,
    });
  }
  if (contractAddresses.amm) {
    configs.push({
      name: 'PredictionMarketAMM',
      address: contractAddresses.amm,
      abi: predictionMarketAmmAbi as unknown as Abi,
    });
  }
  if (contractAddresses.umaAdapter) {
    configs.push({
      name: 'UmaCtfAdapter',
      address: contractAddresses.umaAdapter,
      abi: umaCtfAdapterAbi as unknown as Abi,
    });
  }
  if (contractAddresses.pythAdapter) {
    configs.push({
      name: 'PythOracleAdapter',
      address: contractAddresses.pythAdapter,
      abi: pythOracleAdapterAbi as unknown as Abi,
    });
  }

  return configs;
}

// ---------- Event Dispatcher ----------

async function dispatchEvent(
  contractName: string,
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- event args are dynamically typed by ABI decoder
  args: any,
  log: Log
): Promise<void> {
  switch (`${contractName}:${eventName}`) {
    // MarketFactory
    case 'MarketFactory:MarketCreated':
      return handleMarketCreated(args, log);
    case 'MarketFactory:MarketStatusChanged':
      return handleMarketStatusChanged(args, log);
    case 'MarketFactory:MarketResolved':
      return handleMarketResolved(args, log);
    case 'MarketFactory:MarketCancelled':
      return handleMarketCancelled(args, log);

    // AMM
    case 'PredictionMarketAMM:PoolInitialized':
      return handlePoolInitialized(args, log);
    case 'PredictionMarketAMM:Trade':
      return handleTrade(args, log);
    case 'PredictionMarketAMM:LiquidityAdded':
      return handleLiquidityAdded(args, log);
    case 'PredictionMarketAMM:LiquidityRemoved':
      return handleLiquidityRemoved(args, log);

    // UMA
    case 'UmaCtfAdapter:MarketRegistered':
      return handleUmaMarketRegistered(args, log);
    case 'UmaCtfAdapter:OutcomeAsserted':
      return handleOutcomeAsserted(args, log);
    case 'UmaCtfAdapter:AssertionSettled':
      return handleAssertionSettled(args, log);
    case 'UmaCtfAdapter:AssertionDisputed':
      return handleAssertionDisputed(args, log);
    case 'UmaCtfAdapter:MarketReset':
      return handleMarketReset(args, log);

    // Pyth
    case 'PythOracleAdapter:MarketRegistered':
      return handlePythMarketRegistered(args, log);
    case 'PythOracleAdapter:MarketResolved':
      return handlePythMarketResolved(args, log);

    default:
      logger.debug({ contractName, eventName }, '[BaseIndexer] Unhandled event');
  }
}

// ---------- Indexer State Helpers ----------

async function getLastProcessedBlock(contractAddress: string): Promise<bigint> {
  const state = await prisma.indexerState.findUnique({
    where: { chain_contractAddress: { chain: 'base', contractAddress } },
  });
  return state ? state.lastProcessedVersion : 0n;
}

async function updateLastProcessedBlock(contractAddress: string, block: bigint): Promise<void> {
  await prisma.indexerState.upsert({
    where: { chain_contractAddress: { chain: 'base', contractAddress } },
    update: {
      lastProcessedVersion: block,
      lastProcessedTimestamp: new Date(),
      isRunning: true,
    },
    create: {
      chain: 'base',
      contractAddress,
      lastProcessedVersion: block,
      lastProcessedTimestamp: new Date(),
      isRunning: true,
    },
  });
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

// ---------- Main Indexer Class ----------

class BaseEventIndexer {
  private unwatchFunctions: Array<() => void> = [];
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[BaseIndexer] Already running');
      return;
    }

    const configs = getContractConfigs();
    if (configs.length === 0) {
      logger.warn('[BaseIndexer] No contract addresses configured, skipping');
      return;
    }

    this.isRunning = true;
    logger.info({ contracts: configs.map((c) => c.name) }, '[BaseIndexer] Starting');

    // 1. Historical backfill
    await this.backfill(configs);

    // 2. Real-time watchers
    this.startWatchers(configs);

    logger.info('[BaseIndexer] Running (backfill complete, watchers active)');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.unwatchFunctions.forEach((fn) => fn());
    this.unwatchFunctions = [];
    this.isRunning = false;

    // Mark all states as not running
    const configs = getContractConfigs();
    for (const config of configs) {
      try {
        await prisma.indexerState.updateMany({
          where: { chain: 'base', contractAddress: config.address },
          data: { isRunning: false },
        });
      } catch {
        // Ignore — state might not exist yet
      }
    }

    logger.info('[BaseIndexer] Stopped');
  }

  // ---------- Backfill ----------

  private async backfill(configs: ContractConfig[]): Promise<void> {
    const publicClient = getPublicClient();
    const latestBlock = await publicClient.getBlockNumber();

    for (const config of configs) {
      const fromBlock = (await getLastProcessedBlock(config.address)) + 1n;

      if (fromBlock > latestBlock) {
        logger.info(
          { contract: config.name, fromBlock: fromBlock.toString() },
          '[BaseIndexer] Already up to date'
        );
        continue;
      }

      logger.info(
        { contract: config.name, from: fromBlock.toString(), to: latestBlock.toString() },
        '[BaseIndexer] Backfilling'
      );

      for (let start = fromBlock; start <= latestBlock; start += BACKFILL_CHUNK_SIZE) {
        const end =
          start + BACKFILL_CHUNK_SIZE - 1n > latestBlock
            ? latestBlock
            : start + BACKFILL_CHUNK_SIZE - 1n;

        try {
          const logs = await publicClient.getLogs({
            address: config.address,
            fromBlock: start,
            toBlock: end,
          });

          if (logs.length > 0) {
            const parsed = parseEventLogs({ abi: config.abi, logs });
            for (const event of parsed) {
              await this.processEvent(config.name, event);
            }
          }

          await updateLastProcessedBlock(config.address, end);
          recordBaseIndexerBlock(config.name, Number(end));
        } catch (error) {
          logger.error(
            {
              contract: config.name,
              start: start.toString(),
              error: error instanceof Error ? error.message : String(error),
            },
            '[BaseIndexer] Backfill chunk error'
          );
          throw error;
        }
      }

      logger.info({ contract: config.name }, '[BaseIndexer] Backfill complete');
    }
  }

  // ---------- Real-time Watchers ----------

  private startWatchers(configs: ContractConfig[]): void {
    const wsClient = getWsClient();

    for (const config of configs) {
      const unwatch = wsClient.watchContractEvent({
        address: config.address,
        abi: config.abi,
        onLogs: async (logs: unknown[]) => {
          for (const event of logs) {
            await this.processEvent(config.name, event);
          }

          // Update last processed block
          const lastLog = logs[logs.length - 1] as Log | undefined;
          const lastBlock = lastLog?.blockNumber;
          if (lastBlock) {
            await updateLastProcessedBlock(config.address, lastBlock);
            recordBaseIndexerBlock(config.name, Number(lastBlock));
          }
        },
        onError: (error: Error) => {
          logger.error(
            { contract: config.name, error: error.message },
            '[BaseIndexer] WebSocket event error'
          );
        },
      } as unknown as Parameters<typeof wsClient.watchContractEvent>[0]);

      this.unwatchFunctions.push(unwatch);
    }
  }

  // ---------- Process Single Event ----------

  private async processEvent(contractName: string, event: unknown): Promise<void> {
    const evt = event as Log & { eventName: string; args: unknown };
    try {
      await dispatchEvent(contractName, evt.eventName, evt.args, evt as Log);
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        // Already processed — idempotent skip
        return;
      }
      logger.error(
        {
          contract: contractName,
          event: evt.eventName,
          tx: evt.transactionHash,
          error: error instanceof Error ? error.message : String(error),
        },
        '[BaseIndexer] Event processing error'
      );
    }
  }

  // ---------- Reorg Handling ----------

  async handleReorg(reorgBlock: bigint): Promise<void> {
    logger.warn({ reorgBlock: reorgBlock.toString() }, '[BaseIndexer] Handling reorg');

    await prisma.$transaction([
      prisma.trade.deleteMany({ where: { blockNumber: { gt: Number(reorgBlock) } } }),
      prisma.liquidityEvent.deleteMany({ where: { blockNumber: { gt: Number(reorgBlock) } } }),
      prisma.umaAssertion.deleteMany({ where: { blockNumber: { gt: Number(reorgBlock) } } }),
      prisma.blockchainEvent.deleteMany({
        where: { chain: 'base', blockHeight: { gt: reorgBlock } },
      }),
    ]);

    // Reset indexer states to reorg block
    const configs = getContractConfigs();
    for (const config of configs) {
      await updateLastProcessedBlock(config.address, reorgBlock);
    }

    logger.info({ reorgBlock: reorgBlock.toString() }, '[BaseIndexer] Reorg cleanup complete');
  }
}

// ---------- Singleton ----------

let globalIndexer: BaseEventIndexer | null = null;

export async function startBaseIndexer(): Promise<void> {
  if (!globalIndexer) {
    globalIndexer = new BaseEventIndexer();
  }
  await globalIndexer.start();
}

export async function stopBaseIndexer(): Promise<void> {
  if (globalIndexer) {
    await globalIndexer.stop();
  }
}

export function getBaseIndexerStatus(): { isRunning: boolean } {
  return { isRunning: globalIndexer?.['isRunning'] ?? false };
}
