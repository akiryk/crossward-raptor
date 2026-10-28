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

**S2 (wide layout) is approved and frozen** *(human, 2026-10-28)*:
[15-S2-wide-layout.md](stories/15-S2-wide-layout.md), frozen in the
specification-only commit "Freeze epic 15 S2: wide layout" with
`e2e/wide-layout.spec.ts` (20 cases), the six amended cases in
`build-grid-design`, `hint-phase-design` and `play-design`, and the EPIC
amendment. Its implementation is next, on `main`; the draft's throwaway
is `/tmp/crossward-drafts/15-S2-throwaway.patch`.

The epic was approved 2026-10-27; its approval doesn't approve any story.

## Verification

S2's draft, against the throwaway with the proposed spec and amendments:
`npm run verify` exit 0 (47 files, 595 Vitest tests); the full
`npm run test:e2e` exit 0, 683 of 683, using the standing reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment). Against `main`'s
runtime, 20 of the proposed cases fail as intended (story's
Discrimination). Nothing has run on an S2 implementation.

## Next action

Implement S2 on `main` against its frozen acceptance; push after
`npm run verify` and the full `npm run test:e2e` pass. The human's visual
checks of S1 and S2 remain.

## Resume prompt

Read docs/epics/15-responsive-layout/HANDOFF.md and docs/epics/15-responsive-layout/stories/15-S2-wide-layout.md. Implement the frozen S2 on main without changing its acceptance; push after npm run verify and the full npm run test:e2e pass.
