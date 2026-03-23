/**
 * Trade Service — Query trade history from the Trade model.
 */

import { prisma } from '../database/prismaClient.js';

export interface TradeQueryParams {
  marketId: string;
  trader?: string;
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
}

export interface TradeResult {
  trades: Array<{
    id: string;
    trader: string;
    outcomeIndex: number;
    tradeType: string;
    amount: string;
    outcomeTokens: string;
    fee: string;
    txHash: string;
    blockNumber: number;
    timestamp: string;
  }>;
  total: number;
  page: number;
  pages: number;
}

export async function getTradesByMarket(params: TradeQueryParams): Promise<TradeResult> {
  const { marketId, trader, page = 1, limit = 50, sort = 'desc' } = params;

  // Find the market DB id from onChainId
  const market = await prisma.market.findFirst({
    where: { onChainId: marketId, chain: 'base' },
    select: { id: true },
  });

  if (!market) {
    return { trades: [], total: 0, page, pages: 0 };
  }

  const where: Record<string, unknown> = { marketId: market.id };
  if (trader) {
    where.trader = trader.toLowerCase();
  }

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where,
      orderBy: { timestamp: sort },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trade.count({ where }),
  ]);

  return {
    trades: trades.map((t) => ({
      id: t.id,
      trader: t.trader,
      outcomeIndex: t.outcomeIndex,
      tradeType: t.tradeType,
      amount: t.amount.toString(),
      outcomeTokens: t.outcomeTokens.toString(),
      fee: t.fee.toString(),
      txHash: t.txHash,
      blockNumber: t.blockNumber,
      timestamp: t.timestamp.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}
