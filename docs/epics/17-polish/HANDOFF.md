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
16, then 17. No story is drafted.

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

**S1 is drafted, awaiting the human's approval** (2026-10-31):
[17-S1-missing-hints.md](stories/17-S1-missing-hints.md), with proposed
acceptance `e2e/missing-hints.spec.ts` and amendments to
`src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts` (adding
`pink` and `hint-missing`). The story, the spec and the amendments are
uncommitted on `main`; nothing is frozen and no runtime changed. No
pending question; the EPIC's proposed items are settled in the story's
Decisions. No risk path, so S1 is delivered directly on `main`.

## Verification

Drafting only. The story's Discrimination section records the observed
runs: a throwaway implementation (reverted) passes the proposed tests and
the related specs, current `main` fails 11 of 12 new cases (all but the
guard), and two mutations are caught. `tsc` and ESLint pass on the
proposed tests. `npm run verify` and the full `npm run test:e2e` were not
run.

## Next action

Once the human approves S1's specification, acceptance and amendments,
record the approval, freeze them on `main` in a specification-only
commit, then implement S1 on `main`. Without approval, don't freeze or
implement.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and docs/epics/17-polish/stories/17-S1-missing-hints.md. Once the human has approved it, freeze S1's specification and acceptance on main, then implement S1 on main and deliver it there.
