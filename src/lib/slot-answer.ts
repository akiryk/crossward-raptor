import type { Grid } from '../engine/grid';
import type { NumberedSlot } from '../engine/numbering';

/**
 * The answer currently written in a slot, one character per cell in
 * reading order. An empty cell contributes '_', so the returned string
 * is always exactly as long as the slot.
 */
export function slotAnswer(grid: Grid, slot: NumberedSlot): string {
  return slot.cells
    .map((coord) => {
      const cell = grid.at(coord.col, coord.row);
      return cell.kind === 'active' && cell.letter !== null ? cell.letter : '_';
    })
    .join('');
}
