# Story S5 — Preview's fade and the would-be word

Turning Preview on or off fades the grid's colors over half a second
instead of snapping. In the build phase with Preview off, the cursor's
word is the word its cell would belong to if it held a letter, so an off
cell between CRAP and APE highlights both.

**Status: Approved and frozen 2026-11-08** by the orchestrating session
under the human's delegation, after an independent review of the draft
(no blockers; its should-fix finding and nits all addressed). Drafted
2026-11-08 under the human's delegation
([handoff](../HANDOFF.md#orchestration)), from the human's small changes
before the final visual check and the orchestrator's decisions; revised
after the independent spec review (no blockers; its findings addressed
below). Amends one Epic 21 frozen test (listed below) under that request
and delegation.

**Blast radius: small, off the risk paths.** `src/lib/build-word.ts` (a
new function beside `buildWord`), `src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/PuzzleGrid.tsx`, perhaps `src/lib/cell-appearance.ts`
and `src/components/style-guide/GridExamples.tsx`. `PuzzleGridEditor.tsx`
also reads `isCellProtected` (`src/lib/locked-keys.ts`, unchanged) to
choose the word. Direct delivery to `main`.

## The human's request

As given (2026-11-08; the screenshots are not kept):

> 1. When I turn preview on and off, I don't want the cells to just snap to black or to gray -- I want there to be a transition over, say half a second or so (something that feels natural but quick)
>
> 2. I want to change the rule about what we choose to highlight when a cell is selected during the build phase. Currently, if I click on a cell inside a word (meaning, inside a cell that's white either because it has a letter or because it *should* have a letter for symmetry) AND my direction mode aligns with the word's direction (e.g. they are both horizontal) THEN we highlight the word by making its cells blue-medium. This is great. Here is an example screenshot. [screenshot]. Now, imagine I click on the cell between CRAP and APE while remaining in horizontal mode. This is what we see: [screenshot]. It's not as helpful as it could be, because -- were I to add a letter to this cell -- both CRAP and APE would be included. Therefore, we should highlight both of those words in blue. Another example: [screenshot]. I've selected the cell below SIR while in vertical mode. If I add a ltter, the word SIR would be affected. Therefore, we should highlight the word SIR in medium blue. Does this provide enough for you to come up with a rule?

## What the code does today

- **The cursor's word** (`PuzzleGridEditor.tsx`, `cursorWord`) is
  `buildWord(grid, cursor.current, cursor.orientation)`
  (`src/lib/build-word.ts`, 21-S1/21-S8): the run through the cell of
  cells Preview keeps white (`intendedGeometry`: lettered cells and
  symmetric hints), 2 or more, else null. On an off cell (active, empty,
  not a symmetric hint) it is always null.
- **How it shows** (`cellAppearance`, `src/lib/cell-appearance.ts`;
  21-S14): the cursor `selected` (yellow-bright); the word's other cells
  `slot-letter` or `slot-required` (blue-medium,
  `build-cell-selected-row-on`); the rest of the line as outside the
  highlight. With no word, the line's off cells are `slot` (dull blue,
  `build-cell-selected-row-off`), its letters and symmetric hints white.
  `data-highlight="slot"` marks the whole active row or column either way.
- **`buildWord`'s other callers:** `lockableWord` (`locked-words.ts`, so
  the lock button and Lock Word), the lock hover's run key and the style
  guide's build sample (`GridExamples.tsx`).
- **Preview** (`isPreviewing`, not saved) switches `PuzzleGrid`'s `mode`
  between `build` and `preview`. Each cell wrapper's background is a class
  per mode (`BUILD_BG`, `PREVIEW_BG`, highlight classes); the grid's lines
  are the container's background (`build-cell-border` gray-400,
  `preview-cell-border` gray-500); a locked word's letters are gray-500
  with Preview off and black in Preview (locks show only with Preview
  off), with their outlines, ticks and lock button. Nothing in the grid
  has a transition: every change is instant.
- **Motion in the suite:** Playwright runs with `reducedMotion: 'reduce'`;
  a test can emulate `no-preference` (22-S3 does).
- **22-S4-13b** (`tooltip-source.test.ts`) bans `setTimeout` in any file
  that mentions a tooltip, `PuzzleGrid.tsx` included.

## Decisions

From the human and the orchestrator:

