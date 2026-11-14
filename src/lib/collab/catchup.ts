// Epic 24 (24-S4): the catch-up read. An open editor asks for the operations
// committed since the version its confirmed state is at, and applies them in
// order. When the log can't give every one of them (pruned past its
// retention, or more than a page behind), or when asked for it, the answer
// is the puzzle as stored instead: the snapshot the editor reloads from. The
// database client is passed in, as for `commit.ts`.

import type { PrismaClient } from '@prisma/client';
import type { Phase } from '@/engine/puzzle';
import type { SerializedGrid } from '@/lib/puzzle-storage';
import { editableBy } from './access';
import type { PuzzleContent } from './apply';
import { parseOperation, type Operation } from './operation';

/** An accepted operation as the log holds it, with the version it was
 *  committed as. */
export type CommittedOperation = Operation & { readonly version: number };

export type CatchUp =
  /** Every operation committed after `since`, in version order (none when
   *  the editor is current). */
  | { readonly status: 'ops'; readonly ops: readonly CommittedOperation[] }
  /** The puzzle as stored, at `version`. */
  | {
      readonly status: 'snapshot';
      readonly version: number;
      readonly resetEpoch: number;
      readonly content: PuzzleContent;
    }
  /** 24-S5: the puzzle is published, so it can't be edited any more: the
   *  puzzle as stored, and its publication. Whatever `since` is. */
  | {
      readonly status: 'published';
      readonly version: number;
      readonly resetEpoch: number;
      readonly content: PuzzleContent;
      readonly publishedAt: Date;
      readonly visibility: 'private' | 'public';
    }
  /** Malformed input. */
  | { readonly status: 'invalid' }
  /** No such puzzle that the caller can edit. */
  | { readonly status: 'not-found' };

/** More operations behind than this, and a snapshot is cheaper. */
export const CATCH_UP_LIMIT = 200;

const IDENTIFIER = /^[A-Za-z0-9_-]{1,100}$/;

interface CatchUpInput {
  readonly puzzleId: string;
  /** The version the caller's confirmed state is at; null asks for the
   *  snapshot. */
  readonly since: number | null;
}

function parse(input: unknown): CatchUpInput | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const { puzzleId, since } = input as Record<string, unknown>;
  if (typeof puzzleId !== 'string' || !IDENTIFIER.test(puzzleId)) return null;
  if (since === null || since === undefined) return { puzzleId, since: null };
  if (typeof since !== 'number' || !Number.isSafeInteger(since) || since < 0) return null;
  return { puzzleId, since };
}

async function snapshot(db: PrismaClient, userId: string, puzzleId: string): Promise<CatchUp> {
  const row = await db.puzzle.findFirst({
    where: { id: puzzleId, AND: [editableBy(userId)] },
    select: {
      grid: true, hints: true, title: true, phase: true, version: true, resetEpoch: true,
      publishedAt: true, visibility: true,
    },
  });
  if (!row) return { status: 'not-found' };
  const stored = {
    version: row.version,
    resetEpoch: row.resetEpoch,
    content: {
      grid: row.grid as unknown as SerializedGrid,
      hints: row.hints as Record<string, string>,
      title: row.title,
      phase: row.phase as Phase,
    },
  };
  if (row.publishedAt) {
    return { status: 'published', ...stored, publishedAt: row.publishedAt, visibility: row.visibility === 'public' ? 'public' : 'private' };
  }
  return { status: 'snapshot', ...stored };
}

/** What `userId`, who must be able to edit the puzzle, needs to catch up
 *  from `since`. When nothing has been committed since (the usual answer),
 *  it reads only the puzzle's version and publication. */
export async function readOperationsSince(
  db: PrismaClient,
  userId: string,
  input: unknown,
  options: { readonly limit?: number } = {}
): Promise<CatchUp> {
  const parsed = parse(input);
  if (!parsed) return { status: 'invalid' };
  const { puzzleId, since } = parsed;
  if (since === null) return snapshot(db, userId, puzzleId);

  const puzzle = await db.puzzle.findFirst({
    where: { id: puzzleId, AND: [editableBy(userId)] },
    select: { version: true, publishedAt: true },
  });
  if (!puzzle) return { status: 'not-found' };
  // 24-S5: a published puzzle is answered as such, with the puzzle as stored.
  if (puzzle.publishedAt) return snapshot(db, userId, puzzleId);
  if (since === puzzle.version) return { status: 'ops', ops: [] };
  const limit = options.limit ?? CATCH_UP_LIMIT;
  if (since > puzzle.version || puzzle.version - since > limit) return snapshot(db, userId, puzzleId);

  // 24-S5: authorized in its own WHERE too, so a removal after the read
  // above returns nothing (and the snapshot read then answers not-found).
  const records = await db.puzzleOperation.findMany({
    where: { puzzleId, version: { gt: since, lte: puzzle.version }, puzzle: { AND: [editableBy(userId)] } },
    orderBy: { version: 'asc' },
    select: { version: true, opId: true, clientId: true, epoch: true, baseVersion: true, operation: true },
  });
  const ops: CommittedOperation[] = [];
  for (const [index, record] of records.entries()) {
    // Contiguous from `since`, or pruned: then the snapshot.
    if (record.version !== since + 1 + index) return snapshot(db, userId, puzzleId);
    const parsedOp = parseOperation({
      ...(record.operation as Record<string, unknown>),
      opId: record.opId, puzzleId, clientId: record.clientId, epoch: record.epoch, baseVersion: record.baseVersion,
    });
    if (!parsedOp.ok) return snapshot(db, userId, puzzleId);
    ops.push({ ...parsedOp.op, version: record.version });
  }
  if (ops.length !== puzzle.version - since) return snapshot(db, userId, puzzleId);
  return { status: 'ops', ops };
}
