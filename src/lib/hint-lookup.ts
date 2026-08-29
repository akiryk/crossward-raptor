import type { CursorState } from '../engine/cursor';
import type { Grid } from '../engine/grid';
import { hintKey } from '../engine/hints';
import { slotsWithNumbers, type NumberedSlot } from '../engine/numbering';

/** Every slot in the grid, keyed by hintKey({number, orientation}). */
export function buildSlotLookup(grid: Grid): ReadonlyMap<string, NumberedSlot> {
  const lookup = new Map<string, NumberedSlot>();
  for (const slot of slotsWithNumbers(grid)) {
    lookup.set(hintKey({ number: slot.number, orientation: slot.orientation }), slot);
  }
  return lookup;
}

/** The key of whichever slot contains the cursor's current cell in its
 *  current orientation, or null if no such slot exists (e.g. the cell is
 *  only part of an across run and the cursor is oriented 'down'). */
export function activeHintKey(
  lookup: ReadonlyMap<string, NumberedSlot>,
  cursor: CursorState
): string | null {
  for (const slot of lookup.values()) {
    if (slot.orientation !== cursor.orientation) continue;
    const inSlot = slot.cells.some(
      (cell) => cell.col === cursor.current.col && cell.row === cursor.current.row
    );
    if (inSlot) {
      return hintKey({ number: slot.number, orientation: slot.orientation });
    }
  }
  return null;
}

/** Same "non-blank" rule Story D's hintsComplete uses, at single-hint
 *  granularity rather than whole-puzzle. */
export function isHintFilled(hints: Record<string, string>, key: string): boolean {
  const text = hints[key];
  return text !== undefined && text.trim() !== '';
}
