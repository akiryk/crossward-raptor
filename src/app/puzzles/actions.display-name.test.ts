import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(), revalidatePath: vi.fn(),
  findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), updateMany: vi.fn(), update: vi.fn(),
  puzzle: vi.fn(), session: vi.fn(), account: vi.fn(), verification: vi.fn(),
}));

vi.mock('@/lib/require-session', () => ({ requireSession: mocks.requireSession }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/prisma', () => {
  const forbiddenModel = (effect: typeof mocks.puzzle) => new Proxy({}, { get: () => effect });
  const db = {
    user: {
      findUnique: mocks.findUnique, findUniqueOrThrow: mocks.findUniqueOrThrow,
      updateMany: mocks.updateMany, update: mocks.update,
    },
    puzzle: forbiddenModel(mocks.puzzle), session: forbiddenModel(mocks.session),
    account: forbiddenModel(mocks.account), verification: forbiddenModel(mocks.verification),
  };
  return { prisma: { ...db, $transaction: async (work: (client: typeof db) => unknown) => work(db) } };
});

import { getDisplayName, saveDisplayName } from './actions';

type Row = {
  id: string; displayName: string | null; name: string; email: string; role: string;
  image: string | null; emailVerified: boolean; createdAt: Date; updatedAt: Date;
};
type Where = Record<string, unknown>;
let rows: Row[];
let writes: Array<{ where: Where; data: Record<string, unknown> }>;

// A tiny Prisma-shaped store: WHERE is evaluated at the write, not at the
// preceding read. This exposes lost updates without prescribing query order.
function matches(row: Row, where: Where): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return (Array.isArray(value) ? value : [value]).every((part) => matches(row, part as Where));
    if (key === 'OR') return (value as Where[]).some((part) => matches(row, part));
    if (key === 'NOT') return !matches(row, value as Where);
    const actual = row[key as keyof Row];
    if (value !== null && typeof value === 'object') {
      const filter = value as Record<string, unknown>;
      if ('equals' in filter) return actual === filter.equals;
      if ('in' in filter) return (filter.in as unknown[]).includes(actual);
      if ('not' in filter) return actual !== filter.not;
      throw new Error(`Unsupported acceptance-store filter: ${key}`);
    }
    return actual === value;
  });
}

function own() { return rows[0]!; }
function expectOnlyNameChanged(before: Row[], name: string) {
  const withoutUpdatedAt = (row: Row) => Object.fromEntries(
    Object.entries(row).filter(([key]) => key !== 'updatedAt'),
  );
  expect(rows.map(withoutUpdatedAt)).toEqual(
    before.map((row, index) => index === 0
      ? { ...withoutUpdatedAt(row), displayName: name }
      : withoutUpdatedAt(row)),
  );
  for (const write of writes) {
    expect(Object.keys(write.data).every((key) => ['displayName', 'updatedAt'].includes(key))).toBe(true);
  }
  for (const effect of [mocks.puzzle, mocks.session, mocks.account, mocks.verification]) {
    expect(effect).not.toHaveBeenCalled();
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  writes = [];
  rows = ['session-builder', 'forged-builder'].map((id) => ({
    id, displayName: null, name: `Auth ${id}`, email: `${id}@example.test`, role: 'user',
    image: null, emailVerified: true,
    createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-01T00:00:00Z'),
  }));
  mocks.requireSession.mockResolvedValue({ user: { id: 'session-builder', displayName: 'stale session name' } });
  const read = async (query: { where: Where; select?: Record<string, boolean> }) => {
    const row = rows.find((candidate) => matches(candidate, query.where));
    if (!row) return null;
    return query.select
      ? Object.fromEntries(Object.entries(row).filter(([key]) => query.select?.[key]))
      : { ...row };
  };
  mocks.findUnique.mockImplementation(read);
  mocks.findUniqueOrThrow.mockImplementation(read);
  mocks.updateMany.mockImplementation(async (query: { where: Where; data: Record<string, unknown> }) => {
    writes.push(query);
    const selected = rows.filter((row) => matches(row, query.where));
    for (const row of selected) Object.assign(row, query.data);
    return { count: selected.length };
  });
  mocks.update.mockImplementation(async (query: { where: Where; data: Record<string, unknown> }) => {
    writes.push(query);
    const row = rows.find((candidate) => matches(candidate, query.where));
    if (!row) throw new Error('No matching user');
    Object.assign(row, query.data);
    return { ...row };
  });
});

