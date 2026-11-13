// 24-S2 acceptance: the publishAtVersion action, against PostgreSQL (a
// throwaway schema). The session gate is the real one (Next's redirect
// included); only Better Auth's session read is stubbed.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { createGrid, withLetter } from '@/engine/grid';
import { enterHintsPhase } from '@/engine/phase';
import { hintKey, requiredHints } from '@/engine/hints';
import { deserializeGrid, serializePuzzle } from '@/lib/puzzle-storage';
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

import { publishAtVersion } from './actions';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  holder.client = db.client;
  await db.client.user.createMany({ data: [
    { id: 'adam', name: 'Adam', email: 'adam@publish-action.example.test', displayName: 'Adam' },
    { id: 'jay', name: 'Jay', email: 'jay@publish-action.example.test', displayName: 'Jay' },
  ] });
}, 60_000);
afterAll(async () => { await db?.drop(); });
beforeEach(() => { holder.session = { user: { id: 'adam', displayName: 'Adam' }, session: {} }; });

const grid = [[0, 0, 'A'], [1, 0, 'B'], [0, 1, 'C'], [1, 1, 'D']] as const;
const stored = serializePuzzle(enterHintsPhase({
  grid: grid.reduce((next, [col, row, letter]) => withLetter(next, { col, row }, letter), createGrid({ cols: 2, rows: 2 })),
  hints: {}, phase: 'grid',
}));
const { across, down } = requiredHints(deserializeGrid(stored.grid));
const complete = Object.fromEntries([...across, ...down].map((ref) => [hintKey(ref), 'Clue']));

async function seed(builderId = 'adam') {
  return (await db.client.puzzle.create({
    data: {
      builderId, title: 'Ready', phase: 'hints', version: 2,
      grid: stored.grid as unknown as Prisma.InputJsonValue, hints: complete as Prisma.InputJsonValue,
    },
  })).id;
}
const publishedAt = async (id: string) => (await db.client.puzzle.findUniqueOrThrow({ where: { id } })).publishedAt;

describe('24-S2-12 the publishAtVersion action', () => {
  it('publishes as the session account, whatever the input claims', async () => {
    const id = await seed();
    const outcome = await publishAtVersion({ puzzleId: id, version: 2, visibility: 'public', userId: 'jay' });
    expect(outcome).toMatchObject({ status: 'published', visibility: 'public', version: 2 });
    expect(await publishedAt(id)).not.toBeNull();
  });

  it('answers a stale version with a refusal the Publish dialog can show', async () => {
    const id = await seed();
    expect(await publishAtVersion({ puzzleId: id, version: 1, visibility: 'public' })).toEqual({ status: 'refused', code: 'stale' });
    expect(await publishedAt(id)).toBeNull();
  });

  it("can't publish another builder's puzzle", async () => {
    const id = await seed('jay');
    expect(await publishAtVersion({ puzzleId: id, version: 2, visibility: 'public' })).toEqual({ status: 'not-found' });
    expect(await publishedAt(id)).toBeNull();
  });

  it('refuses without a session or without a username, writing nothing', async () => {
    const id = await seed();
    for (const session of [null, { user: { id: 'adam', displayName: '  ' }, session: {} }]) {
      holder.session = session;
      await expect(publishAtVersion({ puzzleId: id, version: 2, visibility: 'public' })).rejects.toThrow();
    }
    expect(await publishedAt(id)).toBeNull();
  });
});
