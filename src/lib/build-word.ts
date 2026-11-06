import type { Coord, Grid, Orientation } from '../engine/grid';

// A word in the build phase (21-S1): with no black cells yet, a row or
// column holds several words, each an unbroken run of lettered cells.

function isLettered(grid: Grid, coord: Coord): boolean {
  const cell = grid.at(coord.col, coord.row);
  return cell.kind === 'active' && cell.letter !== null;
}

/** The run of lettered cells through `coord` in `orientation`, in reading
 *  order, ended by an empty cell or the grid's edge; null on an empty cell
 *  or a lone letter. */
export function buildWord(grid: Grid, coord: Coord, orientation: Orientation): Coord[] | null {
  if (!isLettered(grid, coord)) return null;
  const [dc, dr] = orientation === 'across' ? [1, 0] : [0, 1];

  let start = coord;
  while (isLettered(grid, { col: start.col - dc, row: start.row - dr })) {
    start = { col: start.col - dc, row: start.row - dr };
  }
  const cells: Coord[] = [];
  for (let at = start; isLettered(grid, at); at = { col: at.col + dc, row: at.row + dr }) {
    cells.push(at);
  }
  return cells.length >= 2 ? cells : null;
}
