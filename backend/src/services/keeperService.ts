/**
 * Keeper Service for Base Chain
 *
 * Automated cron jobs that maintain market lifecycle:
 * - checkDeadlines: Resolve expired Pyth markets; auto-resolve UMA markets via AI agent
 * - settleAssertions: Settle mature UMA assertions past liveness
 * - resolveWithPyth: Resolve Pyth markets already in Resolving state
 * - monitorIntegrity: Health checks and stuck market detection
 */

import cron from 'node-cron';
import { type Address, encodeFunctionData } from 'viem';

import { contractAddresses, marketFactoryAbi, pythOracleAdapterAbi } from '../blockchain/base/abis/index.js';
import { encodeCall, sendTransaction } from '../blockchain/base/transactionService.js';
import { getKeeperWallet, getPublicClient, getResolverWallet } from '../blockchain/base/viemClient.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { prisma } from '../database/prismaClient.js';
import { recordKeeperExecution } from '../monitoring/metrics.js';
import { fetchPriceUpdateData } from './pythHermes.js';

// ---------- Keeper Service Class ----------

export class KeeperService {
  private jobs: cron.ScheduledTask[] = [];

  start(): void {
    // Every 5 minutes: check deadlines
    this.jobs.push(
      cron.schedule('*/5 * * * *', () => {
        this.runJob('checkDeadlines', () => this.checkDeadlines());
      })
    );

    // Every 15 minutes: settle mature UMA assertions
    this.jobs.push(
      cron.schedule('*/15 * * * *', () => {
        this.runJob('settleAssertions', () => this.settleAssertions());
      })
    );

    // Every 5 minutes: resolve Pyth markets in Resolving state
    this.jobs.push(
      cron.schedule('*/5 * * * *', () => {
        this.runJob('resolveWithPyth', () => this.resolveWithPyth());
      })
    );

    // Every 1 minute: integrity monitoring
    this.jobs.push(
      cron.schedule('* * * * *', () => {
        this.runJob('monitorIntegrity', () => this.monitorIntegrity());
      })
    );

    logger.info('[Keeper] All cron jobs started');
  }

  stop(): void {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    logger.info('[Keeper] All cron jobs stopped');
  }

