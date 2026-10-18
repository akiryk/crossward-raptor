import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGrid, withLetter } from '@/engine/grid';
import { serializeGrid, type SerializedGrid } from '@/lib/puzzle-storage';

// Play P1 frozen acceptance. This store models persisted effects, not a
// required Prisma query sequence. It never connects to a database.
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), headers: vi.fn(), revalidatePath: vi.fn(),
  puzzle: {
    findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(),
    update: vi.fn(), updateMany: vi.fn(), create: vi.fn(), delete: vi.fn(),
  },
  playSession: {
    findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(),
    create: vi.fn(), createMany: vi.fn(), upsert: vi.fn(), update: vi.fn(),
  },
  transaction: vi.fn(),
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

// These two exports are intentionally absent before P1 implementation.
const { loadPlayPuzzle, startPlaySession } = actions;

type RecordRow = Record<string, unknown>;
type PuzzleRow = RecordRow & {
  id: string; builderId: string; title: string; grid: SerializedGrid;
  hints: Record<string, string>; phase: string; gridBeforeHints: null;
  publishedAt: Date | null; visibility: string; createdAt: Date; updatedAt: Date;
};
type SessionRow = RecordRow & {
  id: string; userId: string; puzzleId: string; entries: SerializedGrid;
  startedAt: Date; completedAt: Date | null;
};
type Query = {
  where?: RecordRow; data?: RecordRow | RecordRow[]; create?: RecordRow;
  update?: RecordRow; skipDuplicates?: boolean; select?: RecordRow; include?: RecordRow;
};
let puzzles: PuzzleRow[];
let sessions: SessionRow[];
let writes: string[];
let nextSession: number;
const requestHeaders = new Headers({ cookie: 'better-auth.session_token=fixture' });

const black = [{ col: 2, row: 0 }, { col: 0, row: 2 }];
let answers = createGrid({ cols: 3, rows: 3, black });
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    if (answers.at(col, row)?.kind === 'active') answers = withLetter(answers, { col, row }, 'A');
  }
}
answers = withLetter(answers, { col: 0, row: 0 }, 'ANSWER');
const answerGrid = serializeGrid(answers);
const emptyEntries = serializeGrid(createGrid({ cols: 3, rows: 3, black }));
const resumedEntries = serializeGrid(withLetter(
  withLetter(createGrid({ cols: 3, rows: 3, black }), { col: 0, row: 0 }, 'WRONG'),
  { col: 1, row: 1 }, 'Z'
));

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
    if (value instanceof Date) return actual instanceof Date && value.getTime() === actual.getTime();
    if (value !== null && typeof value === 'object') {
      const filter = value as RecordRow;
      if ('equals' in filter) return actual === filter.equals;
      if ('in' in filter) return (filter.in as unknown[]).includes(actual);
      if ('not' in filter) return actual !== filter.not;
      if ('is' in filter) return !!actual && matches(actual as RecordRow, filter.is as RecordRow);
      if (actual && typeof actual === 'object') return matches(actual as RecordRow, filter);
      throw new Error(`Unsupported acceptance-store filter: ${key}`);
    }
    return actual === value;
  });
}

function project(row: RecordRow, query: Query): RecordRow {
  const copy = structuredClone(row);
  const relations = query.include ?? query.select ?? {};
  if ('playSessions' in relations && 'grid' in row) {
    const relation = relations.playSessions;
    const options = relation && typeof relation === 'object' ? relation as Query : {};
    copy.playSessions = sessions.filter((session) => session.puzzleId === row.id && matches(session, options.where))
      .map((session) => project(session, options));
  }
  if ('puzzle' in relations && 'puzzleId' in row) {
    const puzzle = puzzles.find((candidate) => candidate.id === row.puzzleId);
    const relation = relations.puzzle;
    copy.puzzle = puzzle ? project(puzzle, relation && typeof relation === 'object' ? relation as Query : {}) : null;
  }
  return query.select
    ? Object.fromEntries(Object.entries(copy).filter(([key]) => query.select?.[key])) : copy;
}

