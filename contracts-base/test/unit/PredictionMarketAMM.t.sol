// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, Vm} from "forge-std/Test.sol";
import {ConditionalTokens} from "../../src/ConditionalTokens.sol";
import {MarketFactory} from "../../src/MarketFactory.sol";
import {PredictionMarketAMM} from "../../src/PredictionMarketAMM.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

contract PredictionMarketAMMTest is Test, IERC1155Receiver {
    ConditionalTokens public ctf;
    MockERC20 public usdc;
    MarketFactory public factory;
    PredictionMarketAMM public amm;

    address public owner;
    address public trader;
    address public lp;

    bytes32 public marketId;
    uint256 constant INIT_LIQUIDITY = 100e6; // 100 USDC
    uint256 constant TRADE_AMOUNT = 10e6;   // 10 USDC

    function setUp() public {
        owner = address(this);
        trader = makeAddr("trader");
        lp = makeAddr("lp");

        ctf = new ConditionalTokens();
        usdc = new MockERC20("USDC", "USDC", 6);
        factory = new MarketFactory(address(ctf), address(usdc));
        amm = new PredictionMarketAMM(address(ctf), address(factory), address(usdc));

        // Create and activate a binary market
        marketId = factory.createMarket(
            keccak256("q1"),
            "Will BTC hit 100k?",
            2,
            block.timestamp + 7 days,
            "",
            INIT_LIQUIDITY
        );
        factory.activateMarket(marketId);

        // Mint USDC to test accounts
        usdc.mint(owner, 10000e6);
        usdc.mint(trader, 10000e6);
        usdc.mint(lp, 10000e6);

        // Approve AMM to spend USDC
        usdc.approve(address(amm), type(uint256).max);
        vm.prank(trader);
        usdc.approve(address(amm), type(uint256).max);
        vm.prank(lp);
        usdc.approve(address(amm), type(uint256).max);

        // IMPORTANT: Also approve CTF to spend USDC (for splitPosition)
        // and approve AMM on CTF (for safeTransferFrom of ERC1155 tokens)
        usdc.approve(address(ctf), type(uint256).max);
        vm.prank(trader);
        usdc.approve(address(ctf), type(uint256).max);

        // Set approvals for ERC1155 on CTF so AMM can transfer tokens
        ctf.setApprovalForAll(address(amm), true);
        vm.prank(trader);
        ctf.setApprovalForAll(address(amm), true);
        vm.prank(lp);
        ctf.setApprovalForAll(address(amm), true);
    }

    function _initDefaultPool() internal {
        amm.initializePool(marketId, INIT_LIQUIDITY);
    }

    // ERC1155Receiver implementation so test contract can receive outcome tokens
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }

    // ──────────────────── Constructor Tests ────────────────────

    function test_constructor_setsConditionalTokens() public view {
        assertEq(address(amm.conditionalTokens()), address(ctf));
    }

    function test_constructor_setsMarketFactory() public view {
        assertEq(address(amm.marketFactory()), address(factory));
    }

    function test_constructor_setsUsdc() public view {
        assertEq(address(amm.usdc()), address(usdc));
    }

    // ──────────────────── initializePool Tests ────────────────────

    function test_initializePool_success() public {
        _initDefaultPool();

        PredictionMarketAMM.Pool memory pool = amm.getPool(marketId);
        assertTrue(pool.initialized);
        assertEq(pool.outcomeCount, 2);
        assertEq(pool.totalLpShares, INIT_LIQUIDITY);

        // Reserves should be equal for both outcomes
        uint256[] memory res = amm.getReserves(marketId);
        assertEq(res[0], res[1]);
        assertEq(res[0], INIT_LIQUIDITY);

        // LP shares assigned to the provider
        assertEq(amm.lpShares(marketId, owner), INIT_LIQUIDITY);
    }

    function test_initializePool_emitsPoolInitialized() public {
        vm.expectEmit(true, true, false, true);
        emit PredictionMarketAMM.PoolInitialized(marketId, INIT_LIQUIDITY, owner);
        amm.initializePool(marketId, INIT_LIQUIDITY);
    }

    function test_initializePool_revertsMinLiquidity() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarketAMM.InsufficientLiquidity.selector,
                0,
                amm.MIN_LIQUIDITY()
            )
        );
        amm.initializePool(marketId, 0);
    }

    function test_initializePool_revertsAlreadyInitialized() public {
        _initDefaultPool();

        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarketAMM.PoolAlreadyInitialized.selector,
                marketId
            )
        );
        amm.initializePool(marketId, INIT_LIQUIDITY);
    }

    // ──────────────────── Buy Tests ────────────────────

    function test_buy_success() public {
        _initDefaultPool();

        uint256 usdcBefore = usdc.balanceOf(owner);
        uint256 tokensOut = amm.buy(marketId, 0, TRADE_AMOUNT, 0);

        assertGt(tokensOut, 0);
        assertEq(usdc.balanceOf(owner), usdcBefore - TRADE_AMOUNT);
    }

    function test_buy_emitsTrade() public {
        _initDefaultPool();

        vm.recordLogs();
        amm.buy(marketId, 0, TRADE_AMOUNT, 0);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        // Find the Trade event among emitted events
        bytes32 tradeSelector = keccak256("Trade(bytes32,address,uint256,bool,uint256,uint256,uint256,uint256[])");
        bool found = false;
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == tradeSelector) {
                assertEq(entries[i].topics[1], bytes32(marketId));
                found = true;
                break;
            }
        }
        assertTrue(found, "Trade event not emitted");
    }

    function test_buy_revertsZeroAmount() public {
        _initDefaultPool();

        vm.expectRevert(PredictionMarketAMM.ZeroAmount.selector);
        amm.buy(marketId, 0, 0, 0);
    }

    function test_buy_revertsInvalidOutcomeIndex() public {
        _initDefaultPool();

        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarketAMM.InvalidOutcomeIndex.selector,
                2,
                1
            )
        );
        amm.buy(marketId, 2, TRADE_AMOUNT, 0);
    }

    function test_buy_revertsSlippage() public {
        _initDefaultPool();

        // minTokensOut set impossibly high so slippage check fails
        vm.expectRevert();
        amm.buy(marketId, 0, TRADE_AMOUNT, type(uint256).max);
    }

    function test_sell_success() public {
        _initDefaultPool();

        uint256 tokensOut = amm.buy(marketId, 0, TRADE_AMOUNT, 0);

        uint256 usdcBefore = usdc.balanceOf(owner);
        uint256 usdcOut = amm.sell(marketId, 0, tokensOut, 0);

        assertGt(usdcOut, 0);
        assertGt(usdc.balanceOf(owner), usdcBefore);
    }

    function test_sell_emitsTrade() public {
        _initDefaultPool();

        uint256 tokensOut = amm.buy(marketId, 0, TRADE_AMOUNT, 0);

        vm.recordLogs();
        amm.sell(marketId, 0, tokensOut, 0);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 tradeSelector = keccak256("Trade(bytes32,address,uint256,bool,uint256,uint256,uint256,uint256[])");
        bool found = false;
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == tradeSelector) {
                found = true;
                break;
            }
        }
        assertTrue(found, "Trade event not emitted");
    }

    function test_sell_revertsZeroAmount() public {
        _initDefaultPool();

        vm.expectRevert(PredictionMarketAMM.ZeroAmount.selector);
        amm.sell(marketId, 0, 0, 0);
    }

    function test_sell_revertsSlippage() public {
        _initDefaultPool();

        uint256 tokensOut = amm.buy(marketId, 0, TRADE_AMOUNT, 0);

        vm.expectRevert();
        amm.sell(marketId, 0, tokensOut, type(uint256).max);
    }

    // ──────────────────── Liquidity Tests ────────────────────

    function test_addLiquidity_success() public {
        _initDefaultPool();

        uint256 addAmount = 50e6;
        vm.prank(lp);
        usdc.approve(address(amm), type(uint256).max);

        vm.prank(lp);
        uint256 shares = amm.addLiquidity(marketId, addAmount);

        assertGt(shares, 0);
        assertEq(amm.lpShares(marketId, lp), shares);
    }

    function test_addLiquidity_emitsLiquidityAdded() public {
        _initDefaultPool();

        uint256 addAmount = 50e6;

        vm.recordLogs();
        vm.prank(lp);
        amm.addLiquidity(marketId, addAmount);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 selector = keccak256("LiquidityAdded(bytes32,address,uint256,uint256)");
        bool found = false;
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == selector) {
                found = true;
                break;
            }
        }
        assertTrue(found, "LiquidityAdded event not emitted");
    }

    function test_removeLiquidity_success() public {
        _initDefaultPool();

        uint256 sharesToBurn = INIT_LIQUIDITY / 2;
        uint256 usdcBefore = usdc.balanceOf(owner);

        uint256 usdcOut = amm.removeLiquidity(marketId, sharesToBurn);

        assertGt(usdcOut, 0);
        assertGt(usdc.balanceOf(owner), usdcBefore);
        assertEq(amm.lpShares(marketId, owner), INIT_LIQUIDITY - sharesToBurn);
    }

    function test_removeLiquidity_revertsInsufficientShares() public {
        _initDefaultPool();

        uint256 tooMany = INIT_LIQUIDITY + 1;
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarketAMM.InsufficientShares.selector,
                tooMany,
                INIT_LIQUIDITY
            )
        );
        amm.removeLiquidity(marketId, tooMany);
    }

    function test_removeLiquidity_emitsLiquidityRemoved() public {
        _initDefaultPool();

        uint256 sharesToBurn = INIT_LIQUIDITY / 2;

        vm.recordLogs();
        amm.removeLiquidity(marketId, sharesToBurn);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 selector = keccak256("LiquidityRemoved(bytes32,address,uint256,uint256)");
        bool found = false;
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == selector) {
                found = true;
                break;
            }
        }
        assertTrue(found, "LiquidityRemoved event not emitted");
    }

    // ──────────────────── Pricing Tests ────────────────────

    function test_getPrices_initialEqual() public {
        _initDefaultPool();

        uint256[] memory prices = amm.getPrices(marketId);
        assertEq(prices.length, 2);

        // Both prices should be ~0.5e18 (equal reserves)
        uint256 tolerance = 1e15; // 0.1% tolerance
        assertApproxEqAbs(prices[0], 0.5e18, tolerance);
        assertApproxEqAbs(prices[1], 0.5e18, tolerance);
    }

    function test_getPrices_afterBuy() public {
        _initDefaultPool();

        // Buy outcome 0 — its price should increase
        amm.buy(marketId, 0, TRADE_AMOUNT, 0);

        uint256[] memory prices = amm.getPrices(marketId);
        assertGt(prices[0], prices[1], "Price of bought outcome should be higher");
    }

    // ──────────────────── Admin & Freeze Tests ────────────────────

    function test_freezePool_blocksTrading() public {
        _initDefaultPool();

        amm.freezePool(marketId);

        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarketAMM.PoolFrozen.selector,
                marketId
            )
        );
        amm.buy(marketId, 0, TRADE_AMOUNT, 0);
    }

    function test_withdrawProtocolFees_success() public {
        _initDefaultPool();

        // Execute a trade to generate fees
        amm.buy(marketId, 0, TRADE_AMOUNT, 0);

        uint256 fees = amm.protocolFees();
        assertGt(fees, 0, "Protocol fees should be > 0 after a trade");

        uint256 usdcBefore = usdc.balanceOf(owner);
        amm.withdrawProtocolFees();

        assertEq(usdc.balanceOf(owner), usdcBefore + fees);
        assertEq(amm.protocolFees(), 0);
    }

    function test_freezePool_revertsNonOwner() public {
        _initDefaultPool();

        vm.prank(trader);
        vm.expectRevert();
        amm.freezePool(marketId);
    }
}
