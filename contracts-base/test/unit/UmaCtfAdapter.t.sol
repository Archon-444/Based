// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ConditionalTokens} from "../../src/ConditionalTokens.sol";
import {MarketFactory} from "../../src/MarketFactory.sol";
import {UmaCtfAdapter} from "../../src/UmaCtfAdapter.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {MockOptimisticOracleV3} from "../mocks/MockOptimisticOracleV3.sol";

contract UmaCtfAdapterTest is Test {
    ConditionalTokens public ctf;
    MockERC20 public usdc;
    MarketFactory public factory;
    MockOptimisticOracleV3 public mockOov3;
    UmaCtfAdapter public adapter;

    address public admin;
    address public asserter;
    address public unauthorized;

    bytes32 public marketId;
    uint256 constant BOND = 500e6;
    uint64 constant LIVENESS = 7200;

    function setUp() public {
        admin = address(this);
        asserter = makeAddr("asserter");
        unauthorized = makeAddr("unauthorized");

        ctf = new ConditionalTokens();
        usdc = new MockERC20("USDC", "USDC", 6);
        mockOov3 = new MockOptimisticOracleV3();
        factory = new MarketFactory(address(ctf), address(usdc));
        adapter = new UmaCtfAdapter(address(mockOov3), address(factory), address(usdc));

        // Grant RESOLVER_ROLE to adapter on factory
        factory.grantRole(factory.RESOLVER_ROLE(), address(adapter));

        // Create and activate a binary market
        marketId = factory.createMarket(
            keccak256("q1"),
            "Will BTC hit 100k?",
            2,
            block.timestamp + 7 days,
            bytes("q: Will BTC hit 100k by end of 2026?"),
            1000e6
        );
        factory.activateMarket(marketId);

        // Mint USDC to asserter and approve adapter
        usdc.mint(asserter, 10000e6);
        vm.prank(asserter);
        usdc.approve(address(adapter), type(uint256).max);

        // Also mint to mock OOV3 (it may need to return bonds)
        usdc.mint(address(mockOov3), 10000e6);
    }

    function _registerDefaultMarket() internal {
        adapter.registerMarket(marketId, 0, BOND, LIVENESS);
    }

    function _assertDefaultOutcome() internal returns (bytes32 assertionId) {
        _registerDefaultMarket();
        vm.prank(asserter);
        adapter.assertOutcome(marketId, 0);
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertionId = data.activeAssertionId;
    }

    // ──────────────────── Constructor (4) ────────────────────

    function test_constructor_setsOov3() public view {
        assertEq(address(adapter.oov3()), address(mockOov3));
    }

    function test_constructor_setsFactory() public view {
        assertEq(address(adapter.factory()), address(factory));
    }

    function test_constructor_setsUsdc() public view {
        assertEq(address(adapter.usdc()), address(usdc));
    }

    function test_constructor_grantsAdminRole() public view {
        assertTrue(adapter.hasRole(adapter.DEFAULT_ADMIN_ROLE(), admin));
    }

    // ──────────────────── registerMarket (5) ────────────────────

    function test_registerMarket_success() public {
        _registerDefaultMarket();
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertTrue(data.registered);
        assertEq(data.bond, BOND);
        assertEq(data.liveness, LIVENESS);
    }

    function test_registerMarket_emitsMarketRegistered() public {
        vm.expectEmit(true, false, false, true);
        emit UmaCtfAdapter.MarketRegistered(marketId, BOND, LIVENESS);
        adapter.registerMarket(marketId, 0, BOND, LIVENESS);
    }

    function test_registerMarket_revertsAlreadyRegistered() public {
        _registerDefaultMarket();
        vm.expectRevert(abi.encodeWithSelector(UmaCtfAdapter.MarketAlreadyRegistered.selector, marketId));
        adapter.registerMarket(marketId, 0, BOND, LIVENESS);
    }

    function test_registerMarket_revertsUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        adapter.registerMarket(marketId, 0, BOND, LIVENESS);
    }

    function test_registerMarket_revertsBondBelowMinimum() public {
        vm.expectRevert("Bond below minimum");
        adapter.registerMarket(marketId, 0, 100e6, LIVENESS);
    }

    // ──────────────────── assertOutcome (8) ────────────────────

    function test_assertOutcome_success() public {
        _registerDefaultMarket();
        vm.prank(asserter);
        adapter.assertOutcome(marketId, 0);
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertTrue(data.activeAssertionId != bytes32(0));
    }

    function test_assertOutcome_emitsOutcomeAsserted() public {
        _registerDefaultMarket();
        vm.prank(asserter);
        // We don't know the assertionId ahead of time, so just check indexed fields
        vm.expectEmit(true, false, true, false);
        emit UmaCtfAdapter.OutcomeAsserted(marketId, bytes32(0), 0, asserter);
        adapter.assertOutcome(marketId, 0);
    }

    function test_assertOutcome_transfersBond() public {
        _registerDefaultMarket();
        uint256 balBefore = usdc.balanceOf(asserter);
        vm.prank(asserter);
        adapter.assertOutcome(marketId, 0);
        uint256 balAfter = usdc.balanceOf(asserter);
        assertEq(balBefore - balAfter, BOND);
    }

    function test_assertOutcome_revertsNotRegistered() public {
        bytes32 fakeId = keccak256("fake");
        vm.prank(asserter);
        vm.expectRevert(abi.encodeWithSelector(UmaCtfAdapter.MarketNotRegistered.selector, fakeId));
        adapter.assertOutcome(fakeId, 0);
    }

    function test_assertOutcome_revertsAlreadyResolved() public {
        bytes32 assertionId = _assertDefaultOutcome();
        // Resolve via mockSettle(truthful)
        mockOov3.mockSettle(assertionId, true);
        // Now try to assert again
        vm.prank(asserter);
        vm.expectRevert(abi.encodeWithSelector(UmaCtfAdapter.MarketAlreadyResolved.selector, marketId));
        adapter.assertOutcome(marketId, 0);
    }

    function test_assertOutcome_revertsActiveAssertion() public {
        _registerDefaultMarket();
        vm.prank(asserter);
        adapter.assertOutcome(marketId, 0);
        // Try again while assertion is active
        vm.prank(asserter);
        vm.expectRevert(abi.encodeWithSelector(UmaCtfAdapter.AssertionAlreadyActive.selector, marketId));
        adapter.assertOutcome(marketId, 0);
    }

    function test_assertOutcome_revertsInvalidOutcome() public {
        _registerDefaultMarket();
        vm.prank(asserter);
        vm.expectRevert(abi.encodeWithSelector(UmaCtfAdapter.InvalidOutcome.selector, 2, 2));
        adapter.assertOutcome(marketId, 2);
    }

    function test_assertOutcome_revertsNotWhitelisted() public {
        _registerDefaultMarket();
        adapter.setProposerWhitelistEnabled(true);
        // asserter is not whitelisted
        vm.prank(asserter);
        vm.expectRevert(abi.encodeWithSelector(UmaCtfAdapter.NotWhitelisted.selector, asserter));
        adapter.assertOutcome(marketId, 0);
    }

    // ──────────────────── settle (2) ────────────────────

    function test_settle_callsOov3() public {
        bytes32 assertionId = _assertDefaultOutcome();
        // settle should not revert — it calls mockOov3.settleAssertion which triggers resolved callback
        adapter.settle(marketId);
        // After settle, market should be resolved
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertTrue(data.resolved);
    }

    function test_settle_revertsNoActiveAssertion() public {
        _registerDefaultMarket();
        vm.expectRevert(abi.encodeWithSelector(UmaCtfAdapter.NoActiveAssertion.selector, marketId));
        adapter.settle(marketId);
    }

    // ──────────────────── Callbacks — Resolved (6) ────────────────────

    function test_resolvedCallback_truthful_resolvesMarket() public {
        bytes32 assertionId = _assertDefaultOutcome();
        mockOov3.mockSettle(assertionId, true);
        MarketFactory.Market memory market = factory.getMarket(marketId);
        assertEq(uint256(market.status), uint256(MarketFactory.MarketStatus.Resolved));
    }

    function test_resolvedCallback_truthful_reportsPayouts() public {
        bytes32 assertionId = _assertDefaultOutcome();
        mockOov3.mockSettle(assertionId, true);
        // Get conditionId from market and check payoutDenominator > 0
        MarketFactory.Market memory market = factory.getMarket(marketId);
        uint256 den = ctf.payoutDenominator(market.conditionId);
        assertGt(den, 0);
    }

    function test_resolvedCallback_truthful_emitsSettled() public {
        bytes32 assertionId = _assertDefaultOutcome();
        vm.expectEmit(true, true, false, true);
        emit UmaCtfAdapter.AssertionSettled(marketId, assertionId, 0);
        mockOov3.mockSettle(assertionId, true);
    }

    function test_resolvedCallback_untruthful_resetsMarket() public {
        bytes32 assertionId = _assertDefaultOutcome();
        vm.expectEmit(true, false, false, false);
        emit UmaCtfAdapter.MarketReset(marketId);
        mockOov3.mockSettle(assertionId, false);
        // activeAssertionId should be cleared
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertEq(data.activeAssertionId, bytes32(0));
        assertFalse(data.resolved);
    }

    function test_resolvedCallback_revertsNotOov3() public {
        bytes32 assertionId = _assertDefaultOutcome();
        vm.expectRevert(UmaCtfAdapter.OnlyOOV3.selector);
        adapter.assertionResolvedCallback(assertionId, true);
    }

    function test_resolvedCallback_revertsUnknownAssertion() public {
        bytes32 randomId = keccak256("random");
        vm.prank(address(mockOov3));
        vm.expectRevert(abi.encodeWithSelector(UmaCtfAdapter.UnknownAssertion.selector, randomId));
        adapter.assertionResolvedCallback(randomId, true);
    }

    // ──────────────────── Callbacks — Disputed (3) ────────────────────

    function test_disputedCallback_incrementsCount() public {
        bytes32 assertionId = _assertDefaultOutcome();
        mockOov3.mockDispute(assertionId);
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertEq(data.disputeCount, 1);
    }

    function test_disputedCallback_emitsDisputed() public {
        bytes32 assertionId = _assertDefaultOutcome();
        vm.expectEmit(true, true, false, true);
        emit UmaCtfAdapter.AssertionDisputed(marketId, assertionId, 1);
        mockOov3.mockDispute(assertionId);
    }

    function test_disputedCallback_clearsActiveAssertion() public {
        bytes32 assertionId = _assertDefaultOutcome();
        mockOov3.mockDispute(assertionId);
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertEq(data.activeAssertionId, bytes32(0));
    }

    // ──────────────────── Whitelist (4) ────────────────────

    function test_setProposerWhitelist_success() public {
        adapter.setProposerWhitelist(asserter, true);
        assertTrue(adapter.whitelistedProposers(asserter));
    }

    function test_setProposerWhitelistEnabled_success() public {
        adapter.setProposerWhitelistEnabled(true);
        assertTrue(adapter.proposerWhitelistEnabled());
    }

    function test_assertOutcome_respectsWhitelist() public {
        _registerDefaultMarket();
        adapter.setProposerWhitelistEnabled(true);
        adapter.setProposerWhitelist(asserter, true);
        vm.prank(asserter);
        adapter.assertOutcome(marketId, 0);
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertTrue(data.activeAssertionId != bytes32(0));
    }

    function test_assertOutcome_allowsWhenWhitelistDisabled() public {
        _registerDefaultMarket();
        adapter.setProposerWhitelistEnabled(false);
        // Any address with USDC can assert
        address anyone = makeAddr("anyone");
        usdc.mint(anyone, 10000e6);
        vm.prank(anyone);
        usdc.approve(address(adapter), type(uint256).max);
        vm.prank(anyone);
        adapter.assertOutcome(marketId, 0);
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertTrue(data.activeAssertionId != bytes32(0));
    }

    // ──────────────────── Pause (3) ────────────────────

    function test_pause_blocksAssertOutcome() public {
        _registerDefaultMarket();
        adapter.pause();
        vm.prank(asserter);
        vm.expectRevert();
        adapter.assertOutcome(marketId, 0);
    }

    function test_unpause_allowsAssertOutcome() public {
        _registerDefaultMarket();
        adapter.pause();
        adapter.unpause();
        vm.prank(asserter);
        adapter.assertOutcome(marketId, 0);
        UmaCtfAdapter.MarketData memory data = adapter.getMarketData(marketId);
        assertTrue(data.activeAssertionId != bytes32(0));
    }
}
