// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ConditionalTokens.sol";
import "../src/MarketFactory.sol";
import "../src/PredictionMarketAMM.sol";
import "../src/UmaCtfAdapter.sol";
import "../src/PythOracleAdapter.sol";

contract Deploy is Script {
    // Base Sepolia external addresses
    address constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant PYTH = 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729;
    address constant UMA_OOV3 = 0x0F7fC5E6482f096380db6158f978167b57388deE;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ConditionalTokens (CTF) — no dependencies
        ConditionalTokens conditionalTokens = new ConditionalTokens();
        console.log("ConditionalTokens:", address(conditionalTokens));

        // 2. Deploy MarketFactory — depends on CTF + USDC
        MarketFactory factory = new MarketFactory(
            address(conditionalTokens),
            USDC
        );
        console.log("MarketFactory:", address(factory));

        // 3. Deploy PredictionMarketAMM — depends on CTF + Factory + USDC
        PredictionMarketAMM amm = new PredictionMarketAMM(
            address(conditionalTokens),
            address(factory),
            USDC
        );
        console.log("PredictionMarketAMM:", address(amm));

        // 4. Deploy UmaCtfAdapter — depends on OOV3 + Factory + USDC
        UmaCtfAdapter umaAdapter = new UmaCtfAdapter(
            UMA_OOV3,
            address(factory),
            USDC
        );
        console.log("UmaCtfAdapter:", address(umaAdapter));

        // 5. Deploy PythOracleAdapter — depends on Pyth + Factory
        PythOracleAdapter pythAdapter = new PythOracleAdapter(
            PYTH,
            address(factory)
        );
        console.log("PythOracleAdapter:", address(pythAdapter));

        // 6. Grant RESOLVER_ROLE to both oracle adapters
        bytes32 resolverRole = factory.RESOLVER_ROLE();
        factory.grantRole(resolverRole, address(umaAdapter));
        factory.grantRole(resolverRole, address(pythAdapter));
        console.log("Granted RESOLVER_ROLE to UMA and Pyth adapters");

        // 7. Grant MARKET_CREATOR_ROLE to deployer (already done in constructor)
        //    Grant it to any additional addresses if needed
        console.log("Deployer:", deployer);

        vm.stopBroadcast();

        // Summary
        console.log("\n=== Deployment Summary ===");
        console.log("ConditionalTokens:", address(conditionalTokens));
        console.log("MarketFactory:    ", address(factory));
        console.log("AMM:              ", address(amm));
        console.log("UmaCtfAdapter:    ", address(umaAdapter));
        console.log("PythOracleAdapter:", address(pythAdapter));
        console.log("USDC:             ", USDC);
        console.log("Pyth:             ", PYTH);
        console.log("UMA OOV3:         ", UMA_OOV3);
    }
}