  private async runJob(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      recordKeeperExecution(name, 'success');
    } catch (error) {
      recordKeeperExecution(name, 'failure');
      logger.error(
        { job: name, error: error instanceof Error ? error.message : String(error) },
        '[Keeper] Job failed'
      );
    }
  }

  // ---------- checkDeadlines ----------

  private async checkDeadlines(): Promise<void> {
    const expiredMarkets = await prisma.market.findMany({
      where: {
        chain: 'base',
        status: 'active',
        endDate: { lte: new Date() },
      },
    });

    if (expiredMarkets.length === 0) return;

    logger.info({ count: expiredMarkets.length }, '[Keeper] Found expired markets');

    for (const market of expiredMarkets) {
      try {
        if (market.resolutionType === 'pyth' && market.pythFeedId) {
          // Pyth: resolve atomically (beginResolution + resolveMarket + reportPayoutsFor)
          await this.resolvePythMarket(market.onChainId, market.pythFeedId);
          logger.info({ marketId: market.onChainId }, '[Keeper] Pyth market resolved');
        } else if (market.resolutionType === 'uma') {
          // UMA: AI Resolution Agent handles assertOutcome
          if (env.AGENT_ENABLED === 'true' && env.AGENT_AUTO_RESOLVE === 'true') {
            try {
              const { tryResolveUmaMarket } = await import('../agents/resolutionAgent.js');
              await tryResolveUmaMarket({
                onChainId: market.onChainId,
                question: market.question,
                outcomes: market.outcomes,
                endDate: market.endDate!,
              });
            } catch (agentError) {
              // Agent errors must NEVER crash the keeper
              logger.error(
                {
                  marketId: market.onChainId,
                  error: agentError instanceof Error ? agentError.message : String(agentError),
                },
                '[Keeper] Resolution agent error (non-fatal)'
              );
            }
          } else {
            logger.info(
              { marketId: market.onChainId },
              '[Keeper] UMA market expired, awaiting manual assertion'
            );
          }
        } else {
          // Manual or unset — log
          logger.info(
            { marketId: market.onChainId, resolutionType: market.resolutionType },
            '[Keeper] Market expired, no automated resolution configured'
          );
        }
      } catch (error) {
        logger.error(
          { marketId: market.onChainId, error: error instanceof Error ? error.message : String(error) },
          '[Keeper] Failed to process expired market'
        );
      }
    }
  }

  // ---------- settleAssertions ----------

  private async settleAssertions(): Promise<void> {
    const now = new Date();

    // Find assertions where on-chain assertedAt + liveness has passed
    const matureAssertions = await prisma.umaAssertion.findMany({
      where: {
        status: 'PENDING',
      },
    });

    // Filter by assertedAt + liveness < now
    const ready = matureAssertions.filter((a) => {
      const expiresAt = new Date(a.assertedAt.getTime() + a.liveness * 1000);
      return expiresAt <= now;
    });

    if (ready.length === 0) return;

    logger.info({ count: ready.length }, '[Keeper] Settling mature assertions');

    const publicClient = getPublicClient();
    const keeperWallet = getKeeperWallet();

    for (const assertion of ready) {
      try {
        // UMA OOV3 settleAssertion(bytes32 assertionId)
        // We call the UMA contract directly (not via our adapter)
        // The OOV3 contract address isn't stored per-assertion; for now, skip if not configured
        if (!contractAddresses.umaAdapter) continue;

        const data = encodeCall(
          [{ name: 'settleAssertion', type: 'function', inputs: [{ name: 'assertionId', type: 'bytes32' }], outputs: [], stateMutability: 'nonpayable' }] as any,
          'settleAssertion',
          [assertion.assertionId]
        );

        await sendTransaction({
          walletClient: keeperWallet,
          publicClient,
          to: contractAddresses.umaAdapter,
          data,
          walletLabel: 'keeper',
          methodLabel: 'settleAssertion',
        });

        logger.info({ assertionId: assertion.assertionId }, '[Keeper] Assertion settled');
      } catch (error) {
        logger.error(
          { assertionId: assertion.assertionId, error: error instanceof Error ? error.message : String(error) },
          '[Keeper] Failed to settle assertion'
        );
      }
    }
  }

  // ---------- resolveWithPyth ----------

  private async resolveWithPyth(): Promise<void> {
    const resolvingPythMarkets = await prisma.market.findMany({
      where: {
        chain: 'base',
        resolutionType: 'pyth',
        status: 'resolving',
        pythFeedId: { not: null },
      },
    });

    if (resolvingPythMarkets.length === 0) return;

    logger.info({ count: resolvingPythMarkets.length }, '[Keeper] Resolving Pyth markets');

    for (const market of resolvingPythMarkets) {
      try {
        await this.resolvePythMarket(market.onChainId, market.pythFeedId!);
        logger.info({ marketId: market.onChainId }, '[Keeper] Pyth market resolved');
      } catch (error) {
        logger.error(
          { marketId: market.onChainId, error: error instanceof Error ? error.message : String(error) },
          '[Keeper] Failed to resolve Pyth market'
        );
      }
    }
  }

  // ---------- Pyth Resolution Helper ----------

  private async resolvePythMarket(onChainMarketId: string, pythFeedId: string): Promise<void> {
    if (!contractAddresses.pythAdapter) {
      throw new Error('PYTH_ADAPTER_ADDRESS not configured');
    }

    // Fetch fresh price update from Hermes
    const updateData = await fetchPriceUpdateData([pythFeedId]);

    // Estimate Pyth update fee
    const publicClient = getPublicClient();
    const fee = await publicClient.readContract({
      address: contractAddresses.pyth!,
      abi: [{ name: 'getUpdateFee', type: 'function', inputs: [{ name: 'updateData', type: 'bytes[]' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' }] as any,
      functionName: 'getUpdateFee',
      args: [updateData],
    }) as bigint;

    // Call PythOracleAdapter.resolve(marketId, pythUpdateData) — payable
    const data = encodeCall(
      pythOracleAdapterAbi as any,
      'resolve',
      [onChainMarketId, updateData]
    );

    const resolverWallet = getResolverWallet();
    await sendTransaction({
      walletClient: resolverWallet,
      publicClient,
      to: contractAddresses.pythAdapter,
      data,
      value: fee,
      walletLabel: 'resolver',
      methodLabel: 'PythAdapter.resolve',
    });
  }

  // ---------- monitorIntegrity ----------

  private async monitorIntegrity(): Promise<void> {
    // Check for stuck markets: Resolving for > 48 hours (2x typical UMA liveness)
    const stuckThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const stuckMarkets = await prisma.market.findMany({
      where: {
        chain: 'base',
        status: 'resolving',
        lastSyncedAt: { lte: stuckThreshold },
      },
      select: { onChainId: true, resolutionType: true },
    });

    if (stuckMarkets.length > 0) {
      logger.warn(
        { count: stuckMarkets.length, markets: stuckMarkets.map((m) => m.onChainId) },
        '[Keeper] Stuck markets detected (Resolving > 48h)'
      );
    }

    // Check for expired Active markets not picked up by checkDeadlines
    const missedDeadlines = await prisma.market.count({
      where: {
        chain: 'base',
        status: 'active',
        endDate: { lte: new Date(Date.now() - 10 * 60 * 1000) }, // 10 min past deadline
      },
    });

    if (missedDeadlines > 0) {
      logger.warn({ count: missedDeadlines }, '[Keeper] Active markets past deadline not yet resolved');
    }

    // Compare on-chain vs DB market count
    if (contractAddresses.marketFactory) {
      try {
        const publicClient = getPublicClient();
        const onChainCount = await publicClient.readContract({
          address: contractAddresses.marketFactory,
          abi: marketFactoryAbi as any,
          functionName: 'getMarketCount',
        }) as bigint;

        const dbCount = await prisma.market.count({
          where: { chain: 'base' },
        });

        if (Number(onChainCount) !== dbCount) {
          logger.warn(
            { onChain: Number(onChainCount), database: dbCount },
            '[Keeper] Market count mismatch (on-chain vs DB)'
          );
        }
      } catch (error) {
        // getMarketCount might not exist — not critical
        logger.debug({ error: error instanceof Error ? error.message : String(error) }, '[Keeper] Could not read on-chain market count');
      }
    }
  }
}
