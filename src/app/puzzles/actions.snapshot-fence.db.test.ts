// 24-S1 acceptance: the snapshot fence ("Retiring snapshot saves"). The real
// actions against PostgreSQL (a throwaway schema), signed in as the owner.
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { createGrid, withLetter } from '@/engine/grid';
import { serializeGrid, serializePuzzle, type SerializedGrid } from '@/lib/puzzle-storage';
import { createTestDatabase, type TestDatabase } from '@/test-support/database';

const holder = vi.hoisted(() => ({ client: undefined as unknown, session: null as unknown }));
vi.mock('@/lib/prisma', () => ({
  prisma: new Proxy({}, {
    get(_target, key) {
      const client = holder.client as Record<PropertyKey, unknown>;
      const value = Reflect.get(client, key);
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }),
}));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: async () => holder.session } } }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('next/cache', () => ({ revalidatePath: () => undefined }));

import * as actions from './actions';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  holder.client = db.client;
  await db.client.user.create({ data: { id: 'adam', name: 'Adam', email: 'adam@fence.example.test', displayName: 'Adam' } });
}, 60_000);
afterAll(async () => { await db?.drop(); });
beforeEach(() => { holder.session = { user: { id: 'adam', displayName: 'Adam' }, session: {} }; });

/** A 2×2 with every cell lettered: in Hints it needs four hints. */
const full = [[0, 0, 'A'], [1, 0, 'B'], [0, 1, 'C'], [1, 1, 'D']] as const;
const grid = full.reduce((next, [col, row, letter]) => withLetter(next, { col, row }, letter), createGrid({ cols: 2, rows: 2 }));
const stored = serializePuzzle({ grid, hints: {}, phase: 'grid' });
const COMPLETE = { '1-across': 'One', '3-across': 'Three', '1-down': 'Down one', '2-down': 'Down two' };
const changedGrid: SerializedGrid = serializeGrid(withLetter(grid, { col: 0, row: 0 }, 'Z'));

async function seed(phase: 'grid' | 'hints', hints: Record<string, string> = {}) {
  const row = await db.client.puzzle.create({
    data: {
      builderId: 'adam', title: 'Fenced', grid: stored.grid as unknown as Prisma.InputJsonValue,
      hints, phase, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'),
    },
  });
  return row.id;
}
const row = (id: string) => db.client.puzzle.findUniqueOrThrow({ where: { id } });

/** Moves the puzzle off version 0 the way S3's editor will: a committed operation. */
async function commitTitle(id: string, title = 'Committed') {
  expect(await actions.commitOperation({
    opId: randomUUID(), puzzleId: id, clientId: 'new-tab', epoch: 0, baseVersion: 0, kind: 'title', title,
  })).toMatchObject({ status: 'accepted', version: 1 });
}

const snapshotWrites: Array<[string, 'grid' | 'hints', (id: string) => Promise<unknown>]> = [
  ['saveGrid', 'grid', (id) => actions.saveGrid(id, changedGrid)],
  ['saveHints', 'hints', (id) => actions.saveHints(id, { ...COMPLETE, '1-across': '' })],
  ['saveTitle', 'grid', (id) => actions.saveTitle(id, 'Old tab title')],
  ['enterHints', 'grid', (id) => actions.enterHints(id)],
  ['publishPuzzle', 'hints', (id) => actions.publishPuzzle(id, 'public')],
];

describe('24-S1-16 the snapshot fence', () => {
  it.each(snapshotWrites)('%s still writes a puzzle at version 0', async (name, phase, write) => {
    const id = await seed(phase, phase === 'hints' ? COMPLETE : {});
    await write(id);
    const after = await row(id);
    expect(after.version).toBe(0);
    const changed = {
      saveGrid: () => expect(after.grid).toEqual(changedGrid),
      saveHints: () => expect((after.hints as Record<string, string>)['1-across']).toBe(''),
      saveTitle: () => expect(after.title).toBe('Old tab title'),
      enterHints: () => expect(after.phase).toBe('hints'),
      publishPuzzle: () => expect(after.publishedAt).not.toBeNull(),
    } as Record<string, () => void>;
    changed[name]();
  });

  it.each(snapshotWrites)('%s changes nothing once an operation has been committed', async (_name, phase, write) => {
    const id = await seed(phase, phase === 'hints' ? COMPLETE : {});
    await commitTitle(id);
    const before = await row(id);
    expect(before.version).toBe(1);
    await expect(write(id)).rejects.toThrow();
    expect(await row(id)).toEqual(before);
  });

  it('fences a puzzle at any version past 0', async () => {
    const id = await seed('grid');
    await db.client.puzzle.update({ where: { id }, data: { version: 7 } });
    const before = await row(id);
    await expect(actions.saveGrid(id, changedGrid)).rejects.toThrow();
    expect(await row(id)).toEqual(before);
  });
});
