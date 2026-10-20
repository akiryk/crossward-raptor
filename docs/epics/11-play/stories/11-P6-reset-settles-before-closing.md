# Story P6 — Reset settles before closing

Close the P4 reset window that the P4 review and the
[closeout audit](../HISTORY.md#closeout-audit-2026-10-20) left open
(follow-up 7): after a reset returns a full attempt, the play page drops the
player's keystrokes while that attempt's completion check is pending.

**Status:** specification and acceptance approved and frozen on `main` by
the human on 2026-10-20, including the recommended check-failure decision.
Runtime is not yet authorized.
**Blast radius: low:** client-only change to `PlayPuzzle.tsx`; no CODE-REVIEW
risk path. The standing direct-delivery policy applies after approval.

## Problem

Inspected `PlayPuzzle.tsx`, `PlayReset.tsx`, the P4 story and its frozen
`e2e/play-reset.spec.ts`.

`confirmReset` (`PlayPuzzle.tsx:171-182`) stops the old save workflow, clears
`autosave.current` and closes the dialog, then awaits `beginSession`. When the
returned view's entries are full, `beginSession` first awaits
`inspectPlayCompletion` (`:59-60`) before binding a new save workflow and
showing the returned attempt. During that wait, the page is `ready`, unlocked
and no dialog is open, so the old grid is editable. Typed letters are
discarded (`autosave.current?.change` is a no-op on null), while the cursor
still advances. The returned attempt then replaces the grid.

The ordinary blank reset never opens this window: an empty grid isn't full, so
`beginSession` updates state without awaiting. Only a P4 stale-ID success
returning the caller's full current attempt reaches it. For example, another
tab already reset and filled or completed the puzzle.

## Decisions

- A confirmed reset stays **pending in its dialog** until the returned
  attempt is shown with its new save workflow bound: through the reset
  request, old-workflow retirement, draft-key removal and any completion
  check of the returned entries. The existing P4 pending contract holds for
  that whole span. The dialog shows pending feedback; confirmation and every
  dismissal route stay disabled; grid keystrokes don't edit behind it, and
  only one dialog is open.
- The dialog closes in the same update that shows the returned attempt.
  Focus returns to the opener exactly as in P4. A returned incorrect full
  attempt is shown editable with no P3 dialog. A returned completed attempt
  is shown locked with its completed mark, without confetti or the P3
  dialog (unchanged P4 rules).
- **Check failure after an acknowledged reset** (human-approved
  2026-10-20): close the dialog and show the existing start error with
  **Retry**, as when an initial start's check fails. This is today's
  behavior, just ordered after the pending span. Retry calls
  `startPlaySession`, which returns the same current attempt. The old
  workflow stays retired and its draft key removed, because the server has
  already acknowledged the reset. Rejected alternative: keeping the reset
  dialog open with its error. **Cancel** would then have to resume the old
  workflow, whose pending edits would save over the returned attempt, since
  saves are keyed by user and puzzle.
- Reset request failures, the blank-reset path, the save/inspection
  settling order before the request, and all other P4 behavior are
  unchanged.

## Acceptance

Frozen executable acceptance in a new file, `e2e/play-reset-settling.spec.ts`
(3 cases). Frozen `e2e/play-reset.spec.ts` stays unchanged. Each case loads
attempt A, then replaces it out-of-band with a full attempt B, simulating
another tab, and holds the first server action after the reset request
(B's completion check):

1. **Incorrect B, builder shortcut:** while the check is held, the dialog,
   pending feedback and disabled confirm/cancel/close persist through
   Escape, a backdrop click and typing, which edits nothing; one dialog.
   After release: the dialog closes; focus is on `play-reset-button`; B's
   entries show, unlocked, with no P3 dialog; the row is unchanged. The
   first keystroke afterwards edits the grid and saves into B's row.
2. **Completed B, options route:** same pending assertions. After release:
   focus is on `play-options`; locked with the completed mark; no confetti
   or dialog; the row, including `completedAt`, is unchanged; no further
   server action.
3. **Check fails (guard for the approved decision):** the dialog closes
   to the start error, with reset controls disabled. The old draft key is
   removed; B is unchanged; Retry shows B ready.

Hooks reused from P4; no new test IDs.

## Non-goals / scope

Follow-up 7 only. No change to server actions or their signatures, save or
inspection keying (the accepted cross-tab limit from P4 stands), `Modal`,
`PlayReset.tsx` UI/copy, the library reset (it has no grid, so no window),
P1–P5 frozen acceptance, the engine, or schema. Audit follow-ups 8–12 stay
open and separate.

## Repo paths

- Frozen acceptance: `e2e/play-reset-settling.spec.ts`.
- Future runtime: `src/components/play/PlayPuzzle.tsx` (`confirmReset` only,
  expected).
- Documentation: this story, `../HANDOFF.md`, `../HISTORY.md` if a
  checkpoint is archived.

Declare additional paths before editing. If the actual diff reaches a
CODE-REVIEW risk path, move it to a story branch and PR.

## Draft checks (2026-10-20, drafting author)

- `tsc --noEmit` and eslint on the new spec exit 0.
- Red on unchanged runtime under the standing guarded E2E grant: cases 1–2
  fail at the dialog-still-pending assertion. Case 3 passes, because it
  guards today's failure behavior.
- A throwaway `confirmReset` prototype (closing the dialog and clearing
  pending only after `beginSession` settles), reverted and never committed,
  passed all 3 new cases and all 24 cases of the frozen
  `e2e/play-reset.spec.ts`. The full E2E suite and `npm run verify` haven't
  run against it.

## Definition of done

- Human approval of this story and its acceptance; commit only that
  baseline on `main` before runtime (done 2026-10-20).
- Implement the frozen scope; preserve all frozen acceptance.
- `npm run verify` and the full `npm run test:e2e -- --workers=2` exit 0
  without weakened assertions, retries or timeouts. Record the exact
  content identity.
- Update the handoff (mark follow-up 7 resolved) and deliver per the
  direct-delivery policy.
