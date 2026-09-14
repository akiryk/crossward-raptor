import { describe, it, expect } from 'vitest';
import { createGrid, withLetter } from '../engine/grid';
import type { Grid } from '../engine/grid';
import type { Puzzle } from '../engine/puzzle';
import { publishReadiness } from './publish-readiness';
import type { Finding, FindingKind } from './publish-readiness';

function puzzle(grid: Grid, hints: Record<string, string> = {}, phase: 'grid' | 'hints' = 'hints'): Puzzle {
  return { grid, hints, phase };
}

function find(findings: readonly Finding[], kind: FindingKind): Finding | undefined {
  return findings.find((f) => f.kind === kind);
}

function kinds(findings: readonly Finding[]): FindingKind[] {
  return findings.map((f) => f.kind);
}

/** Fills every active cell of a grid with the same letter. */
function fillAll(grid: Grid, letter = 'A'): Grid {
  let filled = grid;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.at(col, row).kind === 'active') {
        filled = withLetter(filled, { col, row }, letter);
      }
    }
  }
  return filled;
}

/** The six required hints of a fully active 3x3, all authored. */
const ALL_HINTS: Record<string, string> = {
  '1-across': 'a',
  '4-across': 'b',
  '5-across': 'c',
  '1-down': 'd',
  '2-down': 'e',
  '3-down': 'f',
};

// --- PB2-1: publishReadiness ---
describe('PB2-1 unfilled cells', () => {
  it('counts active cells with no letter', () => {
    const grid = withLetter(createGrid({ cols: 3, rows: 3 }), { col: 0, row: 0 }, 'A');
    const findings = publishReadiness(puzzle(grid));

    expect(find(findings, 'unfilled-cells')?.count).toBe(8);
  });

  it('reports nothing when every active cell is lettered', () => {
    const findings = publishReadiness(puzzle(fillAll(createGrid({ cols: 3, rows: 3 })), ALL_HINTS));

    expect(find(findings, 'unfilled-cells')).toBeUndefined();
  });

  it('does not count black cells as unfilled', () => {
    const grid = fillAll(createGrid({ cols: 3, rows: 3, black: [{ col: 1, row: 1 }] }));
    const findings = publishReadiness(puzzle(grid));

    expect(find(findings, 'unfilled-cells')).toBeUndefined();
  });
});

describe('PB2-1 unwritten hints', () => {
  const grid = fillAll(createGrid({ cols: 3, rows: 3 }));

  it('counts every required hint when none are authored', () => {
    expect(find(publishReadiness(puzzle(grid)), 'unwritten-hints')?.count).toBe(6);
  });

  it('reports nothing when all are authored', () => {
    expect(
      find(publishReadiness(puzzle(grid, ALL_HINTS)), 'unwritten-hints')
    ).toBeUndefined();
  });

  it('counts a blank hint', () => {
    const hints = { ...ALL_HINTS, '2-down': '' };
    expect(find(publishReadiness(puzzle(grid, hints)), 'unwritten-hints')?.count).toBe(1);
  });

  it('counts a whitespace-only hint', () => {
    const hints = { ...ALL_HINTS, '1-across': '   ' };
    expect(find(publishReadiness(puzzle(grid, hints)), 'unwritten-hints')?.count).toBe(1);
  });
});

describe('PB2-1 unchecked squares', () => {
  it('counts cells not covered by both an across and a down answer', () => {
    // a single row: one across answer, no column long enough to be a down one
    const grid = fillAll(createGrid({ cols: 3, rows: 1 }));
    expect(find(publishReadiness(puzzle(grid)), 'unchecked-squares')?.count).toBe(3);
  });

  it('reports nothing when every cell is in both directions', () => {
    const grid = fillAll(createGrid({ cols: 3, rows: 3 }));
    expect(find(publishReadiness(puzzle(grid, ALL_HINTS)), 'unchecked-squares')).toBeUndefined();
  });
});

describe('PB2-1 short answers', () => {
  it('counts slots shorter than three letters', () => {
    const grid = fillAll(createGrid({ cols: 3, rows: 1, black: [{ col: 2, row: 0 }] }));
    expect(find(publishReadiness(puzzle(grid)), 'short-answers')?.count).toBe(1);
  });

  it('reports nothing when every answer is at least three long', () => {
    const grid = fillAll(createGrid({ cols: 3, rows: 3 }));
    expect(find(publishReadiness(puzzle(grid, ALL_HINTS)), 'short-answers')).toBeUndefined();
  });
});

describe('PB2-1 asymmetry', () => {
  it('reports an asymmetric black pattern, without a count', () => {
    const grid = fillAll(createGrid({ cols: 3, rows: 3, black: [{ col: 0, row: 0 }] }));
    const finding = find(publishReadiness(puzzle(grid)), 'asymmetric');

    expect(finding).toBeDefined();
    expect(finding?.count).toBeUndefined();
  });

  it('reports nothing for a symmetric pattern', () => {
    const grid = fillAll(
      createGrid({
        cols: 3,
        rows: 3,
        black: [
          { col: 0, row: 0 },
          { col: 2, row: 2 },
        ],
      })
    );
    expect(find(publishReadiness(puzzle(grid)), 'asymmetric')).toBeUndefined();
  });
});

describe('PB2-1 the clean case and general properties', () => {
  const cleanGrid = fillAll(createGrid({ cols: 3, rows: 3 }));

  it('a puzzle with nothing outstanding returns an empty array', () => {
    expect(publishReadiness(puzzle(cleanGrid, ALL_HINTS))).toEqual([]);
  });

  it('every finding carries a non-empty message', () => {
    const messy = createGrid({ cols: 3, rows: 1, black: [{ col: 2, row: 0 }] });
    const findings = publishReadiness(puzzle(messy));

    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      expect(finding.message.trim().length, finding.kind).toBeGreaterThan(0);
    }
  });

  it('reports several kinds at once when several apply', () => {
    const messy = createGrid({ cols: 3, rows: 1, black: [{ col: 2, row: 0 }] });
    const reported = kinds(publishReadiness(puzzle(messy)));

    expect(reported).toContain('unfilled-cells');
    expect(reported).toContain('short-answers');
    expect(reported).toContain('unchecked-squares');
  });

  it('purity: two calls are deep-equal and the puzzle is untouched', () => {
    const p = puzzle(withLetter(createGrid({ cols: 3, rows: 3 }), { col: 0, row: 0 }, 'A'));

    expect(publishReadiness(p)).toEqual(publishReadiness(p));
    expect(p.hints).toEqual({});
    expect(p.grid.at(1, 1)).toEqual({ kind: 'active', letter: null });
  });
});
