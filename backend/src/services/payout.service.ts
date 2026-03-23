import type { Chain } from '@prisma/client';

import { getChainConfig } from '../config/chainConfig.js';
import { prisma } from '../database/prismaClient.js';

const MICRO_USDC = 1_000_000;
const FPMM_TRADING_FEE_BPS = 30n;
const BPS_DENOMINATOR = 10_000n;

type CalculatePayoutParams = {
  marketId?: string;
  chain?: Chain;
  onChainId?: string;
  outcomeIndex: number;
  amount: number;
};

type ShareInfo = {
  micro: string;
  decimal: number;
  isFPMM: boolean;
  calculationMethod: 'FPMM' | 'Parimutuel';
};

export const payoutService = {
  async calculatePayout(params: CalculatePayoutParams): Promise<{
    estimatedPayout: number;
    potentialProfit: number;
    currentOdds: number;
    fees: {
      trading: number;
      creator: number;
      protocol: number;
      total: number;
    };
    chain: Chain;
    shares: ShareInfo;
    priceImpact: number;
  } | null> {
    const { marketId, chain, onChainId, outcomeIndex, amount } = params;
    let market = null;

    if (marketId) {
      market = await prisma.market.findUnique({
        where: { id: marketId },
      });

      if (!market && chain && onChainId) {
        market = await prisma.market.findFirst({
          where: {
            chain,
            onChainId,
          },
        });
      }
    } else if (chain && onChainId) {
      market = await prisma.market.findFirst({
        where: {
          chain,
          onChainId,
        },
      });
    }

    const effectiveChain: Chain | null = market?.chain ?? null;
    const outcomePools: bigint[] = market?.outcomePools ?? [];

    if (!effectiveChain) {
      return null;
    }

    const config = getChainConfig(effectiveChain);
    const pools = outcomePools ?? [];

    if (outcomeIndex < 0 || outcomeIndex >= pools.length) {
      return null;
    }

    const totalPool = pools.reduce<bigint>((acc, value) => acc + BigInt(value), 0n);
    const outcomePool = pools[outcomeIndex] ? BigInt(pools[outcomeIndex]) : 0n;

    const betAmountMicro = BigInt(Math.floor(amount * MICRO_USDC));
    const totalPoolAfter = totalPool + betAmountMicro;
    const outcomePoolAfter = outcomePool + betAmountMicro;

    // Parimutuel payout calculation
    const estimatedPayoutMicro =
      outcomePoolAfter > 0n ? (betAmountMicro * totalPoolAfter) / outcomePoolAfter : betAmountMicro;

    const tradingFeeMicro = (betAmountMicro * FPMM_TRADING_FEE_BPS) / BPS_DENOMINATOR;
    const creatorFee = amount * (config.feeStructure.creatorFee / 100);
    const protocolFee = amount * (config.feeStructure.protocolFee / 100);
    const tradingFee = Number(tradingFeeMicro) / MICRO_USDC;
    const totalFee = tradingFee + creatorFee + protocolFee;
    const priceImpactMicro =
      betAmountMicro > tradingFeeMicro + estimatedPayoutMicro
        ? betAmountMicro - tradingFeeMicro - estimatedPayoutMicro
        : 0n;

    const estimatedPayout = Number(estimatedPayoutMicro) / MICRO_USDC;
    const potentialProfit = estimatedPayout - amount;
    const priceImpact = Number(priceImpactMicro) / MICRO_USDC;

    let currentOddsBasisPoints = 5000;
    if (totalPoolAfter > 0n) {
      currentOddsBasisPoints = Number((outcomePoolAfter * 10000n) / totalPoolAfter);
    }

    return {
      estimatedPayout,
      potentialProfit,
      currentOdds: currentOddsBasisPoints,
      fees: {
        trading: tradingFee,
        creator: creatorFee,
        protocol: protocolFee,
        total: totalFee,
      },
      chain: effectiveChain,
      shares: {
        micro: estimatedPayoutMicro.toString(),
        decimal: estimatedPayout,
        isFPMM: false,
        calculationMethod: 'Parimutuel',
      },
      priceImpact,
    };
  },

  validateBetAmount(
    amount: number,
    chain: Chain
  ): {
    valid: boolean;
    error?: string;
  } {
    const config = getChainConfig(chain);
    const amountMicro = BigInt(Math.floor(amount * MICRO_USDC));

    if (amountMicro < config.limits.minBet) {
      return {
        valid: false,
        error: `Minimum bet on ${chain} is ${Number(config.limits.minBet) / MICRO_USDC} USDC`,
      };
    }

    if (amountMicro > config.limits.maxBet) {
      return {
        valid: false,
        error: `Maximum bet on ${chain} is ${Number(config.limits.maxBet) / MICRO_USDC} USDC`,
      };
    }

    return { valid: true };
  },
};
