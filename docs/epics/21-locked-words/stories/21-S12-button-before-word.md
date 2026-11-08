# Story S12 — The lock button before the word

The lock button sits just before a word's first letter, left of an across
word and above a down word, so it is never where the builder is typing
next. The page makes room for it at the grid's left and top edges.

**Status: done (2026-11-07),** implemented in 86c4e7b on `main`; the human's
visual check passed (2026-11-07). Approved by the human and frozen (2026-11-07), after an independent specification review; delegated decisions included. From
the human's visual testing of S8–S11 (EPIC "Changes from the human's
visual testing (2026-11-07)", "The button's side"). Amends S2's "Look"
(placement and corners), and the S5/S9 rule for when the button shows
instead of the toggle row's Lock Word. Depends on S2–S11 (all delivered).

**Blast radius: medium, expected off the risk paths.** Client components
in `src/components/grid/` and the builder's hint-column class in
`src/lib/grid-max.ts`. No `src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts` or `prisma/**` change (CODE-REVIEW "When
review applies"). Direct delivery to `main`. The layout change touches
every builder width, so 8 frozen specs are amended (listed below).

## What the code does today

Inspected `PuzzleGrid.tsx` (the button), `PuzzleGridEditor.tsx` (layout,
`isGridFullWidth`), `HintsPanel.tsx`, `HintSkeleton.tsx`, `grid-max.ts`,
`Tooltip.tsx`, the builder page (`src/app/puzzles/[id]/page.tsx`), and the
frozen lock, layout and size specs.

- **The button** is placed in the last letter's grid area and pushed past
  it: `left: calc(100% + line)` for across, `top: calc(100% + line)` for
  down, rounded 4px on the far side (`rounded-r` / `rounded-b`). So it
  covers the left ⅔ of the end cell after an across word, and the top of
  the one after a down word: the cell the builder types into next.
- **Full width** (`isGridFullWidth`): the grid region's width is the
  puzzle's full 620px or 700px (S9). It decides the button beside the
  word (S2) against the toggle row's Lock Word (S5), and S10's hover.
- **Room left of the grid:** the page is `px-2` (8px) below a 748px
  window and `px-6` (24px) from it. One column (below a 1140px window)
  centers the grid at its full width, so the room is 8px or 24px plus
  half the slack. A Daily at a 636px window has 8px; at 1140px and up
  (two columns, the grid at the left) 24px. The button is ⅔ of a cell,
  at most 32px, plus the 1px line: about 23px on a Sunday, 28.5px on a
  Daily, 33px on a Mini. Content past the window's left edge can't be
  scrolled to.
- **Above the grid** is the toggle row, 20px above it in two columns
  (`mb-5`) and 16px in one (`mb-4`, 17-S8, 15-S3).
- **Two hint columns** sit side by side from a 1430px window (21-S9):
  `twoHintColumnsClass` gives the hints area's container query, 730px
  beside a 620px grid and 650px beside a 700px one. Its three callers
  (`HintsPanel`, `HintSkeleton`, the builder's `PlayerHints`) are all
  builder-only.

## Decisions

From the human (2026-11-07, EPIC "Changes from the human's visual
testing (2026-11-07)"):

- **The side:** the button sits just before the first letter: left of
  it and vertically centered for an across word, above it and
  horizontally centered for a down word. Size, colors, icon and behavior
  are S2's. Its square corners face the word and its far side is rounded
  4px.
- **At the grid's edges** it sits outside the grid, as today's does at
  the right and bottom, and the page makes room for it: it is never cut
  off and never drawn over the toggle row. "If we need to add more
  margin, add more margin"; then, given the threshold ripple, "full room,
  amend thresholds".

### Delegated decisions

Proposed by the drafting agent, for the human's approval:

- **36px of room** (a 32px button, the 1px line and 3px to spare), left
  of the grid and between the toggle row and the grid.
- **Left, two columns (from a 1140px window):** the builder's left column
  (title, step row, toggle row, grid) moves 12px right, so with the
  page's 24px the grid is 36px in. The grid-to-hints gap stays 32px, so
  the hints move 12px right and narrow by 12px; their right edge stays
  put. To keep two hint columns from a 1430px window for every size,
  their container thresholds drop by the same 12px (718px and 638px). Play is unchanged.
- **Left, one column:** no page margin is added. Where the full-size grid
  has less than 36px to its left, the toggle row's Lock Word (S5) is the
  lock control, as when the grid has shrunk. A full 620px grid has the
  room from a 692px window (Daily, Midi, Mini; S5's Lock Word from 636px
  down to 691px), a full 700px one from 772px (Sunday; from 716px down to
  771px). Grid sizes don't change, so phones lose no grid width. S10's
  hover follows the same rule, as it did "full width". S11's tick hover
  works in both, as before.
- **Top:** 36px between the toggle row and the grid wherever the button
  can show, in the build and hints phases alike so the grid doesn't move
  between steps, and wide in the published state too (whose step and
  toggle rows keep their height, 17-S8). Where the toggle row's Lock
  Word is used (above), it stays 16px. A published puzzle in one column,
  with no toggle row, stays 16px under "Published": no button shows there.
- **S4's tooltip** stays above the button, centered. Near the window's
  left edge, Tooltip's existing 8px edge rule holds it in. No change to
  Tooltip.
- **The tick:** an across word's button now sits in its before end cell,
  right-aligned against the first letter. It covers the bottom strip of
  that cell's tick square (from 1/6 to 1/4 down), and the button wins
  there, as S11 decided for a down word's. A down word's button, at the
  bottom of its before end cell, no longer touches a tick.
- **Resolved by this move:** the sideways scroll at 716–760px (HANDOFF
  open item 3; the button no longer goes right of the grid) and the
  button over the Reset Grid line under a bottom-row down word (S2
  "Overlap").

## Non-goals

- Changing the button's size, colors, icon, delay, Tab order, tooltip
  text or behavior (S2, S4, S7, S10), or the toggle row's Lock Word (S5).
- Changing grid sizes (S9), play's layout, or the hint columns' 1430px
  window.
- The tick hover's button (S13).

## Acceptance

### `e2e/lock-button-side.spec.ts` (new, 17 cases)

1. **21-S12-1 the end cell after the word is free** (2). With the
   cursor's button showing, the button doesn't overlap the end cell after
   the word. A click in that cell's middle moves the cursor there and
   locks nothing: TANGENT across (1440px), ONE down.
2. **21-S12-2 a word at the grid's edge** (8). In a filled grid, the
   middle row's across word (from the left edge) and the middle column's
   down word (from the top edge), at: a Daily at 1440, 1140, 1000 and
   692px; a Mini (32px button) at 1440 and 692px; a Sunday at 1440 and
   772px. The grid has at least 36px left of it. The button is left of
   the first letter and vertically centered, wholly outside the grid and
   inside the window. It is the topmost element at its middle, and the
   page has no sideways scroll. Then down: above the first letter,
   horizontally centered, outside the grid, below the toggle row (not
   over it), topmost at its middle.
3. **21-S12-3 the button only where it has room** (7). A filled grid at
   its full width. At 692px (Daily, Mini) and 772px (Sunday): the button
   beside the word, no Lock Word, 36px from the toggle row to the grid.
   At 691px and 771px: the toggle row's Lock Word, no button after 1.5s,
   16px. The hints phase at 1000px has the build phase's 36px.

### Amended frozen acceptance (8 specs)

Each amendment is marked "21-S12" in the file. No other assertion,
timeout or case changes.

- `e2e/lock-word.spec.ts` 21-S2-4 (3): across, down and the Mini:
  before the first letter, the rounded corners on the far side. The
  header's placement sentence.
- `e2e/lock-hover.spec.ts` (S10): `expectButtonBeside`, `isButtonBeside`
  and `hoverUntilShown` take the word's first letter instead of its last,
  and every call passes it (TANGENT 3,3, ROBIN 3,5, EGG 5,11, RUN 3,5).
  21-S10-4 rests just inside the first letter, beside the button, and
  leaves onto the free corner of the end cell before ROBIN (2,5). Its
  move to the first letter takes 20 steps (was 5), as it now crosses
  three cells.
- `e2e/lock-tooltip.spec.ts` 21-S4-1: centered on the button, or held 8px
  in from the window's edge (Tooltip's rule). The button is now left of
  TANGENT, near the edge.
- `e2e/lock-tick-hover.spec.ts` 21-S11-5's third case: "an across word's
  button over part of the tick wins there": DOG's button in (5,7), its
  tick under the button at (90%, 22%), clear at (95%, 8%).
- `e2e/lock-word-toggle-row.spec.ts` 21-S5-1: the narrowest window with
  the button beside the word is 692px (was 636px).
- `e2e/grid-size-by-puzzle.spec.ts` 21-S9-6: 692px/691px (Daily) and
  772px/771px (Sunday) replace 636px and 716px; at 691px and 771px the
  grid is at its full width yet the toggle row's Lock Word is used.
- `e2e/narrow-builder.spec.ts` 15-S3-1 (the grid 12px in from the editor
  at 1140px) and 15-S3-5 (36px from the toggle row to the grid at 768px).
- `e2e/step-controls.spec.ts` 17-S8-2: toggle row to grid 36px wide
  (1280px) and in one column (1000px); 16px on a phone and at 320px.

### Discrimination (2026-11-07, observed)

- **Against a scratch implementation** (the placement flip, the 36px
  room rule, the 12px two-column inset with the hint-column thresholds
  at 718px and 638px, and the 36px gap; reverted, kept outside the repo):
  the full `npm run test:e2e` before any amendment had 71 failures. These
  pinned down the amendments above. A first version that closed the
  grid-to-hints gap to 20px instead failed 45 more layout cases, so the
  thresholds were moved instead. With the amendments, the 8 amended specs
  and the new one passed 143 of 143 and the new spec 17 of 17.
- **On `main` (3d6952a), the new and amended specs:** 48 failed, 112
  passed. Every new case and every amended case fails at its S12 check
  (the button's side, the 36px, the room threshold). The 3 other failures
  (21-S2-10's two cases, 15-S3-2 at 768px) were load: they passed 9 of 9
  rerun alone.

## Repo paths

Acceptance: `e2e/lock-button-side.spec.ts` (new), and the 8 amended
specs above.

Runtime:

- `src/components/grid/PuzzleGrid.tsx`: the button's anchor (the first
  letter), side and rounded corners.
- `src/components/grid/PuzzleGridEditor.tsx`: the room rule (full width
  and 36px left of the grid, measured on resize too), the two-column
  12px inset, and the 36px gap.
- `src/lib/grid-max.ts`: the builder's hint-column thresholds.

Risk: all off the CODE-REVIEW risk paths. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Approved by the human and frozen in a specification-only commit on
  `main` before any runtime change. Frozen acceptance is unchanged after
  that.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check of the button's side and the delegated
  layout decisions above.
- Delivered on `main`; the handoff records observed results.
