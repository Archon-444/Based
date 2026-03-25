// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IConditionalTokens} from "./IConditionalTokens.sol";

interface IMarketFactory {
    enum MarketStatus {
        Created,
        Active,
        Resolving,
        Resolved,
        Disputed,
        Cancelled
    }

    struct Market {
        bytes32 questionId;
        string question;
        uint256 outcomeCount;
        uint256 deadline;
        uint256 createdAt;
        address creator;
        MarketStatus status;
        bytes32 conditionId;
        bytes ancillaryData;
        uint256 initialLiquidity;
    }

    function createMarket(
        bytes32 questionId,
        string calldata question,
        uint256 outcomeCount,
        uint256 deadline,
        bytes calldata ancillaryData,
        uint256 initialLiquidity
    ) external returns (bytes32 marketId);

    function activateMarket(bytes32 marketId) external;

    function beginResolution(bytes32 marketId) external;

    function resolveMarket(bytes32 marketId) external;

    function disputeMarket(bytes32 marketId) external;

    function resetToResolving(bytes32 marketId) external;

    function cancelMarket(bytes32 marketId) external;

    function reportPayoutsFor(bytes32 marketId, uint256[] calldata payouts) external;

    function getMarket(bytes32 marketId) external view returns (Market memory);

    function getMarketCount() external view returns (uint256);

    function getActiveMarkets() external view returns (bytes32[] memory);

    function getAllMarketIds() external view returns (bytes32[] memory);

    function isMarketActive(bytes32 marketId) external view returns (bool);

    function marketExists(bytes32 marketId) external view returns (bool);

    function conditionalTokens() external view returns (IConditionalTokens);

    function usdc() external view returns (IERC20);

    function pause() external;

    function unpause() external;

    function paused() external view returns (bool);

    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

    function MARKET_CREATOR_ROLE() external view returns (bytes32);

    function RESOLVER_ROLE() external view returns (bytes32);
}
