import { isDeepStrictEqual } from 'node:util';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGrid, withLetter } from '@/engine/grid';
import { serializePuzzle } from '@/lib/puzzle-storage';

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(), revalidatePath: vi.fn(),
  findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findFirst: vi.fn(),
  update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(),
}));
vi.mock('@/lib/require-session', () => ({ requireSession: mocks.requireSession }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/prisma', () => {
  const db = { puzzle: {
    findUnique: mocks.findUnique, findUniqueOrThrow: mocks.findUniqueOrThrow,
    findFirst: mocks.findFirst, update: mocks.update, updateMany: mocks.updateMany,
    delete: mocks.delete, deleteMany: mocks.deleteMany,
  } };
  return { prisma: { ...db, $transaction: async (work: (client: typeof db) => unknown) => work(db) } };
});

import * as actions from './actions';

let grid = createGrid({ cols: 3, rows: 3 });
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) grid = withLetter(grid, { col, row }, 'A');
}
const stored = serializePuzzle({ grid, hints: {}, phase: 'grid' });
// 14-S4: publishing needs every hint, so a puzzle published here has them all.
const ALL_HINTS = Object.fromEntries(['1-across', '4-across', '5-across', '1-down', '2-down', '3-down'].map((key) => [key, 'A hint']));
const replacement = serializePuzzle({ grid: withLetter(grid, { col: 0, row: 0 }, 'Z'), hints: {}, phase: 'grid' }).grid;
type Row = {
  id: string; builderId: string; title: string; phase: string;
  grid: unknown; hints: unknown; gridBeforeHints: unknown;
  publishedAt: Date | null; visibility: string; createdAt: Date; updatedAt: Date;
};
type Where = Record<string, unknown>;
type Query = { where: Where; data?: Record<string, unknown>; select?: Record<string, boolean> };
let rows: Row[];
let writes: Query[];
let afterRead: (() => void) | undefined;

// Evaluate filters at the write, exposing a checked read followed by an
// unchecked update. Support the usual Prisma forms without fixing call order.
function matches(row: Row, where: Where): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return (Array.isArray(value) ? value : [value]).every((part) => matches(row, part as Where));
    if (key === 'OR') return (value as Where[]).some((part) => matches(row, part));
    if (key === 'NOT') return !(Array.isArray(value) ? value : [value]).some((part) => matches(row, part as Where));
    const actual = row[key as keyof Row];
    if (value instanceof Date) return actual instanceof Date && actual.getTime() === value.getTime();
    if (value !== null && typeof value === 'object') {
      const filter = value as Record<string, unknown>;
      if ('equals' in filter) return isDeepStrictEqual(actual, filter.equals);
      if ('in' in filter) return (filter.in as unknown[]).includes(actual);
      if ('not' in filter) return actual !== filter.not;
      throw new Error(`Unsupported acceptance-store filter: ${key}`);
    }
    return actual === value;
  });
}
function own() { return rows.find((row) => row.id === 'target')!; }
const contentActions = ['saveGrid', 'saveHints', 'saveTitle', 'enterHints'];
const calls: Array<[string, (id: string) => Promise<unknown>]> = [
  ['saveGrid', (id) => actions.saveGrid(id, replacement)],
  ['saveHints', (id) => actions.saveHints(id, { '1-across': 'Changed clue' })],
  ['saveTitle', (id) => actions.saveTitle(id, '  Changed title  ')],
  ['enterHints', (id) => actions.enterHints(id)],
  ['publishPuzzle', (id) => actions.publishPuzzle(id, 'public')],
  ['deletePuzzle', (id) => actions.deletePuzzle(id)],
];

