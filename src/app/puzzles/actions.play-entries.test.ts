import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SerializedGrid } from '@/lib/puzzle-storage';

// P2 acceptance: an in-memory behavioral store, never a database connection.
// Query alternatives are supported so these examples specify persisted effects.
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), headers: vi.fn(), revalidatePath: vi.fn(), transaction: vi.fn(),
  puzzle: {
    findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(),
    update: vi.fn(), updateMany: vi.fn(), create: vi.fn(), delete: vi.fn(),
  },
  playSession: {
    findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(),
    update: vi.fn(), updateMany: vi.fn(), create: vi.fn(), createMany: vi.fn(),
    upsert: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(),
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

type SavePlayEntries = (id: string, entries: SerializedGrid) => Promise<void>;
// Dynamic lookup allows the specification-only commit to type-check before
// implementation; the beforeEach assertion makes every missing-export case red.
const savePlayEntries = (actions as unknown as Record<string, unknown>)
  .savePlayEntries as SavePlayEntries;
type RecordRow = Record<string, unknown>;
type PuzzleRow = RecordRow & {
  id: string; builderId: string; title: string; grid: SerializedGrid;
  hints: Record<string, string>; publishedAt: Date | null; visibility: string;
  phase: string; createdAt: Date; updatedAt: Date;
};
type SessionRow = RecordRow & {
  id: string; userId: string; puzzleId: string; entries: SerializedGrid;
  startedAt: Date; completedAt: Date | null;
};
type Query = {
  where?: RecordRow; data?: RecordRow; select?: RecordRow; include?: RecordRow;
};
let puzzles: PuzzleRow[];
let sessions: SessionRow[];
let mutations: string[];
let beforeSessionMutation: (() => void) | undefined;
const requestHeaders = new Headers({ cookie: 'better-auth.session_token=p2-fixture' });

// Literal P1 geometry; no production numbering/cursor/serialization is used to
// compute these expected entries. ANSWER_SENTINEL must never reach the client.
const answerGrid: SerializedGrid = {
  cols: 3, rows: 3,
  cells: [
    [{ kind: 'active', letter: 'ANSWER_SENTINEL' }, { kind: 'active', letter: 'A' }, { kind: 'active', letter: 'T' }],
    [{ kind: 'active', letter: 'A' }, { kind: 'black' }, { kind: 'active', letter: 'A' }],
    [{ kind: 'active', letter: 'T' }, { kind: 'active', letter: 'E' }, { kind: 'active', letter: 'N' }],
  ],
};
function entries(): SerializedGrid {
  return {
    cols: 3, rows: 3,
    cells: [
      [{ kind: 'active', letter: 'Z' }, { kind: 'active', letter: 'HEART' }, { kind: 'active', letter: null }],
      [{ kind: 'active', letter: null }, { kind: 'black' }, { kind: 'active', letter: 'Q' }],
      [{ kind: 'active', letter: 'M' }, { kind: 'active', letter: null }, { kind: 'active', letter: null }],
    ],
  };
}
function seedSession(userId = 'player-a', puzzleId = 'target', completedAt: Date | null = null): SessionRow {
  const row: SessionRow = {
    id: `session-${userId}-${puzzleId}`, userId, puzzleId, entries: entries(),
    startedAt: new Date('2026-10-01T02:03:04.005Z'), completedAt,
  };
  sessions.push(row);
  return row;
}
function authenticate(userId: string) {
  mocks.getSession.mockResolvedValue({ user: { id: userId }, session: { id: `auth-${userId}` } });
}
function matches(row: RecordRow, where: RecordRow = {}): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return (Array.isArray(value) ? value : [value]).every((part) => matches(row, part as RecordRow));
    if (key === 'OR') return (value as RecordRow[]).some((part) => matches(row, part));
    if (key === 'NOT') return !(Array.isArray(value) ? value : [value]).some((part) => matches(row, part as RecordRow));
    if (key === 'userId_puzzleId' || key === 'puzzleId_userId') return matches(row, value as RecordRow);
    const actual = key === 'puzzle' && 'puzzleId' in row
      ? puzzles.find((puzzle) => puzzle.id === row.puzzleId) : row[key];
    if (value instanceof Date) return actual instanceof Date && actual.getTime() === value.getTime();
    if (value !== null && typeof value === 'object') {
      const filter = value as RecordRow;
      if ('equals' in filter) return actual === filter.equals;
      if ('in' in filter) return (filter.in as unknown[]).includes(actual);
      if ('not' in filter) return actual !== filter.not;
      if ('is' in filter) return !!actual && matches(actual as RecordRow, filter.is as RecordRow);
      return !!actual && typeof actual === 'object' && matches(actual as RecordRow, filter);
    }
    return actual === value;
  });
}
function project(row: RecordRow, query: Query): RecordRow {
  const copy = structuredClone(row);
  const relations = query.include ?? query.select ?? {};
  if ('puzzle' in relations && 'puzzleId' in row) {
    const puzzle = puzzles.find((candidate) => candidate.id === row.puzzleId);
    const options = relations.puzzle;
    copy.puzzle = puzzle ? project(puzzle, options && typeof options === 'object' ? options as Query : {}) : null;
  }
  if ('playSessions' in relations && 'grid' in row) {
    const options = relations.playSessions;
    const relationQuery = options && typeof options === 'object' ? options as Query : {};
    copy.playSessions = sessions.filter((session) => session.puzzleId === row.id && matches(session, relationQuery.where))
      .map((session) => project(session, relationQuery));
  }
  return query.select
    ? Object.fromEntries(Object.entries(copy).filter(([key]) => query.select?.[key])) : copy;
}
function snapshot() { return structuredClone({ puzzles, sessions }); }
function changedEntries(): SerializedGrid {
  const changed = entries();
  changed.cells[0][0] = { kind: 'active', letter: 'X' };
  changed.cells[1][2] = { kind: 'active', letter: null };
  return changed;
}