- **The would-be word.** In the build phase with Preview off, the cursor's
  word is the word the cursor's cell would belong to, in the cursor's
  direction, if it held a letter. On a cell already white in Preview's
  geometry (a letter or a symmetric hint) that is exactly today's
  `buildWord`. On an off cell it is the run through that cell in
  `intendedGeometry` of the grid with a letter placed there (so the cell's
  symmetric counterpart turning white is accounted for), when that run has
  2 or more cells. Examples: the off cell between CRAP and APE, across:
  CRAP, the cell and APE; the cell below SIR, down: SIR and the cell.
- **Shown as any word** (21-S1, 21-S14): the cursor yellow-bright, the
  word's other cells blue-medium, the rest of the line as outside the
  highlight. If the run is just the cursor's cell (no white neighbor that
  way), 21-S14's no-word look stays: the line's off cells dull blue.
- **Preview, the hints phase and play are unchanged.**
- **Not where a letter can't be typed** (decided by the orchestrator after
  the spec review, to report at the visual check): on a protected cell
  (`isCellProtected`, `src/lib/locked-keys.ts`: a locked word's letter or
  end cell, in any direction; 21-S3), the would-be word does not apply and
  the editor uses `buildWord`, today's word. On a locked word's end cell,
  an off cell, that is no word: 21-S14's look, even between two words.
  This follows the human's "were I to add a letter" literally: no letter
  can be added there. `wouldBeWord` itself knows nothing of locks; the
  editor chooses.
- **Changes during a fade may ease** (accepted by the orchestrator after
  the spec review): a cursor move or a typed letter within the fade's
  500ms window may ease with it; outside the window every other change is
  instant.
- **Preview fades.** When Preview turns on or off, every grid cell's
  background, and its letter's color where that changes, moves to the new
  color over 500ms, ease-in-out. Only the toggle fades: cursor moves,
  typing and highlight changes stay instant. With
  `prefers-reduced-motion: reduce`, no fade.

### Delegated decisions (drafting agent)

**The function.** `wouldBeWord(grid, coord, orientation): Coord[] | null`
in `src/lib/build-word.ts`, beside `buildWord`: on an active empty cell,
`buildWord` of the grid with a letter placed there (any letter; the input
grid is not changed); on any other active cell, `buildWord` itself; on a
black cell (a grid saved before 14-S5), null. Only the counterpart can
change color by placing one letter, so nothing else joins. The build
highlight (`cursorWord`) uses it, except on a protected cell (above):
`isCellProtected(grid, lockedWords, cursor.current) ? buildWord(…) :
wouldBeWord(…)`.

**The counterpart in the word.** When the cell's counterpart lands in the
run (only on the center row or column of an odd grid, next to the run),
it shows as the symmetric hint it would become: `slot-required`,
blue-medium. Every cell of a word other than the cursor is then
blue-medium, which is what "highlight the word" asks; showing it dull
blue or gray would cut the word in two. The state follows the word, not
the current grid: off the cursor's word it is a plain off cell again
(`empty` or `slot`). Typing the letter makes it a real symmetric hint, and
the highlighted cells don't change. Within the cursor's word, then, every
empty cell other than the cursor is `slot-required` (today such a cell is
always a symmetric hint). One way: `PuzzleGrid` passes `isSymmetricHint`
true for an empty cell in `cursorWord`; or a new `cellAppearance` input.
Either way `cellAppearance`'s frozen 21-S14 unit cases hold.

**Locks keep `buildWord`.** `lockableWord` (the lock button, Lock Word),
`lockTargetAt`, the lock hover's run key and `tickTarget` are unchanged.
An off cell's would-be word always holds the cursor's empty cell, so it is
never complete, never lockable: following it would change nothing for
locks, while the hover's wait keys would start running on off cells for
words that can't lock.

**The style guide's build sample** (`GridExamples.tsx`) may switch to
`wouldBeWord` so the app has one "cursor's word"; its cursor is on a
letter, so nothing it shows changes.

**What fades.** On the toggle, each grid cell's background; a letter's
color where it changes (a locked word's gray letters turning black and
back); and the grid's lines (the container's background, gray-400 ↔
gray-500), so lines and cells move together. Not faded: the lock
outlines, ticks and button, which appear and go at once; the legend and
the toggle row (the progress bar keeps its own S3 animation; the toggle
keeps its 150ms); the cells' `data-cell-state` and the grid's
`data-grid-mode`, which change at once.

**The curve.** 500ms, CSS `ease-in-out` (`cubic-bezier(0.42, 0, 0.58,
1)`), no delay: symmetric, slow at both ends, half way at 250ms. Not
Tailwind's `ease-in-out` utility, which is `cubic-bezier(0.4, 0, 0.2, 1)`
(an ease-out-heavy curve, 77% of the way at 250ms); use e.g.
`ease-[ease-in-out]`.

