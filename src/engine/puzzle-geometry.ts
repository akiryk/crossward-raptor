import type { Cell, Coord, Grid } from './grid';
import { createGrid, withLetter } from './grid';
import { symmetricCounterpart } from './symmetry';

/**
 * The grid as the puzzle currently stands: a cell stays active if it
 * holds a letter or is the symmetric counterpart of a cell that does;
 * everything else is black. Letters and dimensions are preserved.
 *
 * Already-black cells stay black regardless of their counterpart --
 * only originally-active cells are eligible to survive on a
 * counterpart's letter, so this can't revive a cell the builder has
 * already decided is black.
 */
export function intendedGeometry(grid: Grid): Grid {
  const black: Coord[] = [];
  const letters: { coord: Coord; letter: string }[] = [];

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row) as Cell;
      if (cell.kind === 'black') {
        black.push({ col, row });
        continue;
      }
      if (cell.letter !== null) {
        letters.push({ coord: { col, row }, letter: cell.letter });
        continue;
      }

      const counterpart = symmetricCounterpart(grid, { col, row });
      const counterpartCell = grid.at(counterpart.col, counterpart.row) as Cell;
      const counterpartHasLetter =
        counterpartCell.kind === 'active' && counterpartCell.letter !== null;

      if (!counterpartHasLetter) {
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
