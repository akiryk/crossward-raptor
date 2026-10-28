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

// The cell wrapper -- not GridCell's inner leaf -- carries each mode's
// background, since it's what the hairline technique's gap/padding
// surrounds.
//
// The build phase's own colors (14-S5). Selection and slot appearances
// only occur there. A black cell, only in a build-phase grid saved before
// 14-S5 removed '.', is an off cell (14-S8).
const BUILD_BG: Partial<Record<CellAppearance, string>> = {
  black: 'bg-build-cell-off',
  empty: 'bg-build-cell-off',
  letter: 'bg-build-cell-on',
  'symmetric-hint': 'bg-build-cell-on',
  selected: 'bg-build-cell-selected-cell',
  slot: 'bg-build-cell-selected-row-off',
  'slot-letter': 'bg-build-cell-selected-row-on',
  'slot-required': 'bg-build-cell-selected-row-on',
};

// The hints phase's own colors (14-S6). A highlighted cell takes its
// color from what has focus; see hintsHighlightBg.
const HINTS_BG: Partial<Record<CellAppearance, string>> = {
  black: 'bg-hint-cell-off',
  empty: 'bg-hint-cell-on',
  'locked-letter': 'bg-hint-cell-on',
  'symmetric-hint': 'bg-hint-cell-on',
};

// Lock Grid Letters (14-S12): the on cells turn gray, and only a focused
// hint input's word is highlighted, in the same blue.
const HINTS_LOCKED_BG: Partial<Record<CellAppearance, string>> = {
  ...HINTS_BG,
  empty: 'bg-hint-cell-locked-on',
  'locked-letter': 'bg-hint-cell-locked-on',
  'symmetric-hint': 'bg-hint-cell-locked-on',
};

// The grid's own focus shows the cursor and its word in yellow; a hint
// input's focus shows its word in blue (14-S6, 14-S12).
function hintsHighlightBg(highlight: 'selected' | 'slot', isGridFocused: boolean) {
  if (!isGridFocused) return 'bg-hint-cell-selected';
  return highlight === 'selected' ? 'bg-hint-cell-cursor' : 'bg-hint-cell-cursor-word';
}

// Play's own colors (14-S7): the cursor cell and the rest of its word.
const PLAY_BG: Partial<Record<CellAppearance, string>> = {
  black: 'bg-play-cell-off',
  letter: 'bg-play-cell-on',
};
const PLAY_HIGHLIGHT_BG = {
  selected: 'bg-play-cell-selected-cell',
  slot: 'bg-play-cell-selected-row',
} as const;

const PREVIEW_BG: Partial<Record<CellAppearance, string>> = {
  black: 'bg-preview-cell-off',
  letter: 'bg-preview-cell-on',
  required: 'bg-preview-cell-error',
  recommended: 'bg-preview-cell-warning',
};

const GRID_LINES: Record<string, string> = {
  build: 'bg-build-cell-border',
  preview: 'bg-preview-cell-border',
  hints: 'bg-hint-cell-border',
  'hints-locked': 'bg-hint-cell-border',
  play: 'bg-play-cell-border',
};

// cell-letter's size in a 35px cell (14-S5's 15×15 at 526px); a
// letter keeps that ratio to its cell at every grid size and width (14-S5).
const CELL_LETTER_PX = 16;
const CELL_LETTER_PITCH_PX = 35;

export function PuzzleGrid({
  grid,
  highlights,
  mode = 'build',
  isHintsPhase = false,
  isGridFocused = false,
  isLettersLocked = false,
  onCellClick,
}: {
  grid: Grid;
  /** Keyed via cellNumberKey (Story P2) — "row,col". */
  highlights?: ReadonlyMap<string, 'selected' | 'slot'>;
  mode?: GridMode;
  isHintsPhase?: boolean;
  /** Hints phase: the grid itself has focus, not a hint input. */
  isGridFocused?: boolean;
  /** Hints phase: Lock Grid Letters is on. */
  isLettersLocked?: boolean;
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
    mode !== 'build'
      ? mode
      : isHintsPhase
        ? isLettersLocked
          ? 'hints-locked'
          : 'hints'
        : 'build';
  const modeBg =
    gridMode === 'build'
      ? BUILD_BG
      : gridMode === 'preview'
        ? PREVIEW_BG
        : gridMode === 'hints'
          ? HINTS_BG
          : gridMode === 'hints-locked'
            ? HINTS_LOCKED_BG
            : PLAY_BG;

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
          className={
            gridMode === 'hints' && highlight && cell.kind === 'active'
              ? hintsHighlightBg(highlight, isGridFocused)
              : gridMode === 'hints-locked' && highlight && cell.kind === 'active'
                ? 'bg-hint-cell-selected'
                : gridMode === 'play' && highlight && cell.kind === 'active'
                  ? PLAY_HIGHLIGHT_BG[highlight]
                  : modeBg[appearance]
          }
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
      // in the phase's border style, with gap and padding both
      // --grid-line-width so the same one-pixel division surrounds the
      // outside too, not just between cells.
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
