import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SerializedGrid } from '@/lib/puzzle-storage';

// 16-S1 acceptance: an in-memory behavioral store, never a database connection.
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

type Row = Record<string, unknown>;
type SessionRow = { id: string; userId: string; puzzleId: string; entries: unknown; startedAt: Date; completedAt: Date | null };

const CALLER = 'player-a';
const grid: SerializedGrid = {
  cols: 2, rows: 2,
  cells: [
    [{ kind: 'active', letter: 'A' }, { kind: 'active', letter: 'B' }],
    [{ kind: 'black' }, { kind: 'active', letter: 'C' }],
  ],
};
function attempt(state: 'blank' | 'partial'): SerializedGrid {
  const value = structuredClone(grid);
  for (const row of value.cells) for (const cell of row) if (cell.kind === 'active') cell.letter = null;
  if (state === 'partial') value.cells[0][0] = { kind: 'active', letter: 'A' };
  return value;
}

let puzzles: Row[];
let sessions: SessionRow[];
let counter: number;

/** `title` doubles as a sentinel: a puzzle that must not be sent never has it in the payload. */
function puzzle(id: string, options: { builderId: string; published: boolean; visibility: 'private' | 'public' }): Row {
  counter += 1;
  const row = {
    id, builderId: options.builderId, title: `TITLE_${id}`,
    updatedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 100 - counter)),
    grid, hints: { '1-across': 'Clue' }, phase: 'hints', gridBeforeHints: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    publishedAt: options.published ? new Date('2026-01-02T03:04:05Z') : null,
    visibility: options.visibility,
  };
  puzzles.push(row);
  return row;
}
function session(puzzleId: string, userId: string, state: 'blank' | 'partial' = 'partial'): SessionRow {
  const row: SessionRow = {
    id: `${userId}-${puzzleId}`, userId, puzzleId, entries: attempt(state),
    startedAt: new Date('2026-01-03T04:05:06Z'), completedAt: null,
  };
  sessions.push(row);
  return row;
}

function sessionsOf(puzzleId: string) {
  return sessions.filter((row) => row.puzzleId === puzzleId) as unknown as Row[];
}
/** Prisma's where semantics for the filters the library query can use, including
 *  the `playSessions` relation filters. Anything else fails loudly. */
function matches(row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'OR') return (expected as Row[]).some((clause) => matches(row, clause));
    if (key === 'AND') return ([] as Row[]).concat(expected as Row | Row[]).every((clause) => matches(row, clause));
    if (key === 'NOT') return !([] as Row[]).concat(expected as Row | Row[]).some((clause) => matches(row, clause));
    if (key === 'playSessions') {
      const filter = expected as Row;
      const related = sessionsOf(row.id as string);
      if ('some' in filter) return related.some((item) => matches(item, filter.some as Row));
      if ('none' in filter) return !related.some((item) => matches(item, filter.none as Row));
      if ('every' in filter) return related.every((item) => matches(item, filter.every as Row));
      throw new Error('16-S1 fixture: unsupported playSessions filter');
    }
    if (expected === null || typeof expected !== 'object' || expected instanceof Date) {
      return row[key] === expected;
    }
    const filter = expected as Row;
    if ('equals' in filter) return row[key] === filter.equals;
    if ('in' in filter) return (filter.in as unknown[]).includes(row[key]);
    if ('notIn' in filter) return !(filter.notIn as unknown[]).includes(row[key]);
    if ('not' in filter) return row[key] !== filter.not;
    throw new Error(`16-S1 fixture: unsupported filter on ${key}`);
  });
}
function project(row: Row, select: Row | undefined): Row {
  if (!select) return { ...row };
  return Object.fromEntries(Object.entries(select).filter(([, value]) => value).map(([key]) => [key, row[key]]));
}
function findMany(query: { where?: Row; select?: Row; include?: Row; orderBy?: Row } = {}) {
  const order = query.orderBy as { updatedAt?: 'asc' | 'desc' } | undefined;
  const rows = puzzles.filter((row) => matches(row, query.where)).sort((a, b) => {
    const delta = (a.updatedAt as Date).getTime() - (b.updatedAt as Date).getTime();
    return order?.updatedAt === 'asc' ? delta : -delta;
  });
  return rows.map((row) => {
    const { playSessions: nestedQuery, builder: builderQuery, ...scalars } = query.select ?? {};
    const result = query.select ? project(row, scalars as Row) : { ...row };
    const nested = (nestedQuery ?? query.include?.playSessions) as { where?: Row; select?: Row; take?: number } | true | undefined;
    if (nested) {
      const relation = nested === true ? {} : nested;
      const related = sessionsOf(row.id as string).filter((item) => matches(item, relation.where));
      result.playSessions = related.slice(0, relation.take ?? related.length).map((item) => project(item, relation.select));
    }
    const builder = builderQuery ?? query.include?.builder;
    if (builder) {
      const user = { id: row.builderId, displayName: `Name of ${row.builderId as string}` };
      result.builder = builder === true ? user : project(user, (builder as { select?: Row }).select);
    }
    return result;
  });
}
async function listedIds() {
  return (await listPuzzles()).map((row) => row.id);
}

