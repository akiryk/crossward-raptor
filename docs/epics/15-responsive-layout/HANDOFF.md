# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-28)

**S1 (560px grid) and S2 (wide layout) are done** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md) (frozen `fef423e`),
[15-S2-wide-layout.md](stories/15-S2-wide-layout.md) (frozen `ff07a76`).
The human's visual checks passed 2026-10-28 *(human)*.

**S3 (builder, narrow) is drafted, not approved:**
[15-S3-builder-narrow.md](stories/15-S3-builder-narrow.md) and its
proposed `e2e/narrow-builder.spec.ts`, both uncommitted in the worktree
until freeze. It has four questions for the human (the threshold, the
toggle's place, the spacing, the hints phase until S4). The throwaway
used to measure and discriminate is
`/tmp/crossward-drafts/15-S3-throwaway.patch`, reverted.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S3's draft: the proposed spec fails 17 of 20 against `main`'s runtime and
passes 20 of 20 against the throwaway. **The full suite against the
throwaway has not completed** (memory pressure stalled the harness's
build; details in the story's Discrimination): rerun it before freeze. The guarded reset
uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

The human answers S3's four questions and approves the draft. Then revise
the draft and its spec to the answers, re-run the discrimination if they
change it, and freeze on `main` in a specification-only commit. Don't
implement before the freeze.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and S3's draft. Apply the human's answers to S3's questions, then freeze and implement S3 once the human approves.
