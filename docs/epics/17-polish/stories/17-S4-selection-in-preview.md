# Story S4 — Selection in Preview

In Preview, clicking a cell Preview shows as white, error or warning
selects it, and its Preview word in the cursor's direction is
highlighted: the cursor cell `build-cell-selected-cell`, the rest of the
word `build-cell-selected-row-on`. Preview-black cells can't be selected,
and the cursor's typing, arrows and Backspace stay within Preview's
words. The style guide gains a sample of a selected Preview word.

**Status: done** (2026-11-01). The human approved this specification,
its acceptance, the `grid-focus` amendment and every *proposed* item
below as written. Frozen on `main` in fd7fca9 (specification only);
implemented and delivered directly on `main`.

**Blast radius: small.** The editor's Preview cursor and highlight in
`PuzzleGridEditor`, Preview's highlight colors in `PuzzleGrid` and one
style-guide sample. No schema, server action, storage or engine change,
so no CODE-REVIEW risk path: direct delivery on `main`.

## What the code does today

Inspected `PuzzleGridEditor.tsx` (`handleGridKeyDown`, `handleCellClick`,
the highlight map, the Preview toggle and 2 Create Hints), `PuzzleGrid.tsx`,
`src/lib/cell-appearance.ts`, `src/engine/cursor.ts`,
`src/engine/puzzle-geometry.ts`, `src/engine/slots.ts`,
`src/lib/hint-lookup.ts`, `GridExamples.tsx`, and every frozen browser
test that turns Preview on.

- Preview exists only in the build phase. Turning it on (the toggle, or
  2 Create Hints, 14-S10) changes how cells look; it isn't saved.
- Preview's cells come from `intendedGeometry`: an empty cell is black
  unless its symmetric counterpart has a letter (`required`, the error
  color); a cell in a two-letter word is `recommended` (the warning
  color), lettered or not. In the build phase every cell is active.
- The cursor moves over every active cell by the engine's `moveTo`,
  `arrowKey`, `place` and `deleteAt` on the real grid, Preview or not.
  The highlight map is the cursor cell plus its slot in the real grid,
  set while the editor has focus, so `data-selected` and
  `data-highlight` are already present in Preview, but `cellAppearance`
  ignores them there (05-D4) and the cells keep Preview's colors. Typing
  in Preview places letters, invisibly, and advances into cells Preview
  shows black.
- The build phase loads with the cursor on (0,0), Across, and the grid
  focused. Clicking the Preview toggle moves focus to it.

## Decisions

### What's selectable *(human, 2026-10-28)*

- A **Preview word** is a run of two or more cells Preview doesn't show
  black, across or down: a slot of `intendedGeometry(grid)`. Error,
  warning and lettered cells belong to words alike.
- Clicking a cell Preview shows as white, error or warning moves the
  cursor there, keeping its direction; clicking the cursor cell again
  toggles the direction *(EPIC proposed, settled here)*, as in the build
  phase.
- Clicking a **Preview-black** cell does nothing: the cursor and its
  direction stay *(EPIC proposed, settled here)*.

### The highlight *(human, 2026-10-28)*

- While the grid has focus, the cursor cell is `build-cell-selected-cell`
  and the other cells of its Preview word in the cursor's direction are
  `build-cell-selected-row-on`. Where no Preview word runs that way, only
  the cursor cell is highlighted, as in the build phase.
- Nothing in Preview is `build-cell-selected-row-off`. Every other cell
  keeps Preview's color. Preview's black cells stay black.
- *Proposed:* each cell's `data-cell-state` stays Preview's own
  (`required`, `recommended`, `letter`, `black`), and the selection is
  shown by `data-selected` and `data-highlight` and painted over it, as
  the hints phase and play already do. So `cellAppearance` keeps
  answering "what will this look like published", and 05-D4's unit tests
  ("selection is ignored", "slot membership is ignored") still hold and
  stay. The EPIC expected S4 to supersede them; at freeze, its S4 and
  Decisions lines are amended to say they stay.
- No color changes here. S5 turns `build-cell-selected-row-on` blue, and
  this highlight follows it.

