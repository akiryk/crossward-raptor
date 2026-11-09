'use client';

import { useRef, useState, type PointerEvent } from 'react';
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
import {
  endCells,
  isCellLocked,
  lockedWordCells,
  lockedWordsEndingAt,
  sameWord,
  type LockedWord,
} from '../../lib/locked-words';
import { LockIcon } from '../ui/LockIcon';
import { Tooltip } from '../ui/Tooltip';
import { GridCell } from './GridCell';
import { RebusEntry, type RebusEntryProps } from './RebusEntry';

// The lock button's tooltip names its word (22-S6): "Lock" or "Unlock",
// then each cell's letters in reading order, a rebus cell's all of them.
function lockTooltipText(grid: Grid, word: LockedWord, isLocked: boolean): string {
  const letters = lockedWordCells(word)
    .map(({ col, row }) => {
      const cell = grid.at(col, row);
      return cell.kind === 'active' ? (cell.letter ?? '') : '';
    })
    .join('')
    .toUpperCase();
  return `${isLocked ? 'Unlock' : 'Lock'} ${letters}`;
}

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
  required: 'Fill in these cells so the puzzle is symmetrical.',
};

const GRID_LINES: Record<string, string> = {
  build: 'bg-build-cell-border',
  preview: 'bg-preview-cell-border',
  hints: 'bg-hint-cell-border',
  'hints-locked': 'bg-hint-cell-border',
  play: 'bg-play-cell-border',
};

