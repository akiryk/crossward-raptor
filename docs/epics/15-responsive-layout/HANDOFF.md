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

**S4 (the Hint Box) is approved and frozen**:
[15-S4-builder-hint-box.md](stories/15-S4-builder-hint-box.md). The
human answered its questions and approved it 2026-10-29 ("I approve
S4"; questions 3–5 as proposed). The freeze commit adds
`e2e/hint-box.spec.ts` and `src/lib/hint-order.test.ts`, retires
15-S3-7 and amends 15-S3-1's 999px hints case, D5a-2's phone case and
the two color-style lists. Implementation follows on `main`.

Stories go one at a time *(human, 2026-10-28)*. The epic was approved
2026-10-27; its approval doesn't approve any story.

## Verification

S3's implementation (`dc2cb48`): `npm run verify` exit 0 (595 Vitest
tests); full `npm run test:e2e` 703 of 703. S4's discrimination before
implementation: the four browser files 21 failed, 35 passed (details in
the story); its unit tests fail. The guarded reset uses the standing
grant in [DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

Implement S4 on `main` against its frozen acceptance, run `npm run
verify` and the full `npm run test:e2e`, push, then ask for the human's
visual check.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S4-builder-hint-box.md. Implement S4 against its frozen acceptance on main; push once verify and the full e2e suite pass.
