'use server';

import { revalidatePath } from 'next/cache';
import type { PlaySession, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/require-session';
import {
  createBlankPuzzle,
  deserializeGrid,
  deserializePuzzle,
  serializeGrid,
  serializePuzzle,
  type SerializedGrid,
} from '@/lib/puzzle-storage';
import type { Puzzle, Phase } from '@/engine/puzzle';
import { enterHintsPhase } from '@/engine/phase';
import { normalizeTitle, requireTitle } from '@/lib/puzzle-title';
import { summarizePuzzle } from '@/lib/puzzle-summary';
import type { PuzzleSize } from '@/lib/puzzle-size';
import { displayNameValidationMessage } from '@/lib/display-name';
import { clearLetters } from '@/engine/grid';
import { isCompatiblePlayEntries } from '@/lib/play-entries';
import { isFull, isSolved } from '@/engine/play';
import { classifyLibraryPlay, type LibraryPlay } from '@/lib/library-play';

export type Visibility = 'private' | 'public';

export type PuzzleWithMeta = Puzzle & {
  id: string;
  title: string;
  publishedAt: Date | null;
  visibility: Visibility;
};

export interface PlayPuzzleView {
  id: string;
  title: string;
  entries: SerializedGrid;
  hints: Record<string, string>;
  session: {
    id: string;
    startedAt: Date;
    completedAt: Date | null;
  } | null;
}

const playPuzzleSelect = { id: true, title: true, grid: true, hints: true } as const;
const playSessionSelect = { id: true, entries: true, startedAt: true, completedAt: true } as const;

function playView(
  puzzle: { id: string; title: string; grid: Prisma.JsonValue; hints: Prisma.JsonValue },
  session: Pick<PlaySession, 'id' | 'entries' | 'startedAt' | 'completedAt'> | null
): PlayPuzzleView {
  return {
    id: puzzle.id,
    title: puzzle.title,
    entries: session
      ? session.entries as unknown as SerializedGrid
      : serializeGrid(clearLetters(deserializeGrid(puzzle.grid as unknown as SerializedGrid))),
    hints: puzzle.hints as Record<string, string>,
    session: session
      ? { id: session.id, startedAt: session.startedAt, completedAt: session.completedAt }
      : null,
  };
}

/** Reads and prefetches are passive; only a mounted player starts a session. */
export async function loadPlayPuzzle(id: string): Promise<PlayPuzzleView | null> {
  const authSession = await requireSession();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id, publishedAt: { not: null } },
    select: playPuzzleSelect,
  });
  if (!puzzle) return null;

  const session = await prisma.playSession.findUnique({
    where: { userId_puzzleId: { userId: authSession.user.id, puzzleId: id } },
    select: playSessionSelect,
  });
  return playView(puzzle, session);
}

/** Whether the authenticated player built this published puzzle. Only
 *  chooses the quiet reset shortcut; reset permission never depends on it. */
export async function isPlayPuzzleBuilder(id: string): Promise<boolean> {
  const authSession = await requireSession();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id, publishedAt: { not: null } },
    select: { builderId: true },
  });
  return puzzle?.builderId === authSession.user.id;
}

export async function startPlaySession(id: string): Promise<PlayPuzzleView> {
  const authSession = await requireSession();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id, publishedAt: { not: null } },
    select: playPuzzleSelect,
  });
  if (!puzzle) throw new Error('This puzzle is not available to play.');

  // PostgreSQL INSERT ... ON CONFLICT DO NOTHING preserves the winner,
  // including entries and timestamps, when first opens race or retry.
  await prisma.playSession.createMany({
    data: {
      userId: authSession.user.id,
      puzzleId: id,
      entries: playView(puzzle, null).entries as unknown as Prisma.InputJsonValue,
    },
    skipDuplicates: true,
  });
  const session = await prisma.playSession.findUniqueOrThrow({
    where: { userId_puzzleId: { userId: authSession.user.id, puzzleId: id } },
    select: playSessionSelect,
  });
  return playView(puzzle, session);
}