beforeEach(() => {
  vi.resetAllMocks();
  writes = [];
  afterRead = undefined;
  rows = ['target', 'decoy'].map((id) => ({
    ...structuredClone(stored), id, builderId: 'session-builder', title: `Original ${id}`,
    gridBeforeHints: null, publishedAt: null, visibility: 'private',
    createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-02T00:00:00Z'),
  }));
  mocks.requireSession.mockResolvedValue({ user: { id: 'session-builder', role: 'admin' } });
  const read = async (query: Query, required = false) => {
    const row = rows.find((candidate) => matches(candidate, query.where));
    if (!row && required) throw new Error('No matching puzzle');
    const snapshot = row ? structuredClone(row) : null;
    afterRead?.();
    afterRead = undefined;
    return snapshot && query.select
      ? Object.fromEntries(Object.entries(snapshot).filter(([key]) => query.select?.[key]))
      : snapshot;
  };
  mocks.findUnique.mockImplementation((query: Query) => read(query));
  mocks.findFirst.mockImplementation((query: Query) => read(query));
  mocks.findUniqueOrThrow.mockImplementation((query: Query) => read(query, true));
  const write = async (query: Query, remove: boolean, many: boolean) => {
    writes.push(structuredClone(query));
    const selected = rows.filter((row) => matches(row, query.where));
    if (!many && selected.length === 0) throw new Error('No matching puzzle');
    const previous = selected[0] && structuredClone(selected[0]);
    if (remove) rows = rows.filter((row) => !selected.includes(row));
    else for (const row of selected) Object.assign(row, query.data, { updatedAt: new Date('2026-10-18T12:00:00Z') });
    return many ? { count: selected.length } : remove ? previous : structuredClone(selected[0]);
  };
  mocks.update.mockImplementation((query: Query) => write(query, false, false));
  mocks.updateMany.mockImplementation((query: Query) => write(query, false, true));
  mocks.delete.mockImplementation((query: Query) => write(query, true, false));
  mocks.deleteMany.mockImplementation((query: Query) => write(query, true, true));
});

