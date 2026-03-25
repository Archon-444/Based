// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ConditionalTokens} from "../../src/ConditionalTokens.sol";
import {MarketFactory} from "../../src/MarketFactory.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract MarketFactoryTest is Test {
    ConditionalTokens public ctf;
    MockERC20 public usdc;
    MarketFactory public factory;

    address public admin;
    address public unauthorized;

    bytes32 constant DEFAULT_QUESTION_ID = keccak256("test-question");
    string constant DEFAULT_QUESTION = "Will BTC reach 100k?";
    uint256 constant DEFAULT_OUTCOME_COUNT = 2;
    uint256 constant DEFAULT_INITIAL_LIQUIDITY = 1000e6;

    function setUp() public {
        admin = address(this);
        unauthorized = makeAddr("unauthorized");

        ctf = new ConditionalTokens();
        usdc = new MockERC20("USDC", "USDC", 6);
        factory = new MarketFactory(address(ctf), address(usdc));
    }

    function _defaultDeadline() internal view returns (uint256) {
        return block.timestamp + 7 days;
    }

    function _createDefaultMarket() internal returns (bytes32) {
        return factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    // ═══════════════════════════════════════════════════════════
    // Constructor & Constants (5)
    // ═══════════════════════════════════════════════════════════

    function test_constructor_setsConditionalTokens() public view {
        assertEq(address(factory.conditionalTokens()), address(ctf));
    }

    function test_constructor_setsUsdc() public view {
        assertEq(address(factory.usdc()), address(usdc));
    }

    function test_constructor_grantsRoles() public view {
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(factory.hasRole(factory.MARKET_CREATOR_ROLE(), admin));
        assertTrue(factory.hasRole(factory.RESOLVER_ROLE(), admin));
    }

    function test_constants_outcomeRange() public view {
        assertEq(factory.MIN_OUTCOMES(), 2);
        assertEq(factory.MAX_OUTCOMES(), 8);
    }

    function test_constants_maxQuestionLength() public view {
        assertEq(factory.MAX_QUESTION_LENGTH(), 500);
    }

    // ═══════════════════════════════════════════════════════════
    // createMarket Happy Path (5)
    // ═══════════════════════════════════════════════════════════

    function test_createMarket_success() public {
        bytes32 marketId = _createDefaultMarket();

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertEq(m.questionId, DEFAULT_QUESTION_ID);
        assertEq(m.question, DEFAULT_QUESTION);
        assertEq(m.outcomeCount, DEFAULT_OUTCOME_COUNT);
        assertEq(m.deadline, _defaultDeadline());
        assertEq(m.creator, admin);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Created));
        assertEq(m.initialLiquidity, DEFAULT_INITIAL_LIQUIDITY);
    }

    function test_createMarket_emitsMarketCreated() public {
        bytes32 expectedMarketId = keccak256(
            abi.encode(DEFAULT_QUESTION_ID, DEFAULT_OUTCOME_COUNT, _defaultDeadline())
        );

        vm.expectEmit(true, true, true, true);
        emit MarketFactory.MarketCreated(
            expectedMarketId,
            DEFAULT_QUESTION_ID,
            admin,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            block.timestamp
        );

        factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_createMarket_emitsStatusChanged() public {
        bytes32 expectedMarketId = keccak256(
            abi.encode(DEFAULT_QUESTION_ID, DEFAULT_OUTCOME_COUNT, _defaultDeadline())
        );

        vm.expectEmit(true, false, false, true);
        emit MarketFactory.MarketStatusChanged(
            expectedMarketId,
            MarketFactory.MarketStatus.Created,
            MarketFactory.MarketStatus.Created
        );

        factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_createMarket_callsPrepareCondition() public {
        bytes32 marketId = _createDefaultMarket();

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertTrue(m.conditionId != bytes32(0));
    }

    function test_createMarket_computesCorrectMarketId() public {
        uint256 deadline = _defaultDeadline();
        bytes32 expectedMarketId = keccak256(
            abi.encode(DEFAULT_QUESTION_ID, DEFAULT_OUTCOME_COUNT, deadline)
        );

        bytes32 marketId = factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            deadline,
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );

        assertEq(marketId, expectedMarketId);
    }

    // ═══════════════════════════════════════════════════════════
    // createMarket Validation (5)
    // ═══════════════════════════════════════════════════════════

    function test_createMarket_revertsEmptyQuestion() public {
        vm.expectRevert(MarketFactory.EmptyQuestion.selector);
        factory.createMarket(
            DEFAULT_QUESTION_ID,
            "",
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_createMarket_revertsQuestionTooLong() public {
        bytes memory longBytes = new bytes(501);
        for (uint256 i = 0; i < 501; i++) {
            longBytes[i] = "A";
        }
        string memory longQuestion = string(longBytes);

        vm.expectRevert(
            abi.encodeWithSelector(MarketFactory.QuestionTooLong.selector, 501, 500)
        );
        factory.createMarket(
            DEFAULT_QUESTION_ID,
            longQuestion,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_createMarket_revertsInvalidOutcomeCount_low() public {
        vm.expectRevert(
            abi.encodeWithSelector(MarketFactory.InvalidOutcomeCount.selector, 1, 2, 8)
        );
        factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            1,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_createMarket_revertsInvalidOutcomeCount_high() public {
        vm.expectRevert(
            abi.encodeWithSelector(MarketFactory.InvalidOutcomeCount.selector, 9, 2, 8)
        );
        factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            9,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_createMarket_revertsDeadlineInPast() public {
        uint256 pastDeadline = block.timestamp - 1;
        vm.expectRevert(
            abi.encodeWithSelector(
                MarketFactory.DeadlineInPast.selector, pastDeadline, block.timestamp
            )
        );
        factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            pastDeadline,
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    // ═══════════════════════════════════════════════════════════
    // createMarket Edge Cases (2)
    // ═══════════════════════════════════════════════════════════

    function test_createMarket_revertsMarketAlreadyExists() public {
        _createDefaultMarket();

        bytes32 expectedMarketId = keccak256(
            abi.encode(DEFAULT_QUESTION_ID, DEFAULT_OUTCOME_COUNT, _defaultDeadline())
        );

        vm.expectRevert(
            abi.encodeWithSelector(MarketFactory.MarketAlreadyExists.selector, expectedMarketId)
        );
        factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_createMarket_multipleOutcomeCounts() public {
        uint256[] memory counts = new uint256[](4);
        counts[0] = 2;
        counts[1] = 3;
        counts[2] = 4;
        counts[3] = 8;

        for (uint256 i = 0; i < counts.length; i++) {
            bytes32 questionId = keccak256(abi.encode("question", i));
            bytes32 marketId = factory.createMarket(
                questionId,
                DEFAULT_QUESTION,
                counts[i],
                _defaultDeadline(),
                "",
                DEFAULT_INITIAL_LIQUIDITY
            );

            MarketFactory.Market memory m = factory.getMarket(marketId);
            assertEq(m.outcomeCount, counts[i]);
        }

        assertEq(factory.getMarketCount(), 4);
    }

    // ═══════════════════════════════════════════════════════════
    // Access Control (5)
    // ═══════════════════════════════════════════════════════════

    function test_createMarket_revertsUnauthorized() public {
        bytes32 creatorRole = factory.MARKET_CREATOR_ROLE();
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                unauthorized,
                creatorRole
            )
        );
        vm.prank(unauthorized);
        factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_activateMarket_revertsUnauthorized() public {
        bytes32 marketId = _createDefaultMarket();
        bytes32 creatorRole = factory.MARKET_CREATOR_ROLE();

        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                unauthorized,
                creatorRole
            )
        );
        vm.prank(unauthorized);
        factory.activateMarket(marketId);
    }

    function test_beginResolution_revertsUnauthorized() public {
        bytes32 marketId = _createDefaultMarket();
        factory.activateMarket(marketId);
        bytes32 resolverRole = factory.RESOLVER_ROLE();

        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                unauthorized,
                resolverRole
            )
        );
        vm.prank(unauthorized);
        factory.beginResolution(marketId);
    }

    function test_cancelMarket_revertsUnauthorized() public {
        bytes32 marketId = _createDefaultMarket();
        bytes32 adminRole = factory.DEFAULT_ADMIN_ROLE();

        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                unauthorized,
                adminRole
            )
        );
        vm.prank(unauthorized);
        factory.cancelMarket(marketId);
    }

    function test_reportPayoutsFor_revertsUnauthorized() public {
        bytes32 marketId = _createDefaultMarket();
        bytes32 resolverRole = factory.RESOLVER_ROLE();

        uint256[] memory payouts = new uint256[](2);
        payouts[0] = 1;
        payouts[1] = 0;

        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("AccessControlUnauthorizedAccount(address,bytes32)")),
                unauthorized,
                resolverRole
            )
        );
        vm.prank(unauthorized);
        factory.reportPayoutsFor(marketId, payouts);
    }

    // ═══════════════════════════════════════════════════════════
    // State Transitions (8)
    // ═══════════════════════════════════════════════════════════

    function test_activateMarket_success() public {
        bytes32 marketId = _createDefaultMarket();

        factory.activateMarket(marketId);

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Active));
        assertTrue(factory.isMarketActive(marketId));
    }

    function test_beginResolution_success() public {
        bytes32 marketId = _createDefaultMarket();
        factory.activateMarket(marketId);

        factory.beginResolution(marketId);

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Resolving));
    }

    function test_resolveMarket_success() public {
        bytes32 marketId = _createDefaultMarket();
        factory.activateMarket(marketId);
        factory.beginResolution(marketId);

        factory.resolveMarket(marketId);

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Resolved));

        // Should be removed from active markets
        bytes32[] memory active = factory.getActiveMarkets();
        for (uint256 i = 0; i < active.length; i++) {
            assertTrue(active[i] != marketId);
        }
    }

    function test_disputeMarket_success() public {
        bytes32 marketId = _createDefaultMarket();
        factory.activateMarket(marketId);
        factory.beginResolution(marketId);

        factory.disputeMarket(marketId);

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Disputed));
    }

    function test_resetToResolving_success() public {
        bytes32 marketId = _createDefaultMarket();
        factory.activateMarket(marketId);
        factory.beginResolution(marketId);
        factory.disputeMarket(marketId);

        factory.resetToResolving(marketId);

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Resolving));
    }

    function test_cancelMarket_fromCreated() public {
        bytes32 marketId = _createDefaultMarket();

        factory.cancelMarket(marketId);

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Cancelled));
    }

    function test_cancelMarket_fromActive() public {
        bytes32 marketId = _createDefaultMarket();
        factory.activateMarket(marketId);

        // Verify it is in activeMarkets before cancel
        bytes32[] memory activeBefore = factory.getActiveMarkets();
        assertEq(activeBefore.length, 1);

        factory.cancelMarket(marketId);

        MarketFactory.Market memory m = factory.getMarket(marketId);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Cancelled));

        // Should be removed from active markets
        bytes32[] memory activeAfter = factory.getActiveMarkets();
        assertEq(activeAfter.length, 0);
    }

    function test_activateMarket_revertsWrongStatus() public {
        bytes32 marketId = _createDefaultMarket();
        factory.activateMarket(marketId);

        // Try to activate again from Active status
        vm.expectRevert(
            abi.encodeWithSelector(
                MarketFactory.MarketNotInStatus.selector,
                marketId,
                MarketFactory.MarketStatus.Created,
                MarketFactory.MarketStatus.Active
            )
        );
        factory.activateMarket(marketId);
    }

    // ═══════════════════════════════════════════════════════════
    // View Functions (3)
    // ═══════════════════════════════════════════════════════════

    function test_getMarket_returnsCorrectData() public {
        uint256 deadline = _defaultDeadline();
        bytes memory ancillary = "some-data";

        bytes32 marketId = factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            deadline,
            ancillary,
            DEFAULT_INITIAL_LIQUIDITY
        );

        MarketFactory.Market memory m = factory.getMarket(marketId);

        assertEq(m.questionId, DEFAULT_QUESTION_ID);
        assertEq(m.question, DEFAULT_QUESTION);
        assertEq(m.outcomeCount, DEFAULT_OUTCOME_COUNT);
        assertEq(m.deadline, deadline);
        assertEq(m.createdAt, block.timestamp);
        assertEq(m.creator, admin);
        assertEq(uint256(m.status), uint256(MarketFactory.MarketStatus.Created));
        assertTrue(m.conditionId != bytes32(0));
        assertEq(m.ancillaryData, ancillary);
        assertEq(m.initialLiquidity, DEFAULT_INITIAL_LIQUIDITY);
    }

    function test_getMarketCount_increments() public {
        assertEq(factory.getMarketCount(), 0);

        for (uint256 i = 0; i < 3; i++) {
            bytes32 questionId = keccak256(abi.encode("q", i));
            factory.createMarket(
                questionId,
                DEFAULT_QUESTION,
                DEFAULT_OUTCOME_COUNT,
                _defaultDeadline(),
                "",
                DEFAULT_INITIAL_LIQUIDITY
            );
        }

        assertEq(factory.getMarketCount(), 3);
    }

    function test_getActiveMarkets_tracksCorrectly() public {
        // Create two markets
        bytes32 qId1 = keccak256("q1");
        bytes32 qId2 = keccak256("q2");

        bytes32 marketId1 = factory.createMarket(
            qId1,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );

        bytes32 marketId2 = factory.createMarket(
            qId2,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );

        // Activate both
        factory.activateMarket(marketId1);
        factory.activateMarket(marketId2);

        bytes32[] memory active = factory.getActiveMarkets();
        assertEq(active.length, 2);

        // Cancel one
        factory.cancelMarket(marketId1);

        active = factory.getActiveMarkets();
        assertEq(active.length, 1);
        assertEq(active[0], marketId2);
    }

    // ═══════════════════════════════════════════════════════════
    // Pause (2)
    // ═══════════════════════════════════════════════════════════

    function test_pause_blocksCreateMarket() public {
        factory.pause();

        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("EnforcedPause()"))));
        factory.createMarket(
            DEFAULT_QUESTION_ID,
            DEFAULT_QUESTION,
            DEFAULT_OUTCOME_COUNT,
            _defaultDeadline(),
            "",
            DEFAULT_INITIAL_LIQUIDITY
        );
    }

    function test_unpause_allowsCreateMarket() public {
        factory.pause();
        factory.unpause();

        bytes32 marketId = _createDefaultMarket();
        assertTrue(factory.marketExists(marketId));
    }
}
