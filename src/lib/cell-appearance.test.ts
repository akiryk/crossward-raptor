import { describe, it, expect } from 'vitest';
import { createGrid, withLetter } from '../engine/grid';
import type { Cell } from '../engine/grid';
import { cellNumberKey } from './cell-number-lookup';
import { cellAppearance, symmetricHintKeys } from './cell-appearance';

const BLACK: Cell = { kind: 'black' };
const EMPTY: Cell = { kind: 'active', letter: null };
const LETTER: Cell = { kind: 'active', letter: 'A' };

function appearance(
  cell: Cell,
  flags: Partial<{ isSelected: boolean; isInSlot: boolean; isSymmetricHint: boolean }> = {}
) {
  return cellAppearance({
    cell,
    isSelected: flags.isSelected ?? false,
    isInSlot: flags.isInSlot ?? false,
    isSymmetricHint: flags.isSymmetricHint ?? false,
  });
}

function preview(
  cell: Cell,
  flags: Partial<{ isSelected: boolean; isInSlot: boolean; isSymmetricHint: boolean }> = {}
) {
  return cellAppearance({
    cell,
    isSelected: flags.isSelected ?? false,
    isInSlot: flags.isInSlot ?? false,
    isSymmetricHint: flags.isSymmetricHint ?? false,
    mode: 'preview',
  });
}

// --- D3-1: cellAppearance (unchanged from Story D3) ---
describe('D3-1 cellAppearance', () => {
  it('a black cell is black regardless of any other flag', () => {
    expect(appearance(BLACK)).toBe('black');
    expect(
      appearance(BLACK, { isSelected: true, isInSlot: true, isSymmetricHint: true })
    ).toBe('black');
  });

  it('selection outranks slot membership and content', () => {
    expect(appearance(LETTER, { isSelected: true, isInSlot: true })).toBe('selected');
    expect(appearance(EMPTY, { isSelected: true, isSymmetricHint: true })).toBe('selected');
  });

  it('slot membership outranks content', () => {
    expect(appearance(LETTER, { isInSlot: true })).toBe('slot');
    expect(appearance(EMPTY, { isInSlot: true, isSymmetricHint: true })).toBe('slot');
  });

  it('an ordinary lettered cell is letter', () => {
    expect(appearance(LETTER)).toBe('letter');
  });

  it('an empty symmetric counterpart is symmetric-hint', () => {
    expect(appearance(EMPTY, { isSymmetricHint: true })).toBe('symmetric-hint');
  });

  it('an ordinary empty cell is empty', () => {
    expect(appearance(EMPTY)).toBe('empty');
  });
});

// --- D3-1: symmetricHintKeys (unchanged from Story D3) ---
describe('D3-1 symmetricHintKeys', () => {
  it('a letter at (0,0) makes (2,2) a hint on a 3x3', () => {
    const grid = withLetter(createGrid({ cols: 3, rows: 3 }), { col: 0, row: 0 }, 'A');
    const keys = symmetricHintKeys(grid);

    expect(keys.has(cellNumberKey({ col: 2, row: 2 }))).toBe(true);
    expect(keys.size).toBe(1);
  });

  it('a counterpart that already holds a letter is not a hint', () => {
    let grid = createGrid({ cols: 3, rows: 3 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'A');
    grid = withLetter(grid, { col: 2, row: 2 }, 'B');

    expect(symmetricHintKeys(grid).size).toBe(0);
  });

  it('a black counterpart is not a hint', () => {
    const base = createGrid({ cols: 3, rows: 3, black: [{ col: 2, row: 2 }] });
    const grid = withLetter(base, { col: 0, row: 0 }, 'A');

    expect(symmetricHintKeys(grid).size).toBe(0);
  });

  it('the centre cell of an odd grid is its own counterpart, so yields no hint', () => {
    const grid = withLetter(createGrid({ cols: 3, rows: 3 }), { col: 1, row: 1 }, 'A');

    expect(symmetricHintKeys(grid).size).toBe(0);
  });

  it('several letters produce several hints', () => {
    let grid = createGrid({ cols: 5, rows: 5 });
    grid = withLetter(grid, { col: 0, row: 0 }, 'A');
    grid = withLetter(grid, { col: 1, row: 0 }, 'B');

    const keys = symmetricHintKeys(grid);
    expect(keys.has(cellNumberKey({ col: 4, row: 4 }))).toBe(true);
    expect(keys.has(cellNumberKey({ col: 3, row: 4 }))).toBe(true);
    expect(keys.size).toBe(2);
  });

  it('a grid with no letters yields no hints', () => {
    expect(symmetricHintKeys(createGrid({ cols: 5, rows: 5 })).size).toBe(0);
  });

  it('purity: two calls on the same grid return equal sets', () => {
    const grid = withLetter(createGrid({ cols: 4, rows: 4 }), { col: 0, row: 1 }, 'Q');
    const a = Array.from(symmetricHintKeys(grid)).sort();
    const b = Array.from(symmetricHintKeys(grid)).sort();

    expect(a).toEqual(b);
  });

  it('size is not assumed: works on a non-square grid', () => {
    const grid = withLetter(createGrid({ cols: 3, rows: 5 }), { col: 0, row: 0 }, 'A');
    const keys = symmetricHintKeys(grid);

    expect(keys.has(cellNumberKey({ col: 2, row: 4 }))).toBe(true);
  });
});

// --- D4-1: cellAppearance in preview mode ---
describe('D4-1 cellAppearance preview mode', () => {
  it('an empty cell reads as black', () => {
    expect(preview(EMPTY)).toBe('black');
  });

  it('an empty symmetric counterpart reads as required', () => {
    expect(preview(EMPTY, { isSymmetricHint: true })).toBe('required');
  });

  it('a lettered cell still reads as a letter', () => {
    expect(preview(LETTER)).toBe('letter');
  });

  it('a black cell still reads as black', () => {
    expect(preview(BLACK)).toBe('black');
  });

  it('selection is ignored', () => {
    expect(preview(LETTER, { isSelected: true })).toBe('letter');
    expect(preview(EMPTY, { isSelected: true })).toBe('black');
    expect(preview(EMPTY, { isSelected: true, isSymmetricHint: true })).toBe('required');
  });

  it('slot membership is ignored', () => {
    expect(preview(LETTER, { isInSlot: true })).toBe('letter');
    expect(preview(EMPTY, { isInSlot: true })).toBe('black');
  });

  it('omitting mode behaves exactly as build mode', () => {
    const args = { cell: EMPTY, isSelected: false, isInSlot: false, isSymmetricHint: true };
    expect(cellAppearance(args)).toBe(cellAppearance({ ...args, mode: 'build' }));
    expect(cellAppearance(args)).toBe('symmetric-hint');
  });
});
