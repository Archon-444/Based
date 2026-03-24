// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IOptimisticOracleV3} from "./interfaces/IOptimisticOracleV3.sol";
import {MarketFactory} from "./MarketFactory.sol";

contract UmaCtfAdapter is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ──────────────────── Structs ────────────────────

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

    // ──────────────────── Constants ────────────────────

    uint256 public constant MIN_BOND = 500e6;
    uint64 public constant DEFAULT_LIVENESS_SPORTS = 7200;
    uint64 public constant DEFAULT_LIVENESS_POLITICS = 172800;
    uint256 public constant BOND_RATIO_BPS = 100;

    // ──────────────────── State ────────────────────

    IOptimisticOracleV3 public oov3;
    MarketFactory public factory;
    IERC20 public usdc;

    mapping(bytes32 => MarketData) internal marketData;
    mapping(bytes32 => bytes32) public assertionToMarket;

    bool public proposerWhitelistEnabled;
    mapping(address => bool) public whitelistedProposers;

    // ──────────────────── Events ────────────────────

    event MarketRegistered(bytes32 indexed marketId, uint256 bond, uint64 liveness);
    event OutcomeAsserted(
        bytes32 indexed marketId,
        bytes32 indexed assertionId,
        uint256 proposedOutcome,
        address indexed asserter
    );
    event AssertionSettled(bytes32 indexed marketId, bytes32 indexed assertionId, uint256 winningOutcome);
    event AssertionDisputed(bytes32 indexed marketId, bytes32 indexed assertionId, uint256 disputeCount);
    event MarketReset(bytes32 indexed marketId);

    // ──────────────────── Errors ────────────────────

    error AssertionAlreadyActive(bytes32 marketId);
    error InvalidMarketStatus(bytes32 marketId);
    error InvalidOutcome(uint256 outcome, uint256 outcomeCount);
    error MarketAlreadyRegistered(bytes32 marketId);
    error MarketAlreadyResolved(bytes32 marketId);
    error MarketNotRegistered(bytes32 marketId);
    error NoActiveAssertion(bytes32 marketId);
    error NotWhitelisted(address proposer);
    error OnlyOOV3();
    error UnknownAssertion(bytes32 assertionId);

    // ──────────────────── Constructor ────────────────────

    constructor(address _oov3, address _factory, address _usdc) {
        oov3 = IOptimisticOracleV3(_oov3);
        factory = MarketFactory(_factory);
        usdc = IERC20(_usdc);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ──────────────────── External Functions ────────────────────

    function registerMarket(
        bytes32 marketId,
        uint256 reward,
        uint256 bond,
        uint64 liveness
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (marketData[marketId].registered) revert MarketAlreadyRegistered(marketId);

        // Fetch market from factory — reverts if not found
        MarketFactory.Market memory market = factory.getMarket(marketId);
        if (market.createdAt == 0) revert InvalidMarketStatus(marketId);

        // Validate bond
        require(bond >= MIN_BOND, "Bond below minimum");

        // Store market data
        marketData[marketId] = MarketData({
            marketId: marketId,
            questionId: market.questionId,
            conditionId: market.conditionId,
            outcomeCount: market.outcomeCount,
            ancillaryData: market.ancillaryData,
            reward: reward,
            bond: bond,
            liveness: liveness,
            registered: true,
            activeAssertionId: bytes32(0),
            proposedOutcome: 0,
            disputeCount: 0,
            resolved: false
        });

        emit MarketRegistered(marketId, bond, liveness);
    }

    function assertOutcome(bytes32 marketId, uint256 proposedOutcome) external whenNotPaused nonReentrant {
        MarketData storage data = marketData[marketId];

        if (!data.registered) revert MarketNotRegistered(marketId);
        if (data.resolved) revert MarketAlreadyResolved(marketId);
        if (data.activeAssertionId != bytes32(0)) revert AssertionAlreadyActive(marketId);
        if (proposerWhitelistEnabled && !whitelistedProposers[msg.sender]) revert NotWhitelisted(msg.sender);
        if (proposedOutcome >= data.outcomeCount) revert InvalidOutcome(proposedOutcome, data.outcomeCount);

        // Build claim from ancillary data and proposed outcome
        bytes memory claim = abi.encodePacked(
            data.ancillaryData,
            " Proposed outcome: ",
            _uint256ToString(proposedOutcome)
        );

        // Transfer bond from asserter and approve OOV3
        usdc.safeTransferFrom(msg.sender, address(this), data.bond);
        usdc.approve(address(oov3), data.bond);

        // Assert truth via OOV3
        bytes32 assertionId = oov3.assertTruth(
            claim,
            msg.sender,
            address(this), // callbackRecipient
            address(0), // escalationManager
            data.liveness,
            usdc,
            data.bond,
            oov3.defaultIdentifier(),
            bytes32(0) // domainId
        );

        // Store assertion state
        data.activeAssertionId = assertionId;
        data.proposedOutcome = proposedOutcome;
        assertionToMarket[assertionId] = marketId;

        emit OutcomeAsserted(marketId, assertionId, proposedOutcome, msg.sender);
    }

    function settle(bytes32 marketId) external nonReentrant {
        MarketData storage data = marketData[marketId];
        if (data.activeAssertionId == bytes32(0)) revert NoActiveAssertion(marketId);

        oov3.settleAssertion(data.activeAssertionId);
    }

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external {
        if (msg.sender != address(oov3)) revert OnlyOOV3();

        bytes32 marketId = assertionToMarket[assertionId];
        if (marketId == bytes32(0)) revert UnknownAssertion(assertionId);

        MarketData storage data = marketData[marketId];

        if (assertedTruthfully) {
            uint256 winningOutcome = data.proposedOutcome;

            // Build payouts array
            uint256[] memory payouts = new uint256[](data.outcomeCount);
            payouts[winningOutcome] = 1;

            // Resolve via factory (atomic: beginResolution -> reportPayouts -> resolveMarket)
            factory.beginResolution(marketId);
            factory.reportPayoutsFor(marketId, payouts);
            factory.resolveMarket(marketId);

            data.resolved = true;
            data.activeAssertionId = bytes32(0);

            emit AssertionSettled(marketId, assertionId, winningOutcome);
        } else {
            // Assertion was disputed and resolved as false — reset
            data.activeAssertionId = bytes32(0);

            emit MarketReset(marketId);
        }
    }

    function assertionDisputedCallback(bytes32 assertionId) external {
        if (msg.sender != address(oov3)) revert OnlyOOV3();

        bytes32 marketId = assertionToMarket[assertionId];
        if (marketId == bytes32(0)) revert UnknownAssertion(assertionId);

        MarketData storage data = marketData[marketId];
        data.disputeCount++;
        data.activeAssertionId = bytes32(0);

        // On first dispute, transition market status
        if (data.disputeCount == 1) {
            factory.beginResolution(marketId);
            factory.disputeMarket(marketId);
        }

        emit AssertionDisputed(marketId, assertionId, data.disputeCount);
    }

    // ──────────────────── View Functions ────────────────────

    function getMarketData(bytes32 marketId) external view returns (MarketData memory) {
        return marketData[marketId];
    }

    function getMarketForAssertion(bytes32 assertionId) external view returns (bytes32) {
        return assertionToMarket[assertionId];
    }

    // ──────────────────── Admin Functions ────────────────────

    function setProposerWhitelist(address proposer, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelistedProposers[proposer] = allowed;
    }

    function setProposerWhitelistEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        proposerWhitelistEnabled = enabled;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ──────────────────── Internal Helpers ────────────────────

    function _uint256ToString(uint256 value) internal pure returns (bytes memory) {
        if (value == 0) return "0";

        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }

        return buffer;
    }
}
