import { describe, it, expect } from 'vitest';
import { groupPuzzles, sizeFor } from './puzzle-groups';
import type { GroupablePuzzle } from './puzzle-groups';

type Item = GroupablePuzzle & { id: string };

let counter = 0;
function item(overrides: Partial<Item> & { cols: number; rows: number }): Item {
  counter += 1;
  return {
    id: overrides.id ?? `p${counter}`,
    phase: 'grid',
    publishedAt: null,
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    ...overrides,
  };
}

const DAY = (n: number) => new Date(`2026-09-${String(n).padStart(2, '0')}T00:00:00.000Z`);

const MINI = { cols: 5, rows: 5 };
const MIDI = { cols: 9, rows: 9 };
const DAILY = { cols: 15, rows: 15 };
const SUNDAY = { cols: 21, rows: 21 };
const ODD = { cols: 3, rows: 3 };

// --- L3-1: sizeFor ---
describe('L3-1 sizeFor', () => {
  it('maps each standard size', () => {
    expect(sizeFor(MINI)).toBe('mini');
    expect(sizeFor(MIDI)).toBe('midi');
    expect(sizeFor(DAILY)).toBe('daily');
    expect(sizeFor(SUNDAY)).toBe('sunday');
  });

  it('returns null for dimensions that match no standard size', () => {
    expect(sizeFor(ODD)).toBeNull();
    expect(sizeFor({ cols: 11, rows: 11 })).toBeNull();
  });

  it('returns null for a non-square grid, even one sharing a side with a size', () => {
    expect(sizeFor({ cols: 15, rows: 16 })).toBeNull();
    expect(sizeFor({ cols: 16, rows: 15 })).toBeNull();
  });
});

// --- L3-1: groupPuzzles ---
describe('L3-1 groupPuzzles ordering of groups', () => {
  it('orders groups smallest to largest, with other sizes last', () => {
    const groups = groupPuzzles([
      item({ ...ODD }),
      item({ ...SUNDAY }),
      item({ ...MINI }),
      item({ ...DAILY }),
      item({ ...MIDI }),
    ]);

    expect(groups.map((g) => g.size)).toEqual(['mini', 'midi', 'daily', 'sunday', null]);
  });

  it('omits empty groups', () => {
    const groups = groupPuzzles([item({ ...DAILY }), item({ ...MINI })]);

    expect(groups.map((g) => g.size)).toEqual(['mini', 'daily']);
  });

  it('returns no groups for no puzzles', () => {
    expect(groupPuzzles([])).toEqual([]);
  });

  it('labels each group and names its dimensions', () => {
    const groups = groupPuzzles([
      item({ ...MINI }),
      item({ ...MIDI }),
      item({ ...DAILY }),
      item({ ...SUNDAY }),
      item({ ...ODD }),
    ]);
    const byLabel = Object.fromEntries(groups.map((g) => [g.label, g.dimensions]));

    expect(byLabel).toEqual({
      Mini: '5 \u00d7 5',
      Midi: '9 \u00d7 9',
      Daily: '15 \u00d7 15',
      Sunday: '21 \u00d7 21',
      'Other sizes': null,
    });
  });

  it('collects every non-standard grid into the single other group', () => {
    const groups = groupPuzzles([
      item({ ...ODD }),
      item({ cols: 7, rows: 7 }),
      item({ cols: 15, rows: 16 }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].size).toBeNull();
    expect(groups[0].puzzles).toHaveLength(3);
  });
});

describe('L3-1 groupPuzzles ordering within a group', () => {
  it('puts unpublished work before published, even when the published one is newer', () => {
    const building = item({ ...DAILY, id: 'building', updatedAt: DAY(1) });
    const published = item({
      ...DAILY,
      id: 'published',
      phase: 'hints',
      publishedAt: DAY(9),
      updatedAt: DAY(9),
    });

    const [group] = groupPuzzles([published, building]);

    expect(group.puzzles.map((p) => p.id)).toEqual(['building', 'published']);
  });

  it('treats a hints-phase puzzle that is not yet published as work in progress', () => {
    const clueing = item({ ...DAILY, id: 'clueing', phase: 'hints', updatedAt: DAY(1) });
    const published = item({
      ...DAILY,
      id: 'published',
      phase: 'hints',
      publishedAt: DAY(9),
      updatedAt: DAY(9),
    });

    const [group] = groupPuzzles([published, clueing]);

    expect(group.puzzles.map((p) => p.id)).toEqual(['clueing', 'published']);
  });

  it('orders by most recently updated within the same status', () => {
    const older = item({ ...DAILY, id: 'older', updatedAt: DAY(1) });
    const newer = item({ ...DAILY, id: 'newer', updatedAt: DAY(5) });
    const newest = item({ ...DAILY, id: 'newest', updatedAt: DAY(9) });

    const [group] = groupPuzzles([older, newest, newer]);

    expect(group.puzzles.map((p) => p.id)).toEqual(['newest', 'newer', 'older']);
  });

  it('orders published puzzles by most recently updated too', () => {
    const olderPub = item({
      ...DAILY,
      id: 'olderPub',
      phase: 'hints',
      publishedAt: DAY(2),
      updatedAt: DAY(2),
    });
    const newerPub = item({
      ...DAILY,
      id: 'newerPub',
      phase: 'hints',
      publishedAt: DAY(8),
      updatedAt: DAY(8),
    });

    const [group] = groupPuzzles([olderPub, newerPub]);

    expect(group.puzzles.map((p) => p.id)).toEqual(['newerPub', 'olderPub']);
  });
});

describe('L3-1 groupPuzzles general properties', () => {
  it('keeps every field the caller passed in', () => {
    const withExtras = { ...item({ ...MINI, id: 'x' }), title: 'Kept', other: 42 };

    const [group] = groupPuzzles([withExtras]);

    expect(group.puzzles[0]).toBe(withExtras);
  });

  it('does not mutate its input', () => {
    const input = [
      item({ ...DAILY, id: 'a', updatedAt: DAY(1) }),
      item({ ...MINI, id: 'b', updatedAt: DAY(9) }),
    ];
    const before = input.map((p) => p.id);

    groupPuzzles(input);

    expect(input.map((p) => p.id)).toEqual(before);
  });

  it('places every puzzle in exactly one group', () => {
    const input = [
      item({ ...MINI }),
      item({ ...DAILY }),
      item({ ...DAILY, phase: 'hints', publishedAt: DAY(3) }),
      item({ ...ODD }),
    ];

    const total = groupPuzzles(input).reduce((sum, g) => sum + g.puzzles.length, 0);

    expect(total).toBe(input.length);
  });
});
