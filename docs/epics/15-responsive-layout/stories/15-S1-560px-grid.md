# Story S1 — 560px grid

The builder's and play's grids fit 560px at most at every size, up from
526px, so a Sunday's cells are large enough. Neither grid shrinks with the
window's height any more: a short window scrolls the page instead. The
default test viewport moves to 1440×900.

**Status: done** (2026-10-28): the human's visual check passed the same
day *(human)*. Frozen in `fef423e`; the human approved the draft, the 900px viewport
height and the lists at the grid's height on 2026-10-28.

**Blast radius: small.** Client components `PuzzleGridEditor` and
`PlayPuzzle`, a comment in `PuzzleGrid`, and the Playwright config. No
server, schema, engine, token or risk path, so delivery is direct on
`main` under CODE-REVIEW. Four frozen specs are amended.

## Decisions

Inspected `PuzzleGridEditor`, `PlayPuzzle`, `PuzzleGrid`, the style
guide's `GridExamples`, `playwright.config.ts`, and every frozen spec that
measures a grid or sets a viewport (`build-grid-design`, `play-design`,
`editor-layout`, `builder-controls`, `hint-phase-design` and others). The
frozen tests this story breaks were found by running the full suite
against a throwaway (see Discrimination).

### Size *(human, the epic's Decision)*

- **Every grid size fits 560×560px at most**, in the builder (both
  phases and Preview) and in play, superseding 14-S5's and 14-S7's
  526px. The cells share 1px lines as today, so a cell's pitch is
  559px / size: a Mini's (5×5) about 112px, a Daily's (15×15) about
  37.3px and a Sunday's (21×21) about 26.6px. The pitches aren't whole
  pixels (526 was 15 × 35 + 1); the grid keeps its hairline technique,
  and the browser places the lines.
- **Letters keep their ratio to the cell** (14-S5): `cell-letter`'s 16px
  in a 35px pitch, so a Daily's letters are about 17px and a Sunday's
  about 12.2px. Numbers stay `cell-number` (10px).
- **The style guide's grid samples** keep their own sample widths.

### No height term *(human, the epic's Decision)*

- **The grids don't shrink with the window's height.** The builder's
  `100vh − 300px` and play's `100vh − 370px` terms go from the grids'
  widths. On a short window the grid stays 560px and the page scrolls.
- **The hint lists scroll in their own box at the grid's height**
  *(agent; human-approved 2026-10-28)*. The builder's hints-phase list and play's Across and Down
  lists also used those terms as their maximum height. They now match the
  grid's height, top and bottom, when they sit beside it, which 14-S7
  already described ("the lists scroll in their own box at the grid's
  height"). Stacked under the grid (below `lg`) they aren't capped, as
  today, until S3 and S5 replace them. The build phase's hint skeleton
  stays uncapped, as today.
- **Opening the builder doesn't scroll the page** *(agent; approved with
  the draft)*. The build
  phase focuses the grid on load. With a grid taller than the window
  allows, that focus scrolled the page down to show the whole grid
  (21px at 1280×800), moving the title and buttons. The load focus no
  longer scrolls. A click on a cell already doesn't scroll the page, in
  the builder or in play.

### The 45% cap stays, for now

