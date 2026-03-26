/**
 * Fix markets with placeholder outcome labels ("Outcome 0", "Outcome 1", etc.)
 *
 * For each market with placeholder outcomes:
 * 1. Try to match a suggestion by question text and use its outcomes
 * 2. For binary markets (2 outcomes), default to ["Yes", "No"]
 * 3. For multi-outcome, rename to "Outcome 1", "Outcome 2" (1-indexed)
 *
 * Usage: npx tsx scripts/fixOutcomeLabels.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const markets = await prisma.market.findMany({
    where: {
      outcomes: { hasSome: ['Outcome 0'] },
    },
  });

  console.log(`Found ${markets.length} market(s) with placeholder outcomes`);

  for (const market of markets) {
    const count = market.outcomes.length;

    // Try to match a suggestion
    const suggestion = await prisma.suggestion.findFirst({
      where: { question: market.question },
      select: { outcomes: true },
    });

    let newOutcomes: string[];

    if (suggestion && Array.isArray(suggestion.outcomes) && suggestion.outcomes.length === count) {
      newOutcomes = suggestion.outcomes as string[];
      console.log(`  Market ${market.onChainId}: matched suggestion → [${newOutcomes.join(', ')}]`);
    } else if (count === 2) {
      newOutcomes = ['Yes', 'No'];
      console.log(`  Market ${market.onChainId}: binary default → [Yes, No]`);
    } else {
      newOutcomes = Array.from({ length: count }, (_, i) => `Outcome ${i + 1}`);
      console.log(`  Market ${market.onChainId}: multi-outcome → [${newOutcomes.join(', ')}]`);
    }

    await prisma.market.update({
      where: { id: market.id },
      data: { outcomes: newOutcomes },
    });
  }

  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
