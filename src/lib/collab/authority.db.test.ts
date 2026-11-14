// 24-S5 acceptance: who may edit, on the commit path, the catch-up read and
// publishing, against PostgreSQL in a throwaway schema. A collaborator edits
// as the owner does, except Start Over and Publish; a stranger or a removed
// collaborator is refused. Each write carries the condition in its own WHERE:
// a removal landing between the authorizing read and the write, or a read
// that wrongly claimed authority, never lets the write through. Do not edit
// this file to match an implementation.
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Prisma, PrismaClient } from '@prisma/client';
import { createGrid, withLetter, type Grid } from '@/engine/grid';
import type { LockedWord } from '@/lib/locked-words';
import { serializeGrid, serializePuzzle, type SerializedGrid } from '@/lib/puzzle-storage';
import { createTestDatabase, type TestDatabase } from '@/test-support/database';
import { racing } from '@/test-support/racing';
import { readOperationsSince } from './catchup';
import { commitPuzzleOperation } from './commit';
import { publishPuzzleAt } from './publish';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  await db.client.user.createMany({ data: [
    { id: 'adam', name: 'Adam', email: 'adam@authority.example.test', displayName: 'Adam' },
    { id: 'jay', name: 'Jay', email: 'jay@authority.example.test', displayName: 'Jay' },
    { id: 'eve', name: 'Eve', email: 'eve@authority.example.test', displayName: 'Eve' },
  ] });
}, 60_000);
afterAll(async () => { await db?.drop(); });

function letters(grid: Grid, entries: Array<[number, number, string]>): Grid {
  return entries.reduce((next, [col, row, letter]) => withLetter(next, { col, row }, letter), grid);
}
/** CAT across the top of a 5×5, lockable. */
const CAT: LockedWord = { col: 0, row: 0, orientation: 'across', length: 3 };
const catGrid = letters(createGrid({ cols: 5, rows: 5 }), [[0, 0, 'C'], [1, 0, 'A'], [2, 0, 'T']]);
/** A 3×3 in Create Hints with every hint written: ready to publish. */
function readyPuzzle() {
  let grid = createGrid({ cols: 3, rows: 3 });
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) grid = withLetter(grid, { col, row }, 'A');
  const hints = { '1-across': 'a', '4-across': 'b', '5-across': 'c', '1-down': 'd', '2-down': 'e', '3-down': 'f' };
  return serializePuzzle({ grid, hints, phase: 'hints' });
}

async function seed(options: { grid?: SerializedGrid; hints?: Record<string, string>; phase?: string; lockedWords?: LockedWord[]; collaborators?: string[]; publishedAt?: Date } = {}) {
  const grid = options.grid ?? serializeGrid(catGrid, options.lockedWords);
  const id = (await db.client.puzzle.create({
    data: {
      builderId: 'adam', title: 'Shared', grid: grid as unknown as Prisma.InputJsonValue,
      hints: (options.hints ?? {}) as Prisma.InputJsonValue, phase: options.phase ?? 'grid',
      publishedAt: options.publishedAt ?? null,
    },
  })).id;
  for (const userId of options.collaborators ?? ['jay']) await db.client.puzzleCollaborator.create({ data: { puzzleId: id, userId } });
  return id;
}
async function row(id: string) {
  return db.client.puzzle.findUniqueOrThrow({ where: { id } });
}
async function log(id: string) {
  return db.client.puzzleOperation.findMany({ where: { puzzleId: id } });
}
async function op(puzzleId: string, body: Record<string, unknown>) {
  const { version, resetEpoch } = await row(puzzleId);
  return { opId: randomUUID(), puzzleId, clientId: 'tab', epoch: resetEpoch, baseVersion: version, ...body };
}
const removeJay = (puzzleId: string) => db.client.puzzleCollaborator.deleteMany({ where: { puzzleId, userId: 'jay' } });

/** A client whose puzzle reads ignore authority (by ID only) and report the
 *  caller as the owner: a read that wrongly authorized. Writes are real. */
