# Story S7 — Hint preview alignment

In the builder's hints phase, toggling Preview Hints changes only the
hints' own vertical layout. The "Across" label keeps its place, the
"Down" label keeps its left edge, and every hint number keeps its left
edge, with Preview Hints off or on. Both states use Preview Hints'
alignment as it is on `main`: labels and numbers 6px into their column,
38px right of the grid instead of 32px. Preview Hints takes the Hint
Inputs' columns: two side by side from a 1430px window, one column
below. The build phase's skeleton takes the same 6px inset and the
list's scrollbar room, so Create Hints still moves nothing sideways.

**Status: done** (2026-11-02; implemented `351b137`). Drafted under the
orchestration the human delegated on 2026-11-02 and extended to S5–S8 the
same day (see the [handoff](../HANDOFF.md)). Revised the same day for the
human's and the orchestrator's decisions below (Preview stacks too,
Down's height in one column, the skeleton's inset), and again for the
independent specification review's should-fix findings (the skeleton's
scrollbar room, the amendments' exact text, the discrimination plan). The
same reviewer's confirmation pass: **approve with should-fix**, no
blocker. Its should-fix (the lost `/tmp` throwaway) is resolved below; of
its nits, 18-S7-5's title now says only the Across label is 38px from
the grid, and the Create Hints test keeps 14-S6-1's absolute coordinates.
The orchestrator approved the specification, acceptance and amendments
after observing the discrimination below, under the human's delegation.

**Blast radius: small.** The change is a 6px left inset on the columns of
`HintsPanel.tsx` and `HintSkeleton.tsx`, a builder-only stacking option on
`PlayerHints.tsx` passed by `PuzzleGridEditor.tsx`, and
`scrollbar-gutter: stable` on the builder's hints list and on the
skeleton (with `overflow-hidden`, which the gutter needs). It adds one
spec file and amends two frozen test files. No schema, server action,
storage, query or engine change. Play's and the style guide's Player
Hints don't pass the option and are unchanged. The style guide's
`HintsPanel` and `HintSkeleton` samples render the same components, so
they do take the inset (and the skeleton sample its scrollbar room).
**CODE-REVIEW risk classification:** none of the declared Repo paths is a
risk path (`src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts`, `prisma/**`). So this story is delivered
directly on `main`.

## What the code does today

I inspected `src/components/grid/PuzzleGridEditor.tsx` (the Preview Hints
toggle and the `hints-region`), `src/components/grid/HintsPanel.tsx`,
`src/components/play/PlayerHints.tsx`, `src/components/grid/HintSkeleton.tsx`,
the style guide's `GridExamples.tsx`, and the frozen tests that measure
the hints list or skeleton: `wide-layout`, `larger-grid`,
`hint-phase-design`, `build-grid-design`, `hints-layout`, `preview-hints`,
`hints-panel`, `missing-hints`, `narrow-builder`, `editor-layout`,
`grid-size`, `text-styles` and `typography`.

- **The toggle** (17-S9) is wide only, a 1140px window and up (1092px of
  editor room). Narrow, the Hint Box replaces the list and there is no
  Preview Hints (17-S9-5). So there is no narrow layout to align.
- **The list** is the `hints-region`, 32px right of the 700px grid, as
  wide as the room left (360px at 1140px, 650px at 1430px), scrolling at
  the grid's height. Off, it holds `HintsPanel`; on, play's
  `PlayerHints`.
- **Root cause, horizontal.** `PlayerHints` pads its label (`h2
  px-[6px]`) and each hint row (`li px-[6px]`), so with Preview on the
  labels and numbers start 6px into their column, 38px right of the grid.
  `HintsPanel` has no padding: its labels (`h3`) and numbers start at
  the column's edge, 32px right of the grid. Toggling moves them 6px.
- **Root cause, vertical.** `HintsPanel` stacks its columns into one
  below 650px of room (`@min-[650px]:flex-row`, 15-S2, 17-S7), a window
  under 1430px. `PlayerHints` is always two columns. So from 1140px to
  1429px, toggling moves the Down label between the top of a second
  column and below every Across input. At 1430px and up the labels'
  vertical positions already match (both `pt-2`, `title-4`). The 17-S9
  tests run at 1280px, in the stacked range.
- **A third, environment-dependent cause.** The list is `overflow-y:
  auto`. Where scrollbars take room (a mouse attached on macOS, Windows),
  the editing list, which usually overflows, loses the scrollbar's width
  and the compact preview often doesn't, so the Down column moves by half
  a scrollbar. Playwright's headless Chromium hides scrollbars, so no
  test can see this.
- **The skeleton** (`HintSkeleton`, the build phase) copies `HintsPanel`'s
  frame: no inset, one column below 650px. 14-S6 requires nothing to move
  at Create Hints; its frozen case checks this at 1440px only. In one
  column the Down label already moves down at Create Hints on `main`,
  since a Hint Input row is taller than a skeleton row.
