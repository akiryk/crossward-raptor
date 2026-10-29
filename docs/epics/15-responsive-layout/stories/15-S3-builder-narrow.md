# Story S3 — Builder, narrow

Below a 1000px window, the builder is one column at the grid's 560px
width, centered: the title in `title-3`, the numbered buttons with the
toggle 20px after them, and tighter spacing. Below the grid, only Preview's
legend in the build phase and the hints in the hints phase. From 1000px
up, S2's wide layout holds.

**Status: approved and frozen** (2026-10-29). The human answered the
four questions, changing question 2 to the toggle 20px after the buttons,
and approved the draft *(human)*; frozen in `36529ab`. **Implemented** on
`main` the same day: `npm run verify` exit 0 (595 Vitest tests), the
spec 20 of 20, full `npm run test:e2e` 703 of 703, no frozen case
retired or amended. The human's visual check passed 2026-10-29
*(human)*: **done**.

**Blast radius: small.** The client components `PuzzleGridEditor`,
`HintSkeleton` and `PuzzleTitle`. No server, schema, engine, token or
risk path, so delivery is direct on `main` under CODE-REVIEW.

## Decisions

Inspected the builder page's `p-6` wrapper, `PuzzleGridEditor`,
`PuzzleTitle`, `BuilderSteps`/`PublishedState`, `PreviewToggle`,
`PreviewLegend`, `HintSkeleton`, the frozen specs that open the builder
below 1024px (`editor-layout`, `grid-rendering`, `build-grid-design`) and
S2's `wide-layout`. A throwaway measured the controls: the build phase's
buttons are 419px wide and Preview 101px; the hints phase's buttons (1
done, 70px) are 340px and Lock Grid Letters 162px. Both rows fit 560px.

### The threshold _(human, question 1)_

- **Narrow below 952px of room in the editor**, a 1000px window
  (1000 − 2 × 24 padding). A container query on the editor
  (`@container/editor` on `puzzle-editor`), per the epic's "thresholds
  set by content", replaces the `lg` (1024px) breakpoint that stacks the
  hints today, in `editor-layout`, `hints-region` and `HintSkeleton`.
- From 1000px up, S2's layout holds unchanged. Between 1000 and 1023px
  the hints now stay beside the grid, one 360–383px column, where they
  moved below it until now.

### One centered column _(human, the epic's Decision)_

- The title, the controls row, the grid and what's below it share one
  column 560px wide, centered in the editor. Below 608px (S6) it narrows
  with the window, as the grid does today.
- The title fills the column's width. The page keeps its 24px padding.

### The title _(human)_

- `title-3` below 1000px, `title-1` from 1000px up. Its hover and focus
  underline is unchanged.

### The toggle beside the buttons _(human, question 2)_

- Preview (build phase) or Lock Grid Letters (hints phase) sits in the
  buttons' row, vertically centered on them, **right after the buttons,
  20px from them**. The row is 540px wide in the build phase (419 + 20 +
  101) and 522px in the hints phase (340 + 20 + 162), within the column.
- The row wraps if it can't fit (a column under 540px, a window under
  about 588px, S6's range), the toggle going under the buttons, so
  nothing overflows at 375px.

### Tighter spacing _(human, question 3)_

- **16px from the title to the controls row, and 16px from the row to the
  grid**, where the wide layout has 32px and 63px (the toggle's row, 27px
  above it and 12px below).
- Nothing else changes: the legend stays 16px under the grid.

### Below the grid _(human; the hints phase, question 4)_

- **Build phase:** the skeleton doesn't show (as below `lg` today). With
  Preview on, the legend shows under the grid within its width, as now.
- **Hints phase:** the hint list stays below the grid, 24px under it, at
  its width and unscrolled (the page scrolls), as it does below `lg`
  today, until S4 replaces it with the Hint Box. This keeps the hints
  phase usable on `main` between the two stories; the epic's "below the
  grid means one hint at a time" is met at S4.

### The published state _(human)_

- "Published" and "Play it!" take the buttons' place in the column, 16px
  below the title and 16px above the grid. A published puzzle has no
  toggle.

### Not changed

- The wide layout (S2), the grid's size, colors and behavior; the
  buttons, toggles and legend themselves; the dialogs.
- Saving, publishing, keyboard entry and the engine (`src/engine/**`).
- The style guide: S3 adds no component (the Hint Box's sample is S4's).

## Non-goals

- The Hint Box and its rule, arrows and order (S4).
- Narrow play (S5).
- The grid shrinking, and anything at 375px beyond not overflowing (S6).

## Questions for the human

Answered by the human 2026-10-29, beside each question.

1. **Threshold.** Narrow below a 1000px window, measured as 952px of room
   in the editor. OK? Between 1000 and 1023px the hints then stay beside
   the grid as one 360–383px column.
   Yes.
