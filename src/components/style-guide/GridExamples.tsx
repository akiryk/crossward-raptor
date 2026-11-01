import { useState } from 'react';
import { createGrid, withLetter } from '../../engine/grid';
import type { CursorState } from '../../engine/cursor';
import { convertEmptyCellsToBlack } from '../../engine/phase';
import { intendedGeometry } from '../../engine/puzzle-geometry';
import { buildSlotLookup, activeHintKey } from '../../lib/hint-lookup';
import { cellNumberKey } from '../../lib/cell-number-lookup';
import { PuzzleGrid } from '../grid/PuzzleGrid';
import { HintSkeleton } from '../grid/HintSkeleton';
import { PreviewLegend } from '../grid/PreviewLegend';
import { HintsPanel } from '../grid/HintsPanel';
import { HintBox } from '../grid/HintBox';
import { adjacentHintKey } from '../../lib/hint-order';
import { slotsWithNumbers } from '../../engine/numbering';
import { PlayerHints } from '../play/PlayerHints';
import { ProminentHint } from '../play/ProminentHint';

// A 10x10 with two crossing words (row 2 across, col 3 down, sharing (3,2)).
// The cursor sits mid-run in the down slot so that slot spans both lettered
// cells (rows 0-3) and empty ones (rows 4,6-9) -- the D8 fixture requires
// both in the one highlighted slot. Everything off column 3 stays empty,
// giving plain 'empty' cells outside the slot; the down/across letters'
// 180-degree counterparts (none of which are lettered) render as
// 'symmetric-hint'.
const LETTERS: { col: number; row: number; letter: string }[] = [
  { col: 2, row: 2, letter: 'G' },
  { col: 3, row: 2, letter: 'R' },
  { col: 4, row: 2, letter: 'I' },
  { col: 5, row: 2, letter: 'D' },
  { col: 3, row: 0, letter: 'S' },
  { col: 3, row: 1, letter: 'T' },
  { col: 3, row: 3, letter: 'P' },
];

const CURSOR: CursorState = { current: { col: 3, row: 5 }, orientation: 'down' };

// The build sample's cursor (3,5) is empty, so after conversion it's black
// and produces no highlight at all -- the focused-grid sample needs its own
// cursor, inside the four-cell down slot conversion leaves at column 3
// (rows 0-3; row 4 onward is unfilled and becomes black), so the sample
// shows the cursor, its word, other on cells and off cells together.
const GRID_FOCUS_CURSOR: CursorState = { current: { col: 3, row: 1 }, orientation: 'down' };

// The locked sample shows the word of a focused hint input: GRID, across
// row 2 (14-S6).
const LOCKED_HINT_CURSOR: CursorState = { current: { col: 2, row: 2 }, orientation: 'across' };

// The selected Preview word (17-S4): 1 Across of a 5×5 mixes an error
// (0,0), a letter (1,0) and a warning (2,0), part of a two-letter Down word.
function previewSelectionGrid() {
  let grid = createGrid({ cols: 5, rows: 5 });
  grid = withLetter(grid, { col: 1, row: 0 }, 'B');
  grid = withLetter(grid, { col: 2, row: 0 }, 'C');
  grid = withLetter(grid, { col: 2, row: 1 }, 'D');
  grid = withLetter(grid, { col: 4, row: 4 }, 'E');
  return grid;
}
const PREVIEW_SELECTION_CURSOR: CursorState = { current: { col: 1, row: 0 }, orientation: 'across' };

function buildSampleGrid() {
  let grid = createGrid({ cols: 10, rows: 10 });
  for (const { col, row, letter } of LETTERS) {
    grid = withLetter(grid, { col, row }, letter);
  }
  return grid;
}

function highlightsFor(grid: ReturnType<typeof buildSampleGrid>, cursor: CursorState) {
  const slotLookup = buildSlotLookup(grid);
  const activeKey = activeHintKey(slotLookup, cursor);

  const highlights = new Map<string, 'selected' | 'slot'>();
  if (activeKey) {
    const activeSlot = slotLookup.get(activeKey)!;
    for (const cell of activeSlot.cells) {
      highlights.set(cellNumberKey(cell), 'slot');
    }
  }
  highlights.set(cellNumberKey(cursor.current), 'selected');
  return highlights;
}