- **Who else uses these components.** `PlayerHints` is also play's list
  and the style guide's sample; `HintsPanel` and `HintSkeleton` are also
  style-guide samples.

## Decisions

### From the EPIC *(human, 2026-11-02)*

- Toggling Preview Hints may change only the hints' own vertical layout.
  The Across and Down labels' left alignment and vertical position, and
  the numbers' left alignment, stay identical.
- **The alignment is Preview Hints' (on):** "a little more gap between the
  hints and the grid", the labels and numbers 6px further from the grid
  than the editing list puts them today.
- Only the hints panel's alignment changes in the builder (Non-goals);
  play and other pages don't change.

### Preview stacks too *(human, 2026-11-02)*

- In the builder only, Preview Hints follows the editing list's layout:
  one column (Down below all of Across) wherever the Hint Inputs stack,
  below 650px of room (a window under 1430px), and two columns above.
  17-S7's one-column editing layout from 1140px to 1429px stays. Play's
  own Player Hints layout is unchanged.
- **One column:** see the human's decision on Down's height below.

### Down's height in one column *(human, 2026-11-02)*

- The human accepts that the Down label moves in one column. The Across
  label and every left edge (both labels and every number) stay fixed at
  all widths. From 1140px to 1429px only Down's height changes: it sits
  32px below all of the Across hints, which may change, so it follows
  them. At 1430px and up nothing moves. The tests check Down's left edge
  and its 32px gap below the Across hints in one column, not its height.

### The skeleton's inset *(orchestrator, 2026-11-02)*

- The build phase's skeleton takes the same 6px left inset, so 14-S6's
  "nothing moves at Create Hints" still holds: the labels, dots and
  lines' positions match the Hint Inputs' labels, numbers and lines. The
  skeleton keeps its one column below 650px.
- **The skeleton's scrollbar room** *(orchestrator, 2026-11-02, after the
  independent specification review)*: the skeleton keeps the same
  scrollbar gutter as the hints list, so 14-S6's "nothing moves at Create
  Hints" also holds where scrollbars take room. The hints list keeps its
  gutter whether or not it overflows; without its own, the skeleton's
  columns would be a scrollbar wider and the Down column would move at
  Create Hints.
  - **Implementation note (drafting).** The orchestrator named
    `overflow-y-hidden [scrollbar-gutter:stable]`. Checked against the
    markup, the throwaway uses `overflow-hidden [scrollbar-gutter:stable]`
    instead. `scrollbar-gutter` only applies to a box whose overflow isn't
    `visible`, so the skeleton needs a non-visible overflow. With only
    `overflow-y: hidden`, `overflow-x` computes to `auto`, which would
    allow a horizontal scrollbar. `overflow: hidden` on both axes reserves
    the same vertical gutter and allows no scrollbar.
  - **No layout change where scrollbars are hidden.** The skeleton is a
    flex item in the editor's `items-start` row, so its height is its
    content's height and a non-visible overflow clips nothing. Its width is
    already `flex-1 min-w-0`, so a scroll container's `min-width: 0` changes
    nothing. It has no top margin that a new block formatting context would
    stop collapsing. It is `aria-hidden` and has nothing focusable. In
    headless Chromium, which hides scrollbars, the gutter is 0px, so every
    test sees the same layout as without it. As with the list's gutter, no
    test covers it.
- **For the human's end-of-epic review.** The EPIC's Non-goals let only
  the builder's hints panel change. The skeleton is the build phase's
  stand-in for that panel, not the panel itself, so its inset and
  scrollbar room extend that exception slightly into the build phase. The
  reason is 14-S6's frozen requirement that nothing moves at Create
  Hints. The rest of the build phase, and play, don't change.

### Delegated decisions *(drafting, 2026-11-02; for the reviewer, the orchestrator and the human's end-of-epic review)*

- **The editing list moves, not Preview Hints.** `HintsPanel`'s columns
  get a 6px left inset (`pl-[6px]` on each `hint-column`), so their labels
  and numbers start where `PlayerHints`' do. `PlayerHints`' padding is
  unchanged.
- **Left only.** The inset is on the column's left; the Hint Input and the
  skeleton's line still run to the column's right edge, with the answer
  right-aligned under the input. The columns' boxes (32px from the grid,
  32px apart) don't move, so the Preview Hints panel over the list
  (17-S9-1) is unchanged. Inputs and lines are 6px narrower.
- **The seam.** `PlayerHints` gains an optional `stacksWhenNarrow` prop
  (default off): when set, its columns sit in an `@container` and are
  `flex-col` below 650px of room, `flex-row` above, with the same 32px
  gap, as `HintsPanel`. Only the builder's Preview Hints sets it. Play
  and the style guide render exactly as before.
