// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IPyth} from "./interfaces/IPyth.sol";
import {MarketFactory} from "./MarketFactory.sol";

contract PythOracleAdapter is AccessControl, ReentrancyGuard, Pausable {
    // ──────────────────── Enums ────────────────────

    enum ResolutionType {
        ABOVE,
        BELOW,
        BETWEEN
    }

    // ──────────────────── Structs ────────────────────

    struct PythMarketConfig {
        bytes32 feedId;
        int256 strikePrice;
        int256 strikePriceHigh;
        ResolutionType resolutionType;
        bool registered;
        bool resolved;
    }

    // ──────────────────── Constants ────────────────────

    uint256 public constant MAX_PRICE_AGE = 300;

    // ──────────────────── State ────────────────────

    IPyth public pyth;
    MarketFactory public factory;

    mapping(bytes32 => PythMarketConfig) internal marketConfigs;

    // ──────────────────── Events ────────────────────

    event MarketRegistered(
        bytes32 indexed marketId,
        bytes32 indexed feedId,
        int256 strikePrice,
        uint8 resolutionType
    );
    event MarketResolved(
        bytes32 indexed marketId,
        bytes32 indexed feedId,
        int256 price,
        int32 expo,
        uint256 winningOutcome
    );

    // ──────────────────── Errors ────────────────────

    error InvalidPriceRange(int256 strikePrice, int256 strikePriceHigh);
    error MarketAlreadyRegistered(bytes32 marketId);
    error MarketAlreadyResolved(bytes32 marketId);
    error MarketNotRegistered(bytes32 marketId);
    error OnlyBinaryMarkets(bytes32 marketId, uint256 outcomeCount);
    error RefundFailed();

    // ──────────────────── Constructor ────────────────────

    constructor(address _pyth, address _factory) {
        pyth = IPyth(_pyth);
        factory = MarketFactory(_factory);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ──────────────────── External Functions ────────────────────

    function registerMarket(
        bytes32 marketId,
        bytes32 feedId,
        int256 strikePrice,
        int256 strikePriceHigh,
        ResolutionType resolutionType
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (marketConfigs[marketId].registered) revert MarketAlreadyRegistered(marketId);

        // Fetch market from factory — reverts if not found
        MarketFactory.Market memory market = factory.getMarket(marketId);

        // Only binary markets supported
        if (market.outcomeCount != 2) revert OnlyBinaryMarkets(marketId, market.outcomeCount);

        // Validate price range for BETWEEN type
        if (resolutionType == ResolutionType.BETWEEN) {
            if (strikePriceHigh <= strikePrice) revert InvalidPriceRange(strikePrice, strikePriceHigh);
        }

        // Store config
        marketConfigs[marketId] = PythMarketConfig({
            feedId: feedId,
            strikePrice: strikePrice,
            strikePriceHigh: strikePriceHigh,
            resolutionType: resolutionType,
            registered: true,
            resolved: false
        });

        emit MarketRegistered(marketId, feedId, strikePrice, uint8(resolutionType));
    }

    function resolve(bytes32 marketId, bytes[] calldata pythUpdateData) external payable nonReentrant whenNotPaused {
        PythMarketConfig storage config = marketConfigs[marketId];

        if (!config.registered) revert MarketNotRegistered(marketId);
        if (config.resolved) revert MarketAlreadyResolved(marketId);

        // Update Pyth price feeds
        uint256 fee = pyth.getUpdateFee(pythUpdateData);
        pyth.updatePriceFeeds{value: fee}(pythUpdateData);

        // Get price
        IPyth.Price memory priceData = pyth.getPriceNoOlderThan(config.feedId, MAX_PRICE_AGE);
        int256 price = int256(priceData.price);
        int32 expo = priceData.expo;

        // Determine winning outcome based on resolution type
        uint256 winningOutcome;

        if (config.resolutionType == ResolutionType.ABOVE) {
            winningOutcome = price >= config.strikePrice ? 0 : 1;
        } else if (config.resolutionType == ResolutionType.BELOW) {
            winningOutcome = price < config.strikePrice ? 0 : 1;
        } else {
            // BETWEEN
            winningOutcome = (price >= config.strikePrice && price <= config.strikePriceHigh) ? 0 : 1;
        }

        // Build payouts
        uint256[] memory payouts = new uint256[](2);
        if (winningOutcome == 0) {
            payouts[0] = 1;
            payouts[1] = 0;
        } else {
            payouts[0] = 0;
            payouts[1] = 1;
        }

        // Resolve via factory (atomic)
        factory.beginResolution(marketId);
        factory.reportPayoutsFor(marketId, payouts);
        factory.resolveMarket(marketId);

        // Mark resolved
        config.resolved = true;

        // Refund excess ETH
        uint256 excess = msg.value - fee;
        if (excess > 0) {
            (bool success,) = msg.sender.call{value: excess}("");
            if (!success) revert RefundFailed();
        }

        emit MarketResolved(marketId, config.feedId, price, expo, winningOutcome);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ──────────────────── View Functions ────────────────────

    function getMarketConfig(bytes32 marketId) external view returns (PythMarketConfig memory) {
        return marketConfigs[marketId];
    }
}
