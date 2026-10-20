import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SerializedGrid } from '@/lib/puzzle-storage';

// P4 acceptance: an in-memory behavioral store, never a database connection.
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), headers: vi.fn(), revalidatePath: vi.fn(), transaction: vi.fn(),
  puzzle: {
    findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(),
    update: vi.fn(), updateMany: vi.fn(), create: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(),
  },
  playSession: {
    findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(),
    delete: vi.fn(), deleteMany: vi.fn(), update: vi.fn(), updateMany: vi.fn(),
    create: vi.fn(), createMany: vi.fn(), upsert: vi.fn(),
  },
}));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  puzzle: mocks.puzzle, playSession: mocks.playSession, $transaction: mocks.transaction,
} }));
import * as actions from './actions';
import type { PlayPuzzleView } from './actions';

type Reset = (puzzleId: string, sessionId: string) => Promise<PlayPuzzleView>;
// Allows a drafting baseline to type-check; the assertion makes missing runtime red.
const reset = (actions as unknown as Record<string, unknown>).resetPlaySession as Reset;
type Row = Record<string, unknown>;
type Query = { where?: Row; select?: Row; include?: Row; data?: Row | Row[]; skipDuplicates?: boolean };
type SessionRow = Row & {
  id: string; userId: string; puzzleId: string; entries: SerializedGrid;
  startedAt: Date; completedAt: Date | null;
};
let puzzles: Row[];
let sessions: SessionRow[];
let mutations: string[];
let created: number;
let beforeDelete: (() => void) | undefined;
const seededStart = new Date('2026-01-03T04:05:06Z');
const requestHeaders = new Headers({ cookie: 'better-auth.session_token=p4-fixture' });
const answer: SerializedGrid = {
  cols: 2, rows: 2,
  cells: [
    [{ kind: 'active', letter: 'ANSWER_SENTINEL' }, { kind: 'active', letter: 'A' }],
    [{ kind: 'black' }, { kind: 'active', letter: 'T' }],
  ],
};
const blank: SerializedGrid = {
  cols: 2, rows: 2,
  cells: [
    [{ kind: 'active', letter: null }, { kind: 'active', letter: null }],
    [{ kind: 'black' }, { kind: 'active', letter: null }],
  ],
};

function seed(userId = 'player-a', puzzleId = 'target', complete = false) {
  const entries = structuredClone(answer);
  if (!complete) entries.cells[0][0] = { kind: 'active', letter: null };
  const row: SessionRow = {
    id: `${userId}-${puzzleId}`, userId, puzzleId, entries,
    startedAt: seededStart,
    completedAt: complete ? new Date('2026-01-04T04:05:06Z') : null,
  };
  sessions.push(row);
  return row;
}
function snapshot() { return structuredClone({ puzzles, sessions }); }
function own(puzzleId = 'target') {
  return sessions.find((row) => row.userId === 'player-a' && row.puzzleId === puzzleId);
}
/** The exact `startPlaySession` view of a row: own entries, no solution. */
function viewOf(row: SessionRow) {
  return {
    id: row.puzzleId, title: `P4 ${row.puzzleId}`, entries: row.entries,
    hints: { '1-across': 'Fixture clue' },
    session: { id: row.id, startedAt: row.startedAt, completedAt: row.completedAt },
  };
}
function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return (Array.isArray(value) ? value : [value]).every((part) => matches(row, part as Row));
    if (key === 'OR') return (value as Row[]).some((part) => matches(row, part));
    if (key === 'NOT') return !(Array.isArray(value) ? value : [value]).some((part) => matches(row, part as Row));
    if (key === 'userId_puzzleId') return matches(row, value as Row);
    const actual = key === 'puzzle' && 'puzzleId' in row
      ? puzzles.find((puzzle) => puzzle.id === row.puzzleId) : row[key];
    if (value instanceof Date) return actual instanceof Date && actual.getTime() === value.getTime();
    if (value !== null && typeof value === 'object') {
      const filter = value as Row;
      if ('not' in filter) return actual !== filter.not;
      if ('equals' in filter) return actual === filter.equals;
      if ('in' in filter) return (filter.in as unknown[]).includes(actual);
      if ('is' in filter) return !!actual && matches(actual as Row, filter.is as Row);
      return !!actual && typeof actual === 'object' && matches(actual as Row, filter);
    }
    return actual === value;
  });
}
function project(row: Row, query: Query): Row {
  const result = structuredClone(row);
  const relations = query.select ?? query.include ?? {};
  if ('puzzle' in relations && 'puzzleId' in row) {
    const puzzle = puzzles.find((candidate) => candidate.id === row.puzzleId);
    result.puzzle = puzzle ? project(puzzle, typeof relations.puzzle === 'object' ? relations.puzzle as Query : {}) : null;
  }
  return query.select ? Object.fromEntries(Object.entries(result).filter(([key]) => query.select?.[key])) : result;
}
function insert(data: Row): SessionRow | null {
  if (sessions.some((row) => row.userId === data.userId && row.puzzleId === data.puzzleId)) return null;
  const row: SessionRow = {
    id: `fresh-${++created}`, userId: data.userId as string, puzzleId: data.puzzleId as string,
    entries: structuredClone(data.entries as SerializedGrid), startedAt: new Date(), completedAt: null,
  };
  sessions.push(row);
  mutations.push(`create:${row.id}`);
  return row;
}

