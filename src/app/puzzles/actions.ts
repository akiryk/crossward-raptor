'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  createBlankPuzzle,
  deserializePuzzle,
  serializePuzzle,
  type SerializedGrid,
} from '@/lib/puzzle-storage';
import type { Puzzle, Phase } from '@/engine/puzzle';
import { enterHintsPhase } from '@/engine/phase';
import { normalizeTitle, requireTitle } from '@/lib/puzzle-title';
import { summarizePuzzle } from '@/lib/puzzle-summary';
import type { PuzzleSize } from '@/lib/puzzle-size';

export type Visibility = 'private' | 'public';

export type PuzzleWithMeta = Puzzle & {
  id: string;
  title: string;
  publishedAt: Date | null;
  visibility: Visibility;
};

export async function createPuzzle(input: {
  title: string;
  size: PuzzleSize;
}): Promise<{ id: string }> {
  const title = requireTitle(input.title);
  const stored = serializePuzzle(createBlankPuzzle(input.size));
  const record = await prisma.puzzle.create({
    data: {
      title,
      grid: stored.grid as unknown as Prisma.InputJsonValue,
      hints: stored.hints as unknown as Prisma.InputJsonValue,
      phase: stored.phase,
    },
  });
  revalidatePath('/puzzles');
  return { id: record.id };
}

export async function listPuzzles(): Promise<
  {
    id: string;
    title: string;
    updatedAt: Date;
    phase: Phase;
    hintsComplete: boolean;
    publishedAt: Date | null;
    visibility: Visibility;
  }[]
> {
  const records = await prisma.puzzle.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      grid: true,
      hints: true,
      phase: true,
      publishedAt: true,
      visibility: true,
    },
  });

  return records.map((record) => {
    const summary = summarizePuzzle({
      grid: record.grid as unknown as SerializedGrid,
      hints: record.hints as Record<string, string>,
      phase: record.phase as Phase,
    });
    return {
      id: record.id,
      title: record.title,
      updatedAt: record.updatedAt,
      phase: summary.phase,
      hintsComplete: summary.hintsComplete,
      publishedAt: record.publishedAt,
      visibility: record.visibility as Visibility,
    };
  });
}

export async function saveGrid(id: string, grid: SerializedGrid): Promise<void> {
  await prisma.puzzle.update({
    where: { id },
    data: { grid: grid as unknown as Prisma.InputJsonValue },
  });
}

export async function saveHints(id: string, hints: Record<string, string>): Promise<void> {
  await prisma.puzzle.update({
    where: { id },
    data: { hints: hints as unknown as Prisma.InputJsonValue },
  });
}

export async function saveTitle(id: string, title: string): Promise<void> {
  await prisma.puzzle.update({
    where: { id },
    data: { title: normalizeTitle(title) },
  });
}

/** Loads the puzzle, transitions it to 'hints' phase via the engine's
 *  enterHintsPhase, persists the result (grid included -- the transition
 *  now converts empty cells to black, so the grid changes too), and
 *  returns the new phase, hints, and grid. */
export async function enterHints(
  id: string
): Promise<{ phase: Phase; hints: Record<string, string>; grid: SerializedGrid }> {
  const puzzle = await loadPuzzle(id);
  if (!puzzle) {
    throw new Error(`enterHints: puzzle ${id} not found`);
  }

  const updated = enterHintsPhase(puzzle);
  const stored = serializePuzzle(updated);

  await prisma.puzzle.update({
    where: { id },
    data: {
      grid: stored.grid as unknown as Prisma.InputJsonValue,
      hints: stored.hints as unknown as Prisma.InputJsonValue,
      phase: stored.phase,
    },
  });

  return { phase: updated.phase, hints: { ...updated.hints }, grid: stored.grid };
}

/** Publishes the puzzle with the given visibility, stamping publishedAt now.
 *  Requires the puzzle to be in hints phase and not already published --
 *  enforced in the single update's WHERE clause, not a separate check, so a
 *  concurrent call can't slip a grid-phase or already-published puzzle
 *  through between a check and a write. */
export async function publishPuzzle(
  id: string,
  visibility: Visibility
): Promise<{ publishedAt: Date; visibility: Visibility }> {
  if (visibility !== 'private' && visibility !== 'public') {
    throw new Error(`publishPuzzle: invalid visibility ${JSON.stringify(visibility)}`);
  }

  const publishedAt = new Date();
  const { count } = await prisma.puzzle.updateMany({
    where: { id, phase: 'hints', publishedAt: null },
    data: { publishedAt, visibility },
  });
  if (count === 0) {
    throw new Error(`publishPuzzle: puzzle ${id} is not eligible to publish`);
  }

  return { publishedAt, visibility };
}

/** Unpublishes the puzzle by clearing publishedAt. Visibility is left as-is
 *  for if it's published again. */
export async function unpublishPuzzle(id: string): Promise<void> {
  await prisma.puzzle.update({
    where: { id },
    data: { publishedAt: null },
  });
}

/** Permanently deletes the puzzle. No soft-delete, no tombstone. */
export async function deletePuzzle(id: string): Promise<void> {
  await prisma.puzzle.delete({ where: { id } });
  revalidatePath('/puzzles');
}

export async function loadPuzzle(id: string): Promise<PuzzleWithMeta | null> {
  const record = await prisma.puzzle.findUnique({ where: { id } });
  if (!record) return null;

  const puzzle = deserializePuzzle({
    grid: record.grid as unknown as SerializedGrid,
    hints: record.hints as Record<string, string>,
    phase: record.phase as Puzzle['phase'],
  });

  return {
    ...puzzle,
    id: record.id,
    title: record.title,
    publishedAt: record.publishedAt,
    visibility: record.visibility as Visibility,
  };
}
