# Story S1 — Start Over

In the build phase, a gray Start Over link at the toggle row's right end
asks "Clear Puzzle", then empties the whole grid so the builder can start
again.

**Status: done 2026-11-04.** The human approved the specification and
acceptance 2026-11-04; frozen at 54583c1, implemented on `main`.

**Since [S4](20-S4-reset-grid.md):** the link and the dialog's title
and confirm say "Reset Grid", and the link sits under the grid on the
color key's line, with Rebus back at the toggle row's right end. S4
amended 20-S1-1, 20-S1-2 and 17-S10-5; everything else here holds.

**Blast radius: small, no risk path.** `src/components/grid/` only; no
engine, server action or storage change (the grid saves through the
existing autosave). Direct delivery to `main` (CODE-REVIEW).

## What the code does today

The build phase's toggle row (`ToggleRow`, 17-S8) is `justify-between`:
the Preview toggle at the left, the Rebus link (`RebusControl`, 17-S10)
at the right end, 16px in (12px below a 748px window). Both labels are
`text-label`. Clearing the grid means deleting every cell by hand.
Dialogs are `Modal` with `ModalActions` (confirm first, then the
alternate Cancel). `Modal` returns focus to what had it when it opened.

## Decisions

From the EPIC:

- **Start Over** (`start-over`): a button styled as a link, "Start
  Over", `text-label`, `subtle`, no fill or border, a pointer; `primary`
  on hover and keyboard focus, over 150ms. Always enabled, even on an
  empty grid. **Build phase only**: none in the hints phase or once
  published.
- **Placement:** the toggle row's right end, 16px in (12px below a 748px
  window), centered on the row; Rebus moves 20px before it, at every
  width. In the hints phase Rebus stays at the right end. (Superseded
  by [S4](20-S4-reset-grid.md): under the grid.)
- **The dialog** (`start-over-dialog`): title "Clear Puzzle"; body "Are
  you sure? This will remove every letter from the grid."; "Clear
  Puzzle" (`start-over-confirm`), then "Cancel" (`start-over-cancel`).
  Cancel or Escape changes nothing.
- **Confirming** makes every cell white and empty (letters, rebuses and
  any black cells), keeping the size and the title. It saves through the
  existing autosave; there's no undo. The cursor is on the first cell,
  Across, with the grid focused. Preview stays as it was; in Preview the
  cleared grid shows all black and the legend goes.

Delegated details:

- **Focus:** a click on Start Over doesn't take focus from the grid (as
  the Rebus link), so after Cancel or Escape the grid has it again. From
  the keyboard, `Modal` returns focus to Start Over.
- **An open rebus entry** is closed when Start Over is clicked, placing
  its text as leaving it does (17-S10); confirming then clears it with
  everything else.

## Acceptance

*Approved and frozen 2026-11-04.*

### e2e/start-over.spec.ts (new)

1. **20-S1-1 the link (1440px, then 375px):** in the toggle row; text,
   role, enabled; the toggle label's size, `subtle`, no fill or border,
   pointer; 16px from the row's right end, centered, Rebus 20px before
   it on its line; `primary` on hover and on keyboard focus (Tab from
   Rebus). At 375px: 12px in, Rebus 20px before it, no overflow.
   (Amended by S4: "Reset Grid", Tab from the grid; its placement is
   20-S4-1/2.)
2. **20-S1-2 the dialog:** its title, body and buttons, Clear Puzzle
   first; Cancel, and Escape, close it with the grid unchanged, focused
   and nothing saved.
3. **20-S1-3 confirming:** from a lettered grid with the cursor elsewhere
   going Down, every cell white and empty on screen and saved, the
   cursor on the first cell, Across, the grid focused, the title
   unchanged; typing writes in the first cell; after a reload the grid
   is still 5×5 and blank but for that letter.
4. **20-S1-4 black cells and rebuses** are cleared too.
5. **20-S1-5 in Preview:** Start Over enabled; after confirming, Preview
   is still on, every cell's state `black`, no legend, the blank grid
   saved; Preview off shows it white with the cursor on the first cell.
6. **20-S1-6 an open rebus entry** closes when Start Over is clicked;
   confirming leaves the grid blank.
7. **20-S1-7 an empty grid:** enabled; confirming leaves it blank, the
   cursor on the first cell.
8. **20-S1-8 guards:** no Start Over in the hints phase or once
   published *(pass today)*.

### Amended acceptance

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `rebus.spec.ts` (17-S10) | header; 17-S10-5 (build phase) | Rebus 16px (12px narrow) from the toggle row's right end | Rebus 20px before Start Over, at both widths; the title says so (S4 put it back at the right end) |

### Discrimination (2026-11-04, observed)

On `main` (5fde635) with the proposed tests, `npm run test:e2e` over
`start-over.spec.ts` and `rebus.spec.ts`: 8 failed, 16 passed. The
failures are every 20-S1 case but the guard, and the amended 17-S10-5.

To check the tests themselves, a throwaway implementation (since
discarded; no runtime change remains) passed both files twice
(`--repeat-each=2`, 47 passed) once two test defects it exposed were
fixed in drafting: 20-S1-3 now waits for the letter to save before
reloading, and 20-S1-5 refocuses the grid after the Preview toggle took
focus. With it, the full `npm run test:e2e` passed (1028), so no other
frozen case needs amending.

### Implementation (2026-11-04, observed)

Over the implementation, with the frozen tests unchanged from 54583c1:
`start-over.spec.ts` and `rebus.spec.ts` 24 passed; `npm run verify`
exit 0 (656 unit tests); full `npm run test:e2e` exit 0, 1028 passed.
Two earlier full runs each had one different failure outside this
story's surface (14-S4-6's published Play it! colour caught
mid-transition; 15-S2-6 wide play at 2400px); each passed alone
repeated (10/10, 5/5) and the third full run was clean.

A Start Over confirmed from the keyboard would have its focus returned
to Start Over by `Modal`; the editor refocuses the grid after the dialog
closes, so confirming always leaves the grid focused.

## Repo paths

Acceptance (immutable after freeze): `e2e/start-over.spec.ts` and the
amended `e2e/rebus.spec.ts`.

Runtime: `src/components/grid/PuzzleGridEditor.tsx`; a new
`src/components/grid/StartOverDialog.tsx`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`. Declare any other path before editing it.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