describe('O2 authenticated capture-once display names', () => {
  it('rejects both actions before database access when the session is rejected', async () => {
    mocks.requireSession.mockRejectedValue(new Error('redirect:/'));
    await expect(getDisplayName()).rejects.toThrow('redirect:/');
    await expect(saveDisplayName({ displayName: 'Denied' })).rejects.toThrow('redirect:/');
    for (const effect of [mocks.findUnique, mocks.findUniqueOrThrow, mocks.updateMany,
      mocks.update, mocks.puzzle, mocks.session, mocks.account, mocks.verification, mocks.revalidatePath]) {
      expect(effect).not.toHaveBeenCalled();
    }
  });

  it.each([null, '', ' \t\n ', '山田 🦖'])('reads the persisted session user name %j, never a stale session name', async (name) => {
    own().displayName = name;
    rows[1]!.displayName = 'Another user';
    await expect(getDisplayName()).resolves.toBe(name?.trim() ? name : null);
    expect(writes).toEqual([]);
  });

  it.each(['  山田 🦖 & Co.  ', '🦖'.repeat(80), '  A  B!  '])('trims and persists valid Unicode %j only for the trusted user', async (name) => {
    const before = structuredClone(rows);
    const forged = { displayName: name, userId: 'forged-builder', id: 'forged-builder', name: 'Do not replace auth name' };
    await expect(saveDisplayName(forged)).resolves.toEqual({ displayName: name.trim() });
    expectOnlyNameChanged(before, name.trim());
    await expect(getDisplayName()).resolves.toBe(name.trim());
  });

  it.each(['', ' \t\n ', 'x'.repeat(81), '🦖'.repeat(81), null, 123, {}, undefined])('rejects invalid input %j without any mutation', async (name) => {
    const before = structuredClone(rows);
    await expect(saveDisplayName({ displayName: name } as { displayName: string })).rejects.toThrow();
    expect(rows).toEqual(before);
    expect(writes).toEqual([]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('preserves an existing nonblank value and returns it instead of replacing it', async () => {
    own().displayName = 'First 🦖';
    const before = structuredClone(rows);
    await expect(saveDisplayName({ displayName: 'Replacement' })).resolves.toEqual({ displayName: 'First 🦖' });
    expect(rows).toEqual(before);
  });

  it('treats a whitespace-only stored name as missing and permits duplicate names', async () => {
    own().displayName = ' \t\n ';
    rows[1]!.displayName = 'Shared Name';
    const before = structuredClone(rows);
    await expect(saveDisplayName({ displayName: 'Shared Name' })).resolves.toEqual({ displayName: 'Shared Name' });
    expectOnlyNameChanged(before, 'Shared Name');
  });

  it.each([null, ' \t '])('concurrent captures of stored %j return one persisted winner', async (initial) => {
    own().displayName = initial;
    const before = structuredClone(rows);
    const results = await Promise.all([
      saveDisplayName({ displayName: 'First contender' }),
      saveDisplayName({ displayName: 'Second contender' }),
    ]);
    expect(['First contender', 'Second contender']).toContain(own().displayName);
    expect(results).toEqual([{ displayName: own().displayName }, { displayName: own().displayName }]);
    expectOnlyNameChanged(before, own().displayName!);
    await expect(saveDisplayName({ displayName: 'Later contender' })).resolves.toEqual({ displayName: own().displayName });
    expectOnlyNameChanged(before, own().displayName!);
  });
});
