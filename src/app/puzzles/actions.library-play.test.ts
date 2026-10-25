import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SerializedGrid } from '@/lib/puzzle-storage';

// P5 acceptance: an in-memory behavioral store, never a database connection.
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), headers: vi.fn(), revalidatePath: vi.fn(), transaction: vi.fn(),
  puzzle: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
  playSession: {
    findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(),
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
import { listPuzzles } from './actions';

type PlayState = 'untouched' | 'in-progress' | 'completed';
type Play = { state: PlayState; sessionId: string | null } | null;
// Allows a drafting baseline to type-check; the assertions make missing runtime red.
type Listed = Awaited<ReturnType<typeof listPuzzles>>[number] & { play?: Play };
type Row = Record<string, unknown>;
type SessionRow = {
  id: string; userId: string; puzzleId: string; entries: unknown;
  startedAt: Date; completedAt: Date | null;
};

const requestHeaders = new Headers({ cookie: 'better-auth.session_token=p5-fixture' });
const answer: SerializedGrid = {
  cols: 2, rows: 2,
  cells: [
    [{ kind: 'active', letter: 'ANSWER_SENTINEL' }, { kind: 'active', letter: 'A' }],
    [{ kind: 'black' }, { kind: 'active', letter: 'T' }],
  ],
};
function entries(state: 'blank' | 'partial' | 'incorrect' | 'solved' | 'mismatched'): SerializedGrid {
  const value = structuredClone(answer);
  if (state === 'blank' || state === 'mismatched') {
    for (const row of value.cells) for (const cell of row) if (cell.kind === 'active') cell.letter = null;
  } else if (state === 'partial') {
    value.cells[0][0] = { kind: 'active', letter: null };
  } else if (state === 'incorrect') {
    value.cells[0][0] = { kind: 'active', letter: 'Z' };
  }
  // Blank and the same size, but the stored black square no longer matches the grid.
  if (state === 'mismatched') value.cells[1][0] = { kind: 'active', letter: null };
  return value;
}

let puzzles: Row[];
let sessions: SessionRow[];
let counter: number;
/** Each user's stored displayName (14-S2). */
let users: Record<string, string | null>;

function puzzle(id: string, published: boolean, overrides: Row = {}): Row {
  counter += 1;
  const row = {
    id, builderId: 'builder', title: `P5 ${id}`,
    updatedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 100 - counter)),
    grid: answer, hints: { '1-across': 'Fixture clue' }, phase: 'hints',
    gridBeforeHints: null, createdAt: new Date('2026-01-01T00:00:00Z'),
    publishedAt: published ? new Date('2026-01-02T03:04:05Z') : null,
    visibility: 'public', ...overrides,
  };
  puzzles.push(row);
  return row;
}
function session(
  puzzleId: string,
  state: Parameters<typeof entries>[0],
  { userId = 'player-a', stamped = false }: { userId?: string; stamped?: boolean } = {}
): SessionRow {
  const row: SessionRow = {
    id: `${userId}-${puzzleId}`, userId, puzzleId, entries: entries(state),
    startedAt: new Date('2026-01-03T04:05:06Z'),
    completedAt: stamped ? new Date('2026-01-04T04:05:06Z') : null,
  };
  sessions.push(row);
  return row;
}

