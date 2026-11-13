// 24-S1 acceptance: the commit path's two entries, the server action and the
// keepalive route handler, against PostgreSQL (a throwaway schema). The
// session gate is the real one (Next's redirect included); only Better
// Auth's session read is stubbed.
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { createGrid } from '@/engine/grid';
import { serializeGrid, type SerializedGrid } from '@/lib/puzzle-storage';
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

import { POST } from './route';
import { commitOperation } from '@/app/puzzles/actions';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
  holder.client = db.client;
  await db.client.user.createMany({ data: [
    { id: 'adam', name: 'Adam', email: 'adam@entry.example.test', displayName: 'Adam' },
    { id: 'jay', name: 'Jay', email: 'jay@entry.example.test', displayName: 'Jay' },
  ] });
}, 60_000);
afterAll(async () => { await db?.drop(); });
beforeEach(() => { holder.session = { user: { id: 'adam', displayName: 'Adam' }, session: {} }; });

const blank = serializeGrid(createGrid({ cols: 3, rows: 3 }));
async function seed(builderId = 'adam') {
  return (await db.client.puzzle.create({
    data: { builderId, title: 'Entry', grid: blank as unknown as Prisma.InputJsonValue, hints: {} },
  })).id;
}
const op = (puzzleId: string, value = 'K', extra: Record<string, unknown> = {}) => ({
  opId: randomUUID(), puzzleId, clientId: 'tab', epoch: 0, baseVersion: 0, kind: 'cells',
  writes: [{ col: 1, row: 1, value }], ...extra,
});
const center = async (id: string) => {
  const cell = ((await db.client.puzzle.findUniqueOrThrow({ where: { id } })).grid as unknown as SerializedGrid).cells[1][1];
  return cell.kind === 'active' ? cell.letter : 'black';
};
const send = (id: string, body: string) => POST(
  new Request(`http://localhost/api/puzzles/${id}/operations`, { method: 'POST', body }),
  { params: Promise.resolve({ id }) },
);

describe('24-S1-17 the commitOperation action', () => {
  it('commits as the session account, whatever the input claims', async () => {
    const id = await seed();
    const input = op(id, 'K', { userId: 'jay' });
    expect(await commitOperation(input)).toEqual({ status: 'accepted', opId: input.opId, version: 1 });
    expect((await db.client.puzzleOperation.findUniqueOrThrow({ where: { opId: input.opId } })).userId).toBe('adam');
    expect(await center(id)).toBe('K');
  });

  it("can't commit to another builder's puzzle", async () => {
    const id = await seed('jay');
    expect(await commitOperation(op(id))).toEqual({ status: 'not-found' });
    expect(await center(id)).toBeNull();
  });

  it('refuses without a session or without a username, writing nothing', async () => {
    const id = await seed();
    for (const session of [null, { user: { id: 'adam', displayName: '  ' }, session: {} }]) {
      holder.session = session;
      await expect(commitOperation(op(id))).rejects.toThrow();
    }
    expect(await center(id)).toBeNull();
    expect(await db.client.puzzleOperation.count({ where: { puzzleId: id } })).toBe(0);
  });
});

describe('24-S1-18 the keepalive route handler', () => {
  it('commits and answers with the outcome, the same on a resend', async () => {
    const id = await seed();
    const input = op(id);
    for (let i = 0; i < 2; i++) {
      const response = await send(id, JSON.stringify(input));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'accepted', opId: input.opId, version: 1 });
    }
    expect(await center(id)).toBe('K');
  });

  it('answers a refusal with its code', async () => {
    const id = await seed();
    const response = await send(id, JSON.stringify(op(id, 'K', { epoch: 3 })));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'refused', code: 'epoch' });
  });

  it('sends a request without a usable session to /, as every action does, writing nothing', async () => {
    const id = await seed();
    for (const session of [null, { user: { id: 'adam', displayName: null }, session: {} }]) {
      holder.session = session;
      await expect(send(id, JSON.stringify(op(id)))).rejects.toMatchObject({ digest: expect.stringMatching(/^NEXT_REDIRECT;.*;\/;/) });
      await expect(send(id, 'not json')).rejects.toMatchObject({ digest: expect.stringMatching(/^NEXT_REDIRECT/) });
    }
    expect(await center(id)).toBeNull();
  });

  it('answers 400 to malformed input or a puzzle other than the path names, writing nothing', async () => {
    const id = await seed();
    const other = await seed();
    for (const [path, body] of [
      [id, 'not json'],
      [id, JSON.stringify(op(other))],
      [id, JSON.stringify({ ...op(id), writes: [] })],
      [id, JSON.stringify({ ...op(id), padding: 'x'.repeat(200_001) })],
    ]) {
      expect((await send(path, body)).status).toBe(400);
    }
    expect([await center(id), await center(other)]).toEqual([null, null]);
  });

  it("answers 404 for another builder's puzzle", async () => {
    const id = await seed('jay');
    expect((await send(id, JSON.stringify(op(id)))).status).toBe(404);
    expect(await center(id)).toBeNull();
  });
});
