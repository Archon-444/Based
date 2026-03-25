// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMarketFactory} from "./IMarketFactory.sol";
import {IOptimisticOracleV3} from "./IOptimisticOracleV3.sol";

interface IUmaCtfAdapter {
    struct MarketData {
        bytes32 marketId;
        bytes32 questionId;
        bytes32 conditionId;
        uint256 outcomeCount;
        bytes ancillaryData;
        uint256 reward;
        uint256 bond;
        uint64 liveness;
        bool registered;
        bytes32 activeAssertionId;
        uint256 proposedOutcome;
        uint256 disputeCount;
        bool resolved;
    }

    function registerMarket(bytes32 marketId, uint256 reward, uint256 bond, uint64 liveness) external;

    function assertOutcome(bytes32 marketId, uint256 proposedOutcome) external;

    function settle(bytes32 marketId) external;

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external;

    function assertionDisputedCallback(bytes32 assertionId) external;

    function getMarketData(bytes32 marketId) external view returns (MarketData memory);

    function getMarketForAssertion(bytes32 assertionId) external view returns (bytes32);

    function factory() external view returns (IMarketFactory);

    function oov3() external view returns (IOptimisticOracleV3);

    function usdc() external view returns (IERC20);

    function setProposerWhitelist(address proposer, bool whitelisted) external;

    function setProposerWhitelistEnabled(bool enabled) external;

    function proposerWhitelistEnabled() external view returns (bool);

    function whitelistedProposers(address proposer) external view returns (bool);
}
