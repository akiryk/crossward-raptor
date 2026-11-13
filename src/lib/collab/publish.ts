// Epic 24 (24-S2): publishing pinned to the version the owner's readiness
// check saw (D7). Publishing isn't an operation: it has no `opId`, makes no
// log record and doesn't advance the version. Once published, the commit
// path refuses every operation (`published`). The database client is passed
// in, as for `commit.ts`.

import type { Prisma, PrismaClient } from '@prisma/client';
import { hintsComplete } from '@/engine/hints';
import type { Phase } from '@/engine/puzzle';
import { deserializePuzzle, type SerializedGrid } from '@/lib/puzzle-storage';
import { editableBy, ownedBy } from './access';

export type PublishVisibility = 'private' | 'public';

/** Why publishing was refused; nothing was written.
 *  - `stale`: the puzzle changed since the version the readiness check saw.
 *  - `published`: already published (at an earlier version than given).
 *  - `phase`: still in Build.
 *  - `incomplete`: a required hint is missing. */
export type PublishRefusal = 'stale' | 'published' | 'phase' | 'incomplete';

export type PublishOutcome =
  /** Published as of `version`. Also the answer to a repeat at the version
   *  it was published at, with the stored date and visibility. */
  | { readonly status: 'published'; readonly publishedAt: Date; readonly visibility: PublishVisibility; readonly version: number }
  | { readonly status: 'refused'; readonly code: PublishRefusal }
  /** Malformed input. */
  | { readonly status: 'invalid' }
  /** No such puzzle that the caller owns. */
  | { readonly status: 'not-found' };

interface PublishInput {
  readonly puzzleId: string;
  /** The version the owner's readiness check saw. */
  readonly version: number;
  readonly visibility: PublishVisibility;
}

const IDENTIFIER = /^[A-Za-z0-9_-]{1,100}$/;

function parse(input: unknown): PublishInput | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const { puzzleId, version, visibility } = input as Record<string, unknown>;
  if (typeof puzzleId !== 'string' || !IDENTIFIER.test(puzzleId)) return null;
  if (typeof version !== 'number' || !Number.isSafeInteger(version) || version < 0) return null;
  if (visibility !== 'private' && visibility !== 'public') return null;
  return { puzzleId, version, visibility };
}

/** A lost race is read again, so its refusal names what changed. */
const ATTEMPTS = 2;

/** Publishes the puzzle if it is still at `version`, in Hints, unpublished,
 *  with every required hint written, and `userId` owns it. Each condition
 *  is repeated in the write's own WHERE (the hints by value, as a snapshot
 *  save at version 0 doesn't advance the version), so nothing can change
 *  between the check and the write. */
export async function publishPuzzleAt(
  db: PrismaClient,
  userId: string,
  input: unknown,
  options: { readonly now?: Date } = {}
): Promise<PublishOutcome> {
  const parsed = parse(input);
  if (!parsed) return { status: 'invalid' };
  const { puzzleId, version, visibility } = parsed;
  const owned = { id: puzzleId, AND: [editableBy(userId), ownedBy(userId)] };

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const puzzle = await db.puzzle.findFirst({
      where: owned,
      select: { grid: true, hints: true, phase: true, version: true, publishedAt: true, visibility: true },
    });
    if (!puzzle) return { status: 'not-found' };

    if (puzzle.publishedAt) {
      return puzzle.version === version
        ? { status: 'published', publishedAt: puzzle.publishedAt, visibility: puzzle.visibility as PublishVisibility, version }
        : { status: 'refused', code: 'published' };
    }
    if (puzzle.version !== version) return { status: 'refused', code: 'stale' };
    if (puzzle.phase !== 'hints') return { status: 'refused', code: 'phase' };
    const complete = hintsComplete(deserializePuzzle({
      grid: puzzle.grid as unknown as SerializedGrid,
      hints: puzzle.hints as Record<string, string>,
      phase: puzzle.phase as Phase,
    }));
    if (!complete) return { status: 'refused', code: 'incomplete' };

    const publishedAt = options.now ?? new Date();
    const { count } = await db.puzzle.updateMany({
      where: {
        ...owned, version, phase: 'hints', publishedAt: null,
        hints: { equals: puzzle.hints as Prisma.InputJsonValue },
      },
      data: { publishedAt, visibility },
    });
    if (count === 1) return { status: 'published', publishedAt, visibility, version };
  }
  return { status: 'refused', code: 'stale' };
}