function matches(row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    // 14-S2: the library's filter combines clauses.
    if (key === 'OR') return (expected as Row[]).some((clause) => matches(row, clause));
    if (key === 'AND') return ([] as Row[]).concat(expected as Row | Row[]).every((clause) => matches(row, clause));
    if (key === 'NOT') return !([] as Row[]).concat(expected as Row | Row[]).some((clause) => matches(row, clause));
    if (expected === null || typeof expected !== 'object' || expected instanceof Date) {
      return row[key] === expected;
    }
    const filter = expected as Row;
    if ('equals' in filter) return row[key] === filter.equals;
    if ('in' in filter) return (filter.in as unknown[]).includes(row[key]);
    if ('not' in filter) return row[key] !== filter.not;
    throw new Error(`P5 fixture: unsupported filter on ${key}`);
  });
}
function project(row: Row, select: Row | undefined): Row {
  if (!select) return { ...row };
  return Object.fromEntries(Object.entries(select).filter(([, value]) => value).map(([key]) => [key, row[key]]));
}
/** Applies a nested `playSessions` relation query the way Prisma does. */
function relation(puzzleId: string, query: unknown): Row[] {
  const nested = (query === true ? {} : query) as { where?: Row; select?: Row; take?: number };
  // The relation itself must be filtered to the authenticated caller.
  if (nested.where?.userId !== 'player-a') throw new Error('P5 fixture: playSessions must filter by the caller');
  const rows = sessions.filter((row) => row.puzzleId === puzzleId && matches(row, nested.where));
  return rows.slice(0, nested.take ?? rows.length).map((row) => project(row, nested.select));
}
function findMany(query: { where?: Row; select?: Row; include?: Row; orderBy?: Row } = {}) {
  const order = query.orderBy as { updatedAt?: 'asc' | 'desc' } | undefined;
  const rows = puzzles.filter((row) => matches(row, query.where)).sort((a, b) => {
    const delta = (a.updatedAt as Date).getTime() - (b.updatedAt as Date).getTime();
    return order?.updatedAt === 'asc' ? delta : -delta;
  });
  return rows.map((row) => {
    const { playSessions: selected, builder: builderQuery, ...scalars } = query.select ?? {};
    const result = query.select ? project(row, scalars as Row) : { ...row };
    const nested = selected ?? query.include?.playSessions;
    if (nested) result.playSessions = relation(row.id as string, nested);
    // 14-S2: the builder relation, as Prisma resolves it inside the same query.
    const builder = builderQuery ?? query.include?.builder;
    if (builder) {
      const user = { id: row.builderId, displayName: users[row.builderId as string] ?? null };
      result.builder = builder === true ? user : project(user, (builder as { select?: Row }).select);
    }
    return result;
  });
}
async function list(): Promise<Listed[]> {
  return (await listPuzzles()) as Listed[];
}
async function playOf(id: string): Promise<Play | undefined> {
  return (await list()).find((item) => item.id === id)?.play;
}

beforeEach(() => {
  vi.resetAllMocks();
  puzzles = []; sessions = []; counter = 0;
  users = { builder: 'Fixture Builder', 'player-a': 'Player A' };
  mocks.headers.mockResolvedValue(requestHeaders);
  mocks.getSession.mockResolvedValue({ user: { id: 'player-a' }, session: { id: 'valid' } });
  mocks.puzzle.findMany.mockImplementation(async (query) => structuredClone(findMany(query)));
});

