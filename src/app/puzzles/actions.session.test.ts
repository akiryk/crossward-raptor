import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlankPuzzle, serializePuzzle } from '../../lib/puzzle-storage';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  revalidatePath: vi.fn(),
  create: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/prisma', () => ({
  prisma: { puzzle: {
    create: mocks.create,
    findMany: mocks.findMany,
    findUnique: mocks.findUnique,
    updateMany: mocks.updateMany,
    update: mocks.update,
    delete: mocks.delete,
  } },
}));

import * as actions from './actions';

const stored = serializePuzzle(createBlankPuzzle('mini'));
const input = { title: 'Session boundary', size: 'mini' as const };
const requestHeaders = new Headers({ cookie: 'better-auth.session_token=invalid' });
const effects = [
  mocks.create, mocks.findMany, mocks.findUnique, mocks.updateMany,
  mocks.update, mocks.delete, mocks.revalidatePath,
];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.headers.mockResolvedValue(requestHeaders);
  mocks.getSession.mockResolvedValue(null);
  mocks.create.mockResolvedValue({ id: 'created' });
  mocks.findMany.mockResolvedValue([]);
  mocks.findUnique.mockResolvedValue({
    ...stored, id: 'existing', title: 'Existing', publishedAt: null, visibility: 'private',
  });
  mocks.updateMany.mockResolvedValue({ count: 1 });
});

describe('Server Action session boundary', () => {
  const calls: Array<[string, () => Promise<unknown>]> = [
    ['createPuzzle', () => actions.createPuzzle(input)],
    ['listPuzzles', () => actions.listPuzzles()],
    ['loadPuzzle', () => actions.loadPuzzle('existing')],
    ['saveGrid', () => actions.saveGrid('existing', stored.grid)],
    ['saveHints', () => actions.saveHints('existing', {})],
    ['saveTitle', () => actions.saveTitle('existing', 'Changed')],
    ['enterHints', () => actions.enterHints('existing')],
    ['publishPuzzle', () => actions.publishPuzzle('existing', 'public')],
    ['unpublishPuzzle', () => actions.unpublishPuzzle('existing')],
    ['deletePuzzle', () => actions.deletePuzzle('existing')],
  ];

  it.each(calls)('%s rejects an invalid session before any data access or side effect', async (_name, call) => {
    await expect(call()).rejects.toThrow('redirect:/');
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
    for (const effect of effects) expect(effect).not.toHaveBeenCalled();
  });

  it('allows a validated session to create a puzzle', async () => {
    mocks.getSession.mockResolvedValue({ user: { id: 'signed-in' }, session: { id: 'valid' } });

    await expect(actions.createPuzzle(input)).resolves.toEqual({ id: 'created' });
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ title: input.title }) });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/puzzles');
  });
});
