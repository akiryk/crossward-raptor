# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. The frozen [P5 story](stories/11-P5-library-play.md) and its acceptance
   files for implementing P5.

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

**P5 is approved and frozen (2026-10-20).** On `main`: the [P5 story](stories/11-P5-library-play.md) and frozen
acceptance, namely `src/app/puzzles/actions.library-play.test.ts` (13),
`src/lib/puzzle-groups.play.test.ts` (6) and `e2e/library-play.spec.ts` (18).
The human approved every drafter recommendation, plus a clickable row (a
stretched primary link: Play when published, Edit when a draft) and an
interim **Manage** link on own published rows until a later "⋯" menu story.

P5 also needs a **correction to frozen O3 acceptance**
(`e2e/builder-edits.spec.ts` and the
[O3 story](../10-ownership/stories/10-O3-builder-edits.md)). Another
builder's published rows may now offer Play and Reset, but never an editor
link; their drafts keep no controls. The human approved it on 2026-10-20. A
separate read-only reviewer agent then reviewed it independently: APPROVE.
Its nits and its P5 test findings were applied: scroll-in and real pointer
clicks for the stretched-link test, the caller-filter enforced at the query
mock, a discriminating stale-ID refresh, Manage hover/cursor, and the dialog
copy contract.

Runtime is not authorized. The standing guarded local test-reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) still applies to necessary
harness runs; nothing else is authorized.

Draft checks (author):
- `tsc --noEmit` and eslint on the changed tests exit 0.
- The new unit tests on unchanged runtime: 14 fail on missing behavior and
  5 guards pass.
- A throwaway `listPuzzles`/`groupPuzzles` prototype, reverted and never
  committed, passed all 35 files / 579 unit tests, frozen ones included. That
  run predates the caller-filter tightening, which the prototype met.
- An E2E red run on unchanged runtime under the standing grant: 18/18 P5
  cases fail at P5 assertions. Every corrected `builder-edits.spec.ts` case
  passes.
- The P5 browser spec has not passed against any implementation.

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

P5 runtime, once separately authorized: branch `story/11-P5-library-play`
from the frozen baseline, implement against the frozen acceptance, open a PR
and arrange independent review. Freeze commits: the O3 correction `be3a58b`,
then the P5 baseline `687ac58`. Compare the acceptance files and
`e2e/builder-edits.spec.ts` against `687ac58` before delivery.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and docs/epics/11-play/stories/11-P5-library-play.md. Implement P5 against its frozen acceptance on branch story/11-P5-library-play, then open a PR for independent review.
