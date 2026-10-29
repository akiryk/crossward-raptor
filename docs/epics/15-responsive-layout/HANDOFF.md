# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-29)

**S1–S4 are done** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md) (frozen `fef423e`),
[15-S2-wide-layout.md](stories/15-S2-wide-layout.md) (frozen `ff07a76`),
[15-S3-builder-narrow.md](stories/15-S3-builder-narrow.md) (frozen
`36529ab`, implemented `dc2cb48`),
[15-S4-builder-hint-box.md](stories/15-S4-builder-hint-box.md) (frozen
`cda1f8d`, corrected `6ea7f24`, implemented `a72c476`). The human's
visual checks passed, S1 and S2 on 2026-10-28, S3 and S4 on 2026-10-29
*(human)*.

**S5 (narrow play) is implemented** on `main`:
[15-S5-play-narrow.md](stories/15-S5-play-narrow.md), approved by the
human 2026-10-29 ("I approve S5"), frozen in `6f91950`. The Hint Box's
arrow moved to the shared `src/components/ui/HintArrow.tsx`; the bar is
`src/components/play/PlayHintBar.tsx`. Pending: the human's visual check
(the story's Definition of Done).

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S5's implementation: `npm run verify` exit 0 (600 Vitest tests); full
`npm run test:e2e` 741 passed. The frozen acceptance is unchanged from
`6f91950`. The guarded reset uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

The human's visual check of S5 (the list in its Definition of Done).
When it passes, mark S5 done; the next job is S6's specification
(`EPIC.md`), which needs its own approval before freeze.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and the "S6 — Small screens" section of docs/epics/15-responsive-layout/EPIC.md. Once the human's S5 visual check passes, mark S5 done, then draft S6's specification and acceptance on main for the human's approval; don't freeze or implement it.
