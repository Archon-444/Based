/**
 * CLI: Agent Cost Report
 *
 * Usage: npm run agent:costs
 */

import 'dotenv/config';

import { prisma } from '../../database/prismaClient.js';

async function main() {
  // Query aggregated costs from AgentAction table
  const actions = await prisma.agentAction.groupBy({
    by: ['agent'],
    _sum: {
      inputTokens: true,
      outputTokens: true,
      costUsd: true,
    },
    _count: true,
  });

  console.log('\n--- Agent Cost Report ---\n');

  if (actions.length === 0) {
    console.log('No agent actions recorded yet.');
    process.exit(0);
  }

  let totalCost = 0;

  for (const entry of actions) {
    const cost = entry._sum.costUsd ?? 0;
    totalCost += cost;

    console.log(`Agent: ${entry.agent}`);
    console.log(`  Calls: ${entry._count}`);
    console.log(`  Input tokens: ${(entry._sum.inputTokens ?? 0).toLocaleString()}`);
    console.log(`  Output tokens: ${(entry._sum.outputTokens ?? 0).toLocaleString()}`);
    console.log(`  Cost: $${cost.toFixed(4)}`);
    console.log('');
  }

  console.log(`Total cost: $${totalCost.toFixed(4)}`);

  await prisma.$disconnect();
  process.exit(0);
}

main();
