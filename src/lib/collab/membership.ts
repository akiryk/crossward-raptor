// Epic 24 (24-S5): collaborator membership. The owner adds a collaborator
// by email: an address that already has an account becomes a collaborator
// at once; any other is stored as an invitation for 30 days, claimed by the
// account whose current email matches. Membership is keyed by account, so
// an email or username change never removes access. Every owner check is
// the owner-only condition (`editableBy` and `ownedBy`) in the read's or
// delete's own WHERE; an insert has none, so the owner is read in its
// transaction (ownership never changes, and a deleted puzzle fails the
// insert's foreign key). The database client is passed in, as for
// `commit.ts`.

import type { Prisma, PrismaClient } from '@prisma/client';
import { editableBy, ownedBy } from './access';

/** An unclaimed invitation lasts this long, renewed by inviting again. */
export const INVITATION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const IDENTIFIER = /^[A-Za-z0-9_-]{1,100}$/;
const ADDRESS = /^[^\s@]+@[^\s@]+$/;

type Options = { readonly now?: Date };

/** An address as stored: trimmed and lowercased; null if it isn't one. */
export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  return email.length <= 254 && ADDRESS.test(email) ? email : null;
}

function record(input: unknown): Record<string, unknown> | null {
  return typeof input === 'object' && input !== null && !Array.isArray(input) ? input as Record<string, unknown> : null;
}

function puzzleIdOf(input: Record<string, unknown>): string | null {
  return typeof input.puzzleId === 'string' && IDENTIFIER.test(input.puzzleId) ? input.puzzleId : null;
}

/** The puzzle, if `ownerId` owns it. */
function owned(puzzleId: string, ownerId: string): Prisma.PuzzleWhereInput {
  return { id: puzzleId, AND: [editableBy(ownerId), ownedBy(ownerId)] };
}

const username = (displayName: string | null | undefined) => displayName?.trim() || null;

export type AddOutcome =
  /** The address has an account: now a collaborator (also if already). */
  | { readonly status: 'added'; readonly userId: string; readonly username: string | null }
  /** No account has it: an invitation until `expiresAt`. */
  | { readonly status: 'invited'; readonly email: string; readonly expiresAt: Date }
  /** The owner's own address. */
  | { readonly status: 'refused'; readonly code: 'owner' }
  | { readonly status: 'invalid' }
  /** No such puzzle that the caller owns. */
  | { readonly status: 'not-found' };

/** Adds a collaborator to `ownerId`'s puzzle by email (`{ puzzleId, email }`). */
export async function addCollaborator(db: PrismaClient, ownerId: string, input: unknown, options: Options = {}): Promise<AddOutcome> {
  const fields = record(input);
  const puzzleId = fields && puzzleIdOf(fields);
  const email = fields && normalizeEmail(fields.email);
  if (!puzzleId || !email) return { status: 'invalid' };
  const now = options.now ?? new Date();

  try {
    return await db.$transaction(async (tx): Promise<AddOutcome> => {
      const puzzle = await tx.puzzle.findFirst({ where: owned(puzzleId, ownerId), select: { builder: { select: { email: true } } } });
      if (!puzzle) return { status: 'not-found' };
      if (normalizeEmail(puzzle.builder.email) === email) return { status: 'refused', code: 'owner' };

      const account = await tx.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, displayName: true },
      });
      if (account) {
        if (account.id === ownerId) return { status: 'refused', code: 'owner' };
        await tx.puzzleCollaborator.createMany({ data: { puzzleId, userId: account.id }, skipDuplicates: true });
        await tx.puzzleInvitation.deleteMany({ where: { puzzleId, email, puzzle: owned(puzzleId, ownerId) } });
        return { status: 'added', userId: account.id, username: username(account.displayName) };
      }

      const expiresAt = new Date(now.getTime() + INVITATION_DAYS * DAY_MS);
      await tx.puzzleInvitation.upsert({
        where: { puzzleId_email: { puzzleId, email } },
        create: { puzzleId, email, createdAt: now, expiresAt },
        update: { createdAt: now, expiresAt },
      });
      return { status: 'invited', email, expiresAt };
    });
  } catch (error) {
    // The puzzle was deleted meanwhile: the insert's foreign key.
    if ((error as { code?: unknown } | null)?.code === 'P2003') return { status: 'not-found' };
    throw error;
  }
}

export type RemoveOutcome = { readonly status: 'removed' } | { readonly status: 'invalid' } | { readonly status: 'not-found' };

