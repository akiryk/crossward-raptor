# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md) and the stories in scope for the next action.

**Only if needed:** [HISTORY](HISTORY.md) (the handoff as of 3d6952a:
S1–S11 delivery, verification, open items, audit notes).

## Current state (2026-11-08, S17 drafting)

S1–S16 are done and on `main` (S14–S16 at `58b77b3`). The human's visual
check of S14–S16 passed except for two requests, which
[S17](stories/21-S17-tick-button-at-once.md) carries: hovering a locked
word (its tick or its letters) shows its button at once, and the tick
hover's black outline is 2px. **The human approved S17 (2026-11-08)**,
with its delegated details; it is frozen on `main` in a
specification-only commit (story, EPIC, this handoff and 4 amended
specs: `lock-tick-button`, `lock-tick-hover`, `lock-hover`,
`lock-refocus`). The scratch runtime is
`../crossward-raptor-s17-scratch.patch`; the story records its
discrimination.

S14–S16's implementation is in `src/lib/cell-appearance.ts`,
`src/components/grid/PuzzleGrid.tsx` and
`src/components/grid/PuzzleGridEditor.tsx`, frozen at `8ab0c42`.

S14–S16 verification (observed 2026-11-07, on the committed tree): `npm run
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

1. Apply the scratch patch and run `npm run verify` and the full
   `npm run test:e2e`. Push. The human checks S17 visually.
2. Then the independent, report-only closeout audit of S7–S17. Close the
   epic only with the human's agreement.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md and the S17 story in docs/epics/21-locked-words/stories/, then implement the frozen S17 on `main` per the handoff's next action.
