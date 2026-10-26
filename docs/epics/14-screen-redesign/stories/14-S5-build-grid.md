# Story S5 — Build grid and hint skeleton

The build-phase grid takes its `build-cell-*` colors at a 36px maximum
cell (every grid size fits 526px), letters in `cell-letter` scale with
the cell, Preview gets its own border color and a legend, the '.' key
goes away, and a skeleton of the hints to come sits beside the grid.

**Status: approved and frozen** (2026-10-26). The human supplied a
desktop mockup (Preview off) with exact values and answered seven
questions the same day. After seeing the throwaway running, they asked
for a 40px gap between skeleton rows, `cell-warning` at `#CEB55A` and a
Preview legend (with a second mockup), placed the legend in S5, and
approved the story: its Decisions and acceptance, including the
retirements and amendments and the legend as specified here ("Yes,
approved", 2026-10-26). Frozen on `main` in a specification-only commit.

**Blast radius: medium.** Client components (`PuzzleGrid`, `LetterCell`,
`CellNumber`, `PuzzleGridEditor`, a new `HintSkeleton` and
`PreviewLegend`), `keyboard-intent.ts`, `PlayPuzzle.tsx` (one guard),
`globals.css` (one new token, one palette value) and two style-guide
components. It retires frozen tests for the '.' key and
the geometry-locked message. No server, schema or risk path, so delivery
is direct on `main` under CODE-REVIEW.

## Decisions

Inspected `PuzzleGrid`, `GridCell` and its leaves, `cell-appearance.ts`,
`PuzzleGridEditor` (the layout, the key handler, the geometry path),
`HintsPanel`, `keyboard-intent.ts`, `engine/phase.ts`, the `build-cell-*`,
`preview-cell-*` and `play-cell-*` tokens in `globals.css`, and the frozen
specs that press '.' or read the geometry-locked message.

### Build grid colors *(human)*

Preview off, build phase. Every cell is one of:

| Cell | Fill |
| --- | --- |
| Off: no letter, and not white for symmetry | `build-cell-off` |
| On: holds a letter, or is white to match its lettered symmetric counterpart | `build-cell-on` |
| The selected cell (the cursor) | `build-cell-selected-cell` |
| In the selected word's row or column, on | `build-cell-selected-row-on` |
| In the selected word's row or column, off | `build-cell-selected-row-off` |

- **Borders:** every line is `build-cell-border`, whatever the cell's
  state.
- **The selected word is today's slot highlight**: in the build phase,
  with no black cells, the cursor's whole row or column, as in the
  mockup. Selection shows only while the grid (or a hint input) has
  focus, as today.
- **Today's distinctions fold in** *(agent)*. A cell in the selected word
  that holds a letter and one that's white for symmetry both use
  `selected-row-on` (today they share `slot-content`).
- **Only the build phase changes** *(agent)*. The hints phase, EDIT GRID
  included, keeps today's fills and lines until S6; play keeps its own
  until S7.

### Preview *(human)*

- **A new token, `preview-cell-border`**, is `gray-500` (the same palette
  value as `play-cell-border`). Every grid line in Preview uses it.
- **The palette's `cell-warning` becomes `#CEB55A`** (was `#C9772E`)
  *(human, 2026-10-26, at the preview: the old color didn't look good)*.
  Only the source variable changes; `preview-cell-warning` (a cell in a
  two-letter word) still references it. The legacy `--color-recommended`,
  which the hints phase uses until S8, keeps its own `#c9772e`.
- Preview's other fills are unchanged: `preview-cell-on`, `-off` and
  `-error` (a missing symmetric letter).

### The Preview legend *(human, 2026-10-26)*

From the human's second mockup, at the preview.

- **Build phase, Preview on, only when the grid has error or warning
  cells.** None with Preview off, in the hints phase (S6 can decide), or
  in Preview with neither.
- **Two items, error first:** "Avoid breaking radial symmetry" for error
  cells (`preview-cell-error`, a missing symmetric letter) and "Avoid
  two-letter words" for warning cells (`preview-cell-warning`). Only the
  items whose cells are present show.
- **Each item:** a 24×24px circle in that cell's fill, 6px, then the text
  in `body-normal` `primary`. 20px between items.
- **16px below the grid** *(human chose 16px; the mockup measures about
  18px)*, its left edge on the grid's. Items wrap if the grid is narrower
  than the legend *(agent)*.
- **The legend decides as the grid does** *(agent)*: a cell in a
  two-letter word is a warning even if it's also a missing symmetric
  letter, so an error item shows only for a missing letter outside every
  two-letter word.
- The circles are `aria-hidden`; the text is read.

### Size *(human)*

- **A cell is at most 36×36px**, including its 1px border on each side,
  shared with its neighbor, so a 15×15 grid is at most 15 × 35 + 1 = 526px.
  The grid keeps today's hairline technique.
- **Every grid size fits the same 526×526px at most** *(human,
  2026-10-26: "squeeze all cells of a sunday grid into the 526x526";
  may be revised)*. Smaller grids get bigger cells: a Mini's are about
  105px, a Midi's about 58px, a Sunday's 25px (the 1px lines included).
- **The grid shrinks as the screen does**, as today: the viewport-height
  rule and the 45% share at the side-by-side breakpoint stay. Only the
  640px cap becomes 526px. This is the editor's grid region, so it holds
  in the hints phase too; the play grid is S7's.

### Letters and numbers *(human)*

- **Letters use the `cell-letter` style** (Inter, regular, uppercase;
  16px), with no change in font family.
- **Letters scale with the cell** *(human: "scale up the size of cells
  and letters for the smaller grids")*. `cell-letter`'s 16px is the size
  in a 35px cell (a Daily at full size); in any other cell the letter is
  16px × the cell's size ÷ 35 *(agent: one ratio for every size and every
  screen width)*. So a Mini's letters are about 48px, a Sunday's about
  11px, and they shrink with the grid on smaller screens. Epic 15 can
  revisit the mobile sizes.
- **Cell numbers use `cell-number` (10px) at every size** *(agent: the
  human asked only for cells and letters to scale; can change at the
  visual check)*.
- These apply to the shared grid component, so the hints-phase and play
  grids get them too *(agent: one grid component; S6 and S7 can
  adjust)*.

### No '.' key *(human)*

- **'.' no longer does anything** in the editor. Building has only on and
  off cells: an off cell becomes black when the builder creates hints, as
  today.
- **The geometry-locked message is removed** *(agent consequence)*. '.'
  was the only way to show "Geometry is locked in hints phase".
  `applyGeometryEdit` stays in the engine, with its tests, with no caller
  in the app *(agent: engine functions aren't removed for losing a
  caller; S8 can decide)*.
- **One black** *(human, 2026-10-26: "There are not two blacks for grid
  cells")*. A build-phase grid has only on and off cells; black appears
  only once off cells become black (Preview, the hints phase, play). There
  is no separate "explicit black" state.
- **Existing puzzles are not handled** *(human: "Don't worry about
  existing puzzles, we can delete them")*. A build-phase puzzle saved
  with '.' black cells before S5 isn't converted. No data is deleted by
  this story.

### The hint skeleton *(human)*

Beside the grid, build phase only, Preview on or off.

- **Two columns, "Across" and "Down"**, each labeled in `title-4` `muted`.
  The Down column sits 32px to the right of Across.
- **One placeholder per word, live** *(human)*. Across lists one per
  across word, Down one per down word. The words are counted the same way
  the grid numbers them: as if every off cell were black, so a white
  symmetric cell with no letter doesn't count yet *(agent)*. A new, empty
  puzzle shows only the two labels.
- **Each placeholder:** an 18×18px circle in `fill-muted`, a 12px gap,
  then a 1px `line-muted` line, 320px wide at most (shrinking with the
  space). The line sits a little below the circle's center (about 5px in
  the mockup) *(agent estimate)*.
- **Rows are 58px apart**, line to line: a 40px gap between placeholders
  *(human, 2026-10-26, at the preview: the mockup's 52px gap was too much)*.
- **Placement:** the columns' tops line up with the grid's top, the labels
  roughly level with the first row's letters. The first placeholder sits
  32px below the bottom of its label *(human: "we can tweak once I see
  how it looks")*.
- **The gap between the grid and the skeleton is 72px** *(agent's
  measurement of the mockup, accepted by the human 2026-10-26)*.
- **Narrow screens:** hidden below the side-by-side breakpoint (`lg`)
  *(human)*.
- **The skeleton is decorative:** `aria-hidden`, no focus.
- **The hints phase is unchanged.** It still shows `HintsPanel` until S6.

### Style guide *(human)*

The existing `sg-grid-build` and `sg-grid-preview` samples render the real
grid, so they show S5's colors with no change of their own. S5 adds
`sg-hint-skeleton` beside them, drawn from the same sample grid, the
legend under the Preview sample (its sample grid has error cells only),
and a `preview-cell-border` swatch to the color catalog.

### Not changed

- Typing, deleting, arrows, Space, clicking and the cursor.
- The hints-phase and play grids (S6, S7).
- Saving, Create Hints and what it does to the grid.

## Non-goals

- Hint-phase colors, Hint Input (S6), play (S7), deleting old tokens (S8).
- A mobile skeleton.
- A legend outside the build phase's Preview.
- A different number size per grid size, or a mobile minimum (epic 15).

## Pending questions

None. The last, which black grid cells use, was answered by the human
(2026-10-26): the tokens as they are (`preview-cell-off` and
`play-cell-off` stay `gray-700`). Beyond the new `preview-cell-border`,
the only color change is `cell-warning`, asked for at the preview.

## Retired and amended acceptance

Approving this story approves these, which land in the
specification-only freeze commit on `main`.

**Retired** (the '.' key and the geometry-locked message are gone):

- `e2e/phase-controls.spec.ts`, P4-2: "toggling a cell black also blackens
  its symmetric counterpart", "toggling the same cell again turns it back
  active", "geometry edits are rejected in hints phase, with a visible
  message" and "the rejection message auto-dismisses". Replaced by
  14-S5-5. The now-unused `seedFullyActive3x3` helper goes with them.
- `e2e/published-lock.spec.ts`, PB4-1: "a geometry toggle is rejected by
  the existing hints-phase path". The other read-only cases stay.
- `e2e/typography.spec.ts`, D9-3: "help text uses the help size and
  secondary ink". Its stand-in, the geometry-locked message, was the last
  help text. The unused `asRgb` helper goes with it.

**Amended:**

- `src/lib/keyboard-intent.test.ts`, P4-1: "'.' maps to a toggleBlack
  intent" becomes "'.' is unhandled" (`null`).
- `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`: the
  styles list gains `'preview-cell-border': 'gray-500'`, and the
  variables list's `cell-warning` becomes `#CEB55A`.

No other frozen test breaks: the throwaway passed the full suite (below),
including `build-grid`, `grid-rendering`, `preview`, `editor-layout`,
`style-guide` and the play specs.

## Acceptance *(frozen)*

`e2e/build-grid-design.spec.ts`, 31 cases, at 1440×1000 unless noted
(1280×720 for shrinking, 390×844 for the phone, 1280×800 for the style
guide).

- **14-S5-1 colors (1):** after clicking an off cell in the top row of a
  15×15, the selected cell, a lettered and a symmetry-white cell in the
  selected word, an off cell in it, a lettered and a symmetry-white cell
  outside it, an off cell outside it, and the lines each resolve to their
  token's hex value.
- **14-S5-2 Preview (1):** the lines are gray-500; a lettered cell, an off
  cell and a missing symmetric letter keep the preview tokens.
- **14-S5-3 size (5):** 5×5, 9×9, 15×15 and 21×21 grids are each 526px
  square, with a 1px outer line, a pitch of 525 ÷ size and cells 1px
  narrower than the pitch; a 15×15 at 1280×720 is 420px.
- **14-S5-4 letters and numbers (4):** letters at 16px (15×15), 48px (5×5)
  and 11.4px (21×21), within 0.3px, weight 400, uppercase, the body's font
  family; numbers 10px at each size; at 1280×720 the letters scale with
  the smaller grid.
- **14-S5-5 no '.' key (2):** in the build phase '.' leaves the cell
  active and selected, and its symmetric counterpart active, with no
  message; in the hints phase there's no message 500ms after '.'.
- **14-S5-6 skeleton (9):** a new puzzle shows only the labels and is
  `aria-hidden`; one placeholder per numbered word, updated as a letter
  makes new words; labels 14px, 600, `muted`; the dot 18px round
  `fill-muted`, a 12px gap, a 1px `line-muted` line 320px wide; rows 58px
  line to line, 32px below the label, columns 32px apart, 72px right of
  the grid; labels level with the grid's first row; shown in Preview; none
  in the hints phase; hidden on a phone.
- **14-S5-7 style guide (1):** the build and Preview grid samples, and the
  skeleton sample with a placeholder.
- **14-S5-8 Preview legend (8):** none with Preview off or with no error
  or warning cells; warning cells only show the warning item, error cells
  only the error item, both show error then warning, each dot in its
  cell's color; dots 24px and round, 6px to the text, 20px between items,
  16px below the grid and level with its left edge; the text 14px, 400,
  20px line height, `primary`; gone when Preview is turned off; the style
  guide's Preview sample shows the error item.

### Acceptance choices

- Colors are checked as the tokens' hex values, which `color-tokens`
  pins.
- Lengths use `toBeCloseTo(…, 0)` (±0.5px) and letter sizes ±0.3px, since
  cells divide 525px unevenly.
- The hints-phase '.' check waits 500ms, then counts once. A retrying
  absence check passed on `main` because the old message dismisses
  itself after 2s.
- Four cases are guards that `main` also passes: the 15×15 at
  1280×720, the hints-phase and phone "no skeleton" cases, and "no
  legend".

### Discrimination (2026-10-26, observed)

- **Against `main`:** 20 of the 23 cases fail; the three that pass are
  the guards above.
- **Against the throwaway** (`/tmp/crossward-drafts/14-S5-throwaway.patch`,
  reverted): all 23 pass. With it and S11's throwaway applied together,
  and the amendments above, `npm run verify` exited 0 (608 Vitest tests)
  and the full `npm run test:e2e` passed 589.
- **The throwaway's look:** a 1440×1000 screenshot of the ABRAHAM/MASK
  grid matched the human's mockup. The human then saw it running.
- **After the human's changes** (40px rows, `#CEB55A`, the legend): the
  legend's 8 cases were added; against the throwaway without the legend,
  7 failed and the "no legend" guard passed. With the legend, all 31
  passed, along with `editor-layout`, `focus-ring`, `preview`,
  `style-guide` and `color-tokens`.

## EPIC amendment *(applied at freeze)*

In S5's entry and the Decisions: the 526px cap for every size, letters in
`cell-letter` scaled with the cell, `preview-cell-border`, `cell-warning`
at `#CEB55A`, the Preview legend, and the removal of '.' and the
geometry-locked message. In the
[Design system EPIC](../../13-design-system/EPIC.md)'s palette table,
`cell-warning` becomes `CEB55A`.

## Repo paths

Runtime: `src/app/globals.css`, `src/components/grid/PuzzleGrid.tsx`,
`LetterCell.tsx`, `CellNumber.tsx`, `PuzzleGridEditor.tsx`, the new
`HintSkeleton.tsx` and `PreviewLegend.tsx`,
`src/components/play/PlayPuzzle.tsx`,
`src/lib/keyboard-intent.ts`,
`src/components/style-guide/GridExamples.tsx` and `ColorSwatches.tsx`.

Acceptance: `e2e/build-grid-design.spec.ts` (new) and the retirements
and amendments above.

## Definition of Done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  with the EPIC amendment.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes. S11's
  frozen tests fail until S11 is implemented, so S11 lands first or the
  failures are reported as S11's.
- The human's visual check passes.
