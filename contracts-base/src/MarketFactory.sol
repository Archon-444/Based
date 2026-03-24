// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IConditionalTokens} from "./interfaces/IConditionalTokens.sol";

contract MarketFactory is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ──────────────────── Roles ────────────────────
    bytes32 public constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    // ──────────────────── Constants ────────────────────
    uint256 public constant MAX_OUTCOMES = 8;
    uint256 public constant MIN_OUTCOMES = 2;
    uint256 public constant MAX_QUESTION_LENGTH = 500;

    // ──────────────────── Enums ────────────────────
    enum MarketStatus {
        Created,
        Active,
        Resolving,
        Resolved,
        Disputed,
        Cancelled
    }

    // ──────────────────── Structs ────────────────────
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

    // ──────────────────── State ────────────────────
    IConditionalTokens public conditionalTokens;
    IERC20 public usdc;

    mapping(bytes32 => Market) internal markets;
    bytes32[] internal allMarketIds;
    bytes32[] internal activeMarketIds;

    // ──────────────────── Events ────────────────────
    event MarketCreated(
        bytes32 indexed marketId,
        bytes32 indexed questionId,
        address indexed creator,
        string question,
        uint256 outcomeCount,
        uint256 deadline,
        uint256 createdAt
    );

    event MarketResolved(bytes32 indexed marketId, uint256 resolvedAt);
    event MarketCancelled(bytes32 indexed marketId, uint256 cancelledAt);
    event MarketStatusChanged(bytes32 indexed marketId, MarketStatus oldStatus, MarketStatus newStatus);

    // ──────────────────── Errors ────────────────────
    error DeadlineInPast(uint256 deadline, uint256 currentTime);
    error InvalidOutcomeCount(uint256 provided, uint256 min, uint256 max);
    error MarketAlreadyExists(bytes32 marketId);
    error MarketNotFound(bytes32 marketId);
    error MarketNotInStatus(bytes32 marketId, MarketStatus expected, MarketStatus actual);
    error QuestionTooLong(uint256 length, uint256 maxLength);
    error EmptyQuestion();

    // ──────────────────── Constructor ────────────────────
    constructor(address _conditionalTokens, address _usdc) {
        conditionalTokens = IConditionalTokens(_conditionalTokens);
        usdc = IERC20(_usdc);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MARKET_CREATOR_ROLE, msg.sender);
        _grantRole(RESOLVER_ROLE, msg.sender);
    }

    // ──────────────────── External Functions ────────────────────

    function createMarket(
        bytes32 questionId,
        string calldata question,
        uint256 outcomeCount,
        uint256 deadline,
        bytes calldata ancillaryData,
        uint256 initialLiquidity
    ) external onlyRole(MARKET_CREATOR_ROLE) whenNotPaused returns (bytes32 marketId) {
        // Validate question
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (bytes(question).length > MAX_QUESTION_LENGTH) {
            revert QuestionTooLong(bytes(question).length, MAX_QUESTION_LENGTH);
        }

        // Validate outcome count
        if (outcomeCount < MIN_OUTCOMES || outcomeCount > MAX_OUTCOMES) {
            revert InvalidOutcomeCount(outcomeCount, MIN_OUTCOMES, MAX_OUTCOMES);
        }

        // Validate deadline
        if (deadline <= block.timestamp) {
            revert DeadlineInPast(deadline, block.timestamp);
        }

        // Compute market ID
        marketId = keccak256(abi.encode(questionId, outcomeCount, deadline));

        // Check market doesn't already exist
        if (markets[marketId].createdAt != 0) {
            revert MarketAlreadyExists(marketId);
        }

        // Prepare condition on the conditional tokens contract (factory is the oracle)
        conditionalTokens.prepareCondition(address(this), questionId, outcomeCount);

        // Compute condition ID
        bytes32 conditionId = conditionalTokens.getConditionId(address(this), questionId, outcomeCount);

        // Store market
        markets[marketId] = Market({
            questionId: questionId,
            question: question,
            outcomeCount: outcomeCount,
            deadline: deadline,
            createdAt: block.timestamp,
            creator: msg.sender,
            status: MarketStatus.Created,
            conditionId: conditionId,
            ancillaryData: ancillaryData,
            initialLiquidity: initialLiquidity
        });

        allMarketIds.push(marketId);

        emit MarketCreated(marketId, questionId, msg.sender, question, outcomeCount, deadline, block.timestamp);
        emit MarketStatusChanged(marketId, MarketStatus.Created, MarketStatus.Created);

        return marketId;
    }

    function activateMarket(bytes32 marketId) external onlyRole(MARKET_CREATOR_ROLE) {
        Market storage market = _getExistingMarket(marketId);

        if (market.status != MarketStatus.Created) {
            revert MarketNotInStatus(marketId, MarketStatus.Created, market.status);
        }

        MarketStatus oldStatus = market.status;
        market.status = MarketStatus.Active;
        activeMarketIds.push(marketId);

        emit MarketStatusChanged(marketId, oldStatus, MarketStatus.Active);
    }

    function beginResolution(bytes32 marketId) external onlyRole(RESOLVER_ROLE) {
        Market storage market = _getExistingMarket(marketId);

        if (market.status != MarketStatus.Active) {
            revert MarketNotInStatus(marketId, MarketStatus.Active, market.status);
        }

        MarketStatus oldStatus = market.status;
        market.status = MarketStatus.Resolving;

        emit MarketStatusChanged(marketId, oldStatus, MarketStatus.Resolving);
    }

    function resolveMarket(bytes32 marketId) external onlyRole(RESOLVER_ROLE) {
        Market storage market = _getExistingMarket(marketId);

        if (market.status != MarketStatus.Resolving) {
            revert MarketNotInStatus(marketId, MarketStatus.Resolving, market.status);
        }

        MarketStatus oldStatus = market.status;
        market.status = MarketStatus.Resolved;
        _removeFromActiveMarkets(marketId);

        emit MarketResolved(marketId, block.timestamp);
        emit MarketStatusChanged(marketId, oldStatus, MarketStatus.Resolved);
    }

    function disputeMarket(bytes32 marketId) external onlyRole(RESOLVER_ROLE) {
        Market storage market = _getExistingMarket(marketId);

        if (market.status != MarketStatus.Resolving) {
            revert MarketNotInStatus(marketId, MarketStatus.Resolving, market.status);
        }

        MarketStatus oldStatus = market.status;
        market.status = MarketStatus.Disputed;

        emit MarketStatusChanged(marketId, oldStatus, MarketStatus.Disputed);
    }

    function resetToResolving(bytes32 marketId) external onlyRole(RESOLVER_ROLE) {
        Market storage market = _getExistingMarket(marketId);

        if (market.status != MarketStatus.Disputed) {
            revert MarketNotInStatus(marketId, MarketStatus.Disputed, market.status);
        }

        MarketStatus oldStatus = market.status;
        market.status = MarketStatus.Resolving;

        emit MarketStatusChanged(marketId, oldStatus, MarketStatus.Resolving);
    }

    function cancelMarket(bytes32 marketId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Market storage market = _getExistingMarket(marketId);

        if (market.status != MarketStatus.Created && market.status != MarketStatus.Active) {
            revert MarketNotInStatus(marketId, MarketStatus.Created, market.status);
        }

        MarketStatus oldStatus = market.status;

        if (market.status == MarketStatus.Active) {
            _removeFromActiveMarkets(marketId);
        }

        market.status = MarketStatus.Cancelled;

        emit MarketCancelled(marketId, block.timestamp);
        emit MarketStatusChanged(marketId, oldStatus, MarketStatus.Cancelled);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function reportPayoutsFor(bytes32 marketId, uint256[] calldata payouts) external onlyRole(RESOLVER_ROLE) {
        Market storage market = _getExistingMarket(marketId);

        require(payouts.length == market.outcomeCount, "Invalid payouts length");

        conditionalTokens.reportPayouts(market.questionId, payouts);
    }

    // ──────────────────── View Functions ────────────────────

    function getMarket(bytes32 marketId) external view returns (Market memory) {
        if (markets[marketId].createdAt == 0) {
            revert MarketNotFound(marketId);
        }
        return markets[marketId];
    }

    function getMarketCount() external view returns (uint256) {
        return allMarketIds.length;
    }

    function getActiveMarkets() external view returns (bytes32[] memory) {
        return activeMarketIds;
    }

    function getAllMarketIds() external view returns (bytes32[] memory) {
        return allMarketIds;
    }

    function isMarketActive(bytes32 marketId) external view returns (bool) {
        return markets[marketId].status == MarketStatus.Active;
    }

    function marketExists(bytes32 marketId) external view returns (bool) {
        return markets[marketId].createdAt != 0;
    }

    // ──────────────────── Internal Functions ────────────────────

    function _getExistingMarket(bytes32 marketId) internal view returns (Market storage) {
        if (markets[marketId].createdAt == 0) {
            revert MarketNotFound(marketId);
        }
        return markets[marketId];
    }

    function _removeFromActiveMarkets(bytes32 marketId) internal {
        uint256 length = activeMarketIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (activeMarketIds[i] == marketId) {
                activeMarketIds[i] = activeMarketIds[length - 1];
                activeMarketIds.pop();
                break;
            }
        }
    }
}
