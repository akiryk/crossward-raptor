# Story S2 — Wide layout

Below the full-width masthead, the main area is at most 1800px wide and
centered. In the builder and play, the hints sit 32px from the grid and
their Across and Down columns fill the room left. In the builder the grid
holds 560px down to the `lg` breakpoint; with less room beside it (a
window under 1290px) the two columns stack into one, still beside the
grid.

**Status: approved and frozen** (2026-10-28). The human answered the
four questions the same day, accepting each proposal, and approved the
draft for freeze the same day *(human)*; frozen in `ff07a76`.
**Implemented** on `main` the same day: `npm run verify` exit 0 (595
Vitest tests), full `npm run test:e2e` 683 of 683. Only the human's
visual check remains of its Definition of Done.

**Blast radius: small.** The root layout's `<main>`, the client
components `PuzzleGridEditor`, `HintSkeleton`, `HintsPanel`, `PlayPuzzle`
and `PlayerHints`, and the style guide's `GridExamples`. No server,
schema, engine, token or risk path, so delivery is direct on `main` under
CODE-REVIEW. Three frozen specs are amended.

## Decisions

Inspected `layout.tsx`, `Header`/`Masthead`, the builder and play pages'
`p-6` wrappers, `PuzzleGridEditor`, `HintSkeleton`, `HintsPanel`,
`PreviewLegend`, `PlayPuzzle`, `PlayerHints`, `GridExamples`, and the
frozen specs that measure the hints' frame (`build-grid-design`,
`hint-phase-design`, `play-design`). The frozen tests this story breaks
were found by running the full suite against a throwaway (see
Discrimination).

### The main area *(human, the epic's Decision)*

- **`app-main` is at most 1800px wide and centered** (`mx-auto w-full
  max-w-[1800px]`). The pages keep their own 24px padding inside it, so
  at 2400px the editor starts 324px from the window's left.
- **The masthead is unchanged** *(human, 2026-10-28)*: its bar, logo
  and Sign out still span the window at any width (F7-3's "logo 20px from
  the left" holds).
- The cap applies to every page under the masthead (library, sign-in,
  style guide). None is wider than 1800px at 1440px, so nothing changes
  at the default viewport.

### 32px from the grid *(human, amendment)*

- **Builder (build and hints phases):** `editor-layout`'s gap goes from
  72px to 32px. The skeleton's dots and the Hint Inputs' columns start
  32px right of the grid, where the frozen tests measured 72px.
- **Play:** the numbers sit 32px right of the grid, where 14-S7-3
  measured 72px. The rows keep their 6px left padding (the selected row's
  background), so the grid column's gap goes from 66px to **26px**
  *(agent; human-approved 2026-10-28)*. "The gap" is read the way the
  frozen tests read it: grid to the first visible content.
- Between Across and Down, 32px as today.

### Columns that fill *(human, amendment)*

- **The max widths go:** `max-w-[350px]` in `HintSkeleton` and
  `HintsPanel`, `max-w-[270px]` in `PlayerHints`. The two columns share
  the room equally, to the editor's or play area's right edge.
- **The lines fill their column** *(agent, following from the above)*.
  The skeleton's line and the Hint Input's underline were 320px only
  because the column was 350px (the 18px dot, the 12px gap). They now run
  to the column's right edge: about 354px at 1440px, 534px at 1800px and
  over. The dot, the gap, the type and the row spacing are unchanged.

### The grid holds 560px *(human, the epic's Decision)*

- **The 45% cap goes** (`lg:max-w-[45%]`, kept by S1). The grid's column
  is 560px and doesn't shrink beside the hints (`shrink-0`); it keeps
  `max-w-full`, so below `lg` it still narrows with the window as today.
- From `lg` (1024px) up, only the hint columns give way.

### One column below 1290px *(human, the epic's Decision)*

- **A container query on the hint area** (`@container`, two columns at
  `@min-[650px]`, *human-approved 2026-10-28*), per the epic's proposed
  "thresholds set by content".
  650px is the room beside the grid at a 1290px window: 1290 − 2 × 24
  (padding) − 560 − 32. Below it, Down stacks under Across, 32px apart,
  one column the full width beside the grid.
- It applies to the build phase's skeleton and the hints phase's Hint
  Inputs alike. In the hints phase the one column still scrolls in its
  box at the grid's height (S1).
- Below `lg` (1024px) the hints still move under the grid as today. S3
  moves that threshold to about 1000px and replaces the list there.

### Preview's legend

Unchanged: under the grid, within its width, in the grid's column. The
skeleton beside it moves to 32px like the rest.

### Wide play *(human, the epic's Decision)*

- Play keeps 14-S7's arrangement: the Prominent Hint above the grid at
  its width, the Player Hints to its right, with the 32px gap and filling
  columns.
- **Play has no one-column step** *(human, 2026-10-28)*. Its two columns stay side by side,
  narrowing, down to `lg`. Between 1024 and 1290px they're narrow (about
  180px each at 1024px) until S5 replaces them with the play hint bar
  below 1290px.

