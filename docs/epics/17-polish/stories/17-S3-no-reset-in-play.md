# Story S3 — No Reset in play

A player resets a puzzle only from the library (`/puzzles`), with the
small Reset button on a completed Play row and its confirmation dialog.
Play loses "Puzzle options", its Reset menu item, the builder's Reset
button and its Reset dialog. Nothing else in the builder or play resets.

**Status: approved and frozen** (2026-11-01). The human approved this
specification, its acceptance, the retirements and the proposed
Decisions on 2026-11-01. Frozen on `main` in a specification-only
commit; implemented on `story/17-S3-no-reset-in-play`.

**Blast radius: small, but a risk path.** It removes play's Reset UI and
the code only that UI used. Removing `isPlayPuzzleBuilder` touches
`src/app/puzzles/actions.ts` (CODE-REVIEW risk path), so delivery is a
branch, a PR and independent review. No schema, storage or engine change.

## What the code does today

I inspected `PlayReset.tsx`, `PlayPuzzle.tsx`, `play/page.tsx`,
`play-autosave.ts`, `Button.tsx`, `LibraryPlayControls.tsx`,
`resetPlaySession` and `isPlayPuzzleBuilder` in `actions.ts`, and every
frozen test that names Reset, `play-options` or `play-reset-*`.

- Reset has three entry points, and all of them open `PlayResetDialog`
  and call `resetPlaySession`:
  1. In wide play, every player's "Puzzle options" (`play-options`), a
     disclosure holding "Reset puzzle" (`play-reset-option`).
  2. In wide play, the builder's "Reset puzzle" button
     (`play-reset-button`). `isPlayPuzzleBuilder` exists only to choose it.
  3. In the library, a "Reset" button (`puzzle-reset-button`) on
     completed Play rows only (14-S2, *human*). It uses its own copy of
     `PlayResetDialog`, which names the puzzle.
- In narrow play, 1 and 2 are rendered but hidden (15-S5).
- The builder pages (build phase, hints phase, published) have no Reset.
- Play's Reset flow is the only user of the autosave's `suspend` and
  `resume`, of `PlayPuzzle`'s `resetOpen`/`resetPending`/`resetFailed`
  state and `beginSession`'s `onShown`. Puzzle options is the only user
  of `Button`'s `ref`, `aria-expanded` and `aria-controls` props.
- `resetPlaySession`'s unit tests (`actions.play-reset.test.ts`) test the
  action, not play's UI.

## Decisions

### Reset is only in the library *(human, 2026-11-01)*

"I want to be able to reset a puzzle from the `/puzzles` page and only
from that page. There will be a small button to reset a puzzle. There will
be a confirmation dialog. The reset button will not be on the build or
play page or anywhere else."

- **Only completed rows** show the library's Reset, as today *(human,
  2026-11-01, keeping 14-S2)*. An unfinished puzzle starts over by
  deleting letters by hand (EPIC). A completed puzzle is read-only, so
  the library's Reset is the only way to play it again.
- **The library is unchanged**: its button, its dialog, the attempt
  replacement, draft cleanup, pending and failure handling. This settles
  the EPIC's conflict between "Reset is removed entirely" and its
  Non-goal "Changes to the library". `resetPlaySession` and
  `PlayResetDialog` stay, because the library calls them.

### Removed from play

- `PlayResetControls` (Puzzle options, its menu item and the builder's
  button), play's `PlayResetDialog` instance, and `PlayPuzzle`'s reset
  state and `openReset`/`cancelReset`/`confirmReset`.
- *Proposed:* the code only play's Reset used, so nothing is left
  orphaned: `PlayPuzzle`'s `isBuilder` prop, `isPlayPuzzleBuilder` (the
  page's only caller), `beginSession`'s `onShown`, the autosave's
  `suspend`, `resume`, `interrupt` and their `suspended`/`idle` state,
  and `Button`'s `ref`, `aria-expanded` and `aria-controls` props.
- `PlayResetDialog` stays in `components/play/PlayReset.tsx`, since the
  frozen `play-source.test.ts` reads that path. Its comment says the
  library uses it.

### The controls row *(proposed)*

The wide controls row stays 32px tall, 32px below the title, so the grid
doesn't move. It now holds only the save status (or the "no longer
available" message), at its right edge as today. In narrow play nothing
visible changes.

### No other change

Play's start, Retry, autosave, completion and the opening cursor (S2) are
unchanged. So are the builder and the library.

## Acceptance

*Frozen 2026-11-01.* One new file, three amended files and two
retired files.

### e2e/no-play-reset.spec.ts (new)

