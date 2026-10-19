import { beforeEach, describe, expect, it } from 'vitest';
import type { Cell, Grid } from './grid';

// P3 specification arrives before the new module. A variable import keeps this
// specification-only baseline type-checkable; missing runtime stays red.
let isFull: (grid: Grid) => boolean;
let isSolved: (solution: Grid, entries: Grid) => boolean;
beforeEach(async () => {
  const modulePath = './play';
  const implementation = await import(modulePath) as Record<string, unknown>;
  expect(typeof implementation.isFull).toBe('function');
  expect(typeof implementation.isSolved).toBe('function');
  isFull = implementation.isFull as typeof isFull;
  isSolved = implementation.isSolved as typeof isSolved;
});

type LiteralCell = string | null | '#';
function grid(rows: LiteralCell[][]): Grid {
  const cells: Cell[][] = rows.map((row) => row.map((letter) =>
    letter === '#' ? { kind: 'black' } : { kind: 'active', letter }));
  for (const row of cells) {
    for (const cell of row) Object.freeze(cell);
    Object.freeze(row);
  }
  Object.freeze(cells);
  return Object.freeze({
    cols: rows[0]?.length ?? 0,
    rows: rows.length,
    at(col: number, row: number) {
      return row < 0 || row >= cells.length || col < 0 || col >= (cells[0]?.length ?? 0)
        ? { kind: 'outside' as const } : cells[row][col];
    },
  });
}
function snapshot(value: Grid) {
  return Array.from({ length: value.rows }, (_, row) =>
    Array.from({ length: value.cols }, (_, col) => ({ ...value.at(col, row) })));
}

describe('Play P3 fullness over active cells', () => {
  it('recognizes every active cell filled, ignoring black cells', () => {
    expect(isFull(grid([['C', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'N']]))).toBe(true);
  });

  it.each([
    ['first', [[null, 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'N']]],
    ['middle', [['C', 'A', 'T'], [null, '#', 'A'], ['T', 'E', 'N']]],
    ['last', [['C', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', null]]],
  ] as Array<[string, LiteralCell[][]]>)('detects an empty %s active cell', (_position, rows) => {
    expect(isFull(grid(rows))).toBe(false);
  });

  it('does not confuse a full wrong grid with an incomplete grid', () => {
    expect(isFull(grid([['X', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'N']]))).toBe(true);
  });

  it('treats one nonempty rebus string as one filled cell', () => {
    expect(isFull(grid([['HEART', '#', 'QU']]))).toBe(true);
  });

  it('does not count an empty string as a filled active cell', () => {
    expect(isFull(grid([['C', '', 'T']]))).toBe(false);
  });

  it('counts isolated active cells that belong to no word slot', () => {
    expect(isFull(grid([['#', '#', '#'], ['#', 'A', '#'], ['#', '#', '#']]))).toBe(true);
    expect(isFull(grid([['#', '#', '#'], ['#', null, '#'], ['#', '#', '#']]))).toBe(false);
  });

  it.each([[[['#', '#'], ['#', '#']]], [[]]] as Array<[LiteralCell[][]]>)('does not count a grid with no active cells as full: %j', (rows) => {
    expect(isFull(grid(rows))).toBe(false);
  });
});

describe('Play P3 correctness compares grids without changing them', () => {
  const solutionRows: LiteralCell[][] = [['C', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'N']];

  it('accepts a separately constructed exact solution', () => {
    expect(isSolved(grid(solutionRows), grid(solutionRows))).toBe(true);
  });

  it.each([
    ['first letter', [['X', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'N']]],
    ['last letter', [['C', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'X']]],
    ['empty entry', [['C', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', null]]],
    ['empty string', [['C', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', '']]],
    ['different black geometry', [['C', 'A', 'T'], ['#', 'A', 'A'], ['T', 'E', 'N']]],
    ['entry black replacing an answer', [['#', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'N']]],
    ['entry letter replacing black', [['C', 'A', 'T'], ['A', 'X', 'A'], ['T', 'E', 'N']]],
    ['fewer rows', [['C', 'A', 'T'], ['A', '#', 'A']]],
    ['fewer columns', [['C', 'A'], ['A', '#'], ['T', 'E']]],
    ['more rows', [['C', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'N'], ['X', 'Y', 'Z']]],
    ['more columns', [['C', 'A', 'T', 'X'], ['A', '#', 'A', 'X'], ['T', 'E', 'N', 'X']]],
  ] as Array<[string, LiteralCell[][]]>)('rejects %s', (_difference, entries) => {
    expect(isSolved(grid(solutionRows), grid(entries))).toBe(false);
  });

  it('compares multi-character strings as opaque exact values', () => {
    const solution = grid([['HEART', '#', 'QU']]);
    expect(isSolved(solution, grid([['HEART', '#', 'QU']]))).toBe(true);
    expect(isSolved(solution, grid([['H', '#', 'QU']]))).toBe(false);
    expect(isSolved(solution, grid([['HEART', '#', 'Q']]))).toBe(false);
    expect(isSolved(solution, grid([['heart', '#', 'QU']]))).toBe(false);
    expect(isSolved(solution, grid([['HEART ', '#', 'QU']]))).toBe(false);
  });

  it('does not accept shared null or empty answer cells as solved', () => {
    expect(isSolved(grid([[null]]), grid([[null]]))).toBe(false);
    expect(isSolved(grid([['']]), grid([['']]))).toBe(false);
    expect(isSolved(grid([[null]]), grid([['X']]))).toBe(false);
  });

  it('compares every isolated active cell independently of word extraction', () => {
    expect(isSolved(grid([['#', 'A', '#']]), grid([['#', 'A', '#']]))).toBe(true);
    expect(isSolved(grid([['#', 'A', '#']]), grid([['#', 'X', '#']]))).toBe(false);
    expect(isSolved(grid([['#', 'A', '#']]), grid([['#', null, '#']]))).toBe(false);
  });

  it('handles rectangular grids without transposing coordinates', () => {
    expect(isSolved(grid([['A', '#', 'B', 'C'], ['D', 'E', 'F', 'G']]),
      grid([['A', '#', 'B', 'C'], ['D', 'E', 'F', 'G']]))).toBe(true);
    expect(isSolved(grid([['A', '#', 'B', 'C'], ['D', 'E', 'F', 'G']]),
      grid([['A', '#', 'B', 'C'], ['D', 'F', 'E', 'G']]))).toBe(false);
  });

  it('does not solve all-black or zero-cell grids', () => {
    expect(isSolved(grid([['#', '#']]), grid([['#', '#']]))).toBe(false);
    expect(isSolved(grid([]), grid([]))).toBe(false);
  });

  it('is deterministic, does not mutate either input and retains no previous comparison state', () => {
    const solution = grid(solutionRows);
    const correct = grid(solutionRows);
    const wrong = grid([['X', 'A', 'T'], ['A', '#', 'A'], ['T', 'E', 'N']]);
    const before = [solution, correct, wrong].map(snapshot);
    expect(isSolved(solution, correct)).toBe(true);
    expect(isSolved(solution, wrong)).toBe(false);
    expect(isSolved(solution, correct)).toBe(true);
    expect(isFull(correct)).toBe(true);
    expect(isFull(wrong)).toBe(true);
    expect([solution, correct, wrong].map(snapshot)).toEqual(before);
  });
});
