# Story S9 — The grid's size by puzzle

A Mini's, Midi's and Daily's grid goes back to 620px at most; a Sunday's
stays 700px. The toggle row matches the grid's width, and Lock Word moves
to the toggle row below the puzzle's own full width.

**Status: frozen (2026-11-06), approved by the orchestrator under the
handoff's delegation after an independent specification review (no
blockers); its non-blocking suggestions were applied before freeze.** The
amendments to the frozen specs below were approved under the same
delegation. From the human's visual testing
(EPIC "Changes from the human's visual testing", item 8, and its "Grid
size" decision). Amends 17-S7's single 700px (Epic 17) and S5's "full
width". Depends on S5.

**Blast radius: small, expected off the risk paths.** Client components
only: the grid's width and the toggle row in `src/components/grid/`, play's
grid width in `src/components/play/`, and the hint lists' two-column
switch. No `src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts` or `prisma/**` change (CODE-REVIEW "When
review applies"). Direct delivery to `main`.

## What the code does today

Inspected `PuzzleGridEditor.tsx`, `BuilderSteps.tsx` (`BuilderSteps`,
`ToggleRow`), `HintSkeleton.tsx`, `HintsPanel.tsx`, `HintBox.tsx`,
`PuzzleTitle.tsx`, `PlayPuzzle.tsx`, `PlayerHints.tsx`,
`ProminentHint.tsx`, `PlayHintBar.tsx`, `PuzzleGrid.tsx`, the style guide
(`GridExamples.tsx`, `src/app/style-guide/page.tsx`), the builder page's
padding (`src/app/puzzles/[id]/page.tsx`), 17-S7, 21-S5, and every frozen
spec that measures the grid or a threshold.

- **Width.** `GRID_MAX_PX = 700` in `PuzzleGridEditor` and `PlayPuzzle`
  for every size (17-S7). The narrow builder's column is
  `max-w-[700px]`; play's narrow column and its grid column are
  `--play-grid-width`, set from `GRID_MAX_PX`.
- **Bars.** The build and hints phases have a toggle row (`ToggleRow`,
  `w-[700px] max-w-full`): Preview or Lock Grid Letters at the left, Lock
  Word (S5, build only) and Rebus at the right; wide in the hints phase,
  Preview Hints has its own panel beside it (`flex-1`). The step row
  (`BuilderSteps`) has no width of its own. Play has no toggle row: wide,
  the Prominent Hint is in the grid's column with the Rebus pill beside
  it; narrow, the hint bar and the Rebus pill sit under the grid. The Hint
  Box (narrow hints phase) is inside the grid's own wrapper, so it is
  already the grid's width, as are play's Prominent Hint and hint bar
  (`--play-grid-width`).
- **Breakpoints.** The builder is narrow below 1092px of room (a 1140px
  window), play below 1382px (a 1430px window), and the page's side
  padding is 8px below a 748px window. The builder's Across and Down
  columns (`HintSkeleton`, `HintsPanel`, Preview Hints' `PlayerHints`)
  stack below 650px of their own room, which beside a 700px grid is a
  1430px window. So the grid is 700px down to a 716px window, then the
  window less 16px.
- **S5's full width.** `isGridFullWidth` compares the grid region's width
  with `GRID_MAX_PX` (700). Below it, Lock Word is in the toggle row; at
  it, S2's button beside the word.
- **Type.** A 21×21's letters and numbers are the NYT's, by
  `grid.cols === 21` in `PuzzleGrid` (17-S7's correction); the other
  sizes' letters are 16/35 of the pitch, their numbers 10px with an 8px
  floor. Both follow the pitch.
- **Style guide.** The Hint Box and play hint bar samples are 700px
  (`max-w-[700px]`), `sg-grid-corner` is a 21×21's corner at the 700px
  pitch, and the `ToggleRow` samples are 700px.

## Decisions

From the human (2026-11-06, EPIC "Changes from the human's visual
testing", item 8):

- **The grid is at most 620px** for a Mini (5×5), Midi (9×9) and Daily
  (15×15), and **700px for a Sunday (21×21) only**, in the build phase
  (Preview included), the hints phase and play. Cells share 1px lines: a
  pitch of (width − 1) / size.
- **The toggle row is the grid's width** in the build and hints phases
  (the human's "control bar with the preview toggle and rebus buttons").
  Play has no such bar (see Delegated decisions).
- **S5's "full width" is the puzzle's own:** Lock Word is in the toggle
  row whenever the grid is narrower than 620px (700px on a Sunday); at
  that width, S2's button beside the word.
- **The page's layout breakpoints stay as they are for every size:**
  narrow builder below a 1140px window, narrow play below 1430px, 8px
  side padding below 748px, and the builder's two hint columns stacking
  below 1430px (see Delegated decisions for the last).
- **Shrinking:** below a 636px window a 620px grid is the window less
  16px (8px of padding a side), as a 700px grid is below 716px.

### Delegated decisions

Proposed by the drafting agent, for the human's visual check:

- **"Sunday" is a 21-column grid**, the test `PuzzleGrid` already uses
  for a Sunday's type. Every other grid (including any non-standard size
  in "Other sizes") is 620px.
- **The narrow builder's column is the grid's width** (620 or 700px),
  centered, as 15-S3's "one column at the grid's width": the title, step
  row, toggle row, grid and Hint Box all line up at 620px on a Daily.
  The step row keeps no width of its own (it isn't a bar).
- **The Hint Box, the Prominent Hint and play's hint bar follow the
  grid's width**, as they do now (15-S4, 15-S5, 17-S7's correction).
  Play has no toggle row; these are the readings of "applies to build,
  hint, and play phases" there.
- **Type is unchanged** (17-S7's correction): a Sunday's letters and
  numbers keep the NYT's proportions; the others keep 16/35 of the pitch
  and 10px numbers, which now follow a 620px grid's pitch.
- **The orchestrator accepted** the hint-column reading below
  (2026-11-06).
- **The two hint columns stack at the same 1430px window for every
  size.** 17-S7's table lists this stacking as one of the layout's
  thresholds, so "breakpoints stay as they are" keeps it: beside a 620px
  grid the columns need 730px of room (650px beside a 700px one). The
  alternative, stacking by the columns' own 650px (a 1350px window beside
  a 620px grid), would move a breakpoint by size. Applies to the build
  phase's skeleton, the Hint Inputs and Preview Hints; play's lists don't
  stack.
- **Wide, the room the smaller grid frees goes to the hints**: the grid
  stays at the left, the hints 32px from it, now 80px wider; the hints
  phase's Preview Hints panel still starts 32px right of the toggle row.
- **The style guide's samples are unchanged**: the Hint Box, play hint
  bar and `ToggleRow` samples stay 700px (a Sunday's width, the widest the
  bars get), and `sg-grid-corner` is a Sunday's.
- **A published puzzle's empty toggle row** (wide, invisible, keeping the
  grid in place) is the grid's width too.

## Non-goals

- Changing any breakpoint, the page's padding, or the 1800px main area.
- Changing the type of any size (17-S7's correction stands).
- Changing the library, the front page or other pages' `max-w-[700px]`
  (`PuzzleLibrary.tsx`, `src/app/page.tsx`), which aren't the grid.
- Changing the style guide's samples.
- A size other than 620 or 700px, or a size the builder picks.

## Acceptance (frozen)

Widths: 1440px (wide), 1430/1429px and 1140/1139px (the breakpoints),
716px (a Sunday's 700px with 8px of padding; a Daily's 620px centered),
636px (a Daily at exactly 620px), 635px (619px), 715px (a Sunday at
699px) and 375px. Bars are measured against the grid's box.

### `e2e/grid-size-by-puzzle.spec.ts` (new, 33 cases)

1. **21-S9-1 the build phase and Preview** (4): at 1440px, a 5×5, 9×9 and
   15×15 are 620px square at a (620 − 1) / size pitch, a 21×21 700px at
   (700 − 1) / 21; the toggle row is the grid's width over its left edge;
   the same with Preview on.
2. **21-S9-2 the hints phase** (6): the same four sizes and the toggle
   row at 1440px, the hints 32px right of the grid; narrow (1139px), a
   15×15's and a 21×21's column centered at the grid's width: the grid
   centered, the toggle row, the title and the Hint Box at its left edge
   and width.
3. **21-S9-3 play** (6): at 1440px, the four sizes at 620/700px, the
   Prominent Hint at the grid's left edge and width; narrow (1429px), a
   15×15 and a 21×21 centered, the hint bar at the grid's width.
4. **21-S9-4 a Daily's breakpoints are a Sunday's** (3): the builder wide
   at 1140px (hints 32px beside, `title-1`), narrow at 1139px (no hints
   region, `title-3`); the hint columns side by side at 1430px, stacked
   at 1429px; play wide at 1430px (title, lists, no bar), narrow at
   1429px.
5. **21-S9-5 shrinking** (8), in the builder (with the toggle row at the
   grid's width) and play: a Daily at 716px is still 620px, centered; a
   Daily and a Mini at 636px are 620px, 8px in; at 635px the window less
   16px, 8px in; a Daily at 375px the window less 16px; a Sunday at 716px
   700px, at 715px the window less 16px, 8px in.
6. **21-S9-6 Lock Word's full width is the puzzle's** (6): TANGENT across
   row 3 of an empty Daily and Sunday, cursor on its N. A Daily at 1440px
   and 636px (grid 620px) and a Sunday at 1440px and 716px (700px): S2's
   button beside the word within 1.5s, no toggle-row Lock Word. A Daily
   at 635px (619px) and a Sunday at 715px (699px): the toggle row's Lock
   Word, enabled within 300ms, reading "Lock Word", and no button beside
   the word after 1.5s.

### Amended acceptance

Frozen specs that assume a 700px grid for a size other than a Sunday.
Where a case is about the 700px value or its boundaries, its fixture
becomes a 21×21 and its numbers stay; where it is about a layout around
the grid, its numbers become the 620px grid's. What each case checks is
unchanged. Each file's header comment says "Amended by 21-S9" and what
changed.

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/build-grid-design.spec.ts` | 14-S5-3 size (4) | every size "is 700px wide", pitch 699 / size | a 5×5, 9×9 and 15×15 620px, pitch 619 / size; a 21×21 700px |
| | 14-S5-4 letters and numbers, 15×15 and 5×5 (2) | letters (699 / size) × 16/35 px | (619 / size) × 16/35 px |
| `e2e/grid-size.spec.ts` | 15-S1-2 build phase (2), hints phase (1); 15-S1-3 sizes (3), short window (1) | 700px for every size | 620px, a 21×21 700px (`gridPx(size)`), in names and checks |
| `e2e/hint-preview-alignment.spec.ts` | 18-S7-2 (12), a 15×15 | grid width 700px | 620px; the windows unchanged (comment: 730px of room beside a 620px grid) |
| `e2e/larger-grid.spec.ts` | 17-S7-1 build phase, 5×5 and 15×15 (2) | 700px, pitch 699 / size | 620px, pitch 619 / size (the 21×21 stays 700px) |
| | 17-S7-1 "a 15×15 in the hints phase and in Preview", "a 15×15 in play" (2) | a 15×15 | a 21×21, 700px |
| | 17-S7-2 (4), 17-S7-3 (4), 17-S7-4 (2) | a 5×5 | a 21×21; numbers unchanged |
| | 17-S7-6 guards, 5×5 and 15×15 (2) | named "at 700px" | named "at 620px" (no check changes) |
| | 17-S7-8 (3) | "at 700px", pitch 699 / size | "at 620px", pitch 619 / size |
| `e2e/lock-word-toggle-row.spec.ts` | 21-S5-1 1440px, 716px, 715px, resizing (4) | full width 700px; 716px and 715px | 620px; 636px and 635px |
| `e2e/narrow-builder.spec.ts` | 15-S3-1 at 1139px (2), 15-S3-2 (6), 15-S3-8 (1) | a 700px grid and column | 620px (a 5×5; the published fixture's 3×3) |
| `e2e/narrow-play.spec.ts` | 15-S5-2 (2) | 700px | 620px (15-S5-10's style-guide sample stays 700px) |
| `e2e/play-design.spec.ts` | 14-S7-1 unselected | at most 700px | 620px (a 3×3) |
| `e2e/small-screens.spec.ts` | 15-S6-1 (8) | a 5×5 | a 21×21 at 748, 716 and 715px; numbers unchanged. At 414 and 375px the 5×5 stays (the window less 16px either way) |
| `e2e/wide-layout.spec.ts` | 15-S2-2, -3 (6), -4 (6), -5 (2), -6 (2) | a 700px grid | 620px (a 5×5 or 15×15); the windows unchanged |
| `e2e/word-shape.spec.ts` | 21-S8-4 narrow | a 700px window | 600px (a Daily is its full 620px at 700px) |

Every other frozen test is unchanged. `hint-box.spec.ts` 15-S4-9 and
`narrow-play.spec.ts` 15-S5-10 (the style guide's samples at 700px),
`larger-grid.spec.ts` 17-S7-5 and 17-S7-7 (Sunday), and
`grid-size.spec.ts`'s "clicking a cell leaves the page where it was"
(row 5 is still in view at 620px) pass as they are.

### Discrimination (2026-11-06, observed)

- **After the spec review's suggestions** (the 5×5 kept at 414 and 375px
  in `small-screens` 15-S6-1, comments only elsewhere): with the
  throwaway, `small-screens.spec.ts` 34 passed. Those two cases are
  unchanged from the frozen file there, so they pass on `main` too. The
  reviewer saw the new spec and all 11 amended specs pass (265) with
  the throwaway.
- **`main` (79af958) with the proposed and amended tests**, after `npm
  run pretest:e2e`: the new spec failed 14 of 33: every 620px case in
  21-S9-1, -2 and -3 (11), "a Daily at 716px is still 620px", and 21-S9-6
  at 1440px and 636px on a Daily. Passing, as guards: every Sunday case;
  21-S9-4 (the breakpoints, unchanged); the shrink cases at 636px and
  below (on `main` the grid is the window less 16px there too); the
  toggle-row Lock Word at 635px and 715px. The amended files failed 57 of
  231, each a case whose numbers became 620px: `build-grid-design` 5,
  `grid-size` 5, `hint-preview-alignment` 12, `larger-grid` 5,
  `lock-word-toggle-row` 2 (1440px and 636px), `narrow-builder` 9,
  `narrow-play` 2, `play-design` 1, `wide-layout` 16. The cases moved to
  a 21×21 (`larger-grid` 17-S7-1/-2/-3/-4, `small-screens` 15-S6-1) and
  `word-shape`'s 600px pass on `main`, as intended.
- **Throwaway implementation** of the Decisions (reverted, not committed;
  `/tmp/21-s9/throwaway.patch`): a `gridMaxPx(cols)` (700 for 21 columns,
  620 otherwise) in `PuzzleGridEditor` (grid, narrow column via
  `--grid-max`, S5's full width) and `PlayPuzzle`; `ToggleRow`
  `w-(--grid-max,700px)`; the two hint columns from 730px of room beside
  a 620px grid. `npm run verify` exit 0 (710 unit tests). The full `npm
  run test:e2e` **before the amendments**: 1068 passed, 78 failed: 76 in
  the eleven amended files above, plus `done-icon` 18-S5-5 (known flake)
  and `library-play` P5 (passed alone after a test-database reset; it
  fails on a library left full by earlier runs). **With the
  amendments**: 1145 passed, 1 failed, `row-menu` 16-S2-8, which passed
  alone (2 of 2). The new spec's 716px case was added after that run;
  the revised spec passed 33 of 33 against the throwaway.
- **Two mutations on the throwaway**, each caught: the hint columns
  stacking by their own 650px (21-S9-4's 1429px case failed, 1); the
  toggle row left at `w-[700px]` (21-S9-1's and 21-S9-2's three 620px
  sizes, 6).
- `tsc --noEmit` and ESLint pass on the new and amended tests.

## Repo paths

Acceptance (immutable after freeze): `e2e/grid-size-by-puzzle.spec.ts`
and the eleven amended specs above.

Runtime:

- `src/components/grid/PuzzleGridEditor.tsx`: the grid's width by size,
  the narrow column, S5's full width.
- `src/components/grid/BuilderSteps.tsx`: `ToggleRow` at the grid's width.
- `src/components/grid/HintSkeleton.tsx`, `HintsPanel.tsx` and
  `src/components/play/PlayerHints.tsx`: the two columns from a 1430px
  window for every size.
- `src/components/play/PlayPuzzle.tsx`: play's grid width by size.
- Possibly a small shared helper in `src/lib/` (not `puzzle-storage.ts`)
  for the width by size.

Docs: this story, `../HANDOFF.md`. Declare any other path before editing
it.

## Definition of done

- Approved and frozen in a specification-only commit on `main`, with the
  amendments, before any runtime change; frozen acceptance unchanged after.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check of a Mini, Midi, Daily and Sunday in build,
  hints and play, wide and narrow.
- Delivered on `main`; the handoff records observed results.
