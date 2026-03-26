import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCode,
  FiBook,
  FiGithub,
  FiCopy,
  FiCheck,
  FiTerminal,
  FiPackage,
  FiDatabase,
  FiLayers,
} from 'react-icons/fi';
import { Container } from '../../components/layout/Container';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const DeveloperDocsPage: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const contractAddresses = {
    testnet: '0x1c3fe17f5aa56e35440efa7835e78e767b8c7d2ed0c3378d55facf6920c6cc81',
    mainnet: 'TBD - Deploy to mainnet',
  };

  const modules = [
    {
      name: 'market_manager',
      description: 'Core module for creating and managing prediction markets',
      functions: [
        'create_market(question, outcomes, end_time, category)',
        'resolve_market(market_id, winning_outcome)',
        'get_market_info(market_id)',
        'get_market_count()',
      ],
    },
    {
      name: 'betting',
      description: 'Handles all betting operations and pool management',
      functions: [
        'place_bet(market_id, outcome_index, amount)',
        'claim_winnings(market_id)',
        'get_user_bet(market_id, user_address)',
        'get_pool_state(market_id)',
      ],
    },
    {
      name: 'collateral_vault',
      description: 'Manages USDC deposits and withdrawals',
      functions: [
        'deposit(amount)',
        'withdraw(amount)',
        'get_balance(user_address)',
        'get_total_locked()',
      ],
    },
    {
      name: 'access_control',
      description: 'Role-based permissions and pause functionality',
      functions: [
        'grant_role(user_address, role)',
        'revoke_role(user_address, role)',
        'has_role(user_address, role)',
        'is_paused()',
        'pause()',
        'unpause()',
      ],
    },
    {
      name: 'oracle',
      description: 'Pyth Network oracle integration for automated resolution',
      functions: [
        'register_pyth_feed(market_id, price_feed_id)',
        'try_pyth_resolution(market_id)',
        'get_oracle_price(market_id)',
      ],
    },
  ];

  const quickstart = `# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Clone the repository
git clone https://github.com/Archon-444/Based
cd Based

# Install frontend dependencies
cd dapp && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Compile Solidity contracts
cd ../contracts-base
forge build`;

  const integration = `import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// Initialize clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Contract addresses
const MARKET_FACTORY = "${contractAddresses.testnet}";

// Place a bet (using wagmi hooks in React)
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MarketFactoryABI } from "./abis/MarketFactory";

function usePlaceBet() {
  const { writeContract, data: hash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const placeBet = (marketId: bigint, outcomeIndex: number, amount: bigint) => {
    writeContract({
      address: MARKET_FACTORY,
      abi: MarketFactoryABI,
      functionName: "placeBet",
      args: [marketId, outcomeIndex, amount],
    });
  };

  return { placeBet, isSuccess };
}

// Read market info
async function getMarketInfo(marketId: bigint) {
  return publicClient.readContract({
    address: MARKET_FACTORY,
    abi: MarketFactoryABI,
    functionName: "getMarketInfo",
    args: [marketId],
  });
}`;

  const solidityContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MarketFactory is Ownable {
    struct Market {
        uint256 id;
        string question;
        string[] outcomes;
        uint256 endTime;
        bool isResolved;
        uint8 winningOutcome;
        uint8 category;
    }

    Market[] public markets;
    uint256 public nextMarketId;

    event MarketCreated(uint256 indexed id, string question, uint256 endTime);

    constructor() Ownable(msg.sender) {}

    /// @notice Create a new prediction market
    function createMarket(
        string calldata question,
        string[] calldata outcomes,
        uint256 endTime,
        uint8 category
    ) external returns (uint256) {
        require(outcomes.length >= 2, "Need at least 2 outcomes");
        require(endTime > block.timestamp, "End time must be in future");

        uint256 marketId = nextMarketId++;
        Market storage market = markets.push();
        market.id = marketId;
        market.question = question;
        market.endTime = endTime;
        market.category = category;

        for (uint256 i = 0; i < outcomes.length; i++) {
            market.outcomes.push(outcomes[i]);
        }

        emit MarketCreated(marketId, question, endTime);
        return marketId;
    }
}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 py-16 lg:py-24">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              Developer Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
              Build on Based
            </h1>
            <p className="text-lg md:text-xl text-primary-100 leading-relaxed mb-8">
              Comprehensive guides, API references, and code examples to help you integrate
              prediction markets into your dApp or build on top of our protocol.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/Archon-444/Based"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
              >
                <FiGithub className="w-5 h-5" />
                View on GitHub
              </a>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-400 transition-colors">
                <FiBook className="w-5 h-5" />
                API Reference
              </button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Quick Start */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Quick Start
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Get up and running in minutes
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiTerminal className="w-5 h-5" />
                Installation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                  <code>{quickstart}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(quickstart, 'quickstart')}
                  className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {copiedCode === 'quickstart' ? (
                    <FiCheck className="w-5 h-5 text-success-400" />
                  ) : (
                    <FiCopy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Contract Addresses */}
      <section className="py-16 lg:py-24 bg-white dark:bg-gray-800">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Contract Addresses
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Deployed smart contract addresses on Base
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(contractAddresses).map(([network, address]) => (
              <Card key={network}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {network}
                    </h3>
                    <Badge variant={network === 'testnet' ? 'warning' : 'success'}>
                      {network === 'testnet' ? 'Test Network' : 'Live'}
                    </Badge>
                  </div>
                  <div className="relative">
                    <code className="block bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg text-sm font-mono break-all text-gray-900 dark:text-white">
                      {address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(address, network)}
                      className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 rounded transition-colors"
                    >
                      {copiedCode === network ? (
                        <FiCheck className="w-4 h-4 text-success-500" />
                      ) : (
                        <FiCopy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Module Reference */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Smart Contracts
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Core Solidity contracts and their functions
            </p>
          </div>

          <div className="grid gap-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <FiLayers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <CardTitle className="font-mono">{module.name}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Key Functions:
                    </h4>
                    <ul className="space-y-2">
                      {module.functions.map((func) => (
                        <li
                          key={func}
                          className="flex items-start gap-2 text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded"
                        >
                          <FiCode className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                          <span>{func}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Integration Example */}
      <section className="py-16 lg:py-24 bg-white dark:bg-gray-800">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
              TypeScript Integration
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Example code for integrating with the smart contracts
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiPackage className="w-5 h-5" />
                SDK Usage Example
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
                  <code>{integration}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(integration, 'integration')}
                  className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {copiedCode === 'integration' ? (
                    <FiCheck className="w-5 h-5 text-success-400" />
                  ) : (
                    <FiCopy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Solidity Contract Example */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Solidity Contract Example
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Sample Solidity code for market creation
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiDatabase className="w-5 h-5" />
                MarketFactory.sol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
                  <code>{solidityContract}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(solidityContract, 'move')}
                  className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {copiedCode === 'move' ? (
                    <FiCheck className="w-5 h-5 text-success-400" />
                  ) : (
                    <FiCopy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Resources */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-6">
              Additional Resources
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <a
                href="https://docs.base.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
              >
                <FiBook className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Base Docs
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Official Base development documentation
                </p>
              </a>
              <a
                href="https://github.com/Archon-444/Based"
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
              >
                <FiGithub className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">GitHub Repo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full source code and examples
                </p>
              </a>
              <a
                href="https://discord.gg/based"
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
              >
                <FiCode className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Community Support
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Join our Discord for help
                </p>
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default DeveloperDocsPage;
