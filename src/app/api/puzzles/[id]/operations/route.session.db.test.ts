// 24-S7 acceptance: presence through the routes, against PostgreSQL (a
// throwaway schema). A catch-up GET carrying the tab's `x-client-id` is its
// heartbeat and answers who else is present and who committed the
// operations it returns; without the header the answer is S4's, unchanged.
// The presence route's POST marks a tab away or gone. The session gate is
// the real one; only Better Auth's session read is stubbed. Do not edit
// this file to match an implementation.
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
import { POST as PRESENCE } from '../presence/route';
import { commitOperation } from '@/app/puzzles/actions';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  holder.client = db.client;
  await db.client.user.createMany({ data: [
    { id: 'adam', name: 'Adam', email: 'adam@session.example.test', displayName: 'Adam' },
    { id: 'jay', name: 'Jay', email: 'jay@session.example.test', displayName: 'Jay' },
    { id: 'eve', name: 'Eve', email: 'eve@session.example.test', displayName: 'Eve' },
  ] });
}, 60_000);
afterAll(async () => { await db?.drop(); });
const as = (id: 'adam' | 'jay' | 'eve') => {
  holder.session = { user: { id, displayName: id[0].toUpperCase() + id.slice(1) }, session: {} };
};
beforeEach(() => as('adam'));

const blank = serializeGrid(createGrid({ cols: 3, rows: 3 }));
/** Adam's puzzle, shared with Jay. */
async function seed() {
  const { id } = await db.client.puzzle.create({
    data: { builderId: 'adam', title: 'Session', grid: blank as unknown as Prisma.InputJsonValue, hints: {} },
  });
  await db.client.puzzleCollaborator.create({ data: { puzzleId: id, userId: 'jay' } });
  return id;
}
const op = (puzzleId: string, value: string, baseVersion: number) => ({
  opId: randomUUID(), puzzleId, clientId: 'tab', epoch: 0, baseVersion, kind: 'cells', writes: [{ col: 1, row: 1, value }],
});
function poll(id: string, headers: Record<string, string>) {
  return GET(new Request(`http://localhost/api/puzzles/${id}/operations`, { headers }), { params: Promise.resolve({ id }) });
}
function presence(id: string, body: unknown) {
  return PRESENCE(
    new Request(`http://localhost/api/puzzles/${id}/presence`, { method: 'POST', body: JSON.stringify(body) }),
    { params: Promise.resolve({ id }) },
  );
}
const rows = (puzzleId: string) => db.client.puzzlePresence.findMany({ where: { puzzleId }, orderBy: { clientId: 'asc' } });

describe('24-S7-2 presence through the routes', () => {
  it('a GET with x-client-id is a heartbeat and answers who is present and who committed', async () => {
    const id = await seed();
    const adams = await (await poll(id, { 'x-catch-up-since': '0', 'x-client-id': 'adam-tab' })).json();
    expect(adams).toEqual({ status: 'ops', ops: [], present: [] });

    as('jay');
    const mine = op(id, 'J', 0);
    await commitOperation(mine);
    const jays = await (await poll(id, { 'x-catch-up-since': '0', 'x-client-id': 'jay-tab' })).json();
    expect(jays.present).toEqual([{ userId: 'adam', username: 'Adam' }]);
    expect(jays.ops).toHaveLength(1);
    expect(jays.authors).toEqual({ [mine.opId]: { userId: 'jay', username: 'Jay' } });

    as('adam');
    const again = await (await poll(id, { 'x-catch-up-since': '0', 'x-client-id': 'adam-tab' })).json();
    expect(again.present).toEqual([{ userId: 'jay', username: 'Jay' }]);
    expect(again.authors).toEqual({ [mine.opId]: { userId: 'jay', username: 'Jay' } });
    expect((await rows(id)).map((row) => [row.clientId, row.userId])).toEqual([['adam-tab', 'adam'], ['jay-tab', 'jay']]);
  });

  it('without the header the answer is unchanged and nothing is recorded', async () => {
    const id = await seed();
    const first = op(id, 'K', 0);
    await commitOperation(first);
    expect(await (await poll(id, { 'x-catch-up-since': '0' })).json()).toEqual({ status: 'ops', ops: [{ ...first, version: 1 }] });
    expect(await (await poll(id, { 'x-catch-up-since': '1' })).json()).toEqual({ status: 'ops', ops: [] });
    expect(await rows(id)).toEqual([]);
  });

  it('records nothing for a puzzle the caller can’t edit; a published puzzle answers no presence', async () => {
    const id = await seed();
    as('eve');
    const response = await poll(id, { 'x-catch-up-since': '0', 'x-client-id': 'eve-tab' });
    expect(response.status).toBe(404);
    expect(await rows(id)).toEqual([]);

    as('adam');
    await db.client.puzzle.update({ where: { id }, data: { publishedAt: new Date() } });
    const published = await (await poll(id, { 'x-catch-up-since': '0', 'x-client-id': 'adam-tab' })).json();
    expect(published.status).toBe('published');
    expect(published).not.toHaveProperty('present');
    expect(await rows(id)).toEqual([]);
  });

  it('POST presence marks the caller’s own tab away or gone; anything else is refused and changes nothing', async () => {
    const id = await seed();
    await poll(id, { 'x-catch-up-since': '0', 'x-client-id': 'adam-tab' });
    as('jay');
    await poll(id, { 'x-catch-up-since': '0', 'x-client-id': 'jay-tab' });
    const [adamBefore, jayBefore] = await rows(id);

    const away = await presence(id, { clientId: 'jay-tab', state: 'away' });
    expect(away.status).toBe(200);
    const [, jayAway] = await rows(id);
    expect(jayAway.expiresAt.getTime()).toBeGreaterThan(jayBefore.expiresAt.getTime() + 60_000);

    // Jay can't touch Adam's tab.
    expect((await presence(id, { clientId: 'adam-tab', state: 'leave' })).status).toBe(200);
    expect((await rows(id))[0]).toEqual(adamBefore);

    for (const body of [null, {}, { clientId: 'jay-tab' }, { clientId: 'jay-tab', state: 'gone' }, { clientId: 'bad id!', state: 'leave' }]) {
      expect((await presence(id, body)).status).toBe(400);
    }
    as('eve');
    expect((await presence(id, { clientId: 'jay-tab', state: 'leave' })).status).toBe(404);
    expect((await rows(id)).map((row) => row.clientId)).toEqual(['adam-tab', 'jay-tab']);

    as('jay');
    expect((await presence(id, { clientId: 'jay-tab', state: 'leave' })).status).toBe(200);
    expect((await rows(id)).map((row) => row.clientId)).toEqual(['adam-tab']);
  });
});
