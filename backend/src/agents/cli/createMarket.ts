/**
 * CLI: Create Market via AI Agent
 *
 * Usage: npm run agent:create -- "Will BTC hit $150K by end of 2026?"
 */

import 'dotenv/config';

import { createFromPrompt } from '../marketCreator.js';

async function main() {
  const input = process.argv.slice(2).join(' ').trim();

  if (!input) {
    console.error('Usage: npm run agent:create -- "Your market question or idea"');
    process.exit(1);
  }

  console.log(`\nGenerating market proposal for: "${input}"\n`);

  try {
    const result = await createFromPrompt(input);

    console.log('\n--- Result ---');
    console.log(`Status: ${result.status}`);
    if (result.reason) console.log(`Reason: ${result.reason}`);
    if (result.marketId) console.log(`Market ID: ${result.marketId}`);
    if (result.txHash) console.log(`TX Hash: ${result.txHash}`);

    console.log('\n--- Proposal ---');
    console.log(JSON.stringify(result.proposal, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