// Preview's toggle fades the cells' backgrounds, their letters' colors and
// the grid's lines (22-S5): 500ms, CSS's own ease-in-out, not Tailwind's
// ease-in-out curve; none with reduced motion. The editor ends the window.
const FADE = 'transition-colors duration-500 ease-[ease-in-out] motion-reduce:transition-none';
const FADE_CELL = `${FADE} *:transition-colors *:duration-500 *:ease-[ease-in-out] motion-reduce:*:transition-none`;

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
  isLockButtonTabStop = true,
  onToggleLock,
  onHoverCell,
  isFading = false,
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
  /** The button beside the word shows only where it has room (21-S12); the
   *  outline shows either way (21-S5). */
  hasLockButton?: boolean;
  /** The hover's button is for the mouse only (21-S10). */
  isLockButtonTabStop?: boolean;
  onToggleLock?: () => void;
  /** The mouse moved onto a cell, or its hover ended: it left the grid, or
   *  the lock button took keyboard focus (21-S10). Mouse only. */
  onHoverCell?: (coord: Coord | null) => void;
  /** Preview has just turned on or off: colors fade (22-S5). */
  isFading?: boolean;
}) {
  // The cell under the mouse, in Preview, and the cell its tooltip stays
  // over (20-S3); a touch or pen shows nothing.
  const [hover, setHover] = useState<{ cell: HTMLElement; anchor: HTMLElement } | null>(null);
  // The lock button under the mouse (21-S4; a touch or pen sets none), for
  // the word it was hovered in: its tooltip's target, whose timing is
  // Tooltip's (22-S4). It goes when the mouse leaves or the button does.
  const lockKey = lockTarget
    ? `${lockTarget.word.col},${lockTarget.word.row} ${lockTarget.word.orientation}`
    : null;
  const [lockHover, setLockHover] = useState<{ anchor: HTMLElement; key: string } | null>(null);
  // The cell the mouse last moved onto (21-S10): resting there, or moving
  // within it or over the lines between cells, reports nothing new.
  const hoverCoord = useRef<string | null>(null);
  // The end cells with a tick (21-S2), one per cell however many words
  // end there.
  const ticked = new Map<string, Coord>();
  for (const word of lockedWords) {
    for (const end of endCells(grid, word)) ticked.set(`${end.col},${end.row}`, end);
  }
  // The ticked end cell the mouse is on (21-S11, 21-S13). When
  // its tick goes, so does the hover: a tick that comes back under a
  // resting mouse outlines nothing until the mouse moves onto it.
  const [hoverTick, setHoverTick] = useState<string | null>(null);
  const isHoverTickShown = hoverTick !== null && ticked.has(hoverTick);
  if (hoverTick !== null && !isHoverTickShown) setHoverTick(null);
  const lockButtonRef = useRef<HTMLButtonElement>(null);
  // Without room for the button (21-S5) it unmounts with no pointerleave,
  // so its tooltip and outline (22-S6) go with it.
  const lockTipAnchor =
    hasLockButton && lockHover && lockHover.key === lockKey && lockHover.anchor.isConnected
      ? lockHover.anchor
      : null;
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
        // An empty cell in the cursor's word other than the cursor is one
        // its letter would whiten: shown as the symmetric hint it becomes
        // (22-S5).
        isSymmetricHint:
          hints.has(key) || (highlight === 'slot' && cell.kind === 'active' && cell.letter === null && !!cursorWord?.has(key)),
        isRecommended: recommended.has(key),
        isOutsideWord: cursorWord !== undefined && !cursorWord.has(key),
        hasCursorWord: cursorWord !== undefined && cursorWord.size > 0,
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
          className={(rebus && rebus.coord.col === col && rebus.coord.row === row ? 'relative ' : '') + (isFading ? `${FADE_CELL} ` : '') + (
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
    const coord = cell.dataset.coord!;
    if (coord === hoverCoord.current) return;
    hoverCoord.current = coord;
    // A lock button with keyboard focus is never replaced by a hover.
    if (lockButtonRef.current && lockButtonRef.current === document.activeElement) return;
    const [col, row] = coord.split(',').map(Number);
    onHoverCell?.({ col, row });
  }

  // The tick hover (21-S11): the mouse anywhere on a ticked end cell
  // (21-S13). The tick itself lets the mouse through to its cell, so for
  // 21-S10 it's part of the end cell, a click on it is a click on the cell,
  // and a lock button over part of it is what's hovered there (the event's
  // target is the button, not the cell). Only the button of a word ending
  // at the hovered cell keeps its outline, moved onto from the cell or
  // come up under the mouse; any other button outlines nothing.
  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return;
    if (lockButtonRef.current?.contains(e.target as Node)) {
      const keeps =
        isHoverTickShown &&
        lockTarget !== null &&
        lockedWordsEndingAt(grid, lockedWords, ticked.get(hoverTick)!).some((word) => sameWord(word, lockTarget.word));
      if (!keeps && hoverTick !== null) setHoverTick(null);
      return;
    }
    const coord = (e.target as HTMLElement).closest<HTMLElement>('[data-coord]')?.dataset.coord;
    const next = coord && ticked.has(coord) ? coord : null;
    if (next !== hoverTick) setHoverTick(next);
  }

  function handlePointerLeave(e: PointerEvent<HTMLDivElement>) {
    setHover(null);
    setHoverTick(null);
    if (e.pointerType !== 'mouse') return;
    hoverCoord.current = null;
    onHoverCell?.(null);
  }

  // Locked words' outlines and end-cell ticks, and the lock button with its
  // word's outline (21-S2). Each is absolutely placed in its cells' grid
  // area, so it takes no cell's place.
  const outlined = [...lockedWords];
  if (lockTarget && !lockTarget.isLocked) outlined.push(lockTarget.word);
  // The hovered tick's words each get a black outline around their letters
  // (21-S15), over the gray one around the word and its end cells, and
  // under the ticks and the lock button. It follows the tick: with no tick
  // there (the words unlocked, or Preview on), none shows. The mouse on the
  // lock button outlines its word too, once (22-S6).
  const tickWords = isHoverTickShown ? lockedWordsEndingAt(grid, lockedWords, ticked.get(hoverTick)!) : [];
  if (lockTipAnchor && lockTarget && !tickWords.some((word) => sameWord(word, lockTarget.word))) {
    tickWords.push(lockTarget.word);
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
    ...tickWords.map((word) => (
      <div
        key={`tick-hover ${word.col},${word.row} ${word.orientation}`}
        data-testid="tick-hover-outline"
        aria-hidden="true"
        className="pointer-events-none absolute border-2 border-(--palette-black)"
        style={{ ...gridArea(lockedWordCells(word)), inset: 'calc(-1 * var(--grid-line-width))' }}
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
  // The button sits just before the first letter, left of an across word
  // and above a down word, its square side against the word (21-S12).
  if (lockTarget && hasLockButton) {
    const { word, isLocked } = lockTarget;
    const cells = lockedWordCells(word);
    const isAcross = word.orientation === 'across';
    overlays.push(
      <button
        key="lock-button"
        ref={lockButtonRef}
        type="button"
        tabIndex={isLockButtonTabStop ? undefined : -1}
        aria-label={isLocked ? 'Unlock word' : 'Lock word'}
        // A click leaves the keyboard focus on the grid.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggleLock}
        onFocus={() => onHoverCell?.(null)}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse' || !lockKey) return;
          setLockHover({ anchor: e.currentTarget, key: lockKey });
        }}
        onPointerLeave={() => setLockHover(null)}
        // Enter and Space are the button's, not the grid's.
        onKeyDown={(e) => e.stopPropagation()}
        className={`absolute z-10 flex items-center justify-center bg-(--palette-gray-500) text-(--palette-white) hover:bg-(--palette-gray-700) ${
          isAcross ? 'rounded-l-[4px]' : 'rounded-t-[4px]'
        }`}
        style={{
          ...gridArea([cells[0]]),
          width: `min(${LOCK_BUTTON_MAX_PX}px, calc(100% * 2 / 3))`,
          height: `min(${LOCK_BUTTON_MAX_PX}px, calc(100% * 2 / 3))`,
          ...(isAcross
            ? { right: 'calc(100% + var(--grid-line-width))', top: '50%', transform: 'translateY(-50%)' }
            : { bottom: 'calc(100% + var(--grid-line-width))', left: '50%', transform: 'translateX(-50%)' }),
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
      className={`relative grid w-full ${GRID_LINES[gridMode]}${isFading ? ` ${FADE}` : ''}`}
      onPointerOver={handlePointerOver}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
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
        {lockTarget ? lockTooltipText(grid, lockTarget.word, lockTarget.isLocked) : null}
      </Tooltip>
    </div>
  );
}
