# Hint refinements — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [S3](stories/26-S3-linked-hints.md) and [EPIC](EPIC.md).
3. [Current evidence](CLOSEOUT.md) only for verification/audit details.

## Current state (2026-11-15)

The human visually reviewed S1/S2 and requested three changes: accept See as
well as With; fill the full referenced clue row in play with pale blue
(#E8F7FF, explicitly confirmed); remove individual keyword decoration in
builder fields and all displays. [S3](stories/26-S3-linked-hints.md) records
the approved amendment and explicitly supersedes the conflicting S1 rules.
S2 grid behavior remains, extended to See by the shared parser.

Starting worktree was clean at `74d130f` on `epic/26-hint-refinements`.
S3's semantic acceptance amendments were independently reviewed by
`s3_amendment_review`, with no blockers/vacuous assertions. The orchestrator
observed discrimination before the main specification/acceptance-only freeze
`26c15f7`, pushed to main and integrated into epic at `25384e0`. Original With
parser cases, S2 browser acceptance and F1 color assertions were preserved;
only explicit S1 conflicts were amended. S3 runtime was implemented by a
separate agent in ten declared paths and committed as `656de61` on the epic
branch after checks. No test/doc edits by that agent.

S1/S2 runtime remains in epic history (`957ddda`, `271b25c`), with historical
verification in [CLOSEOUT-S2](CLOSEOUT-S2.md) and [HISTORY-S1](HISTORY-S1.md).
Their earlier full-suite pass does not establish a pass for S3. Neither story
introduced engine/storage/server/schema/collaboration risk paths. Main has
specification/acceptance only for this epic; no epic runtime merged to main.

## Verification

Orchestrator-observed on the old runtime plus proposed amendments:

- Unit discrimination: exit 1, four new See cases fail; 19 retained cases pass.
- Browser discrimination: exit 1, nine fail/three pass across amended
  linked-clues and new linked-hints; expected absent behavior confirmed.
- Independent proposed correction review: approved; its small story-count
  wording note was fixed before freeze. Runtime was unchanged during drafting.

Separate verifier `s3_verify`: `npm run verify` exited 0 (114 files / 1,311
tests), and all 238 affected browser checks passed with the documented
2-worker machine cap. Content hashes bind precommit results to `656de61`.
The complete `npm run test:e2e -- --workers=2` exited 0 at fixed `656de61`:
1,429 passed (13.6m), one complete clean run on the first S3 attempt. The
2-worker machine cap is recorded in CLOSEOUT; no assertions, timeouts or
retries changed. Independent report-only audit found no source/scope/test
blockers; three stale documentation references were corrected and rechecked.
Final docs leave tested runtime/acceptance unchanged. No external CI pass
is claimed. Human visual approval of S3 remains pending. Browser runs use the
repository lock and DEVELOPMENT's standing grant for guarded local test
resets. Existing data outside that validated test target is untouched.
Detailed commands/outcomes are recorded in [CLOSEOUT](CLOSEOUT.md).

## Next action

The local app is restored at `http://localhost:3000` (`npm run dev` ready).
S3 runtime and closeout docs are delivered on `epic/26-hint-refinements`;
check live git state for final docs commit. No runtime merge to main or next
story is authorized. Visually check With/See reciprocal clues in builder and
play, the full referenced play row in pale blue, plain keywords everywhere,
and unchanged cursor/current-word colors. Record the result and address any
reported issues on the epic branch. The epic is not marked closed.

## Resume prompt

Read docs/epics/26-hint-refinements/HANDOFF.md and docs/epics/26-hint-refinements/stories/26-S3-linked-hints.md. Record the human's visual-check result for epic/26-hint-refinements and address any reported issues; do not merge to main.
