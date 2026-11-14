// 24-S6 acceptance: claiming an invitation can't race a revocation or a
// deletion (carried from the S5 review). The claim reads the invitations and
// then makes memberships; here a racing write, on another connection, lands
// right after the claim's first invitation read: the owner revoking it, or
// deleting the puzzle. Against PostgreSQL in a throwaway schema. Do not edit
// this file to match an implementation.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma, PrismaClient } from '@prisma/client';
import { createGrid } from '@/engine/grid';
import { serializeGrid } from '@/lib/puzzle-storage';
import { createTestDatabase, type TestDatabase } from '@/test-support/database';
import { claimInvitations, revokeInvitation } from './membership';

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

import { claimInvitations as claimAction } from '@/app/puzzles/actions';

let db: TestDatabase;
beforeAll(async () => {
  db = await createTestDatabase();
}, 60_000);
afterAll(async () => { await db?.drop(); });
beforeEach(() => { holder.client = db.client; });

const NOW = new Date('2026-11-13T12:00:00Z');
const LATER = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
let serial = 0;
const unique = (label: string) => `${label}-${++serial}`;

async function user(label: string) {
  const id = unique(label);
  const email = `${id}@claims.example.test`;
  await db.client.user.create({ data: { id, name: label, email, displayName: label } });
  return { id, email };
}
async function puzzle(builderId: string) {
  return (await db.client.puzzle.create({
    data: {
      builderId, title: 'Shared',
      grid: serializeGrid(createGrid({ cols: 3, rows: 3 })) as unknown as Prisma.InputJsonValue, hints: {},
    },
  })).id;
}
const invite = (puzzleId: string, email: string) =>
  db.client.puzzleInvitation.create({ data: { puzzleId, email, expiresAt: LATER } });
const members = async (puzzleId: string) =>
  (await db.client.puzzleCollaborator.findMany({ where: { puzzleId } })).map((row) => row.userId);
const invitations = async (puzzleId: string) =>
  (await db.client.puzzleInvitation.findMany({ where: { puzzleId } })).map((row) => row.email);

/** A client whose first invitation read (inside or outside a transaction)
 *  is followed by `interfere`, before the claim goes on. */
function racing(client: PrismaClient, interfere: () => Promise<unknown>): PrismaClient {
  let remaining = 1;
  const invitationDelegate = (target: object) => new Proxy(target, {
    get(object, key) {
      const value = Reflect.get(object, key);
      if (typeof value !== 'function') return value;
      if (typeof key === 'string' && key.startsWith('find')) {
        return async (...args: unknown[]) => {
          const result = await value.apply(object, args);
          if (remaining > 0) {
            remaining--;
            await interfere();
          }
          return result;
        };
      }
      return value.bind(object);
    },
  });
  const wrap = (target: object): object => new Proxy(target, {
    get(object, key) {
      const value = Reflect.get(object, key);
      if (key === 'puzzleInvitation') return invitationDelegate(value);
      if (key === '$transaction') {
        return (work: (tx: object) => unknown, ...rest: unknown[]) =>
          value.call(object, (tx: object) => work(wrap(tx)), ...rest);
      }
      return typeof value === 'function' ? value.bind(object) : value;
    },
  });
  return wrap(client) as PrismaClient;
}

describe('24-S6-1 claiming races', () => {
  it('a revocation landing between the read and the insert makes no membership', async () => {
    const adam = await user('adam');
    const id = await puzzle(adam.id);
    const jay = await user('jay');
    await invite(id, jay.email);

    const client = racing(db.client, () => revokeInvitation(db.client, adam.id, { puzzleId: id, email: jay.email }));
    expect(await claimInvitations(client, jay, { now: NOW })).toBe(0);
    expect(await members(id)).toEqual([]);
    expect(await invitations(id)).toEqual([]);
  });

  it('an invitation revoked meanwhile leaves a membership that already existed', async () => {
    const adam = await user('adam');
    const id = await puzzle(adam.id);
    const jay = await user('jay');
    await db.client.puzzleCollaborator.create({ data: { puzzleId: id, userId: jay.id } });
    await invite(id, jay.email);

    const client = racing(db.client, () => revokeInvitation(db.client, adam.id, { puzzleId: id, email: jay.email }));
    expect(await claimInvitations(client, jay, { now: NOW })).toBe(0);
    expect(await members(id)).toEqual([jay.id]);
  });

  it('the puzzle deleted between the read and the insert: the claim resolves and still claims the rest', async () => {
    const adam = await user('adam');
    const doomed = await puzzle(adam.id);
    const kept = await puzzle(adam.id);
    const jay = await user('jay');
    await invite(doomed, jay.email);
    await invite(kept, jay.email);

    const client = racing(db.client, () => db.client.puzzle.delete({ where: { id: doomed } }));
    await expect(claimInvitations(client, jay, { now: NOW })).resolves.toBe(1);
    expect(await members(doomed)).toEqual([]);
    expect(await members(kept)).toEqual([jay.id]);
    expect(await invitations(kept)).toEqual([]);
  });

  it('through the action, a deletion meanwhile doesn’t fail the page’s claim', async () => {
    const adam = await user('adam');
    const doomed = await puzzle(adam.id);
    const jay = await user('jay');
    // The action claims as of the real clock.
    await db.client.puzzleInvitation.create({ data: { puzzleId: doomed, email: jay.email, expiresAt: new Date(Date.now() + 86_400_000) } });
    holder.session = { user: { id: jay.id, email: jay.email, displayName: 'jay' }, session: {} };

    holder.client = racing(db.client, () => db.client.puzzle.delete({ where: { id: doomed } }));
    await expect(claimAction()).resolves.toBe(0);
    expect(await db.client.puzzleCollaborator.count({ where: { userId: jay.id } })).toBe(0);
  });
});
