# Responsive layout — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** epic 14's [Open at closeout](../14-screen-redesign/EPIC.md#open-at-closeout-2026-10-27)
for the carried items' original wording.

## Current state (2026-10-28)

**S1 (560px grid) is frozen** on `main`:
[15-S1-560px-grid.md](stories/15-S1-560px-grid.md). The human approved
the draft on 2026-10-28, with the 900px viewport height and the hint
lists at the grid's height. The freeze commit holds the story,
`e2e/grid-size.spec.ts`, the amendments to `e2e/build-grid-design.spec.ts`,
`e2e/play-design.spec.ts` and `e2e/editor-layout.spec.ts`,
`playwright.config.ts`'s 1440×900 viewport and the EPIC amendment.
Implementation is next, on `main` (no risk path).

The epic was approved 2026-10-27; its approval doesn't approve any story.

## Verification

Drafting checks, on the draft plus the reverted throwaway
(`/tmp/crossward-drafts/15-S1-throwaway.patch`): `npm run verify` exit 0
and the full `npm run test:e2e` 663 of 663. Details in the story's
Discrimination.

## Next action

Implement S1 on `main` against the frozen acceptance; `npm run verify`
and the full `npm run test:e2e`, then the human's visual check.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S1-560px-grid.md. With the human's approval of S1's draft, freeze it on main and implement it on main; don't freeze before approval.
