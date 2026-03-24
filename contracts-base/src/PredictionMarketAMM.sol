// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {SD59x18, sd, intoInt256, exp, ln, convert} from "@prb/math/SD59x18.sol";
import {IConditionalTokens} from "./interfaces/IConditionalTokens.sol";
import {IMarketFactory} from "./interfaces/IMarketFactory.sol";

contract PredictionMarketAMM is Ownable, ReentrancyGuard, IERC1155Receiver {
    using SafeERC20 for IERC20;

    // ──────────────────── Errors ────────────────────
    error InsufficientLiquidity(uint256 amount, uint256 minimum);
    error InsufficientOutput(uint256 actual, uint256 minimum);
    error InsufficientShares(uint256 requested, uint256 available);
    error InvalidOutcomeIndex(uint256 provided, uint256 max);
    error MarketNotActive(bytes32 marketId);
    error NotOwner();
    error PoolAlreadyInitialized(bytes32 marketId);
    error PoolFrozen(bytes32 marketId);
    error PoolNotInitialized(bytes32 marketId);
    error ZeroAmount();

    // ──────────────────── Events ────────────────────
    event Trade(
        bytes32 indexed marketId,
        address indexed trader,
        uint256 outcomeIndex,
        bool isBuy,
        uint256 usdcAmount,
        uint256 tokenAmount,
        uint256 feeAmount,
        uint256[] newPrices
    );

    event PoolInitialized(
        bytes32 indexed marketId,
        uint256 initialLiquidity,
        address indexed provider
    );

    event LiquidityAdded(
        bytes32 indexed marketId,
        address indexed provider,
        uint256 usdcAmount,
        uint256 shares
    );

    event LiquidityRemoved(
        bytes32 indexed marketId,
        address indexed provider,
        uint256 usdcAmount,
        uint256 shares
    );

    // ──────────────────── Structs ────────────────────
    struct Pool {
        bytes32 conditionId;
        uint256 outcomeCount;
        uint256 totalLpShares;
        uint256 feeBps;
        uint256 lmsrB;
        bool initialized;
        bool frozen;
    }

    // ──────────────────── Constants ────────────────────
    uint256 public constant BPS = 10_000;
    uint256 public constant DEFAULT_FEE_BPS = 200;
    uint256 public constant MAX_FEE_BPS = 1000;
    uint256 public constant LP_FEE_SHARE = 8400;
    uint256 public constant PROTOCOL_FEE_SHARE = 1200;
    uint256 public constant BUYBACK_FEE_SHARE = 400;
    uint256 public constant MIN_LIQUIDITY = 1e6;
    uint256 public constant PRECISION = 1e18;

    // ──────────────────── State ────────────────────
    IConditionalTokens public conditionalTokens;
    IMarketFactory public marketFactory;
    IERC20 public usdc;

    mapping(bytes32 => Pool) internal _pools;
    mapping(bytes32 => mapping(uint256 => uint256)) public reserves;
    mapping(bytes32 => mapping(address => uint256)) public lpShares;

    uint256 public protocolFees;
    uint256 public buybackFees;

    // ──────────────────── Constructor ────────────────────
    constructor(
        address _conditionalTokens,
        address _marketFactory,
        address _usdc
    ) Ownable(msg.sender) {
        conditionalTokens = IConditionalTokens(_conditionalTokens);
        marketFactory = IMarketFactory(_marketFactory);
        usdc = IERC20(_usdc);

        // Approve the conditional tokens contract to spend USDC for splitting
        usdc.approve(_conditionalTokens, type(uint256).max);
    }

    // ──────────────────── Pool Initialization ────────────────────
    function initializePool(bytes32 marketId, uint256 usdcAmount) external nonReentrant {
        if (!marketFactory.marketExists(marketId)) revert MarketNotActive(marketId);
        if (!marketFactory.isMarketActive(marketId)) revert MarketNotActive(marketId);

        Pool storage pool = _pools[marketId];
        if (pool.initialized) revert PoolAlreadyInitialized(marketId);
        if (usdcAmount < MIN_LIQUIDITY) revert InsufficientLiquidity(usdcAmount, MIN_LIQUIDITY);

        IMarketFactory.Market memory market = marketFactory.getMarket(marketId);
        bytes32 conditionId = market.conditionId;
        uint256 outcomeCount = market.outcomeCount;

        // Transfer USDC from user
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // Split position to get outcome tokens
        uint256[] memory partition = _getPartition(outcomeCount);
        conditionalTokens.splitPosition(usdc, bytes32(0), conditionId, partition, usdcAmount);

        // Set equal reserves for all outcomes
        uint256 reservePerOutcome = usdcAmount;
        for (uint256 i = 0; i < outcomeCount; i++) {
            reserves[marketId][i] = reservePerOutcome;
        }

        // Initialize pool
        pool.conditionId = conditionId;
        pool.outcomeCount = outcomeCount;
        pool.feeBps = DEFAULT_FEE_BPS;
        pool.initialized = true;
        pool.frozen = false;
        pool.totalLpShares = usdcAmount;

        // Set LMSR B parameter for multi-outcome markets
        if (outcomeCount > 2) {
            pool.lmsrB = usdcAmount / 2;
        }

        // Mint LP shares to provider
        lpShares[marketId][msg.sender] = usdcAmount;

        emit PoolInitialized(marketId, usdcAmount, msg.sender);
    }

    // ──────────────────── Buy ────────────────────
    function buy(
        bytes32 marketId,
        uint256 outcomeIndex,
        uint256 usdcAmount,
        uint256 minTokensOut
    ) external nonReentrant returns (uint256 tokensOut) {
        Pool storage pool = _pools[marketId];
        _validateTrade(pool, marketId, outcomeIndex);
        if (usdcAmount == 0) revert ZeroAmount();

        // Calculate and distribute fee
        uint256 feeAmount = (usdcAmount * pool.feeBps) / BPS;
        uint256 netAmount = usdcAmount - feeAmount;
        _distributeFee(marketId, feeAmount);

        // Transfer USDC from user
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // Split position to get outcome tokens
        uint256[] memory partition = _getPartition(pool.outcomeCount);
        conditionalTokens.splitPosition(usdc, bytes32(0), pool.conditionId, partition, netAmount);

        // Calculate tokens out
        if (pool.outcomeCount == 2) {
            tokensOut = _cpmmBuy(marketId, outcomeIndex, netAmount, pool.outcomeCount);
        } else {
            tokensOut = _lmsrBuy(marketId, outcomeIndex, netAmount, pool);
        }

        // Check slippage
        if (tokensOut < minTokensOut) revert InsufficientOutput(tokensOut, minTokensOut);

        // Transfer outcome tokens to user
        uint256 positionId = _getPositionId(pool.conditionId, outcomeIndex);
        conditionalTokens.safeTransferFrom(address(this), msg.sender, positionId, tokensOut, "");

        // Get new prices
        uint256[] memory newPrices = _getPrices(marketId, pool);

        emit Trade(marketId, msg.sender, outcomeIndex, true, usdcAmount, tokensOut, feeAmount, newPrices);
    }

    // ──────────────────── Sell ────────────────────
    function sell(
        bytes32 marketId,
        uint256 outcomeIndex,
        uint256 tokenAmount,
        uint256 minUsdcOut
    ) external nonReentrant returns (uint256 usdcOut) {
        Pool storage pool = _pools[marketId];
        _validateTrade(pool, marketId, outcomeIndex);
        if (tokenAmount == 0) revert ZeroAmount();

        // Transfer outcome tokens from user
        uint256 positionId = _getPositionId(pool.conditionId, outcomeIndex);
        conditionalTokens.safeTransferFrom(msg.sender, address(this), positionId, tokenAmount, "");

        // Calculate USDC out (before fee)
        uint256 grossUsdcOut;
        if (pool.outcomeCount == 2) {
            grossUsdcOut = _cpmmSell(marketId, outcomeIndex, tokenAmount, pool.outcomeCount);
        } else {
            grossUsdcOut = _lmsrSell(marketId, outcomeIndex, tokenAmount, pool);
        }

        // Calculate and distribute fee
        uint256 feeAmount = (grossUsdcOut * pool.feeBps) / BPS;
        usdcOut = grossUsdcOut - feeAmount;
        _distributeFee(marketId, feeAmount);

        // Check slippage
        if (usdcOut < minUsdcOut) revert InsufficientOutput(usdcOut, minUsdcOut);

        // Merge positions to recover collateral
        uint256 mergeAmount = _getMinReserve(marketId, pool.outcomeCount);
        if (mergeAmount > 0) {
            uint256[] memory partition = _getPartition(pool.outcomeCount);
            conditionalTokens.mergePositions(usdc, bytes32(0), pool.conditionId, partition, mergeAmount);
            // Reduce all reserves by the merged amount
            for (uint256 i = 0; i < pool.outcomeCount; i++) {
                reserves[marketId][i] -= mergeAmount;
            }
        }

        // Transfer USDC to user
        usdc.safeTransfer(msg.sender, usdcOut);

        // Get new prices
        uint256[] memory newPrices = _getPrices(marketId, pool);

        emit Trade(marketId, msg.sender, outcomeIndex, false, usdcOut, tokenAmount, feeAmount, newPrices);
    }

    // ──────────────────── Add Liquidity ────────────────────
    function addLiquidity(bytes32 marketId, uint256 usdcAmount)
        external
        nonReentrant
        returns (uint256 shares)
    {
        Pool storage pool = _pools[marketId];
        if (!pool.initialized) revert PoolNotInitialized(marketId);
        if (pool.frozen) revert PoolFrozen(marketId);
        if (usdcAmount == 0) revert ZeroAmount();

        // Calculate shares proportional to existing LP shares
        // Find the maximum reserve to use as the reference
        uint256 maxReserve = 0;
        for (uint256 i = 0; i < pool.outcomeCount; i++) {
            if (reserves[marketId][i] > maxReserve) {
                maxReserve = reserves[marketId][i];
            }
        }

        shares = (usdcAmount * pool.totalLpShares) / maxReserve;

        // Transfer USDC from user
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // Split position to get outcome tokens
        uint256[] memory partition = _getPartition(pool.outcomeCount);
        conditionalTokens.splitPosition(usdc, bytes32(0), pool.conditionId, partition, usdcAmount);

        // Add to reserves proportionally
        for (uint256 i = 0; i < pool.outcomeCount; i++) {
            uint256 addAmount = (reserves[marketId][i] * usdcAmount) / maxReserve;
            reserves[marketId][i] += addAmount;
        }

        // Update LMSR B parameter for multi-outcome markets
        if (pool.outcomeCount > 2 && pool.lmsrB > 0) {
            pool.lmsrB = pool.lmsrB + (pool.lmsrB * usdcAmount) / maxReserve;
        }

        // Mint LP shares
        pool.totalLpShares += shares;
        lpShares[marketId][msg.sender] += shares;

        emit LiquidityAdded(marketId, msg.sender, usdcAmount, shares);
    }

    // ──────────────────── Remove Liquidity ────────────────────
    function removeLiquidity(bytes32 marketId, uint256 sharesToBurn)
        external
        nonReentrant
        returns (uint256 usdcOut)
    {
        Pool storage pool = _pools[marketId];
        if (!pool.initialized) revert PoolNotInitialized(marketId);
        if (sharesToBurn == 0) revert ZeroAmount();

        uint256 userShares = lpShares[marketId][msg.sender];
        if (sharesToBurn > userShares) revert InsufficientShares(sharesToBurn, userShares);

        // Calculate proportional share of reserves
        uint256 shareRatio = (sharesToBurn * PRECISION) / pool.totalLpShares;

        // Find minimum proportional reserve (this is how much we can merge)
        uint256 minProportionalReserve = type(uint256).max;
        for (uint256 i = 0; i < pool.outcomeCount; i++) {
            uint256 proportional = (reserves[marketId][i] * shareRatio) / PRECISION;
            if (proportional < minProportionalReserve) {
                minProportionalReserve = proportional;
            }
        }

        usdcOut = minProportionalReserve;

        // Reduce reserves
        for (uint256 i = 0; i < pool.outcomeCount; i++) {
            uint256 reduction = (reserves[marketId][i] * shareRatio) / PRECISION;
            reserves[marketId][i] -= reduction;
        }

        // Burn LP shares
        lpShares[marketId][msg.sender] -= sharesToBurn;
        pool.totalLpShares -= sharesToBurn;

        // Update LMSR B parameter
        if (pool.outcomeCount > 2 && pool.lmsrB > 0) {
            pool.lmsrB -= (pool.lmsrB * shareRatio) / PRECISION;
        }

        // Merge positions to recover collateral
        if (usdcOut > 0) {
            uint256[] memory partition = _getPartition(pool.outcomeCount);
            conditionalTokens.mergePositions(usdc, bytes32(0), pool.conditionId, partition, usdcOut);
            usdc.safeTransfer(msg.sender, usdcOut);
        }

        emit LiquidityRemoved(marketId, msg.sender, usdcOut, sharesToBurn);
    }

    // ──────────────────── View Functions ────────────────────
    function getPrices(bytes32 marketId) external view returns (uint256[] memory) {
        Pool storage pool = _pools[marketId];
        return _getPrices(marketId, pool);
    }

    function getPool(bytes32 marketId) external view returns (Pool memory) {
        return _pools[marketId];
    }

    function getReserves(bytes32 marketId) external view returns (uint256[] memory result) {
        Pool storage pool = _pools[marketId];
        result = new uint256[](pool.outcomeCount);
        for (uint256 i = 0; i < pool.outcomeCount; i++) {
            result[i] = reserves[marketId][i];
        }
    }

    // ──────────────────── Admin Functions ────────────────────
    function freezePool(bytes32 marketId) external onlyOwner {
        Pool storage pool = _pools[marketId];
        if (!pool.initialized) revert PoolNotInitialized(marketId);
        pool.frozen = true;
    }

    function withdrawProtocolFees() external onlyOwner {
        uint256 amount = protocolFees;
        protocolFees = 0;
        usdc.safeTransfer(msg.sender, amount);
    }

    // ──────────────────── ERC1155 Receiver ────────────────────
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId
            || interfaceId == 0x01ffc9a7; // IERC165
    }

    // ──────────────────── Internal: Validation ────────────────────
    function _validateTrade(Pool storage pool, bytes32 marketId, uint256 outcomeIndex) internal view {
        if (!pool.initialized) revert PoolNotInitialized(marketId);
        if (pool.frozen) revert PoolFrozen(marketId);
        if (!marketFactory.isMarketActive(marketId)) revert MarketNotActive(marketId);
        if (outcomeIndex >= pool.outcomeCount) revert InvalidOutcomeIndex(outcomeIndex, pool.outcomeCount - 1);
    }

    // ──────────────────── Internal: Fee Distribution ────────────────────
    function _distributeFee(bytes32 marketId, uint256 feeAmount) internal {
        uint256 lpFee = (feeAmount * LP_FEE_SHARE) / BPS;
        uint256 protocolFee = (feeAmount * PROTOCOL_FEE_SHARE) / BPS;
        uint256 buybackFee = feeAmount - lpFee - protocolFee;

        // LP fees go into the pool reserves (distributed proportionally)
        Pool storage pool = _pools[marketId];
        if (lpFee > 0 && pool.outcomeCount > 0) {
            uint256 feePerOutcome = lpFee / pool.outcomeCount;
            for (uint256 i = 0; i < pool.outcomeCount; i++) {
                reserves[marketId][i] += feePerOutcome;
            }
        }

        protocolFees += protocolFee;
        buybackFees += buybackFee;
    }

    // ──────────────────── Internal: CPMM (Binary Markets) ────────────────────
    function _cpmmBuy(
        bytes32 marketId,
        uint256 outcomeIndex,
        uint256 netAmount,
        uint256 outcomeCount
    ) internal returns (uint256 tokensOut) {
        // After splitting, we have netAmount of each outcome token added to reserves
        // Add netAmount to all reserves first
        for (uint256 i = 0; i < outcomeCount; i++) {
            reserves[marketId][i] += netAmount;
        }

        // Use constant product: reserve_i * reserve_j = k (for binary)
        // User buys outcome_i: remove tokens from reserve_i
        // k = old_reserve_0 * old_reserve_1 (after adding netAmount to both)
        uint256 reserveI = reserves[marketId][outcomeIndex];
        uint256 otherIndex = outcomeIndex == 0 ? 1 : 0;
        uint256 reserveJ = reserves[marketId][otherIndex];

        uint256 k = reserveI * reserveJ;
        // New reserveI after removing tokensOut: k / reserveJ stays same
        // But we solve: (reserveI - tokensOut) * reserveJ = old_reserveI_before * old_reserveJ_before
        // where old values are before netAmount was added to outcome i
        // Actually for CPMM:
        // Before adding: r0, r1
        // We add netAmount to both: r0+n, r1+n
        // k_new = (r0+n) * (r1+n) but we want to remove from outcome i
        // tokensOut = reserveI - k_before / reserveJ_after
        // For a standard AMM buy: we add to the other side, remove from this side
        // Reset: undo the add to outcomeIndex
        reserves[marketId][outcomeIndex] -= netAmount;

        // Standard constant product: add to other reserve, calculate output from this reserve
        // (reserveI - tokensOut) * (reserveJ + netAmount) = reserveI * reserveJ
        uint256 oldReserveI = reserves[marketId][outcomeIndex];
        uint256 oldReserveJ = reserves[marketId][otherIndex];
        // reserveJ already has netAmount added above, undo that too
        reserves[marketId][otherIndex] -= netAmount;
        oldReserveJ = reserves[marketId][otherIndex];

        // Now apply: we got netAmount of each token from split
        // Add all to reserves, then extract from the bought outcome
        for (uint256 i = 0; i < outcomeCount; i++) {
            reserves[marketId][i] += netAmount;
        }

        // Constant product invariant: product of reserves should be maintained
        // for the non-bought outcomes
        // tokensOut from outcomeIndex such that:
        // (reserve_i - tokensOut) * reserve_j = old_reserve_i * old_reserve_j
        uint256 newReserveJ = reserves[marketId][otherIndex];
        uint256 kOld = oldReserveI * oldReserveJ;
        uint256 newReserveI = (kOld + newReserveJ - 1) / newReserveJ; // ceil division
        tokensOut = reserves[marketId][outcomeIndex] - newReserveI;

        reserves[marketId][outcomeIndex] = newReserveI;
    }

    function _cpmmSell(
        bytes32 marketId,
        uint256 outcomeIndex,
        uint256 tokenAmount,
        uint256 outcomeCount
    ) internal returns (uint256 usdcOut) {
        uint256 otherIndex = outcomeIndex == 0 ? 1 : 0;
        uint256 oldReserveI = reserves[marketId][outcomeIndex];
        uint256 oldReserveJ = reserves[marketId][otherIndex];

        // Add sold tokens to the reserve
        reserves[marketId][outcomeIndex] += tokenAmount;

        // Constant product: (reserveI + tokenAmount) * (reserveJ - usdcEquiv) = reserveI * reserveJ
        uint256 kOld = oldReserveI * oldReserveJ;
        uint256 newReserveI = reserves[marketId][outcomeIndex];
        uint256 newReserveJ = (kOld + newReserveI - 1) / newReserveI; // ceil division

        usdcOut = oldReserveJ - newReserveJ;
        reserves[marketId][otherIndex] = newReserveJ;
    }

    // ──────────────────── Internal: LMSR (Multi-Outcome Markets) ────────────────────
    function _lmsrCost(bytes32 marketId, Pool storage pool) internal view returns (SD59x18) {
        // C = b * ln(sum(exp(q_i / b)))
        SD59x18 b = sd(int256(pool.lmsrB) * 1e12); // scale to 18 decimals from 6
        SD59x18 sumExp = sd(0);
        for (uint256 i = 0; i < pool.outcomeCount; i++) {
            SD59x18 qi = sd(int256(reserves[marketId][i]) * 1e12);
            SD59x18 expTerm = exp(qi / b);
            sumExp = sumExp + expTerm;
        }
        return b * ln(sumExp);
    }

    function _lmsrBuy(
        bytes32 marketId,
        uint256 outcomeIndex,
        uint256 netAmount,
        Pool storage pool
    ) internal returns (uint256 tokensOut) {
        // Add netAmount to all reserves from the split
        for (uint256 i = 0; i < pool.outcomeCount; i++) {
            reserves[marketId][i] += netAmount;
        }

        // Calculate current cost
        SD59x18 costBefore = _lmsrCost(marketId, pool);

        // Binary search for tokensOut: find how many tokens we can remove from outcomeIndex
        // such that cost increases by netAmount (scaled to 18 dec)
        uint256 lo = 0;
        uint256 hi = reserves[marketId][outcomeIndex];
        uint256 targetCostIncrease = netAmount;

        while (lo < hi) {
            uint256 mid = (lo + hi + 1) / 2;
            reserves[marketId][outcomeIndex] -= mid;
            SD59x18 costAfter = _lmsrCost(marketId, pool);
            reserves[marketId][outcomeIndex] += mid;

            // costAfter should be <= costBefore since we're removing from a reserve
            // Actually removing tokens decreases cost; we want the amount where the
            // net cost change (from adding netAmount to all and removing mid from one) is 0
            int256 costDiff = intoInt256(costBefore - costAfter);
            uint256 costDiffAbs = costDiff >= 0 ? uint256(costDiff) : uint256(-costDiff);
            uint256 scaledTarget = targetCostIncrease * 1e12;

            if (costDiffAbs <= scaledTarget) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }

        tokensOut = lo;
        reserves[marketId][outcomeIndex] -= tokensOut;
    }

    function _lmsrSell(
        bytes32 marketId,
        uint256 outcomeIndex,
        uint256 tokenAmount,
        Pool storage pool
    ) internal returns (uint256 usdcOut) {
        SD59x18 costBefore = _lmsrCost(marketId, pool);

        // Add the sold tokens to the reserve
        reserves[marketId][outcomeIndex] += tokenAmount;

        SD59x18 costAfter = _lmsrCost(marketId, pool);

        // The cost increased, so we can extract that difference as USDC
        int256 diff = intoInt256(costAfter - costBefore);
        if (diff > 0) {
            usdcOut = uint256(diff) / 1e12; // scale back from 18 to 6 decimals
        }
    }

    // ──────────────────── Internal: Pricing ────────────────────
    function _getPrices(bytes32 marketId, Pool storage pool) internal view returns (uint256[] memory prices) {
        prices = new uint256[](pool.outcomeCount);

        if (!pool.initialized || pool.outcomeCount == 0) {
            return prices;
        }

        if (pool.outcomeCount == 2) {
            // Binary CPMM: price_0 = reserve_1 / (reserve_0 + reserve_1)
            uint256 r0 = reserves[marketId][0];
            uint256 r1 = reserves[marketId][1];
            uint256 total = r0 + r1;
            if (total > 0) {
                prices[0] = (r1 * PRECISION) / total;
                prices[1] = (r0 * PRECISION) / total;
            }
        } else {
            // LMSR: price_i = exp(q_i / b) / sum(exp(q_j / b))
            SD59x18 b = sd(int256(pool.lmsrB) * 1e12);
            SD59x18 sumExp = sd(0);
            SD59x18[] memory expTerms = new SD59x18[](pool.outcomeCount);

            for (uint256 i = 0; i < pool.outcomeCount; i++) {
                SD59x18 qi = sd(int256(reserves[marketId][i]) * 1e12);
                expTerms[i] = exp(qi / b);
                sumExp = sumExp + expTerms[i];
            }

            for (uint256 i = 0; i < pool.outcomeCount; i++) {
                // price = expTerms[i] / sumExp, scaled to PRECISION
                int256 priceRaw = intoInt256(expTerms[i] * sd(int256(PRECISION)) / sumExp);
                prices[i] = priceRaw >= 0 ? uint256(priceRaw) : 0;
            }
        }
    }

    // ──────────────────── Internal: Helpers ────────────────────
    function _getPartition(uint256 outcomeCount) internal pure returns (uint256[] memory partition) {
        partition = new uint256[](outcomeCount);
        for (uint256 i = 0; i < outcomeCount; i++) {
            partition[i] = 1 << i;
        }
    }

    function _getPositionId(bytes32 conditionId, uint256 outcomeIndex) internal view returns (uint256) {
        bytes32 collectionId = conditionalTokens.getCollectionId(bytes32(0), conditionId, 1 << outcomeIndex);
        return conditionalTokens.getPositionId(usdc, collectionId);
    }

    function _getMinReserve(bytes32 marketId, uint256 outcomeCount) internal view returns (uint256 minReserve) {
        minReserve = type(uint256).max;
        for (uint256 i = 0; i < outcomeCount; i++) {
            if (reserves[marketId][i] < minReserve) {
                minReserve = reserves[marketId][i];
            }
        }
    }
}
