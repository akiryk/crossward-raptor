import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlankPuzzle, serializePuzzle } from '../../lib/puzzle-storage';

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(), create: vi.fn(), findMany: vi.fn(), revalidatePath: vi.fn(),
}));

vi.mock('@/lib/require-session', () => ({ requireSession: mocks.requireSession }));
vi.mock('@/lib/prisma', () => ({ prisma: { puzzle: { create: mocks.create, findMany: mocks.findMany } } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { createPuzzle, listPuzzles } from './actions';

const stored = serializePuzzle(createBlankPuzzle('mini'));
const own = {
  ...stored, id: 'mine', builderId: 'session-builder', title: 'Mine',
  updatedAt: new Date('2026-10-17T12:00:00Z'), publishedAt: null, visibility: 'private',
};
const other = {
  ...stored, id: 'theirs', builderId: 'other-builder', title: 'Theirs',
  updatedAt: new Date('2026-10-16T12:00:00Z'), publishedAt: null, visibility: 'private',
};
// 14-S2: another builder's puzzle is listed once published.
const otherPublished = {
  ...other, id: 'theirs-published', title: 'Theirs, published',
  updatedAt: new Date('2026-10-15T12:00:00Z'), publishedAt: new Date('2026-10-15T12:00:00Z'), visibility: 'public',
};
type Stored = typeof own | typeof otherPublished;
type Where = { builderId?: string; publishedAt?: { not?: null }; OR?: Where[] };

/** The subset of Prisma's where clause the library uses (14-S2). */
function matches(row: Stored, where: Where | undefined): boolean {
  if (!where) return true;
  if (where.OR && !where.OR.some((clause) => matches(row, clause))) return false;
  if (where.builderId !== undefined && row.builderId !== where.builderId) return false;
  if (where.publishedAt && 'not' in where.publishedAt && row.publishedAt === where.publishedAt.not) return false;
  return true;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireSession.mockResolvedValue({ user: { id: 'session-builder' }, session: { id: 'valid' } });
  mocks.create.mockResolvedValue({ id: 'new-puzzle' });
  // Behave like a select projection: forgetting builderId must fail the
  // returned-value assertion, even though these source rows contain it.
  // Relations (the caller's attempt, the builder) resolve as empty.
  mocks.findMany.mockImplementation(async (query: {
    where?: Where; select?: Record<string, unknown>;
  }) => ([own, other, otherPublished] as Stored[])
    .filter((row) => matches(row, query.where))
    .map((row) => query.select
      ? {
        ...Object.fromEntries(Object.entries(row).filter(([key]) => query.select?.[key])),
        ...(query.select.playSessions ? { playSessions: [] } : {}),
        ...(query.select.builder ? { builder: { displayName: null } } : {}),
      }
      : row));
});

describe('O1 puzzles have builders', () => {
  it('creates for the trusted session user, ignoring a forged client builderId', async () => {
    const input = { title: '  New title  ', size: 'mini' as const, builderId: 'other-builder' };

    await expect(createPuzzle(input)).resolves.toEqual({ id: 'new-puzzle' });

    expect(mocks.create).toHaveBeenCalledExactlyOnceWith({ data: expect.objectContaining({
      builderId: 'session-builder', title: 'New title',
      grid: stored.grid, hints: stored.hints, phase: 'grid',
    }) });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/puzzles');
  });

  it('does not access the database or revalidate when authentication is rejected', async () => {
    mocks.requireSession.mockRejectedValue(new Error('redirect:/'));

    await expect(createPuzzle({ title: 'Denied', size: 'mini' })).rejects.toThrow('redirect:/');
    await expect(listPuzzles()).rejects.toThrow('redirect:/');

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('returns builderId for both builders without changing existing list summaries or ordering', async () => {
    const rows = await listPuzzles();

    expect(rows).toEqual([
      expect.objectContaining({ id: 'mine', builderId: 'session-builder', title: 'Mine',
        updatedAt: own.updatedAt, phase: 'grid', hintsComplete: false, publishedAt: null,
        visibility: 'private', cols: 5, rows: 5,
        black: Array.from({ length: 5 }, () => Array(5).fill(false)),
      }),
      expect.objectContaining({ id: 'theirs-published', builderId: 'other-builder', title: 'Theirs, published' }),
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { updatedAt: 'desc' } }));
  });

  it("does not return another builder's unpublished puzzle (14-S2)", async () => {
    const rows = await listPuzzles();

    expect(rows.map((row) => row.id)).not.toContain('theirs');
  });
});