beforeEach(() => {
  vi.resetAllMocks();
  mutations = [];
  beforeSessionMutation = undefined;
  puzzles = ['target', 'second'].map((id) => ({
    id, builderId: 'player-a', title: `Published ${id}`, grid: structuredClone(answerGrid),
    hints: { '1-across': 'Feline', '3-across': 'Twice five', '1-down': 'Purring pet', '2-down': 'Brown shade' },
    phase: 'hints', publishedAt: new Date('2026-09-30T00:00:00Z'), visibility: 'private',
    createdAt: new Date('2026-09-01T00:00:00Z'), updatedAt: new Date('2026-09-30T00:00:00Z'),
  }));
  sessions = [];
  authenticate('player-a');
  mocks.headers.mockResolvedValue(requestHeaders);
  function bindReads(model: typeof mocks.puzzle | typeof mocks.playSession, rows: () => RecordRow[]) {
    const read = async (query: Query, required = false) => {
      const row = rows().find((candidate) => matches(candidate, query.where));
      if (!row && required) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
      return row ? project(row, query) : null;
    };
    model.findUnique.mockImplementation((query: Query) => read(query));
    model.findFirst.mockImplementation((query: Query) => read(query));
    model.findUniqueOrThrow.mockImplementation((query: Query) => read(query, true));
  }
  bindReads(mocks.puzzle, () => puzzles);
  bindReads(mocks.playSession, () => sessions);
  for (const method of ['update', 'updateMany'] as const) {
    mocks.playSession[method].mockImplementation(async (query: Query) => {
      beforeSessionMutation?.();
      const matching = sessions.filter((row) => matches(row, query.where));
      if (method === 'update' && matching.length === 0) {
        throw Object.assign(new Error('Record not found'), { code: 'P2025' });
      }
      if (method === 'update' && matching.length !== 1) throw new Error('Nonunique update');
      for (const row of matching) {
        mutations.push(`session.${method}`);
        Object.assign(row, structuredClone(query.data));
      }
      return method === 'updateMany' ? { count: matching.length } : project(matching[0], query);
    });
  }
  for (const method of ['create', 'createMany', 'upsert', 'delete', 'deleteMany'] as const) {
    mocks.playSession[method].mockImplementation(async () => {
      mutations.push(`session.${method}`);
      throw new Error('Saving entries must not create, reset or delete sessions');
    });
  }
  for (const method of ['update', 'updateMany', 'create', 'delete'] as const) {
    mocks.puzzle[method].mockImplementation(async () => {
      mutations.push(`puzzle.${method}`);
      throw new Error('Saving entries must never write the answer puzzle');
    });
  }
  const db = { puzzle: mocks.puzzle, playSession: mocks.playSession };
  mocks.transaction.mockImplementation(async (work: ((client: typeof db) => unknown) | Promise<unknown>[]) =>
    typeof work === 'function' ? work(db) : Promise.all(work));
  expect(typeof savePlayEntries, 'P2 requires the savePlayEntries export').toBe('function');
});

