# Story S6 — Reset Grid with locked words

When any word is locked, Reset Grid asks whether to keep locked words or
clear every cell.

**Status: done 2026-11-06,** independently reviewed (no blockers) and
delivered on `main` as 220019b. Approved and frozen at 3702710 by the
orchestrator under the human's delegation (HANDOFF). Depends on S2.

**Blast radius: small, expected off the risk paths.**
`src/components/grid/` and `src/lib/locked-words.ts`. Direct delivery to
`main`.

## What the code does today

Reset Grid (`StartOverLink`, `StartOverDialog`; 20-S1/S4) opens a dialog
titled "Reset Grid", with the body "Are you sure? This will remove every
letter from the grid." and the buttons "Reset Grid" (primary) and
"Cancel" (`ModalActions`). Confirming clears every cell and puts the
cursor on the first cell, Across.

## Decisions

From the human (2026-11-06, EPIC "Reset Grid"):

- **No locked words:** today's dialog, unchanged.
- **One or more locked words:** the title is still "Reset Grid", and the
  body reads "Do you want locked words to remain or would you rather
  clear every cell?". The buttons are **Clear Every Cell** (first,
  primary), **Keep Locked Words** (alternate) and **Cancel** (alternate).
- **Clear Every Cell** clears every cell and removes every lock.
- **Keep Locked Words** clears every cell outside a locked word, and
  those words stay locked, with their outlines and ticks.
- Either way the cursor goes to the first cell, Across, it autosaves, and
  an open rebus entry closes, as today. Cancel changes nothing.

### Delegated decisions

Decided by the orchestrator under the human's delegation, for the human's
visual check:

- **Three buttons** in the modal footer, with `Button` (Clear Every Cell
  the normal filled look, the other two `alternate`), beside rather than
  inside `ModalActions`, whose two-button contract stays.
- **"Stack"** means one per line, left-aligned, Clear Every Cell on top,
  whenever all three don't fit on one line (today's footer wraps them two
  and one at 375px). At 1440px they fit on one line.
- **Keep Locked Words** turns every cell outside a locked word white and
  empty, black cells and end cells included, as Reset Grid does today;
  a locked word's cells keep exactly what they hold (a rebus too). The
  lock list is unchanged.
- **Which dialog** follows the locks at the moment it opens: a word locked
  then unlocked leaves none, so today's dialog.
- **Test ids:** `start-over-clear-all`, `start-over-keep-locked`, the
  existing `start-over-cancel`; `start-over-confirm` only in today's
  dialog.
- **The function:** `clearOutsideLockedWords(grid, lockedWords)` in
  `src/lib/locked-words.ts`, pure, returning a new grid.

## Non-goals

- Undo of a reset.
- Changing Reset Grid's link, place, or the no-lock dialog.

## Acceptance (frozen)

### Unit: `src/lib/locked-words-reset.test.ts` (new)

A new file rather than extending S2's frozen `locked-words.test.ts`.

1. **21-S6-1 keep:** outside two crossing locked words every cell is
   white and empty, black ones included; a locked word's rebus stays;
   with no locks every cell clears; the input grid is unchanged.

### `e2e/reset-with-locks.spec.ts` (new)

TANGENT across row 3, ONE down through its N, RAT across row 8, black
corners, on a daily at 1440px; locks made with S2's button.

2. **21-S6-2 no locks:** never locked, or locked then unlocked: 20-S1's
   body and its two buttons; no new buttons.
3. **21-S6-3 the three-button dialog:** title "Reset Grid", the new body
   (not the old one), the buttons in order on one line; Clear Every Cell
   the normal look, the other two alternate.
4. **21-S6-4 Clear Every Cell:** every cell white and empty, no outlines
   or ticks, the cursor on the first cell, Across, the grid focused;
   saved with no `lockedWords`; the same after a reload, and the old
   word's cells take letters.
5. **21-S6-5 Keep Locked Words:** only TANGENT's letters remain, gray,
   with the outline and two ticks; the black corners turn white; the
   cursor on the first cell, Across; saved with the same lock, and the
   same after a reload. With ONE locked too, both stay.
6. **21-S6-6 Cancel:** Cancel or Escape changes nothing on screen or
   saved, and the lock stays.
7. **21-S6-7 narrow (375px):** the three buttons one per line, in order,
   left-aligned, inside the dialog; nothing overflows.

### Discrimination

Browser, observed 2026-11-06 on `main` at 9da90fb (S5 landed): `npx
playwright test e2e/reset-with-locks.spec.ts`, 5 failed, 4 passed. 21-S6-3,
-4, -5 (both) and -7 fail at the missing new body or buttons; 21-S6-2 (both)
and 21-S6-6 pass, as they guard today's behavior.
Unit, observed 2026-11-06: `npx vitest run
src/lib/locked-words-reset.test.ts`, 4 failed (no `clearOutsideLockedWords`).

## Repo paths

Acceptance: the files above. Runtime:
`src/components/grid/StartOverDialog.tsx`,
`src/components/grid/PuzzleGridEditor.tsx`, `src/lib/locked-words.ts`.
Docs: this story, `../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
