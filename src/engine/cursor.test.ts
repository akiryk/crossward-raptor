import { describe, it, expect } from 'vitest';
import type { Grid } from './grid';
import { createGrid, withLetter } from './grid';
import type { CursorState } from './cursor';
import { place, arrowKey, deleteAt, moveTo } from './cursor';

function cur(col: number, row: number, orientation: 'across' | 'down'): CursorState {
  return { current: { col, row }, orientation };
}

function letterAt(grid: Grid, col: number, row: number): string | null {
  const cell = grid.at(col, row);
  return cell.kind === 'active' ? cell.letter : null;
}

// --- F1: place ---
describe('F1 place', () => {
  it("orientation 'across': writes the letter, advances right", () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const result = place(grid, cur(0, 0, 'across'), 'A');

    expect(letterAt(result.grid, 0, 0)).toBe('A');
    expect(result.cursor).toEqual(cur(1, 0, 'across'));
  });

  it("orientation 'down': writes the letter, advances down", () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const result = place(grid, cur(0, 0, 'down'), 'A');

    expect(letterAt(result.grid, 0, 0)).toBe('A');
    expect(result.cursor).toEqual(cur(0, 1, 'down'));
  });

  it('at the last active cell before a black cell: letter written, cursor stays', () => {
    const grid = createGrid({ cols: 5, rows: 1, black: [{ col: 3, row: 0 }] });
    const result = place(grid, cur(2, 0, 'across'), 'C');

    expect(letterAt(result.grid, 2, 0)).toBe('C');
    expect(result.cursor).toEqual(cur(2, 0, 'across'));
  });

  it('at the grid edge: letter written, cursor stays', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const result = place(grid, cur(4, 0, 'across'), 'Z');

    expect(letterAt(result.grid, 4, 0)).toBe('Z');
    expect(result.cursor).toEqual(cur(4, 0, 'across'));
  });
});

// --- F2: arrowKey ---
describe('F2 arrowKey', () => {
  it("'down' from (0,0): orientation becomes 'down', cursor moves to (0,1)", () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const next = arrowKey(grid, cur(0, 0, 'across'), 'down');

    expect(next).toEqual(cur(0, 1, 'down'));
  });

  it("'right' from (0,0): orientation becomes 'across', cursor moves to (1,0)", () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const next = arrowKey(grid, cur(0, 0, 'down'), 'right');

    expect(next).toEqual(cur(1, 0, 'across'));
  });

  it('blocked by the grid edge: orientation still updates, position stays', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const next = arrowKey(grid, cur(0, 0, 'down'), 'left');

    // 'left' is the across axis -- orientation flips to 'across' even though
    // there is no active cell at col -1 to move into.
    expect(next).toEqual(cur(0, 0, 'across'));
  });

  it('blocked by a black cell: orientation still updates, position stays', () => {
    const grid = createGrid({ cols: 5, rows: 1, black: [{ col: 3, row: 0 }] });
    const next = arrowKey(grid, cur(2, 0, 'down'), 'right');

    expect(next).toEqual(cur(2, 0, 'across'));
  });
});

// --- F3: deleteAt ---
describe('F3 deleteAt', () => {
  function seededRow(): Grid {
    let grid = createGrid({ cols: 5, rows: 1 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'C');
    grid = withLetter(grid, { col: 1, row: 0 }, 'R');
    grid = withLetter(grid, { col: 2, row: 0 }, 'O');
    grid = withLetter(grid, { col: 3, row: 0 }, 'S');
    grid = withLetter(grid, { col: 4, row: 0 }, 'S');
    return grid;
  }

  it('current cell has a letter: clears it, cursor stays', () => {
    const result = deleteAt(seededRow(), cur(4, 0, 'across'));

    expect(letterAt(result.grid, 4, 0)).toBeNull();
    expect(result.cursor).toEqual(cur(4, 0, 'across'));
  });

  it('current cell already empty: retreats and clears the previous cell', () => {
    const afterFirstDelete = deleteAt(seededRow(), cur(4, 0, 'across')).grid;
    const result = deleteAt(afterFirstDelete, cur(4, 0, 'across'));

    expect(letterAt(result.grid, 3, 0)).toBeNull();
    expect(result.cursor).toEqual(cur(3, 0, 'across'));
  });

  it('first cell of a run, already empty, nothing behind it: cursor stays, nothing cleared', () => {
    const grid = createGrid({ cols: 5, rows: 1 });
    const result = deleteAt(grid, cur(0, 0, 'across'));

    expect(result.cursor).toEqual(cur(0, 0, 'across'));
    for (let col = 0; col < 5; col++) {
      expect(letterAt(result.grid, col, 0)).toBeNull();
    }
  });

  it('retreat blocked by a black cell between runs: cursor stays, nothing cleared', () => {
    const grid = createGrid({ cols: 5, rows: 1, black: [{ col: 2, row: 0 }] });
    const result = deleteAt(grid, cur(3, 0, 'across'));

    expect(result.cursor).toEqual(cur(3, 0, 'across'));
  });
});

// --- F4: moveTo ---
describe('F4 moveTo', () => {
  it('clicking an active cell moves the cursor; orientation unchanged', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const next = moveTo(grid, cur(0, 0, 'across'), { col: 3, row: 2 });

    expect(next).toEqual(cur(3, 2, 'across'));
  });

  it('clicking a black cell is a no-op', () => {
    const grid = createGrid({ cols: 5, rows: 1, black: [{ col: 3, row: 0 }] });
    const next = moveTo(grid, cur(0, 0, 'across'), { col: 3, row: 0 });

    expect(next).toEqual(cur(0, 0, 'across'));
  });

  it('clicking an off-grid coordinate is a no-op', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const next = moveTo(grid, cur(0, 0, 'across'), { col: 99, row: 99 });

    expect(next).toEqual(cur(0, 0, 'across'));
  });
});

// --- F5: purity and size ---
describe('F5 purity and size', () => {
  it('place: two calls with identical inputs are deep-equal, input grid untouched', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const a = place(grid, cur(0, 0, 'across'), 'A');
    const b = place(grid, cur(0, 0, 'across'), 'A');

    expect(a).toEqual(b);
    expect(letterAt(grid, 0, 0)).toBeNull();
  });

  it('arrowKey: two calls with identical inputs are deep-equal', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const a = arrowKey(grid, cur(0, 0, 'across'), 'down');
    const b = arrowKey(grid, cur(0, 0, 'across'), 'down');

    expect(a).toEqual(b);
  });

  it('works on a non-square, non-15x15 grid', () => {
    const grid = createGrid({ cols: 3, rows: 7 });
    const result = place(grid, cur(2, 6, 'down'), 'Q');

    expect(letterAt(result.grid, 2, 6)).toBe('Q');
    // (2,6) is the last cell in its column on a 3x7 grid -- advance is blocked
    expect(result.cursor).toEqual(cur(2, 6, 'down'));
  });
});