function seedSession(userId = 'player-a', puzzleId = 'target', completedAt: Date | null = null): SessionRow {
  const row: SessionRow = {
    id: `seeded-${userId}-${puzzleId}`, userId, puzzleId,
    entries: structuredClone(resumedEntries), startedAt: new Date('2026-10-01T02:03:04.005Z'), completedAt,
  };
  sessions.push(row);
  return row;
}

function view(puzzle: PuzzleRow, session?: SessionRow) {
  return {
    id: puzzle.id, title: puzzle.title, entries: session?.entries ?? emptyEntries,
    hints: puzzle.hints,
    session: session ? { id: session.id, startedAt: session.startedAt, completedAt: session.completedAt } : null,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  writes = [];
  sessions = [];
  nextSession = 0;
  puzzles = ['target', 'second'].map((id) => ({
    id, builderId: 'player-a', title: `Published ${id}`, grid: structuredClone(answerGrid),
    hints: { '1-across': 'First clue', '1-down': 'Another clue' }, phase: 'hints', gridBeforeHints: null,
    publishedAt: new Date('2026-09-30T00:00:00Z'), visibility: 'private',
    createdAt: new Date('2026-09-01T00:00:00Z'), updatedAt: new Date('2026-09-30T00:00:00Z'),
  }));
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

  function insert(data: RecordRow): SessionRow {
    const userId = (data.userId ?? (data.user as { connect?: { id?: string } } | undefined)?.connect?.id) as string;
    const puzzleId = (data.puzzleId ?? (data.puzzle as { connect?: { id?: string } } | undefined)?.connect?.id) as string;
    if (!userId || !puzzleId) throw new Error('Session needs both required foreign keys');
    if (sessions.some((session) => session.userId === userId && session.puzzleId === puzzleId)) {
      throw Object.assign(new Error('Unique user/puzzle pair'), { code: 'P2002' });
    }
    const row: SessionRow = {
      id: typeof data.id === 'string' ? data.id : `new-session-${++nextSession}`,
      userId, puzzleId, entries: structuredClone(data.entries) as SerializedGrid,
      startedAt: data.startedAt instanceof Date ? structuredClone(data.startedAt) : new Date(),
      completedAt: data.completedAt instanceof Date ? structuredClone(data.completedAt) : null,
    };
    sessions.push(row);
    return row;
  }
  mocks.playSession.create.mockImplementation(async (query: Query) => {
    writes.push('session.create');
    return project(insert(query.data as RecordRow), query);
  });
  mocks.playSession.createMany.mockImplementation(async (query: Query) => {
    writes.push('session.createMany');
    let count = 0;
    for (const data of Array.isArray(query.data) ? query.data : [query.data as RecordRow]) {
      try { insert(data); count++; }
      catch (error) { if (!query.skipDuplicates || (error as { code?: string }).code !== 'P2002') throw error; }
    }
    return { count };
  });
  mocks.playSession.upsert.mockImplementation(async (query: Query) => {
    writes.push('session.upsert');
    const existing = sessions.find((session) => matches(session, query.where));
    const row = existing ?? insert(query.create!);
    if (existing) Object.assign(existing, structuredClone(query.update));
    return project(row, query);
  });
  mocks.playSession.update.mockImplementation(async (query: Query) => {
    writes.push('session.update');
    const row = sessions.find((session) => matches(session, query.where));
    if (!row) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
    Object.assign(row, structuredClone(query.data));
    return project(row, query);
  });
  for (const method of ['update', 'updateMany', 'create', 'delete'] as const) {
    mocks.puzzle[method].mockImplementation(async () => {
      writes.push(`puzzle.${method}`);
      throw new Error('Play must never write to the answer puzzle');
    });
  }
  const db = { puzzle: mocks.puzzle, playSession: mocks.playSession };
  mocks.transaction.mockImplementation(async (work: ((client: typeof db) => unknown) | Promise<unknown>[]) =>
    typeof work === 'function' ? work(db) : Promise.all(work));
});

