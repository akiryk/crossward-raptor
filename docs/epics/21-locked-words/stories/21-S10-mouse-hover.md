# Story S10 — Mouse hover shows a word's lock button

Resting the mouse over a word for a second shows that word's lock button
and outline, wherever the cursor is, and clicking it locks or unlocks
that word without moving the cursor.

**Status: done (2026-11-07), except the human's visual check.** Frozen
2026-11-06 at 2a1d3c4, approved by the orchestrator under the handoff's
delegation after an independent specification review (changes requested,
applied, then re-reviewed with no blockers); 21-S10-4 corrected in the
spec-only e5de023; implemented in e90d552 on `main`, independently
reviewed with no blockers (see "Delivery"). The keyboard,
rebus and completed-word rules under "Delegated decisions" were decided
by the orchestrator under the same delegation. From the human's visual testing (EPIC "Changes from the
human's visual testing", item 2, "Mouse hover"). Adds to S2's "When it
appears". Depends on S2, S4, S5, S7, S8 and S9.

**Blast radius: small, expected off the risk paths.** Client components
in `src/components/grid/` and one pure helper in `src/lib/locked-words.ts`.
No `src/engine/**`, `src/lib/puzzle-storage.ts`,
`src/app/puzzles/actions.ts` or `prisma/**` change (CODE-REVIEW "When
review applies"): a hover lock is saved through the same `lockedWords`
list and autosave as S2's. Direct delivery to `main`.

## What the code does today

Inspected `PuzzleGridEditor.tsx`, `PuzzleGrid.tsx`, `LockWordControl.tsx`,
`src/lib/locked-words.ts`, `src/lib/build-word.ts`, `cell-appearance.ts`,
and the frozen lock specs (`lock-word`, `lock-tooltip`, `lock-refocus`,
`lock-word-toggle-row`, `word-shape`).

- **One button, the cursor's.** `PuzzleGridEditor` computes `lockedHere`
  (`lockedWordAt`) and `lockable` (`lockableWord`) for the cursor, and a
  `lockTarget` shown while the grid has focus: at once in a locked word,
  or once `lockDwell` equals the cursor (a 1-second timer that runs only
  while the grid has focus, 21-S7). `handleToggleLock` toggles the
  cursor's word.
- **The button** is rendered by `PuzzleGrid` from `lockTarget`, absolutely
  placed in the grid area of the word's last cell, past it by one grid
  line, so it sits over the end cell. Its `mousedown` is prevented (the
  grid keeps focus), and it is a Tab stop while visible. The unlocked
  word's outline is drawn with it; locked words' outlines and ticks always.
- **Pointer handling.** `PuzzleGrid` already listens to `pointerover` on
  the grid for Preview's tooltips (mouse only; the lines between cells,
  which have no `data-coord`, change nothing), and the button has its own
  `pointerenter`/`pointerleave` for S4's tooltip (mouse only).
- **Narrow.** Below the puzzle's own full width (21-S5, 21-S9),
  `hasLockButton` is false: no button beside the word, the outline still
  after a second, and Lock Word in the toggle row follows the cursor.
- Nothing reacts to the mouse resting on a word.

## Decisions

