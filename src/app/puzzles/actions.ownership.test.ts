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

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireSession.mockResolvedValue({ user: { id: 'session-builder' }, session: { id: 'valid' } });
  mocks.create.mockResolvedValue({ id: 'new-puzzle' });
  // Behave like a select projection: forgetting builderId must fail the
  // returned-value assertion, even though these source rows contain it.
  mocks.findMany.mockImplementation(async (query: {
    where?: { builderId?: string }; select?: Record<string, boolean>;
  }) => [own, other]
    .filter((row) => !query.where?.builderId || row.builderId === query.where.builderId)
    .map((row) => query.select
      ? Object.fromEntries(Object.entries(row).filter(([key]) => query.select?.[key]))
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
      expect.objectContaining({ id: 'theirs', builderId: 'other-builder', title: 'Theirs' }),
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { updatedAt: 'desc' } }));
  });
});