beforeEach(() => {
  vi.resetAllMocks();
  mutations = [];
  created = 0;
  beforeDelete = undefined;
  puzzles = ['target', 'second'].map((id) => ({
    id, builderId: 'player-a', grid: structuredClone(answer), hints: { '1-across': 'Fixture clue' },
    title: `P4 ${id}`, phase: 'hints', visibility: 'private',
    publishedAt: new Date('2026-01-02T03:04:05Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-02T03:04:05Z'),
  }));
  sessions = [];
  mocks.getSession.mockResolvedValue({ user: { id: 'player-a' }, session: { id: 'auth-a' } });
  mocks.headers.mockResolvedValue(requestHeaders);
  for (const [model, rows] of [
    [mocks.puzzle, () => puzzles], [mocks.playSession, () => sessions],
  ] as const) {
    for (const method of ['findUnique', 'findFirst', 'findUniqueOrThrow'] as const) {
      model[method].mockImplementation(async (query: Query) => {
        const row = rows().find((candidate) => matches(candidate, query.where));
        if (!row && method === 'findUniqueOrThrow') throw Object.assign(new Error('Not found'), { code: 'P2025' });
        return row ? project(row, query) : null;
      });
    }
  }
  for (const method of ['delete', 'deleteMany'] as const) {
    mocks.playSession[method].mockImplementation(async (query: Query) => {
      beforeDelete?.();
      const found = sessions.filter((row) => matches(row, query.where));
      if (method === 'delete' && found.length !== 1) throw Object.assign(new Error('Not found'), { code: 'P2025' });
      sessions = sessions.filter((row) => !found.includes(row));
      mutations.push(...found.map((row) => `delete:${row.id}`));
      return method === 'deleteMany' ? { count: found.length } : project(found[0], query);
    });
  }
  mocks.playSession.createMany.mockImplementation(async (query: Query) => {
    const data = Array.isArray(query.data) ? query.data : [query.data ?? {}];
    let count = 0;
    for (const item of data) {
      if (insert(item)) count++;
      else if (!query.skipDuplicates) throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    }
    return { count };
  });
  mocks.playSession.create.mockImplementation(async (query: Query) => {
    const row = insert(query.data as Row);
    if (!row) throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    return project(row, query);
  });
  for (const method of ['update', 'updateMany', 'upsert'] as const) {
    mocks.playSession[method].mockImplementation(async () => { throw new Error(`Reset cannot ${method} sessions`); });
  }
  for (const method of ['update', 'updateMany', 'create', 'delete', 'deleteMany'] as const) {
    mocks.puzzle[method].mockImplementation(async () => { throw new Error(`Reset cannot ${method} puzzles`); });
  }
  const db = { puzzle: mocks.puzzle, playSession: mocks.playSession };
  // Rolls back this request's session writes on failure. Puzzle changes model
  // concurrent external writers, so they are not rolled back.
  mocks.transaction.mockImplementation(async (work: ((client: typeof db) => unknown) | Promise<unknown>[]) => {
    const saved = { sessions: structuredClone(sessions), mutations: [...mutations] };
    try {
      return typeof work === 'function' ? await work(db) : await Promise.all(work);
    } catch (error) {
      sessions = saved.sessions; mutations = saved.mutations;
      throw error;
    }
  });
  expect(typeof reset, 'P4 requires resetPlaySession').toBe('function');
});

