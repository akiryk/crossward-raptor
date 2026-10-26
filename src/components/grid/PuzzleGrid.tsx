import type { Cell, Coord, Grid } from '../../engine/grid';
import { convertEmptyCellsToBlack } from '../../engine/phase';
import { intendedGeometry } from '../../engine/puzzle-geometry';
import { recommendedCells } from '../../engine/slots';
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
  recommended: 'bg-recommended',
  'locked-letter': 'bg-locked-letter',
  'editable-letter': 'bg-editable-letter',
  slot: 'bg-slot',
  // Both point at the same token for now (one color for "has a letter" and
  // "needs one for symmetry" within the active slot). Splitting them later
  // -- e.g. keeping slot-letter white -- is a one-line change here.
  'slot-letter': 'bg-slot-content',
  'slot-required': 'bg-slot-content',
  selected: 'bg-selected',
};

// The build phase's own colors (14-S5). Selection and slot appearances
// only occur there and in EDIT GRID, which keeps APPEARANCE_BG until S6.
const BUILD_BG: Partial<Record<CellAppearance, string>> = {
  empty: 'bg-build-cell-off',
  letter: 'bg-build-cell-on',
  'symmetric-hint': 'bg-build-cell-on',
  selected: 'bg-build-cell-selected-cell',
  slot: 'bg-build-cell-selected-row-off',
  'slot-letter': 'bg-build-cell-selected-row-on',
  'slot-required': 'bg-build-cell-selected-row-on',
};

const PREVIEW_BG: Partial<Record<CellAppearance, string>> = {
  black: 'bg-preview-cell-off',
  letter: 'bg-preview-cell-on',
  required: 'bg-preview-cell-error',
  recommended: 'bg-preview-cell-warning',
};

const GRID_LINES: Record<string, string> = {
  build: 'bg-build-cell-border',
  preview: 'bg-preview-cell-border',
  hints: 'bg-grid-line-build',
  'hints-editing': 'bg-grid-line-build',
  play: 'bg-grid-line-play',
};

// cell-letter's size in a 35px cell (a 15×15 at its 526px maximum); a
// letter keeps that ratio to its cell at every grid size and width (14-S5).
const CELL_LETTER_PX = 16;
const CELL_LETTER_PITCH_PX = 35;

export function PuzzleGrid({
  grid,
  highlights,
  mode = 'build',
  isHintsPhase = false,
  isEditingGrid = false,
  onCellClick,
}: {
  grid: Grid;
  /** Keyed via cellNumberKey (Story P2) — "row,col". */
  highlights?: ReadonlyMap<string, 'selected' | 'slot'>;
  mode?: GridMode;
  isHintsPhase?: boolean;
  isEditingGrid?: boolean;
  onCellClick?: (coord: Coord) => void;
}) {
  // Builder empties are undecided geometry; player empties are fixed active
  // cells. A player's guesses must never change the published numbering.
  const numbers = buildCellNumberLookup(mode === 'play' ? grid : convertEmptyCellsToBlack(grid));
  const hints = mode === 'play' ? new Set<string>() : symmetricHintKeys(grid);
  const recommended = new Set(
    mode === 'play' ? [] : recommendedCells(intendedGeometry(grid)).map(cellNumberKey)
  );
  // Preview and play take precedence over the builder's hints-phase flags.
  const gridMode =
    mode !== 'build' ? mode : isHintsPhase ? (isEditingGrid ? 'hints-editing' : 'hints') : 'build';
  const modeBg = gridMode === 'build' ? BUILD_BG : gridMode === 'preview' ? PREVIEW_BG : {};

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
        isRecommended: recommended.has(key),
        isHintsPhase,
        isEditingGrid,
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
          className={modeBg[appearance] ?? APPEARANCE_BG[appearance]}
          style={mode === 'play' && cell.kind === 'active' && highlight ? {
            boxShadow: highlight === 'selected'
              ? 'inset 0 0 0 3px var(--color-accent)'
              : 'inset 0 0 0 1px var(--color-ink-3)',
          } : undefined}
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
      data-grid-mode={gridMode}
      // Hairlines use the container-background technique (D1c): painted
      // --color-grid-line-build or --color-grid-line-play depending on
      // mode, with gap and padding both --grid-line-width so the same
      // one-pixel division surrounds the outside too, not just between
      // cells.
      className={`grid w-full ${GRID_LINES[gridMode]}`}
      style={{
        // The letters size against the grid's own width (14-S5): 100cqw is
        // its content box, so the cell pitch is (100cqw + 1px) / cols.
        containerType: 'inline-size',
        ['--cell-letter-size' as string]: `calc((100cqw + 1px) * ${CELL_LETTER_PX / CELL_LETTER_PITCH_PX / grid.cols})`,
        // minmax(0, 1fr), not bare 1fr: fr tracks default to an implicit
        // min-size of their content's min-content, which lets a small
        // cell's letter text force the track taller/wider than the
        // aspect-ratio-derived square size at small viewports (Story D5a).
        gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
        aspectRatio: `${grid.cols} / ${grid.rows}`,
        gap: 'var(--grid-line-width)',
        padding: 'var(--grid-line-width)',
      }}
    >
      {cells}
    </div>
  );
}
