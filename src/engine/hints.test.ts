import { describe, it, expect } from 'vitest';
import type { Coord, Grid } from './grid';
import type { Puzzle } from './puzzle';
import { createGrid } from './grid';
import { extractSlots } from './slots';
import { slotsWithNumbers } from './numbering';
import { hintKey, requiredHints, hintsComplete } from './hints';

// Re-skins every active cell with a letter, leaving geometry alone.
const withLetters = (grid: Grid, letter = 'A'): Grid => ({
  cols: grid.cols,
  rows: grid.rows,
  at(col: number, row: number) {
    const cell = grid.at(col, row);
    return cell.kind === 'active' ? { kind: 'active', letter } : cell;
  },
});

// 15x15 with a single black cell at (10,0), splitting row 0 into runs of 10 and 4.
const splitRow0 = (): Grid => createGrid({ cols: 15, rows: 15, black: [{ col: 10, row: 0 }] });

const allBlack3x3 = (): Grid => {
  const black: Coord[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      black.push({ col, row });
    }
  }
  return createGrid({ cols: 3, rows: 3, black });
};

// Authored text for every required hint. Built from requiredHints and hintKey,
// which are themselves under test — D2 pins those down independently.
const authorAll = (grid: Grid, text = 'a clue'): Record<string, string> => {
  const { across, down } = requiredHints(grid);
  const hints: Record<string, string> = {};
  for (const ref of [...across, ...down]) {
    hints[hintKey(ref)] = text;
  }
  return hints;
};

const puzzleOf = (grid: Grid, hints: Record<string, string>): Puzzle => ({
  grid,
  hints,
  phase: 'grid',
});

// --- D1: hintKey ---
describe('D1 hintKey', () => {
  it('formats number and orientation as "3-across"', () => {
    expect(hintKey({ number: 3, orientation: 'across' })).toBe('3-across');
  });

  it('formats a down ref as "12-down"', () => {
    expect(hintKey({ number: 12, orientation: 'down' })).toBe('12-down');
  });
});

// --- D2: requiredHints ---
describe('D2 requiredHints', () => {
  it('fully active 15x15 -> 15 across, 15 down, 30 total', () => {
    const { across, down } = requiredHints(createGrid({ cols: 15, rows: 15 }));

    expect(across).toHaveLength(15);
    expect(down).toHaveLength(15);
  });

  it('splitRow0 -> 16 across, 15 down, 31 total', () => {
    const { across, down } = requiredHints(splitRow0());

    expect(across).toHaveLength(16);
    expect(down).toHaveLength(15);
  });

  it('a cell starting both slots yields one ref in each group', () => {
    const { across, down } = requiredHints(splitRow0());

    expect(across).toContainEqual({ number: 1, orientation: 'across' });
    expect(down).toContainEqual({ number: 1, orientation: 'down' });
  });

  it('total ref count equals extractSlots count', () => {
    for (const grid of [createGrid({ cols: 15, rows: 15 }), splitRow0(), allBlack3x3()]) {
      const { across, down } = requiredHints(grid);

      expect(across.length + down.length).toBe(extractSlots(grid).length);
    }
  });

  it('refs carry slotsWithNumbers numbers, in that order', () => {
    const grid = splitRow0();
    const slots = slotsWithNumbers(grid);
    const { across, down } = requiredHints(grid);

    expect(across).toEqual(
      slots
        .filter((s) => s.orientation === 'across')
        .map((s) => ({ number: s.number, orientation: 'across' as const }))
    );
    expect(down).toEqual(
      slots
        .filter((s) => s.orientation === 'down')
        .map((s) => ({ number: s.number, orientation: 'down' as const }))
    );
  });

  it('fully active 21x21 -> 21 across, 21 down, 42 total', () => {
    const { across, down } = requiredHints(createGrid({ cols: 21, rows: 21 }));

    expect(across).toHaveLength(21);
    expect(down).toHaveLength(21);
    expect(across.length + down.length).toBe(42);
  });

  it('fully black grid -> empty groups', () => {
    expect(requiredHints(allBlack3x3())).toEqual({ across: [], down: [] });
  });
});

// --- D3: hintsComplete ---
describe('D3 hintsComplete', () => {
  it('every required hint authored -> true', () => {
    const grid = splitRow0();

    expect(hintsComplete(puzzleOf(grid, authorAll(grid)))).toBe(true);
  });

  it('one required hint holding an empty string -> false', () => {
    const grid = splitRow0();
    const hints = authorAll(grid);
    hints['1-across'] = '';

    expect(hintsComplete(puzzleOf(grid, hints))).toBe(false);
  });

  it('one required key absent entirely -> false', () => {
    const grid = splitRow0();
    const hints = authorAll(grid);
    delete hints['1-down'];

    expect(hintsComplete(puzzleOf(grid, hints))).toBe(false);
  });

  it('one required hint holding whitespace only -> false', () => {
    const grid = splitRow0();
    const hints = authorAll(grid);
    hints['1-across'] = '   ';

    expect(hintsComplete(puzzleOf(grid, hints))).toBe(false);
  });

  it('extra keys matching no slot are ignored -> true', () => {
    const grid = splitRow0();
    const hints = authorAll(grid);
    hints['99-across'] = 'stale text from a deleted slot';
    hints['400-down'] = 'also stale';

    expect(hintsComplete(puzzleOf(grid, hints))).toBe(true);
  });

  it('a grid with no slots is vacuously complete', () => {
    expect(hintsComplete(puzzleOf(allBlack3x3(), {}))).toBe(true);
    expect(hintsComplete(puzzleOf(allBlack3x3(), { '1-across': 'stale' }))).toBe(true);
  });
});

// --- D4: purity and letter-independence ---
describe('D4 purity and letter-independence', () => {
  it('called twice on the same input -> deep-equal results', () => {
    const grid = splitRow0();
    const puzzle = puzzleOf(grid, authorAll(grid));

    expect(requiredHints(grid)).toEqual(requiredHints(grid));
    expect(hintsComplete(puzzle)).toBe(hintsComplete(puzzle));
  });

  it('same black pattern with letters present -> identical required hints', () => {
    const plain = splitRow0();

    expect(requiredHints(withLetters(plain))).toEqual(requiredHints(plain));
  });

  it('hintsComplete does not mutate the puzzle or its hints', () => {
    const grid = splitRow0();
    const hints = authorAll(grid);
    const puzzle = puzzleOf(grid, hints);
    const before = JSON.stringify(puzzle.hints);

    hintsComplete(puzzle);

    expect(JSON.stringify(puzzle.hints)).toBe(before);
  });
});
