# Story S6 — The lock button's word

The lock button's tooltip names its word ("Lock TANGENT", "Unlock
TANGENT"), the button appears after 2 seconds instead of 3, and the mouse
on the button outlines its word in 2px black, as a tick hover does.

**Status: Delivered 2026-11-08:** implemented ae55a00, direct to `main`;
independent review of ae55a00: no blockers (its should-fix fixed in
044b231). Awaiting the human's visual check. Approved and
frozen 2026-11-08 (331589e) by the orchestrating session
under the human's delegation ([handoff](../HANDOFF.md#orchestration)),
after an independent review of the draft (no blockers; its two
should-fix findings and nits all addressed). From the human's changes
after the visual check of S3–S5 (EPIC, items 1–3). Amends seven frozen
specs (Epic 21's and 22-S4's, listed below) under that request and
delegation.

**Blast radius: small, off the risk paths.** `src/components/grid/PuzzleGrid.tsx`
(the tooltip's text, the hover outline) and
`src/components/grid/PuzzleGridEditor.tsx` (`LOCK_BUTTON_DELAY_MS` and its
comments). Perhaps a small helper in `src/lib/locked-words.ts` for the
word's letters. Direct delivery to `main`.

## The request

The human's three changes (EPIC, "The human's changes after the visual
check of S3–S5"): the lock button's tooltip says "Lock" or "Unlock" and
the word; the button appears after 2 seconds, not 3; hovering the button
outlines the word in 2px black, as hovering its tick does.

## What the code does today

- **The tooltip** (21-S4, timed by 22-S4's shared `Tooltip`):
  `LOCK_TOOLTIP` in `PuzzleGrid.tsx`, "Lock this word so you don't
  accidentally change it" on an unlocked word, "Enable changing this word"
  on a locked one, over the button (`lock-tooltip`), after 500ms of mouse
  hover. Its target is the button for the word it was hovered in
  (`lockHover`, keyed by the word); a click switches the text in place.
- **The button's name** is "Lock word" / "Unlock word" (`aria-label`,
  21-S2). Every lock spec finds the button by it (about 100 uses in 13
  frozen specs), and 22-S4's in-page log labels it so.
- **The wait:** `LOCK_BUTTON_DELAY_MS = 3000` (21-S16) times both the
  cursor's wait in an unlocked word (21-S2, restarted on refocus by 21-S7)
  and the mouse's hover wait (21-S10). A locked word's button shows at
  once (21-S2, 21-S17), as does a tick's (21-S17).
- **The tick hover** (21-S11, 21-S13, 21-S15, 21-S17): the mouse anywhere
  on a ticked end cell draws, for each locked word ending there, a 2px
  black outline around the word's letters (not its end cells),
  `tick-hover-outline`, over the gray 1px `word-outline` and under the
  ticks and the button. Moving onto the button of one of those words
  keeps them; any other button outlines nothing (`handlePointerMove`).
- **A word's letters** are its cells' contents in reading order
  (`lockedWordCells`); a rebus cell holds several letters, stored
  uppercase (typing and rebus entry uppercase them). A lockable or locked
  word's cells all hold letters.

## Decisions

From the human:

- **The tooltip names the word:** "Lock ARRAY" on an unlocked word,
  "Unlock ARRAY" on a locked one, ARRAY being the word.
- **2 seconds** before the button shows (was 3).
- **The mouse on the button outlines its word** in a 2px black line, as
  the tick's hover does.

### Delegated decisions (drafting agent, for the visual check)

**The text.**

- `Lock ` or `Unlock `, then the word: each of its cells' contents in
  reading order, joined with nothing between, uppercase. A rebus cell
  gives all its letters: P, ART, Y reads "Lock PARTY".
- **No closing period on either text.** Short command labels in the app
  carry none (the toggle row's "Lock Word", "Rebus"), and the two states
  match.
- The word is the button's word: the hovered word's when the hover's
  button shows (21-S10, 21-S13), not the cursor's. A click switches the
  text in place, as today, to the other verb and the same word.
- Everything else about the tooltip is unchanged: 22-S4's delay, skip
  window, placement, look, mouse only, no `aria-describedby`.

**The button's accessible name stays "Lock word" / "Unlock word".** The
request is about the mouse tooltip; the name never matched the tooltip
(it was a short label beside a sentence). Changing it would amend about
100 frozen uses in 13 specs for no requested behavior. Naming the word for
screen readers is left as an open doubt.

**The wait.** One constant, as in 21-S16: `LOCK_BUTTON_DELAY_MS = 2000`
times the cursor's wait, the refocus restart and the mouse's hover wait.
Everything shown at once stays at once (a locked word's button, a tick's
button, Lock Word in the toggle row). 21-S10's and 21-S13's rules ("runs
on", "starts over") are unchanged, now over 2 seconds.

**The outline on the button.**

- **What:** the tick hover's outline, the same overlay (2px black,
  `tick-hover-outline`, around the word's letters, its outer edge on the
  grid lines), drawn for the button's word. Locked or unlocked. For an
  unlocked word the gray 1px outline around the word and its end cells
  (21-S2) stays under it.
- **When:** at once when the mouse enters the button, not waiting for the
  tooltip's 500ms; it stays while the mouse is on the button, through
  clicks that lock or unlock the word (the button stays under the mouse,
  21-S10); it goes at once when the mouse leaves the button or the button
  goes. The tooltip still comes after its delay and goes on leaving; the
  two share the entry but not the timing.
- **One outline per word:** where the tick hover already outlines the
  button's word (the mouse came from that word's end cell, 21-S13), the
  word gets one outline, not two; the tick's other words keep theirs.
  Where the tick hover outlines other words but not the button's, moving
  onto the button ends the tick's (21-S13, unchanged) and the button's
  word is outlined.
- **Its own word only:** a mouse arriving on the button straight (not
  from a tick) outlines the button's word alone, even where the button
  sits over a shared end cell's tick (21-S11-5's case: DOG, not CAT).
