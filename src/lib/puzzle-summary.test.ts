import { describe, it, expect } from 'vitest';
import { createGrid } from '../engine/grid';
import { serializePuzzle } from './puzzle-storage';
import type { StoredPuzzle } from './puzzle-storage';
import { summarizePuzzle } from './puzzle-summary';

// A fully active 3x3 grid requires exactly these six hints (Story C numbering).
const ALL_KEYS = ['1-across', '4-across', '5-across', '1-down', '2-down', '3-down'];

function allHints(): Record<string, string> {
  return Object.fromEntries(ALL_KEYS.map((key) => [key, `Clue for ${key}`]));
}

function stored(
  hints: Record<string, string>,
  phase: 'grid' | 'hints' = 'hints'
): StoredPuzzle {
  return serializePuzzle({ grid: createGrid({ cols: 3, rows: 3 }), hints, phase });
}

function fullyBlackStored(hints: Record<string, string> = {}): StoredPuzzle {
  const black: { col: number; row: number }[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      black.push({ col, row });
    }
  }
  return serializePuzzle({
    grid: createGrid({ cols: 3, rows: 3, black }),
    hints,
    phase: 'hints',
  });
}

// --- M3-1: summarizePuzzle ---
describe('M3-1 summarizePuzzle', () => {
  it('reports complete when every required hint is authored', () => {
    expect(summarizePuzzle(stored(allHints()))).toEqual({
      phase: 'hints',
      hintsComplete: true,
    });
  });

  it('reports incomplete when one required hint is blank', () => {
    const hints = { ...allHints(), '2-down': '' };
    expect(summarizePuzzle(stored(hints)).hintsComplete).toBe(false);
  });

  it('reports incomplete when one required key is absent', () => {
    const hints = allHints();
    delete hints['3-down'];
    expect(summarizePuzzle(stored(hints)).hintsComplete).toBe(false);
  });

  it('reports incomplete when one required hint is whitespace only', () => {
    const hints = { ...allHints(), '1-across': '   ' };
    expect(summarizePuzzle(stored(hints)).hintsComplete).toBe(false);
  });

  it('carries the phase through unchanged', () => {
    expect(summarizePuzzle(stored({}, 'grid')).phase).toBe('grid');
    expect(summarizePuzzle(stored(allHints(), 'hints')).phase).toBe('hints');
  });

  it('a grid-phase puzzle with no hints is incomplete', () => {
    expect(summarizePuzzle(stored({}, 'grid'))).toEqual({
      phase: 'grid',
      hintsComplete: false,
    });
  });

  it('a fully black grid is vacuously complete, whatever hints holds', () => {
    expect(summarizePuzzle(fullyBlackStored()).hintsComplete).toBe(true);
    expect(summarizePuzzle(fullyBlackStored({ '99-across': 'x' })).hintsComplete).toBe(true);
  });

  it('extra keys matching no required hint do not affect the result', () => {
    const complete = { ...allHints(), '99-across': 'not a real slot' };
    expect(summarizePuzzle(stored(complete)).hintsComplete).toBe(true);

    const incomplete = { '99-across': 'not a real slot' };
    expect(summarizePuzzle(stored(incomplete)).hintsComplete).toBe(false);
  });

  it('purity: two calls on the same input are equal', () => {
    const input = stored(allHints());
    expect(summarizePuzzle(input)).toEqual(summarizePuzzle(input));
  });
});