beforeEach(() => {
  vi.resetAllMocks();
  puzzles = []; sessions = []; counter = 0;
  mocks.headers.mockResolvedValue(new Headers({ cookie: 'better-auth.session_token=16-s1' }));
  mocks.getSession.mockResolvedValue({ user: { id: CALLER }, session: { id: 'valid' } });
  mocks.puzzle.findMany.mockImplementation(async (query) => structuredClone(findMany(query)));
});

describe('16-S1-5 listPuzzles hides other builders’ unlisted puzzles', () => {
  it('lists own puzzles in every state, others’ public ones and others’ unlisted ones the caller has played', async () => {
    puzzle('own-draft', { builderId: CALLER, published: false, visibility: 'private' });
    puzzle('own-unlisted', { builderId: CALLER, published: true, visibility: 'private' });
    puzzle('own-public', { builderId: CALLER, published: true, visibility: 'public' });
    puzzle('foreign-public', { builderId: 'builder', published: true, visibility: 'public' });
    puzzle('foreign-unlisted-played', { builderId: 'builder', published: true, visibility: 'private' });
    session('foreign-unlisted-played', CALLER);
    puzzle('foreign-unlisted', { builderId: 'builder', published: true, visibility: 'private' });

    expect(await listedIds()).toEqual([
      'own-draft', 'own-unlisted', 'own-public', 'foreign-public', 'foreign-unlisted-played',
    ]);
  });

  it('never sends an unlisted puzzle the caller neither built nor played', async () => {
    puzzle('foreign-unlisted', { builderId: 'builder', published: true, visibility: 'private' });
    puzzle('foreign-public', { builderId: 'builder', published: true, visibility: 'public' });

    const rows = await listPuzzles();

    expect(rows.map((row) => row.id)).toEqual(['foreign-public']);
    expect(JSON.stringify(rows)).not.toContain('TITLE_foreign-unlisted');
  });

  it('counts only the caller’s own session, not another player’s', async () => {
    puzzle('played-by-someone-else', { builderId: 'builder', published: true, visibility: 'private' });
    session('played-by-someone-else', 'player-b');
    puzzle('played-by-builder', { builderId: 'builder', published: true, visibility: 'private' });
    session('played-by-builder', 'builder');

    expect(await listedIds()).toEqual([]);
  });

  it('lists a played unlisted puzzle with the caller’s play state, an untouched blank attempt included', async () => {
    puzzle('in-progress', { builderId: 'builder', published: true, visibility: 'private' });
    const partial = session('in-progress', CALLER, 'partial');
    puzzle('opened', { builderId: 'builder', published: true, visibility: 'private' });
    const blank = session('opened', CALLER, 'blank');

    const rows = await listPuzzles();

    expect(rows.map((row) => [row.id, row.visibility, row.play])).toEqual([
      ['in-progress', 'private', { state: 'in-progress', sessionId: partial.id }],
      ['opened', 'private', { state: 'untouched', sessionId: blank.id }],
    ]);
  });

  it('does not list another builder’s unpublished puzzle even when the caller has a session for it', async () => {
    puzzle('foreign-draft', { builderId: 'builder', published: false, visibility: 'public' });
    session('foreign-draft', CALLER);
    puzzle('foreign-unlisted-draft', { builderId: 'builder', published: false, visibility: 'private' });
    session('foreign-unlisted-draft', CALLER);

    expect(await listedIds()).toEqual([]);
  });

  it('filters in the one database query: the hidden puzzle is never read, and no session query runs', async () => {
    puzzle('foreign-unlisted', { builderId: 'builder', published: true, visibility: 'private' });
    puzzle('foreign-public', { builderId: 'builder', published: true, visibility: 'public' });

    await listPuzzles();

    expect(mocks.puzzle.findMany).toHaveBeenCalledOnce();
    const read = await mocks.puzzle.findMany.mock.results[0].value;
    expect(JSON.stringify(read)).not.toContain('TITLE_foreign-unlisted');
    for (const fn of Object.values(mocks.playSession)) expect(fn).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