/** Discards only the caller's identified attempt and returns their current
 *  one, creating a fresh blank attempt when none remains. A session ID that
 *  matches nothing (a retry, an older request, another user's or puzzle's
 *  attempt) deletes nothing. */
export async function resetPlaySession(id: string, sessionId: string): Promise<PlayPuzzleView> {
  const authSession = await requireSession();
  if (typeof id !== 'string' || !id || typeof sessionId !== 'string' || !sessionId) {
    throw new Error('resetPlaySession: invalid identifiers');
  }
  const puzzle = await prisma.puzzle.findUnique({
    where: { id, publishedAt: { not: null } },
    select: playPuzzleSelect,
  });
  if (!puzzle) throw new Error('This puzzle is not available to play.');

  const userId = authSession.user.id;
  const session = await prisma.$transaction(async (tx) => {
    // The delete guards publication itself; the re-read rejects if the puzzle
    // became unavailable, rolling back any deletion before creating anything.
    await tx.playSession.deleteMany({
      where: { id: sessionId, userId, puzzleId: id, puzzle: { publishedAt: { not: null } } },
    });
    const published = await tx.puzzle.findFirst({
      where: { id, publishedAt: { not: null } },
      select: { id: true },
    });
    if (!published) throw new Error('This puzzle is not available to play.');
    await tx.playSession.createMany({
      data: {
        userId,
        puzzleId: id,
        entries: playView(puzzle, null).entries as unknown as Prisma.InputJsonValue,
      },
      skipDuplicates: true,
    });
    return tx.playSession.findUniqueOrThrow({
      where: { userId_puzzleId: { userId, puzzleId: id } },
      select: playSessionSelect,
    });
  });
  revalidatePath('/puzzles');
  return playView(puzzle, session);
}

export async function savePlayEntries(id: string, entries: SerializedGrid): Promise<void> {
  const authSession = await requireSession();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id, publishedAt: { not: null } },
    select: { grid: true },
  });
  if (!puzzle) throw new Error('This puzzle is not available to play.');
  if (!isCompatiblePlayEntries(entries, puzzle.grid as unknown as SerializedGrid)) {
    throw new Error('The entries must match the published puzzle grid.');
  }

  const solution = deserializeGrid(puzzle.grid as unknown as SerializedGrid);
  const ownSession = await prisma.playSession.findUnique({
    where: { userId_puzzleId: { userId: authSession.user.id, puzzleId: id } },
    select: { entries: true },
  });
  if (!ownSession) throw new Error('Your play session is not available to save.');
  if (isSolved(solution, deserializeGrid(ownSession.entries as unknown as SerializedGrid))) {
    if (isSolved(solution, deserializeGrid(entries))) return;
    throw new Error('This puzzle is complete and cannot be edited.');
  }

  // The mutation independently guards publication and the authenticated pair.
  // The canonical solved JSON guard also blocks a solve committed by another
  // tab after the read above. Legacy saved JSON is checked by the engine above.
  const { count } = await prisma.playSession.updateMany({
    where: {
      userId: authSession.user.id, puzzleId: id, puzzle: { publishedAt: { not: null } },
      ...(isFull(solution) ? {
        NOT: { entries: { equals: serializeGrid(solution) as unknown as Prisma.InputJsonValue } },
      } : {}),
    },
    data: { entries: serializeGrid(deserializeGrid(entries)) as unknown as Prisma.InputJsonValue },
  });
  if (count === 0) throw new Error('Your play session is not available to save.');
}

export type PlayCompletionResult =
  | { status: 'incomplete' | 'incorrect' }
  | { status: 'complete'; entries: SerializedGrid; completedAt: Date };