describe('P5 — listPuzzles learns about play', () => {
  it('authenticates before any puzzle or session access', async () => {
    mocks.getSession.mockResolvedValue(null);
    puzzle('target', true); session('target', 'partial');

    await expect(listPuzzles()).rejects.toThrow('redirect:/');
    for (const fn of [...Object.values(mocks.puzzle), ...Object.values(mocks.playSession), mocks.transaction]) {
      expect(fn).not.toHaveBeenCalled();
    }
  });

  it('keeps every existing field and the updated-at order, adding play and builderName', async () => {
    // 14-S2: a draft is listed only for its own builder.
    puzzle('newer-draft', false, { builderId: 'player-a', phase: 'grid', visibility: 'private' });
    puzzle('older-published', true, { visibility: 'private' });

    const rows = await list();

    expect(rows.map((row) => row.id)).toEqual(['newer-draft', 'older-published']);
    expect(rows[0]).toEqual({
      id: 'newer-draft', builderId: 'player-a', builderName: 'Player A', title: 'P5 newer-draft',
      updatedAt: puzzles[0].updatedAt, phase: 'grid', hintsComplete: expect.any(Boolean),
      publishedAt: null, visibility: 'private', cols: 2, rows: 2,
      black: [[false, false], [true, false]], play: null,
    });
    expect(rows[1]).toEqual(expect.objectContaining({
      id: 'older-published', publishedAt: puzzles[1].publishedAt, visibility: 'private',
      play: { state: 'untouched', sessionId: null },
    }));
  });

  it('gives unpublished puzzles no play state, even when a session survives', async () => {
    // 14-S2: the caller's own draft, since other builders' drafts are not listed.
    puzzle('unpublished', false, { builderId: 'player-a' });
    session('unpublished', 'solved', { stamped: true });

    expect(await playOf('unpublished')).toBeNull();
  });

  it('classifies an absent and a blank attempt as untouched', async () => {
    puzzle('absent', true);
    puzzle('blank', true); const blank = session('blank', 'blank');

    expect(await playOf('absent')).toEqual({ state: 'untouched', sessionId: null });
    expect(await playOf('blank')).toEqual({ state: 'untouched', sessionId: blank.id });
  });

  for (const state of ['partial', 'incorrect', 'mismatched'] as const) {
    it(`classifies a ${state} attempt as in progress`, async () => {
      puzzle('target', true); const own = session('target', state);

      expect(await playOf('target')).toEqual({ state: 'in-progress', sessionId: own.id });
    });
  }

  for (const stamped of [true, false]) {
    it(`classifies a solved attempt as completed ${stamped ? 'with' : 'without'} a completion stamp`, async () => {
      puzzle('target', true); const own = session('target', 'solved', { stamped });

      expect(await playOf('target')).toEqual({ state: 'completed', sessionId: own.id });
    });
  }

  it('does not trust a completion stamp the entries no longer support', async () => {
    puzzle('target', true); const own = session('target', 'incorrect', { stamped: true });

    expect(await playOf('target')).toEqual({ state: 'in-progress', sessionId: own.id });
  });

  it("reads only the caller's attempt, ignoring other players' sessions", async () => {
    puzzle('others-only', true);
    session('others-only', 'solved', { userId: 'player-b', stamped: true });
    puzzle('both', true);
    session('both', 'solved', { userId: 'player-b', stamped: true });
    const own = session('both', 'partial');

    expect(await playOf('others-only')).toEqual({ state: 'untouched', sessionId: null });
    expect(await playOf('both')).toEqual({ state: 'in-progress', sessionId: own.id });
  });

  it('reads play state inside the single puzzle query, never with a separate session query', async () => {
    puzzle('target', true); session('target', 'partial');

    await list();

    expect(mocks.puzzle.findMany).toHaveBeenCalledOnce();
    expect(mocks.puzzle.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { updatedAt: 'desc' } }));
    for (const fn of Object.values(mocks.playSession)) expect(fn).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('returns no entries, answers, timestamps or other players’ data', async () => {
    puzzle('target', true);
    session('target', 'solved', { stamped: true });
    session('target', 'partial', { userId: 'player-b' });

    const serialized = JSON.stringify(await list());

    expect(serialized).not.toContain('ANSWER_SENTINEL');
    expect(serialized).not.toContain('player-b');
    expect(serialized).not.toContain('"entries"');
    expect(serialized).not.toContain('startedAt');
    expect(serialized).not.toContain('completedAt');
    expect(serialized).not.toContain('2026-01-03');
    expect(serialized).not.toContain('2026-01-04');
  });
});

describe('14-S2 — listPuzzles sends only what the library shows', () => {
  it("never returns another builder's unpublished puzzle", async () => {
    puzzle('own-draft', false, { builderId: 'player-a' });
    puzzle('foreign-draft', false, { builderId: 'builder', title: 'FOREIGN_DRAFT_SENTINEL' });
    puzzle('foreign-published', true, { builderId: 'builder' });
    puzzle('own-published', true, { builderId: 'player-a' });

    const rows = await list();

    expect(rows.map((row) => row.id)).toEqual(['own-draft', 'foreign-published', 'own-published']);
    expect(JSON.stringify(rows)).not.toContain('FOREIGN_DRAFT_SENTINEL');
  });

  it("returns each builder's trimmed username as builderName, null when blank or missing", async () => {
    users = { builder: '  Grace Maker  ', 'player-a': '   ', nameless: null };
    puzzle('named', true, { builderId: 'builder' });
    puzzle('blank', true, { builderId: 'player-a' });
    puzzle('missing', true, { builderId: 'nameless' });

    const rows = await list();
    const nameOf = (id: string) => (rows.find((row) => row.id === id) as Record<string, unknown> | undefined)?.builderName;

    expect(nameOf('named')).toBe('Grace Maker');
    expect(nameOf('blank')).toBeNull();
    expect(nameOf('missing')).toBeNull();
    expect(mocks.puzzle.findMany).toHaveBeenCalledOnce();
    for (const fn of Object.values(mocks.playSession)) expect(fn).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('adds no field beyond builderName', async () => {
    puzzle('target', true, { builderId: 'builder' });

    const [row] = await list();

    expect(Object.keys(row).sort()).toEqual([
      'black', 'builderId', 'builderName', 'cols', 'hintsComplete', 'id', 'phase', 'play',
      'publishedAt', 'rows', 'title', 'updatedAt', 'visibility',
    ]);
  });
});
