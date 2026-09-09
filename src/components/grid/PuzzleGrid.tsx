import type { Cell, Coord, Grid } from '../../engine/grid';
import { convertEmptyCellsToBlack } from '../../engine/phase';
import { buildCellNumberLookup, cellNumberKey } from '../../lib/cell-number-lookup';
import {
  cellAppearance,
  symmetricHintKeys,
  type CellAppearance,
  type GridMode,
} from '../../lib/cell-appearance';
import { GridCell } from './GridCell';

// The cell wrapper -- not GridCell's inner leaf -- carries the background,
// since it's what the hairline technique's gap/padding surrounds, and the
// only element background/geometry assertions have any reason to inspect.
const APPEARANCE_BG: Record<CellAppearance, string> = {
  black: 'bg-foreground',
  empty: 'bg-grid-empty',
  letter: 'bg-background',
  'symmetric-hint': 'bg-background',
  required: 'bg-required',
  slot: 'bg-selected/40',
  selected: 'bg-selected',
};

export function PuzzleGrid({
  grid,
  highlights,
  mode = 'build',
  onCellClick,
}: {
  grid: Grid;
  /** Keyed via cellNumberKey (Story P2) — "row,col". */
  highlights?: ReadonlyMap<string, 'selected' | 'slot'>;
  mode?: GridMode;
  onCellClick?: (coord: Coord) => void;
}) {
  // Numbers reflect the puzzle as it will actually be, not the raw grid --
  // otherwise every empty cell looks like a word start (Story D3). Same
  // numbers in both modes -- preview doesn't change the effective geometry.
  const numbers = buildCellNumberLookup(convertEmptyCellsToBlack(grid));
  const hints = symmetricHintKeys(grid);
  const cells = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = grid.at(col, row) as Cell;
      const key = cellNumberKey({ col, row });
      const number = numbers.get(key);
      const highlight = highlights?.get(key);
      const appearance = cellAppearance({
        cell,
        isSelected: highlight === 'selected',
        isInSlot: highlight === 'slot',
        isSymmetricHint: hints.has(key),
        mode,
      });
      cells.push(
        <div
          key={`${col},${row}`}
          data-testid="grid-cell"
          data-coord={`${col},${row}`}
          data-kind={cell.kind}
          data-selected={highlight === 'selected' ? 'true' : undefined}
          data-highlight={highlight}
          data-cell-state={appearance}
          className={APPEARANCE_BG[appearance]}
        >
          <GridCell
            cell={cell}
            number={number}
            onClick={onCellClick ? () => onCellClick({ col, row }) : undefined}
          />
        </div>
      );
    }
  }

  return (
    <div
      data-testid="puzzle-grid"
      data-grid-mode={mode}
      // Hairlines use the container-background technique (D1c): painted
      // --color-grid-line, with gap and padding both --grid-line-width so
      // the same one-pixel division surrounds the outside too, not just
      // between cells.
      className="grid w-full bg-grid-line"
      style={{
        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        aspectRatio: `${grid.cols} / ${grid.rows}`,
        gap: 'var(--grid-line-width)',
        padding: 'var(--grid-line-width)',
      }}
    >
      {cells}
    </div>
  );
}
