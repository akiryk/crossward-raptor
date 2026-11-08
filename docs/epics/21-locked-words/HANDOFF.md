# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md) and the stories in scope for the next action.

**Only if needed:** [HISTORY](HISTORY.md) (the handoff as of 3d6952a:
S1–S11 delivery, verification, open items, audit notes).

## Current state (2026-11-08, S17 delivered, awaiting visual check)

S1–S16 are done and on `main`, with the human's visual check of S14–S16
(2026-11-08). Its two requests are
[S17](stories/21-S17-tick-button-at-once.md): hovering a locked word (its
tick or its letters) shows its button at once, and the tick hover's
black outline is 2px, growing inward. The human approved S17; it is
frozen at `3594f9c` (story, EPIC, 4 amended specs) and implemented in
`PuzzleGrid.tsx` and `PuzzleGridEditor.tsx`, off the risk paths.

S17 verification (observed 2026-11-08, on the committed tree): `npm run
verify` exit 0 (733 unit tests). Full `npm run test:e2e`: 1211 passed,
2 failed, both `ECONNRESET`s in specs S17 doesn't touch
(`library-play` P5, `play-entries` P2); those 2 specs rerun alone: 44 of
44 passed, exit 0. Frozen acceptance is unchanged since `3594f9c`.
Browser runs used the standing guarded test-reset grant (DEVELOPMENT
"E2E environment").

S14–S16 verification (observed 2026-11-07, on the committed tree): `npm run
verify` exit 0 (733 unit tests; 2 pre-existing lint warnings). Full
`npm run test:e2e`: 1207 passed, 6 failed, none in a spec S14–S16 touch:
5 `ECONNRESET`s at sign-in or seeding (`menu-reset`, `row-menu`,
`session-renewal` ×2, `status-icons`) and `done-icon` 18-S5-5's
rounded-corner color read, as in the drafting run. Those 5 specs rerun
alone: 46 of 46 passed, exit 0. Frozen acceptance is unchanged since
`8ab0c42`. Browser runs used the standing guarded test-reset grant
(DEVELOPMENT "E2E environment").

The scratch patches `../crossward-raptor-s14-s16-scratch.patch` and
`../crossward-raptor-s17-scratch.patch` can be deleted.

Non-blocking notes from S12/S13's reviews, for the closeout audit:
- No test pins B1 (frozen acceptance couldn't grow in S13).
- `wordHoldsCell` could simply export `holds`.
- After a click on the tick's button, back on the same end cell, a turn
  no longer picks again (untested).

Not started: the closeout audit (S7–S17 unaudited). Leftovers: branch
`story/21-S2-lock-a-word` (local and remote), stale
`../crossward-raptor-s6-draft/`, scratch patches
`../crossward-raptor-s12*-scratch*.patch`.

## Next action

1. The human checks S17 visually.
2. Then the independent, report-only closeout audit of S7–S17. Close the
   epic only with the human's agreement.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md. After the human's visual check of S17, run the independent, report-only closeout audit of epic 21's S7–S17.
