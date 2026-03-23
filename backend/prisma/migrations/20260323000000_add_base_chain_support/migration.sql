-- Add 'base' to Chain enum
ALTER TYPE "Chain" ADD VALUE IF NOT EXISTS 'base';

-- Add 'resolving' to MarketStatus enum
ALTER TYPE "MarketStatus" ADD VALUE IF NOT EXISTS 'resolving';

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "LiquidityType" AS ENUM ('ADD', 'REMOVE');

-- CreateEnum
CREATE TYPE "AssertionStatus" AS ENUM ('PENDING', 'SETTLED', 'DISPUTED');

-- Add contractAddress to IndexerState
ALTER TABLE "IndexerState" ADD COLUMN "contractAddress" TEXT;

-- Drop old unique constraint on IndexerState (chain only) and add new one
DROP INDEX IF EXISTS "IndexerState_chain_key";
CREATE UNIQUE INDEX "IndexerState_chain_contractAddress_key" ON "IndexerState"("chain", "contractAddress");

-- Add Base chain fields to Market
ALTER TABLE "Market"
ADD COLUMN "conditionId" TEXT,
ADD COLUMN "questionId" TEXT,
ADD COLUMN "txHash" TEXT,
ADD COLUMN "blockNumber" INTEGER,
ADD COLUMN "chainId" INTEGER DEFAULT 8453,
ADD COLUMN "ammAddress" TEXT,
ADD COLUMN "feeRate" INTEGER,
ADD COLUMN "resolutionType" TEXT,
ADD COLUMN "pythFeedId" TEXT,
ADD COLUMN "strikePrice" TEXT;

-- CreateTable Trade
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "trader" TEXT NOT NULL,
    "outcomeIndex" INTEGER NOT NULL,
    "tradeType" "TradeType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "outcomeTokens" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable LiquidityEvent
CREATE TABLE "LiquidityEvent" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" "LiquidityType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "shares" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable UmaAssertion
CREATE TABLE "UmaAssertion" (
    "id" TEXT NOT NULL,
    "assertionId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "proposedOutcome" INTEGER NOT NULL,
    "asserter" TEXT NOT NULL,
    "bond" BIGINT NOT NULL,
    "liveness" INTEGER NOT NULL,
    "assertedAt" TIMESTAMP(3) NOT NULL,
    "status" "AssertionStatus" NOT NULL DEFAULT 'PENDING',
    "disputeCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TIMESTAMP(3),
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UmaAssertion_pkey" PRIMARY KEY ("id")
);

-- CreateTable AgentAction
CREATE TABLE "AgentAction" (
    "id" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "marketId" TEXT,
    "action" TEXT NOT NULL,
    "confidence" INTEGER,
    "reasoning" TEXT,
    "sources" TEXT[],
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "txHash" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable AgentCommentary
CREATE TABLE "AgentCommentary" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "keyFactors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentCommentary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex Trade
CREATE UNIQUE INDEX "Trade_txHash_logIndex_key" ON "Trade"("txHash", "logIndex");
CREATE INDEX "Trade_marketId_timestamp_idx" ON "Trade"("marketId", "timestamp");
CREATE INDEX "Trade_trader_timestamp_idx" ON "Trade"("trader", "timestamp");
CREATE INDEX "Trade_blockNumber_idx" ON "Trade"("blockNumber");

-- CreateIndex LiquidityEvent
CREATE UNIQUE INDEX "LiquidityEvent_txHash_logIndex_key" ON "LiquidityEvent"("txHash", "logIndex");
CREATE INDEX "LiquidityEvent_marketId_timestamp_idx" ON "LiquidityEvent"("marketId", "timestamp");
CREATE INDEX "LiquidityEvent_provider_idx" ON "LiquidityEvent"("provider");

-- CreateIndex UmaAssertion
CREATE UNIQUE INDEX "UmaAssertion_assertionId_key" ON "UmaAssertion"("assertionId");
CREATE INDEX "UmaAssertion_marketId_idx" ON "UmaAssertion"("marketId");
CREATE INDEX "UmaAssertion_status_idx" ON "UmaAssertion"("status");

-- CreateIndex AgentAction
CREATE INDEX "AgentAction_agent_createdAt_idx" ON "AgentAction"("agent", "createdAt");
CREATE INDEX "AgentAction_marketId_idx" ON "AgentAction"("marketId");

-- CreateIndex AgentCommentary
CREATE INDEX "AgentCommentary_marketId_createdAt_idx" ON "AgentCommentary"("marketId", "createdAt");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityEvent" ADD CONSTRAINT "LiquidityEvent_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UmaAssertion" ADD CONSTRAINT "UmaAssertion_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentCommentary" ADD CONSTRAINT "AgentCommentary_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
