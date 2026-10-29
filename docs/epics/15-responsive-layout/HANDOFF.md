# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-29)

**S1, S2 and S3 are done** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md) (frozen `fef423e`),
[15-S2-wide-layout.md](stories/15-S2-wide-layout.md) (frozen `ff07a76`),
[15-S3-builder-narrow.md](stories/15-S3-builder-narrow.md) (frozen
`36529ab`, implemented `dc2cb48`). The human's visual checks passed,
S1 and S2 on 2026-10-28 and S3 on 2026-10-29 *(human)*.

**S4 (the Hint Box) is implemented and pushed; awaiting the human's
visual check.** [15-S4-builder-hint-box.md](stories/15-S4-builder-hint-box.md),
approved 2026-10-29 *(human)*, frozen `cda1f8d`. A frozen-test defect
(a filled 5×5's Across words are 1, 6–9, not 1–5) was corrected with the
human's approval and an independent review in the specification-only
commit `6ea7f24`; the story records it.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S4's discrimination before implementation: the four browser files ran
21 failed, 35 passed (details in the story). On the final code: `npm run
verify` exit 0 (600 Vitest tests) and the full `npm run test:e2e` 720
passed. The guarded reset uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

The human's visual check of S4 (the story's Definition of Done): the
hints phase at 999, 768 and 640px (the box, the arrows through a wrap,
locked and published), the style guide's `sg-hint-box`, and unchanged at
1000px. Once it passes, mark S4 done here. S5 (narrow play) is not
authorized until the human starts it.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and the "S5 — Play, narrow" section of docs/epics/15-responsive-layout/EPIC.md. Once the human's S4 visual check passes, mark S4 done, then draft S5's specification and acceptance on main for the human's approval; don't freeze or implement it.
