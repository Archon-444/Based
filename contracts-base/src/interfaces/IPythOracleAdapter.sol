// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IMarketFactory} from "./IMarketFactory.sol";
import {IPyth} from "./IPyth.sol";

interface IPythOracleAdapter {
    enum ResolutionType {
        ABOVE,
        BELOW,
        BETWEEN
    }

    struct PythMarketConfig {
        bytes32 feedId;
        int256 strikePrice;
        int256 strikePriceHigh;
        ResolutionType resolutionType;
        bool registered;
        bool resolved;
    }

    function registerMarket(
        bytes32 marketId,
        bytes32 feedId,
        int256 strikePrice,
        int256 strikePriceHigh,
        ResolutionType resolutionType
    ) external;

    function resolve(bytes32 marketId, bytes[] calldata priceUpdateData) external payable;

    function getMarketConfig(bytes32 marketId) external view returns (PythMarketConfig memory);

    function factory() external view returns (IMarketFactory);

    function pyth() external view returns (IPyth);
}
