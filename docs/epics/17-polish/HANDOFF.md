# Polish — Handoff

## Read first

1. This handoff and [S12 — Quiet saved state](stories/17-S12-quiet-saved-state.md).
2. The [approved acceptance packet](acceptance/README.md).

**Only if needed:** [S13](stories/17-S13-prominent-hint-polish.md) for the later
story; [evidence](acceptance/EVIDENCE.md) for identities, independent reviews
and expected failures; [S11 closeout](CLOSEOUT-S11.md) for historical delivery.

## Current state (2026-11-15)

**S12 and S13 are approved and frozen; neither is implemented.** The human's
actual response was **“I approve S12 and S13”**, covering both specifications,
new executable acceptance and exact supersessions. The packet explicitly
requires separate runtime authorization; none was given in this session.

Local `main` contains separate specification-only baselines:

- **S12:** `4fda6c96b08982672574f8cbd97ca896dda7e252` — 23 new browser cases,
  exact supersessions for 26 existing cases across seven files.
- **S13:** `d3a05cb3f712c9852fea25db255058f3edf8c080` — eight new browser cases,
  exact supersessions for 16 cases plus five map-driven cases across six files.

Both exact patches are applied and retained as approval records. The only new
suite edits beyond approved content are administrative frozen-header comments.
Runtime, configuration and other frozen acceptance are unchanged. Prior
independent specification reviews remain recorded; they are not runtime reviews.

Starting branch was `main` at `61bb72a`. Pre-existing modified epic/handoff/index
and untracked S12/S13 packet were preserved and included only as applicable.
The unrelated, pre-existing `CLOSEOUT-S11.md` remains untracked and untouched.
Freeze commits and this documentation update are local only: no push, PR, merge
or deployment. S1–S11 remain historically complete; epic 26 is closed on main.
The existing auth warning in DEVELOPMENT remains outside this work; agents must
not inspect/edit environment files.

## Verification

This session directly observed matching approved SHA-256 identities, exact
S12 → S13 patch application and byte comparisons across all 11 amended files,
unchanged runtime sources, passing local Markdown path and scoped whitespace
checks. Retained patch-format context spaces are excluded from whitespace checks.
`npx tsc --noEmit` passed. `npm run verify` exited **1** after TypeScript/lint
passed (two existing warnings): 1177 tests passed, one expected S13 assertion
failed because runtime lacks `prominent-hint-empty`, and 18 database suites
could not connect to localhost:5433 (133 tests skipped). This is a red acceptance
baseline, not passing runtime verification. Tested acceptance/runtime content is
unchanged in the S13 commit; only documentation was updated after that check.

Browser and visual checks were not rerun; no database reset occurred. Earlier
draft-session expected failures and reviews are historical evidence linked above.
Passing full verification, full E2E and required visual checks remain outstanding.

## Next action

Obtain runtime authorization for S12 (pasting the resume prompt grants it).
Then implement S12 using its frozen baseline for a clean verification tree,
without S13's later expectations. Preserve S13 acceptance on main when integrating
S12 runtime. Do not skip, weaken or delete frozen tests. S13 runtime still needs
its own authorization after S12. Follow STORY for risk classification and delivery.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and docs/epics/17-polish/stories/17-S12-quiet-saved-state.md, then docs/epics/17-polish/acceptance/README.md. Implement S12 on main using its frozen baseline for verification; preserve S13 frozen acceptance and leave S13 runtime implementation out of scope.
