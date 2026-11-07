# Story S11 — Tick hover

Resting the mouse on a locked word's tick mark darkens that word's cells
by 15%, every locked word ending at that cell where words share it, so
the builder can see which word a tick belongs to.

**Status: done (2026-11-07), except the human's visual check.** Frozen
at c621634, approved by the orchestrator under the handoff's delegation
after an independent specification review (no blockers; its suggestions
applied); implemented in 93f3771 on `main`, independently reviewed with
no blockers (see "Delivery"). From the human's visual testing
(EPIC "Changes from the human's visual testing", item 6, and its "Tick
hover (item 6)" decision). Adds to S2's "Tick marks". Depends on S2, S5,
S8 and S10 (delivered in e90d552): a tick sits in an end cell, and S10
decides what the mouse on an end cell does to a hovered word.

**Blast radius: small, expected off the risk paths.** Client components
in `src/components/grid/` and one pure helper in `src/lib/locked-words.ts`.
No `src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts` or `prisma/**` change (CODE-REVIEW "When
review applies"): the hover changes no stored or editor state. Direct
delivery to `main`.

## What the code does today

Inspected `PuzzleGrid.tsx`, `GridCell.tsx`, `PuzzleGridEditor.tsx`
(`cursorWord`, the lock target), `src/lib/locked-words.ts`,
`cell-appearance.ts`, the palette in `src/app/globals.css`, S10's story
and frozen `e2e/lock-hover.spec.ts`, and the lock specs' tick checks
(`lock-word.spec.ts`).

- **Ticks.** `PuzzleGrid` collects the end cells (`endCells`) of every
  locked word into a map keyed by cell, so a cell shared by several words
  gets one tick. Each is an absolutely placed overlay in its cell's grid
  area: a `pointer-events-none` wrapper holding a ¼×¼ `lock-tick` square
  in the top-right corner, clipped to a triangle
  (`polygon(0 0, 100% 0, 100% 100%)`), gray-500. They show only in the
  build phase with Preview off. The mouse passes through them to the cell.
- **Cell colors.** The cell wrapper carries the background from
  `cellAppearance`: white (`build-cell-on`) for letters, gray-200 for
  empty cells, yellow #fcff4d for the cursor, blue-medium #cfeeff for the
  cursor's word, blue-dull #cadae2 for the rest of its row or column.
  Locked letters are gray-500 (`GridCell` `isLocked`).
- **Outlines** are overlays over the grid lines, gray-500, also
  `pointer-events-none`.
- **Pointer handling.** `PuzzleGrid` listens to `pointerover` for
  Preview's tooltips (mouse only, by `data-coord`); S10 adds the hovered
  cell for a word's button, where "the end cell's part the button doesn't
  cover" counts as leaving the hovered word.
- **Lock button placement.** Across, over the left ⅔ of the after-end
  cell, vertically centered: clear of the tick. Down, over the top of the
  after-end cell, horizontally centered: it covers the tick's left
  sliver (about 3px of a Daily's ~10px tick).
- Nothing reacts to the mouse on a tick.

## Decisions

From the human (2026-11-06, EPIC "Changes from the human's visual
testing", "Tick hover (item 6)"):

- **Hovering a tick mark darkens every cell of each locked word ending at
  that cell by about 15%.** Where two words share the end cell, both
  darken.
- **Where:** the build phase with Preview off, where ticks show (EPIC
  "Where it applies").

### Delegated decisions

Proposed by the drafting agent, for the human's visual check:

- **15% darker** is exact. The cell's whole paint goes to 85% in each
  sRGB channel, the same as a 15%-black layer over it gives. White
  becomes about #d9d9d9, blue-medium about #b0cad9 and yellow about
  #d6d941. The test measures the cell's pixels in a screenshot, within ±4
  of 255, which allows about 13.5–16.5%. A layer of 15% black or
  Chromium's CSS `filter: brightness(0.85)` (applied in sRGB, 217 on
  white) both meet it. A different amount (10%, 20%) or a filter
  computed in linear light (an SVG `feComponentTransfer` in linearRGB,
  about 237 on white) does not.
- **What darkens:** each word cell, including whatever color it has now:
  white, the cursor's yellow, the word's blue-medium or the row's dull
  blue. Its letter and number darken with it, since the layer covers the
  whole cell. **The end cells don't darken**, including the hovered one,
  so the effect points at the word, not at the tick. The outline, the
  ticks and any lock button keep their colors.
- **The grid lines keep their color** (decided by the orchestrator under
  the handoff's delegation): only the cell boxes darken. The 1px lines
  between a word's cells, and around it, stay as they are.
- **Every locked word ending there**, not only two. One cell can end
  words across and down (CAT, DOG and OWL around one empty cell). An
  unlocked word ending at the cell doesn't darken. It has no tick of its
  own and isn't "locked".
- **Instant:** it shows at once with no fade or delay, and it goes at
  once when the mouse leaves the tick. There is no second's wait as for
  the button, because it's a quick "which word is this?" look and changes
  nothing.
- **The hover area is the tick's square**: the cell's top-right quarter
  each way. That is about 10px on a Daily at 620px, 8px on a Sunday and
  31px on a Mini. **This departs from item 6's literal "hovers/mouses
  over the triangle"**: the square's lower-left half, outside the drawn
  triangle, counts too. The reason is that the triangle alone (about
  50px² on a Daily, 35px² on a Sunday) is hard to hit and to stay on,
  while the square is still well clear of the letter and the rest of the
  cell. If the human prefers the triangle, 21-S11-4's square case is the
  one to correct. The grid lines around it aren't part of it. Where a down
  word's lock button covers part of the square, the mouse is on the
  button, not the tick.
- **No state changes.** The cursor, the highlight, `data-cell-state`,
  the lock button, focus and the saved puzzle stay as they were. A click
  on the tick is a click on its cell: it moves the cursor there as today,
  and the darkening stays while the mouse rests on the tick. Unlike
  S10's click, this doesn't end the hover, because the hover shows no
  button for the cursor to take over.
- **With S10:** for S10, the tick is part of its end cell. Moving onto it
  is moving onto the end cell, which leaves a hovered word: that word's
  button and unlocked outline go, per S10's "Leaving". An end cell is
  empty and protected (S3), and it can be Preview-black or Preview-red
  (EPIC "Where it applies"). Either way, the cursor's-direction run
  through it holds an empty cell, so it is never lockable, and it holds no
  locked word. S10 gives it no button, so resting on the tick never starts
  an S10 hover. The cursor's own button, if any, stays (S10's "a hovered cell
  with no button changes nothing"). Moving from the tick into a word's
  letters is moving onto a cell, and S10's second starts as usual.
- **It follows the tick:** if the tick goes while the mouse rests on it
  (the word is unlocked, or Preview is turned on by keyboard), the
  darkening goes at once. A word locked under a resting mouse shows its
  tick, which darkens nothing until the mouse moves onto it.
- **Focus:** it works whether or not the grid has focus.
- **Below the puzzle's own full width (S5 mode)** it works as at full
  width. The ticks show there, and a narrow window with a mouse benefits
  just as much. This differs from S10, which does nothing there because
  its button would compete with the toggle row's Lock Word. The tick hover
  has no control to compete with.
- **Mouse only.** A touch or pen tap on a tick moves the cursor and
  darkens nothing, as for S4's tooltip and S10's hover.
- **A rebus entry open:** no change. Rebus is never open on a locked
  letter or end cell (S3), and the tick hover works as usual.
- **Preview, the hints phase, a published puzzle:** no ticks, so nothing
  happens.

## Non-goals

- A tooltip, label or click action on the tick, or a keyboard way to
  reach it.
- Changing the tick's look, size or corner (S2), the outline, the lock
  button, S10's word hover or its rules, the highlight, or protection
  (S3).
- Darkening on hovering a locked word's letters (S10 covers hovering a
  word), or darkening unlocked words.
- Touch or pen hover.

## Acceptance (frozen)

### Unit: `src/lib/tick-words.test.ts` (new)

1. **21-S11-1 the locked words ending at a cell:**
   `lockedWordsEndingAt(grid, lockedWords, coord)` in
   `src/lib/locked-words.ts` (named apart from S10's `lockTargetAt`) gives
   every locked word with the cell as an end cell (S2's `endCells`), in the
   list's order. The fixture is an 8×7 grid with CAT at the left edge,
   DOG, OWL down sharing (3,1) with both, and EGG down to the bottom edge.
   The cases: (3,1) gives all three, in the list's order, for two
   different list orders. One-word end cells
   give their own word. An unlocked DOG is left out. The words' own
   letters, cells beside them and cells past an edge give none. The result
   comes from the stored words on an empty grid too. Inputs are unchanged.

### `e2e/lock-tick-hover.spec.ts` (new, 12 cases)

The setup is a Daily at 1440px (a 620px grid) unless a case says
otherwise. TANGENT runs across row 2. CAT and DOG run across row 7 with
the empty (5,7) between them, and OWL runs down column 5 below (5,7).
Each case locks its words through S2's button, or through S5's Lock Word
at 600px. Paint is read from a grid screenshot at each cell's lower left
(1/10 across, 92/100 down), clear of the letter, number, tick and button.
"Darker" means each channel is 85% of the cell's earlier color, ±4.
"Unchanged" means ±2. "At once" means within 500ms.

2. **21-S11-2 a tick darkens its word** (2). TANGENT and CAT are locked
   and the cursor is on an empty cell. On TANGENT's after tick, TANGENT
   darkens at once. Its end cells, CAT and the unlocked DOG are unchanged.
   After 1.5s there is still no lock button, the cursor hasn't moved,
   `data-cell-state` is unchanged, and the outlines and ticks are still
   gray-500. The rest of the end cell restores it at once. TANGENT's
   before tick does the same, and off the grid everything is restored.
   CAT's tick darkens only CAT.

   A second case, **without focus**: with the grid blurred, TANGENT's
   tick darkens it, and the grid gains no focus.
3. **21-S11-3 a shared end cell** (1). With TANGENT, CAT and OWL locked,
   the (5,7) tick darkens CAT and OWL (across and down). The unlocked DOG
   and TANGENT are unchanged, and so is (5,7) itself. With DOG locked too,
   all three darken, from 6 ticks.
4. **21-S11-4 the hover area** (1). The tick square's lower left, outside
   the triangle, darkens TANGENT, and moving within the square keeps it.
   The end cell's middle, its lower left, and spots just left of and just
   below the square darken nothing.
5. **21-S11-5 over the cursor's colors** (3). The cursor is in TANGENT,
   which has just been locked, so its "Unlock word" button shows. The
   yellow cursor cell becomes 85% yellow and the blue-medium cells 85%
   blue-medium. The dull-blue end cells are unchanged. The button is still
   "Unlock word", the grid keeps focus and the cursor stays.

   A second case, **it follows the tick**: with the mouse resting on the
   tick and TANGENT darker, Tab focuses the button and Enter unlocks
   TANGENT. The ticks go, and TANGENT's paint is back at once. A third
   case, **a down word's button wins**: the cursor is in locked OWL, down,
   so its button sits over the top of its after-end cell (5,11). On the
   part of the tick's square the button covers (79% across, 15% down), OWL
   is unchanged. On the tick's uncovered part (95% across, 10% down), OWL
   darkens.
6. **21-S11-6 with S10's hover and a click** (2).
   - Locked CAT is hovered until S10 shows its "Unlock word". Moving onto
     CAT's before tick removes the button within 300ms, and CAT darkens.
   - A click on TANGENT's tick moves the cursor to the end cell and the
     grid has focus. While the mouse rests there, TANGENT is 85% dull blue.
     Off the tick, it is dull blue.
7. **21-S11-7 where it does nothing** (2).
   - With Preview on, there are no ticks and the tick's spot changes no
     paint.
   - On a touch screen, a tap on the tick moves the cursor and TANGENT
     stays plain dull blue.
8. **21-S11-8 below the full width** (1). At 600px (a 584px grid), with
   TANGENT locked through the toggle row's Lock Word, its tick darkens it
   as at full width.

Every frozen test is unchanged. Two S10 cases touch an end cell:
21-S10-4 moves onto "the end cell's free corner", and 21-S10-3 hovers
cells that have no button. Both use unlocked words, which have no tick, so
the tick hover doesn't affect them.

### Discrimination (2026-11-07, observed)

- **Unit, on e90d552 (S10 delivered):** 6 of 6 fail with `TypeError:
  lockedWordsEndingAt is not a function`; `tsc --noEmit` reports TS2305
  for it and nothing else; ESLint passes on both new files. A scratch
  copy with a stand-in (`lockedWords` filtered by S2's `endCells`,
  deleted) passes 6 of 6, confirming the fixture.
- **E2E, `npm run test:e2e -- e2e/lock-tick-hover.spec.ts` on e90d552:**
  10 of 12 fail, as expected: 21-S11-2 (both), -3, -4, -5 (all three),
  -6 (both) and -8, each at its first "darker" check, after the setup,
  the locks and (21-S11-6) S10's hover had passed. The 2 guards pass:
  21-S11-7's Preview and touch cases.
- **The first-run check:** the grid fits the 1000px-high viewport with
  no page scroll (scratch measurement, deleted): at 1440px its box is
  y 292–912, at 600px y 230–814, and the page is 1000px high, so a
  screenshot can't scroll the page under a resting mouse.
- To be shown with the implementation: the spec passing, and mutations
  caught (10% instead of 15%, the end cells darkened too, the triangle
  alone as the hover area).

### Delivery (2026-11-07, observed)

- **93f3771** (runtime only: `src/lib/locked-words.ts`,
  `src/components/grid/PuzzleGrid.tsx`; `git diff c621634 93f3771 --
  e2e/ 'src/**/*.test.*'` empty). The tick stays `pointer-events-none`;
  a mouse-only `pointermove` on the grid finds a ticked end cell under
  the pointer and whether it is in the cell's top-right quarter. Each
  word cell of `lockedWordsEndingAt` gets a `pointer-events-none`
  `--palette-black` 15% layer in its own box, under the outlines, ticks
  and button.
- Implementer: `npm run verify` exit 0 (721 tests; the orchestrator's
  rerun also exit 0); this spec 12 of 12, and 36 of 36 with
  `--repeat-each=3`; seven lock, word-shape and reset-with-locks specs 74
  of 74. Mutations: 10% caught by 10 cases, the end cells darkened by 8
  (each at its "end cell unchanged" check), the triangle alone by
  21-S11-4. Full `npm run test:e2e`: 1177 passed, 1 failed
  (`library-play.spec.ts:312`, `ECONNRESET` in the auth helper while
  seeding), passing on `--last-failed`.
- Independent reviewer: no blockers; verify exit 0 (721 tests), this
  spec and S10's 32 passed. Non-blocking notes: the hover is worked out
  on mouse moves only, so a layout change under a still mouse (a window
  resize) can leave the shade stale until the next move.

## Repo paths

Acceptance: `src/lib/tick-words.test.ts`, `e2e/lock-tick-hover.spec.ts`.

Runtime:

- `src/lib/locked-words.ts`: `lockedWordsEndingAt`.
- `src/components/grid/PuzzleGrid.tsx`: the tick's hover area (mouse
  only, its square, clicks reaching the cell, part of the end cell for
  S10), and the darkening layer on the hovered tick's words' cells.
- Possibly `src/components/grid/PuzzleGridEditor.tsx`, only if S10's
  hovered-cell handling there needs to treat the tick as its end cell.

Risk: all three are off the CODE-REVIEW risk paths. Docs: this story,
`../EPIC.md` (stories list), `../HANDOFF.md`. Declare any other path
before editing it.

## Definition of done

- Approved (or delegated) and frozen in a specification-only commit on
  `main` before any runtime change, after S10 is delivered. Frozen
  acceptance is unchanged after that.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check of the tick hover and the delegated decisions
  above: how much darker, the end cells left plain, the hover area and
  S5 mode.
- Delivered on `main`; the handoff records observed results.