The play fixture (CAT / A#A / TEN).

1. **17-S3-1 play has no Reset**, at 1440px and at 768px, for the
   builder's puzzle (first opened, partial, completed) and another
   builder's (partial, completed). None of `play-options`,
   `play-reset-option`, `play-reset-button` or `play-reset-dialog` exists
   in the page (not merely hidden). No button is named Reset or Puzzle
   options, no menu item is named Reset, and no dialog is open.
   - A guard: the library's Reset on a completed row still opens its
     dialog, and confirming leaves the row untouched *(passes today)*.
2. **17-S3-2 the builder has no Reset** in the build phase, the hints
   phase, or a published puzzle the builder has completed. Same checks
   *(guards; pass today)*.

### Retired and amended acceptance

Each change is retired in the specification-only freeze commit. Every
other frozen test is unchanged, including `library-play.spec.ts` (the
library's Reset) and `actions.play-reset.test.ts` (`resetPlaySession`).

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/play-reset.spec.ts` (11-P4) | the whole file (24 cases) | play's Reset: Puzzle options, the builder's button, the dialog, cancel, success, pending, failure, in-flight saves, draft cleanup | **retired** (file deleted), replaced by 17-S3-1. The library's same behaviors stay covered by `library-play.spec.ts` |
| `e2e/play-reset-settling.spec.ts` (11-P6) | the whole file (3 cases) | play's Reset stays pending until the returned attempt is shown | **retired** (file deleted). Without play's Reset, no attempt replaces the shown one in place |
| `e2e/play-design.spec.ts` (14-S7) | header comment | the controls row holds Reset and Puzzle options | it holds only the save status |
| | 14-S7-4 "the title is title-1 primary, 32px above the controls row" | measured to `play-options` | measured to the save status: its centre 48px below the title (a 32px gap, then the 32px row) |
| | 14-S7-4 "Reset and Puzzle options are alternate Buttons; the menu item is body-normal primary" | their style | **retired**, replaced by 17-S3-1 |
| | 14-S7-4 "the save status is body-small, muted, on the controls row" | centred on `play-options` | "… at its right": centred 48px below the title, its right edge at the title's |
| `e2e/narrow-play.spec.ts` (15-S5) | `WIDE_PARTS` (15-S5-1, 2 cases) | includes `play-options` and `play-reset-button` | drops them and adds `play-save-status`, so 1290px still checks the controls row |
| `e2e/modal-design.spec.ts` (F4) | F4-5 "play reset's footer: confirm then cancel" | opens the dialog from play's builder button | "the library reset's footer …": finishes the puzzle in play, then opens the dialog from its library row |

### Acceptance choices *(drafting)*

- Absence is checked with `toHaveCount(0)`, not `toBeHidden`: narrow play
  renders the wide controls hidden, and a hidden Reset still counts as
  being there.
- The names (`/reset|puzzle options/i`) back up the test ids, so a Reset
  with a new id is still caught.
- The play cases cover both builders because only the builder had the
  visible button, and the completed cases because a completed puzzle
  can only be reset from the library.
- F4-5 keeps the Reset dialog's footer covered through the library, the
  dialog's only remaining opener.
- Not covered: the removed dead code. Independent review checks it
  (CODE-REVIEW: orphaned code), and `tsc`/ESLint catch dangling uses.

### Discrimination (2026-11-01, observed)

- **Current `main` with the proposed tests:** `no-play-reset`,
  `play-design`, `narrow-play` and `modal-design` ran 11 failed and 59
  passed (with the setup project). The failures are every 17-S3-1 play
  case, both widths (narrow included, since the hidden controls are in
  the DOM). The guards and the amended cases pass on `main`. A drafted
  keyboard case only repeated the absence check and was dropped.
- **Throwaway implementation** of the Decisions, including the proposed
  dead-code removal, then reverted (patch kept outside the repo).
  `npm run verify` exit 0 (Vitest 620 of 620). The full
  `npm run test:e2e` ran 815 passed and 28 failed: 27 were the two
  retired files. One was `session-renewal.spec.ts` "visiting
  /style-guide renews …", which failed after 128ms and passed 8 of 8
  alone on the same tree. It's unrelated to Reset (the style guide has no
  Reset).

## Repo paths

Acceptance (immutable after freeze): `e2e/no-play-reset.spec.ts`, the
three amended files above, and the deletion of `e2e/play-reset.spec.ts`
and `e2e/play-reset-settling.spec.ts`.

Runtime:

- `src/components/play/PlayReset.tsx`: only `PlayResetDialog` remains.
- `src/components/play/PlayPuzzle.tsx`: no Reset controls, dialog, state
  or `isBuilder`.
- `src/app/puzzles/[id]/play/page.tsx`: no `isPlayPuzzleBuilder`.
- `src/app/puzzles/actions.ts`: remove `isPlayPuzzleBuilder` (risk path).
- `src/components/play/play-autosave.ts`: remove `suspend`/`resume`.
- `src/components/ui/Button.tsx`: remove `ref`, `aria-expanded`,
  `aria-controls`.
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S3. Out of scope: the library's Reset and dialog (unchanged), a
Reset on in-progress library rows (the human kept 14-S2's rule),
`resetPlaySession`, and every other EPIC story.

## Definition of done

- The human approves this specification, its acceptance, the
  retirements and the proposed Decisions, recorded here and in the
  handoff. Freeze on `main` in a specification-only commit before any
  runtime change.
- Frozen acceptance is unchanged after freeze.
- On `story/17-S3-no-reset-in-play`: `npm run verify` exits 0 and the
  full `npm run test:e2e` exits 0. Then a PR, independent review per
  [CODE-REVIEW](../../../CODE-REVIEW.md), and merge.
- The handoff is updated with observed results.
