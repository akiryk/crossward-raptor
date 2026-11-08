# Story S17 — The tick's button at once, a 2px outline

Hovering a locked word, its ticked end cell or its letters, shows its
lock button at once, as the cursor in a locked word does. The black
outline the tick hover draws around each word is 2px instead of 1px.

**Status: approved by the human and frozen (2026-11-08), delegated details included; delivered on `main` (c5f67df); the human's visual check passed (2026-11-08).** From the
human's visual check of S14–S16 (EPIC "Changes from the human's visual
check of S14–S16 (2026-11-08)"). Amends S13's and S16's wait for the
tick's button, S10's and S16's wait for a hovered locked word, and S15's
1px line. Depends on S13, S15 and S16
(delivered).

**Blast radius: small, expected off the risk paths.** Two client
components in `src/components/grid/`. No `src/engine/**`,
`src/lib/puzzle-storage.ts`, `src/app/puzzles/actions.ts` or `prisma/**`
change (CODE-REVIEW "When review applies"). Direct delivery to `main`.

## What the code does today

Inspected `PuzzleGridEditor.tsx` (`handleHoverCell`, `LockHover`, the
turn's re-pick) and `PuzzleGrid.tsx` (the `tick-hover-outline` overlay).

- The mouse on a word (S10) or a ticked end cell (S13) starts a hover
  `wait`, `isDue: false`, and the button shows after
  `LOCK_BUTTON_DELAY_MS` (3 seconds, S16), locked word or not. A turn of the cursor while the
  mouse rests there picks again with a new wait.
- The cursor in a locked word shows its button at once (S2).
- The tick hover's outline is `border` (1px) black, inset by the grid
  line's width so it sits on the grid lines around the word's cells.

## Decisions

From the human (2026-11-08, EPIC):

- **The tick's button at once:** hovering a tick shows the lock button
  as fast as the cursor in a locked word does, so at once.
- **The rule, locked or not:** asked whether resting on a locked word's
  letters should be at once too, the human answered: "If a word is not
  locked and I hover over a letter or click on a letter, we wait 3
  seconds. That is good. If a word is locked, we show the button as soon
  as I hover or select." So a hovered locked word's button shows at once,
  on its letters as on its tick; an unlocked word's still waits.
- **The outline is 2px** (was 1px), growing inward (the human's choice
  of the two offered).

### Delegated details

Proposed by the drafting agent, approved by the human:

- **Every tick hover is at once:** the whole ticked end cell (S13), a
  turn's new pick (S13) and a re-pick after the tick's word is unlocked
  by keyboard, when another locked word ends there. The rest of S13 is
  unchanged: which word, where the button sits, when it goes, a click,
  keyboard focus winning, no button below the room or on touch.
- **Once shown, a locked word's hover counts as waited:** unlocked
  through its button, the button stays, "Lock word", as S10's does.
- The cursor's own rules (S2, S7, S16) are unchanged.
- **The 2px line's place (the human chose "grows inward"):** its outer edge stays where the 1px line was,
  on the grid lines; its second pixel is inside the word's cells, so it
  covers no cell outside the word. Still over the gray outline and under
  the ticks and the lock button.

## Non-goals

- Changing the wait for an unlocked word's button, for the cursor or the
  mouse (S16), or S4's tooltip.
- Changing when the outline shows, or the gray outline.

## Acceptance (frozen)

No new spec: the S7, S10, S11 and S13 specs carry it. Each amendment is marked
"21-S17" in the file. No other assertion, timeout or case changes.

- `e2e/lock-tick-button.spec.ts` (S13): every wait for the tick's button
  is `AT_ONCE_MS` (300ms; was `NOT_YET_MS + SHOWN_WITHIN_MS`, 4000ms);
  `SHOWN_WITHIN_MS` is gone. 21-S13-2's first case: the button at once
  (was "not yet" at 2.5s). 21-S13-5: CAT's button at once after DOG is
  unlocked (was "not yet"), and after the turn, OWL's at once (was "not
  yet"). 21-S13-6's first case: the cursor's button replaced at once (was
  kept until the wait). Two titles say "at once"; the header notes it.
- `e2e/lock-tick-button.spec.ts` and `e2e/lock-tick-hover.spec.ts` (S11):
  `tickOutlineMismatches` checks a 2px black line (was 1px); its outer
  edge's place is unchanged.
- `e2e/lock-hover.spec.ts` (S10) 21-S10-5: back on locked ROBIN, its
  button shows at once (`AT_ONCE_MS`; was `hoverUntilShown`'s "not yet"
  at 2.5s, then shown).
- `e2e/lock-refocus.spec.ts` (S7) 21-S7-2: after the click that locks
  TANGENT, the mouse moves off the grid (`page.mouse.move(0, 0)`). The
  click left it on TANGENT's new tick, whose button now shows at once, so
  the blur's "button hidden" check failed. A fixture move only: S7's rule
  is unchanged.

### Discrimination (2026-11-08, observed)

A scratch implementation (reverted, kept outside the repo as
`../crossward-raptor-s17-scratch.patch`; a first version made only the
tick at once, the second, final one, any locked word):

- **With the scratch:** the S11 and S13 specs pass 24 of 24; S7's 4 of 4.
  With the second version and every amendment, all 13 lock specs pass
  (`lock-hover` 20 of 20; before its amendment 21-S10-5 failed at the
  "not yet"). Running them found the S7-2 and S10-5 amendments.
- **On `main` (58b77b3):** the S11 and S13 specs fail 20 of 24, at the
  2px check or the at-once button.
- **The scratch's 2px outline alone** (the wait unchanged): 8 of 24 fail,
  every S13 case whose wait changed.
- **`lock-hover` on `main`:** 21-S10-5 fails ("ROBIN's button at once");
  19 pass.
- S7's amendment passes either way (a fixture change).

## Repo paths

Acceptance: the amended `e2e/lock-tick-button.spec.ts`,
`e2e/lock-tick-hover.spec.ts`, `e2e/lock-hover.spec.ts` and
`e2e/lock-refocus.spec.ts`.

Runtime:

- `src/components/grid/PuzzleGridEditor.tsx`: the hovered word's button
  shows at once when it's locked, and its wait then counts as passed.
- `src/components/grid/PuzzleGrid.tsx`: the outline's `border-2`.

Risk: all off the CODE-REVIEW risk paths. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Approved by the human and frozen in a specification-only commit on
  `main` before any runtime change. Frozen acceptance is unchanged after
  that.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- The human's visual check.
- Delivered on `main`; the handoff records observed results.
