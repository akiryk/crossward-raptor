import { randomUUID } from 'node:crypto';
import { createGrid, withLetter, type Grid } from '../../src/engine/grid';
import type { Puzzle } from '../../src/engine/puzzle';
import { serializeGrid, type SerializedGrid } from '../../src/lib/puzzle-storage';
import { ownershipTestClient } from './ownership';
import { seedPuzzle } from './seed-puzzle';

// Editable fixture plumbing, not part of the frozen P1 acceptance baseline.
// Raw SQL keeps these helpers type-checkable before PlaySession is generated.
export interface PlaySessionRow {
  id: string;
  userId: string;
  puzzleId: string;
  entries: SerializedGrid;
  startedAt: Date;
  completedAt: Date | null;
}

export function playPuzzleFixture(): Puzzle {
  let grid = createGrid({ cols: 3, rows: 3, black: [{ col: 1, row: 1 }] });
  for (const [row, letters] of ['CAT', 'A#A', 'TEN'].entries()) {
    for (const [col, letter] of [...letters].entries()) {
      if (letter !== '#') grid = withLetter(grid, { col, row }, letter);
    }
  }
  return {
    grid,
    phase: 'hints',
    hints: {
      '1-across': 'Feline',
      '3-across': 'Twice five',
      '1-down': 'A pet that purrs',
      '2-down': 'A shade of brown',
    },
  };
}

export async function seedPlayPuzzle(options: {
  builderId: string;
  published?: boolean;
  visibility?: 'public' | 'private';
  puzzle?: Puzzle;
}) {
  const puzzle = options.puzzle ?? playPuzzleFixture();
  const title = `P1 fixture ${randomUUID()}`;
  const { id } = await seedPuzzle(puzzle, title, options.builderId);
  const client = ownershipTestClient();
  try {
    await client.puzzle.update({
      where: { id },
      data: {
        publishedAt: options.published === false ? null : new Date('2026-01-02T03:04:05Z'),
        visibility: options.visibility ?? 'public',
      },
    });
  } finally {
    await client.$disconnect();
  }
  return { id, title, puzzle };
}

export async function readPlaySessions(puzzleId: string): Promise<PlaySessionRow[]> {
  const client = ownershipTestClient();
  try {
    return await client.$queryRaw<PlaySessionRow[]>`
      SELECT "id", "userId", "puzzleId", "entries", "startedAt", "completedAt"
      FROM "PlaySession" WHERE "puzzleId" = ${puzzleId} ORDER BY "userId"
    `;
  } finally {
    await client.$disconnect();
  }
}

export async function seedPlaySession(userId: string, puzzleId: string, grid: Grid) {
  const client = ownershipTestClient();
  const id = randomUUID();
  const startedAt = new Date('2026-01-03T04:05:06Z');
  try {
    await client.$executeRaw`
      INSERT INTO "PlaySession" ("id", "userId", "puzzleId", "entries", "startedAt", "completedAt")
      VALUES (${id}, ${userId}, ${puzzleId}, ${JSON.stringify(serializeGrid(grid))}::jsonb, ${startedAt}, NULL)
    `;
  } finally {
    await client.$disconnect();
  }
  return id;
}

export async function readPlayPuzzle(id: string) {
  const client = ownershipTestClient();
  try {
    return await client.puzzle.findUniqueOrThrow({ where: { id } });
  } finally {
    await client.$disconnect();
  }
}

/** Delete only the synthetic puzzle explicitly created by the calling test. */
export async function deletePlayFixture(id: string) {
  const client = ownershipTestClient();
  try {
    await client.puzzle.delete({ where: { id } });
  } finally {
    await client.$disconnect();
  }
}

/** Delete only a synthetic player created without puzzles by the calling test. */
export async function deletePlayFixtureUser(id: string) {
  const client = ownershipTestClient();
  try {
    await client.user.delete({ where: { id } });
  } finally {
    await client.$disconnect();
  }
}
