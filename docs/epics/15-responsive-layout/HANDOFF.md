# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-28)

**S1 (560px grid) is implemented** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md). Frozen in `fef423e`
after the human's approval (2026-10-28: the draft, the 900px viewport
height, the hint lists at the grid's height). The implementation follows
the draft's throwaway: both grids are a fixed 560px wide, the hint lists
beside them take the grid's height, and the builder's load focus uses
`preventScroll`. Only the human's visual check remains of its Definition
of Done.

The epic was approved 2026-10-27; its approval doesn't approve any story.

## Verification

On the implementation tree, frozen acceptance unchanged from `fef423e`:
`npm run verify` exit 0 (47 files, 595 Vitest tests) and the full
`npm run test:e2e` exit 0, 663 of 663, using the standing reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment).

## Next action

The human's visual check of S1: the builder (both phases) and play at
1440px and on a short window, a Sunday's lists beside the grid. Then
S2 (wide layout) needs drafting, when authorized.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S1-560px-grid.md. With the human's approval of S1's draft, freeze it on main and implement it on main; don't freeze before approval.
