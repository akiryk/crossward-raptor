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

**S3 (builder, narrow) is implemented** on `main`, awaiting the human's
visual check: [15-S3-builder-narrow.md](stories/15-S3-builder-narrow.md)
(frozen `36529ab`, approved *(human, 2026-10-29)*). The human's answers:
narrow below a 1000px window; the toggle 20px after the buttons (not at
the row's right end); 16px spacing; the full hint list below the grid
until S4. The narrow threshold is a container query on `puzzle-editor`
(`@container/editor`, 952px), replacing the builder's `lg` breakpoints.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S3's implementation (2026-10-29): `npm run verify` exit 0 (595 Vitest
tests); `e2e/narrow-builder.spec.ts` 20 of 20; full `npm run test:e2e`
703 of 703, the frozen spec unchanged from `36529ab`. The guarded reset
uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

The human's visual check of S3: the builder (both phases, Preview, the
published state) at 999, 768 and 640px, and unchanged at 1000px. When it
passes, mark S3 done here and draft S4 (the Hint Box); S4 isn't
authorized until then.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md. Record the human's visual check of S3, then draft S4.
