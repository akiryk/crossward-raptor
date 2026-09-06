import type { StoredPuzzle } from './puzzle-storage';
import { deserializePuzzle } from './puzzle-storage';
import type { Phase } from '../engine/puzzle';
import { hintsComplete } from '../engine/hints';

export interface PuzzleSummary {
  readonly phase: Phase;
  readonly hintsComplete: boolean;
}

/** Derives display-facing status from a stored puzzle row. Pure — no
 *  database, no React. `hintsComplete` uses the engine's existing rule
 *  (Story D): every required hint present and non-blank. */
export function summarizePuzzle(stored: StoredPuzzle): PuzzleSummary {
  const puzzle = deserializePuzzle(stored);
  return {
    phase: puzzle.phase,
    hintsComplete: hintsComplete(puzzle),
  };
}