### Moving within Preview's words *(EPIC proposed, settled here)*

The engine's own cursor functions, over `intendedGeometry`, with letters
placed in the real grid:

- **Typing** places the letter and advances to the next cell in the
  cursor's direction only if Preview shows it after the letter is placed;
  at a word's end the cursor stays.
- **Arrows** don't move onto a Preview-black cell or off the grid; the
  cursor stays. A cross-axis arrow turns the direction without moving, as
  in the build phase. *(The EPIC's "skip" is settled as "stop at", the
  engine's `arrowKey` rule; nothing jumps over black cells.)*
- **Backspace** *(proposed; not in the EPIC)* clears the cursor cell's
  letter, or, on an empty cell, steps back one cell within the Preview
  word and clears it; at a word's start it does nothing.
- **Space** toggles the direction, as in the build phase.

### Cells that turn black *(EPIC proposed, settled here)*

- Emptying a cell can make Preview show it (and its counterpart) black.
  The cursor stays on it, still `build-cell-selected-cell`, with no word
  highlighted, until the cursor leaves it; typing there brings it back.
  Once left, it can't be clicked.
- **Preview turned on while the cursor is on a Preview-black cell**
  (the toggle, or 2 Create Hints) selects nothing. *Proposed:* while
  nothing is selected, keys do nothing; a click on a selectable cell
  selects it. Turning Preview off shows the build cursor where it was.

### No other change

- The build phase with Preview off, the hints phase and play are
  unchanged.
- No engine change: Preview's cursor calls `moveTo`, `arrowKey`, `place`,
  `deleteAt` and `toggleOrientation` on `intendedGeometry(grid)` and
  `buildSlotLookup`/`activeHintKey` for the word, in the editor.
- The style guide gains `sg-grid-preview-selected`: the story's 5×5 with
  the cursor on 1 Across, mixing an error, a letter and a warning.

## Acceptance

*Approved and frozen 2026-11-01.* One new file and one amended file.

### e2e/preview-selection.spec.ts

A 5×5 build-phase grid with no black cells: B (1,0), C (2,0), D (2,1),
E (4,4). In Preview: 1 Across is (0,0) error, (1,0) letter, (2,0)
warning (the human's A, B and C); (2,0)–(2,1) is a two-letter Down
word; the bottom row's word is (2,4) warning, (3,4) error, (4,4)
letter; everything else is black. Colors are read from the styles
(`--color-<style>`), so S5's new values need no amendment here.

1. **17-S4-1** clicking each of 1 Across's three cells selects it and
   highlights the other two; their `data-cell-state` stays `required`,
   `letter`, `recommended`; the rest keep Preview's colors; no cell is
   row-off.
2. **17-S4-2** clicking the cursor cell (2,0) again selects its Down word,
   and again Across; at (3,4), Down has no word, so only the cell is
   selected.
3. **17-S4-3** clicking a Preview-black cell changes nothing, and typing
   still goes to the cursor.
4. **17-S4-4** typing advances only within the Preview word, Across and
   Down, and stops at its last cell; with Preview off it advances over
   the same cells as before *(guard; passes today)*.
5. **17-S4-5** arrows stop at a word's end and at the grid's edge; a
   cross-axis arrow turns the direction.
6. **17-S4-6** Backspace on an empty cell at a word's start doesn't step
   back onto a Preview-black cell; a cell emptied so that Preview shows
   it black stays selected, typing brings its word back, and once the
   cursor leaves it, it's black and unclickable.
7. **17-S4-7** Preview turned on with the cursor on a Preview-black cell:
   with the grid focused nothing is selected, and letters, arrows, Space
   and Backspace do nothing, until a click selects a cell; turning
   Preview off shows the build cursor where it was *(guard; passes
   today)*.
8. **17-S4-8** focus elsewhere (the title) shows Preview's colors; focus
   back on the grid shows the word again.
9. **17-S4-9** the style guide's `sg-grid-preview-selected`: one cursor
   cell and a word whose cells are `required`, `recommended` and
   `letter`, in the selection colors; unselected black, warning and
   error cells in Preview's.

### Amended acceptance

Amended in the specification-only freeze commit. Every other frozen test
is unchanged.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/grid-focus.spec.ts` | "clicking a cell after a button click refocuses the grid" | clicks the Preview toggle (Preview on), then clicks (0,0) of an empty 3×3 and expects it selected | clicks the toggle again (Preview off, nothing selected, a button focused) before clicking (0,0). An empty grid is all black in Preview, and S4 makes those cells unselectable. |

### Acceptance choices *(drafting)*

- One small fixture holds every case: the human's error, letter and
  warning word, a two-letter Down word through it, cells with no word one
  way, and build-active cells Preview shows black beside each word.
- Order matters where the cursor starts: the build phase opens on (0,0),
  Across, so 17-S4-1 clicks (1,0) first (clicking (0,0) first would
  toggle).
- `data-cell-state` is asserted to stay Preview's own, making the
  "painted over" choice above part of acceptance.
- Not covered: 2 Create Hints turning Preview on (its frozen 14-S10 tests
  stay; the same rule applies as the toggle), narrow widths (the same
  component), and the hints phase and play (unchanged; their frozen tests
  stay).

### Discrimination (2026-11-01, observed)

- **Throwaway implementation** of the Decisions, then reverted (patch kept
  outside the repo, `/tmp/s4/throwaway.patch`). With it:
  `preview-selection` 15 of 15 (including the setup project);
  `npm run verify` exit 0 (Vitest 620 of 620). The full
  `npm run test:e2e` showed one conflicting frozen case, the
  `grid-focus` case above; with its amendment, 825 passed and 5 failed,
  all in `new-puzzle`, `new-puzzle-dialog` and `no-play-reset` from the
  machine's network suspending mid-run (`ERR_NETWORK_IO_SUSPENDED`);
  those three specs and `grid-focus` then passed 40 of 40. (An earlier
  run without the harness's preparation also failed `duplicate` cases,
  which passed 6 of 6 once prepared.)
- **Current `main` with the proposed tests:** `preview-selection` 12
  failed, 3 passed (the setup project and the two guards); the amended
  `grid-focus` passes 3 of 3, as it does on the throwaway.
- **Three mutations on the throwaway,** each caught: the word painted
  row-off (12 failed), typing advancing over the real grid (2 failed,
  the typing cases), no hidden cursor when Preview turns on (1 failed,
  17-S4-7).
- `tsc` and ESLint pass on the proposed tests.

## Repo paths

Acceptance (immutable after freeze): `e2e/preview-selection.spec.ts` and
`e2e/grid-focus.spec.ts`.

Runtime:

- `src/components/grid/PuzzleGridEditor.tsx`: Preview's cursor over
  `intendedGeometry`, its highlight and the hidden cursor on turning
  Preview on.
- `src/components/grid/PuzzleGrid.tsx`: Preview's highlight colors.
- `src/lib/cell-appearance.ts`: its comment only, if the 05-D4 wording
  needs to say the selection is painted over the appearance.
- `src/components/style-guide/GridExamples.tsx`: the
  `sg-grid-preview-selected` sample.
- This story, `../EPIC.md` (the 05-D4 line, at freeze) and
  `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S4. Out of scope: the selection colors' values (S5), the word rule
in the hints phase and play (S6), Preview Hints (S9) and rebus entry in
Preview (S10).

## Definition of done

- The human approves this specification, its acceptance and the
  amendment, recorded here and in the handoff. Freeze on `main` in a
  specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Verification (2026-11-01, observed)

On the implementation (precommit tree, committed unchanged), frozen
acceptance unchanged from fd7fca9: `npm run verify` exit 0 (Vitest
620/620) and full `npm run test:e2e` exit 0 (830 passed), under the
guarded harness's standing reset grant.

## Pending questions

None. The human approved the *proposed* items above (data-cell-state
staying Preview's, Backspace within the word, keys doing nothing while
nothing is selected, "stop at" for arrows) with the draft, 2026-11-01.