describe('Play P1 authoritative reads and session creation', () => {
  for (const [name, call] of [
    ['loadPlayPuzzle', (id: string) => loadPlayPuzzle(id)],
    ['startPlaySession', (id: string) => startPlaySession(id)],
  ] as const) {
    it(`${name} rejects an invalid session before any puzzle or session access`, async () => {
      mocks.getSession.mockResolvedValue(null);
      await expect(call('target')).rejects.toThrow('redirect:/');
      expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
      for (const model of [mocks.puzzle, mocks.playSession]) {
        for (const effect of Object.values(model)) expect(effect).not.toHaveBeenCalled();
      }
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
      expect(writes).toEqual([]);
    });

    it(`${name} propagates a puzzle read failure without fabricating a playable view`, async () => {
      const before = structuredClone({ puzzles, sessions });
      const failure = new Error('Synthetic puzzle read failure');
      for (const method of ['findUnique', 'findFirst', 'findUniqueOrThrow'] as const) {
        mocks.puzzle[method].mockRejectedValue(failure);
      }
      await expect(call('target')).rejects.toThrow('Synthetic puzzle read failure');
      expect({ puzzles, sessions }).toEqual(before);
      expect(writes).toEqual([]);
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it.each(['missing', 'draft without a session', 'draft with an existing session'])(`${name} refuses %s without creating or changing anything`, async (state) => {
      if (state !== 'missing') puzzles[0].publishedAt = null;
      if (state === 'draft with an existing session') seedSession();
      const before = structuredClone({ puzzles, sessions });
      const id = state === 'missing' ? 'missing' : 'target';
      if (name === 'loadPlayPuzzle') await expect(call(id)).resolves.toBeNull();
      else await expect(call(id)).rejects.toThrow();
      expect({ puzzles, sessions }).toEqual(before);
      expect(writes).toEqual([]);
    });
  }

  for (const builder of ['player-a', 'other-builder']) {
    for (const visibility of ['private', 'public']) {
      it(`loads a ${visibility} published puzzle by ${builder} without starting play or exposing answers`, async () => {
        puzzles[0].builderId = builder;
        puzzles[0].visibility = visibility;
        seedSession('different-player');
        const before = structuredClone({ puzzles, sessions });
        await expect(loadPlayPuzzle('target')).resolves.toEqual(view(puzzles[0]));
        await expect(loadPlayPuzzle('target')).resolves.toEqual(view(puzzles[0]));
        expect({ puzzles, sessions }).toEqual(before);
        expect(writes).toEqual([]);
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
      });

      it(`starts the signed-in player's own session on a ${visibility} published puzzle by ${builder}`, async () => {
        puzzles[0].builderId = builder;
        puzzles[0].visibility = visibility;
        const before = structuredClone(puzzles);
        const startedAfter = Date.now();
        const result = await startPlaySession('target');
        expect(sessions).toHaveLength(1);
        expect(sessions[0]).toEqual({
          id: expect.any(String), userId: 'player-a', puzzleId: 'target', entries: emptyEntries,
          startedAt: expect.any(Date), completedAt: null,
        });
        expect(sessions[0].id.length).toBeGreaterThan(0);
        expect(Number.isFinite(sessions[0].startedAt.getTime())).toBe(true);
        expect(sessions[0].startedAt.getTime()).toBeGreaterThanOrEqual(startedAfter);
        expect(sessions[0].startedAt.getTime()).toBeLessThanOrEqual(Date.now());
        expect(result).toEqual(view(puzzles[0], sessions[0]));
        expect(puzzles).toEqual(before);
      });
    }
  }

  it('propagates session creation failure without fabricating a saved session or changing puzzle data', async () => {
    const before = structuredClone({ puzzles, sessions });
    const failure = new Error('Synthetic session creation failure');
    for (const method of ['create', 'createMany', 'upsert'] as const) {
      mocks.playSession[method].mockRejectedValue(failure);
    }
    await expect(startPlaySession('target')).rejects.toThrow('Synthetic session creation failure');
    expect({ puzzles, sessions }).toEqual(before);
    expect(writes).toEqual([]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each([null, new Date('2026-10-02T03:04:05.006Z')])('loads only the signed-in player’s exact saved wrong/rebus entries and completedAt %j', async (completedAt) => {
    seedSession('different-player');
    const own = seedSession('player-a', 'target', completedAt);
    seedSession('player-a', 'second');
    const before = structuredClone({ puzzles, sessions });
    await expect(loadPlayPuzzle('target')).resolves.toEqual(view(puzzles[0], own));
    expect({ puzzles, sessions }).toEqual(before);
    expect(writes).toEqual([]);
  });

  it.each([null, new Date('2026-10-02T03:04:05.006Z')])('repeated starts preserve saved entries and every session timestamp including completedAt %j', async (completedAt) => {
    const own = seedSession('player-a', 'target', completedAt);
    const before = structuredClone({ puzzles, sessions });
    await expect(startPlaySession('target')).resolves.toEqual(view(puzzles[0], own));
    await expect(startPlaySession('target')).resolves.toEqual(view(puzzles[0], own));
    const concurrent = await Promise.all(Array.from({ length: 4 }, () => startPlaySession('target')));
    for (const result of concurrent) expect(result).toEqual(view(puzzles[0], own));
    expect({ puzzles, sessions }).toEqual(before);
  });

  it('concurrent first starts all return the one persisted session and preserve it on later starts', async () => {
    const beforePuzzles = structuredClone(puzzles);
    const results = await Promise.all(Array.from({ length: 4 }, () => startPlaySession('target')));
    expect(sessions).toHaveLength(1);
    expect(sessions[0].userId).toBe('player-a');
    expect(sessions[0].puzzleId).toBe('target');
    expect(sessions[0].entries).toEqual(emptyEntries);
    for (const result of results) expect(result).toEqual(view(puzzles[0], sessions[0]));
    const persisted = structuredClone(sessions);
    await expect(startPlaySession('target')).resolves.toEqual(view(puzzles[0], sessions[0]));
    expect(sessions).toEqual(persisted);
    expect(puzzles).toEqual(beforePuzzles);
  });

  it('keeps both users and puzzles isolated while ignoring an extra client-supplied identity', async () => {
    const beforePuzzles = structuredClone(puzzles);
    const other = seedSession('player-b', 'target');
    const beforeOther = structuredClone(other);
    const forgedStart = startPlaySession as unknown as (id: string, identity: { userId: string; puzzleId: string }) => Promise<unknown>;
    const first = await forgedStart('target', { userId: 'player-b', puzzleId: 'second' });
    const ownTarget = sessions.find((session) => session.userId === 'player-a' && session.puzzleId === 'target')!;
    expect(first).toEqual(view(puzzles[0], ownTarget));
    expect(other).toEqual(beforeOther);
    await expect(startPlaySession('second')).resolves.toEqual(view(puzzles[1], sessions.find((session) => session.puzzleId === 'second')));
    authenticate('player-b');
    await expect(loadPlayPuzzle('target')).resolves.toEqual(view(puzzles[0], other));
    await expect(startPlaySession('target')).resolves.toEqual(view(puzzles[0], other));
    expect(sessions.map(({ userId, puzzleId }) => `${userId}/${puzzleId}`).sort())
      .toEqual(['player-a/second', 'player-a/target', 'player-b/target']);
    expect(other).toEqual(beforeOther);
    expect(puzzles).toEqual(beforePuzzles);
  });
});
