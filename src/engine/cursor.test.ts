import { describe, it, expect } from 'vitest';
import type { Grid } from './grid';
import { createGrid, withLetter } from './grid';
import type { CursorState } from './cursor';
import { place, arrowKey, deleteAt, moveTo, toggleOrientation } from './cursor';

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

// --- F2r: arrowKey does exactly one thing per press ---
describe('F2r arrowKey', () => {
  const grid = createGrid({ cols: 5, rows: 5 });

  it('an arrow along the current orientation moves, leaving orientation alone', () => {
    expect(arrowKey(grid, cur(2, 2, 'across'), 'right')).toEqual(cur(3, 2, 'across'));
    expect(arrowKey(grid, cur(2, 2, 'across'), 'left')).toEqual(cur(1, 2, 'across'));
    expect(arrowKey(grid, cur(2, 2, 'down'), 'down')).toEqual(cur(2, 3, 'down'));
    expect(arrowKey(grid, cur(2, 2, 'down'), 'up')).toEqual(cur(2, 1, 'down'));
  });

  it('an arrow perpendicular to the orientation changes direction without moving', () => {
    expect(arrowKey(grid, cur(2, 2, 'across'), 'down')).toEqual(cur(2, 2, 'down'));
    expect(arrowKey(grid, cur(2, 2, 'across'), 'up')).toEqual(cur(2, 2, 'down'));
    expect(arrowKey(grid, cur(2, 2, 'down'), 'right')).toEqual(cur(2, 2, 'across'));
    expect(arrowKey(grid, cur(2, 2, 'down'), 'left')).toEqual(cur(2, 2, 'across'));
  });

  it('a second perpendicular press then moves, since it is now along the orientation', () => {
    const afterFirst = arrowKey(grid, cur(2, 2, 'across'), 'down');
    expect(afterFirst).toEqual(cur(2, 2, 'down'));

    expect(arrowKey(grid, afterFirst, 'down')).toEqual(cur(2, 3, 'down'));
  });

  it('a move blocked by the grid edge changes nothing at all', () => {
    expect(arrowKey(grid, cur(4, 2, 'across'), 'right')).toEqual(cur(4, 2, 'across'));
    expect(arrowKey(grid, cur(0, 2, 'across'), 'left')).toEqual(cur(0, 2, 'across'));
    expect(arrowKey(grid, cur(2, 4, 'down'), 'down')).toEqual(cur(2, 4, 'down'));
  });

  it('a move blocked by a black cell changes nothing at all', () => {
    const blocked = createGrid({ cols: 5, rows: 1, black: [{ col: 3, row: 0 }] });
    expect(arrowKey(blocked, cur(2, 0, 'across'), 'right')).toEqual(cur(2, 0, 'across'));
  });

  it('a perpendicular press still flips at the grid edge -- it was never a move', () => {
    expect(arrowKey(grid, cur(4, 2, 'across'), 'down')).toEqual(cur(4, 2, 'down'));
    expect(arrowKey(grid, cur(2, 0, 'down'), 'right')).toEqual(cur(2, 0, 'across'));
  });

  it('purity: the input cursor is not mutated and two calls are deep-equal', () => {
    const start = cur(2, 2, 'across');
    const a = arrowKey(grid, start, 'down');
    const b = arrowKey(grid, start, 'down');

    expect(start).toEqual(cur(2, 2, 'across'));
    expect(a).toEqual(b);
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

// --- F4r: moveTo, and toggling orientation ---
describe('F4r moveTo', () => {
  it('clicking a different active cell moves the cursor; orientation unchanged', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const next = moveTo(grid, cur(0, 0, 'across'), { col: 3, row: 2 });

    expect(next).toEqual(cur(3, 2, 'across'));
  });

  it('clicking the already-selected cell toggles orientation, position unchanged', () => {
    const grid = createGrid({ cols: 5, rows: 5 });

    const flipped = moveTo(grid, cur(3, 2, 'across'), { col: 3, row: 2 });
    expect(flipped).toEqual(cur(3, 2, 'down'));

    const back = moveTo(grid, flipped, { col: 3, row: 2 });
    expect(back).toEqual(cur(3, 2, 'across'));
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

describe('F4r toggleOrientation', () => {
  it('flips across to down and back, leaving the position alone', () => {
    const start = cur(2, 3, 'across');
    const flipped = toggleOrientation(start);

    expect(flipped).toEqual(cur(2, 3, 'down'));
    expect(toggleOrientation(flipped)).toEqual(start);
  });

  it('purity: the input is not mutated', () => {
    const start = cur(1, 1, 'down');
    toggleOrientation(start);

    expect(start).toEqual(cur(1, 1, 'down'));
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

  it('works on a non-square, non-15x15 grid', () => {
    const grid = createGrid({ cols: 3, rows: 7 });
    const result = place(grid, cur(2, 6, 'down'), 'Q');

    expect(letterAt(result.grid, 2, 6)).toBe('Q');
    expect(result.cursor).toEqual(cur(2, 6, 'down'));
  });
});
