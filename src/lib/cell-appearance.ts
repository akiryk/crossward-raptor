import type { Cell, Coord, Grid } from '../engine/grid';
import { symmetricCounterpart } from '../engine/symmetry';
import { cellNumberKey } from './cell-number-lookup';

export type CellAppearance =
  | 'black'
  | 'empty'
  | 'letter'
  | 'symmetric-hint'
  | 'required' // preview only
  | 'slot'
  | 'selected';

export type GridMode = 'build' | 'preview';

/**
 * The single visual state a cell should render in.
 *
 * Build mode precedence, highest first: selected, slot, then the cell's
 * own content. Preview mode ignores selection and slot entirely -- it
 * answers "what will this look like published", and the builder's own
 * cursor state would obscure that.
 */
export function cellAppearance(args: {
  cell: Cell;
  isSelected: boolean;
  isInSlot: boolean;
  isSymmetricHint: boolean;
  mode?: GridMode;
}): CellAppearance {
  const { cell, isSelected, isInSlot, isSymmetricHint, mode = 'build' } = args;

  if (cell.kind === 'black') return 'black';

  if (mode === 'preview') {
    if (cell.letter !== null) return 'letter';
    return isSymmetricHint ? 'required' : 'black';
  }

  if (isSelected) return 'selected';
  if (isInSlot) return 'slot';
  if (cell.letter !== null) return 'letter';
  return isSymmetricHint ? 'symmetric-hint' : 'empty';
}

/**
 * Keys (via cellNumberKey) of empty active cells that are the symmetric
 * counterpart of a cell holding a letter — the squares a symmetric grid
 * would want filled. Render-only; nothing is stored.
 */
export function symmetricHintKeys(grid: Grid): ReadonlySet<string> {
  const keys = new Set<string>();

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row);
      if (cell.kind !== 'active' || cell.letter === null) continue;

      const counterpart: Coord = symmetricCounterpart(grid, { col, row });
      if (counterpart.col === col && counterpart.row === row) continue;

      const counterpartCell = grid.at(counterpart.col, counterpart.row);
      if (counterpartCell.kind === 'active' && counterpartCell.letter === null) {
        keys.add(cellNumberKey(counterpart));
      }
    }
  }

  return keys;
}