**Only the toggle.** The transition is in place from the toggle for the
fade's 500ms (plus a small margin to end it) and gone after, so other
changes are instant outside a fade. During a fade, a cursor move or a
typed letter may ease too: accepted by the orchestrator, and not tested
(keeping them instant mid-fade would need per-cell bookkeeping for half a
second of overlap). A
second toggle during a fade starts a new fade from the colors where they
are, with no jump (CSS transitions reverse this way), and restarts the
window. Reduced motion: no transition at all (`motion-reduce:`).

**Constraints the acceptance sets on the approach:**

- A CSS transition (recommended) or a Web Animation, visible through
  `Element.getAnimations()`; a `requestAnimationFrame` color fade in
  script would not be seen, and would fail.
- The transition must be in place in the same render as the mode change
  (e.g. a fading flag set with `isPreviewing` in `changePreview`), not an
  effect later: the test pauses the grid's animations as soon as the
  mode attribute changes.
- The timer ending the fade's window can't live in `PuzzleGrid.tsx`
  (22-S4-13b); keep it in `PuzzleGridEditor.tsx` (with cleanup), or end
  the window on `transitionend`.

**Recommended approach** (not required): `changePreview` sets a fading
state with a counter; `PuzzleGrid` gets an `isFading` prop that adds
`transition-colors duration-500 ease-[ease-in-out]
motion-reduce:transition-none` to the grid and the same to its cells and
letters; an effect keyed on the counter clears it after about 600ms.

## Non-goals

- Any other change to the highlight: Preview's word (17-S4), the hints
  phase, play, `data-highlight`, the cursor's movement and direction.
- Locks: what can lock, the lock button, its wait, the ticks. (They only
  decide where the would-be word doesn't apply.)
- Fading anything but the toggle's change; fading the lock overlays, the
  legend or the toggle row; changing S3's bar animation.
- Keeping other changes instant during the 500ms fade.

## Acceptance (proposed)

Viewport 1440px unless stated. Colors written out. Grids are dailies (the
counterpart of (c,r) is (14−c, 14−r)).

### `src/lib/would-be-word.test.ts` (new)

`wouldBeWord`, imported through the module's namespace so the file
type-checks before the function exists.

1. **22-S5-1 white cells:** on a letter in a word, a lone letter and a
   symmetric hint, it equals `buildWord`.
2. **22-S5-2 off cells:** between CRAP and APE across (row 3): columns
   1–8 (`buildWord` is null there); below SIR down: SIR and the cell;
   above it: the cell and SIR; at the grid's edge next to a word; between
   two runs of symmetric hints; the other direction none.
3. **22-S5-3 the counterpart:** A, T at (7,7), (8,7): from (5,7) across,
   (5–9,7), the counterpart (9,7) included; with A alone, (5,7) has none
   though (9,7) would turn white; (6,7) has (6–8,7).
4. **22-S5-4 none:** an off cell no white cell touches that way; an empty
   grid's center; a black cell (and a black cell ends a run); the grid
   is not changed.

### `e2e/would-be-word.spec.ts` (new)

5. **22-S5-5 CRAP _ APE:** the cursor on (5,3), across: the cursor
   yellow-bright, CRAP and APE `slot-letter` blue-medium (7 cells), the
   row's other cells `empty` gray-200. Going down there (no letter touches
   it that way): the column's cells `slot` dull blue, CRAP and APE white
   *(pass today)*.
6. **22-S5-6 SIR:** below SIR (9,6), down: SIR blue-medium, the column's
   other cells gray-200; above it (9,2) the same; (9,6) across: dull blue
   line, no `slot-letter` *(pass today)*.
7. **22-S5-7 the counterpart:** A, T at (7,7), (8,7); the cursor on (5,7)
   across: (6,7) and (9,7) `slot-required` blue-medium, A and T
   `slot-letter`, the rest of the row gray-200. Typing S there: the cursor
   on (6,7), the same five cells the word; with the cursor on (0,0),
   (9,7) is `symmetric-hint`. Before typing, with the cursor moved to
   (0,0), (9,7) is `empty`, gray-200.
8. **22-S5-8 no neighbor** *(pass today)*: (11,3) across: 21-S14's look;
   a symmetric hint elsewhere stays white.
9. **22-S5-9 Preview and locks unchanged** *(pass today)*: in Preview,
   (5,3) is black; the cursor on C (checked selected) has Preview's word
   CRAP alone, blue-medium; a click on (5,3) leaves the cursor on C, and
   APE unhighlighted white letters; on (5,3) across, after 3.5s no lock
   button or outline; at 600px Lock Word is disabled there and enabled on
   CRAP.
