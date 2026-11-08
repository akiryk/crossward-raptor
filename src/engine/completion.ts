import type { Grid } from './grid';

/** How much of a grid is lettered: `lettered` cells out of all `total`
 *  cells (`cols × rows`). Derived from the grid, never stored. */
export type CompletionCount = { readonly lettered: number; readonly total: number };

/** The completion percentage at which the grid is ready for hints. */
export const READY_PERCENT = 80;

/** Counts the active cells holding a letter (a rebus counts once) over
 *  every cell of the grid. Black cells, possible in grids saved before
 *  the all-white model, count in the total but never as lettered. */
export function completionCount(grid: Grid): CompletionCount {
  let lettered = 0;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row);
      if (cell.kind === 'active' && cell.letter !== null) lettered++;
    }
  }
  return { lettered, total: grid.cols * grid.rows };
}

/** The whole percentage, rounded down: 179 of 225 is 79. A grid with no
 *  cells is 0. The quotient of two small integers is never close enough
 *  to the next whole number for floating-point floor to misround. */
export function completionPercent(count: CompletionCount): number {
  if (count.total === 0) return 0;
  return Math.floor((100 * count.lettered) / count.total);
}

/** Ready exactly when the shown percentage reaches READY_PERCENT, so the
 *  ready state never disagrees with the displayed "80%". */
export function isReadyForHints(count: CompletionCount): boolean {
  return completionPercent(count) >= READY_PERCENT;
}
