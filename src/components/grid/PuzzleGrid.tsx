'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
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
import { endCells, isCellLocked, lockedWordCells, type LockedWord } from '../../lib/locked-words';
import { LockIcon } from '../ui/LockIcon';
import { Tooltip } from '../ui/Tooltip';
import { GridCell } from './GridCell';
import { RebusEntry, type RebusEntryProps } from './RebusEntry';

/** Mouse hover over the lock button before its tooltip shows (21-S4). */
const LOCK_TOOLTIP_DELAY_MS = 1000;
const LOCK_TOOLTIP = {
  unlocked: "Lock this word so you don't accidentally change it",
  locked: 'Enable changing this word',
} as const;

const ON_BG = { build: 'bg-build-cell-on', preview: 'bg-preview-cell-on', hints: 'bg-hint-cell-on', 'hints-locked': 'bg-hint-cell-on', play: 'bg-play-cell-on' } as const;

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

// The grid's own focus shows the cursor in yellow and its word in blue; a hint
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

// Selection in Preview (17-S4): the build phase's cursor and word colors,
// over Preview's own words. No cell takes the row's "off" color.
const PREVIEW_HIGHLIGHT_BG = {
  selected: 'bg-build-cell-selected-cell',
  slot: 'bg-build-cell-selected-row-on',
} as const;

// What a marked cell means, on mouse hover in Preview (20-S2). It
// follows the cell's mark, not the cursor's colors painted over it.
const PREVIEW_TOOLTIP: Partial<Record<CellAppearance, string>> = {
  recommended: 'Consider avoiding two-letter words.',
  required: 'Filling in these cells will result in a symmetrical puzzle.',
};

const GRID_LINES: Record<string, string> = {
  build: 'bg-build-cell-border',
  preview: 'bg-preview-cell-border',
  hints: 'bg-hint-cell-border',
  'hints-locked': 'bg-hint-cell-border',
  play: 'bg-play-cell-border',
};

// A Sunday's letters and numbers are the NYT's (17-S7), in proportion to
// the cell's pitch at every width, with no floor or cap: in Inter, the
// capitals are 0.475 of the pitch and the digits 0.24, the letter low.
const SUNDAY_SIZE = 21;
const SUNDAY_LETTER_PER_PITCH = 0.64;
const SUNDAY_NUMBER_PER_PITCH = 0.31;

// Other sizes keep their type from before 17-S7: cell-letter's size in a
// 35px cell (14-S5's 15×15 at 526px), kept in ratio to the cell, and
// centered; cell-number's size down to a 21×21's cell at 560px, shrinking
// with a smaller cell to an 8px floor, never growing (15-S6).
const CELL_LETTER_PX = 16;
const CELL_LETTER_PITCH_PX = 35;
const CELL_NUMBER_PX = 10;
const CELL_NUMBER_MIN_PX = 8;
const CELL_NUMBER_PITCH_PX = (560 - 1) / 21;

// The lock button is 2/3 of a cell, at most 32px (21-S2).
const LOCK_BUTTON_MAX_PX = 32;

/** The grid area spanning the cells, for an absolutely placed overlay. */
function gridArea(coords: Coord[]) {
  const cols = coords.map((c) => c.col);
  const rows = coords.map((c) => c.row);
  return {
    gridColumn: `${Math.min(...cols) + 1} / ${Math.max(...cols) + 2}`,
    gridRow: `${Math.min(...rows) + 1} / ${Math.max(...rows) + 2}`,
  };
}

