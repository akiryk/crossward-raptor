import { describe, expect, it } from 'vitest';
import { createGrid, withLetter, type Grid } from '../engine/grid';
import { slotsWithNumbers, type NumberedSlot } from '../engine/numbering';
import { slotAnswer } from './slot-answer';

/** A 3x3 word square: CAT / ARE / TEA, every cell active. */
function wordSquare(): Grid {
  const rows = [
    ['C', 'A', 'T'],
    ['A', 'R', 'E'],
    ['T', 'E', 'A'],
  ];
  let grid = createGrid({ cols: 3, rows: 3 });
  rows.forEach((letters, row) => {
    letters.forEach((letter, col) => {
      grid = withLetter(grid, { col, row }, letter);
    });
  });
  return grid;
}

const slotFor = (grid: Grid, number: number, orientation: 'across' | 'down'): NumberedSlot => {
  const slot = slotsWithNumbers(grid).find(
    (s) => s.number === number && s.orientation === orientation
  );
  if (!slot) throw new Error(`no ${number}-${orientation} slot in this grid`);
  return slot;
};

/** Every lookup in the grid, for detecting mutation. */
const snapshot = (grid: Grid) =>
  Array.from({ length: grid.rows }, (_, row) =>
    Array.from({ length: grid.cols }, (_, col) => grid.at(col, row))
  );

describe('slotAnswer', () => {
  it('reads an across slot left to right', () => {
    const grid = wordSquare();

    expect(slotAnswer(grid, slotFor(grid, 1, 'across'))).toBe('CAT');
  });

  it('reads a down slot top to bottom', () => {
    const grid = wordSquare();

    // col 1 downward is A, R, E
    expect(slotAnswer(grid, slotFor(grid, 2, 'down'))).toBe('ARE');
  });

  it('distinguishes the across and down slots sharing a number', () => {
    const grid = wordSquare();

    expect(slotAnswer(grid, slotFor(grid, 1, 'across'))).toBe('CAT');
    expect(slotAnswer(grid, slotFor(grid, 1, 'down'))).toBe('CAT');
    expect(slotAnswer(grid, slotFor(grid, 3, 'down'))).toBe('TEA');
  });

  it('writes an underscore for an empty cell, preserving length', () => {
    let grid = createGrid({ cols: 3, rows: 1 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'C');
    grid = withLetter(grid, { col: 2, row: 0 }, 'T');

    const answer = slotAnswer(grid, slotFor(grid, 1, 'across'));
    expect(answer).toBe('C_T');
    expect(answer.length).toBe(3);
  });

  it('writes all underscores for a slot with no letters at all', () => {
    const grid = createGrid({ cols: 3, rows: 1 });

    expect(slotAnswer(grid, slotFor(grid, 1, 'across'))).toBe('___');
  });

  it('passes a multi-character cell through whole', () => {
    let grid = createGrid({ cols: 3, rows: 1 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'HEART');
    grid = withLetter(grid, { col: 1, row: 0 }, 'E');
    grid = withLetter(grid, { col: 2, row: 0 }, 'D');

    expect(slotAnswer(grid, slotFor(grid, 1, 'across'))).toBe('HEARTED');
  });

  it('does not mutate the grid', () => {
    const grid = wordSquare();
    const before = snapshot(grid);

    slotAnswer(grid, slotFor(grid, 1, 'across'));

    expect(snapshot(grid)).toEqual(before);
  });
});
