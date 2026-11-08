# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md) and the stories in scope for the next action.

**Only if needed:** [HISTORY](HISTORY.md) (the handoff as of 3d6952a:
S1–S11 delivery, verification, open items, audit notes).

## Current state (2026-11-07, B1 fix session)

S1–S13 are implemented and on `main` (pushed): S12 `86c4e7b`, S13
`76a6685`, and S13's B1 fix `19e0dee`.

- **S12:** independent review found no code blockers. One undeclared
  path, `LockWordControl.tsx`, has a comment-only change (the stale "full
  width" wording), which the reviewer accepted. Two non-blocking notes
  for the human's visual check: on narrow windows the grid may jump 20px
  up on load (`hasLockRoom` starts true and the first measurement sets
  `mb-4`), and a classic, non-overlay vertical scrollbar appearing
  doesn't trigger a re-measure.
- **S13:** B1 is fixed in `19e0dee`. Before the fix, the tick's word
  skipped S10's lockability check once unlocked. Now an unlocked tick
  word shows its button only while `lockTargetAt` at its first cell in
  its orientation returns the same word. An independent re-review found
  no blockers. Non-blocking notes for the closeout audit:
  - No test pins B1. Frozen acceptance can't grow in S13.
  - `wordHoldsCell` could simply export `holds`.
  - After a click on the button, back on the same end cell (no
    `onHoverCell`), a turn no longer picks again. This edge is untested.
- Not started: the closeout audit (S7–S13 unaudited). The epic is not
  closed. Leftovers: branch `story/21-S2-lock-a-word` (local and
  remote), stale `../crossward-raptor-s6-draft/`, and scratch patches
  `../crossward-raptor-s12*-scratch*.patch`.

## Verification (observed, `19e0dee`)

- `npm run verify` exits 0 (vitest 729/729).
- The full `npm run test:e2e`: 1208 passed, exit 0.
- Frozen acceptance is unchanged since the freeze: `git diff 20957ed
  19e0dee` touches only `src/` runtime files and this handoff.

## Next action

The human checked S12 and S13 visually on 2026-11-07, including the S12
notes above, and approved them. Next: an independent, report-only closeout
audit covering S7–S13. Close the epic only with the human's agreement.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md and docs/epics/21-locked-words/EPIC.md. Run the independent, report-only closeout audit of epic 21 (S7–S13) on `main`; report findings without editing files.
