import type { Prisma } from '@prisma/client';

/** Epic 24: the one "editable by" condition: the owner or a collaborator
 *  (24-S5). It goes in the WHERE of every puzzle read and write that edits
 *  or opens a puzzle for editing (the commit path, the catch-up, the editor
 *  page, Duplicate, and with `ownedBy` the owner-only ones). Wrap it in
 *  `AND` so its `OR` can't collide with the caller's. */
export function editableBy(userId: string): Prisma.PuzzleWhereInput {
  return { OR: [{ builderId: userId }, { collaborators: { some: { userId } } }] };
}

/** Epic 24 (24-S2): the owner-only condition (Start Over, Publish, Delete,
 *  visibility, collaborators; D5, D7), placed in those reads' and writes'
 *  own WHERE alongside `editableBy`. */
export function ownedBy(userId: string): Prisma.PuzzleWhereInput {
  return { builderId: userId };
}
