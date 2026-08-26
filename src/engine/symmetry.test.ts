import { describe, it, expect } from 'vitest';
import type { Grid } from './grid';
import { createGrid, withLetter } from './grid';
import { symmetricCounterpart, isSymmetric, toggleBlackSymmetric } from './symmetry';

const isBlack = (grid: Grid, col: number, row: number): boolean =>
  grid.at(col, row).kind === 'black';

function countBlack(grid: Grid): number {
  let n = 0;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.at(col, row).kind === 'black') n++;
    }
  }
  return n;
}

// --- A1: symmetricCounterpart ---
describe('A1 symmetricCounterpart', () => {
  const g15 = createGrid({ cols: 15, rows: 15 });

  it('(0,0) on 15x15 -> (14,14)', () => {
    expect(symmetricCounterpart(g15, { col: 0, row: 0 })).toEqual({ col: 14, row: 14 });
  });

  it('(3,0) on 15x15 -> (11,14)', () => {
    expect(symmetricCounterpart(g15, { col: 3, row: 0 })).toEqual({ col: 11, row: 14 });
  });

  it('center (7,7) on 15x15 is its own counterpart', () => {
    expect(symmetricCounterpart(g15, { col: 7, row: 7 })).toEqual({ col: 7, row: 7 });
  });

  it('even 6x6: (2,2) -> (3,3), no self-counterpart', () => {
    const g6 = createGrid({ cols: 6, rows: 6 });
    expect(symmetricCounterpart(g6, { col: 2, row: 2 })).toEqual({ col: 3, row: 3 });
  });
});

// --- A2: isSymmetric ---
describe('A2 isSymmetric', () => {
  it('black at (0,0) and (14,14), all else active -> true', () => {
    const g = createGrid({
      cols: 15,
      rows: 15,
      black: [{ col: 0, row: 0 }, { col: 14, row: 14 }],
    });
    expect(isSymmetric(g)).toBe(true);
  });

  it('black at (0,0) only -> false', () => {
    const g = createGrid({ cols: 15, rows: 15, black: [{ col: 0, row: 0 }] });
    expect(isSymmetric(g)).toBe(false);
  });

  it('fully active grid -> true (vacuously)', () => {
    expect(isSymmetric(createGrid({ cols: 15, rows: 15 }))).toBe(true);
  });
});

// --- A3: toggleBlackSymmetric ---
describe('A3 toggleBlackSymmetric', () => {
  it('toggling (0,0) blackens (0,0) and (14,14); original grid unchanged (purity)', () => {
    const original = createGrid({ cols: 15, rows: 15 });
    const next = toggleBlackSymmetric(original, { col: 0, row: 0 });

    expect(isBlack(next, 0, 0)).toBe(true);
    expect(isBlack(next, 14, 14)).toBe(true);

    // purity: the original must not have mutated
    expect(isBlack(original, 0, 0)).toBe(false);
    expect(isBlack(original, 14, 14)).toBe(false);
    expect(countBlack(original)).toBe(0);
  });

  it('toggling the center (7,7) changes only that one cell', () => {
    const original = createGrid({ cols: 15, rows: 15 });
    const next = toggleBlackSymmetric(original, { col: 7, row: 7 });

    expect(isBlack(next, 7, 7)).toBe(true);
    expect(countBlack(next)).toBe(1);
    expect(countBlack(original)).toBe(0);
  });
});

// --- G2: toggleBlackSymmetric preserves letters ---
describe('G2 toggleBlackSymmetric preserves letters', () => {
  it('toggling an active-to-black pair discards their letters, preserves every other letter', () => {
    let grid = createGrid({ cols: 15, rows: 15 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'A');
    grid = withLetter(grid, { col: 14, row: 14 }, 'Z');
    grid = withLetter(grid, { col: 7, row: 7 }, 'M');

    const next = toggleBlackSymmetric(grid, { col: 0, row: 0 });

    expect(isBlack(next, 0, 0)).toBe(true);
    expect(isBlack(next, 14, 14)).toBe(true);
    // untouched by this toggle, so its letter must survive
    expect(next.at(7, 7)).toEqual({ kind: 'active', letter: 'M' });
  });

  it('toggling a black-to-active pair gives both cells letter: null; other letters unchanged', () => {
    const base = createGrid({
      cols: 15,
      rows: 15,
      black: [{ col: 0, row: 0 }, { col: 14, row: 14 }],
    });
    const grid = withLetter(base, { col: 7, row: 7 }, 'M');

    const next = toggleBlackSymmetric(grid, { col: 0, row: 0 });

    expect(next.at(0, 0)).toEqual({ kind: 'active', letter: null });
    expect(next.at(14, 14)).toEqual({ kind: 'active', letter: null });
    expect(next.at(7, 7)).toEqual({ kind: 'active', letter: 'M' });
  });

  it('toggling the center with a letter there discards only that letter', () => {
    let grid = createGrid({ cols: 15, rows: 15 });
    grid = withLetter(grid, { col: 7, row: 7 }, 'M');
    grid = withLetter(grid, { col: 3, row: 3 }, 'Q');

    const next = toggleBlackSymmetric(grid, { col: 7, row: 7 });

    expect(isBlack(next, 7, 7)).toBe(true);
    expect(next.at(3, 3)).toEqual({ kind: 'active', letter: 'Q' });
  });

  it('original grid unchanged after toggle (purity)', () => {
    const grid = withLetter(createGrid({ cols: 15, rows: 15 }), { col: 0, row: 0 }, 'A');
    toggleBlackSymmetric(grid, { col: 5, row: 5 });

    expect(grid.at(0, 0)).toEqual({ kind: 'active', letter: 'A' });
    expect(isBlack(grid, 5, 5)).toBe(false);
  });
});
