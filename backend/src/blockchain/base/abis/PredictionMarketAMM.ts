export const predictionMarketAmmAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_conditionalTokens',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_marketFactory',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_usdc',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'BPS',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'BUYBACK_FEE_SHARE',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'DEFAULT_FEE_BPS',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'LP_FEE_SHARE',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_FEE_BPS',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MIN_LIQUIDITY',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'PRECISION',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'PROTOCOL_FEE_SHARE',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'addLiquidity',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'usdcAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'shares',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'buy',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'outcomeIndex',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'usdcAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'minTokensOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'tokensOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'buybackFees',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'conditionalTokens',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IConditionalTokens',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'freezePool',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPool',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IPredictionMarketAMM.Pool',
        components: [
          {
            name: 'conditionId',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'outcomeCount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'totalLpShares',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'feeBps',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'lmsrB',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'initialized',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'frozen',
            type: 'bool',
            internalType: 'bool',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPrices',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getReserves',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'initializePool',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'usdcAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'lpShares',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'marketFactory',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IMarketFactory',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'onERC1155BatchReceived',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: '',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: '',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
        internalType: 'bytes4',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'onERC1155Received',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
        internalType: 'bytes4',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'protocolFees',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'removeLiquidity',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'sharesToBurn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'usdcOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'reserves',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'sell',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'outcomeIndex',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'tokenAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'minUsdcOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'usdcOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'usdc',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IERC20',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'withdrawProtocolFees',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'LiquidityAdded',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'provider',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'usdcAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'shares',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'LiquidityRemoved',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'provider',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'usdcAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'shares',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PoolInitialized',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'initialLiquidity',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'provider',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Trade',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'trader',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'outcomeIndex',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'isBuy',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
      {
        name: 'usdcAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'tokenAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'feeAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'newPrices',
        type: 'uint256[]',
        indexed: false,
        internalType: 'uint256[]',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'InsufficientLiquidity',
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'minimum',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'InsufficientOutput',
    inputs: [
      {
        name: 'actual',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'minimum',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'InsufficientShares',
    inputs: [
      {
        name: 'requested',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'available',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'InvalidOutcomeIndex',
    inputs: [
      {
        name: 'provided',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'max',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'MarketNotActive',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
  },
  {
    type: 'error',
    name: 'NotOwner',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PRBMath_MulDiv18_Overflow',
    inputs: [
      {
        name: 'x',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'y',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'PRBMath_MulDiv_Overflow',
    inputs: [
      {
        name: 'x',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'y',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'denominator',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'PRBMath_SD59x18_Div_InputTooSmall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PRBMath_SD59x18_Div_Overflow',
    inputs: [
      {
        name: 'x',
        type: 'int256',
        internalType: 'SD59x18',
      },
      {
        name: 'y',
        type: 'int256',
        internalType: 'SD59x18',
      },
    ],
  },
  {
    type: 'error',
    name: 'PRBMath_SD59x18_Exp2_InputTooBig',
    inputs: [
      {
        name: 'x',
        type: 'int256',
        internalType: 'SD59x18',
      },
    ],
  },
  {
    type: 'error',
    name: 'PRBMath_SD59x18_Exp_InputTooBig',
    inputs: [
      {
        name: 'x',
        type: 'int256',
        internalType: 'SD59x18',
      },
    ],
  },
  {
    type: 'error',
    name: 'PRBMath_SD59x18_Log_InputTooSmall',
    inputs: [
      {
        name: 'x',
        type: 'int256',
        internalType: 'SD59x18',
      },
    ],
  },
  {
    type: 'error',
    name: 'PRBMath_SD59x18_Mul_InputTooSmall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'PRBMath_SD59x18_Mul_Overflow',
    inputs: [
      {
        name: 'x',
        type: 'int256',
        internalType: 'SD59x18',
      },
      {
        name: 'y',
        type: 'int256',
        internalType: 'SD59x18',
      },
    ],
  },
  {
    type: 'error',
    name: 'PoolAlreadyInitialized',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
  },
  {
    type: 'error',
    name: 'PoolFrozen',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
  },
  {
    type: 'error',
    name: 'PoolNotInitialized',
    inputs: [
      {
        name: 'marketId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ZeroAmount',
    inputs: [],
  },
] as const;