### The style guide

- `sg-hint-skeleton` keeps today's look: its sample is capped at 732px
  (two 350px columns and the 32px gap), so its lines stay 320px.
- The play sample's gap goes to 26px, matching play.
- No new sample: S2 adds no component.

### Not changed

- The grid's size, colors, cursor and behavior; the hint lists' heights
  (S1); the title, steps and toggle row; the narrow layouts (S3–S6).
- Saving, publishing, play, keyboard entry and the engine
  (`src/engine/**`).

## Non-goals

- The narrow builder (below about 1000px) and the Hint Box (S3, S4).
- Narrow play and the play hint bar (S5).
- The grid shrinking below `lg`, and small screens (S6).
- The masthead's contents or any spacing not named here.

## Resolved questions (2026-10-28)

The human accepted each proposal:

1. **Play's 32px** is to the numbers: a 26px CSS gap, each row keeping
   its 6px padding.
2. **The masthead above 1800px** is unchanged: the logo and Sign out stay
   at the window's edges.
3. **The one-column threshold** is 650px of room beside the grid, a
   1290px window.
4. **Play between 1024 and 1290px** keeps two narrow columns until S5.

## Retired and amended acceptance

Approving this story approves this. It lands in the specification-only
freeze commit on `main`.

**`e2e/build-grid-design.spec.ts` (14-S5-6 hint skeleton):**

- **Amended:** "the dot, the gap and the line" becomes "…, and the line,
  which fills its column": the line's 320px becomes its right edge at the
  column's right edge. The dot, the gap and the line's color are kept.
- **Amended:** "rows 58px apart, 32px below the label; columns 32px
  apart; 72px right of the grid" becomes "… 32px right of the grid".

