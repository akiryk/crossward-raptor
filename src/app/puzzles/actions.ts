'use server';

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

export type PuzzleWithMeta = Puzzle & { id: string; title: string };

export async function createPuzzle(): Promise<{ id: string }> {
  const stored = serializePuzzle(createBlankPuzzle());
  const record = await prisma.puzzle.create({
    data: {
      grid: stored.grid as unknown as Prisma.InputJsonValue,
      hints: stored.hints as unknown as Prisma.InputJsonValue,
      phase: stored.phase,
    },
  });
  return { id: record.id };
}

export async function listPuzzles(): Promise<
  { id: string; title: string; updatedAt: Date }[]
> {
  const records = await prisma.puzzle.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true },
  });
  return records;
}

export async function saveGrid(id: string, grid: SerializedGrid): Promise<void> {
  await prisma.puzzle.update({
    where: { id },
    data: { grid: grid as unknown as Prisma.InputJsonValue },
  });
}

/** Loads the puzzle, transitions it to 'hints' phase via the engine's
 *  enterHintsPhase, persists the result, and returns the new phase. */
export async function enterHints(id: string): Promise<{ phase: Phase }> {
  const puzzle = await loadPuzzle(id);
  if (!puzzle) {
    throw new Error(`enterHints: puzzle ${id} not found`);
  }

  const updated = enterHintsPhase(puzzle);
  const stored = serializePuzzle(updated);

  await prisma.puzzle.update({
    where: { id },
    data: {
      hints: stored.hints as unknown as Prisma.InputJsonValue,
      phase: stored.phase,
    },
  });

  return { phase: updated.phase };
}

export async function loadPuzzle(id: string): Promise<PuzzleWithMeta | null> {
  const record = await prisma.puzzle.findUnique({ where: { id } });
  if (!record) return null;

  const puzzle = deserializePuzzle({
    grid: record.grid as unknown as SerializedGrid,
    hints: record.hints as Record<string, string>,
    phase: record.phase as Puzzle['phase'],
  });

  return { ...puzzle, id: record.id, title: record.title };
}
