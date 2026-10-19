import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isDeepStrictEqual } from 'node:util';
import type { SerializedGrid } from '@/lib/puzzle-storage';

// P3 acceptance: an in-memory behavioral store, never a database connection.
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

type CompletionResult = { status: 'incomplete' | 'incorrect' }
  | { status: 'complete'; entries: SerializedGrid; completedAt: Date };
type InspectPlayCompletion = (id: string) => Promise<CompletionResult>;
const inspectPlayCompletion = (actions as unknown as Record<string, unknown>)
  .inspectPlayCompletion as InspectPlayCompletion;

type SavePlayEntries = (id: string, entries: SerializedGrid) => Promise<void>;
// Dynamic lookup allows the specification-only commit to type-check before
// implementation; missing behavior still fails its acceptance examples.
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
const requestHeaders = new Headers({ cookie: 'better-auth.session_token=p3-fixture' });

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
      if ('equals' in filter) return isDeepStrictEqual(actual, filter.equals);
      if ('in' in filter) return (filter.in as unknown[]).includes(actual);
      if ('not' in filter) return filter.not !== null && typeof filter.not === 'object'
        ? !matches({ value: actual }, { value: filter.not }) : actual !== filter.not;
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
      const beforeMutation = beforeSessionMutation;
      beforeSessionMutation = undefined;
      beforeMutation?.();
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
});

function fullWrong(): SerializedGrid {
  const value = structuredClone(answerGrid);
  value.cells[0][0] = { kind: 'active', letter: 'X' };
  return value;
}

