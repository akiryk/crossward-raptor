// 24-S4 acceptance: the catch-up read's two entries, the `catchUpOperations`
// action and the route handler's GET the editor polls, against PostgreSQL
// (a throwaway schema). The session gate is the real one (Next's redirect
// included); only Better Auth's session read is stubbed. Do not edit this
// file to match an implementation.
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { createGrid } from '@/engine/grid';
import { serializeGrid } from '@/lib/puzzle-storage';
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

import { GET } from './route';
import { catchUpOperations, commitOperation } from '@/app/puzzles/actions';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  holder.client = db.client;
  await db.client.user.createMany({ data: [
    { id: 'adam', name: 'Adam', email: 'adam@poll.example.test', displayName: 'Adam' },
    { id: 'jay', name: 'Jay', email: 'jay@poll.example.test', displayName: 'Jay' },
  ] });
}, 60_000);
afterAll(async () => { await db?.drop(); });
beforeEach(() => { holder.session = { user: { id: 'adam', displayName: 'Adam' }, session: {} }; });

const blank = serializeGrid(createGrid({ cols: 3, rows: 3 }));
async function seed(builderId = 'adam') {
  return (await db.client.puzzle.create({
    data: { builderId, title: 'Poll', grid: blank as unknown as Prisma.InputJsonValue, hints: {} },
  })).id;
}
const op = (puzzleId: string, value: string, baseVersion: number) => ({
  opId: randomUUID(), puzzleId, clientId: 'tab', epoch: 0, baseVersion, kind: 'cells', writes: [{ col: 1, row: 1, value }],
});
const poll = (id: string, since?: string) => GET(
  new Request(`http://localhost/api/puzzles/${id}/operations`, { headers: since === undefined ? {} : { 'x-catch-up-since': since } }),
  { params: Promise.resolve({ id }) },
);

describe('24-S4-9 the catchUpOperations action and the polled route', () => {
  it('the action answers as the session account', async () => {
    const id = await seed();
    const first = op(id, 'K', 0);
    await commitOperation(first);
    expect(await catchUpOperations({ puzzleId: id, since: 0 })).toEqual({ status: 'ops', ops: [{ ...first, version: 1 }] });
    holder.session = { user: { id: 'jay', displayName: 'Jay' }, session: {} };
    expect(await catchUpOperations({ puzzleId: id, since: 0 })).toEqual({ status: 'not-found' });
  });

  it('GET answers the operations since the header’s version, uncached; without it, the snapshot', async () => {
    const id = await seed();
    const first = op(id, 'K', 0);
    const second = op(id, 'Q', 1);
    await commitOperation(first);
    await commitOperation(second);
    const response = await poll(id, '1');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ops', ops: [{ ...second, version: 2 }] });
    expect(await (await poll(id, '2')).json()).toEqual({ status: 'ops', ops: [] });
    const snapshot = await (await poll(id)).json();
    expect(snapshot).toMatchObject({ status: 'snapshot', version: 2, resetEpoch: 0, content: { title: 'Poll', phase: 'grid', hints: {} } });
    expect(snapshot.content.grid.cells[1][1]).toEqual({ kind: 'active', letter: 'Q' });
  });

  it('answers 400 to a malformed version and 404 for another builder’s puzzle', async () => {
    const id = await seed();
    for (const since of ['-1', 'x', '1.5', '']) expect((await poll(id, since)).status).toBe(400);
    const other = await seed('jay');
    expect((await poll(other, '0')).status).toBe(404);
    expect((await poll(other)).status).toBe(404);
  });

  it('sends a request without a usable session to /, as every action does', async () => {
    const id = await seed();
    for (const session of [null, { user: { id: 'adam', displayName: '  ' }, session: {} }]) {
      holder.session = session;
      await expect(poll(id, '0')).rejects.toMatchObject({ digest: expect.stringMatching(/^NEXT_REDIRECT;.*;\/;/) });
      await expect(catchUpOperations({ puzzleId: id, since: 0 })).rejects.toMatchObject({ digest: expect.stringMatching(/^NEXT_REDIRECT/) });
    }
  });
});
