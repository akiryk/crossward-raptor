// Epic 24 (24-S1, 24-S2): the commit path. Authorizes, deduplicates by `opId`,
// validates against the server's current state, then writes the puzzle
// row (compare-and-swap on `version`) and its log record in one
// transaction, retrying a lost race a bounded number of times. The
// database client is passed in, so the path runs against any schema.

import type { Prisma, PrismaClient } from '@prisma/client';
import type { Phase } from '@/engine/puzzle';
import type { SerializedGrid } from '@/lib/puzzle-storage';
import { editableBy, ownedBy } from './access';
import {
  applyOperation, epochAfter, gridBeforeHints, isOwnerOnly, validateOperation,
  type PuzzleContent, type PuzzleState, type RefusalCode,
} from './apply';
import { parseOperation, type Operation, type OperationBody } from './operation';

export type CommitOutcome =
  /** Committed as `version`; also what a resent `opId` returns. */
  | { readonly status: 'accepted'; readonly opId: string; readonly version: number }
  /** Refused for good; also what a resent `opId` returns. */
  | { readonly status: 'refused'; readonly opId: string; readonly code: RefusalCode }
  /** Lost the race every time; nothing written. Retry with the same `opId`. */
  | { readonly status: 'busy'; readonly opId: string }
  /** Malformed, or an `opId` already used for another puzzle or user. */
  | { readonly status: 'invalid' }
  /** No such puzzle that the caller can edit. */
  | { readonly status: 'not-found' };

export interface CommitOptions {
  /** The commit's time, recorded and used for pruning (default: now). */
  readonly now?: Date;
  /** Accepted records kept per puzzle, the newest ones (default 500). */
  readonly retainCount?: number;
  /** How long any record is kept, the newest accepted one excepted
   *  (default 24 h). */
  readonly retainMs?: number;
}

/** Attempts per commit: with n concurrent commits to a puzzle, one loses at
 *  most n − 1 races, so 5 always suffices for up to 5. */
export const MAX_ATTEMPTS = 5;
export const RETAIN_COUNT = 500;
export const RETAIN_MS = 24 * 60 * 60 * 1000;

class LostRace extends Error {}

type Db = PrismaClient | Prisma.TransactionClient;

const puzzleSelect = {
  grid: true, hints: true, title: true, phase: true, publishedAt: true, resetEpoch: true, version: true,
  builderId: true,
} as const;

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}

function body(op: Operation): OperationBody {
  switch (op.kind) {
    case 'cells': return { kind: op.kind, writes: op.writes };
    case 'hint': return { kind: op.kind, key: op.key, text: op.text };
    case 'title': return { kind: op.kind, title: op.title };
    case 'lock':
    case 'unlock': return { kind: op.kind, word: op.word };
    case 'enterHints': return { kind: op.kind };
    case 'startOver': return { kind: op.kind, keepLockedWords: op.keepLockedWords };
  }
}

/** The recorded outcome of a known `opId`, or null if there is none. */
async function recordedOutcome(db: Db, op: Operation, userId: string): Promise<CommitOutcome | null> {
  const record = await db.puzzleOperation.findUnique({
    where: { opId: op.opId },
    select: { puzzleId: true, userId: true, status: true, code: true, version: true },
  });
  if (!record) return null;
  if (record.puzzleId !== op.puzzleId || record.userId !== userId) return { status: 'invalid' };
  return record.status === 'accepted' && record.version !== null
    ? { status: 'accepted', opId: op.opId, version: record.version }
    : { status: 'refused', opId: op.opId, code: record.code as RefusalCode };
}

/** Whether the operation was made against a version older than the log
 *  keeps: its own record, if it was ever committed, could have been pruned,
 *  so applying it could apply it twice. The client reloads instead. */
async function isExpired(db: Db, op: Operation, version: number): Promise<boolean> {
  if (op.baseVersion >= version) return false;
  const oldest = await db.puzzleOperation.findFirst({
    where: { puzzleId: op.puzzleId, version: { not: null } },
    orderBy: { version: 'asc' },
    select: { version: true },
  });
  // Pruning always keeps the newest accepted record, so with none nothing
  // was ever pruned.
  if (!oldest || oldest.version === null) return false;
  return op.baseVersion < oldest.version - 1;
}

/** Keeps the last `retainCount` accepted records, and nothing older than
 *  `retainMs` except the newest accepted one. */
