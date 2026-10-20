# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. [P4 story](stories/11-P4-reset.md), its two frozen acceptance files and the
   runtime paths it lists.

**Only if needed:** [EPIC P4](EPIC.md#p4--reset),
[STORY](../../process/STORY.md) for implementation and delivery,
[CODE-REVIEW](../../CODE-REVIEW.md) for the high-risk review path,
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) before browser work.
The [historical P3 completion handoff](HISTORY.md#historical-p3-completion-handoff-archived-during-p4-drafting-2026-10-19)
retains its full verification/permission provenance.

## Current state (2026-10-19)

**P4 specification and acceptance are approved and frozen on main; no P4
runtime implementation exists.** The human approved after review on
2026-10-19 and delegated the freeze to the agent, including two review fixes:
the client initializes from the returned reset view (a stale-ID success may
return a partial or completed attempt), and EPIC P5 must treat a blank,
uncompleted session as untouched. The human also authorized pushing main,
including the earlier unrelated commit `fd54be5`.

Frozen acceptance: **26 server cases** in
`src/app/puzzles/actions.play-reset.test.ts` and **24 browser cases** in
`e2e/play-reset.spec.ts`. The baseline commit is the one that introduced
this handoff text; find it with
`git log --format=%h -1 -- e2e/play-reset.spec.ts`.

Human decisions: reset stays on the play page and shows a fresh blank
attempt (one transaction deletes the old row and creates a new one); the
library reset control moves to P5. Known accepted limit: saves are keyed by
user and puzzle, so an old open tab can save into the fresh attempt.

P1–P3 remain complete; P3 merged in PR #22 at `4cfa4d7`.

## Verification

Observed against the frozen baseline: focused Vitest **26/26 expected
failures** at the missing `resetPlaySession` export; `tsc --noEmit` passed.
Earlier drafting checks: focused ESLint passed, Playwright discovery found 24
P4 cases + 1 auth setup, and the `enabled only after` browser case failed at
the absent enabled reset button, confirming it discriminates. Full
`npm run verify`, full E2E and visual demonstrations are implementation gates.

## Next action

When separately authorized, implement P4 on a story branch from the frozen
main per STORY, keeping frozen acceptance byte-identical to the baseline;
then open a PR for independent review per CODE-REVIEW.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and docs/epics/11-play/stories/11-P4-reset.md. Implement P4 on branch story/11-P4-reset from main; open a PR for independent review, don't merge.
