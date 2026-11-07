// The grid's width at most, whatever the window's height (15-S1): 700px for
// a Sunday (21 columns, as `PuzzleGrid`'s type), 620px for every other size
// (21-S9).
const SUNDAY_COLS = 21;
const SUNDAY_GRID_MAX_PX = 700;
const GRID_MAX_PX = 620;

export function gridMaxPx(cols: number): number {
  return cols === SUNDAY_COLS ? SUNDAY_GRID_MAX_PX : GRID_MAX_PX;
}

/** The builder's two hint columns sit side by side from a 1430px window
 *  for every size (21-S9): 650px of room beside a 700px grid, 730px beside
 *  a 620px one. Both classes are literal for Tailwind. */
export function twoHintColumnsClass(gridPx: number): string {
  return gridPx === SUNDAY_GRID_MAX_PX ? '@min-[650px]:flex-row' : '@min-[730px]:flex-row';
}
