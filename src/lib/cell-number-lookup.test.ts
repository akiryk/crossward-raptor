import { describe, it, expect } from 'vitest';
import { createGrid } from '../engine/grid';
import { cellNumberKey, buildCellNumberLookup } from './cell-number-lookup';

// --- P2-1: cellNumberKey ---
describe('P2-1 cellNumberKey', () => {
  it('formats as row,col', () => {
    expect(cellNumberKey({ col: 2, row: 3 })).toBe('3,2');
  });
});

// --- P2-1: buildCellNumberLookup ---
describe('P2-1 buildCellNumberLookup', () => {
  it('fully active 3x3 grid: numbers 1-5 at the expected coords', () => {
    const grid = createGrid({ cols: 3, rows: 3 });
    const lookup = buildCellNumberLookup(grid);

    expect(lookup.get(cellNumberKey({ col: 0, row: 0 }))).toBe(1);
    expect(lookup.get(cellNumberKey({ col: 1, row: 0 }))).toBe(2);
    expect(lookup.get(cellNumberKey({ col: 2, row: 0 }))).toBe(3);
    expect(lookup.get(cellNumberKey({ col: 0, row: 1 }))).toBe(4);
    expect(lookup.get(cellNumberKey({ col: 0, row: 2 }))).toBe(5);
  });

  it('cells that do not start a slot have no entry', () => {
    const grid = createGrid({ cols: 3, rows: 3 });
    const lookup = buildCellNumberLookup(grid);

    expect(lookup.has(cellNumberKey({ col: 1, row: 1 }))).toBe(false);
    expect(lookup.has(cellNumberKey({ col: 2, row: 1 }))).toBe(false);
    expect(lookup.has(cellNumberKey({ col: 1, row: 2 }))).toBe(false);
    expect(lookup.has(cellNumberKey({ col: 2, row: 2 }))).toBe(false);
  });

  it('fully black grid returns an empty map', () => {
    const allBlack: { col: number; row: number }[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        allBlack.push({ col, row });
      }
    }
    const grid = createGrid({ cols: 3, rows: 3, black: allBlack });
    const lookup = buildCellNumberLookup(grid);

    expect(lookup.size).toBe(0);
  });

  it('two calls on the same grid produce equal maps (purity)', () => {
    const grid = createGrid({ cols: 5, rows: 5 });
    const a = buildCellNumberLookup(grid);
    const b = buildCellNumberLookup(grid);

    expect(Array.from(a.entries())).toEqual(Array.from(b.entries()));
  });

  it('size is not assumed: works on a non-square, non-15x15 grid', () => {
    const grid = createGrid({ cols: 3, rows: 7 });
    const lookup = buildCellNumberLookup(grid);

    // (0,0) always starts both an across and a down run on any fully
    // active grid with at least 2 columns and 2 rows.
    expect(lookup.get(cellNumberKey({ col: 0, row: 0 }))).toBe(1);
  });
});
