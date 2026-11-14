// Epic 24 (24-S7): who has a puzzle open. Each editor tab's catch-up is its
// heartbeat (`heartbeat`), keeping its row present for 15 s and writing at
// most about every 5 s; a hidden tab is away for 5 minutes (`markAway`); a
// closing tab leaves (`leave`). `presentBuilders` lists the other accounts
// present, once each, that can still edit the puzzle. The callers check
// that the caller can edit the puzzle; the database client is passed in, as
// for `commit.ts`.

import type { PrismaClient } from '@prisma/client';
import { editableBy } from './access';

/** A visible tab is present this long after its last heartbeat (EPIC:
 *  about 15 s). */
export const PRESENCE_WINDOW_MS = 15_000;
/** A heartbeat writes only once fewer than this are left: about every 5 s. */
export const PRESENCE_REFRESH_MS = 10_000;
/** A hidden tab stays present this long (24-S7 decision 4). */
export const AWAY_WINDOW_MS = 5 * 60_000;
/** Rows expired longer than this are deleted when a tab's row is created. */
export const PRUNE_AFTER_MS = 60 * 60_000;

/** A builder as the session panel names them. */
export interface Builder {
  readonly userId: string;
  readonly username: string | null;
}

const at = (now: Date, ms: number) => new Date(now.getTime() + ms);

/** The tab is present until 15 s from now. Writes only when its row is new
 *  or has fewer than 10 s left; a new row also prunes the puzzle's long
 *  expired ones. */
export async function heartbeat(db: PrismaClient, userId: string, puzzleId: string, clientId: string, now = new Date()): Promise<void> {
  const expiresAt = at(now, PRESENCE_WINDOW_MS);
  const refreshed = await db.puzzlePresence.updateMany({
    where: { puzzleId, clientId, userId, expiresAt: { lt: at(now, PRESENCE_REFRESH_MS) } },
    data: { expiresAt },
  });
  if (refreshed.count > 0) return;
  const created = await db.puzzlePresence.createMany({ data: { puzzleId, clientId, userId, expiresAt }, skipDuplicates: true });
  if (created.count === 0) return;
  await db.puzzlePresence.deleteMany({ where: { puzzleId, expiresAt: { lt: at(now, -PRUNE_AFTER_MS) } } });
}

/** The caller's tab is hidden: present for 5 minutes from now. */
export async function markAway(db: PrismaClient, userId: string, puzzleId: string, clientId: string, now = new Date()): Promise<void> {
  await db.puzzlePresence.updateMany({ where: { puzzleId, clientId, userId }, data: { expiresAt: at(now, AWAY_WINDOW_MS) } });
}

/** The caller's tab is closing. */
export async function leave(db: PrismaClient, userId: string, puzzleId: string, clientId: string): Promise<void> {
  await db.puzzlePresence.deleteMany({ where: { puzzleId, clientId, userId } });
}

/** The other accounts present at `now` that can still edit the puzzle,
 *  once each, by username then ID. */
export async function presentBuilders(db: PrismaClient, userId: string, puzzleId: string, now = new Date()): Promise<Builder[]> {
  const rows = await db.puzzlePresence.findMany({
    where: {
      puzzleId,
      expiresAt: { gt: now },
      userId: { not: userId },
      user: { OR: [{ puzzles: { some: { id: puzzleId } } }, { collaborations: { some: { puzzleId } } }] },
    },
    select: { userId: true, user: { select: { displayName: true } } },
  });
  const builders = new Map<string, Builder>();
  for (const row of rows) builders.set(row.userId, { userId: row.userId, username: row.user.displayName });
  return [...builders.values()].sort((a, b) =>
    (a.username ?? '').localeCompare(b.username ?? '') || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0));
}

/** Whether `userId` can edit the (unpublished or published) puzzle. */
export async function canEdit(db: PrismaClient, userId: string, puzzleId: string): Promise<boolean> {
  return (await db.puzzle.count({ where: { id: puzzleId, AND: [editableBy(userId)] } })) > 0;
}

const IDENTIFIER = /^[A-Za-z0-9_-]{1,100}$/;

/** A tab's ID from untrusted input, or null. */
export function parseClientId(value: unknown): string | null {
  return typeof value === 'string' && IDENTIFIER.test(value) ? value : null;
}

/** What a heartbeat's catch-up answer adds: who else is present, and who
 *  committed each operation returned (by `opId`, where the log knows). */
export interface SessionInfo {
  readonly present: readonly Builder[];
  readonly authors?: Readonly<Record<string, Builder>>;
}

/** Records the tab's heartbeat and reads the session: for a caller the
 *  catch-up has just found able to edit the unpublished puzzle. */
export async function readSession(
  db: PrismaClient, userId: string, puzzleId: string, clientId: string, opIds: readonly string[], now = new Date(),
): Promise<SessionInfo> {
  await heartbeat(db, userId, puzzleId, clientId, now);
  const present = await presentBuilders(db, userId, puzzleId, now);
  if (opIds.length === 0) return { present };
  const records = await db.puzzleOperation.findMany({
    where: { puzzleId, opId: { in: [...opIds] }, userId: { not: null } },
    select: { opId: true, userId: true, user: { select: { displayName: true } } },
  });
  const authors: Record<string, Builder> = {};
  for (const record of records) {
    if (record.userId) authors[record.opId] = { userId: record.userId, username: record.user?.displayName ?? null };
  }
  return { present, authors };
}

export type PresenceUpdate = { readonly status: 'ok' } | { readonly status: 'invalid' } | { readonly status: 'not-found' };

/** A tab going away (hidden) or leaving (closed), for `{ puzzleId,
 *  clientId, state }`: only the caller's own row of a puzzle they can edit. */
export async function updatePresence(db: PrismaClient, userId: string, input: unknown, now = new Date()): Promise<PresenceUpdate> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { status: 'invalid' };
  const { puzzleId, clientId, state } = input as Record<string, unknown>;
  const tab = parseClientId(clientId);
  if (typeof puzzleId !== 'string' || !IDENTIFIER.test(puzzleId) || tab === null || (state !== 'away' && state !== 'leave')) {
    return { status: 'invalid' };
  }
  if (!(await canEdit(db, userId, puzzleId))) return { status: 'not-found' };
  if (state === 'away') await markAway(db, userId, puzzleId, tab, now);
  else await leave(db, userId, puzzleId, tab);
  return { status: 'ok' };
}
