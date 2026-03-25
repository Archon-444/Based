// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ConditionalTokens.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarketAMM.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CreateTestMarket is Script {
    // Deployed contract addresses (Base Sepolia)
    address constant FACTORY = 0x51bAebD534f1b56003dCf11587874F9c9fA6F41A;
    address constant AMM = 0x5c775990FacADDcC608A7770f78A8e57f401b93e;
    address constant CTF = 0xAF64D3778A5C065499E2CE22Bf94d949Ea353C87;
    address constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IERC20 usdc = IERC20(USDC);
        MarketFactory factory = MarketFactory(FACTORY);
        PredictionMarketAMM amm = PredictionMarketAMM(AMM);
        ConditionalTokens ctf = ConditionalTokens(CTF);

        // Check USDC balance
        uint256 balance = usdc.balanceOf(vm.addr(deployerPrivateKey));
        console.log("USDC balance:", balance);
        require(balance >= 10e6, "Need at least 10 USDC");

        // Step 1: Approve USDC to all contracts
        usdc.approve(address(factory), type(uint256).max);
        usdc.approve(address(amm), type(uint256).max);
        usdc.approve(address(ctf), type(uint256).max);
        console.log("USDC approved");

        // Step 2: Approve CTF ERC1155 tokens to AMM
        ctf.setApprovalForAll(address(amm), true);
        console.log("CTF ERC1155 approved for AMM");

        // Step 3: Create market
        bytes32 questionId = keccak256("btc-100k-2025");
        string memory question = "Will BTC reach $100k by end of 2025?";
        uint256 outcomeCount = 2;
        uint256 deadline = block.timestamp + 30 days;
        uint256 initialLiquidity = 10e6; // 10 USDC

        bytes32 marketId = factory.createMarket(
            questionId,
            question,
            outcomeCount,
            deadline,
            "",              // no ancillary data
            initialLiquidity
        );
        console.log("Market created!");
        console.logBytes32(marketId);

        // Step 4: Activate market
        factory.activateMarket(marketId);
        console.log("Market activated");

        // Step 5: Seed the pool
        amm.initializePool(marketId, initialLiquidity);
        console.log("Pool initialized with 10 USDC");

        vm.stopBroadcast();

        console.log("\n=== Test Market Created ===");
        console.log("Question:", question);
        console.logBytes32(marketId);
        console.log("Deadline:", deadline);
        console.log("Pool seeded: 10 USDC");
    }
}
