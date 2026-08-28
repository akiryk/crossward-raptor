import type { Coord, Grid } from '../engine/grid';
import { numberGrid } from '../engine/numbering';

export function cellNumberKey(coord: Coord): string {
  return `${coord.row},${coord.col}`;
}

export function buildCellNumberLookup(grid: Grid): ReadonlyMap<string, number> {
  const lookup = new Map<string, number>();
  for (const { coord, number } of numberGrid(grid)) {
    lookup.set(cellNumberKey(coord), number);
  }
  return lookup;
}
