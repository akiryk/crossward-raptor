import { describe, it, expect } from 'vitest';
import type { Grid } from './grid';
import { createGrid, withLetter, clearLetters } from './grid';

// --- G1: withLetter (unchanged from Story G) ---
describe('G1 withLetter', () => {
  it('writes a letter into an active cell; original grid unchanged (purity)', () => {
    const original = createGrid({ cols: 15, rows: 15 });
    const next = withLetter(original, { col: 2, row: 3 }, 'A');

    expect(next.at(2, 3)).toEqual({ kind: 'active', letter: 'A' });
    expect(original.at(2, 3)).toEqual({ kind: 'active', letter: null });
  });

  it('letter: null clears a cell that held a letter', () => {
    const withA = withLetter(createGrid({ cols: 5, rows: 5 }), { col: 1, row: 1 }, 'A');
    const cleared = withLetter(withA, { col: 1, row: 1 }, null);

    expect(cleared.at(1, 1)).toEqual({ kind: 'active', letter: null });
  });

  it('replacing an existing letter overwrites it without touching other cells', () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 2, row: 2 }, 'X');
    grid = withLetter(grid, { col: 3, row: 3 }, 'Y');
    grid = withLetter(grid, { col: 2, row: 2 }, 'Z');

    expect(grid.at(2, 2)).toEqual({ kind: 'active', letter: 'Z' });
    expect(grid.at(3, 3)).toEqual({ kind: 'active', letter: 'Y' });
  });

  it('unchanged cells are reference-equal to the input grid (structural sharing)', () => {
    const original = createGrid({ cols: 15, rows: 15 });
    const next = withLetter(original, { col: 2, row: 3 }, 'A');

    // an unrelated cell must be the same object, not merely deep-equal
    expect(next.at(0, 0)).toBe(original.at(0, 0));
    expect(next.at(9, 9)).toBe(original.at(9, 9));
  });

  it('writing to a black cell throws', () => {
    const grid = createGrid({ cols: 15, rows: 15, black: [{ col: 4, row: 4 }] });
    expect(() => withLetter(grid, { col: 4, row: 4 }, 'A')).toThrow();
  });

  it('writing off the grid throws', () => {
    const grid = createGrid({ cols: 15, rows: 15 });
    expect(() => withLetter(grid, { col: -1, row: 0 }, 'A')).toThrow();
    expect(() => withLetter(grid, { col: 15, row: 0 }, 'A')).toThrow();
    expect(() => withLetter(grid, { col: 0, row: -1 }, 'A')).toThrow();
    expect(() => withLetter(grid, { col: 0, row: 15 }, 'A')).toThrow();
  });

  it('two calls on the same input return deep-equal results (purity)', () => {
    const original = createGrid({ cols: 5, rows: 5 });
    const a = withLetter(original, { col: 2, row: 2 }, 'Z');
    const b = withLetter(original, { col: 2, row: 2 }, 'Z');

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        expect(a.at(col, row)).toEqual(b.at(col, row));
      }
    }
  });

  it('size is not assumed: works on non-15x15 grids', () => {
    const grid = createGrid({ cols: 3, rows: 21 });
    const next = withLetter(grid, { col: 2, row: 20 }, 'Q');
    expect(next.at(2, 20)).toEqual({ kind: 'active', letter: 'Q' });
  });
});

// --- M5: clearLetters ---
function eachCell(grid: Grid, visit: (col: number, row: number) => void) {
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      visit(col, row);
    }
  }
}

function filledGrid(): Grid {
  let grid = createGrid({
    cols: 5,
    rows: 5,
    black: [
      { col: 0, row: 0 },
      { col: 4, row: 4 },
      { col: 2, row: 2 },
    ],
  });
  grid = withLetter(grid, { col: 1, row: 0 }, 'C');
  grid = withLetter(grid, { col: 2, row: 0 }, 'A');
  grid = withLetter(grid, { col: 3, row: 0 }, 'T');
  grid = withLetter(grid, { col: 0, row: 1 }, 'S');
  grid = withLetter(grid, { col: 3, row: 3 }, 'Z');
  return grid;
}

describe('M5 clearLetters', () => {
  it('clears every active cell to letter: null', () => {
    const cleared = clearLetters(filledGrid());

    eachCell(cleared, (col, row) => {
      const cell = cleared.at(col, row);
      if (cell.kind === 'active') {
        expect(cell.letter).toBeNull();
      }
    });
  });

  it('leaves black cells and the black pattern untouched', () => {
    const original = filledGrid();
    const cleared = clearLetters(original);

    eachCell(original, (col, row) => {
      expect(cleared.at(col, row).kind).toBe(original.at(col, row).kind);
    });

    expect(cleared.at(0, 0)).toEqual({ kind: 'black' });
    expect(cleared.at(2, 2)).toEqual({ kind: 'black' });
    expect(cleared.at(4, 4)).toEqual({ kind: 'black' });
  });

  it('leaves dimensions unchanged', () => {
    const original = filledGrid();
    const cleared = clearLetters(original);

    expect(cleared.cols).toBe(original.cols);
    expect(cleared.rows).toBe(original.rows);
  });

  it('is a no-op on a grid that already has no letters', () => {
    const original = createGrid({ cols: 4, rows: 4, black: [{ col: 1, row: 1 }] });
    const cleared = clearLetters(original);

    eachCell(original, (col, row) => {
      expect(cleared.at(col, row)).toEqual(original.at(col, row));
    });
  });

  it('purity: the input grid keeps its letters', () => {
    const original = filledGrid();
    clearLetters(original);

    expect(original.at(1, 0)).toEqual({ kind: 'active', letter: 'C' });
    expect(original.at(3, 3)).toEqual({ kind: 'active', letter: 'Z' });
  });

  it('two calls on the same input produce equal results', () => {
    const original = filledGrid();
    const a = clearLetters(original);
    const b = clearLetters(original);

    eachCell(a, (col, row) => {
      expect(a.at(col, row)).toEqual(b.at(col, row));
    });
  });

  it('size is not assumed: works on a non-square, non-15x15 grid', () => {
    let grid = createGrid({ cols: 3, rows: 7 });
    grid = withLetter(grid, { col: 2, row: 6 }, 'Q');

    const cleared = clearLetters(grid);

    expect(cleared.cols).toBe(3);
    expect(cleared.rows).toBe(7);
    expect(cleared.at(2, 6)).toEqual({ kind: 'active', letter: null });
  });
});
