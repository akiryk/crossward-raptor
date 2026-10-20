# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. [EPIC P5](EPIC.md#p5--the-library-learns-about-play) and the current
   library path (`listPuzzles` and the specs asserting the library's shape)
   for drafting the P5 specification.

**Only if needed:** [P4 story](stories/11-P4-reset.md) for reset behavior P5
reuses; [STORY](../../process/STORY.md) for drafting, approval and freeze;
[CODE-REVIEW](../../CODE-REVIEW.md) for the high-risk path;
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) before browser work.
[History](HISTORY.md) retains older evidence; do not load it for routine startup.

## Current state (2026-10-20)

**P1–P4 are complete.** P4 was independently reviewed (separate session from
its author) and merged in
[PR #23](https://github.com/akiryk/crossward-raptor/pull/23). Reviewed head
**`c73cde7`** (implementation `5e62dc4` plus a handoff-only commit); normal
merge commit **`740d569`** at 2026-10-20 14:30 UTC, read back as MERGED.
This documentation-only closeout follows it on `main`. Frozen acceptance
(`src/app/puzzles/actions.play-reset.test.ts`,
`e2e/play-reset.spec.ts`) is byte-identical to baseline `14bb217`.

The review found no blockers. Non-blocking note: when a reset returns a full
(stale-ID) attempt, `confirmReset` closes the dialog before `beginSession`
finishes its completion inspection; keystrokes in that brief window are
dropped, since no save workflow is bound. This doesn't affect the ordinary
blank-reset path.

Known accepted limit (human decision): saves are keyed by user and puzzle,
so an old open tab can save into the fresh attempt. The library reset control
is deferred to P5.

**P5 is not authorized.** No P5 specification exists yet. The standing
guarded local test-reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) still applies to necessary
harness runs; nothing else is authorized.

## Verification

Reviewer-observed on `c73cde7` (code identical to `5e62dc4`):
`npm run verify` exit 0, 33 files / 560 tests (only the pre-existing
`request-logger/render.ts:802` lint warning); full
`npm run test:e2e -- --workers=2` exit 0, **417 passed**, under the standing
grant. Configured CI (Vercel deployment and Preview Comments; deploy only, no
test gates) passed on that head before merge.

The author separately reported the same verify result, focused P4 E2E 25/25,
and a visual check of the builder shortcut, options disclosure, confirmation,
pending, error, completed-to-blank reset and non-builder view (throwaway
script, not committed). The reviewer did not repeat the visual check.

## Next action

Draft the P5 specification and proposed acceptance per STORY, starting from
EPIC P5 and a grep of every library-shape assertion. Resolve material product
decisions with the human. Approval/freeze on `main` precedes any runtime work,
which then needs a story branch, PR and independent review.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and docs/epics/11-play/EPIC.md (P5 — The library learns about play). Write the P5 story specification and its proposed acceptance tests on main; don't commit until I approve and freeze them.
