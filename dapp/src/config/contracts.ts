import { env } from './env';

export const CONTRACTS = {
  marketFactory: env.factoryAddress as `0x${string}`,
  amm: env.ammAddress as `0x${string}`,
  usdc: env.usdcAddress as `0x${string}`,
  conditionalTokens: env.conditionalTokensAddress as `0x${string}`,
} as const;

// ABI fragments — only functions called from the frontend

export const MarketFactoryABI = [
  {
    type: 'function',
    name: 'getMarket',
    inputs: [{ name: 'marketId', type: 'bytes32' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'questionId', type: 'bytes32' },
        { name: 'question', type: 'string' },
        { name: 'outcomeCount', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'creator', type: 'address' },
        { name: 'status', type: 'uint8' },
        { name: 'conditionId', type: 'bytes32' },
        { name: 'ancillaryData', type: 'bytes' },
        { name: 'initialLiquidity', type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMarketCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getActiveMarkets',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
] as const;

export const PredictionMarketAMMABI = [
  {
    type: 'function',
    name: 'getPrices',
    inputs: [{ name: 'marketId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'buy',
    inputs: [
      { name: 'marketId', type: 'bytes32' },
      { name: 'outcomeIndex', type: 'uint256' },
      { name: 'usdcAmount', type: 'uint256' },
      { name: 'minTokensOut', type: 'uint256' },
    ],
    outputs: [{ name: 'tokensOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sell',
    inputs: [
      { name: 'marketId', type: 'bytes32' },
      { name: 'outcomeIndex', type: 'uint256' },
      { name: 'tokenAmount', type: 'uint256' },
      { name: 'minUsdcOut', type: 'uint256' },
    ],
    outputs: [{ name: 'usdcOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addLiquidity',
    inputs: [
      { name: 'marketId', type: 'bytes32' },
      { name: 'usdcAmount', type: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeLiquidity',
    inputs: [
      { name: 'marketId', type: 'bytes32' },
      { name: 'sharesToBurn', type: 'uint256' },
    ],
    outputs: [{ name: 'usdcOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPool',
    inputs: [{ name: 'marketId', type: 'bytes32' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'conditionId', type: 'bytes32' },
        { name: 'outcomeCount', type: 'uint256' },
        { name: 'totalLpShares', type: 'uint256' },
        { name: 'feeBps', type: 'uint256' },
        { name: 'lmsrB', type: 'uint256' },
        { name: 'initialized', type: 'bool' },
        { name: 'frozen', type: 'bool' },
      ],
    }],
    stateMutability: 'view',
  },
] as const;

export const ConditionalTokensABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'redeemPositions',
    inputs: [
      { name: 'collateralToken', type: 'address' },
      { name: 'parentCollectionId', type: 'bytes32' },
      { name: 'conditionId', type: 'bytes32' },
      { name: 'indexSets', type: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
