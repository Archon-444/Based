// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IConditionalTokens} from "./IConditionalTokens.sol";
import {IMarketFactory} from "./IMarketFactory.sol";

interface IPredictionMarketAMM {
    struct Pool {
        bytes32 conditionId;
        uint256 outcomeCount;
        uint256 totalLpShares;
        uint256 feeBps;
        uint256 lmsrB;
        bool initialized;
        bool frozen;
    }

    function initializePool(bytes32 marketId, uint256 usdcAmount) external;

    function buy(bytes32 marketId, uint256 outcomeIndex, uint256 usdcAmount, uint256 minTokensOut) external returns (uint256 tokensOut);

    function sell(bytes32 marketId, uint256 outcomeIndex, uint256 tokenAmount, uint256 minUsdcOut) external returns (uint256 usdcOut);

    function addLiquidity(bytes32 marketId, uint256 usdcAmount) external returns (uint256 shares);

    function removeLiquidity(bytes32 marketId, uint256 sharesToBurn) external returns (uint256 usdcOut);

    function getPrices(bytes32 marketId) external view returns (uint256[] memory);

    function freezePool(bytes32 marketId) external;

    function getPool(bytes32 marketId) external view returns (Pool memory);

    function getReserves(bytes32 marketId) external view returns (uint256[] memory);

    function withdrawProtocolFees() external;

    function reserves(bytes32 marketId, uint256 outcomeIndex) external view returns (uint256);

    function lpShares(bytes32 marketId, address account) external view returns (uint256);

    function buybackFees() external view returns (uint256);

    function protocolFees() external view returns (uint256);

    function owner() external view returns (address);

    function conditionalTokens() external view returns (IConditionalTokens);

    function marketFactory() external view returns (IMarketFactory);

    function usdc() external view returns (IERC20);

    function BPS() external view returns (uint256);

    function BUYBACK_FEE_SHARE() external view returns (uint256);

    function DEFAULT_FEE_BPS() external view returns (uint256);

    function LP_FEE_SHARE() external view returns (uint256);

    function MAX_FEE_BPS() external view returns (uint256);

    function MIN_LIQUIDITY() external view returns (uint256);

    function PRECISION() external view returns (uint256);

    function PROTOCOL_FEE_SHARE() external view returns (uint256);
}
