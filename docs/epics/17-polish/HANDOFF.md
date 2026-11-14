# Polish — Handoff

## Read first

1. [S11 — Smaller, centered mini grids](stories/17-S11-mini-grid-width.md).
2. This handoff and the EPIC's S11 item.

**Only if needed:** [HISTORY](HISTORY.md) for the original S1–S10 closeout;
[STORY](../../process/STORY.md) for verification/delivery rules;
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) for browser preparation.

## Current state (2026-11-14)

S11 is an authorized follow-up to the original closed Polish epic. The
human approved the investigated editor-only 500px mini cap and centering,
then requested documentation, implementation, commit and push. No next
story or merge is authorized by this session.

Work is isolated in `/private/tmp/crossward-mini-width` on
`polish/17-s11-mini-grid`, based on `961d969`. The original main worktree
has epic 26 work belonging to another paused agent: modified
`e2e/color-tokens.spec.ts` and `src/app/globals-css.test.ts`, plus untracked
`e2e/linked-clues.spec.ts` and `src/lib/clue-reference.test.ts`. Preserve it.
The separate branch also holds the specification-only freeze baseline,
following the human's isolation instruction rather than modifying main.

Specification/acceptance review: independent `mini_spec_review` approved
the final narrow supersession table and tests with no blockers. No runtime
implementation or final verification yet. The story lists every acceptance
amendment; after the baseline commit those tests are frozen.

## Verification

Pre-implementation browser demonstration by the primary agent on unchanged
runtime `961d969`: `env COMPOSE_PROJECT_NAME=crossward-raptor npm run
test:e2e -- e2e/mini-grid-width.spec.ts --workers=2`, exit 1. Eight expected
mini width failures, nine passes including setup, phone and other-size/player
guards. The new acceptance distinguishes the requested behavior.

Final `npm run verify` and full `npm run test:e2e` have not run. Browser
runs must hold `/tmp/crossward-e2e.lock`; DEVELOPMENT's standing grant
authorizes only the guarded local test-database reset. Set
`COMPOSE_PROJECT_NAME=crossward-raptor` in this temporary worktree to reuse
the existing local containers and avoid port collisions. An initial run
without it stopped on a port conflict before migration/reset. It created
unused stopped worktree-project containers/volumes; nothing was deleted.

## Next action

Commit the approved specification/acceptance baseline, implement S11 in the
one editor component, then run the required checks, record their evidence,
commit and push this branch. Preserve main's epic 26 changes. No PR or
merge is required by the declared paths or authorized in this task.

## Original closeout (historical, 2026-11-02)

S1–S10 were delivered on main, S3 through reviewed PR #32. Two independent
closeout audits ran; S10's Preview-black-cell rebus crash was corrected.
The human accepted the undeclared `WrappingField.tsx` change and unspecified
visual-check devices, recorded in the EPIC/HISTORY. Closeout verification
was `npm run verify` exit 0, 640/640 unit tests; the last full browser run
was the second audit's on `a6770a4`, 912 passed. These historical results
are not evidence for S11.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and docs/epics/17-polish/stories/17-S11-mini-grid-width.md. Complete S11 on polish/17-s11-mini-grid; commit and push only this branch, preserve epic 26 work, and do not merge.
