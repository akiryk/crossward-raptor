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

**S5 (narrow play) is drafted and awaiting approval**, uncommitted:
[15-S5-play-narrow.md](stories/15-S5-play-narrow.md), the new
`e2e/narrow-play.spec.ts`, and amendments to `e2e/color-tokens.spec.ts`,
`src/app/globals-css.test.ts` and `play-source.test.ts`'s `PLAY_FILES`.
The human accepted all five proposals on 2026-10-29: the bar empties
when the grid loses focus, and the arrows work as proposed *(human)*.
No frozen case retires.

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

The human approves S5's specification and acceptance (or asks for
changes). On approval, freeze them on `main` in a specification-only
commit, then implement S5 on `main`. Neither is authorized before that
approval.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S5-play-narrow.md. Once the human approves S5, freeze its specification and acceptance on main, then implement it on main.
