import { createGrid, withLetter } from '../../src/engine/grid';
import { ownershipTestClient } from './ownership';
import { seedPuzzle } from './seed-puzzle';

export type BuilderEditState = 'grid' | 'hints' | 'private published' | 'public published';

/** Synthetic fixtures only; every access validates the isolated test target. */
export async function seedBuilderEditPuzzle(title: string, builderId: string, state: BuilderEditState) {
  let grid = createGrid({ cols: 3, rows: 3 });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) grid = withLetter(grid, { col, row }, 'A');
  }
  const hints = Object.fromEntries(['1-across', '4-across', '5-across', '1-down', '2-down', '3-down'].map((key) => [key, 'A clue']));
  const seeded = await seedPuzzle({ grid, hints, phase: state === 'grid' ? 'grid' : 'hints' }, title, builderId);
  if (state.includes('published')) {
    const client = ownershipTestClient();
    try {
      await client.puzzle.update({
        where: { id: seeded.id },
        data: { publishedAt: new Date('2026-10-01T00:00:00Z'), visibility: state === 'public published' ? 'public' : 'private' },
      });
    } finally {
      await client.$disconnect();
    }
  }
  return seeded;
}

export async function builderEditSnapshot(id: string) {
  const client = ownershipTestClient();
  try {
    return await client.puzzle.findUniqueOrThrow({ where: { id } });
  } finally {
    await client.$disconnect();
  }
}
