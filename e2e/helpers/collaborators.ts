import type { Browser, BrowserContext, Page } from '@playwright/test';
import { COLLABORATOR_ID, ensureCollaborator, ownershipTestClient } from './ownership';

/**
 * Epic 24 (24-S5): two-user browser helpers. A browser context signed in as
 * the second seeded account, "Jay" (`e2e/auth.setup.ts`), and Jay's
 * membership of a puzzle written or removed straight in the isolated test
 * database (S6 adds the way to invite). Deleting a puzzle the same way
 * stands in for its owner deleting it. Never imported by application code.
 */
export async function collaboratorContext(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    storageState: 'e2e/.auth/collaborator.json',
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  return { context, page: await context.newPage() };
}

/** Makes Jay a collaborator of the puzzle. */
export async function addJay(puzzleId: string): Promise<void> {
  const client = ownershipTestClient();
  try {
    await ensureCollaborator(client);
    await client.puzzleCollaborator.createMany({ data: { puzzleId, userId: COLLABORATOR_ID }, skipDuplicates: true });
  } finally {
    await client.$disconnect();
  }
}

/** Removes Jay from the puzzle, as its owner would. */
export async function removeJay(puzzleId: string): Promise<void> {
  const client = ownershipTestClient();
  try {
    await client.puzzleCollaborator.deleteMany({ where: { puzzleId, userId: COLLABORATOR_ID } });
  } finally {
    await client.$disconnect();
  }
}

/** Deletes the puzzle, as its owner would. */
export async function deletePuzzleRow(puzzleId: string): Promise<void> {
  const client = ownershipTestClient();
  try {
    await client.puzzle.deleteMany({ where: { id: puzzleId } });
  } finally {
    await client.$disconnect();
  }
}