/** Only the authenticated player's persisted snapshot can establish completion. */
export async function inspectPlayCompletion(id: string): Promise<PlayCompletionResult> {
  const authSession = await requireSession();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id, publishedAt: { not: null } },
    select: { grid: true },
  });
  if (!puzzle) throw new Error('This puzzle is not available to play.');
  const session = await prisma.playSession.findUnique({
    where: { userId_puzzleId: { userId: authSession.user.id, puzzleId: id } },
    select: playSessionSelect,
  });
  if (!session) throw new Error('Your play session is not available to check.');

  const entries = deserializeGrid(session.entries as unknown as SerializedGrid);
  if (!isFull(entries)) return { status: 'incomplete' };
  if (!isSolved(deserializeGrid(puzzle.grid as unknown as SerializedGrid), entries)) {
    return { status: 'incorrect' };
  }
  if (session.completedAt !== null) {
    return { status: 'complete', entries: serializeGrid(entries), completedAt: session.completedAt };
  }

  const snapshotGuard = {
    id: session.id, userId: authSession.user.id, puzzleId: id,
    puzzle: { publishedAt: { not: null } },
    entries: { equals: session.entries as Prisma.InputJsonValue },
  };
  const completedAt = new Date();
  const { count } = await prisma.playSession.updateMany({
    where: { ...snapshotGuard, completedAt: null },
    data: { completedAt },
  });
  if (count !== 0) return { status: 'complete', entries: serializeGrid(entries), completedAt };

  // A concurrent first inspection can win the stamp; return its first date
  // only if publication, identity and the exact inspected entries still match.
  const confirmed = await prisma.playSession.findFirst({
    where: { ...snapshotGuard, completedAt: { not: null } },
    select: { completedAt: true },
  });
  if (!confirmed?.completedAt) throw new Error('Your play session changed. Please try again.');
  return { status: 'complete', entries: serializeGrid(entries), completedAt: confirmed.completedAt };
}

export async function getDisplayName(): Promise<string | null> {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { displayName: true },
  });
  return user.displayName?.trim() ? user.displayName : null;
}

export async function saveDisplayName(input: {
  displayName: string;
}): Promise<{ displayName: string }> {
  const session = await requireSession();
  const validationMessage = displayNameValidationMessage(input?.displayName);
  if (validationMessage) throw new Error(validationMessage);
  const displayName = input.displayName.trim();
  const where = { id: session.user.id };
  const user = await prisma.user.findUniqueOrThrow({ where, select: { displayName: true } });
  if (user.displayName?.trim()) return { displayName: user.displayName };

  // Compare against the exact missing value read above, including legacy
  // whitespace. Only one concurrent prompt can replace that value.
  const { count } = await prisma.user.updateMany({
    where: { ...where, displayName: user.displayName },
    data: { displayName },
  });
  const saved = await prisma.user.findUniqueOrThrow({ where, select: { displayName: true } });
  if (!saved.displayName?.trim()) throw new Error('Could not save your builder name.');
  if (count > 0) revalidatePath('/puzzles');
  return { displayName: saved.displayName };
}

export async function createPuzzle(input: {
  title: string;
  size: PuzzleSize;
}): Promise<{ id: string }> {
  const session = await requireSession();
  const title = requireTitle(input.title);
  const stored = serializePuzzle(createBlankPuzzle(input.size));
  const record = await prisma.puzzle.create({
    data: {
      builderId: session.user.id,
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
    builderId: string;
    title: string;
    updatedAt: Date;
    phase: Phase;
    hintsComplete: boolean;
    publishedAt: Date | null;
    visibility: Visibility;
    cols: number;
    rows: number;
    black: boolean[][];
    /** The caller's own attempt; null for unpublished puzzles. */
    play: LibraryPlay | null;
  }[]
> {
  const authSession = await requireSession();
  // The caller's attempt comes from the same query, so the snapshot is atomic.
  const records = await prisma.puzzle.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      builderId: true,
      title: true,
      updatedAt: true,
      grid: true,
      hints: true,
      phase: true,
      publishedAt: true,
      visibility: true,
      playSessions: {
        where: { userId: authSession.user.id },
        select: { id: true, entries: true },
        take: 1,
      },
    },
  });

  return records.map((record) => {
    const grid = record.grid as unknown as SerializedGrid;
    const summary = summarizePuzzle({
      grid,
      hints: record.hints as Record<string, string>,
      phase: record.phase as Phase,
    });
    return {
      id: record.id,
      builderId: record.builderId,
      title: record.title,
      updatedAt: record.updatedAt,
      phase: summary.phase,
      hintsComplete: summary.hintsComplete,
      publishedAt: record.publishedAt,
      visibility: record.visibility as Visibility,
      cols: grid.cols,
      rows: grid.rows,
      black: grid.cells.map((row) => row.map((cell) => cell.kind === 'black')),
      play: record.publishedAt === null
        ? null
        : classifyLibraryPlay(grid, record.playSessions[0] ?? null),
    };
  });
}

