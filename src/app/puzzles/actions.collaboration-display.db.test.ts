import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));

import { listLibraryCollaboration } from './actions';

let db: TestDatabase;
const as = (id: string) => {
  holder.session = { user: { id, email: `${id}@display.example.test`, displayName: id }, session: {} };
};
beforeAll(async () => {
  db = await createTestDatabase();
  holder.client = db.client;
  await db.client.user.createMany({ data: ['owner', 'member', 'outsider'].map((id) => ({
    id, email: `${id}@display.example.test`, name: id, displayName: id === 'member' ? '  Member Name  ' : id,
  })) });
}, 60_000);
afterAll(async () => { await db?.drop(); });

describe('24-S8 authenticated library collaboration display', () => {
  it('rejects anonymous reads and arbitrary private puzzle IDs; owner/member see names without invitation emails', async () => {
    const puzzle = await db.client.puzzle.create({ data: {
      builderId: 'owner', title: 'Private metadata', grid: {}, hints: {},
      collaborators: { create: { userId: 'member' } },
      invitations: { create: { email: 'private-invite@example.test', expiresAt: new Date(Date.now() + 60_000) } },
    } });
    holder.session = null;
    await expect(listLibraryCollaboration([puzzle.id])).rejects.toThrow('redirect:/');
    as('outsider');
    expect(await listLibraryCollaboration([puzzle.id])).toEqual([]);
    const expected = [{ id: puzzle.id, collaborators: [{ userId: 'member', name: 'Member Name' }], hasCollaborators: true }];
    for (const account of ['owner', 'member']) {
      as(account);
      expect(await listLibraryCollaboration([puzzle.id])).toEqual(expected);
    }
  });

  // Amended by 24-S11: another builder's published puzzle discloses no
  // collaboration metadata; invitation counting is the owner's.
  it('counts only live invitations and gives outsiders nothing for public puzzles', async () => {
    const puzzle = await db.client.puzzle.create({ data: {
      builderId: 'owner', title: 'Public metadata', grid: {}, hints: {},
      publishedAt: new Date(), visibility: 'public',
      invitations: { create: { email: 'expired@example.test', expiresAt: new Date(0) } },
    } });
    as('owner');
    expect(await listLibraryCollaboration([puzzle.id])).toEqual([{ id: puzzle.id, collaborators: [], hasCollaborators: false }]);
    await db.client.puzzleInvitation.create({ data: {
      puzzleId: puzzle.id, email: 'live@example.test', expiresAt: new Date(Date.now() + 60_000),
    } });
    expect(await listLibraryCollaboration([puzzle.id])).toEqual([{ id: puzzle.id, collaborators: [], hasCollaborators: true }]);
    as('outsider');
    expect(await listLibraryCollaboration([puzzle.id])).toEqual([]);
  });

  // Added by 24-S11: a played, unlisted published puzzle discloses nothing either.
  it('gives an outsider nothing for a published puzzle they have played', async () => {
    const puzzle = await db.client.puzzle.create({ data: {
      builderId: 'owner', title: 'Played metadata', grid: {}, hints: {},
      publishedAt: new Date(), visibility: 'unlisted',
      collaborators: { create: { userId: 'member' } },
      invitations: { create: { email: 'played-invite@example.test', expiresAt: new Date(Date.now() + 60_000) } },
      playSessions: { create: { userId: 'outsider', entries: {} } },
    } });
    as('outsider');
    expect(await listLibraryCollaboration([puzzle.id])).toEqual([]);
    as('member');
    expect(await listLibraryCollaboration([puzzle.id])).toEqual([
      { id: puzzle.id, collaborators: [{ userId: 'member', name: 'Member Name' }], hasCollaborators: true },
    ]);
  });
});