From the human (2026-11-06, EPIC "Changes from the human's visual
testing", "Mouse hover (item 2)"):

- **A second of hover:** resting the mouse over a word for 1 second shows
  its button and outline (the outline as S2's: with the button for an
  unlocked word; a locked word's is always shown).
- **The word** is the one in the cursor's direction through the hovered
  cell (S8's word: the run Preview keeps white), when it is lockable
  (complete, 3 or more letters) or locked.
- **Hover wins:** one button at a time. The hovered word's replaces the
  cursor word's until the mouse leaves the word or its button; then the
  cursor's rules return.
- **Clicking it** toggles the hovered word without moving the cursor.
- **Focus:** it works whether or not the grid has focus.
- **Where:** the build phase with Preview off only.

### Delegated decisions

Proposed by the drafting agent, for the human's visual check:

- **The second** counts from the mouse moving onto the word. Moving among
  its cells, over the 1px lines between them, or onto its button keeps it
  running; keys, cursor moves and focus don't touch it. It applies to
  locked words too: hovering a locked word waits the second like an
  unlocked one (the cursor's "at once" is for the word you're in; at once
  on hover would flash a button at every locked word the mouse crosses).
  Leaving before the second shows nothing, ever; coming back starts it
  over. If the hovered word itself changes while the mouse rests (the
  cursor turns, Space or an arrow, so a different run goes through the
  cell), its second starts over for the new word. A word that becomes
  lockable under a resting mouse (typing completes it, the same run) keeps
  the second counted from when the mouse moved onto the cell: if a second
  has passed, its button shows at once.
- **The cursor's second runs on under the hover.** Its timer and S7's
  focus rule are unchanged. When the hover ends, the cursor's button is
  back at once if its own second has passed with focus (or it's in a
  locked word), else when that second ends.
- **A hovered cell with no button** (an incomplete word, fewer than 3
  letters, a lone cell, an empty Preview-black cell) changes nothing: the
  cursor's button, if any, stays. Hover wins only when it has a button
  to show.
- **Leaving** is the mouse being on neither the word's cells, the lines
  between them, nor its button: e.g. on another cell (the end cell's part
  the button doesn't cover included), off the grid, or elsewhere on the
  page. The button and its unlocked outline go at once (S4's tooltip
  with them).
- **A hover starts only when the mouse moves onto a cell** (a real
  pointer move, mouse only). A button or outline appearing or going under
  a still mouse starts none, and hovering the cursor's own button starts
  none: it stays the cursor's, going with focus as S2/S4 say.
- **A click in a cell ends the hover**: the cursor takes over, by its own
  rules. If the hover's button was showing for the word the click puts
  the cursor in, it stays, with no new second. The mouse then resting on
  the clicked cell starts no hover until it moves onto a cell again.
  **This departs from the EPIC's literal "until the mouse leaves"**: a
  click ends the hover though the mouse hasn't left. The reason is the
  frozen S2, S4 and S7 specs, which click a cell, leave the mouse there
  and expect the button to go when the grid loses focus; under the
  literal rule the resting mouse would keep it.
- **Clicking the hover's button** takes no focus (as S2's); the grid
  keeps focus if it had it and doesn't gain it if it hadn't. The button
  stays, in its new state, while the mouse is on it. The lock is saved
  as any other.
- **S4's tooltip** shows on the hover's button as on the cursor's (a
  second of hover over the button, the same texts).
- **Not a Tab stop:** the hover's button is for the mouse. It takes no
  keyboard focus. While it shows (hiding the cursor's), Tab from the grid
  goes where it would with no lock button visible, consistent with S2's
  "while visible". **This departs from S2's Tab rule for the hover's
  button only**; the cursor's button (S2) stays the keyboard's way to
  lock.
- **Keyboard focus wins over hover:** a lock button that has keyboard
  focus is never replaced. While the cursor's button has focus, moving
  the mouse onto another word starts no hover, and focus stays on the
  button (Enter or Space toggles the cursor's word).
- **Touch and pen:** no hover; a tap moves the cursor as now (S2, S4's
  "mouse only").
- **The highlight** stays the cursor's: hover paints no blue and moves
  no yellow.
- **Below the puzzle's own full width (S5 mode)** hover does nothing: no
  button beside the word (none is shown there), no hovered outline either,
  and the toggle row's Lock Word keeps acting on the cursor's word. S5
  mode is the narrow, touch-first path, where the toggle row follows the
  cursor; an outline for a word Lock Word wouldn't act on would mislead.
- **A rebus entry open:** hover does nothing while it's open.
- **Preview, the hints phase and a published puzzle:** hover does nothing
  (S2's "Where it applies").

## Non-goals

- Tick hover (EPIC item 6), a later story.
- Changing the cursor's rules (S2, S7), the button's look or placement
  (S2), the tooltip's text or delay (S4), protection (S3), the toggle
  row's Lock Word (S5), Reset Grid (S6) or the word (S8).
- Hover on touch screens, a keyboard way to reach the hover's button, or
  a hover highlight.
- Locking more than one word at once.

## Acceptance (frozen)

### Unit: `src/lib/lock-target.test.ts` (new)

1. **21-S10-1 the lock target of any cell:** `lockTargetAt(grid,
   lockedWords, { current, orientation })` in `src/lib/locked-words.ts`
   returns `{ word, isLocked: true }` for the locked word holding the cell
   in that direction, else `{ word, isLocked: false }` for its lockable
   word, else `null`. On a daily (TANGENT, ROBIN, RUN down sharing the R,
   EGG with four Preview-red cells, AT): ROBIN and RUN from each cell; a
   locked TANGENT; the shared R gives ROBIN across and RUN down, locked or
   not by direction; null for lone cells, EGG from a letter or a red
   cell, AT and an empty Preview-black cell; inputs unchanged. The cursor
   and the hovered cell both use it.

### `e2e/lock-hover.spec.ts` (new, 19 cases)

The same daily, at 1440px (a 620px grid) unless said. "At once" is
300ms, checked without retrying where a later reappearance would pass.

2. **21-S10-2 a second of hover** (4): cursor on an empty cell, the mouse
   on ROBIN: nothing at 500ms, then "Lock word" with the open padlock
   beside its last letter and one outline around ROBIN and its end cells;
   the cursor still on the empty cell. Moving among ROBIN's cells keeps
   the second (shown within 600ms of a move at 800ms). EGG completed by
   typing under a mouse that has rested 1.5s on it: its button at once.
   Leaving at 500ms shows nothing, even 1.5s later.
3. **21-S10-3 hover wins** (3): with TANGENT's button showing, ROBIN's
   replaces it after the second (one button, one outline), the cursor
   still in TANGENT; the mouse off the grid, TANGENT's is back within
   300ms. The mouse on ROBIN at once after the click: ROBIN's shows, and
   off the grid TANGENT's is back within 300ms (its second ran on). On
   EGG, AT, an empty cell or RUN's U across, TANGENT's button and outline
   stay.
4. **21-S10-4 leaving** (1): resting 500ms exactly on the line between
   two of ROBIN's cells, and just inside its last letter beside the
   button, keeps it, as do moves across lines and onto the button; S4's
   tooltip shows on it after the second; moving onto the end cell's free
   corner, the button, tooltip and outline go within 300ms.
5. **21-S10-5 clicking** (2): with the cursor in TANGENT, the hover's
   button locks ROBIN (closed padlock, gray letters, saved as ROBIN's
   lock), the grid keeps focus and the cursor stays; off the grid,
   TANGENT's "Lock word" is back, ROBIN's ticks stay; hovering locked
   ROBIN waits the second for "Unlock word", which unlocks it (saved).
   With the grid blurred: shown, toggled, no focus taken, and the cursor
   still where it was.
6. **21-S10-6 the cursor's direction** (1): across, RUN's U shows nothing
   after 1.5s; Space turns the cursor Down and RUN's button shows below
   its last letter after a new second; ROBIN's O, down, is a lone cell:
   gone within 300ms.
7. **21-S10-7 a click hands over to the cursor** (2): clicking in hovered
   ROBIN keeps its button, checked at once and 300ms later; blurring the
   grid then hides it though the mouse rests on ROBIN. The mouse left on
   a clicked ROBIN cell after the cursor leaves by keyboard shows nothing.
8. **21-S10-8 the keyboard and the hover** (3): Tab from the grid with
   the hover's button showing doesn't focus it. With the hover hiding
   TANGENT's button, Tab from the grid lands on the element it reaches
   with no lock button (measured first in the same page). With TANGENT's
   button focused by Tab, 1.5s on ROBIN changes nothing: the focused
   button stays TANGENT's, and Enter locks TANGENT, not ROBIN.
9. **21-S10-9 where hover does nothing** (3): Preview on; a rebus entry
   open; and at 600px (a 584px grid), where TANGENT's outline and the
   toggle row's Lock Word stay the cursor's, and Lock Word locks TANGENT,
   not ROBIN.

Every frozen test is unchanged. The hover rules above ("starts only on a
move onto a cell", "a click ends it", "the cursor's button hovered starts
none") are what keep the frozen lock specs, which leave the mouse on the
clicked word or the cursor's button, true.

### Discrimination (2026-11-06, observed)

- **`main` (06de0b7) with the proposed tests:** the unit file fails at
  import (`lockTargetAt` doesn't exist; `tsc --noEmit` reports the same,
  TS2305), 5 of 5. With a stand-in `lockTargetAt` (`lockedWordAt`, then
  `lockableWord`) in a scratch copy of the test (deleted), 5 of 5 pass,
  confirming the fixture.
- `npm run test:e2e -- e2e/lock-hover.spec.ts` on 06de0b7 (the first
  attempt's build failed fetching Google Fonts; the retry built): 12 of
  19 fail, each where the hover's button should appear (21-S10-2's first
  three, -3's first two, -4, -5 both, -6, -7's first, -8's first two).
  Passing, as guards of the delegated decisions: 21-S10-2 leaving early,
  21-S10-3 a word with no button, 21-S10-7 the mouse left on a clicked
  cell, 21-S10-8 a focused button not replaced, and 21-S10-9's Preview,
  rebus and 600px cases.
- Not yet shown: the spec passing against an implementation (no runtime
  was written in drafting), and the full suite with it.
- ESLint passes on both new files; `tsc --noEmit` reports only the
  missing `lockTargetAt`.

### Correction (2026-11-07)

The implementer found 21-S10-4 failing 3 of 3 against an implementation
keeping S2's placement and S4's rule. It rested the mouse at
`last.x + last.width + 0.5`, "on the line between the last letter and
the button", but in Chromium that spot is already over the button
(`elementFromPoint` returns the button from 0.1px past the cell's edge),
so the button's `pointerenter` started S4's tooltip second there, and
the later "no tooltip yet, 500ms onto the button" failed. The correction
rests the mouse 3px inside the last letter's cell instead
(`last.x + last.width - 3`); the comment, the assertion message and the
test title follow. No other assertion, timeout or case changed, and no
rule changed: S4's tooltip still counts from the mouse onto the button.
Independently reviewed 2026-11-07 before its own spec-only commit (STORY
§3, under the delegation): approved, no blockers. The reviewer confirmed
in Chromium that the line is under the button, saw the original fail 3 of
3 against the implementation and the corrected file pass (58 passed,
`--repeat-each=3`).

### Delivery (2026-11-07, observed)

- **e90d552** (runtime only; `git diff 2a1d3c4 e90d552 -- e2e/
  'src/**/*.test.*'` is exactly e5de023's correction).
- Orchestrator, on the same tree before the commit: `npm run verify`
  exit 0 (715 tests; S11's then-untracked unit test set aside). Full
  `npm run test:e2e` (S11's draft spec set aside): 1163 passed, 3 failed,
  none S10's: `done-icon.spec.ts` 18-S5-5 (Epic 18's recorded
  intermittent; 6 of 6 passed with and without S10's runtime) and two
  `ECONNRESET` helper errors (`play-design` 14-S7-1, `status-icons`
  18-S3-2), passing on `--last-failed`. An earlier full run on a loaded
  machine had 32 failures, not kept in detail; it is not counted as
  evidence.
- Independent reviewer: no blockers; tsc clean but for S11's then-untracked
  test, lint 0 errors, 715 unit tests, and six lock and word-shape specs
  67 passed. Its non-blocking notes, for the human's visual check:
  1. Moving from the hovered word straight onto the *cursor's* button
     for another word doesn't end the hover (`PuzzleGrid.tsx:336`); the
     hovered word's button can then replace it under the mouse. Rare: it
     needs a fast move or a grid-edge corner.
  2. A hover's second keeps counting while hover is suppressed (rebus
     entry open, narrow mode); closing the rebus by keyboard or widening
     the window under a resting mouse shows that word's button at once.
  3. Typing into a Preview-black cell beside the hovered run changes the
     run, so its second starts over ("the hovered word itself changes").

## Repo paths

Acceptance: `src/lib/lock-target.test.ts`, `e2e/lock-hover.spec.ts`.

Runtime:

- `src/lib/locked-words.ts`: `lockTargetAt`.
- `src/components/grid/PuzzleGridEditor.tsx`: the hovered target, which
  of the two shows, toggling the hovered word, the click hand-over.
- `src/components/grid/PuzzleGrid.tsx`: reporting the hovered cell (mouse
  moves onto cells, leaving the word and its button), the hover's button
  not a Tab stop.

Docs: this story, `../EPIC.md` (stories list), `../HANDOFF.md`. Declare
any other path before editing it.

## Definition of done

- Approved (or delegated) and frozen in a specification-only commit on
  `main` before any runtime change; frozen acceptance unchanged after.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check of hover, its delegated decisions above, and
  that the frozen lock specs still pass.
- Delivered on `main`; the handoff records observed results.
