# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-29)

**S1 (560px grid) and S2 (wide layout) are done** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md) (frozen `fef423e`),
[15-S2-wide-layout.md](stories/15-S2-wide-layout.md) (frozen `ff07a76`).
The human's visual checks passed 2026-10-28 *(human)*.

**S3 (builder, narrow) is approved and frozen** *(human, 2026-10-29)*:
[15-S3-builder-narrow.md](stories/15-S3-builder-narrow.md) and
`e2e/narrow-builder.spec.ts`. The human's answers: narrow below a 1000px
window; the toggle 20px after the buttons (not at the row's right end);
16px spacing; the full hint list below the grid until S4.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

Not yet run on S3's implementation. The draft's throwaway is gone from
`/tmp`. The guarded reset uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

Implement S3 on `main` against the frozen spec; `npm run verify` and the
full `npm run test:e2e`, then the human's visual check.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and S3's draft. Apply the human's answers to S3's questions, then freeze and implement S3 once the human approves.