17. **22-S5-17 a locked word's end cells** *(pass today; numbered after
    the fade cases, added in revision)*: 600px, CRAP locked with Lock
    Word (two ticks); the cursor on (5,3), between CRAP and APE, and on
    (0,3), across: 21-S14's look, the row's off cells dull blue, CRAP and
    APE white letters, no `slot-letter` or `slot-required` cell.

### `e2e/preview-fade.spec.ts` (new)

The fade is read through `getAnimations()`: a `MutationObserver` on the
grid's `data-grid-mode` pauses every animation in the grid as the mode
changes, before a frame is drawn; each is then sought to 100, 250 and
400ms and the color read (ease-in-out gives 0.08, 0.5 and 0.92 of the
way; the windows are 0.03–0.15, 0.45–0.55, 0.85–0.97, so linear, `ease`
and Tailwind's curve fail). No timing decides those cases. Real-time
cases record every animation frame in the page.

10. **22-S5-10 on** (no-preference): an off cell gray-200 → gray-700, a
    symmetric hint white → cell-error red, the grid's lines gray-400 →
    gray-500: each a running animation of `background-color`, 500ms, no
    delay, on the curve; `data-cell-state` already Preview's; released,
    each ends exactly on Preview's color.
11. **22-S5-11 off:** the same, back, after a settled Preview.
12. **22-S5-12 real time:** the toggle clicked in a frame; the first
    Preview frame at most 25% of the way, a frame between 25% and 75%,
    never going back, exactly gray-700 300–1200ms after the first frame,
    and staying.
13. **22-S5-13 a locked letter** (600px, TANGENT locked with Lock Word):
    its color gray-500 → black on the curve, 500ms; black at the end.
14. **22-S5-14 back mid-fade:** Preview turned off in the first frame
    the fade is 30% of the way: the first frame after within 15% of the
    last, then only back toward gray-200, reached within 1200ms.
15. **22-S5-15 instant otherwise** *(pass today)* (no-preference): never
    toggled, a click and a typed letter (its counterpart turning white);
    in Preview once settled, a click on a red cell and a letter; after
    Preview off, settled, a click. Each action starts only once the
    recording has drawn two frames, and a frame without the change must
    come first; from the first frame showing it every sampled cell has
    its final color, and no frame has a color animation running in the
    grid.
16. **22-S5-16 reduced motion** *(pass today)*: on and off, the new
    colors from the first frame of the new mode, no animation.

### Amended acceptance

The human's request and the orchestrator's delegation (HANDOFF) cover
amending this Epic 21 frozen test; the amendment goes through this
story's independent review and freeze. The file gets a header note
citing 22-S5; nothing else in it changes.

- `e2e/word-highlight.spec.ts` **21-S1-4**: its second half puts the
  cursor on (2,4), down, the empty cell between DORY (rows 0–3) and
  ORATION (5–11), which is the human's own case. Now DORY and ORATION are
  `slot-letter` blue-medium (11 cells, was none), V a white letter, (2,12)
  and (2,13) `empty` gray-200 (were dull blue `slot`). The title and a
  comment follow. Its first half (the lone letter V, whose neighbor (2,13)
  is off) is unchanged.
Checked and not amended (each clicked off cell has no white neighbor in
the cursor's direction, is protected, or the test reads no build colors):

- `e2e/lock-tick-hover.spec.ts` 21-S11-6 (a click on the tick) and
  21-S11-7 (a tap on it): the cursor lands on TANGENT's end cell (10,2),
  across, next to TANGENT; it is protected, so TANGENT stays white (no
  word) as frozen. The first draft amended both; the orchestrator's
  decision above removed the need.

- `e2e/word-highlight-only.spec.ts` 21-S14-2: (1,2) across, neighbors
  (0,2) and (2,2) off (the Preview-red cells start at (3,2)); 21-S14-3:
  on letters only.
- `e2e/selection-colors.spec.ts` 17-S5-1 and `e2e/build-grid-design.spec.ts`
  14-S5-1: the cursor on (4,0) across, neighbors (3,0) and (5,0) off (ABC
  ends at (2,0); (9,0) is the only symmetric hint).
- `e2e/word-shape.spec.ts`: every cursor on a letter or a symmetric hint.
- `e2e/lock-tick-button.spec.ts` 21-S13 "a click on the ticked cell ends
  it": the cursor on (10,2) too, but it checks only the lock button (none:
  locks keep `buildWord`); its comment "an empty cell with no word" reads
  as no lockable word (and (10,2) is protected: no word either way). Its
  `leave()` cell (13,13) and `ELSEWHERE` (6,4) touch no white cell.
- `e2e/style-guide.spec.ts`: the build sample's cursor is on T, a letter.
- The fade: the suite runs reduced, so every test reading colors right
  after a toggle sees the final colors at once; the only spec emulating
  `no-preference` that toggles Preview (`build-progress-look.spec.ts`)
  reads the bar, not the grid.
- Unit tests: `build-word.test.ts`, `build-word-shape.test.ts`,
  `lock-target.test.ts`, `tick-*.test.ts` test `buildWord` and locks,
  unchanged; `cell-appearance.test.ts` and `word-highlight-only.test.ts`
  test `cellAppearance`'s inputs, unchanged.

### Discrimination

**Revision (2026-11-08, after the spec review), on `main` at 8008ee2**,
runtime unchanged, only test files differing; no product code or
prototype this time; under the standing E2E reset grant:

`npm run test:e2e -- e2e/would-be-word.spec.ts e2e/preview-fade.spec.ts
e2e/word-highlight.spec.ts e2e/lock-tick-hover.spec.ts`: 11 failed, 26
passed.

- Fail, as intended: 22-S5-5 (across), 22-S5-6 (below and above SIR),
  22-S5-7 (on (5,7); (9,7) `slot`, not `slot-required`): the cursor in
  no word, the line's off cells dull blue `slot`; 22-S5-10, 11 and 13 (no
  running animation when the mode changed); 22-S5-12 (the first Preview
  frame already gray-700); 22-S5-14 (the first frame back already
  gray-200, from gray-700).