export function GridExamples() {
  const grid = buildSampleGrid();
  const highlights = highlightsFor(grid, CURSOR);

  // The hints-phase samples show a converted grid (Decisions): a real
  // hints-phase puzzle has no empty cells, and showing one would document
  // a state that cannot occur.
  const hintsGrid = convertEmptyCellsToBlack(grid);
  const gridFocusHighlights = highlightsFor(hintsGrid, GRID_FOCUS_CURSOR);
  const lockedHighlights = highlightsFor(hintsGrid, LOCKED_HINT_CURSOR);
  // The play sample: the converted grid as a player sees it, with the
  // cursor in STOP, down (14-S7).
  const playHighlights = highlightsFor(hintsGrid, GRID_FOCUS_CURSOR);
  const playSlots = slotsWithNumbers(hintsGrid);
  const playKey = activeHintKey(buildSlotLookup(hintsGrid), GRID_FOCUS_CURSOR);
  const playSlot = playSlots.find((slot) => `${slot.number}-${slot.orientation}` === playKey)!;
  const playHints = Object.fromEntries(
    playSlots.map((slot) => [`${slot.number}-${slot.orientation}`, `Sample hint for ${slot.number} ${slot.orientation}`])
  );

  return (
    <>
      <section data-testid="sg-grid-build">
        <h2 className="mb-2 text-title-2 text-primary">
          Grid (build phase)
        </h2>
        <div className="max-w-sm">
          <PuzzleGrid grid={grid} highlights={highlights} />
        </div>
      </section>

      <section data-testid="sg-grid-preview">
        <h2 className="mb-2 text-title-2 text-primary">
          Grid (hints-transition preview)
        </h2>
        <div className="max-w-sm">
          <PuzzleGrid grid={grid} mode="preview" />
          <PreviewLegend grid={grid} />
        </div>
      </section>

      <section data-testid="sg-grid-preview-selected">
        <h2 className="mb-2 text-title-2 text-primary">
          Grid (Preview, a word selected)
        </h2>
        <div className="max-w-sm">
          <PuzzleGrid
            grid={previewSelectionGrid()}
            mode="preview"
            highlights={highlightsFor(intendedGeometry(previewSelectionGrid()), PREVIEW_SELECTION_CURSOR)}
          />
        </div>
      </section>

      <section data-testid="sg-hint-skeleton">
        <h2 className="mb-2 text-title-2 text-primary">
          Hint skeleton (build phase, wide screens)
        </h2>
        <div className="flex max-w-[732px]">
          <HintSkeleton grid={grid} />
        </div>
      </section>

      <section data-testid="sg-grid-hints">
        <h2 className="mb-2 text-title-2 text-primary">
          Grid (hints phase, a hint focused)
        </h2>
        <div className="max-w-sm">
          <PuzzleGrid grid={hintsGrid} highlights={lockedHighlights} isHintsPhase />
        </div>
      </section>

      <section data-testid="sg-grid-hints-locked">
        <h2 className="mb-2 text-title-2 text-primary">
          Grid (hints phase, letters locked, a hint focused)
        </h2>
        <div className="max-w-sm">
          <PuzzleGrid grid={hintsGrid} highlights={lockedHighlights} isHintsPhase isLettersLocked />
        </div>
      </section>

      <section data-testid="sg-grid-hints-selected">
        <h2 className="mb-2 text-title-2 text-primary">
          Grid (hints phase, grid focused)
        </h2>
        <div className="max-w-sm">
          <PuzzleGrid
            grid={hintsGrid}
            highlights={gridFocusHighlights}
            isHintsPhase
            isGridFocused
          />
        </div>
      </section>

      <section data-testid="sg-grid-play">
        <h2 className="mb-2 text-title-2 text-primary">
          Play: Prominent Hint, grid and Player Hints
        </h2>
        <div className="flex flex-wrap items-start gap-x-[26px] gap-y-4">
          <div className="w-full max-w-sm space-y-4">
            <ProminentHint label={`${playSlot.number}D`} hint={playHints[playKey!]} />
            <PuzzleGrid grid={hintsGrid} mode="play" highlights={playHighlights} />
          </div>
          <div className="min-w-0 flex-1">
            <PlayerHints slots={playSlots} hints={playHints} selectedKey={playKey} />
          </div>
        </div>
      </section>
    </>
  );
}

/** Hint Inputs for the converted sample grid, one hint written (14-S6). */
export function HintInputExample() {
  const hintsGrid = convertEmptyCellsToBlack(buildSampleGrid());
  const slots = buildSlotLookup(hintsGrid);
  const [hints, setHints] = useState<Record<string, string>>({ '2-across': 'Network of squares' });

  return (
    <div className="max-w-[732px]">
      <HintsPanel
        grid={hintsGrid}
        slots={slots}
        hints={hints}
        activeKey={null}
        onHintChange={(key, text) => setHints((prev) => ({ ...prev, [key]: text }))}
        onHintFocus={() => {}}
      />
    </div>
  );
}

/** The sample's Hint Inputs after 3 Publish found 1 Down blank: its row
 *  marked, 2 Across written and unmarked (17-S1). Typing clears the mark. */
export function MissingHintExample() {
  const hintsGrid = convertEmptyCellsToBlack(buildSampleGrid());
  const slots = buildSlotLookup(hintsGrid);
  const [hints, setHints] = useState<Record<string, string>>({ '2-across': 'Network of squares' });
  const [missingKeys, setMissingKeys] = useState<ReadonlySet<string>>(() => new Set(['1-down']));

  return (
    <div className="max-w-[732px]">
      <HintsPanel
        grid={hintsGrid}
        slots={slots}
        hints={hints}
        activeKey={null}
        missingKeys={missingKeys}
        onHintChange={(key, text) => {
          setHints((prev) => ({ ...prev, [key]: text }));
          setMissingKeys((prev) => new Set([...prev].filter((k) => k !== key)));
        }}
        onHintFocus={() => {}}
      />
    </div>
  );
}

/** The Hint Box on the sample's 2 Across, its arrows stepping through the
 *  sample's words (15-S4). */
export function HintBoxExample() {
  const hintsGrid = convertEmptyCellsToBlack(buildSampleGrid());
  const slots = buildSlotLookup(hintsGrid);
  const [key, setKey] = useState('2-across');
  const [hints, setHints] = useState<Record<string, string>>({ '2-across': 'Network of squares' });
  const slot = slots.get(key);
  if (!slot) return null;

  return (
    <div className="max-w-[560px]">
      <HintBox
        grid={hintsGrid}
        slot={slot}
        hint={hints[key] ?? ''}
        onHintChange={(text) => setHints((prev) => ({ ...prev, [key]: text }))}
        onHintFocus={() => {}}
        onStep={(step) => setKey((prev) => adjacentHintKey(slots, prev, step) ?? prev)}
      />
    </div>
  );
}
