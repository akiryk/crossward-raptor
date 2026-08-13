import type { Coord, Grid, Orientation } from './grid';

export interface Slot {
  readonly orientation: Orientation;
  readonly start: Coord;
  readonly cells: readonly Coord[];
  readonly length: number;
}

function extractRuns(grid: Grid, orientation: Orientation): Slot[] {
  const outerCount = orientation === 'across' ? grid.rows : grid.cols;
  const innerCount = orientation === 'across' ? grid.cols : grid.rows;
  const slots: Slot[] = [];

  for (let outer = 0; outer < outerCount; outer += 1) {
    let run: Coord[] = [];
    for (let inner = 0; inner <= innerCount; inner += 1) {
      const coord: Coord =
        orientation === 'across' ? { col: inner, row: outer } : { col: outer, row: inner };
      const active = inner < innerCount && grid.at(coord.col, coord.row).kind === 'active';
      if (active) {
        run.push(coord);
        continue;
      }
      if (run.length >= 2) {
        slots.push({ orientation, start: run[0], cells: run, length: run.length });
      }
      run = [];
    }
  }

  return slots.sort((a, b) => a.start.row - b.start.row || a.start.col - b.start.col);
}

export function extractSlots(grid: Grid): readonly Slot[] {
  return [...extractRuns(grid, 'across'), ...extractRuns(grid, 'down')];
}
