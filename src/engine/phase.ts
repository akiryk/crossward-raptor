import type { Coord } from './grid';
import { withLetter } from './grid';
import type { Puzzle } from './puzzle';
import { toggleBlackSymmetric } from './symmetry';
import { hintKey, requiredHints } from './hints';

export type GeometryEditResult =
  | { readonly ok: true; readonly puzzle: Puzzle }
  | { readonly ok: false; readonly error: string; readonly puzzle: Puzzle };

export function applyGeometryEdit(
  puzzle: Puzzle,
  coord: Coord,
  black: boolean
): GeometryEditResult {
  if (puzzle.phase !== 'grid') {
    return {
      ok: false,
      error: 'Geometry edits are only allowed in the grid phase.',
      puzzle,
    };
  }

  const isBlack = puzzle.grid.at(coord.col, coord.row).kind === 'black';
  if (isBlack === black) {
    return { ok: true, puzzle };
  }

  const grid = toggleBlackSymmetric(puzzle.grid, coord);
  return { ok: true, puzzle: { ...puzzle, grid } };
}

export function enterHintsPhase(puzzle: Puzzle): Puzzle {
  const { across, down } = requiredHints(puzzle.grid);
  const hints: Record<string, string> = { ...puzzle.hints };
  let changed = false;

  for (const ref of [...across, ...down]) {
    const key = hintKey(ref);
    if (!(key in hints)) {
      hints[key] = '';
      changed = true;
    }
  }

  return { ...puzzle, phase: 'hints', hints: changed ? hints : puzzle.hints };
}

export function applyLetterEdit(
  puzzle: Puzzle,
  coord: Coord,
  letter: string | null
): Puzzle {
  return { ...puzzle, grid: withLetter(puzzle.grid, coord, letter) };
}
