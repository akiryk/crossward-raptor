# Story S1 — The sister word

In the build phase with Preview off, the cells of the cursor's word's
180° image, its sister word, are pale blue (`interactive-faint-hover`),
whether they are gray, white with a letter or white without one. The two
faint palette colors become #F1F8FC and #E8F7FF.

**Status: Approved and frozen 2026-11-12** by the human, who also
confirmed the "selected or not" reading below.

**Blast radius: small, off the risk paths.** `src/lib/cell-appearance.ts`
(a new function), `src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/PuzzleGrid.tsx`, `src/app/globals.css`,
`src/components/style-guide/ColorSwatches.tsx`. Direct delivery to
`main`.

## The human's request

See the [EPIC](../EPIC.md#the-humans-request).

## What the code does today

- **The cursor's word** (`cursorWord`, `PuzzleGridEditor.tsx`) is
  `wouldBeWord` or, on a protected cell, `buildWord` (22-S5). It is
  undefined in Preview and the hints phase, and empty when the cursor is
  in no word.
- **Its look** (`cellAppearance`, `PuzzleGrid`'s `BUILD_BG`): the cursor
  yellow-bright, the word's other cells blue-medium, the rest of the line
  as outside the word. Elsewhere, a letter or symmetric hint is white
  (`build-cell-on`) and an off cell gray-200 (`build-cell-off`).
- **The sister** has no look of its own. Typing a letter turns its
  counterpart from gray to white (`symmetricHintKeys`), so only a sister
  cell that was off visibly changes.
- **The faint colors**: `--palette-interactive-faint` (#F5F7FA) is
  `puzzle-row` and `toggle-row`; `--palette-interactive-faint-hover`
  (#EBEFF7) is `puzzle-row-hover`.

## Decisions

From the human:

- The sister word is pale blue, `interactive-faint-hover`, whatever its
  cells are: gray, white with a letter, or white without one.
- `interactive-faint` is #F1F8FC and `interactive-faint-hover` #E8F7FF.
  The puzzle rows and the toggle row change with them.

Drafting decisions (for the human's approval with this story):

- **Which word.** The sister is the image of the cursor's word, the
  blue-medium word, including 22-S5's would-be word on an off cell. So
  while typing CAT from (0,0), with the cursor on the cell after T, the
  sister is the image of the four-cell word, the off cell it would whiten
  included. With the cursor in no word, there is no sister.
- **"Selected or not."** Sister cells are pale blue even inside the
  cursor's own line (the center row or column), where the line would
  otherwise show them as outside the word. The cursor and its word keep
  yellow-bright and blue-medium. A word crossing the center is its own
  image, so it has no sister; pale blue never replaces the word being
  typed.
- **Only the background.** `data-cell-state`, the letters and their
  colors (a locked word's gray letters included) stay as they are. That
  keeps every existing state assertion.
- **Where.** The build phase with Preview off only. In Preview, the
  hints phase and play there is no sister. Preview's 500ms fade (22-S5)
  covers the change into and out of Preview, as for every cell.
- **A new style** `build-cell-sister` references
  `interactive-faint-hover`, since components use styles, never palette
  variables (F1). The style guide lists it.
- **The function.** `sisterWord(grid, word: Coord[]): Coord[]` in
  `cell-appearance.ts`, beside `symmetricHintKeys`: each cell's
  counterpart, in the word's order, leaving out the word's own cells and
  black cells. The editor passes the result to `PuzzleGrid` beside
  `cursorWord`.

## Non-goals

- Any change to the cursor's word, Preview, the hints phase, play,
  locks or the lock button.
- Showing a sister when the cursor is in no word.
- Other palette changes.

## Acceptance (frozen)

Viewport 1440px. Colors written out. Grids are dailies (the counterpart
of (c,r) is (14−c, 14−r)).

### `src/lib/sister-word.test.ts` (new)

`sisterWord`, imported through `cell-appearance.ts`'s namespace so the
file type-checks before the function exists.

1. **25-S1-1 the image:** an across word at the top left, a down word,
   a 5×3 grid; the cells in the word's order.
2. **25-S1-2 the word's own cells:** a center-row word off center loses
   the shared center cell; a word symmetric about the center (across and
   down) has none.
3. **25-S1-3 none:** an empty word; a black counterpart left out; the
   inputs unchanged.

### `e2e/sister-word.spec.ts` (new)

Pale cells are found by reading every cell's background, so a case fails
on any extra pale cell too.

4. **25-S1-4 typing:** CAT typed from (0,0) across: (11–14,14) pale
   blue, three symmetric hints and an off cell, their states unchanged;
   (10,14) gray; the cursor yellow and CAT blue-medium. After C alone,
   (13,14) and (14,14).
5. **25-S1-5 an existing word:** with CAT and DOGS (11–14,14), the cursor
   in CAT: DOGS pale, still `letter` with its letters. In DOGS: C, A, T
   and (3,0) pale; DOGS blue-medium. SIR down: (5,9–11).
6. **25-S1-6 the cursor's line:** A, T at (2,7), (3,7): (11,7), (12,7)
   pale, in the line (`data-highlight="slot"`), still `symmetric-hint`;
   the row's off cells gray.
7. **25-S1-7 none:** a word symmetric about the center *(passes today)*;
   the cursor moved into no word (DOGS back to white); Preview (no pale
   cell, (14,14) Preview's red).

### Amended acceptance

The human's request covers these frozen tests. Each keeps its intent; only
the expected colors the request changes, and the two lists of every style,
change. Each change carries a note citing 25-S1.

- **The palette.** `src/app/globals-css.test.ts` and
  `e2e/color-tokens.spec.ts` (F1): `interactive-faint` #F1F8FC and
  `interactive-faint-hover` #E8F7FF, and the new style `build-cell-sister`
  → `interactive-faint-hover`. `e2e/status-icons.spec.ts` (18-S3): `ROW`
  #F1F8FC and `ROW_HOVER` #E8F7FF. `e2e/build-progress-look.spec.ts`
  (22-S2): `INTERACTIVE_FAINT` #f1f8fc. Its check allows a distance of
  40, so it passes with either color, and the value changes for accuracy.
- **A sister cell that was white.**
  - `e2e/build-grid-design.spec.ts` 14-S5-1: the cursor in ABC, so
    (14,14) is in its sister. It is now pale blue ("in the sister word").
    The original check, a symmetry-white cell outside the highlight, moves
    to (14,13), D's counterpart, which stays white.
  - `e2e/preview-fade.spec.ts` 22-S5-10 and 22-S5-11: the cursor opens on
    CAT, so the hint (14,14) is in its sister. The fade runs between pale
    blue and red, not white and red. 22-S5-10 passed with either, within
    its tolerance; it changes for accuracy.
  - 22-S5-15: typing Q at (10,10) puts its counterpart (4,4) in the
    sister of the cursor's new word, so it ends pale blue, not white.
    Still at once.
  - The file's `WHITE` constant is then unused and goes.

### Discrimination

2026-11-12, on `main` at 28e7070, under the standing E2E reset grant.

**Without the runtime:** `npm run test:e2e -- e2e/sister-word.spec.ts
e2e/color-tokens.spec.ts e2e/status-icons.spec.ts
e2e/build-progress-look.spec.ts`: 15 failed, 20 passed.

- Fail, as intended:
  - every sister case except the one below, each at its first pale-cell
    check (no pale cell);
  - F1-1, F1-2 ×2 and F1-4 ×2 (the old hexes, the missing style);
  - 18-S3-2 and 18-S3-5 (the old row colors).
- Pass, as intended: 25-S1-7's symmetric word, and the rest of those
  files.
- `npx vitest run src/lib/sister-word.test.ts`: 8 failed
  ("cell-appearance.ts exports no sisterWord").

**With a throwaway prototype** of the decisions above (now set aside in a
stash until the freeze):

- `npm run verify` exited 0: 969 tests.
- The full `npm run test:e2e`, before the amendments to 14-S5-1 and
  22-S5: 6 failed, 1347 passed.
  - Three expected a sister cell to be white: 14-S5-1, 22-S5-11 and
    22-S5-15. They are amended above.
  - Three hit `ECONNRESET` in the session helper: two P5 cases in
    `library-play.spec.ts` and O1 in `ownership.spec.ts`. These are
    infrastructure, not this change.
- After the amendments: `npm run test:e2e -- e2e/build-grid-design.spec.ts
  e2e/preview-fade.spec.ts e2e/library-play.spec.ts e2e/ownership.spec.ts
  e2e/sister-word.spec.ts`: 67 passed, exit 0.
- `npx tsc --noEmit` and `npx eslint` on the changed test files: clean.

## Repo paths

Acceptance: `src/lib/sister-word.test.ts`, `e2e/sister-word.spec.ts`
(new); amended `src/app/globals-css.test.ts`, `e2e/color-tokens.spec.ts`,
`e2e/status-icons.spec.ts`, `e2e/build-progress-look.spec.ts`,
`e2e/build-grid-design.spec.ts`, `e2e/preview-fade.spec.ts`. Runtime:
`src/lib/cell-appearance.ts`, `src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/PuzzleGrid.tsx`, `src/app/globals.css`,
`src/components/style-guide/ColorSwatches.tsx`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`, `../../README.md`.

**CODE-REVIEW:** none of these is a risk path, so direct delivery to
`main`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
- The human's visual check.
