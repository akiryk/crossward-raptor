import { createGrid, withLetter } from '../../engine/grid';
import type { CursorState } from '../../engine/cursor';
import { buildSlotLookup, activeHintKey } from '../../lib/hint-lookup';
import { cellNumberKey } from '../../lib/cell-number-lookup';
import { PuzzleGrid } from '../grid/PuzzleGrid';

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

function buildSampleGrid() {
  let grid = createGrid({ cols: 10, rows: 10 });
  for (const { col, row, letter } of LETTERS) {
    grid = withLetter(grid, { col, row }, letter);
  }
  return grid;
}

export function GridExamples() {
  const grid = buildSampleGrid();
  const slotLookup = buildSlotLookup(grid);
  const activeKey = activeHintKey(slotLookup, CURSOR);

  const highlights = new Map<string, 'selected' | 'slot'>();
  if (activeKey) {
    const activeSlot = slotLookup.get(activeKey)!;
    for (const cell of activeSlot.cells) {
      highlights.set(cellNumberKey(cell), 'slot');
    }
  }
  highlights.set(cellNumberKey(CURSOR.current), 'selected');

  return (
    <>
      <section data-testid="sg-grid-build">
        <h2 className="mb-2 font-display text-headline [font-weight:var(--weight-bold)]">
          Grid (build phase)
        </h2>
        <div className="max-w-sm">
          <PuzzleGrid grid={grid} highlights={highlights} />
        </div>
      </section>

      <section data-testid="sg-grid-preview">
        <h2 className="mb-2 font-display text-headline [font-weight:var(--weight-bold)]">
          Grid (hints-transition preview)
        </h2>
        <div className="max-w-sm">
          <PuzzleGrid grid={grid} mode="preview" />
        </div>
      </section>
    </>
  );
}
