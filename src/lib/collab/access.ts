import type { Prisma } from '@prisma/client';

/** Epic 24: the one "editable by" condition, placed in the commit path's
 *  own WHERE. Owner-only for now (`builderId`); S5 widens it here to
 *  collaborators. Wrap it in `AND` so a widened condition's `OR` can't
 *  collide with the caller's. */
export function editableBy(userId: string): Prisma.PuzzleWhereInput {
  return { builderId: userId };
}

/** Epic 24 (24-S2): the owner-only condition (Start Over, Publish; D5, D7),
 *  placed in those writes' own WHERE alongside `editableBy`. It stays the
 *  owner when S5 widens `editableBy`. */
export function ownedBy(userId: string): Prisma.PuzzleWhereInput {
  return { builderId: userId };
}
