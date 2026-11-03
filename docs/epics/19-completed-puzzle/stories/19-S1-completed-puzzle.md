# Story S1 — The completed puzzle

A completed puzzle shows, under the title, only "The puzzle is complete."
and a Reset link at the grid's right edge. Reset confirms, then the
puzzle plays again from a blank attempt.

**Status: approved, frozen.** The human approved the request and
delegated approval and freeze on 2026-11-03 ("Delegate freeze"); the
wording "The puzzle is complete." is the human's choice. Frozen on
`main` in a specification-only commit.

**Blast radius: small, no risk path.** `src/components/play/` only;
`resetPlaySession` in `actions.ts` is reused unchanged. Direct delivery
to `main` (CODE-REVIEW).

## What the code does today

`PlayPuzzle.tsx`, once `locked`: wide (from 1430px), the title, the 32px
controls row with "Saved", then the ✓ (`play-completed-mark`) and "This
puzzle is complete. Your entries are read-only." 12px lower, then 27px
to a two-row grid: row 1 the empty Prominent Hint and the disabled Rebus
pill, 16px gap, row 2 the grid and the Player Hints. Narrow, the message
is 16px above the grid, and the disabled pill sits under the hint bar.
`PlayResetDialog` and `resetPlaySession` serve only the library's Reset.

## Decisions

From the human's request (EPIC), on a completed puzzle:

- **No Prominent Hint and no Rebus control**, at any width. The narrow
  hint bar stays (EPIC Non-goals).
- **No controls row.** The save status stays in the DOM but hidden, so a
  save or retry still reports through it; if a save fails, or the puzzle
  is no longer available, the row shows as today.
- **The message** reads "The puzzle is complete.", body-normal primary,
  with no checkmark (`play-completed-mark` is removed).
- **Reset** *(delegated details)*: a button styled as a link, labelled
  "Reset" like the library's and the filters' Reset, body-normal in
  `link-muted` with `button-hover` on hover and keyboard focus, as the
  filters' Reset (18-S4, the human's "blue like other links"). It's on
  the message's row: its right edge at the grid's, on the message's
  baseline. It opens the existing `PlayResetDialog`, naming the puzzle.
  Cancel returns focus to Reset. Confirming calls `resetPlaySession`,
  discards the old attempt's local draft and shows the returned blank
  attempt: unlocked, opening on 1 Across with the grid focused (17-S2).
  A failure shows the dialog's error and keeps the completed puzzle.
- **Spacing** *(delegated)*: wide, the message is 32px under the title
  (the title's margin) and the grid 32px under the message; the Player
  Hints start level with the grid. Narrow, the row is 16px above the
  grid, as the messages are (15-S5).

Unfinished puzzles are unchanged (EPIC).

## Acceptance

*Proposed and frozen 2026-11-03.*

### e2e/completed-play.spec.ts (new)

The play fixture (CAT / A#A / TEN).

1. **19-S1-1 wide (1440px):** no `prominent-hint`, `rebus-control` or
   visible save status or "Saved"; the message's text and style; Reset's
   text, size, color, no fill or border, pointer; Reset at the grid's
   right edge on the message's baseline; the 32px spacings and the
   Player Hints at the grid's top. The same once a puzzle finished in
   play closes its dialog.
2. **19-S1-2 narrow (768px):** the message and Reset 16px above the grid,
   no Rebus control, the hint bar visible.
3. **19-S1-3 Reset:** Cancel changes nothing and refocuses Reset;
   confirming leaves one blank, uncompleted attempt with a new ID, the
   grid focused on 1 Across, the Prominent Hint, Rebus control and save
   status back, and the puzzle plays and completes again; the library row
   reads untouched; a failed reset shows `play-reset-error` and keeps the
   completed puzzle and its attempt.
4. **19-S1-4 guards:** unfinished, wide and narrow, there's no Reset and
   the Rebus control stays *(pass today)*.

### Amended acceptance

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `no-play-reset.spec.ts` (17-S3) | header, 17-S3-1 completed cases | no Reset in play at all | a completed puzzle's only Reset is `play-reset-link`; unfinished cases unchanged |
| `play-completion.spec.ts` (P3) | `expectComplete`; Retry reconciles … | the ✓ visible | `play-completed-mark` count 0 |
| `play-design.spec.ts` (14-S7) | header; "a click on a hint does nothing once complete"; "a complete puzzle: the mark …" | empty Prominent Hint; ✓ in highlight | no Prominent Hint; no mark (`HIGHLIGHT` removed, unused) |
| `play-opening.spec.ts` (17-S2) | header; completed guard | empty Prominent Hint | no Prominent Hint |
| `narrow-play.spec.ts` (15-S5) | 15-S5-3 completed | mark and message 16px above the grid | the message 16px above, no mark |
| `rebus.spec.ts` (17-S10) | header; 17-S10-10 | completed pill inactive | no pill |
| `library-play.spec.ts` | finishing in play | waits for the ✓ | waits for the message |
| `modal-design.spec.ts` (F4-6) | completion OK | the ✓ visible | the message visible, no mark |

### Discrimination (2026-11-03, observed)

On `main` (4e5d462) with the proposed tests, `npm run test:e2e` over the
nine files above: 29 failed, 114 passed. The failures are every 19-S1
case except the guards, and every amended case. The guards and every
unamended case pass.

## Repo paths

Acceptance (immutable after freeze): `e2e/completed-play.spec.ts` and
the eight amended files above.

Runtime: `src/components/play/PlayPuzzle.tsx`;
`src/components/play/PlayReset.tsx` (comment only). Docs: this story,
`../EPIC.md`, `../HANDOFF.md`, `docs/epics/README.md`, and a superseded
note in `17-S3-no-reset-in-play.md`. Declare any other path before
editing it.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