describe('Play P2 authenticated entries persistence', () => {
  it('validates the actual auth session before any data access, even for malformed input', async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(savePlayEntries('target', null as unknown as SerializedGrid)).rejects.toThrow('redirect:/');
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
    for (const model of [mocks.puzzle, mocks.playSession]) {
      for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled();
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mutations).toEqual([]);
  });

  for (const builder of ['player-a', 'other-builder']) {
    for (const visibility of ['public', 'private']) {
      it(`saves only entries for a ${visibility} published puzzle by ${builder}, preserving rebus, blanks and metadata`, async () => {
        puzzles[0].builderId = builder;
        puzzles[0].visibility = visibility;
        seedSession();
        const before = snapshot();
        const next = changedEntries();
        const inputBefore = structuredClone(next);
        await expect(savePlayEntries('target', next)).resolves.toBeUndefined();
        expect(next).toEqual(inputBefore);
        expect(snapshot()).toEqual({
          puzzles: before.puzzles,
          sessions: [{ ...before.sessions[0], entries: next }],
        });
        expect(sessions[0].entries.cells[0][1]).toEqual({ kind: 'active', letter: 'HEART' });
        expect(mutations.length).toBeGreaterThan(0);
      });
    }
  }

  it('derives player identity from authentication and keeps both users and puzzles isolated', async () => {
    seedSession();
    seedSession('player-b');
    seedSession('player-a', 'second');
    seedSession('player-b', 'second');
    const before = snapshot();
    const next = changedEntries();
    const forgedSave = savePlayEntries as unknown as (
      id: string, grid: SerializedGrid, identity: { userId: string; sessionId: string; puzzleId: string }
    ) => Promise<void>;
    await forgedSave('target', next, {
      userId: 'player-b', sessionId: 'session-player-b-second', puzzleId: 'second',
    });
    expect(snapshot()).toEqual({
      puzzles: before.puzzles,
      sessions: [{ ...before.sessions[0], entries: next }, ...before.sessions.slice(1)],
    });
    authenticate('player-b');
    const otherNext = entries();
    otherNext.cells[2][2] = { kind: 'active', letter: 'W' };
    await savePlayEntries('target', otherNext);
    expect(snapshot()).toEqual({
      puzzles: before.puzzles,
      sessions: [
        { ...before.sessions[0], entries: next },
        { ...before.sessions[1], entries: otherNext },
        ...before.sessions.slice(2),
      ],
    });
  });

  it.each(['missing puzzle', 'draft without session', 'draft with session', 'no sessions', 'only another player session', 'only another puzzle session'])(
    'rejects %s without creating or changing any row', async (state) => {
      if (state.startsWith('draft')) puzzles[0].publishedAt = null;
      if (state === 'draft with session') seedSession();
      if (state === 'only another player session') seedSession('player-b');
      if (state === 'only another puzzle session') seedSession('player-a', 'second');
      const before = snapshot();
      await expect(savePlayEntries(state === 'missing puzzle' ? 'missing' : 'target', changedEntries())).rejects.toThrow();
      expect(snapshot()).toEqual(before);
      expect(mutations).toEqual([]);
    }
  );

  it('keeps the write publication guard when publication changes after its initial read', async () => {
    seedSession();
    const before = snapshot();
    beforeSessionMutation = () => { puzzles[0].publishedAt = null; };
    await expect(savePlayEntries('target', changedEntries())).rejects.toThrow();
    expect(sessions).toEqual(before.sessions);
    expect(puzzles).toEqual([{ ...before.puzzles[0], publishedAt: null }, before.puzzles[1]]);
    expect(mutations).toEqual([]);
  });

  it.each([null, new Date('2026-10-02T03:04:05.006Z')])(
    'preserves completedAt metadata %j when saving partial wrong entries', async (completedAt) => {
      seedSession('player-a', 'target', completedAt);
      const before = snapshot();
      await savePlayEntries('target', changedEntries());
      expect(snapshot()).toEqual({
        puzzles: before.puzzles, sessions: [{ ...before.sessions[0], entries: changedEntries() }],
      });
    }
  );

  const malformed: Array<[string, () => unknown]> = [
    ['null input', () => null],
    ['array instead of grid', () => []],
    ['missing dimensions', () => ({ cells: entries().cells })],
    ['string column count', () => ({ ...entries(), cols: '3' })],
    ['fractional row count', () => ({ ...entries(), rows: 3.5 })],
    ['wrong column count', () => ({ ...entries(), cols: 2 })],
    ['wrong row count', () => ({ ...entries(), rows: 4 })],
    ['missing cells', () => ({ cols: 3, rows: 3 })],
    ['nonarray cells', () => ({ ...entries(), cells: {} })],
    ['missing row', () => ({ ...entries(), cells: entries().cells.slice(0, 2) })],
    ['extra row', () => ({ ...entries(), cells: [...entries().cells, entries().cells[0]] })],
    ['nonarray row', () => { const value = entries() as unknown as { cells: unknown[] }; value.cells[1] = {}; return value; }],
    ['short row', () => { const value = entries(); value.cells[0].pop(); return value; }],
    ['long row', () => { const value = entries(); value.cells[2].push({ kind: 'active', letter: null }); return value; }],
    ['null cell', () => { const value = entries() as unknown as { cells: unknown[][] }; value.cells[0][0] = null; return value; }],
    ['invalid cell kind', () => { const value = entries() as unknown as { cells: unknown[][] }; value.cells[0][0] = { kind: 'outside' }; return value; }],
    ['active cell made black', () => { const value = entries(); value.cells[0][0] = { kind: 'black' }; return value; }],
    ['black cell made active', () => { const value = entries(); value.cells[1][1] = { kind: 'active', letter: null }; return value; }],
    ['missing active letter', () => { const value = entries() as unknown as { cells: unknown[][] }; value.cells[0][0] = { kind: 'active' }; return value; }],
    ['numeric letter', () => { const value = entries() as unknown as { cells: unknown[][] }; value.cells[0][0] = { kind: 'active', letter: 7 }; return value; }],
    ['object letter', () => { const value = entries() as unknown as { cells: unknown[][] }; value.cells[0][0] = { kind: 'active', letter: { answer: 'X' } }; return value; }],
    ['empty string letter', () => { const value = entries(); value.cells[0][0] = { kind: 'active', letter: '' }; return value; }],
  ];
  it.each(malformed)('rejects malformed input: %s without any write', async (_name, makeInput) => {
    seedSession();
    seedSession('player-b');
    const before = snapshot();
    await expect(savePlayEntries('target', makeInput() as SerializedGrid)).rejects.toThrow();
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });

  it('does not return the stored solution, session metadata or correctness data', async () => {
    seedSession();
    const result: unknown = await savePlayEntries('target', changedEntries());
    expect(result).toBeUndefined();
    expect(JSON.stringify(result) ?? '').not.toContain('ANSWER_SENTINEL');
  });

  it('propagates puzzle-read failure without changing any data', async () => {
    seedSession();
    const before = snapshot();
    const failure = new Error('Synthetic puzzle read failure');
    for (const method of ['findUnique', 'findFirst', 'findUniqueOrThrow'] as const) {
      mocks.puzzle[method].mockRejectedValue(failure);
    }
    await expect(savePlayEntries('target', changedEntries())).rejects.toThrow('Synthetic puzzle read failure');
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });

  it('propagates save failure instead of fabricating success or changing other data', async () => {
    seedSession();
    seedSession('player-b');
    const before = snapshot();
    const failure = new Error('Synthetic entries write failure');
    for (const method of ['update', 'updateMany', 'upsert'] as const) {
      mocks.playSession[method].mockRejectedValue(failure);
    }
    await expect(savePlayEntries('target', changedEntries())).rejects.toThrow('Synthetic entries write failure');
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });
});
