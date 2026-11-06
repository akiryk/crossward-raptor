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
- [S2 Lock and unlock a word](stories/21-S2-lock-a-word.md): **done**.
  Frozen at b45a4c6; [PR #33](https://github.com/akiryk/crossward-raptor/pull/33)
  independently reviewed (no blockers) and merged to `main` 2026-11-06 as
  693c02b. Its `src/lib/locked-words.ts` helpers and the stored
  `lockedWords` list are what S3–S6 build on.
- [S3 Locked cells hold](stories/21-S3-locked-cells-hold.md): drafted;
  acceptance tests not yet written; not approved. Next.
- [S4 The lock button's tooltip](stories/21-S4-lock-tooltip.md): drafted.
- [S5 Lock Word in the toggle row](stories/21-S5-toggle-row-lock.md):
  drafted.
- [S6 Reset Grid with locked words](stories/21-S6-reset-with-locks.md):
  drafted.

Epic 20 is closed (ba55af6). Epic 18's 18-S5-5 intermittent can fail a
full browser run; it's a recorded open item, unrelated to this epic.

## Verification (2026-11-06, PR #33 head b05141e, by the reviewer)

- `npm run verify`: exit 0 (677 unit tests).
- Full `npm run test:e2e`: 1064 passed, exit 0.
- Frozen acceptance unchanged since b45a4c6.
- CI: Vercel deployment only (no unit/E2E gates), passed.

## Review notes (PR #33, non-blocking)

- The lock button follows the editor's focus, as the cursor highlight
  does, so Tab past it to Reset Grid leaves it showing
  (`PuzzleGridEditor.tsx`, `lockTarget`).
- An outline's React key is its start and direction, so a locked word and
  a longer run from the same start could share one (a dev warning). Only
  reachable by typing into an end cell, which S3 blocks.

## Next action

Write S3's acceptance tests from its drafted specification, show they
discriminate, and present the specification and tests to the human for
approval and freeze (STORY). No runtime work before the freeze.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md and
docs/epics/21-locked-words/stories/21-S3-locked-cells-hold.md. Draft S3's
acceptance tests and bring S3 to approval and freeze on main; no runtime
work before the freeze.
