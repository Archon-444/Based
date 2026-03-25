// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ConditionalTokens} from "../../src/ConditionalTokens.sol";
import {MarketFactory} from "../../src/MarketFactory.sol";
import {PythOracleAdapter} from "../../src/PythOracleAdapter.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {MockPyth} from "../mocks/MockPyth.sol";

contract PythOracleAdapterTest is Test {
    ConditionalTokens public ctf;
    MockERC20 public usdc;
    MarketFactory public factory;
    MockPyth public mockPyth;
    PythOracleAdapter public adapter;

    address public admin;
    address public unauthorized;

    bytes32 public marketId;
    bytes32 constant FEED_ID = bytes32(uint256(1));
    int256 constant STRIKE_PRICE = 50000e8; // $50,000 with 8 decimals
    int256 constant STRIKE_PRICE_HIGH = 60000e8;

    function setUp() public {
        admin = address(this);
        unauthorized = makeAddr("unauthorized");

        ctf = new ConditionalTokens();
        usdc = new MockERC20("USDC", "USDC", 6);
        mockPyth = new MockPyth();
        factory = new MarketFactory(address(ctf), address(usdc));
        adapter = new PythOracleAdapter(address(mockPyth), address(factory));

        // Grant RESOLVER_ROLE to adapter
        factory.grantRole(factory.RESOLVER_ROLE(), address(adapter));

        // Create and activate a binary market
        marketId = factory.createMarket(
            keccak256("btc-price"),
            "Will BTC be above 50k?",
            2,
            block.timestamp + 7 days,
            "",
            1000e6
        );
        factory.activateMarket(marketId);

        // Set a default price in mock
        mockPyth.setPrice(FEED_ID, 55000e8, -8);

        // Fund test contract for payable resolve
        vm.deal(admin, 10 ether);
    }

    function _createAndActivateMarket(bytes32 questionId, uint256 outcomeCount) internal returns (bytes32) {
        bytes32 id = factory.createMarket(
            questionId,
            "Test market",
            outcomeCount,
            block.timestamp + 7 days,
            "",
            0
        );
        factory.activateMarket(id);
        return id;
    }

    function _createRegisterActivate(
        bytes32 qId,
        PythOracleAdapter.ResolutionType resType,
        int256 strike,
        int256 strikeHigh
    ) internal returns (bytes32 mId) {
        mId = factory.createMarket(qId, "Test", 2, block.timestamp + 7 days, "", 0);
        factory.activateMarket(mId);
        adapter.registerMarket(mId, FEED_ID, strike, strikeHigh, resType);
    }

    // ──────────────────── Constructor (3) ────────────────────

    function test_constructor_setsPyth() public view {
        assertEq(address(adapter.pyth()), address(mockPyth));
    }

    function test_constructor_setsFactory() public view {
        assertEq(address(adapter.factory()), address(factory));
    }

    function test_constructor_grantsAdminRole() public view {
        assertTrue(adapter.hasRole(adapter.DEFAULT_ADMIN_ROLE(), admin));
    }

    // ──────────────────── registerMarket (7) ────────────────────

    function test_registerMarket_success_above() public {
        adapter.registerMarket(marketId, FEED_ID, STRIKE_PRICE, 0, PythOracleAdapter.ResolutionType.ABOVE);
        PythOracleAdapter.PythMarketConfig memory config = adapter.getMarketConfig(marketId);
        assertTrue(config.registered);
        assertEq(config.feedId, FEED_ID);
        assertEq(config.strikePrice, STRIKE_PRICE);
        assertEq(uint256(config.resolutionType), uint256(PythOracleAdapter.ResolutionType.ABOVE));
    }

    function test_registerMarket_success_below() public {
        adapter.registerMarket(marketId, FEED_ID, STRIKE_PRICE, 0, PythOracleAdapter.ResolutionType.BELOW);
        PythOracleAdapter.PythMarketConfig memory config = adapter.getMarketConfig(marketId);
        assertTrue(config.registered);
        assertEq(uint256(config.resolutionType), uint256(PythOracleAdapter.ResolutionType.BELOW));
    }

    function test_registerMarket_success_between() public {
        adapter.registerMarket(marketId, FEED_ID, STRIKE_PRICE, STRIKE_PRICE_HIGH, PythOracleAdapter.ResolutionType.BETWEEN);
        PythOracleAdapter.PythMarketConfig memory config = adapter.getMarketConfig(marketId);
        assertTrue(config.registered);
        assertEq(config.strikePrice, STRIKE_PRICE);
        assertEq(config.strikePriceHigh, STRIKE_PRICE_HIGH);
        assertEq(uint256(config.resolutionType), uint256(PythOracleAdapter.ResolutionType.BETWEEN));
    }

    function test_registerMarket_emitsMarketRegistered() public {
        vm.expectEmit(true, true, false, true);
        emit PythOracleAdapter.MarketRegistered(marketId, FEED_ID, STRIKE_PRICE, uint8(PythOracleAdapter.ResolutionType.ABOVE));
        adapter.registerMarket(marketId, FEED_ID, STRIKE_PRICE, 0, PythOracleAdapter.ResolutionType.ABOVE);
    }

    function test_registerMarket_revertsAlreadyRegistered() public {
        adapter.registerMarket(marketId, FEED_ID, STRIKE_PRICE, 0, PythOracleAdapter.ResolutionType.ABOVE);
        vm.expectRevert(abi.encodeWithSelector(PythOracleAdapter.MarketAlreadyRegistered.selector, marketId));
        adapter.registerMarket(marketId, FEED_ID, STRIKE_PRICE, 0, PythOracleAdapter.ResolutionType.ABOVE);
    }

    function test_registerMarket_revertsUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        adapter.registerMarket(marketId, FEED_ID, STRIKE_PRICE, 0, PythOracleAdapter.ResolutionType.ABOVE);
    }

    function test_registerMarket_revertsNonBinaryMarket() public {
        bytes32 threeOutcomeId = _createAndActivateMarket(keccak256("three-outcome"), 3);
        vm.expectRevert(abi.encodeWithSelector(PythOracleAdapter.OnlyBinaryMarkets.selector, threeOutcomeId, 3));
        adapter.registerMarket(threeOutcomeId, FEED_ID, STRIKE_PRICE, 0, PythOracleAdapter.ResolutionType.ABOVE);
    }

    // ──────────────────── Validation (2) ────────────────────

    function test_registerMarket_revertsInvalidPriceRange() public {
        // BETWEEN with high <= low
        vm.expectRevert(
            abi.encodeWithSelector(PythOracleAdapter.InvalidPriceRange.selector, STRIKE_PRICE_HIGH, STRIKE_PRICE)
        );
        adapter.registerMarket(
            marketId,
            FEED_ID,
            STRIKE_PRICE_HIGH, // low = 60000
            STRIKE_PRICE, // high = 50000 (invalid: high <= low)
            PythOracleAdapter.ResolutionType.BETWEEN
        );
    }

    function test_getMarketConfig_returnsCorrectData() public {
        adapter.registerMarket(marketId, FEED_ID, STRIKE_PRICE, STRIKE_PRICE_HIGH, PythOracleAdapter.ResolutionType.BETWEEN);
        PythOracleAdapter.PythMarketConfig memory config = adapter.getMarketConfig(marketId);
        assertEq(config.feedId, FEED_ID);
        assertEq(config.strikePrice, STRIKE_PRICE);
        assertEq(config.strikePriceHigh, STRIKE_PRICE_HIGH);
        assertEq(uint256(config.resolutionType), uint256(PythOracleAdapter.ResolutionType.BETWEEN));
        assertTrue(config.registered);
        assertFalse(config.resolved);
    }

    // ──────────────────── resolve ABOVE (4) ────────────────────

    function test_resolve_above_priceAboveStrike_outcome0() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("above-high"),
            PythOracleAdapter.ResolutionType.ABOVE,
            STRIKE_PRICE,
            0
        );
        // price=55000e8 >= strike=50000e8 => outcome 0
        mockPyth.setPrice(FEED_ID, 55000e8, -8);
        adapter.resolve{value: 1}(mId, new bytes[](0));

        PythOracleAdapter.PythMarketConfig memory config = adapter.getMarketConfig(mId);
        assertTrue(config.resolved);

        // Check market is Resolved and payout was reported for outcome 0
        MarketFactory.Market memory market = factory.getMarket(mId);
        assertEq(uint256(market.status), uint256(MarketFactory.MarketStatus.Resolved));
    }

    function test_resolve_above_priceBelowStrike_outcome1() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("above-low"),
            PythOracleAdapter.ResolutionType.ABOVE,
            STRIKE_PRICE,
            0
        );
        // price=45000e8 < strike=50000e8 => outcome 1
        mockPyth.setPrice(FEED_ID, 45000e8, -8);
        adapter.resolve{value: 1}(mId, new bytes[](0));

        MarketFactory.Market memory market = factory.getMarket(mId);
        assertEq(uint256(market.status), uint256(MarketFactory.MarketStatus.Resolved));

        // Check payout denominator is set (payouts reported)
        uint256 den = ctf.payoutDenominator(market.conditionId);
        assertGt(den, 0);
    }

    function test_resolve_emitsMarketResolved() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("above-emit"),
            PythOracleAdapter.ResolutionType.ABOVE,
            STRIKE_PRICE,
            0
        );
        mockPyth.setPrice(FEED_ID, 55000e8, -8);

        vm.expectEmit(true, true, false, true);
        emit PythOracleAdapter.MarketResolved(mId, FEED_ID, 55000e8, -8, 0);
        adapter.resolve{value: 1}(mId, new bytes[](0));
    }

    function test_resolve_setsMarketResolved() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("above-status"),
            PythOracleAdapter.ResolutionType.ABOVE,
            STRIKE_PRICE,
            0
        );
        mockPyth.setPrice(FEED_ID, 55000e8, -8);
        adapter.resolve{value: 1}(mId, new bytes[](0));

        MarketFactory.Market memory market = factory.getMarket(mId);
        assertEq(uint256(market.status), uint256(MarketFactory.MarketStatus.Resolved));
    }

    // ──────────────────── resolve BELOW (2) ────────────────────

    function test_resolve_below_priceBelowStrike_outcome0() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("below-low"),
            PythOracleAdapter.ResolutionType.BELOW,
            STRIKE_PRICE,
            0
        );
        // price=45000e8 < strike=50000e8 => outcome 0
        mockPyth.setPrice(FEED_ID, 45000e8, -8);
        adapter.resolve{value: 1}(mId, new bytes[](0));

        MarketFactory.Market memory market = factory.getMarket(mId);
        assertEq(uint256(market.status), uint256(MarketFactory.MarketStatus.Resolved));
    }

    function test_resolve_below_priceAboveStrike_outcome1() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("below-high"),
            PythOracleAdapter.ResolutionType.BELOW,
            STRIKE_PRICE,
            0
        );
        // price=55000e8 >= strike=50000e8 => outcome 1
        mockPyth.setPrice(FEED_ID, 55000e8, -8);
        adapter.resolve{value: 1}(mId, new bytes[](0));

        MarketFactory.Market memory market = factory.getMarket(mId);
        assertEq(uint256(market.status), uint256(MarketFactory.MarketStatus.Resolved));
    }

    // ──────────────────── resolve BETWEEN (2) ────────────────────

    function test_resolve_between_priceInRange_outcome0() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("between-in"),
            PythOracleAdapter.ResolutionType.BETWEEN,
            STRIKE_PRICE,
            STRIKE_PRICE_HIGH
        );
        // price=55000e8 in [50000e8, 60000e8] => outcome 0
        mockPyth.setPrice(FEED_ID, 55000e8, -8);
        adapter.resolve{value: 1}(mId, new bytes[](0));

        MarketFactory.Market memory market = factory.getMarket(mId);
        assertEq(uint256(market.status), uint256(MarketFactory.MarketStatus.Resolved));
    }

    function test_resolve_between_priceOutOfRange_outcome1() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("between-out"),
            PythOracleAdapter.ResolutionType.BETWEEN,
            STRIKE_PRICE,
            STRIKE_PRICE_HIGH
        );
        // price=65000e8 > high=60000e8 => outcome 1
        mockPyth.setPrice(FEED_ID, 65000e8, -8);
        adapter.resolve{value: 1}(mId, new bytes[](0));

        MarketFactory.Market memory market = factory.getMarket(mId);
        assertEq(uint256(market.status), uint256(MarketFactory.MarketStatus.Resolved));
    }

    // ──────────────────── resolve Errors (3) ────────────────────

    function test_resolve_revertsNotRegistered() public {
        bytes32 fakeId = keccak256("not-registered");
        vm.expectRevert(abi.encodeWithSelector(PythOracleAdapter.MarketNotRegistered.selector, fakeId));
        adapter.resolve{value: 1}(fakeId, new bytes[](0));
    }

    function test_resolve_revertsAlreadyResolved() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("already-resolved"),
            PythOracleAdapter.ResolutionType.ABOVE,
            STRIKE_PRICE,
            0
        );
        mockPyth.setPrice(FEED_ID, 55000e8, -8);
        adapter.resolve{value: 1}(mId, new bytes[](0));

        vm.expectRevert(abi.encodeWithSelector(PythOracleAdapter.MarketAlreadyResolved.selector, mId));
        adapter.resolve{value: 1}(mId, new bytes[](0));
    }

    function test_resolve_refundsExcessEth() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("refund-test"),
            PythOracleAdapter.ResolutionType.ABOVE,
            STRIKE_PRICE,
            0
        );
        mockPyth.setPrice(FEED_ID, 55000e8, -8);
        // MockPyth updateFee is 1 wei by default
        uint256 balBefore = admin.balance;
        adapter.resolve{value: 1 ether}(mId, new bytes[](0));
        uint256 balAfter = admin.balance;
        // Should have refunded ~1 ether minus 1 wei fee
        uint256 spent = balBefore - balAfter;
        assertEq(spent, 1); // only the 1 wei fee was consumed
    }

    // ──────────────────── Pause (3) ────────────────────

    function test_pause_blocksResolve() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("pause-block"),
            PythOracleAdapter.ResolutionType.ABOVE,
            STRIKE_PRICE,
            0
        );
        adapter.pause();
        vm.expectRevert();
        adapter.resolve{value: 1}(mId, new bytes[](0));
    }

    function test_unpause_allowsResolve() public {
        bytes32 mId = _createRegisterActivate(
            keccak256("unpause-allow"),
            PythOracleAdapter.ResolutionType.ABOVE,
            STRIKE_PRICE,
            0
        );
        mockPyth.setPrice(FEED_ID, 55000e8, -8);
        adapter.pause();
        adapter.unpause();
        adapter.resolve{value: 1}(mId, new bytes[](0));

        PythOracleAdapter.PythMarketConfig memory config = adapter.getMarketConfig(mId);
        assertTrue(config.resolved);
    }

    function test_pause_revertsUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        adapter.pause();
    }

    receive() external payable {}
}