describe('O3 builder-only mutation authority', () => {
  it.each([...calls, ['loadPuzzle', (id: string) => actions.loadPuzzle(id)] as const])('%s rejects invalid sessions before data access', async (_name, call) => {
    mocks.requireSession.mockRejectedValue(new Error('redirect:/'));
    await expect(call('target')).rejects.toThrow('redirect:/');
    for (const [name, effect] of Object.entries(mocks)) if (name !== 'requireSession') expect(effect).not.toHaveBeenCalled();
  });

  it.each(calls)('%s cannot mutate another builder’s puzzle, even with an admin role', async (name, call) => {
    own().builderId = 'other-builder';
    if (name === 'publishPuzzle') own().phase = 'hints';
    const before = structuredClone(rows);
    await expect(call('target')).rejects.toThrow();
    expect(rows).toEqual(before);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each(calls)('%s rejects missing targets without touching another puzzle', async (_name, call) => {
    const before = structuredClone(rows);
    await expect(call('missing')).rejects.toThrow();
    expect(rows).toEqual(before);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each(calls)('%s preserves owner success and constrains every write to the trusted builder and ID', async (name, call) => {
    if (name === 'publishPuzzle') { own().phase = 'hints'; own().hints = ALL_HINTS; }
    const original = structuredClone(own());
    const decoy = structuredClone(rows[1]);
    const result = await call('target');
    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes) {
      expect(matches(original, write.where)).toBe(true);
      expect(matches({ ...original, id: 'different' }, write.where)).toBe(false);
      expect(matches({ ...original, builderId: 'other-builder' }, write.where)).toBe(false);
      if (contentActions.includes(name) || name === 'publishPuzzle') {
        expect(matches({ ...original, publishedAt: new Date() }, write.where)).toBe(false);
      }
      if (name === 'publishPuzzle') expect(matches({ ...original, phase: 'grid' }, write.where)).toBe(false);
    }
    expect(rows.find((row) => row.id === 'decoy')).toEqual(decoy);
    if (name === 'saveGrid') expect(own().grid).toEqual(replacement);
    if (name === 'saveHints') expect(own().hints).toEqual({ '1-across': 'Changed clue' });
    if (name === 'saveTitle') expect(own().title).toBe('Changed title');
    if (name === 'enterHints') {
      expect(own().phase).toBe('hints');
      expect(own().gridBeforeHints).toEqual(original.grid);
      expect(result).toEqual({ phase: 'hints', hints: own().hints, grid: own().grid });
    }
    if (name === 'publishPuzzle') {
      expect(own().publishedAt).toBeInstanceOf(Date);
      expect(own().visibility).toBe('public');
      expect(result).toEqual({ publishedAt: own().publishedAt, visibility: 'public' });
    }
    if (name === 'deletePuzzle') {
      expect(rows.some((row) => row.id === 'target')).toBe(false);
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/puzzles');
    }
  });

  it.each(calls.filter(([name]) => contentActions.includes(name)))('%s retains the owner’s published content lock', async (_name, call) => {
    own().publishedAt = new Date('2026-10-01T00:00:00Z');
    own().phase = 'hints';
    const before = structuredClone(rows);
    await expect(call('target')).rejects.toThrow();
    expect(rows).toEqual(before);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each(['private', 'public'] as const)('publishes an eligible owner puzzle as %s', async (visibility) => {
    own().phase = 'hints';
    own().hints = ALL_HINTS;
    const result = await actions.publishPuzzle('target', visibility);
    expect(result).toEqual({ publishedAt: own().publishedAt, visibility });
    expect(own().visibility).toBe(visibility);
  });

  it.each(['grid', 'published', 'invalid visibility'])('retains publish rejection for %s', async (reason) => {
    if (reason !== 'grid') own().phase = 'hints';
    if (reason === 'published') own().publishedAt = new Date();
    const before = structuredClone(rows);
    await expect(actions.publishPuzzle('target', reason === 'invalid visibility' ? 'invalid' as actions.Visibility : 'public')).rejects.toThrow();
    expect(rows).toEqual(before);
  });

  it('retains the original grid snapshot on repeat hints entry', async () => {
    const originalGrid = structuredClone(own().grid);
    await actions.enterHints('target');
    own().grid = replacement;
    await actions.enterHints('target');
    expect(own().gridBeforeHints).toEqual(originalGrid);
    expect(own().grid).toEqual(replacement);
  });

  it.each(['ownership', 'publication'])('enterHints rejects a %s change between read and write', async (change) => {
    const expected = structuredClone(rows);
    if (change === 'ownership') expected[0].builderId = 'other-builder';
    else expected[0].publishedAt = new Date('2026-10-18T11:00:00Z');
    afterRead = () => { rows = structuredClone(expected); };
    await expect(actions.enterHints('target')).rejects.toThrow();
    expect(rows).toEqual(expected);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each([null, new Date('2026-10-01T00:00:00Z')])('allows owner deletion with publishedAt %j', async (publishedAt) => {
    own().publishedAt = publishedAt;
    await actions.deletePuzzle('target');
    expect(rows.map((row) => row.id)).toEqual(['decoy']);
  });

  // 14-S8 retired "allows an owner to unpublish an already unpublished
  // puzzle without changing its visibility": unpublishPuzzle is removed.
});

describe('O3 editor loader refusal', () => {
  it.each(['grid', 'hints', 'private published', 'public published'])('returns null for a foreign %s puzzle without writes', async (state) => {
    own().builderId = 'other-builder';
    own().phase = state === 'grid' ? 'grid' : 'hints';
    if (state.includes('published')) own().publishedAt = new Date();
    if (state === 'public published') own().visibility = 'public';
    const before = structuredClone(rows);
    await expect(actions.loadPuzzle('target')).resolves.toBeNull();
    expect(rows).toEqual(before);
    expect(writes).toEqual([]);
  });

  it('returns null for a missing puzzle', async () => {
    await expect(actions.loadPuzzle('missing')).resolves.toBeNull();
  });

  it.each([null, new Date('2026-10-01T00:00:00Z')])('loads owned puzzle metadata with publishedAt %j', async (publishedAt) => {
    own().publishedAt = publishedAt;
    const result = await actions.loadPuzzle('target');
    expect(result).toMatchObject({ id: 'target', title: 'Original target', phase: 'grid', publishedAt, visibility: 'private' });
    expect(serializePuzzle(result!)).toEqual(stored);
    expect(writes).toEqual([]);
  });
});
