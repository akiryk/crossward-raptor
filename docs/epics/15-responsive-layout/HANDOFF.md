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

**S5 (narrow play) is drafted**, uncommitted, awaiting the human's
answers to its five questions and approval:
[15-S5-play-narrow.md](stories/15-S5-play-narrow.md). The narrow-play
mockup isn't in the repo, so the hint bar's measurements, what shows
above the grid, the spacing, the new style's name (`play-hint-bar`) and
the empty bar and arrows' behavior are proposed. Its spec file
(`e2e/narrow-play.spec.ts`) and discrimination run come after the
answers. It expects no retired case (every frozen spec opens play at
1440px or wider) and amends the two color-style lists and
`play-source.test.ts`'s `PLAY_FILES`.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S4's implementation (`a72c476`): `npm run verify` exit 0 (600 Vitest
tests); full `npm run test:e2e` 720 passed. S5 is a draft: no checks
apply yet.

## Next action

The human answers S5's questions. Then revise the draft, write
`e2e/narrow-play.spec.ts` and the amendments, observe their
discrimination (the guarded reset uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)), and ask for
approval. Freezing and implementing S5 need that approval.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S5-play-narrow.md. Record the human's answers to S5's questions, then finish S5's draft and acceptance for approval; no freeze before approval.
