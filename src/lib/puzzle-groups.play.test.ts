import { describe, expect, it } from 'vitest';
import { groupPuzzles, type GroupablePuzzle } from './puzzle-groups';

// P5 acceptance. `play` is declared locally so a drafting baseline type-checks;
// the ordering assertions make missing runtime red.
type PlayState = 'untouched' | 'in-progress' | 'completed';
type Item = GroupablePuzzle & {
  id: string;
  play?: { state: PlayState; sessionId: string | null } | null;
};

const MINI = { cols: 5, rows: 5 };
const DAILY = { cols: 15, rows: 15 };
const DAY = (n: number) => new Date(`2026-09-${String(n).padStart(2, '0')}T00:00:00.000Z`);

function draft(id: string, day: number, size = MINI): Item {
  return { id, ...size, phase: 'grid', publishedAt: null, updatedAt: DAY(day), play: null };
}
function published(id: string, day: number, state: PlayState, size = MINI): Item {
  return {
    id, ...size, phase: 'hints', publishedAt: DAY(1), updatedAt: DAY(day),
    play: { state, sessionId: state === 'untouched' ? null : `session-${id}` },
  };
}
function ids(items: readonly Item[], size: 'mini' | 'daily' = 'mini'): string[] {
  return (groupPuzzles(items as Item[]).find((group) => group.size === size)?.puzzles ?? []).map((item) => item.id);
}

describe('P5 groupPuzzles ordering with play state', () => {
  it('sorts completed last, after newer unpublished and published-in-play work', () => {
    const order = ids([
      published('completed-newest', 30, 'completed'),
      published('in-progress-old', 5, 'in-progress'),
      draft('draft-old', 2),
    ]);

    expect(order).toEqual(['draft-old', 'in-progress-old', 'completed-newest']);
  });

  it('keeps untouched and in-progress puzzles together, by most recent update', () => {
    const order = ids([
      published('untouched-older', 10, 'untouched'),
      published('in-progress-newer', 12, 'in-progress'),
      published('untouched-newest', 14, 'untouched'),
    ]);

    expect(order).toEqual(['untouched-newest', 'in-progress-newer', 'untouched-older']);
  });

  it('orders completed puzzles among themselves by most recent update', () => {
    const order = ids([
      published('completed-older', 10, 'completed'),
      published('completed-newer', 12, 'completed'),
      published('untouched', 3, 'untouched'),
    ]);

    expect(order).toEqual(['untouched', 'completed-newer', 'completed-older']);
  });

  it('applies the order within each size group without regrouping', () => {
    const items = [
      published('mini-completed', 20, 'completed'),
      published('daily-completed', 21, 'completed', DAILY),
      published('daily-untouched', 4, 'untouched', DAILY),
      published('mini-in-progress', 3, 'in-progress'),
    ];

    expect(groupPuzzles(items).map((group) => group.size)).toEqual(['mini', 'daily']);
    expect(ids(items, 'mini')).toEqual(['mini-in-progress', 'mini-completed']);
    expect(ids(items, 'daily')).toEqual(['daily-untouched', 'daily-completed']);
  });

  it('leaves the existing order unchanged for items without play', () => {
    const items: Item[] = [
      { id: 'published-new', ...MINI, phase: 'hints', publishedAt: DAY(1), updatedAt: DAY(9) },
      { id: 'draft', ...MINI, phase: 'grid', publishedAt: null, updatedAt: DAY(2) },
      { id: 'published-newer', ...MINI, phase: 'hints', publishedAt: DAY(1), updatedAt: DAY(11) },
    ];

    expect(ids(items)).toEqual(['draft', 'published-newer', 'published-new']);
  });

  it('keeps play on each item and does not mutate its input', () => {
    const items = [published('completed', 9, 'completed'), published('untouched', 2, 'untouched')];
    const before = structuredClone(items);

    const [group] = groupPuzzles(items);

    expect(items).toEqual(before);
    expect(group.puzzles).toEqual([before[1], before[0]]);
  });
});