**`e2e/hint-phase-design.spec.ts` (14-S6-5 the skeleton's frame):**

- **Amended:** "the line starts 30px into the column and is 320px; …"
  becomes "… and fills it; …": the 320px becomes the line's right edge at
  the column's right edge.
- **Amended:** "columns 32px apart, 72px right of the grid; …" becomes
  "… 32px right of the grid; …".

**`e2e/play-design.spec.ts` (14-S7-3 Player Hints):**

- **Amended:** "the frame: 72px from the grid, …" becomes "the frame:
  32px from the grid, …".
- **Amended:** "columns up to 270px, 32px apart, labels level with the
  grid's first row" becomes "equal columns, 32px apart, …": the two 270px
  widths become Down as wide as Across. 15-S2-6 adds that they fill the
  room.

No other frozen test breaks: the throwaway passed the full suite (below).

## Acceptance

`e2e/wide-layout.spec.ts` (new), 20 cases:

- **15-S2-1 the main area (2):** at 2400×900, the masthead spans the
  window, `app-main` is 1800px and centered, and the editor starts 24px
  inside it; at 1440px, `app-main` is the window's width.
- **15-S2-2 the build phase's skeleton, two columns (3)** and **15-S2-3
  the hints phase's Hint Inputs, two columns (3),** each at 1440, 2400
  and 1290px: a 560px grid, Across 32px right of it, Down beside Across
  32px apart, equal widths, Down reaching the editor's right edge, and the
  first line reaching its column's right edge.
- **15-S2-4 one column below 1290px (7):** in each phase at 1289, 1100
  and 1024px, a 560px grid, Across 32px right of it and level with its
  top, Down 32px below Across at the same x and width, filling to the
  editor's right edge; and at 1100px a 15×15's hints-phase column scrolls
  in its box at the grid's height.
- **15-S2-5 Preview's legend (2),** at 1440 and 1100px: under the 560px
  grid, from its left, within its width; the skeleton 32px right of it.
- **15-S2-6 wide play (3):** at 1440 and 2400px, a 560px grid, the
  numbers 32px right of it, two equal columns 32px apart reaching the
  play area's content edge; at 2400px the Prominent Hint stays above the
  grid at its width.

With the amendments above (6 amended cases, none retired).

### Acceptance choices

- Lengths use `toBeCloseTo(…, 0)` (±0.5px), as S1.
- 1290 and 1289px bracket the threshold; 1024px is the narrowest width
  where the hints still sit beside the grid until S3.
- Fixtures fill every cell and give every word a hint, so every column
  has lines; the legend's fixture is a 5×5 with one corner letter (a
  symmetry error).
- 2400px stands for "beyond 1800px"; nothing in the layout changes past
  the cap.

### Discrimination (2026-10-28, observed)

- **Against `main`'s runtime,** with the new spec and the amendments: 20
  cases fail: the 17 new layout cases and the 3 amended gap cases
  (14-S5-6's and 14-S6-5's 32px from the grid, 14-S7-3's frame). 70
  pass, including three new guards (the 1440px main area, the scrolling
  one-column box's frame, the Prominent Hint) and the three amended
  "fills its column" and "equal columns" cases, which `main` meets with
  its 350px and 270px columns.
- **Against the throwaway** (`/tmp/crossward-drafts/15-S2-throwaway.patch`,
  reverted): all 20 new cases and the amended ones pass. `npm run verify`
  exited 0 (47 files, 595 Vitest tests). Before the amendments, the full
  `npm run test:e2e` failed exactly the 6 cases amended above (and 2
  legend cases from a fixture bug, since fixed). With them, the full
  suite passed 683 of 683. One earlier full run also failed two
  `library-play` cases (a link navigation, a reset dialog) that passed on
  a rerun of that file and in the next full run; unrelated to layout.

## EPIC amendment *(applied at freeze)*

- **32px between the grid and the hints:** record that in play the 32px
  is to the numbers (the CSS gap 26px), and that the lines fill their
  columns.
- **Thresholds are set by content:** record the 650px container
  threshold.

## Repo paths

Runtime: `src/app/layout.tsx`, `src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/HintSkeleton.tsx`,
`src/components/grid/HintsPanel.tsx`, `src/components/play/PlayPuzzle.tsx`,
`src/components/play/PlayerHints.tsx` and
`src/components/style-guide/GridExamples.tsx`.

Acceptance: `e2e/wide-layout.spec.ts` (new) and the amendments to
`e2e/build-grid-design.spec.ts`, `e2e/hint-phase-design.spec.ts` and
`e2e/play-design.spec.ts`.

## Definition of Done

- The human approves this specification and its acceptance (the
  questions are answered), recorded here and in the handoff (approved
  2026-10-28). Freeze on `main`
  in a specification-only commit with the EPIC amendment.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes: the builder (both phases, Preview) and
  play at 2400, 1440, 1290 and 1100px.
