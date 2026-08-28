import { PrismaClient } from '@prisma/client';
import type { Puzzle } from '../../src/engine/puzzle';
import { serializePuzzle } from '../../src/lib/puzzle-storage';

/**
 * Writes a puzzle directly to the dedicated e2e-test Neon branch, bypassing
 * the app's own Server Actions. Exists only for tests that need a puzzle
 * shape (black cells, letters) the app has no UI to create yet — never
 * imported by application code.
 */
export async function seedPuzzle(
  puzzle: Puzzle,
  title = 'Seeded Test Puzzle'
): Promise<{ id: string }> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set — seed-puzzle.ts must run against the ' +
        'dedicated e2e-test branch, never the real database. Refusing to seed.'
    );
  }

  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const stored = serializePuzzle(puzzle);
    const row = await client.puzzle.create({
      data: {
        title,
        grid: stored.grid,
        hints: stored.hints,
        phase: stored.phase,
      },
    });
    return { id: row.id };
  } finally {
    await client.$disconnect();
  }
}
