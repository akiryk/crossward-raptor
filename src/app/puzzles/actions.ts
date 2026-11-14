'use server';

import { revalidatePath } from 'next/cache';
import type { PlaySession, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/require-session';
import {
  createBlankPuzzle,
  deserializeGrid,
  deserializeLockedWords,
  deserializePuzzle,
  serializeGrid,
  serializePuzzle,
  type SerializedGrid,
} from '@/lib/puzzle-storage';
import type { Puzzle, Phase } from '@/engine/puzzle';
import { requireTitle } from '@/lib/puzzle-title';
import { summarizePuzzle } from '@/lib/puzzle-summary';
import type { PuzzleSize } from '@/lib/puzzle-size';
import type { LockedWord } from '@/lib/locked-words';
import { clearLetters } from '@/engine/grid';
import { isCompatiblePlayEntries } from '@/lib/play-entries';
import { isFull, isSolved } from '@/engine/play';
import { classifyLibraryPlay, type LibraryPlay } from '@/lib/library-play';
import { commitPuzzleOperation, type CommitOutcome } from '@/lib/collab/commit';
import { publishPuzzleAt, type PublishOutcome } from '@/lib/collab/publish';
import { readOperationsSince, type CatchUp } from '@/lib/collab/catchup';
import { editableBy, ownedBy } from '@/lib/collab/access';
import * as membership from '@/lib/collab/membership';

export type Visibility = 'private' | 'public';

export type PuzzleWithMeta = Puzzle & {
  /** The build phase's locked words, stored with the grid (21-S2). */
  lockedWords: LockedWord[];
  id: string;
  title: string;
  publishedAt: Date | null;
  visibility: Visibility;
  /** 24-S3: the version and reset epoch the editor's confirmed state
   *  starts from. */
  version: number;
  resetEpoch: number;
  /** 24-S5: whether the caller owns it (else a collaborator). */
  isOwner: boolean;
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
    /** The builder's trimmed username, or null when blank. */
    builderName: string | null;
  }[]
> {
  const authSession = await requireSession();
  // The caller's attempt comes from the same query, so the snapshot is atomic.
  // Another builder's unlisted puzzle is listed only once the caller has started it.
  const records = await prisma.puzzle.findMany({
    where: {
      OR: [
        { builderId: authSession.user.id },
        { publishedAt: { not: null }, visibility: 'public' },
        { publishedAt: { not: null }, playSessions: { some: { userId: authSession.user.id } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      builder: { select: { displayName: true } },
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
      builderName: record.builder?.displayName?.trim() || null,
    };
  });
}

/** Epic 24 (24-S1): commits one operation as the signed-in builder. The
 *  account comes from the session, never the input. The editor sends
 *  through this (24-S3); a page being left sends through the route handler at
 *  `/api/puzzles/[id]/operations`. */
export async function commitOperation(input: unknown): Promise<CommitOutcome> {
  const session = await requireSession();
  return commitPuzzleOperation(prisma, session.user.id, input);
}

/** Epic 24 (24-S4): what the signed-in builder's editor needs to catch up
 *  from the version its confirmed state is at (`{ puzzleId, since }`):
 *  the operations committed since, in order, or the puzzle as stored. The
 *  editor polls it through the route handler at
 *  `/api/puzzles/[id]/operations` (GET), so a poll never waits behind a
 *  commit in Next.js's queue of server actions. */
export async function catchUpOperations(input: unknown): Promise<CatchUp> {
  const session = await requireSession();
  return readOperationsSince(prisma, session.user.id, input);
}

/** Epic 24 (24-S2): publishes the signed-in owner's puzzle only if it is
 *  still at the version their readiness check saw (`{ puzzleId, version,
 *  visibility }`); otherwise a refusal the Publish dialog can show. The
 *  account comes from the session. The Publish dialog calls this (24-S3). */
export async function publishAtVersion(input: unknown): Promise<PublishOutcome> {
  const session = await requireSession();
  return publishPuzzleAt(prisma, session.user.id, input);
}

/** Story 16-S2: switches the caller's published puzzle between unlisted and
 *  public. Only `visibility` changes: `updatedAt` is written back with its
 *  own value (overriding `@updatedAt`), so the row's date and place don't
 *  move. Ownership and publication are in the write's own condition, with
 *  the `updatedAt` just read, so a concurrent write makes it match nothing
 *  rather than roll that stamp back. Every refusal throws the same error. */
export async function setPuzzleVisibility(
  id: string,
  visibility: Visibility
): Promise<{ visibility: Visibility }> {
  const session = await requireSession();
  if (visibility !== 'private' && visibility !== 'public') {
    throw new Error(`setPuzzleVisibility: invalid visibility ${JSON.stringify(visibility)}`);
  }

  const notAllowed = new Error(`setPuzzleVisibility: puzzle ${id} cannot change visibility`);
  const owned = { id, AND: [editableBy(session.user.id), ownedBy(session.user.id)], publishedAt: { not: null } };
  const record = await prisma.puzzle.findUnique({ where: owned, select: { updatedAt: true } });
  if (!record) throw notAllowed;

  const { count } = await prisma.puzzle.updateMany({
    where: { ...owned, updatedAt: record.updatedAt },
    data: { visibility, updatedAt: record.updatedAt },
  });
  if (count === 0) throw notAllowed;

  revalidatePath('/puzzles');
  return { visibility };
}

/** Story 16-S4: copies the caller's stored puzzle into a new unpublished one
 *  of theirs, never from client state. Publication, visibility and dates
 *  take their defaults; play sessions aren't copied and the source isn't
 *  written. Another builder's puzzle and a missing one throw the same error. */
export async function duplicatePuzzle(id: string): Promise<{ id: string }> {
  const session = await requireSession();
  // 24-S5: a collaborator may duplicate too (D6); the copy is theirs alone.
  const source = await prisma.puzzle.findUnique({
    where: { id, AND: [editableBy(session.user.id)] },
    select: { title: true, grid: true, hints: true, phase: true, gridBeforeHints: true },
  });
  if (!source) throw new Error(`duplicatePuzzle: puzzle ${id} cannot be duplicated`);

  const record = await prisma.puzzle.create({
    data: {
      builderId: session.user.id,
      title: `${source.title} (copy)`,
      grid: source.grid as Prisma.InputJsonValue,
      hints: source.hints as Prisma.InputJsonValue,
      phase: source.phase,
      // Omitted when null, which stores a database null (not a JSON null).
      ...(source.gridBeforeHints !== null && { gridBeforeHints: source.gridBeforeHints as Prisma.InputJsonValue }),
    },
    select: { id: true },
  });
  revalidatePath('/puzzles');
  return { id: record.id };
}

/** Permanently deletes the puzzle. No soft-delete, no tombstone. */
export async function deletePuzzle(id: string): Promise<void> {
  const session = await requireSession();
  // 24-S5: owner-only; memberships and invitations go with it.
  await prisma.puzzle.delete({ where: { id, AND: [editableBy(session.user.id), ownedBy(session.user.id)] } });
  revalidatePath('/puzzles');
}

export async function loadPuzzle(id: string): Promise<PuzzleWithMeta | null> {
  const session = await requireSession();
  // 24-S5: the owner or a collaborator.
  const record = await prisma.puzzle.findUnique({ where: { id, AND: [editableBy(session.user.id)] } });
  if (!record) return null;

  const puzzle = deserializePuzzle({
    grid: record.grid as unknown as SerializedGrid,
    hints: record.hints as Record<string, string>,
    phase: record.phase as Puzzle['phase'],
  });

  return {
    ...puzzle,
    lockedWords: deserializeLockedWords(record.grid as unknown as SerializedGrid),
    id: record.id,
    title: record.title,
    publishedAt: record.publishedAt,
    visibility: record.visibility as Visibility,
    version: record.version,
    resetEpoch: record.resetEpoch,
    isOwner: record.builderId === session.user.id,
  };
}

/** Epic 24 (24-S5): adds a collaborator to the signed-in owner's puzzle by
 *  email (`{ puzzleId, email }`): at once for an address with an account,
 *  otherwise an invitation. The owner is the session's account. */
export async function addCollaborator(input: unknown): Promise<membership.AddOutcome> {
  const session = await requireSession();
  return membership.addCollaborator(prisma, session.user.id, input);
}

/** Epic 24 (24-S5): removes a collaborator (`{ puzzleId, userId }`). */
export async function removeCollaborator(input: unknown): Promise<membership.RemoveOutcome> {
  const session = await requireSession();
  return membership.removeCollaborator(prisma, session.user.id, input);
}

/** Epic 24 (24-S5): revokes an invitation (`{ puzzleId, email }`). */
export async function revokeInvitation(input: unknown): Promise<membership.RevokeOutcome> {
  const session = await requireSession();
  return membership.revokeInvitation(prisma, session.user.id, input);
}

/** Epic 24 (24-S5): the owner's view of a puzzle's collaborators and
 *  pending invitations (`{ puzzleId }`). */
export async function listCollaborators(input: unknown): Promise<membership.CollaboratorList> {
  const session = await requireSession();
  return membership.listCollaborators(prisma, session.user.id, input);
}

/** Epic 24 (24-S5): claims the invitations to the signed-in account's
 *  current email. The editor page and the library call it before reading. */
export async function claimInvitations(): Promise<number> {
  const session = await requireSession();
  return membership.claimInvitations(prisma, { id: session.user.id, email: session.user.email });
}
