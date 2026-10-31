# Polish — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

## Current state (2026-10-31)

**The EPIC is approved** (by the human, 2026-10-27). It was drafted on
`main` from the human's list of design and UX issues and a Rebus mockup of
the same day. Their layout items went into epic 15 as an amendment, which
the human confirmed. Every pending question was answered before approval
(recorded in Decisions): Reset is removed from play, rebus can be typed in
the build phase, the hints phase and play, and the order is epic 15, then
16, then 17.

**Amended 2026-10-28** with S4, selection in Preview, from the human's
notes; Rebus is now S5. S6, the build phase's selection colors, was
added the same day; its details are all the human's. S4's *proposed*
cursor rules (Decisions) are settled when it is drafted.

**Amended 2026-10-31** from the human's addendum (folded into the EPIC's
"The human's details (2026-10-31)", then deleted): S6 only real words
(hints phase and play), S7 a 700px grid with NYT-style numbers, S8 step
controls, S9 Preview Hints, and the rebus cell's look. Selection colors
is now S5 and Rebus S10. The human answered the drafting questions the
same day (recorded in the EPIC) and approved the amendment. Epics 15
and 16 are closed.

**S1 is done** (2026-10-31): the human approved
[17-S1-missing-hints.md](stories/17-S1-missing-hints.md), its acceptance
`e2e/missing-hints.spec.ts` and the amendments to
`src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`. They were
frozen on `main` in 96a3cd6 (specification only), and the
implementation was delivered directly on `main` (no risk path). S2 has
no story yet.

## Verification

S1, on the implementation tree delivered with this handoff:
`npm run verify` exit 0 (Vitest 620 of 620); the full `npm run test:e2e`
exit 0 (822 passed), run through the guarded harness under the
standing reset grant ([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).
The frozen acceptance is unchanged from 96a3cd6.

## Next action

Write S2's specification ("S2 — Play opens on the first empty cell" in
the [EPIC](EPIC.md)) on `main` and stop for the human's approval.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and the EPIC's "S2 — Play opens on the first empty cell" section. Write S2's specification and proposed acceptance on main; don't freeze or implement it before the human approves.