2. **The toggle's place.** At the row's right end, aligned with the
   grid's right edge (proposed), or right after the buttons, at a gap
   you give (say 20px)?
   Right after the buttons using 20px spacing.
3. **Spacing.** 16px from the title to the row and 16px from the row to
   the grid? I can't see mockup 1; if it gives other values, they win.
   16px is fine.
4. **The hints phase until S4.** Keep the full hint list below the grid
   (proposed), so the hints phase stays usable between S3 and S4? Or
   leave the place empty in S3 (hints can't be entered below 1000px
   until S4), or merge S3 and S4 into one story?
   Yes.

Also noted, for S6 rather than now: the grid needs 608px (560 + 2 × 24),
not the epic's "about 606px", before it shrinks.

## Retired and amended acceptance

None: the full run at implementation passed 703 of 703.
The one frozen case the throwaway first broke, 14-S5-7's style guide
skeleton sample, was the throwaway's bug (the skeleton showed only inside
the editor's container), fixed in it, not a superseded test.

## Acceptance (proposed)

`e2e/narrow-builder.spec.ts` (new), 20 cases:

- **15-S3-1 the threshold (4):** in each phase, at 1000px the grid at the
  editor's left with the skeleton or hints 32px right of it and level
  with it; at 999px a 560px grid centered in the editor, the skeleton
  hidden or the hints below the grid.
- **15-S3-2 one centered column (6):** in each phase at 999, 768 and
  640px: a 560px grid centered in the editor, the title from its left to
  its right, the buttons from its left, the toggle within its width, and
  no horizontal overflow.
- **15-S3-3 the title (2):** at 768px its font size, line height and
  weight are `title-3`'s; at 1000px `title-1`'s.
- **15-S3-4 the toggle beside the buttons (3):** in each phase at 768px,
  20px right of the buttons and centered on them; at 1000px Preview still on
  its own row below the buttons.
- **15-S3-5 tighter spacing (2):** in each phase at 768px, 16px from the
  title to the buttons and from the buttons to the grid.
- **15-S3-6 below the grid, the build phase (1):** at 768px no skeleton;
  with Preview on, the legend under the grid from its left within its
  width, and still no skeleton.
- **15-S3-7 below the grid, the hints phase (1):** at 768px the hint
  list 24px under the grid, from its left, at its width, not scrolling in
  its own box.
- **15-S3-8 the published state (1):** at 768px "Published" from the
  grid's left, "Play it!" within the column, 16px from the title and 16px
  above the grid, no horizontal overflow.

### Acceptance choices

- Lengths use `toBeCloseTo(…, 0)` (±0.5px), as S1 and S2; type values
  are compared with the tokens as the page resolves them.
- 1000 and 999px bracket the threshold; 640px is the narrowest width
  where the column is still the full 560px (S6 owns below 608px).
- Fixtures are a filled 5×5 (every word survives into the hints phase),
  the legend's a 5×5 with one corner letter (a symmetry error), and the
  published state uses the play fixture owned by the signed-in builder.

### Discrimination (2026-10-28, observed, before question 2's answer)

The answer to question 2 changed two assertions: 15-S3-2's toggle is
now within the column, not at its right edge, and 15-S3-4's is 20px
after the buttons, not just right of them. Both still fail against
`main`, where the toggle is on its own row under the buttons' left.
The throwaway is gone from `/tmp`; the implementation reruns the spec
and the full suite.

- **Against `main`'s runtime:** 17 of the 20 fail. 3 pass as guards: the
  title still `title-1` at 1000px, Preview still on its own row at
  1000px, and the build phase's legend at 768px, which `main` already
  shows under the grid with no skeleton.
- **Against the throwaway** (`/tmp/crossward-drafts/15-S3-throwaway.patch`):
  all 20 pass. **The full `npm run test:e2e` has not completed.** A
  first run was cut short at 494 of 703 when I overlapped a second run
  on the shared database; before that it failed only 14-S5-7's style
  guide sample (the throwaway's bug, since fixed) and seven `new-puzzle`
  cases timing out on `page.goto` while the runs overlapped. Two later
  runs never started tests: the machine was out of memory (15.9 of
  17.4 GB swap in use) and the harness's production build took about 8
  minutes, past its 180s web-server wait. To rerun before freeze.

## Repo paths

Runtime: `src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/HintSkeleton.tsx` and
`src/components/puzzle/PuzzleTitle.tsx`.

Acceptance: `e2e/narrow-builder.spec.ts` (new).

## Definition of Done

- The human answers the questions and approves this specification and
  its acceptance, recorded here and in the handoff (done 2026-10-29).
  Freeze on `main` in a specification-only commit.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes: the builder (both phases, Preview, the
  published state) at 999, 768 and 640px, and unchanged at 1000px.