async function prune(db: Db, puzzleId: string, version: number, now: Date, options: CommitOptions) {
  const cutoff = new Date(now.getTime() - (options.retainMs ?? RETAIN_MS));
  await db.puzzleOperation.deleteMany({
    where: {
      puzzleId,
      OR: [
        { version: { lte: version - (options.retainCount ?? RETAIN_COUNT) } },
        { createdAt: { lt: cutoff }, version: null },
        { createdAt: { lt: cutoff }, version: { lt: version } },
      ],
    },
  });
}

function record(op: Operation, userId: string, now: Date) {
  return {
    puzzleId: op.puzzleId, opId: op.opId, userId, clientId: op.clientId,
    epoch: op.epoch, baseVersion: op.baseVersion,
    operation: body(op) as unknown as Prisma.InputJsonValue, createdAt: now,
  };
}

const json = (value: unknown) => value as Prisma.InputJsonValue;

function changedFields(op: Operation, state: PuzzleState, content: PuzzleContent): Prisma.PuzzleUpdateManyMutationInput {
  switch (op.kind) {
    case 'cells':
    case 'lock':
    case 'unlock': return { grid: json(content.grid) };
    case 'hint': return { hints: json(content.hints) };
    case 'title': return { title: content.title };
    // Accepted only from Build, so `gridBeforeHints` is written once, on
    // the one crossing into Hints (Story H2).
    case 'enterHints': return {
      grid: json(content.grid), hints: json(content.hints), phase: content.phase,
      gridBeforeHints: json(gridBeforeHints(state.grid)),
    };
    case 'startOver': return { grid: json(content.grid), resetEpoch: epochAfter(state.resetEpoch, op) };
  }
}

/** Commits one operation from `userId`, who must be able to edit the
 *  puzzle. Every accepted operation advances the puzzle's version by
 *  exactly one; nothing else changes it. */
export async function commitPuzzleOperation(
  db: PrismaClient,
  userId: string,
  input: unknown,
  options: CommitOptions = {}
): Promise<CommitOutcome> {
  const parsed = parseOperation(input);
  if (!parsed.ok) return { status: 'invalid' };
  const op = parsed.op;
  const now = options.now ?? new Date();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const puzzle = await db.puzzle.findFirst({
      where: { id: op.puzzleId, AND: [editableBy(userId)] },
      select: puzzleSelect,
    });
    if (!puzzle) return { status: 'not-found' };

    const known = await recordedOutcome(db, op, userId);
    if (known) return known;

    const state: PuzzleState = {
      grid: puzzle.grid as unknown as SerializedGrid,
      hints: puzzle.hints as Record<string, string>,
      title: puzzle.title,
      phase: puzzle.phase as Phase,
      resetEpoch: puzzle.resetEpoch,
      published: puzzle.publishedAt !== null,
    };
    const committer = { isOwner: puzzle.builderId === userId };
    const code = validateOperation(state, op, committer) ?? (await isExpired(db, op, puzzle.version) ? 'expired' : null);

    try {
      if (code) {
        await db.puzzleOperation.create({ data: { ...record(op, userId, now), status: 'refused', code } });
        await prune(db, op.puzzleId, puzzle.version, now, options);
        return { status: 'refused', opId: op.opId, code };
      }

      const { content, previous } = applyOperation(state, op);
      const version = puzzle.version + 1;
      await db.$transaction(async (tx) => {
        const { count } = await tx.puzzle.updateMany({
          where: {
            id: op.puzzleId, version: puzzle.version, resetEpoch: op.epoch, publishedAt: null,
            AND: [editableBy(userId), ...(isOwnerOnly(op.kind) ? [ownedBy(userId)] : [])],
          },
          data: { ...changedFields(op, state, content), version },
        });
        if (count === 0) throw new LostRace();
        await tx.puzzleOperation.create({
          data: {
            ...record(op, userId, now), status: 'accepted', version,
            previous: previous as unknown as Prisma.InputJsonValue,
          },
        });
        await prune(tx, op.puzzleId, version, now, options);
      });
      return { status: 'accepted', opId: op.opId, version };
    } catch (error) {
      if (error instanceof LostRace) continue;
      // A concurrent resend of this opId committed or was refused first.
      if (isUniqueViolation(error)) {
        const first = await recordedOutcome(db, op, userId);
        if (first) return first;
        continue;
      }
      throw error;
    }
  }
  return { status: 'busy', opId: op.opId };
}
