import type { Prisma } from '@prisma/client';
import type { Puzzle } from '../../src/engine/puzzle';
import { serializePuzzle } from '../../src/lib/puzzle-storage';
import { ensureSuiteBuilder, ownershipTestClient } from './ownership';
import { currentFixtureBuilderId } from './fixture-builder';

/**
 * Writes a puzzle directly to the local Postgres test database (Story L1),
 * bypassing the app's own Server Actions. Exists only for tests that need a
 * puzzle shape (black cells, letters) the app has no UI to create yet —
 * never imported by application code.
 */
export async function seedPuzzle(
  puzzle: Puzzle,
  title = 'Seeded Test Puzzle',
  builderId?: string
): Promise<{ id: string }> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set — seed-puzzle.ts must run against the ' +
        'dedicated test database, never the real database. Refusing to seed.'
    );
  }

  const client = ownershipTestClient();
  try {
    const owner = builderId ?? currentFixtureBuilderId() ?? await ensureSuiteBuilder(client);
    const stored = serializePuzzle(puzzle);
    const row = await client.puzzle.create({
      data: {
        builderId: owner,
        title,
        grid: stored.grid as unknown as Prisma.InputJsonValue,
        hints: stored.hints as unknown as Prisma.InputJsonValue,
        phase: stored.phase,
      },
    });
    return { id: row.id };
  } finally {
    await client.$disconnect();
  }
}