/** Removes one collaborator (`{ puzzleId, userId }`) from `ownerId`'s puzzle.
 *  Removing someone already gone is still `removed`. */
export async function removeCollaborator(db: PrismaClient, ownerId: string, input: unknown): Promise<RemoveOutcome> {
  const fields = record(input);
  const puzzleId = fields && puzzleIdOf(fields);
  const userId = fields && typeof fields.userId === 'string' && fields.userId.length > 0 && fields.userId.length <= 200 ? fields.userId : null;
  if (!puzzleId || !userId) return { status: 'invalid' };
  const { count } = await db.puzzleCollaborator.deleteMany({ where: { puzzleId, userId, puzzle: owned(puzzleId, ownerId) } });
  if (count > 0) return { status: 'removed' };
  return (await db.puzzle.count({ where: owned(puzzleId, ownerId) })) > 0 ? { status: 'removed' } : { status: 'not-found' };
}

export type RevokeOutcome = { readonly status: 'revoked' } | { readonly status: 'invalid' } | { readonly status: 'not-found' };

/** Revokes the invitation of an address (`{ puzzleId, email }`) to
 *  `ownerId`'s puzzle. Revoking one already gone is still `revoked`. */
export async function revokeInvitation(db: PrismaClient, ownerId: string, input: unknown): Promise<RevokeOutcome> {
  const fields = record(input);
  const puzzleId = fields && puzzleIdOf(fields);
  const email = fields && normalizeEmail(fields.email);
  if (!puzzleId || !email) return { status: 'invalid' };
  const { count } = await db.puzzleInvitation.deleteMany({ where: { puzzleId, email, puzzle: owned(puzzleId, ownerId) } });
  if (count > 0) return { status: 'revoked' };
  return (await db.puzzle.count({ where: owned(puzzleId, ownerId) })) > 0 ? { status: 'revoked' } : { status: 'not-found' };
}

export type CollaboratorList =
  | {
      readonly status: 'ok';
      /** By username, oldest first. No email: the owner never sees a
       *  collaborator's later address. */
      readonly collaborators: readonly { readonly userId: string; readonly username: string | null }[];
      /** Unexpired invitations, by address. */
      readonly invitations: readonly { readonly email: string; readonly expiresAt: Date }[];
    }
  | { readonly status: 'invalid' }
  | { readonly status: 'not-found' };

/** `ownerId`'s puzzle's collaborators and pending invitations (`{ puzzleId }`). */
export async function listCollaborators(db: PrismaClient, ownerId: string, input: unknown, options: Options = {}): Promise<CollaboratorList> {
  const fields = record(input);
  const puzzleId = fields && puzzleIdOf(fields);
  if (!puzzleId) return { status: 'invalid' };
  const now = options.now ?? new Date();
  const puzzle = await db.puzzle.findFirst({
    where: owned(puzzleId, ownerId),
    select: {
      collaborators: {
        orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }],
        select: { userId: true, user: { select: { displayName: true } } },
      },
      invitations: {
        where: { expiresAt: { gt: now } },
        orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
        select: { email: true, expiresAt: true },
      },
    },
  });
  if (!puzzle) return { status: 'not-found' };
  return {
    status: 'ok',
    collaborators: puzzle.collaborators.map(({ userId, user }) => ({ userId, username: username(user.displayName) })),
    invitations: puzzle.invitations,
  };
}

/** Claims, for the account `user`, every unexpired invitation to its
 *  current email: each becomes a membership (never of the account's own
 *  puzzle) and is deleted. Returns the number of memberships made. */
export async function claimInvitations(db: PrismaClient, user: { readonly id: string; readonly email: unknown }, options: Options = {}): Promise<number> {
  const email = normalizeEmail(user.email);
  if (!email) return 0;
  const now = options.now ?? new Date();
  return db.$transaction(async (tx) => {
    const invitations = await tx.puzzleInvitation.findMany({
      where: { email, expiresAt: { gt: now } },
      select: { id: true, puzzleId: true, puzzle: { select: { builderId: true } } },
    });
    if (invitations.length === 0) return 0;
    const data = invitations
      .filter((invitation) => invitation.puzzle.builderId !== user.id)
      .map(({ puzzleId }) => ({ puzzleId, userId: user.id }));
    const { count } = data.length > 0
      ? await tx.puzzleCollaborator.createMany({ data, skipDuplicates: true })
      : { count: 0 };
    await tx.puzzleInvitation.deleteMany({ where: { id: { in: invitations.map((invitation) => invitation.id) } } });
    return count;
  });
}
