import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { SerializedGrid } from '../../src/lib/puzzle-storage';

/**
 * Reads one puzzle row straight out of the local Postgres test database
 * (Story L1), bypassing the app's own Server Actions — the read-side
 * counterpart to seed-puzzle.ts, and set up exactly the same way.
 *
 * Exists for assertions about columns the UI never surfaces, such as
 * `gridBeforeHints` (Story H2), which is written at the hints transition
 * and read by nothing in the app. Never imported by application code.
 */
export async function readPuzzleRow(id: string): Promise<{
  phase: string;
  grid: SerializedGrid;
  gridBeforeHints: SerializedGrid | null;
}> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set — read-puzzle-row.ts must run against ' +
        'the dedicated test database, never the real database. Refusing to read.'
    );
  }

  const adapter = new PrismaPg({ connectionString: url });
  const client = new PrismaClient({ adapter });
  try {
    const row = await client.puzzle.findUnique({
      where: { id },
      select: { phase: true, grid: true, gridBeforeHints: true },
    });
    if (!row) throw new Error(`readPuzzleRow: puzzle ${id} not found`);
    return {
      phase: row.phase,
      grid: row.grid as unknown as SerializedGrid,
      gridBeforeHints: (row.gridBeforeHints ?? null) as unknown as SerializedGrid | null,
    };
  } finally {
    await client.$disconnect();
  }
}
