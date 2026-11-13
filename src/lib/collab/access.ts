import type { Prisma } from '@prisma/client';

/** Epic 24: the one "editable by" condition, placed in the commit path's
 *  own WHERE. Owner-only for now (`builderId`); S5 widens it here to
 *  collaborators. Wrap it in `AND` so a widened condition's `OR` can't
 *  collide with the caller's. */
export function editableBy(userId: string): Prisma.PuzzleWhereInput {
  return { builderId: userId };
}
