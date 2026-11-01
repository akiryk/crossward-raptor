import { describe, expect, it } from 'vitest';
import { createGrid, type Coord, type Orientation } from '../engine/grid';
import { hasWord, wordArrowKey, wordMoveTo, wordStart, wordToggle } from './word-cursor';

// Story 17-S6 — only real words. The fixture of e2e/real-words.spec.ts:
//
//   A # # # #     1-Down ABED, 2-Across BLUE, 3-Down ERA
//   B L U E #
//   E # # R #
//   D # # A #
//   # # I # #     (2,4): no word either way
const white: Coord[] = [
  { col: 0, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 },
  { col: 0, row: 2 }, { col: 3, row: 2 }, { col: 0, row: 3 }, { col: 3, row: 3 }, { col: 2, row: 4 },
];
const black: Coord[] = [];
for (let row = 0; row < 5; row++) {
  for (let col = 0; col < 5; col++) {
    if (!white.some((c) => c.col === col && c.row === row)) black.push({ col, row });
  }
}
const grid = createGrid({ cols: 5, rows: 5, black });

const at = (col: number, row: number, orientation: Orientation) => ({ current: { col, row }, orientation });

describe('17-S6 word cursor', () => {
  it('knows which ways a word runs through a cell', () => {
    expect(hasWord(grid, { col: 0, row: 1 }, 'across')).toBe(true);
    expect(hasWord(grid, { col: 0, row: 1 }, 'down')).toBe(true);
    expect(hasWord(grid, { col: 0, row: 0 }, 'across')).toBe(false);
    expect(hasWord(grid, { col: 1, row: 1 }, 'down')).toBe(false);
    expect(hasWord(grid, { col: 2, row: 4 }, 'across')).toBe(false);
    expect(hasWord(grid, { col: 2, row: 4 }, 'down')).toBe(false);
  });

  it('starts Across, or Down where the cell has no Across word', () => {
    expect(wordStart(grid, { col: 0, row: 0 })).toEqual(at(0, 0, 'down'));
    expect(wordStart(grid, { col: 1, row: 1 })).toEqual(at(1, 1, 'across'));
  });

  it('a click on another cell takes its word’s direction', () => {
    expect(wordMoveTo(grid, at(0, 0, 'down'), { col: 1, row: 1 })).toEqual(at(1, 1, 'across'));
    expect(wordMoveTo(grid, at(1, 1, 'across'), { col: 3, row: 2 })).toEqual(at(3, 2, 'down'));
    expect(wordMoveTo(grid, at(0, 0, 'down'), { col: 0, row: 1 })).toEqual(at(0, 1, 'down'));
    expect(wordMoveTo(grid, at(1, 1, 'across'), { col: 2, row: 4 })).toEqual(at(2, 4, 'across'));
  });

  it('a click on a black cell does nothing', () => {
    const cursor = at(0, 0, 'down');
    expect(wordMoveTo(grid, cursor, { col: 1, row: 0 })).toBe(cursor);
  });

  it('a second click, Space or a cross-axis arrow turns only onto a word', () => {
    for (const cursor of [at(0, 0, 'down'), at(1, 1, 'across'), at(2, 4, 'across')]) {
      expect(wordMoveTo(grid, cursor, cursor.current)).toEqual(cursor);
      expect(wordToggle(grid, cursor)).toEqual(cursor);
      const cross = cursor.orientation === 'across' ? (['up', 'down'] as const) : (['left', 'right'] as const);
      for (const direction of cross) expect(wordArrowKey(grid, cursor, direction)).toEqual(cursor);
    }
    const both = at(0, 1, 'across');
    expect(wordMoveTo(grid, both, both.current)).toEqual(at(0, 1, 'down'));
    expect(wordToggle(grid, both)).toEqual(at(0, 1, 'down'));
    expect(wordArrowKey(grid, both, 'down')).toEqual(at(0, 1, 'down'));
  });

  it('a same-axis arrow moves as the engine’s', () => {
    expect(wordArrowKey(grid, at(0, 1, 'across'), 'right')).toEqual(at(1, 1, 'across'));
    expect(wordArrowKey(grid, at(0, 0, 'down'), 'up')).toEqual(at(0, 0, 'down'));
    expect(wordArrowKey(grid, at(2, 4, 'across'), 'right')).toEqual(at(2, 4, 'across'));
  });
});