The builder's grid column keeps its `lg:max-w-[45%]` cap in this story,
so at 1280px wide the grid is about 554px (45% of the editor's 1232px).
The epic moves its removal to S2, which owns the layout beside the grid.
Play has no such cap.

### The default test viewport *(human, the epic's Decision)*

The Playwright projects' default viewport moves from Desktop Chrome's
1280×720 to **1440×900**, in this story's specification-only freeze
commit. Specs that set their own viewport keep it. The human approved the
1440px width on 2026-10-27 and the 900px height on 2026-10-28.

### Not changed

- The grids' colors, cursor, lines, numbering and behavior.
- The layout beside and above the grid: the 72px and 66px gaps, the
  hint columns' max widths and the 45% cap (S2), and the narrow layouts
  (S3–S6).
- The grid-engine (`src/engine/**`).

## Non-goals

- The wide layout: the 1800px main area, the 32px gap and the filling
  hint columns (S2).
- Any shrinking below the full size beyond today's width-based behavior:
  the grid shrinks with a narrow window as today; S6 settles small
  screens and cell-number minimums.
- Horizontal layout changes at any width.

## Resolved questions (2026-10-28)

1. **The test viewport's height:** 900px, approved.
2. **The hint lists' height:** the grid's height, approved. Long lists
   (a Sunday's ~70 hints a direction) scroll in their own box either way;
   the old `100vh` limits only changed that box's height. Nothing scrolls
   the active hint into view in that box, today or after S1; that is
   outside this story.

## Retired and amended acceptance

Approving this story approves this, which lands in the
specification-only freeze commit on `main`.

**`e2e/build-grid-design.spec.ts` (14-S5):**

- **Amended:** 14-S5-3 "a {5, 9, 15, 21}×… is 526px wide, its cells
  sharing 1px lines" (4 cases) becomes "… is 560px wide …": 560×560px,
  pitch (560 − 1) / size.
- **Retired:** 14-S5-3 "a 15×15 still shrinks with a shorter screen". It
  required a 420px grid at 1280×720. Replaced by 15-S1-2's short-window
  cases.
- **Amended:** 14-S5-4 "a {15, 5, 21}×…'s letters are cell-letter at …px"
  (3 cases): the expected sizes become (559 / size) × (16 / 35), 17.0,
  51.1 and 12.2px, from 16, 48 and 11.4px.
- Kept: 14-S5-4 "letters shrink with the grid on a shorter screen" still
  passes; at 1280×720 the 45% cap narrows the grid to about 554px.

**`e2e/play-design.spec.ts` (14-S7):** **Amended:** 14-S7-1 "unselected:
… at most 526px" becomes "… at most 560px", its width 560px.

**`e2e/editor-layout.spec.ts` (D5a):**

- **Amended:** D5a-1 "a 15x15 fits at 1280x800" and "… at 1024x768"
  become "a 15x15 fits the width at …": the grid's bottom within the
  window is dropped, its right edge within the window kept.
- **Amended:** D5a-2 "both regions render and a hint is visible alongside
  the whole grid" becomes "… alongside the grid": the grid's bottom within
  an 800px window is dropped; the grid, the hints and a hint's visibility
  are kept.

**`playwright.config.ts`:** the default viewport becomes 1440×900 for
every project.

No other frozen test breaks: the throwaway passed the full suite (below).

## Acceptance

`e2e/grid-size.spec.ts` (new), 12 cases:

- **15-S1-1 the default viewport (1):** a test that names no viewport
  runs at 1440×900.
- **15-S1-2 the builder grid on a short window (5),** at 1440×600: a
  15×15 and a 21×21 in the build phase are 560×560px with a 559 / size
  pitch, and the page scrolls; a 15×15 in the hints phase is 560px;
  opening the build phase focuses the grid and leaves the page at the
  top, and so does a click on a cell; the hints-phase list's box starts
  level with the grid, is the grid's height and scrolls (`overflow-y:
  auto`, its content taller).
- **15-S1-3 the play grid (6):** at the default viewport, a 5×5, a 15×15
  and a 21×21 are 560×560px with a 559 / size pitch; at 1440×600, a
  15×15 stays 560px and the page scrolls, a click on a cell leaves the
  page at the top, and a 21×21's lists start level with the grid, are its
  height and scroll.

With the amendments above (11 amended cases, one retired).

### Acceptance choices

- Lengths use `toBeCloseTo(…, 0)` (±0.5px); letter sizes ±0.3px, as
  14-S5.
- "The page scrolls" is the document's scroll height over its client
  height; "leaves the page at the top" is `window.scrollY` 0.
- Play's fixtures fill every cell and give every word a hint, so a
  21×21's 21 hints a column overflow its 560px box.

### Discrimination (2026-10-28, observed)

- **Against `main`'s runtime** (with the new viewport): 15 cases fail:
  the 8 amended 14-S5 and 14-S7 cases and 7 new ones (the 560px sizes,
  short window included). 15-S1-1 fails without the config change. The
  rest pass on `main` too, as guards: `main`'s grid still fits a 600px
  window, so it doesn't scroll the page, and its lists and grid share the
  same height term.
- **Against variants of the throwaway:** without the load focus's
  `preventScroll`, 15-S1-2's "opening … leaves the page at the top" and
  14-S4-2 "… so the grid stays put" (`builder-controls`, unamended) fail;
  with the lists keeping their `100vh` heights, both "at the grid's
  height" cases fail.
- **Against the throwaway** (`/tmp/crossward-drafts/15-S1-throwaway.patch`,
  reverted): all 12 new cases and the amended ones pass. With the new
  spec and the amendments, `npm run verify` exited 0 (47 files, 595
  Vitest tests) and the full `npm run test:e2e` passed 663 of 663.
  Before the amendments, the full suite failed exactly the cases
  amended or retired above, and 14-S4-2, which the load-focus decision
  fixes.

## EPIC amendment *(applied at freeze)*

- **Grid width 560px:** add that the hint lists beside a grid scroll in
  their own box at the grid's height, and that opening the builder
  doesn't scroll the page.
- **The default test viewport:** 1440×900, the height approved.

## Repo paths

Runtime: `src/components/grid/PuzzleGridEditor.tsx`,
`src/components/play/PlayPuzzle.tsx` and
`src/components/grid/PuzzleGrid.tsx` (its comment on the 526px maximum).

Acceptance: `e2e/grid-size.spec.ts` (new), the amendments to
`e2e/build-grid-design.spec.ts`, `e2e/play-design.spec.ts` and
`e2e/editor-layout.spec.ts`, and `playwright.config.ts`'s viewport.

## Definition of Done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  with the EPIC amendment and the viewport change.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes.
