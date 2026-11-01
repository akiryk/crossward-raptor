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
implementation was delivered directly on `main` (no risk path).

**S2 is done** (2026-10-31): the human approved
[17-S2-play-opens-on-first-empty-cell.md](stories/17-S2-play-opens-on-first-empty-cell.md),
its acceptance `e2e/play-opening.spec.ts`, the amendments to
`e2e/play-entries.spec.ts`, `e2e/play-design.spec.ts`,
`e2e/narrow-play.spec.ts` and `e2e/play-route.spec.ts`, and the story's
proposed Decisions. They were frozen on `main` in 316c7f6
(specification only), and the implementation was delivered directly on
`main` (no risk path).

**S3 is approved and frozen** (2026-11-01): the human approved
[17-S3-no-reset-in-play.md](stories/17-S3-no-reset-in-play.md), its
proposed acceptance `e2e/no-play-reset.spec.ts`, the amendments to
`e2e/play-design.spec.ts`, `e2e/narrow-play.spec.ts` and
`e2e/modal-design.spec.ts`, and the retirement of `e2e/play-reset.spec.ts`
and `e2e/play-reset-settling.spec.ts`. The human decided that Reset stays
only in the library, on completed rows (recorded in the story and the
EPIC). Approved 2026-11-01 with its proposed Decisions and frozen on
`main` in ceba5ec (specification only, with the two deletions), then
implemented on `story/17-S3-no-reset-in-play` and opened as a PR,
awaiting independent review and merge. S3 touches `actions.ts`, so it is delivered by branch,
PR and independent review.

## Verification

S3: the observed discrimination is in the story. On the story branch,
precommit, frozen acceptance unchanged from ceba5ec: `npm run verify`
exit 0 (Vitest 620/620) and full `npm run test:e2e` exit 0 (816 passed). Browser runs
used the guarded harness under the standing reset grant
([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).

## Next action

Independently review S3's PR (`story/17-S3-no-reset-in-play`) per
[REVIEW](../../process/REVIEW.md), and merge it if no blockers remain.
The author does not merge it. Then update this handoff and mark S3 done.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and docs/epics/17-polish/stories/17-S3-no-reset-in-play.md. If the human has approved S3's draft, freeze it on main and implement it on story/17-S3-no-reset-in-play with a PR for independent review; otherwise stop and ask for approval.
