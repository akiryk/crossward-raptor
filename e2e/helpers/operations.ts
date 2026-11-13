import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { commitPuzzleOperation, type CommitOutcome } from '../../src/lib/collab/commit';
import type { SerializedGrid } from '../../src/lib/puzzle-storage';
import { ownershipTestClient } from './ownership';

/**
 * Epic 24 (24-S3): reads a puzzle's version, content and operation log
 * straight from the isolated test database, and commits an operation as
 * another tab of the same builder would (the real commit path, another
 * clientId), for browser tests of what the editor does when the server has
 * moved on. Never imported by application code.
 */
export async function readSaved(id: string) {
  const client = ownershipTestClient();
  try {
    const row = await client.puzzle.findUniqueOrThrow({ where: { id } });
    const log = await client.puzzleOperation.findMany({ where: { puzzleId: id }, orderBy: { createdAt: 'asc' } });
    return {
      version: row.version,
      resetEpoch: row.resetEpoch,
      phase: row.phase,
      title: row.title,
      grid: row.grid as unknown as SerializedGrid,
      hints: row.hints as Record<string, string>,
      publishedAt: row.publishedAt,
      log: log.map((record) => ({
        opId: record.opId, status: record.status, code: record.code, version: record.version,
        kind: (record.operation as { kind: string }).kind, operation: record.operation,
      })),
    };
  } finally {
    await client.$disconnect();
  }
}

/** The letters of a saved row, '.' for empty and '#' for black. */
export function savedRow(grid: SerializedGrid, row: number): string {
  return grid.cells[row].map((cell) => (cell.kind === 'black' ? '#' : cell.letter ?? '.')).join('');
}

/** Commits an operation from another tab of the puzzle's builder. */
export async function commitFromElsewhere(
  puzzleId: string,
  body: Record<string, unknown>,
  envelope: { epoch?: number; baseVersion?: number } = {}
): Promise<CommitOutcome> {
  const client = ownershipTestClient();
  try {
    const row = await client.puzzle.findUniqueOrThrow({ where: { id: puzzleId }, select: { builderId: true, version: true, resetEpoch: true } });
    return await commitPuzzleOperation(client, row.builderId, {
      opId: randomUUID(), puzzleId, clientId: 'other-tab',
      epoch: envelope.epoch ?? row.resetEpoch, baseVersion: envelope.baseVersion ?? row.version, ...body,
    });
  } finally {
    await client.$disconnect();
  }
}

/** The journal entries the page holds for the puzzle. */
export async function journalEntries(page: Page, puzzleId: string): Promise<string[]> {
  return page.evaluate((id) => Object.keys(localStorage).filter((key) => key.startsWith(`crossward:journal:v1:${id}:`)), puzzleId);
}

/** Whether a request is the editor's server action (not a page load). */
export function isAction(request: { method(): string; headers(): Record<string, string> }): boolean {
  return request.method() === 'POST' && request.headers()['next-action'] !== undefined;
}