- **The scrollbar's room is kept** (`scrollbar-gutter: stable` on the
  `hints-region`), so where scrollbars take room the Down column doesn't
  move when the list stops or starts overflowing. Overlay scrollbars and
  the tests' hidden scrollbars are unaffected. Untested, since headless
  Chromium hides scrollbars. The skeleton keeps the same room (the
  orchestrator's decision above).
- **Scroll.** Positions are compared with the list unscrolled. A list
  scrolled before the toggle may land at another scroll position, since
  the two lists' heights differ; that is the hints' own vertical layout.
- **Published puzzles** have no Preview Hints (17-S9) but get the same
  inset, as the same `HintsPanel`.

## Acceptance

*Approved and frozen.* One new file and two amended files.

### e2e/hint-preview-alignment.spec.ts

Five numbered cases, 30 tests. Puzzles are all-on squares, every word
hinted, seeded with the existing helpers (`seedPuzzle`, then
`waitForEditorReady`). Label and number positions are their text's (a
DOM Range over the element), not the element's box, since the lists pad
differently; a label's height is checked as its text's top and its
content box's top. Tolerance 0.5px. The widths are 1440, 2400 (the 1800px
main area) and 1430px (two columns), and 1429, 1280 and 1140px (one
column).

1. **18-S7-1** at each width, a 5×5 and a 15×15 (two-digit numbers, a
   list that overflows when editing): off, on and off again, the Across
   label's left and top, the Down label's left (and in two columns its
   top), and each number's left (matched by hint key across the two
   lists) are identical. These positions are compared relative to the
   grid's box, so a window scroll doesn't count as a move.
2. **18-S7-2** at each width, a 15×15 with Preview Hints off and on: the
   Across label and numbers 38px right of the 700px grid, the label's
   content 8px below the list's top. Two columns: the Down label and
   numbers 6px into the second column, which starts at the list's left
   plus half its content width plus 16px; the labels level. One column:
   the Down label and numbers at Across's left, the Down column 32px
   below the Across column, its label's content 8px into it. These are
   Preview Hints' positions on `main` (from `PlayerHints`' and the
   editor's markup), with Down stacked where the Hint Inputs stack.
3. **18-S7-3** only the hints change: off, 10 Hint Inputs; on, 10 Player
   Hints and no input; the list's box doesn't move.
4. **18-S7-4** at 1139px, the Hint Box shows and there is no Preview
   Hints, so there is nothing to align (a guard; 17-S9-5 covers 1000px and
   less).
5. **18-S7-5** the skeleton, at 1440px and 1280px:
   - its labels' text and every dot start 6px into their column, the
     Across label 38px right of the grid;
   - at Create Hints the labels keep their left edge (and, in two
     columns, their top; the Across label always), and each number takes
     its dot's left edge.

### Amended acceptance

Committed in the specification-only freeze commit `14958ed`. Every
other frozen test is unchanged.
Both headers' "72px right of the grid" was already stale: the frozen
cases measure the columns 32px from the grid (14-S6-5, 14-S5-6). The
same amendment corrects it to the columns' 32px, with the labels,
numbers and dots at 38px.

| File | Case | Was | Becomes | Reason |
| --- | --- | --- | --- | --- |
| `e2e/hint-phase-design.spec.ts` | header comment (lines 24–26) | "…; columns 32px apart, 72px right of the grid. The input's text is body-normal primary. …" | "…; columns 32px apart, 32px right of the grid. 18-S7: labels and numbers 6px in (lines 36px), as the skeleton's labels and dots, 38px right of the grid. The input's text is body-normal primary. …" (the rest of the paragraph only rewrapped) | the 72px was stale; the 6px inset (18-S7-2) |
| `e2e/hint-phase-design.spec.ts` | 14-S6-5 `'the line starts 30px into the column and fills it; lines 58px apart, the first 45px below the label'` | `expect(first.x - across.x, 'the dot\'s 18px and the 12px gap').toBeCloseTo(30, 0);` | renamed `'the line starts 36px into the column and fills it; lines 58px apart, the first 45px below the label'`; `expect(first.x - across.x, 'the 6px inset, the dot\'s 18px and the 12px gap').toBeCloseTo(36, 0);`; the rest unchanged | the 6px inset (18-S7-2) |
| `e2e/build-grid-design.spec.ts` | header comment (line 23) | "…; columns 32px apart; 32px below the label; 72px right of the grid." | "…; columns 32px apart; 32px below the label; columns 32px right of the grid. 18-S7: each column's labels and dots start 6px in, 38px right of the grid for Across." | the 72px was stale; the skeleton's 6px inset |
| `e2e/build-grid-design.spec.ts` | 14-S5-6 `'rows 58px apart, 32px below the label; columns 32px apart; 32px right of the grid'` | `expect(downDot.x - (first.x + first.width), 'between columns').toBeCloseTo(32, 0);` and `expect(acrossDot.x - (g.x + g.width), 'from the grid').toBeCloseTo(32, 0);` | renamed `'rows 58px apart, 32px below the label; columns 32px apart, dots 6px in; 32px right of the grid'`; `…, 'between columns, plus the 6px inset').toBeCloseTo(38, 0);` and `…, 'from the grid, plus the 6px inset').toBeCloseTo(38, 0);` (the columns still 32px apart and 32px right of the grid); rows and label unchanged | the skeleton's 6px inset (the orchestrator's decision, 18-S7-5) |