- **Mouse only:** keyboard focus on the button, a touch or pen tap, and
  the toggle row's Lock Word (below the button's room, 21-S5) outline
  nothing. Preview on has no button, so none.
- **A button that comes up or changes under a resting mouse** follows the
  tooltip's target rule (the known gap, HANDOFF Decision 10): its outline may
  wait for the next mouse move. Not tested; 21-S13-4 (the tick's own word
  coming up under the mouse) shows the tick's outline either way.
- **Suggested shape (not frozen):** in `PuzzleGrid`, the button's word
  while `lockTipAnchor` is set joins `tickWords` when no tick word is the
  same word (`sameWord`); the tooltip's text comes from the grid's letters
  in `lockedWordCells(lockTarget.word)`. No new timer in `PuzzleGrid.tsx`
  (22-S4-13b).

## Non-goals

- Changing the button's accessible name, its look or placement, what can
  lock, or Lock Word in the toggle row (no tooltip, no outline).
- Other tooltips' texts or the shared tooltip timing.
- A tooltip or outline for keyboard focus or touch.
- A separate wait per way of showing the button, or a setting for it.

## Acceptance (frozen)

Viewport 1440px unless stated. Dailies; the wait measured in the page
(`performance.now()`): an in-page log records each `pointerdown` and
`pointerover` target and each moment the lock button appears or goes. A
timer fires late under load, never early: "2 seconds" is 1950–2900ms (a
3-second wait fails it); the outline's "at once" is within 300ms, before
the tooltip's 500ms.

### `e2e/lock-button-word.spec.ts` (new)

TANGENT across row 3 (3–9), ROBIN across row 5 (3–7), PARTY across row 8
(3–5, its middle cell the rebus "ART"); a second grid with CAT (2–4) and
DOG (6–8) across row 7, sharing the end cell (5,7).

1. **22-S6-1 unlocked:** the cursor in TANGENT, the button hovered: the
   tooltip "Lock TANGENT"; the button still named "Lock word".
2. **22-S6-2 locked:** a click on the hovered button: "Unlock TANGENT" in
   place, exactly (no period); again: "Lock TANGENT"; locked, away and
   back in TANGENT: the button at once, "Unlock TANGENT".
3. **22-S6-3 the hovered word's button:** the cursor in TANGENT, the
   mouse resting on ROBIN until ROBIN's button, then on it: "Lock ROBIN".
4. **22-S6-4 a rebus cell:** the cursor in PARTY: "Lock PARTY".
5. **22-S6-5 the cursor's wait:** a click in TANGENT, the mouse straight
   off the grid: the button 1950–2900ms after the `pointerdown`.
6. **22-S6-6 the hover's wait:** the cursor on an empty cell, the mouse
   onto ROBIN: its button 1950–2900ms after the `pointerover`.
