import { ownershipTestClient } from './ownership';

/**
 * Epic 24 (24-S6): reads for the collaborator-management browser tests,
 * straight from the isolated test database. Never imported by application
 * code.
 */
async function withClient<T>(work: (client: ReturnType<typeof ownershipTestClient>) => Promise<T>): Promise<T> {
  const client = ownershipTestClient();
  try {
    return await work(client);
  } finally {
    await client.$disconnect();
  }
}

/** An account's email and username. */
export function readUser(id: string): Promise<{ email: string; displayName: string | null }> {
  return withClient((client) => client.user.findUniqueOrThrow({ where: { id }, select: { email: true, displayName: true } }));
}

/** The puzzle's collaborators, by account ID, sorted. */
export async function readMembers(puzzleId: string): Promise<string[]> {
  const rows = await withClient((client) => client.puzzleCollaborator.findMany({ where: { puzzleId }, select: { userId: true } }));
  return rows.map((row) => row.userId).sort();
}

/** The puzzle's stored invitations, by address, sorted. */
export async function readInvitations(puzzleId: string): Promise<string[]> {
  const rows = await withClient((client) => client.puzzleInvitation.findMany({ where: { puzzleId }, select: { email: true } }));
  return rows.map((row) => row.email).sort();
}

/** The puzzle's owner, title and update time. */
export function readOwnerAndTitle(id: string): Promise<{ builderId: string; title: string; updatedAt: Date }> {
  return withClient((client) => client.puzzle.findUniqueOrThrow({ where: { id }, select: { builderId: true, title: true, updatedAt: true } }));
}

/** Marks the puzzle published, as its owner's Publish would. */
export async function markPublished(id: string): Promise<void> {
  await withClient((client) => client.puzzle.update({ where: { id }, data: { publishedAt: new Date(), visibility: 'private' } }));
}
