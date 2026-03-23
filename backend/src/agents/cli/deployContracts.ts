/**
 * CLI: Deploy all prediction market contracts to Base Sepolia
 *
 * Usage: npx tsx src/agents/cli/deployContracts.ts
 *
 * Supports two modes:
 * - PRIVATE_KEY in .env → uses a standard wallet (MetaMask-style)
 * - CDP_API_KEY_ID in .env → uses CDP managed wallet
 *
 * Steps:
 * 1. Deploys all 5 contracts (CTF, Factory, AMM, UMA adapter, Pyth adapter)
 * 2. Grants RESOLVER_ROLE to both oracle adapters
 * 3. Outputs all addresses for .env files
 */

import 'dotenv/config';

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  type Address,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  type Hex,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// ---------- Contract Artifacts ----------

const CONTRACTS_DIR = join(import.meta.dirname, '../../../../contracts-base');
const OUT_DIR = join(CONTRACTS_DIR, 'out');

function loadArtifact(contractName: string, fileName: string) {
  const path = join(OUT_DIR, `${fileName}.sol`, `${contractName}.json`);
  const artifact = JSON.parse(readFileSync(path, 'utf-8'));
  return {
    abi: artifact.abi,
    bytecode: artifact.bytecode.object as Hex,
  };
}

// ---------- Known Addresses (Base Sepolia) ----------

const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address;
const BASE_SEPOLIA_OOV3 = '0x0F7fC5E6482f096380db6158f978167b57388deE' as Address;
const BASE_SEPOLIA_PYTH = '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729' as Address;

// ---------- Helpers ----------

function encodeConstructor(abi: unknown[], bytecode: Hex, args: unknown[]): Hex {
  const constructor = (abi as Record<string, unknown>[]).find(
    (item) => item.type === 'constructor'
  ) as Record<string, unknown> | undefined;
  const inputs = constructor?.inputs as readonly unknown[] | undefined;
  if (!inputs || inputs.length === 0) return bytecode;
  const encoded = encodeAbiParameters(inputs as Parameters<typeof encodeAbiParameters>[0], args);
  return (bytecode + encoded.slice(2)) as Hex;
}

// ---------- Deploy Function ----------

