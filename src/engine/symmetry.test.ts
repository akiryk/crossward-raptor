import { describe, it, expect } from 'vitest';
import type { Grid } from './grid';
import { createGrid } from './grid';
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
