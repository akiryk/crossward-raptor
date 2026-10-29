# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-29)

**S1–S5 are done** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md) (frozen `fef423e`),
[15-S2-wide-layout.md](stories/15-S2-wide-layout.md) (frozen `ff07a76`),
[15-S3-builder-narrow.md](stories/15-S3-builder-narrow.md) (frozen
`36529ab`, implemented `dc2cb48`),
[15-S4-builder-hint-box.md](stories/15-S4-builder-hint-box.md) (frozen
`cda1f8d`, corrected `6ea7f24`, implemented `a72c476`),
[15-S5-play-narrow.md](stories/15-S5-play-narrow.md) (frozen `6f91950`,
implemented `e45504d`). The human's visual checks passed, S1 and S2 on
2026-10-28, S3–S5 on 2026-10-29 *(human)*.

**S6 (small screens) is drafted, its questions answered, not yet
approved**: [15-S6-small-screens.md](stories/15-S6-small-screens.md) and
`e2e/small-screens.spec.ts`, both **uncommitted** in the `main` worktree
until freeze. The human answered all six questions 2026-10-29; on the
Hint Box they chose "no ellipses": the title and every hint field wrap,
and the box stacks its word over the hint when they don't fit. Not
frozen; no runtime change.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S6's draft spec: `tsc --noEmit` and ESLint pass; its discrimination run
(36 cases) had 13 failed, 23 passed, as the story records. The guarded
reset uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). No runtime change
since S5's `npm run verify` exit 0 and full `npm run test:e2e` 741
passed.

## Next action

The human approves (or revises) S6's specification and acceptance. Then freeze it on `main` in a
specification-only commit and implement it; S6 is the epic's last
story, so closeout follows its visual check.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S6-small-screens.md. Once the human approves it, freeze S6 on main in a specification-only commit, then implement it on main; don't start epic closeout.