/** Ownership and the published lock are checked by the write itself, so
 *  neither can change between a preliminary read and this mutation. */
async function updateUnlessPublished(
  id: string,
  builderId: string,
  action: string,
  data: Prisma.PuzzleUpdateManyMutationInput
): Promise<void> {
  const { count } = await prisma.puzzle.updateMany({ where: { id, builderId, publishedAt: null }, data });
  if (count === 0) {
    throw new Error(`${action}: puzzle ${id} cannot be edited`);
  }
}

export async function saveGrid(id: string, grid: SerializedGrid): Promise<void> {
  const session = await requireSession();
  await updateUnlessPublished(id, session.user.id, 'saveGrid', {
    grid: grid as unknown as Prisma.InputJsonValue,
  });
}

export async function saveHints(id: string, hints: Record<string, string>): Promise<void> {
  const session = await requireSession();
  await updateUnlessPublished(id, session.user.id, 'saveHints', {
    hints: hints as unknown as Prisma.InputJsonValue,
  });
}

export async function saveTitle(id: string, title: string): Promise<void> {
  const session = await requireSession();
  await updateUnlessPublished(id, session.user.id, 'saveTitle', { title: normalizeTitle(title) });
}

/** Loads the puzzle, transitions it to 'hints' phase via the engine's
 *  enterHintsPhase, persists the result (grid included -- the transition
 *  now converts empty cells to black, so the grid changes too), and
 *  returns the new phase, hints, and grid. */
export async function enterHints(
  id: string
): Promise<{ phase: Phase; hints: Record<string, string>; grid: SerializedGrid }> {
  const session = await requireSession();
  const puzzle = await loadPuzzle(id);
  if (!puzzle) {
    throw new Error(`enterHints: puzzle ${id} not found`);
  }

  const updated = enterHintsPhase(puzzle);
  const stored = serializePuzzle(updated);

  await updateUnlessPublished(id, session.user.id, 'enterHints', {
    grid: stored.grid as unknown as Prisma.InputJsonValue,
    hints: stored.hints as unknown as Prisma.InputJsonValue,
    phase: stored.phase,
    // Only written on the actual grid->hints crossing (Story H2) -- a
    // second call on an already-hints puzzle (enterHintsPhase is a
    // no-op then) must not overwrite the one snapshot of the original,
    // pre-conversion grid with the already-converted one.
    ...(puzzle.phase === 'grid'
      ? { gridBeforeHints: serializeGrid(puzzle.grid) as unknown as Prisma.InputJsonValue }
      : {}),
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
  const session = await requireSession();
  if (visibility !== 'private' && visibility !== 'public') {
    throw new Error(`publishPuzzle: invalid visibility ${JSON.stringify(visibility)}`);
  }

  const publishedAt = new Date();
  const { count } = await prisma.puzzle.updateMany({
    where: { id, builderId: session.user.id, phase: 'hints', publishedAt: null },
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
  const session = await requireSession();
  await prisma.puzzle.update({
    where: { id, builderId: session.user.id },
    data: { publishedAt: null },
  });
}

/** Permanently deletes the puzzle. No soft-delete, no tombstone. */
export async function deletePuzzle(id: string): Promise<void> {
  const session = await requireSession();
  await prisma.puzzle.delete({ where: { id, builderId: session.user.id } });
  revalidatePath('/puzzles');
}

export async function loadPuzzle(id: string): Promise<PuzzleWithMeta | null> {
  const session = await requireSession();
  const record = await prisma.puzzle.findUnique({ where: { id, builderId: session.user.id } });
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