export function PuzzleGrid({
  grid,
  highlights,
  mode = 'build',
  isHintsPhase = false,
  isGridFocused = false,
  isLettersLocked = false,
  onCellClick,
  rebus,
  cursorWord,
  lockedWords = [],
  lockTarget = null,
  hasLockButton = true,
  onToggleLock,
}: {
  rebus?: RebusEntryProps & { coord: Coord };
  grid: Grid;
  /** Build phase: the cursor's word, keyed via cellNumberKey; the rest of
   *  its slot is plain 'slot' (21-S1). */
  cursorWord?: ReadonlySet<string>;
  /** Keyed via cellNumberKey (Story P2) — "row,col". */
  highlights?: ReadonlyMap<string, 'selected' | 'slot'>;
  mode?: GridMode;
  isHintsPhase?: boolean;
  /** Hints phase: the grid itself has focus, not a hint input. */
  isGridFocused?: boolean;
  /** Hints phase: Lock Grid Letters is on. */
  isLettersLocked?: boolean;
  onCellClick?: (coord: Coord) => void;
  /** Build phase, Preview off: the locked words, outlined, with gray
   *  letters and ticked end cells (21-S2). */
  lockedWords?: readonly LockedWord[];
  /** Build phase, Preview off: the word whose lock button shows. */
  lockTarget?: { word: LockedWord; isLocked: boolean } | null;
  /** The button beside the word shows only at the grid's full width; the
   *  outline shows either way (21-S5). */
  hasLockButton?: boolean;
  onToggleLock?: () => void;
}) {
  // The cell under the mouse, in Preview, and the cell its tooltip stays
  // over (20-S3); a touch or pen shows nothing.
  const [hover, setHover] = useState<{ cell: HTMLElement; anchor: HTMLElement } | null>(null);
  // The lock button's tooltip (21-S4): shown after a second of mouse hover
  // (a touch or pen shows nothing), for the word it was hovered in. It
  // goes when the mouse leaves or the button does.
  const lockKey = lockTarget
    ? `${lockTarget.word.col},${lockTarget.word.row} ${lockTarget.word.orientation}`
    : null;
  const [lockTip, setLockTip] = useState<{ anchor: HTMLElement; key: string } | null>(null);
  const lockTipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelLockTip = () => {
    if (lockTipTimer.current) clearTimeout(lockTipTimer.current);
    lockTipTimer.current = null;
    setLockTip(null);
  };
  useEffect(() => () => {
    if (lockTipTimer.current) clearTimeout(lockTipTimer.current);
  }, []);
  // A timer from a button that's gone (no leave event) never shows.
  useEffect(() => {
    if (lockKey === null && lockTipTimer.current) {
      clearTimeout(lockTipTimer.current);
      lockTipTimer.current = null;
    }
  }, [lockKey]);
  const lockTipAnchor =
    lockTip && lockTip.key === lockKey && lockTip.anchor.isConnected ? lockTip.anchor : null;
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
  const appearances = new Map<string, CellAppearance>();
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
        isOutsideWord: cursorWord !== undefined && !cursorWord.has(key),
        isHintsPhase,
        mode,
      });
      appearances.set(`${col},${row}`, appearance);
      cells.push(
        <div
          key={`${col},${row}`}
          data-testid="grid-cell"
          data-coord={`${col},${row}`}
          data-kind={cell.kind}
          data-selected={highlight === 'selected' ? 'true' : undefined}
          data-highlight={highlight}
          data-cell-state={appearance}
          className={(rebus && rebus.coord.col === col && rebus.coord.row === row ? 'relative ' : '') + (
            gridMode === 'hints' && highlight && cell.kind === 'active'
              ? hintsHighlightBg(highlight, isGridFocused)
              : gridMode === 'hints-locked' && highlight && cell.kind === 'active'
                ? 'bg-hint-cell-selected'
                : gridMode === 'play' && highlight && cell.kind === 'active'
                  ? PLAY_HIGHLIGHT_BG[highlight]
                  : gridMode === 'preview' && highlight && cell.kind === 'active'
                    ? PREVIEW_HIGHLIGHT_BG[highlight]
                    : modeBg[appearance] ?? '')
          }
        >
          <GridCell
            cell={cell}
            number={number}
            isLocked={isCellLocked(lockedWords, { col, row })}
            onClick={onCellClick ? () => onCellClick({ col, row }) : undefined}
          />
          {rebus && rebus.coord.col === col && rebus.coord.row === row && (
            <RebusEntry value={rebus.value} onChange={rebus.onChange} onClose={rebus.onClose} bg={ON_BG[gridMode]} />
          )}
        </div>
      );
    }
  }

  // Whether two cells are of one group: touching cells, side by side or
  // one above the other, all of the same mark (20-S3).
  function isSameGroup(from: string, to: string) {
    const mark = appearances.get(from);
    if (!mark || !PREVIEW_TOOLTIP[mark] || appearances.get(to) !== mark) return false;
    const seen = new Set([from]);
    const queue = [from];
    while (queue.length > 0) {
      const coord = queue.shift()!;
      if (coord === to) return true;
      const [col, row] = coord.split(',').map(Number);
      for (const next of [`${col - 1},${row}`, `${col + 1},${row}`, `${col},${row - 1}`, `${col},${row + 1}`]) {
        if (!seen.has(next) && appearances.get(next) === mark) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return false;
  }
  // The tooltip stays over the first cell of the hovered cell's group;
  // otherwise it's over the hovered cell, with that cell's text.
  function anchorFor(cell: HTMLElement, anchor: HTMLElement) {
    return isSameGroup(anchor.dataset.coord!, cell.dataset.coord!) ? anchor : cell;
  }
  const anchor = hover && anchorFor(hover.cell, hover.anchor);
  const tooltip =
    gridMode === 'preview' && hover ? PREVIEW_TOOLTIP[appearances.get(hover.cell.dataset.coord!)!] : undefined;

  function handlePointerOver(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return;
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-coord]');
    // The lines between cells change nothing.
    if (!cell) return;
    setHover({ cell, anchor: anchor && tooltip ? anchorFor(cell, anchor) : cell });
  }

  // Locked words' outlines and end-cell ticks, and the lock button with its
  // word's outline (21-S2). Each is absolutely placed in its cells' grid
  // area, so it takes no cell's place.
  const outlined = [...lockedWords];
  if (lockTarget && !lockTarget.isLocked) outlined.push(lockTarget.word);
  const ticked = new Map<string, Coord>();
  for (const word of lockedWords) {
    for (const end of endCells(grid, word)) ticked.set(`${end.col},${end.row}`, end);
  }
  const overlays = [
    ...outlined.map((word) => (
      <div
        key={`outline ${word.col},${word.row} ${word.orientation}`}
        data-testid="word-outline"
        aria-hidden="true"
        className="pointer-events-none absolute border border-(--palette-gray-500)"
        style={{ ...gridArea([...lockedWordCells(word), ...endCells(grid, word)]), inset: 'calc(-1 * var(--grid-line-width))' }}
      />
    )),
    ...[...ticked].map(([key, end]) => (
      <div key={`tick ${key}`} className="pointer-events-none absolute inset-0" style={gridArea([end])} aria-hidden="true">
        <div
          data-testid="lock-tick"
          className="absolute top-0 right-0 h-1/4 w-1/4 bg-(--palette-gray-500)"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
        />
      </div>
    )),
  ];
  if (lockTarget && hasLockButton) {
    const { word, isLocked } = lockTarget;
    const cells = lockedWordCells(word);
    const isAcross = word.orientation === 'across';
    overlays.push(
      <button
        key="lock-button"
        type="button"
        aria-label={isLocked ? 'Unlock word' : 'Lock word'}
        // A click leaves the keyboard focus on the grid.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggleLock}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse' || !lockKey) return;
          const anchor = e.currentTarget;
          cancelLockTip();
          lockTipTimer.current = setTimeout(() => {
            lockTipTimer.current = null;
            setLockTip({ anchor, key: lockKey });
          }, LOCK_TOOLTIP_DELAY_MS);
        }}
        onPointerLeave={cancelLockTip}
        // Enter and Space are the button's, not the grid's.
        onKeyDown={(e) => e.stopPropagation()}
        className={`absolute z-10 flex items-center justify-center bg-(--palette-gray-500) text-(--palette-white) hover:bg-(--palette-gray-700) ${
          isAcross ? 'rounded-r-[4px]' : 'rounded-b-[4px]'
        }`}
        style={{
          ...gridArea([cells[cells.length - 1]]),
          width: `min(${LOCK_BUTTON_MAX_PX}px, calc(100% * 2 / 3))`,
          height: `min(${LOCK_BUTTON_MAX_PX}px, calc(100% * 2 / 3))`,
          ...(isAcross
            ? { left: 'calc(100% + var(--grid-line-width))', top: '50%', transform: 'translateY(-50%)' }
            : { top: 'calc(100% + var(--grid-line-width))', left: '50%', transform: 'translateX(-50%)' }),
        }}
      >
        <LockIcon isLocked={isLocked} className="h-3/5 w-3/5" />
      </button>
    );
  }

  return (
    <div
      data-testid="puzzle-grid"
      data-grid-mode={gridMode}
      // Hairlines use the container-background technique (D1c): painted
      // in the phase's border style, with gap and padding both
      // --grid-line-width so the same one-pixel division surrounds the
      // outside too, not just between cells.
      className={`relative grid w-full ${GRID_LINES[gridMode]}`}
      onPointerOver={handlePointerOver}
      onPointerLeave={() => setHover(null)}
      style={{
        // Cells size against the grid's own width (14-S5): 100cqw is its
        // content box, so the cell pitch is (100cqw + 1px) / cols.
        containerType: 'inline-size',
        ['--cell-pitch' as string]: `calc((100cqw + 1px) / ${grid.cols})`,
        ...(grid.cols === SUNDAY_SIZE
          ? {
              ['--cell-letter-size' as string]: `calc(var(--cell-pitch) * ${SUNDAY_LETTER_PER_PITCH})`,
              ['--cell-letter-align' as string]: 'flex-start',
              ['--cell-letter-top' as string]: 'calc(var(--cell-pitch) * 0.37)',
              ['--cell-number-size' as string]: `calc(var(--cell-pitch) * ${SUNDAY_NUMBER_PER_PITCH})`,
              ['--cell-number-top' as string]: 'calc(var(--cell-pitch) * 0.07)',
              ['--cell-number-left' as string]: 'calc(var(--cell-pitch) * 0.06)',
              ['--cell-number-pad' as string]: '0px',
            }
          : {
              ['--cell-letter-size' as string]: `calc(var(--cell-pitch) * ${CELL_LETTER_PX / CELL_LETTER_PITCH_PX})`,
              ['--cell-number-size' as string]: `clamp(${CELL_NUMBER_MIN_PX}px, calc(var(--cell-pitch) * ${CELL_NUMBER_PX / CELL_NUMBER_PITCH_PX}), ${CELL_NUMBER_PX}px)`,
            }),
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
      {overlays}
      <Tooltip anchor={tooltip ? anchor : null} testId="preview-tooltip">
        {tooltip}
      </Tooltip>
      <Tooltip anchor={lockTipAnchor} testId="lock-tooltip">
        {lockTarget?.isLocked ? LOCK_TOOLTIP.locked : LOCK_TOOLTIP.unlocked}
      </Tooltip>
    </div>
  );
}
