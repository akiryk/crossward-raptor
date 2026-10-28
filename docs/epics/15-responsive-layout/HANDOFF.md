# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-28)

**S1 (560px grid) is implemented** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md), frozen in `fef423e`.
Only the human's visual check remains of its Definition of Done.

**S2 (wide layout) is implemented** on `main`:
[15-S2-wide-layout.md](stories/15-S2-wide-layout.md), approved by the
human and frozen in `ff07a76` (2026-10-28). Only the human's visual check
remains of its Definition of Done (the builder's two phases, Preview and
play at 2400, 1440, 1290 and 1100px).

**S3 (builder, narrow) is next, not drafted.** Stories go one at a time
*(human, 2026-10-28: the idea of drafting every story up front for one
unattended run was dropped)*.

The epic was approved 2026-10-27; its approval doesn't approve any story.

## Verification

S2's implementation: `npm run verify` exit 0 (47 files, 595 Vitest
tests); the full `npm run test:e2e` exit 0, 683 of 683, using the
standing reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). The frozen
acceptance is unchanged since `ff07a76`.

## Next action

The human's visual checks of S1 and S2. Draft S3 from the EPIC's S3
entry: inspect the affected code, propose the narrow builder's exact
values (spacing, threshold) with questions for the human, write the
proposed acceptance and demonstrate its discrimination. Don't freeze or
implement before the human approves the draft.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and the EPIC's S3 entry. Draft S3 (builder, narrow) with its proposed acceptance and questions for the human; don't freeze or implement before approval.
