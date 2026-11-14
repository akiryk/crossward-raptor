import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { commitPuzzleOperation, type CommitOutcome } from '../../src/lib/collab/commit';
import type { OperationBody } from '../../src/lib/collab/operation';
import { ownershipTestClient } from './ownership';

/**
 * Epic 24 (24-S7): browser helpers for presence, the session panel and
 * conflicts. Commits an operation as a given account on the real commit
 * path (another builder's tab), and seeds further builders who are present
 * in a puzzle (their accounts, memberships and presence rows) straight in
 * the isolated test database. Never imported by application code.
 */
export async function commitAs(userId: string, puzzleId: string, body: OperationBody): Promise<CommitOutcome> {
  const client = ownershipTestClient();
  try {
    const row = await client.puzzle.findUniqueOrThrow({ where: { id: puzzleId } });
    const op = { opId: randomUUID(), puzzleId, clientId: `e2e-${randomUUID()}`, epoch: row.resetEpoch, baseVersion: row.version, ...body };
    return await commitPuzzleOperation(client, userId, op);
  } finally {
    await client.$disconnect();
  }
}

/** Adds a builder named `username` to the puzzle, present for ten minutes
 *  from now, as an open tab of theirs would be. Returns their account ID. */
export async function addPresentBuilder(puzzleId: string, username: string): Promise<string> {
  const client = ownershipTestClient();
  const userId = `e2e-s7-${randomUUID()}`;
  try {
    await client.user.create({ data: { id: userId, name: username, email: `${userId}@example.test`, displayName: username } });
    await client.puzzleCollaborator.create({ data: { puzzleId, userId } });
    await client.puzzlePresence.create({
      data: { puzzleId, userId, clientId: `e2e-${randomUUID()}`, expiresAt: new Date(Date.now() + 10 * 60_000) },
    });
    return userId;
  } finally {
    await client.$disconnect();
  }
}

/** The session panel's note texts, in order. */
export function noteTexts(page: Page) {
  return page.getByTestId('session-note-text');
}

/** Today as the panel's date heading reads it ("Nov 8, 2026"). */
export function todayHeading(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
