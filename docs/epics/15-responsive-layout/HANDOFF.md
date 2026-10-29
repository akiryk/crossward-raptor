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

**S6 (small screens) is implemented** on `main`:
[15-S6-small-screens.md](stories/15-S6-small-screens.md) (approved
*(human, 2026-10-29)*, frozen `3132b12`), pushed. It awaits the human's
visual check, listed in the story's Definition of Done.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

On S6's implementation tree (2026-10-29): `npm run verify` exit 0
(600 unit tests); full `npm run test:e2e` 776 passed, exit 0, including
the 36 frozen S6 cases. An earlier full run had one hover-timing failure
in `builder-controls.spec.ts` 14-S4-6 that passed on rerun and in the
final run. `e2e/` is unchanged since the freeze. The guarded reset used the standing
grant in [DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

The human visually checks S6 (the story's Definition of Done). S6 is the
epic's last story, so epic closeout follows once the check passes; it
needs the human's go-ahead.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S6-small-screens.md. Close out epic 15 per docs/epics/README.md#close-an-epic once the human's S6 visual check has passed, on main.
