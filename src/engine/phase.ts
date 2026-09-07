import type { Coord, Grid } from './grid';
import { createGrid, withLetter } from './grid';
import type { Puzzle } from './puzzle';
import { toggleBlackSymmetric } from './symmetry';
import { hintKey, requiredHints } from './hints';

/** An unfilled cell is a black cell: every active cell holding no letter
 *  becomes black, exactly as-is otherwise. Existing black cells and
 *  lettered cells are unchanged. */
function convertEmptyCellsToBlack(grid: Grid): Grid {
  const black: Coord[] = [];
  const letters: { coord: Coord; letter: string }[] = [];

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row);
      if (cell.kind === 'active' && cell.letter !== null) {
        letters.push({ coord: { col, row }, letter: cell.letter });
      } else {
        black.push({ col, row });
      }
    }
  }

  let next = createGrid({ cols: grid.cols, rows: grid.rows, black });
  for (const { coord, letter } of letters) {
    next = withLetter(next, coord, letter);
  }
  return next;
}

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
  if (puzzle.phase === 'hints') {
    return puzzle;
  }

  const grid = convertEmptyCellsToBlack(puzzle.grid);
  const { across, down } = requiredHints(grid);
  const hints: Record<string, string> = { ...puzzle.hints };
  let changed = false;

  for (const ref of [...across, ...down]) {
    const key = hintKey(ref);
    if (!(key in hints)) {
      hints[key] = '';
      changed = true;
    }
  }

  return { ...puzzle, phase: 'hints', grid, hints: changed ? hints : puzzle.hints };
}

export function applyLetterEdit(
  puzzle: Puzzle,
  coord: Coord,
  letter: string | null
): Puzzle {
  return { ...puzzle, grid: withLetter(puzzle.grid, coord, letter) };
}
