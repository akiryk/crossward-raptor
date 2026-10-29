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

**S5 (narrow play) is approved and frozen**:
[15-S5-play-narrow.md](stories/15-S5-play-narrow.md). The human
accepted all five proposals and approved it 2026-10-29 ("I approve
S5"). The freeze commit adds `e2e/narrow-play.spec.ts` and amends
`e2e/color-tokens.spec.ts`, `src/app/globals-css.test.ts` and
`play-source.test.ts`'s `PLAY_FILES`. No frozen case retires.
Implementation follows on `main`.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S4's implementation (`a72c476`): `npm run verify` exit 0 (600 Vitest
tests); full `npm run test:e2e` 720 passed. S5's discrimination on the
uncommitted draft (2026-10-29): the new spec with `color-tokens` ran 23
failed, 7 passed, each failure for missing behavior; the two amended
Vitest files fail as intended; `tsc` and ESLint pass. The guarded reset
uses the standing grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

Implement S5 on `main` against its frozen acceptance, run `npm run
verify` and the full `npm run test:e2e`, push, then ask for the human's
visual check.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S5-play-narrow.md. Implement S5 against its frozen acceptance on main; push once verify and the full e2e suite pass.