14-S6-5's "nothing moves at Create Hints" needs no amendment: it compares
element boxes and lines, and the skeleton's and Hint Inputs' columns both
take the inset, so the labels' and lines' x, y and width still match.

Checked and unaffected: 15-S2-2 to 15-S2-5 (`wide-layout`) and 17-S7-3
(`larger-grid`) measure the columns' boxes and lines' right edges, which
don't move, and keep the one-column layout below 1430px. 17-S9
(`preview-hints`, at 1280px) counts two `play-clue-column`s, which a
stacked Preview Hints still has, and measures the panel against the
column's box. `hints-layout` compares inputs and answers within and
across columns; `hints-panel`, `missing-hints`, `narrow-builder`,
`editor-layout`, `grid-size`, `text-styles` and `typography` check
content, styles or the list's box. Play's 15-S2-6 and 17-S7-4 are play's
own layout, unchanged. The style guide's samples are checked for
visibility only.

### Acceptance choices *(delegated, drafting)*

- By design, 7 tests pass on `main`: 18-S7-2's three two-column on-state
  cases (Preview Hints' current positions, the target), 18-S7-3,
  18-S7-4, and 18-S7-5's two Create Hints cases (on `main` the skeleton
  and the Hint Inputs both have no inset; they guard 14-S6 through the
  change).
- The 15×15 at 1140px gives two-digit numbers in the narrowest list.
- Not covered: the list's and the skeleton's scrollbar gutters (hidden
  in headless Chromium), a scrolled list, and the style guide's samples.

### Discrimination (2026-11-02, observed by the orchestrator)

The drafting throwaway in `/tmp` did not survive a reboot. A separate
implementing agent rebuilt it from this story in an isolated worktree
(the four runtime files only; `npm run verify` exit 0). It is kept at
`~/.crossward-patches/18-S7-throwaway.patch`. Suites ran one at a time,
load averages 6 to 8, no other suite running.

1. **`main` and the new spec:** 23 failed, 8 passed (7 plus setup), as
   planned. Every 18-S7-1 test failed at "Across label left: 732 vs 738";
   18-S7-2 off at 32px not 38px, on in one column with Down beside
   Across; 18-S7-5's inset tests at 756 vs 762.
2. **The throwaway, `hint-phase-design` and `build-grid-design`
   unamended:** 2 failed, 78 passed: exactly 14-S6-5's line case and
   14-S5-6's columns case.
3. and 4. **The throwaway, amended, with the new spec and `wide-layout`,
   `larger-grid`, `preview-hints`, `hints-layout`, `narrow-builder`,
   `small-screens`, `editor-layout` and `grid-size`:** 215 passed, 0
   failed, in one run.

## Repo paths

Acceptance (immutable after freeze): `e2e/hint-preview-alignment.spec.ts`,
`e2e/hint-phase-design.spec.ts` and `e2e/build-grid-design.spec.ts`.

Runtime:

- `src/components/grid/HintsPanel.tsx`: the columns' 6px left inset.
- `src/components/grid/HintSkeleton.tsx`: the same inset, and
  `overflow-hidden [scrollbar-gutter:stable]` on `hint-skeleton`.
- `src/components/play/PlayerHints.tsx`: the optional `stacksWhenNarrow`
  prop.
- `src/components/grid/PuzzleGridEditor.tsx`: passing it to Preview
  Hints; the `hints-region`'s `scrollbar-gutter: stable`.
- This story and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S7. These stay out of scope: play's layout and Player Hints' look,
the 650px stacking threshold, the Hint Box, the Preview Hints toggle and
its panel, the hints' text styles and spacing, and the style guide's own
code (its `HintsPanel` and `HintSkeleton` samples follow the components'
inset; its Player Hints sample is unchanged). Also the narrow right
margin (S6) and the audit cleanups (S8).

## Definition of done

- The orchestrator approves this specification, its acceptance and the
  amendments after an independent specification review, under the
  human's delegation. The approval is recorded here and in the handoff.
  Freeze on `main` in a specification-only commit before any runtime
  change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Delivered on `main` and the handoff updated with observed results.

## Pending questions

None. The human settled the stacked layout and Down's height in one
column. The orchestrator settled the skeleton's inset and its scrollbar
room.