function lying(client: PrismaClient, callerId: string): PrismaClient {
  const puzzle = new Proxy(client.puzzle, {
    get(target, key) {
      const value = Reflect.get(target, key);
      if (key === 'findFirst' || key === 'findUnique') {
        return async (args: { where: { id: string }; select?: Record<string, boolean> }) => {
          const found = await client.puzzle.findFirst({ ...args, where: { id: args.where.id } } as never) as Record<string, unknown> | null;
          return found && (!args.select || args.select.builderId) ? { ...found, builderId: callerId } : found;
        };
      }
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return new Proxy(client, {
    get(target, key) {
      if (key === 'puzzle') return puzzle;
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

describe('24-S5-4 the commit path', () => {
  it('a collaborator’s cells, hint, title, lock, unlock and Enter Hints are accepted', async () => {
    const id = await seed({ lockedWords: [CAT] });
    expect(await commitPuzzleOperation(db.client, 'jay', await op(id, { kind: 'cells', writes: [{ col: 0, row: 2, value: 'D' }] })))
      .toMatchObject({ status: 'accepted', version: 1 });
    expect(await commitPuzzleOperation(db.client, 'jay', await op(id, { kind: 'title', title: 'Jay’s title' })))
      .toMatchObject({ status: 'accepted', version: 2 });
    expect(await commitPuzzleOperation(db.client, 'jay', await op(id, { kind: 'unlock', word: CAT })))
      .toMatchObject({ status: 'accepted', version: 3 });
    expect(await commitPuzzleOperation(db.client, 'jay', await op(id, { kind: 'lock', word: CAT })))
      .toMatchObject({ status: 'accepted', version: 4 });
    expect(await commitPuzzleOperation(db.client, 'jay', await op(id, { kind: 'enterHints' })))
      .toMatchObject({ status: 'accepted', version: 5 });
    expect(await commitPuzzleOperation(db.client, 'jay', await op(id, { kind: 'hint', key: '1-across', text: 'Feline' })))
      .toMatchObject({ status: 'accepted', version: 6 });
    const after = await row(id);
    expect(after).toMatchObject({ title: 'Jay’s title', phase: 'hints', version: 6 });
    expect((after.hints as Record<string, string>)['1-across']).toBe('Feline');
    expect((await log(id)).every((record) => record.userId === 'jay')).toBe(true);
  });

  it('a collaborator’s Start Over is refused as owner-only, and recorded', async () => {
    const id = await seed();
    const reset = await op(id, { kind: 'startOver', keepLockedWords: false });
    expect(await commitPuzzleOperation(db.client, 'jay', reset)).toEqual({ status: 'refused', opId: reset.opId, code: 'owner' });
    expect(await row(id)).toMatchObject({ version: 0, resetEpoch: 0, grid: serializeGrid(catGrid) });
    expect(await log(id)).toEqual([expect.objectContaining({ opId: reset.opId, status: 'refused', code: 'owner', userId: 'jay' })]);
    // The owner's is accepted.
    expect(await commitPuzzleOperation(db.client, 'adam', await op(id, { kind: 'startOver', keepLockedWords: false })))
      .toMatchObject({ status: 'accepted', version: 1 });
  });

  it('a stranger and a removed collaborator get not-found, with nothing written or logged', async () => {
    const id = await seed();
    const before = await row(id);
    expect(await commitPuzzleOperation(db.client, 'eve', await op(id, { kind: 'title', title: 'Eve' }))).toEqual({ status: 'not-found' });
    await removeJay(id);
    expect(await commitPuzzleOperation(db.client, 'jay', await op(id, { kind: 'title', title: 'Jay' }))).toEqual({ status: 'not-found' });
    expect(await commitPuzzleOperation(db.client, 'jay', await op(id, { kind: 'cells', writes: [{ col: 0, row: 2, value: 'D' }] }))).toEqual({ status: 'not-found' });
    expect(await row(id)).toEqual(before);
    expect(await log(id)).toEqual([]);
  });

  it('a removal between the authorizing read and the write: not-found, nothing written', async () => {
    const id = await seed();
    const before = await row(id);
    const { client } = racing(db.client, 1, () => removeJay(id));
    expect(await commitPuzzleOperation(client, 'jay', await op(id, { kind: 'title', title: 'Too late' }))).toEqual({ status: 'not-found' });
    expect(await row(id)).toEqual(before);
    expect(await log(id)).toEqual([]);
  });

  it('a read that wrongly authorized never lets the write through', async () => {
    const id = await seed({ collaborators: [] });
    const before = await row(id);
    // A stranger whose read passed: the compare-and-swap's own editableBy.
    const edit = await commitPuzzleOperation(lying(db.client, 'eve'), 'eve', await op(id, { kind: 'title', title: 'Eve' }));
    expect(edit.status).not.toBe('accepted');
    // A collaborator whose read claimed ownership: Start Over's own ownedBy.
    await db.client.puzzleCollaborator.create({ data: { puzzleId: id, userId: 'jay' } });
    const reset = await commitPuzzleOperation(lying(db.client, 'jay'), 'jay', await op(id, { kind: 'startOver', keepLockedWords: false }));
    expect(reset.status).not.toBe('accepted');
    expect(await row(id)).toEqual(before);
    expect((await log(id)).filter((record) => record.status === 'accepted')).toEqual([]);
  });
});

describe('24-S5-5 the catch-up read', () => {
  it('a collaborator catches up; a stranger and a removed collaborator get not-found', async () => {
    const id = await seed();
    const first = await op(id, { kind: 'title', title: 'One' });
    await commitPuzzleOperation(db.client, 'adam', first);
    expect(await readOperationsSince(db.client, 'jay', { puzzleId: id, since: 0 }))
      .toEqual({ status: 'ops', ops: [{ ...first, version: 1 }] });
    expect(await readOperationsSince(db.client, 'jay', { puzzleId: id, since: null })).toMatchObject({ status: 'snapshot', version: 1 });
    expect(await readOperationsSince(db.client, 'eve', { puzzleId: id, since: 0 })).toEqual({ status: 'not-found' });
    await removeJay(id);
    for (const since of [0, 1, null]) {
      expect(await readOperationsSince(db.client, 'jay', { puzzleId: id, since }), String(since)).toEqual({ status: 'not-found' });
    }
  });

  it('a removal between the puzzle read and the log read returns no operation', async () => {
    const id = await seed();
    await commitPuzzleOperation(db.client, 'adam', await op(id, { kind: 'title', title: 'Secret' }));
    const { client } = racing(db.client, 1, () => removeJay(id));
    const answer = await readOperationsSince(client, 'jay', { puzzleId: id, since: 0 });
    expect(answer).toEqual({ status: 'not-found' });
    expect(JSON.stringify(answer)).not.toContain('Secret');
  });

  it('a published puzzle answers published with the puzzle as stored, whatever the version asked from', async () => {
    const stored = readyPuzzle();
    const publishedAt = new Date('2026-11-13T10:00:00Z');
    const id = await seed({ grid: stored.grid, hints: stored.hints, phase: 'hints', publishedAt });
    await db.client.puzzle.update({ where: { id }, data: { version: 3, resetEpoch: 1, visibility: 'public', title: 'Done' } });
    const expected = {
      status: 'published', version: 3, resetEpoch: 1, publishedAt, visibility: 'public',
      content: { grid: stored.grid, hints: stored.hints, title: 'Done', phase: 'hints' },
    };
    for (const since of [0, 2, 3, 9, null]) {
      expect(await readOperationsSince(db.client, 'jay', { puzzleId: id, since }), String(since)).toEqual(expected);
      expect(await readOperationsSince(db.client, 'adam', { puzzleId: id, since }), String(since)).toEqual(expected);
    }
    expect(await readOperationsSince(db.client, 'eve', { puzzleId: id, since: 0 })).toEqual({ status: 'not-found' });
  });
});

describe('24-S5-6 publishing', () => {
  it('a collaborator can’t publish: not-found, nothing published', async () => {
    const stored = readyPuzzle();
    const id = await seed({ grid: stored.grid, hints: stored.hints, phase: 'hints' });
    expect(await publishPuzzleAt(db.client, 'jay', { puzzleId: id, version: 0, visibility: 'public' })).toEqual({ status: 'not-found' });
    expect((await row(id)).publishedAt).toBeNull();
    expect(await publishPuzzleAt(db.client, 'adam', { puzzleId: id, version: 0, visibility: 'public' })).toMatchObject({ status: 'published' });
  });

  it('a read that wrongly authorized a collaborator publishes nothing', async () => {
    const stored = readyPuzzle();
    const id = await seed({ grid: stored.grid, hints: stored.hints, phase: 'hints' });
    const outcome = await publishPuzzleAt(lying(db.client, 'jay'), 'jay', { puzzleId: id, version: 0, visibility: 'public' });
    expect(outcome.status).not.toBe('published');
    expect(await row(id)).toMatchObject({ publishedAt: null, visibility: 'private' });
  });
});