async function deployContract(
  walletClient: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>,
  bytecodeWithArgs: Hex,
  label: string
): Promise<Address> {
  const hash = await walletClient.deployContract({
    abi: [],
    bytecode: bytecodeWithArgs,
  });
  console.log(`   TX: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  if (receipt.status === 'reverted') throw new Error(`${label} deployment reverted`);
  if (!receipt.contractAddress) throw new Error(`${label}: no contract address in receipt`);
  console.log(`   ${label}: ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

// ---------- Main ----------

async function main() {
  console.log('\n=== Prediction Market Deployment (Base Sepolia) ===\n');

  // Load private key
  const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Missing PRIVATE_KEY in .env');
    console.error('Set PRIVATE_KEY=0x... with a wallet that has Base Sepolia ETH');
    console.error('Get ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia');
    process.exit(1);
  }

  // Create wallet client
  const account = privateKeyToAccount(privateKey as Hex);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http('https://sepolia.base.org'),
  });
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http('https://sepolia.base.org'),
  });

  console.log(`Deployer: ${account.address}`);

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance:  ${Number(balance) / 1e18} ETH`);
  if (balance === 0n) {
    console.error(
      '\nNo ETH! Get some from: https://www.coinbase.com/faucets/base-ethereum-sepolia'
    );
    process.exit(1);
  }

  // Load compiled contracts
  console.log('\nLoading Foundry artifacts...');
  let artifacts;
  try {
    artifacts = {
      ctf: loadArtifact('ConditionalTokens', 'ConditionalTokens'),
      factory: loadArtifact('MarketFactory', 'MarketFactory'),
      amm: loadArtifact('PredictionMarketAMM', 'PredictionMarketAMM'),
      uma: loadArtifact('UmaCtfAdapter', 'UmaCtfAdapter'),
      pyth: loadArtifact('PythOracleAdapter', 'PythOracleAdapter'),
    };
    console.log('All 5 artifacts loaded\n');
  } catch (e: unknown) {
    console.error(`Failed to load artifacts: ${e instanceof Error ? e.message : String(e)}`);
    console.error('Run: cd contracts-base && forge build');
    process.exit(1);
  }

  // Deploy all 5 contracts
  console.log('--- Deploying Contracts ---\n');

  console.log('1/5 ConditionalTokens...');
  const ctfAddress = await deployContract(
    walletClient,
    publicClient,
    artifacts.ctf.bytecode,
    'ConditionalTokens'
  );

  console.log('2/5 MarketFactory...');
  const factoryBytecode = encodeConstructor(artifacts.factory.abi, artifacts.factory.bytecode, [
    ctfAddress,
    BASE_SEPOLIA_USDC,
  ]);
  const factoryAddress = await deployContract(
    walletClient,
    publicClient,
    factoryBytecode,
    'MarketFactory'
  );

  console.log('3/5 PredictionMarketAMM...');
  const ammBytecode = encodeConstructor(artifacts.amm.abi, artifacts.amm.bytecode, [
    ctfAddress,
    factoryAddress,
    BASE_SEPOLIA_USDC,
  ]);
  const ammAddress = await deployContract(walletClient, publicClient, ammBytecode, 'AMM');

  console.log('4/5 UmaCtfAdapter...');
  const umaBytecode = encodeConstructor(artifacts.uma.abi, artifacts.uma.bytecode, [
    BASE_SEPOLIA_OOV3,
    factoryAddress,
    BASE_SEPOLIA_USDC,
  ]);
  const umaAddress = await deployContract(walletClient, publicClient, umaBytecode, 'UmaCtfAdapter');

  console.log('5/5 PythOracleAdapter...');
  const pythBytecode = encodeConstructor(artifacts.pyth.abi, artifacts.pyth.bytecode, [
    BASE_SEPOLIA_PYTH,
    factoryAddress,
  ]);
  const pythAddress = await deployContract(
    walletClient,
    publicClient,
    pythBytecode,
    'PythOracleAdapter'
  );

  // Grant RESOLVER_ROLE
  console.log('\n--- Granting Roles ---\n');

  const resolverRole = (await publicClient.readContract({
    address: factoryAddress,
    abi: artifacts.factory.abi,
    functionName: 'RESOLVER_ROLE',
  })) as Hex;

  const grantUma = await walletClient.writeContract({
    address: factoryAddress,
    abi: artifacts.factory.abi,
    functionName: 'grantRole',
    args: [resolverRole, umaAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: grantUma });
  console.log('RESOLVER_ROLE → UmaCtfAdapter');

  const grantPyth = await walletClient.writeContract({
    address: factoryAddress,
    abi: artifacts.factory.abi,
    functionName: 'grantRole',
    args: [resolverRole, pythAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: grantPyth });
  console.log('RESOLVER_ROLE → PythOracleAdapter');

  // Output
  console.log('\n========================================');
  console.log('   DEPLOYMENT COMPLETE');
  console.log('========================================\n');
  console.log(`Deployer:             ${account.address}`);
  console.log(`ConditionalTokens:    ${ctfAddress}`);
  console.log(`MarketFactory:        ${factoryAddress}`);
  console.log(`AMM:                  ${ammAddress}`);
  console.log(`UmaCtfAdapter:        ${umaAddress}`);
  console.log(`PythOracleAdapter:    ${pythAddress}`);

  console.log('\n--- backend/.env ---\n');
  console.log(`ACTIVE_CHAINS=base`);
  console.log(`BASE_RPC_URL=https://sepolia.base.org`);
  console.log(`BASE_WS_URL=wss://sepolia.base.org`);
  console.log(`BASE_CHAIN_ID=84532`);
  console.log(`CONDITIONAL_TOKENS_ADDRESS=${ctfAddress}`);
  console.log(`MARKET_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`AMM_ADDRESS=${ammAddress}`);
  console.log(`UMA_ADAPTER_ADDRESS=${umaAddress}`);
  console.log(`PYTH_ADAPTER_ADDRESS=${pythAddress}`);
  console.log(`PYTH_CONTRACT_ADDRESS=${BASE_SEPOLIA_PYTH}`);
  console.log(`USDC_ADDRESS=${BASE_SEPOLIA_USDC}`);

  console.log('\n--- dapp/.env.local ---\n');
  console.log(`VITE_BASE_CHAIN_ID=84532`);
  console.log(`VITE_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`VITE_AMM_ADDRESS=${ammAddress}`);
  console.log(`VITE_CONDITIONAL_TOKENS_ADDRESS=${ctfAddress}`);
  console.log(`VITE_USDC_ADDRESS=${BASE_SEPOLIA_USDC}`);

  process.exit(0);
}

main().catch((e: unknown) => {
  console.error('\nDeployment failed:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