7. **22-S6-7 the outline, unlocked:** none with the mouse away; on the
   button, within 300ms, one black outline (2px solid, on the lines)
   around TANGENT's 7 letters exactly, the gray word outline still one;
   still there once "Lock TANGENT" shows; onto TANGENT's T, gone within
   300ms while the cursor's button stays; back on the button, again; off
   the grid, gone.
8. **22-S6-8 a click under the mouse:** outlined; a click locks (two
   ticks): still one outline around TANGENT; a click unlocks: still; the
   mouse away: gone.
9. **22-S6-9 the hovered word's button:** ROBIN's button (cursor in
   TANGENT): no outline until the mouse is on it, then ROBIN's alone;
   onto ROBIN's end cell's free corner: ROBIN's button goes and TANGENT's
   returns at once (21-S10), with no outline.
10. **22-S6-10 with a tick:** CAT and DOG locked, the cursor in DOG; the
    mouse from off the grid onto DOG's button, over the shared end cell:
    DOG's outline only, one; from the shared tick (CAT and DOG outlined,
    DOG's button at once) onto DOG's button: CAT and DOG still, two
    outline elements (DOG once).
11. **22-S6-11 keyboard** *(pass today)*: Tab to the button, the mouse
    away: no outline after 700ms.
12. **22-S6-12 touch** *(pass today)*: a tap on the button (locking it):
    no outline after 700ms.
13. **22-S6-13 the toggle row's Lock Word** *(pass today)*: at 600px,
    hovering it: no outline, no button.
14. **22-S6-14 the button going** *(numbered after the others, added
    after the spec review)*: the mouse resting on TANGENT's button
    (outlined), the grid blurred without moving the mouse (as 21-S10-7):
    the button gone and no outline within 300ms, and none after 700ms.

### Amended acceptance

The human's request and the orchestrator's delegation (HANDOFF) cover
amending these frozen tests; the amendments go through this story's
independent review and freeze. Each file gets a header note citing 22-S6;
nothing else in them changes. The wait's rule, the inverse of 21-S16's:
a "not yet" check measured from the start of the button's wait moves
1000ms earlier, and a rest that must stay inside the wait moves with it;
waits already longer than 2 seconds ("long enough", absence checks,
4000ms waits for a button) stay, being still valid.

- `e2e/lock-tooltip.spec.ts` (21-S4-1 to -4): `UNLOCKED_TEXT` "Lock
  TANGENT", `LOCKED_TEXT` "Unlock TANGENT" (were the old sentences).
- `e2e/tooltips.spec.ts` (22-S4-7, -8): `UNLOCKED_TEXT` "Lock TANGENT".
  The log's `button:Lock word` labels are unchanged (the name stays).