- Fail, amended: 21-S1-4 ((2,0) `letter`, not `slot-letter`).
- Pass, as intended: the guards marked *(pass today)*: 22-S5-5's down
  case, 22-S5-6 across, 22-S5-8, 22-S5-9 ×3 (Preview's now proving the
  cursor moved), 22-S5-15 (with the recording started before each
  action), 22-S5-16, the new 22-S5-17; 22-S5-7's typing case (after the
  letter, (6,7) is a symmetric hint and `buildWord` already gives the
  same five cells); all of `lock-tick-hover.spec.ts`, back to its frozen
  text; the rest of `word-highlight.spec.ts`.
- `npx vitest run src/lib/would-be-word.test.ts`: 11 failed ("build-word.ts
  exports no wouldBeWord"). `npx tsc --noEmit` and `npx eslint` on the
  changed test files: clean.

**First draft (same day, before the review), kept for its evidence:** a
throwaway prototype (since reverted; `wouldBeWord` without the protected
-cell rule, a fading flag cleared by a 600ms timeout,
`transition-colors duration-500 ease-[ease-in-out]` on the grid and its
descendants) passed the unit file (11), the full `npm run test:e2e` (1262
passed, exit 0, with the then-amended 21-S11-6/7) and `npm run verify`
(771); the two new specs `--repeat-each 3`, 58 passed. With Tailwind's
`ease-in-out` instead, 22-S5-10, 11 and 13 failed (0.774 of the way at
250ms), so the curve is checked. That prototype predates 22-S5-17 and the
protected-cell rule, which it would have failed; the full suite was not
run on this revision.

## Repo paths

Acceptance: `src/lib/would-be-word.test.ts`, `e2e/would-be-word.spec.ts`,
`e2e/preview-fade.spec.ts` (new); amended `e2e/word-highlight.spec.ts`. Runtime: `src/lib/build-word.ts`,
`src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/PuzzleGrid.tsx`; perhaps
`src/lib/cell-appearance.ts`, `src/components/grid/LetterCell.tsx`,
`src/components/style-guide/GridExamples.tsx`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

**CODE-REVIEW:** none of these is a risk path, so direct delivery to
`main`. If the actual diff touches `src/engine/**` or another risk path,
it moves to a branch and PR.

## Open doubts (for the visual check)

- **A locked word's end cell** shows no word, even between two words
  (the orchestrator's decision: no letter can be typed there). The
  alternative was to show the word it would join.
- **The counterpart cell** shows blue-medium as part of the word before
  the letter exists; it may surprise that a cell not yet white is
  highlighted, though it is exactly the cell the letter would whiten.
- **Changes during a fade may ease** with it (half a second at most;
  accepted by the orchestrator).
- **The word on an off cell can be long:** between two long runs on a
  Sunday, the whole joined run lights up, which is what typing there would
  make.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
- The human's visual check (HANDOFF): the fade both ways, the would-be
  word on the CRAP _ APE and SIR cases, and a locked word's end cell.