describe('P4 authenticated attempt reset', () => {
  it('authenticates before any data access, even with malformed identifiers', async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(reset(null as unknown as string, null as unknown as string)).rejects.toThrow('redirect:/');
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
    for (const model of [mocks.puzzle, mocks.playSession]) {
      for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled();
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  for (const builder of ['player-a', 'other-builder']) {
    for (const visibility of ['public', 'private']) {
      for (const complete of [false, true]) {
        it(`replaces the ${complete ? 'completed' : 'partial'} own attempt on ${visibility} puzzle by ${builder} with a fresh one`, async () => {
          Object.assign(puzzles[0], { builderId: builder, visibility });
          const old = seed('player-a', 'target', complete);
          seed('player-b'); seed('player-a', 'second'); seed('player-b', 'second', true);
          const before = snapshot();
          const view = await reset('target', old.id);
          const fresh = own()!;
          expect(fresh.id).not.toBe(old.id);
          expect(fresh.entries).toEqual(blank);
          expect(fresh.completedAt).toBeNull();
          expect(fresh.startedAt.getTime()).toBeGreaterThan(seededStart.getTime());
          expect(view).toEqual(viewOf(fresh));
          expect(JSON.stringify(view)).not.toContain('ANSWER_SENTINEL');
          expect(snapshot()).toEqual({ puzzles: before.puzzles, sessions: [...before.sessions.slice(1), fresh] });
          expect(mutations).toEqual([`delete:${old.id}`, `create:${fresh.id}`]);
          expect(mocks.revalidatePath).toHaveBeenCalledWith('/puzzles');
        });
      }
    }
  }

  it.each(['', null, 42])('rejects malformed session identifier %j without changing data', async (id) => {
    seed(); const before = snapshot();
    await expect(reset('target', id as string)).rejects.toThrow();
    expect(snapshot()).toEqual(before); expect(mutations).toEqual([]);
  });

  it.each(['', null, 42])('rejects malformed puzzle identifier %j without changing data', async (id) => {
    const old = seed(); const before = snapshot();
    await expect(reset(id as string, old.id)).rejects.toThrow();
    expect(snapshot()).toEqual(before); expect(mutations).toEqual([]);
  });

  it.each(['missing', 'draft'])('rejects a %s puzzle and preserves its existing sessions', async (state) => {
    const old = seed();
    if (state === 'draft') puzzles[0].publishedAt = null;
    const before = snapshot();
    await expect(reset(state === 'missing' ? 'missing' : 'target', old.id)).rejects.toThrow();
    expect(snapshot()).toEqual(before); expect(mutations).toEqual([]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('a duplicate or lost-response retry returns the already-created fresh attempt', async () => {
    const old = seed();
    const first = await reset('target', old.id);
    const after = snapshot(); mutations = [];
    await expect(reset('target', old.id)).resolves.toEqual(first);
    expect(snapshot()).toEqual(after); expect(mutations).toEqual([]);
  });

  it('an old request after a newer attempt has progress returns that attempt untouched', async () => {
    const old = seed(); await reset('target', old.id);
    own()!.entries.cells[0][1] = { kind: 'active', letter: 'A' };
    const after = snapshot(); mutations = [];
    await expect(reset('target', old.id)).resolves.toEqual(viewOf(own()!));
    expect(snapshot()).toEqual(after); expect(mutations).toEqual([]);
  });

  it('with no attempt at all, starts a blank one like startPlaySession', async () => {
    const before = snapshot();
    const view = await reset('target', 'already-absent');
    const fresh = own()!;
    expect(view).toEqual(viewOf(fresh)); expect(fresh.entries).toEqual(blank);
    expect(snapshot()).toEqual({ puzzles: before.puzzles, sessions: [fresh] });
    expect(mutations).toEqual([`create:${fresh.id}`]);
  });

  it('ignores forged identity arguments and never deletes a foreign user or different puzzle session', async () => {
    const mine = seed(); const foreign = seed('player-b'); const second = seed('player-a', 'second');
    const before = snapshot();
    const forged = reset as unknown as (id: string, attempt: string, identity: Row) => Promise<PlayPuzzleView>;
    await expect(forged('target', foreign.id, { userId: 'player-b', isBuilder: true })).resolves.toEqual(viewOf(mine));
    await expect(reset('target', second.id)).resolves.toEqual(viewOf(mine));
    expect(snapshot()).toEqual(before); expect(mutations).toEqual([]);
  });

  it('keeps the publication guard when a puzzle becomes unavailable after the initial read', async () => {
    const old = seed(); const before = snapshot();
    beforeDelete = () => { puzzles[0].publishedAt = null; };
    await expect(reset('target', old.id)).rejects.toThrow();
    expect(sessions).toEqual(before.sessions); expect(mutations).toEqual([]);
    expect(puzzles).toEqual([{ ...before.puzzles[0], publishedAt: null }, before.puzzles[1]]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('protects and returns a newer attempt that replaces the row between read and deletion', async () => {
    const old = seed();
    const replacement: SessionRow = { ...structuredClone(old), id: 'concurrent-new-attempt' };
    replacement.entries.cells[0][1] = { kind: 'active', letter: 'A' };
    beforeDelete = () => { sessions = [replacement]; };
    await expect(reset('target', old.id)).resolves.toEqual(viewOf(replacement));
    expect(sessions).toEqual([replacement]); expect(mutations).toEqual([]);
  });

  for (const phase of ['read', 'delete', 'create'] as const) {
    it(`propagates ${phase} failures without fabricating success or changing data`, async () => {
      const old = seed(); seed('player-b'); const before = snapshot();
      const failure = new Error(`Synthetic reset ${phase} failure`);
      if (phase === 'read') {
        for (const method of ['findUnique', 'findFirst', 'findUniqueOrThrow'] as const) mocks.puzzle[method].mockRejectedValue(failure);
      } else if (phase === 'delete') {
        mocks.playSession.delete.mockRejectedValue(failure);
        mocks.playSession.deleteMany.mockRejectedValue(failure);
      } else {
        mocks.playSession.create.mockRejectedValue(failure);
        mocks.playSession.createMany.mockRejectedValue(failure);
      }
      await expect(reset('target', old.id)).rejects.toThrow(failure.message);
      expect(snapshot()).toEqual(before); expect(mutations).toEqual([]);
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });
  }
});
