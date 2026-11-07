import type { Coord, Grid, Orientation } from '../engine/grid';
import { intendedGeometry } from '../engine/puzzle-geometry';

// A word in the build phase (21-S1, 21-S8): with few or no black cells
// yet, a row or column holds several words, each an unbroken run of cells
// Preview keeps white (`intendedGeometry`): lettered and Preview-red cells
// alike, ended by a Preview-black cell or the grid's edge.

/** The run of cells through `coord` in `orientation` that are not black in
 *  Preview's geometry, in reading order; null on a Preview-black cell or a
 *  lone cell. */
export function buildWord(grid: Grid, coord: Coord, orientation: Orientation): Coord[] | null {
  const geometry = intendedGeometry(grid);
  const isWhite = ({ col, row }: Coord) =>
    col >= 0 && row >= 0 && col < geometry.cols && row < geometry.rows &&
    geometry.at(col, row).kind === 'active';
  if (!isWhite(coord)) return null;
  const [dc, dr] = orientation === 'across' ? [1, 0] : [0, 1];

  let start = coord;
  while (isWhite({ col: start.col - dc, row: start.row - dr })) {
    start = { col: start.col - dc, row: start.row - dr };
  }
  const cells: Coord[] = [];
  for (let at = start; isWhite(at); at = { col: at.col + dc, row: at.row + dr }) {
    cells.push(at);
  }
  return cells.length >= 2 ? cells : null;
}
