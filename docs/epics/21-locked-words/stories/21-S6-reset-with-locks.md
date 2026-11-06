# Story S6 — Reset Grid with locked words

When any word is locked, Reset Grid asks whether to keep locked words or
clear every cell.

**Status: drafted 2026-11-06; acceptance tests not yet written; not
approved.** Depends on S2.

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

Delegated details, proposed:

- **Three buttons** extend the footer next to `ModalActions` (or a small
  variant) rather than changing `ModalActions`'s two-button contract.
  When they don't fit on one line they stack, Clear Every Cell on top.
- **Test ids:** `start-over-clear-all`, `start-over-keep-locked`, and
  the existing `start-over-cancel`.

## Non-goals

- Undo of a reset.
- Changing Reset Grid's link, place, or the no-lock dialog.

## Acceptance (proposed, to be written)

### Unit: `src/lib/locked-words.test.ts` (extended)

1. **21-S6-1 keep:** clearing outside locked words leaves exactly the
   locked words' letters and the lock list.

### `e2e/reset-with-locks.spec.ts` (new)

2. **21-S6-2 no locks:** the dialog is unchanged (20-S1's text and two
   buttons).
3. **21-S6-3 the three-button dialog:** with a locked word, the new body
   and the three buttons in order and style.
4. **21-S6-4 Clear Every Cell:** the grid is empty, no outlines or ticks,
   and after a reload still none.
5. **21-S6-5 Keep Locked Words:** only the locked words' letters remain,
   still locked, and they survive a reload. The cursor is on the first
   cell, Across.
6. **21-S6-6 Cancel:** nothing changes.
7. **21-S6-7 narrow (375px):** the buttons stack without overflow.

## Repo paths

Acceptance: the files above. Runtime:
`src/components/grid/StartOverDialog.tsx`,
`src/components/grid/PuzzleGridEditor.tsx`, `src/lib/locked-words.ts`.
Docs: this story, `../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
