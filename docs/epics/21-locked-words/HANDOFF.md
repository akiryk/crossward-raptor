# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md) and the stories in scope for the next action.

**Only if needed:** [HISTORY](HISTORY.md) (the handoff as of 3d6952a:
S1–S11 delivery, verification, open items, audit notes).

## Current state (2026-11-07, S14–S16 delivered, awaiting visual check)

S1–S13 are done and on `main`, with the human's visual check of S12 and
S13.

S14–S16 (the human's review after S12–S13) were approved by the human,
delegated details included, and frozen at `8ab0c42` (stories, EPIC,
2 new tests, 15 amended specs). Their implementation is the scratch
patch with tidied comments, in `src/lib/cell-appearance.ts`,
`src/components/grid/PuzzleGrid.tsx` and
`src/components/grid/PuzzleGridEditor.tsx`, all off the risk paths:

- [S14](stories/21-S14-word-highlight-only.md): only the cursor's word
  is highlighted; with no word, only the line's off cells are dull blue.
- [S15](stories/21-S15-tick-hover-outline.md): the tick hover outlines
  each word in black instead of darkening it.
- [S16](stories/21-S16-three-second-wait.md): the button beside an
  unlocked word waits 3 seconds.

Verification (observed 2026-11-07, on the committed tree): `npm run
verify` exit 0 (733 unit tests; 2 pre-existing lint warnings). Full
`npm run test:e2e`: 1207 passed, 6 failed, none in a spec S14–S16 touch:
5 `ECONNRESET`s at sign-in or seeding (`menu-reset`, `row-menu`,
`session-renewal` ×2, `status-icons`) and `done-icon` 18-S5-5's
rounded-corner color read, as in the drafting run. Those 5 specs rerun
alone: 46 of 46 passed, exit 0. Frozen acceptance is unchanged since
`8ab0c42`. Browser runs used the standing guarded test-reset grant
(DEVELOPMENT "E2E environment").

The scratch patch `../crossward-raptor-s14-s16-scratch.patch` can be
deleted.

Non-blocking notes from S12/S13's reviews, for the closeout audit:
- No test pins B1 (frozen acceptance couldn't grow in S13).
- `wordHoldsCell` could simply export `holds`.
- After a click on the tick's button, back on the same end cell, a turn
  no longer picks again (untested).

Not started: the closeout audit (S7–S16 unaudited). Leftovers: branch
`story/21-S2-lock-a-word` (local and remote), stale
`../crossward-raptor-s6-draft/`, scratch patches
`../crossward-raptor-s12*-scratch*.patch`.

## Next action

1. The human checks S14–S16 visually.
2. Then the independent, report-only closeout audit of S7–S16. Close the
   epic only with the human's agreement.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md. After the human's visual check of S14–S16, run the independent, report-only closeout audit of epic 21's S7–S16.
