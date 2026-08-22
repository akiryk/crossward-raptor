import type { Coord, Grid } from './grid';
import type { Slot } from './slots';
import { extractSlots } from './slots';

export interface NumberedCell {
  readonly coord: Coord;
  readonly number: number;
}

function startCellKey(coord: Coord): string {
  return `${coord.row},${coord.col}`;
}

function orderedStartCells(grid: Grid): Coord[] {
  const seen = new Set<string>();
  const starts: Coord[] = [];
  for (const slot of extractSlots(grid)) {
    const key = startCellKey(slot.start);
    if (!seen.has(key)) {
      seen.add(key);
      starts.push(slot.start);
    }
  }
  return starts.sort((a, b) => a.row - b.row || a.col - b.col);
}

export function numberGrid(grid: Grid): readonly NumberedCell[] {
  return orderedStartCells(grid).map((coord, index) => ({ coord, number: index + 1 }));
}

export type NumberedSlot = Slot & { readonly number: number };

export function slotsWithNumbers(grid: Grid): readonly NumberedSlot[] {
  const numberByStart = new Map<string, number>();
  orderedStartCells(grid).forEach((coord, index) => {
    numberByStart.set(startCellKey(coord), index + 1);
  });

  return extractSlots(grid).map((slot) => ({
    ...slot,
    number: numberByStart.get(startCellKey(slot.start))!,
  }));
}