- `e2e/lock-hover.spec.ts` (21-S10): `UNLOCKED_TEXT` "Lock ROBIN"
  (21-S10-4, ROBIN's button); `BUTTON_NOT_YET_MS` 1500 (was 2500), used by
  `hoverUntilShown` and 21-S10-2, -3, -6; 21-S10-2's "runs on" rest
  1800ms (was 2800ms), its comment "2000ms more" (was 3000ms).
- `e2e/lock-word.spec.ts` 21-S2-3: "not yet" at 1500ms and, after the
  move, 1600ms (were 2500ms and 2600ms).
- `e2e/lock-refocus.spec.ts` 21-S7-1 (both cases): "still waiting" at
  1500ms after focus returns (was 2500ms), its message to match.
- `e2e/lock-word-toggle-row.spec.ts` 21-S5-2 ("the outline still
  waits"): 1500ms (was 2500ms).
- `e2e/lock-tick-hover.spec.ts` 21-S11-5 ("an across word's button over
  part of the tick wins there"): the mouse under DOG's button now
  outlines DOG (`dark: DOG`, was no outline). Only DOG is locked in that
  grid, so the tick's outline would also be DOG's: the case no longer
  shows the button winning over the tick. 22-S6-10 covers that, with CAT
  locked too (DOG only, not CAT).

Checked and not amended:

- `e2e/lock-tick-button.spec.ts` (21-S13): every paint check with the
  mouse on a button is on the tick's own word (21-S13-2, -4), whose
  outline the button keeps anyway; `NOT_YET_MS` (2500) is used once,
  after a button already shown at once, as a plain wait.
- `e2e/lock-tick-hover.spec.ts` otherwise: 21-S11-5's first case takes
  its base paints with the mouse on TANGENT's button (after the locking
  click); the outline's 2px are clear of the sample spot (1/10 across,
  92/100 down), and the next check expects TANGENT outlined anyway.
- `e2e/word-shape.spec.ts`, `e2e/lock-button-side.spec.ts`,
  `e2e/grid-size-by-puzzle.spec.ts`, `e2e/reset-with-locks.spec.ts`,
  `e2e/would-be-word.spec.ts`, `e2e/locked-cells.spec.ts`: only absence
  checks after 3500ms and waits of 3500–4500ms for a button.
- Specs finding the button by "Lock word" / "Unlock word": the name is
  unchanged.
- `src/components/ui/tooltip-source.test.ts` (22-S4-13): no timer or
  delay in `PuzzleGrid.tsx` is added.

### Discrimination (2026-11-08, on `main` at c2205a8)

Under the standing E2E reset grant, with the dev server on :3000
restarted after each run (the E2E preparation stops it).

**Runtime unchanged** (only test files differ): `npm run test:e2e --
e2e/lock-button-word.spec.ts e2e/lock-tooltip.spec.ts
e2e/tooltips.spec.ts e2e/lock-hover.spec.ts e2e/lock-word.spec.ts
e2e/lock-refocus.spec.ts e2e/lock-word-toggle-row.spec.ts
e2e/lock-tick-hover.spec.ts`: 31 failed, 69 passed.

- Fail, as intended: 22-S6-1 to -4 (the old sentence), 22-S6-5 and -6
  (3007ms, over 2900), 22-S6-7 to -10 and -14 (no black outline on the
  button).
- Fail, amended: 21-S4-1 to -4 and 22-S4-7, -8 (the old text); ten
  21-S10 cases, 21-S10-2 to -8 (a 3s button comes after their 1500ms "not
  yet" plus 1500ms "shown", or their 1800ms rest plus 600ms; 21-S10-4 also
  the old text); 21-S7-1 (both); 21-S5-2's outline case; 21-S11-5's
  button case (no outline).
- Pass, as intended: 22-S6-11 to -13; the rest of these specs. 21-S2-3
  passes either way (1600ms + 1500ms reaches 3s); it guards the restart.

**A throwaway prototype** (reverted, not kept: the constant at 2000; the
text from `lockedWordCells` and the grid; the button's word added to
`tickWords` while `lockTipAnchor` is set, unless already there): the same
8 specs plus `lock-tick-button`, `word-shape`, `lock-button-side`,
`grid-size-by-puzzle`, `reset-with-locks`, `would-be-word` and
`locked-cells`: 200 passed. Two variants, each failing only its case:
without the "unless already there" check, 22-S6-10 ("3 outline elements
(want 2)"); with the outline kept in its own state, set on the button's
`pointerenter` and cleared only on its `pointerleave` (no cleanup when the
button unmounts), 22-S6-14 (TANGENT still outlined after the blur).

The full suite and `npm run verify` were not run (test-only changes).
`npx tsc --noEmit` and `npx eslint` on the changed specs: clean.

## Repo paths

Acceptance: `e2e/lock-button-word.spec.ts` (new); amended
`e2e/lock-tooltip.spec.ts`, `e2e/tooltips.spec.ts`,
`e2e/lock-hover.spec.ts`, `e2e/lock-word.spec.ts`,
`e2e/lock-refocus.spec.ts`, `e2e/lock-word-toggle-row.spec.ts`,
`e2e/lock-tick-hover.spec.ts`. Runtime:
`src/components/grid/PuzzleGrid.tsx`,
`src/components/grid/PuzzleGridEditor.tsx`; perhaps
`src/lib/locked-words.ts`. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`.

**CODE-REVIEW:** none of these is a risk path (`src/engine/**`,
`src/lib/puzzle-storage.ts`, `src/app/puzzles/actions.ts`, `prisma/**`),
so direct delivery to `main`. If the actual diff touches one, it moves to
a branch and PR.

## Open doubts (for the visual check)

- **No closing period** on either text.
- **Screen readers** hear "Lock word" / "Unlock word", not the word; the
  tooltip is mouse only. Naming the word in the accessible name is a
  possible later change (with the frozen lock specs' locators).
- **A long word** (a Sunday's 21 letters, or rebus cells) makes a long
  tooltip; the shared Tooltip wraps at 280px.
- **The outline doesn't wait** for the tooltip: it shows the moment the
  mouse is on the button, like the tick's.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
- The human's visual check: the tooltip's texts (locked, unlocked, the
  period), the 2-second wait and the outline on the button.
