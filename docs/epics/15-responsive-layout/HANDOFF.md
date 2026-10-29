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

**S4 (the Hint Box) is drafted**, uncommitted:
[15-S4-builder-hint-box.md](stories/15-S4-builder-hint-box.md). The
human gave the box's mockup and colors 2026-10-29 (questions 1 and 2;
the lengths are measured from it). Pending: questions 3–5 (what an arrow
does with focus, locked and published, the focus underline and the
style names) and approval. Its spec file
(`e2e/hint-box.spec.ts`) and discrimination run come after the answers.
It proposes retiring 15-S3-7 and amending 15-S3-1's 999px hints case,
D5a-2's phone case and the two color-style lists.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S3's implementation (`dc2cb48`): `npm run verify` exit 0 (595 Vitest
tests); full `npm run test:e2e` 703 of 703. S4 is a draft: no checks
apply yet.

## Next action

The human answers S4's questions. Then revise the draft, write
`e2e/hint-box.spec.ts` and the unit test, observe their discrimination
(the guarded reset uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)), and ask for
approval. Freezing and implementing S4 need that approval.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S4-builder-hint-box.md. Record the human's answers to S4's questions, then finish S4's draft and acceptance for approval; no freeze before approval.
