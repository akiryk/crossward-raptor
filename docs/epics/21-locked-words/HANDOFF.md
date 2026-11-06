# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), then the active story.

## Current state (2026-11-06)

The EPIC's decisions came from an interview with the human 2026-11-06.
**The human approved the EPIC 2026-11-06.**

- [S1 The word highlight](stories/21-S1-word-highlight.md): **done**,
  delivered on `main` (frozen at 69407b0). Its `buildWord`
  (`src/lib/build-word.ts`) is the run S2 and S3 reuse.
- [S2 Lock and unlock a word](stories/21-S2-lock-a-word.md): **approved
  and frozen** 2026-11-06 at b45a4c6 (on `main`, pushed). **Implemented**
  on branch `story/21-S2-lock-a-word`, pushed, **[PR #33](https://github.com/akiryk/crossward-raptor/pull/33)
  open, awaiting independent review**. The story's "Implementation notes" record the scope additions
  (`loadPuzzle` in `actions.ts`, the editor page, `GridCell.tsx`) and
  tradeoffs. Risk path: needs a PR and independent review.
- [S3 Locked cells hold](stories/21-S3-locked-cells-hold.md): drafted.
- [S4 The lock button's tooltip](stories/21-S4-lock-tooltip.md): drafted.
- [S5 Lock Word in the toggle row](stories/21-S5-toggle-row-lock.md):
  drafted.
- [S6 Reset Grid with locked words](stories/21-S6-reset-with-locks.md):
  drafted.

Epic 20 is closed (ba55af6). Epic 18's 18-S5-5 intermittent can fail a
full browser run; it's a recorded open item, unrelated to this epic.

## Verification (2026-11-06, the branch's implementation commit)

- `npm run verify`: exit 0 (677 unit tests).
- `npm run test:e2e -- e2e/lock-word.spec.ts`: 16 passed, exit 0.
- Frozen acceptance unchanged since b45a4c6 (`git diff` empty).
- Full `npm run test:e2e`: 1064 passed, exit 0. Started after the last
  code change, so it covers 1e35aa2's code (only docs changed since).

## Next action

Review PR #33 independently, following REVIEW. Merge it only if there are
no blockers and the required verification and CI pass. The author must not
merge it.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md and
docs/epics/21-locked-words/stories/21-S2-lock-a-word.md. Review PR #33
independently per REVIEW, merging only if it passes.
