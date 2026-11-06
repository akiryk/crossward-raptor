# Story S1 — The word highlight

In the build phase with Preview off, only the word the cursor is in is
blue-medium; every other cell of its row or column is dull blue.

**Status: done 2026-11-06.** Approved and frozen at 69407b0 (the human
approved the EPIC and this acceptance, choosing dull blue for symmetric
hints); implemented and delivered on `main`.

**Blast radius: small, expected off the risk paths.** `src/lib/` and
`src/components/grid/`; no engine, server action or storage change.
Direct delivery to `main` if that holds (CODE-REVIEW).

## What the code does today

The highlight covers the cursor's whole row or column, its slot, from
edge to edge, since the build phase has no black cells.
`cellAppearance` (`src/lib/cell-appearance.ts`) makes a lettered cell in
that slot `slot-letter` (blue-medium) and an empty one `slot` (dull blue).
With the cursor in ORATION going down, DORY and V above and below it are
blue-medium as well. With the cursor on an empty cell, every lettered
cell in its column is blue-medium.

## Decisions

From the human (2026-11-06, EPIC):

- **The cursor's word** is the unbroken run of lettered cells through the
  cursor's cell in its direction, ended by an empty cell or the grid's
  edge. Its cells are blue-medium.
- **Every other cell** of the row or column is dull blue, whether or not
  it holds a letter. The cursor's cell stays yellow.
- **With the cursor on an empty cell, or on a lone letter** (a run of 1),
  there's no word. The column shows only yellow and dull blue.
- **2 letters** make a word for the highlight.
- **Symmetric hints** in the row or column are dull blue too (the human,
  2026-11-06, at approval): an empty cell is never in a word.

Delegated details:

- **The run** is computed by a pure helper,
  `buildWord(grid, coord, orientation)` in `src/lib/build-word.ts`: the
  run's cells in reading order, or `null` for an empty cell or a lone
  letter. S2 and S3 reuse it for lockable words and end cells.
- **Cell states:** a word cell is `slot-letter` (blue-medium) as today;
  every other cell of the line, lettered, empty or a symmetric hint, is
  `slot` (dull blue).
  `data-highlight="slot"` still marks the whole row or column.
- **The style guide's build sample** puts its cursor in the STRP run
  (3,1) instead of on an empty cell, so it still shows a `slot-letter`
  cell (its D8-3 case is unchanged).
- **Preview, the hints phase and play** are untouched. Their slots are
  already bounded by black cells.

## Non-goals

- Changing any highlight colour, or the highlight outside the build phase
  with Preview off.
- Anything to do with locking (S2+).

## Acceptance (frozen 2026-11-06)

### Unit: `src/lib/build-word.test.ts` (new)

1. **21-S1-1 the run:** across and down, from any cell of the run; a run
   ended by empty cells, by one edge, by both edges; a 2-letter run is a
   word; a lone letter, an empty cell (even between letters) and an empty
   grid give `null`.

### `e2e/word-highlight.spec.ts` (new)

2. **21-S1-2 across:** a Sunday's top row `NOSYPARKER`, an empty cell,
   `ASNOT`, empty cells to the edge; cursor on N: NOSYPARKER blue-medium;
   ASNOT, the empty cells and the symmetric hint (18,0) dull blue.
   (ASNOT is added to the draft's row: without a second word the case
   already passes on `main`.)
3. **21-S1-3 another word in the line:** a daily's column 2: `DORY`,
   empty, `ORATION`, empty, empty, `V`; cursor in ORATION going down:
   ORATION blue-medium; DORY, V and the empty cells dull blue.
4. **21-S1-4 cursor on a lone letter or an empty cell:** the same column,
   cursor on V, then on (2,4): every cell of the column dull blue, no
   `slot-letter` cell anywhere.
5. **21-S1-5 Preview unchanged:** with Preview on, the cursor in ORATION:
   ORATION is the blue-medium highlight; DORY and V are unhighlighted
   `letter` cells. A guard: it passes on `main`.

### Amended acceptance

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `build-grid-design.spec.ts` (14-S5) | 14-S5-1 | cursor on the empty (3,0) after ABC; (1,0) and the symmetric hint (9,0) blue-medium "in the selected word" | cursor on C (2,0), in ABC; (1,0) blue-medium in its word; (9,0) dull blue, outside it; (4,0) labelled "in the selected row" |
| `selection-colors.spec.ts` (17-S5) | 17-S5-1 | the same, (3,0) | the same, (2,0) |

With the cursor on an empty cell there's no word, so under S1 (1,0)
would be dull blue; moving the cursor into ABC keeps it blue-medium. The
symmetric hint becomes dull blue, the human's choice.

### Discrimination (2026-11-06, observed)

- On `main`: 21-S1-1 fails (no `./build-word` module); 21-S1-2, -3 and
  -4 fail on a cell outside the word that is still `slot-letter` (21-S1-2 at
  ASNOT's (11,0)); 21-S1-5 passes, as a guard should.
- Against a throwaway implementation (reverted, not committed): 21-S1-1's
  8 tests pass, and the full `npm run test:e2e` gave 1048 passed and 1
  failed, the failure being 18-S5-5's recorded intermittent
  (`done-icon.spec.ts`, epic 18's open item), unrelated to the highlight.
  No other existing case needed amending.
- That run kept symmetric hints blue-medium, the draft's proposal. The
  human chose dull blue at approval; 21-S1-2's symmetric hint and the two
  amended (9,0) rows were then changed to match, before freeze.

### Implementation results (2026-11-06, observed)

- Frozen acceptance unchanged since 69407b0 (`git diff` empty).
- `npm run verify` exit 0 (664 unit tests).
- Full `npm run test:e2e`: the first run 1048 passed, 1 failed on
  18-S5-5's recorded intermittent; the rerun 1049 passed, exit 0.
- Actual changed paths: the declared runtime paths only, none on a
  CODE-REVIEW risk path; delivered directly to `main`.

## Repo paths

Acceptance: the two new files above and the two amended specs.
Runtime: `src/lib/cell-appearance.ts`, a new `src/lib/build-word.ts`,
`src/components/grid/PuzzleGridEditor.tsx`, `PuzzleGrid.tsx` and
`src/components/style-guide/GridExamples.tsx`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