describe('Play P3 authenticated completion', () => {
  it('exposes the P3 completion operation separately from the unchanged P2 save interface', () => {
    expect(typeof inspectPlayCompletion).toBe('function');
    expect(typeof savePlayEntries).toBe('function');
  });

  it('authenticates before any puzzle, session or transaction access', async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(inspectPlayCompletion('target')).rejects.toThrow('redirect:/');
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
    for (const model of [mocks.puzzle, mocks.playSession]) {
      for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled();
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mutations).toEqual([]);
  });

  for (const builder of ['player-a', 'other-builder']) {
    for (const visibility of ['public', 'private']) {
      it(`completes a ${visibility} published puzzle by ${builder}, stamping only its own session`, async () => {
        puzzles[0].builderId = builder;
        puzzles[0].visibility = visibility;
        const own = seedSession();
        own.entries = structuredClone(answerGrid);
        seedSession('player-b');
        seedSession('player-a', 'second');
        seedSession('player-b', 'second');
        const before = snapshot();
        const lowerBound = Date.now();
        const result = await inspectPlayCompletion('target');
        const upperBound = Date.now();
        expect(result).toEqual({ status: 'complete', entries: answerGrid, completedAt: expect.any(Date) });
        expect(own.completedAt?.getTime()).toBeGreaterThanOrEqual(lowerBound);
        expect(own.completedAt?.getTime()).toBeLessThanOrEqual(upperBound);
        expect(snapshot()).toEqual({
          puzzles: before.puzzles,
          sessions: [{ ...before.sessions[0], completedAt: own.completedAt }, ...before.sessions.slice(1)],
        });
        expect(result.status === 'complete' && result.completedAt).toEqual(own.completedAt);
      });
    }
  }

  it('derives identity from auth rather than forged user, session or entries arguments', async () => {
    seedSession();
    const other = seedSession('player-b');
    other.entries = structuredClone(answerGrid);
    const before = snapshot();
    const forgedInspect = inspectPlayCompletion as unknown as (
      id: string, identity: { userId: string; sessionId: string; entries: SerializedGrid }
    ) => Promise<CompletionResult>;
    expect(await forgedInspect('target', {
      userId: 'player-b', sessionId: other.id, entries: answerGrid,
    })).toEqual({ status: 'incomplete' });
    expect(snapshot()).toEqual(before);
    authenticate('player-b');
    expect(await inspectPlayCompletion('target')).toEqual({
      status: 'complete', entries: answerGrid, completedAt: expect.any(Date),
    });
    expect(sessions[0]).toEqual(before.sessions[0]);
    expect(puzzles).toEqual(before.puzzles);
  });

  it.each(['missing puzzle', 'draft without session', 'draft with session', 'no sessions', 'only another player session', 'only another puzzle session'])(
    'rejects %s without creating, deleting or changing rows', async (state) => {
      if (state.startsWith('draft')) puzzles[0].publishedAt = null;
      if (state === 'draft with session') seedSession();
      if (state === 'only another player session') seedSession('player-b');
      if (state === 'only another puzzle session') seedSession('player-a', 'second');
      const before = snapshot();
      await expect(inspectPlayCompletion(state === 'missing puzzle' ? 'missing' : 'target')).rejects.toThrow();
      expect(snapshot()).toEqual(before);
      expect(mutations).toEqual([]);
    }
  );

  it.each([null, new Date('2026-10-02T03:04:05.006Z')])(
    'returns only incomplete for partial entries, preserving completedAt %j and all stored fields', async (completedAt) => {
      seedSession('player-a', 'target', completedAt);
      const before = snapshot();
      const result = await inspectPlayCompletion('target');
      expect(result).toEqual({ status: 'incomplete' });
      expect(JSON.stringify(result)).not.toContain('ANSWER_SENTINEL');
      expect(snapshot()).toEqual(before);
      expect(mutations).toEqual([]);
    }
  );

  it('rejects overwriting derived solved entries even when legacy JSON has extra fields', async () => {
    seedSession().entries = { ...structuredClone(answerGrid), legacy: true } as SerializedGrid;
    const before = snapshot();
    await expect(savePlayEntries('target', changedEntries())).rejects.toThrow();
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });

  it.each([null, new Date('2026-10-02T03:04:05.006Z')])(
    'returns only incorrect for a full wrong grid, preserving completedAt %j', async (completedAt) => {
      seedSession('player-a', 'target', completedAt).entries = fullWrong();
      const before = snapshot();
      const result = await inspectPlayCompletion('target');
      expect(result).toEqual({ status: 'incorrect' });
      expect(JSON.stringify(result)).not.toContain('ANSWER_SENTINEL');
      expect(snapshot()).toEqual(before);
      expect(mutations).toEqual([]);
    }
  );

  it('does not infer completion from a timestamp when entries are wrong, and retains P2 editing', async () => {
    seedSession('player-a', 'target', new Date('2026-10-02T03:04:05.006Z')).entries = fullWrong();
    const before = snapshot();
    expect(await inspectPlayCompletion('target')).toEqual({ status: 'incorrect' });
    await expect(savePlayEntries('target', changedEntries())).resolves.toBeUndefined();
    expect(snapshot()).toEqual({
      puzzles: before.puzzles, sessions: [{ ...before.sessions[0], entries: changedEntries() }],
    });
  });

  it('keeps an all-black puzzle incomplete without stamping a vacuous completion', async () => {
    const black: SerializedGrid = { cols: 2, rows: 1, cells: [[{ kind: 'black' }, { kind: 'black' }]] };
    puzzles[0].grid = black;
    seedSession().entries = structuredClone(black);
    const before = snapshot();
    expect(await inspectPlayCompletion('target')).toEqual({ status: 'incomplete' });
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });

  it('treats exact matching multi-character strings as correct without normalizing stored entries', async () => {
    const own = seedSession();
    own.entries = structuredClone(answerGrid);
    const before = snapshot();
    expect(await inspectPlayCompletion('target')).toEqual({
      status: 'complete', entries: before.sessions[0].entries, completedAt: expect.any(Date),
    });
    expect(own.entries).toEqual(before.sessions[0].entries);
  });

  it('preserves an existing completion timestamp on repeated correct inspections', async () => {
    const completedAt = new Date('2026-10-02T03:04:05.006Z');
    seedSession('player-a', 'target', completedAt).entries = structuredClone(answerGrid);
    const before = snapshot();
    for (let attempt = 0; attempt < 3; attempt++) {
      expect(await inspectPlayCompletion('target')).toEqual({ status: 'complete', entries: answerGrid, completedAt });
    }
    expect(snapshot()).toEqual(before);
  });

  it('concurrent first completion inspections all preserve one first completion timestamp', async () => {
    const own = seedSession();
    own.entries = structuredClone(answerGrid);
    const before = snapshot();
    const results = await Promise.all(Array.from({ length: 4 }, () => inspectPlayCompletion('target')));
    expect(own.completedAt).toBeInstanceOf(Date);
    for (const result of results) {
      expect(result).toEqual({ status: 'complete', entries: answerGrid, completedAt: own.completedAt });
    }
    expect(snapshot()).toEqual({ puzzles: before.puzzles, sessions: [{ ...before.sessions[0], completedAt: own.completedAt }] });
    expect(mutations).toHaveLength(1);
  });

  it.each(['unpublished', 'changed entries', 'removed own session', 'changed owner'])(
    'does not stamp stale solved reads when the stored state becomes %s before mutation', async (change) => {
      const own = seedSession();
      own.entries = structuredClone(answerGrid);
      const before = snapshot();
      let externalState: ReturnType<typeof snapshot> | undefined;
      beforeSessionMutation = () => {
        if (change === 'unpublished') puzzles[0].publishedAt = null;
        if (change === 'changed entries') own.entries = fullWrong();
        if (change === 'removed own session') sessions = [];
        if (change === 'changed owner') own.userId = 'player-b';
        externalState = snapshot();
      };
      await expect(inspectPlayCompletion('target')).rejects.toThrow();
      expect(externalState).toBeDefined();
      expect(snapshot()).toEqual(externalState);
      expect(mutations).toEqual([]);
      expect(before.sessions[0].completedAt).toBeNull();
    }
  );

  it.each([null, new Date('2026-10-02T03:04:05.006Z')])(
    'server save rejects overwriting actual solved entries even with completedAt %j', async (completedAt) => {
      seedSession('player-a', 'target', completedAt).entries = structuredClone(answerGrid);
      const before = snapshot();
      await expect(savePlayEntries('target', changedEntries())).rejects.toThrow();
      expect(snapshot()).toEqual(before);
      expect(mutations).toEqual([]);
    }
  );

  it('rejects a stale pending save when another tab has solved immediately before the write', async () => {
    const own = seedSession();
    const before = snapshot();
    const completedAt = new Date('2026-10-19T16:00:00Z');
    beforeSessionMutation = () => {
      own.entries = structuredClone(answerGrid);
      own.completedAt = completedAt;
    };
    await expect(savePlayEntries('target', changedEntries())).rejects.toThrow();
    expect(snapshot()).toEqual({
      puzzles: before.puzzles,
      sessions: [{ ...before.sessions[0], entries: answerGrid, completedAt }],
    });
    expect(mutations).toEqual([]);
  });

  it('rejects a stale pending save against newly correct entries even before they are stamped', async () => {
    const own = seedSession();
    const before = snapshot();
    beforeSessionMutation = () => { own.entries = structuredClone(answerGrid); };
    await expect(savePlayEntries('target', changedEntries())).rejects.toThrow();
    expect(snapshot()).toEqual({ puzzles: before.puzzles, sessions: [{ ...before.sessions[0], entries: answerGrid }] });
    expect(mutations).toEqual([]);
  });

  it.each([null, new Date('2026-10-02T03:04:05.006Z')])(
    'accepts an identical solved snapshot as a no-op preserving completedAt %j and all fields', async (completedAt) => {
      seedSession('player-a', 'target', completedAt).entries = structuredClone(answerGrid);
      const before = snapshot();
      await expect(savePlayEntries('target', structuredClone(answerGrid))).resolves.toBeUndefined();
      expect(snapshot()).toEqual(before);
      expect(mutations).toEqual([]);
    }
  );

  it('authenticates an identical-solved no-op before any database access', async () => {
    seedSession().entries = structuredClone(answerGrid);
    mocks.getSession.mockResolvedValue(null);
    const before = snapshot();
    await expect(savePlayEntries('target', structuredClone(answerGrid))).rejects.toThrow('redirect:/');
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
    for (const model of [mocks.puzzle, mocks.playSession]) {
      for (const operation of Object.values(model)) expect(operation).not.toHaveBeenCalled();
    }
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });

  it('rejects identical solved entries for a puzzle that is no longer published', async () => {
    seedSession().entries = structuredClone(answerGrid);
    puzzles[0].publishedAt = null;
    const before = snapshot();
    await expect(savePlayEntries('target', structuredClone(answerGrid))).rejects.toThrow();
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });

  it('does not let solved no-op handling bypass input validation', async () => {
    seedSession().entries = structuredClone(answerGrid);
    const malformed = structuredClone(answerGrid);
    malformed.cells[1][1] = { kind: 'active', letter: 'X' };
    const before = snapshot();
    await expect(savePlayEntries('target', malformed)).rejects.toThrow();
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });

  it.each(['puzzle', 'session'] as const)('propagates %s read failure without changing data', async (model) => {
    seedSession().entries = structuredClone(answerGrid);
    const before = snapshot();
    const failure = new Error(`Synthetic ${model} read failure`);
    const target = model === 'puzzle' ? mocks.puzzle : mocks.playSession;
    for (const method of ['findUnique', 'findFirst', 'findUniqueOrThrow'] as const) {
      target[method].mockRejectedValue(failure);
    }
    await expect(inspectPlayCompletion('target')).rejects.toThrow(failure.message);
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });

  it('propagates completion-stamp failure without returning success or mutating any row', async () => {
    seedSession().entries = structuredClone(answerGrid);
    const before = snapshot();
    const failure = new Error('Synthetic completion write failure');
    for (const method of ['update', 'updateMany'] as const) mocks.playSession[method].mockRejectedValue(failure);
    await expect(inspectPlayCompletion('target')).rejects.toThrow(failure.message);
    expect(snapshot()).toEqual(before);
    expect(mutations).toEqual([]);
  });
});
