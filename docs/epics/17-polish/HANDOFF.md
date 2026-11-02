# Polish — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

## Current state (2026-11-01)

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

**S3 is done** (2026-11-01): the human approved
[17-S3-no-reset-in-play.md](stories/17-S3-no-reset-in-play.md), its
acceptance `e2e/no-play-reset.spec.ts`, the amendments to
`e2e/play-design.spec.ts`, `e2e/narrow-play.spec.ts` and
`e2e/modal-design.spec.ts`, the retirement of `e2e/play-reset.spec.ts`
and `e2e/play-reset-settling.spec.ts`, and its proposed Decisions. Reset
stays only in the library, on completed rows. Frozen on `main` in ceba5ec
(specification only). Because it touches `actions.ts`, it was delivered as
PR #32, independently reviewed with no findings and merged into `main` in
8cb74a8.

**S4 is done** (2026-11-01): the human approved
[17-S4-selection-in-preview.md](stories/17-S4-selection-in-preview.md),
its acceptance `e2e/preview-selection.spec.ts`, the amendment to
`e2e/grid-focus.spec.ts` and its proposed Decisions. 05-D4's unit tests
stay (the EPIC's S4 and Decisions lines amended to say so). Frozen on
`main` in fd7fca9 (specification only); the implementation was
delivered directly on `main` (no risk path).

**S5 is done** (2026-11-01): the human approved
[17-S5-selection-colors.md](stories/17-S5-selection-colors.md), its
acceptance `e2e/selection-colors.spec.ts`, the amendments to
`src/app/globals-css.test.ts`, `e2e/color-tokens.spec.ts`,
`e2e/build-grid-design.spec.ts` and `e2e/hints-grid-editing.spec.ts`,
and its proposed small calls. Frozen on `main` in 5924598
(specification only); the implementation was delivered directly on
`main` (no risk path).

**S6 is done** (2026-11-01): the human approved
[17-S6-only-real-words.md](stories/17-S6-only-real-words.md), its
acceptance `e2e/real-words.spec.ts`, the amendments to
`e2e/hint-box.spec.ts` (15-S4-6) and `e2e/play-entries.spec.ts` (P2
Backspace), and both pending questions as proposed. Frozen on `main` in
1269487 (specification only); the implementation (`src/lib/word-cursor.ts`,
used by the hints phase in `PuzzleGridEditor` and by `PlayPuzzle`) was
delivered directly on `main` (no risk path).

**S7 is done** (2026-11-01): the human approved
[17-S7-larger-grid.md](stories/17-S7-larger-grid.md) and its acceptance
(frozen in 3152562, implemented in 8cf2828), then its
[correction](stories/17-S7-larger-grid.md#correction-2026-11-01-human-approved)
(the NYT's type on a Sunday only, 8px side padding below a 748px window),
independently reviewed, frozen in 86497f2 and implemented in 73ad3c0 (no
risk path). The human's visual check passed the same day.

**S8 is done** (2026-11-01): the human approved
[17-S8-step-controls.md](stories/17-S8-step-controls.md), its acceptance
`e2e/step-controls.spec.ts`, the amendments to 13 frozen files (the
story's table), the EPIC's amended Step controls decision and S8 line,
and its pending question as proposed (keep F6's blue toggle). Frozen on
`main` in 898bb5a (specification only); the implementation (the
drafting throwaway, reviewed against the Decisions) was delivered
directly on `main` (no risk path): the current step as a `title-4`
label, one button for the next step, the toggle row on a 10px-cornered
`toggle-row` panel, no build-phase Publish or "Lol."/"Nope.", and 1's
"done" look removed. The human's visual check passed the same day.

**S9 was implemented** (2026-11-01):
the human approved
[17-S9-preview-hints.md](stories/17-S9-preview-hints.md), its acceptance
`e2e/preview-hints.spec.ts` (no frozen test amended) and both pending
questions as proposed: the Prominent Hint between the toggle row and the
grid, 16px over the grid as in play; Lock Grid Letters inactive at 50%
opacity with a not-allowed cursor. Frozen on `main` in be03d64
(specification only); the implementation (the drafting throwaway,
reviewed against the Decisions and tidied) was delivered directly on
`main` (no risk path): a Preview Hints toggle (wide, its own
`preview-hints-row` panel over the hints list; narrow, after Lock Grid
Letters) showing play's grid without letters, Player Hints and Prominent
Hint (narrow, play's hint bar), selection as in play and no typing.

**S9's visual check asked for a correction** (2026-11-01), which the
human approved the same day, including "no blue in the Player Hints" as
proposed (their "blue highlight area" was the Prominent Hint; the grid's
S5 colors are unchanged): only the hints list changes (Player Hints in full, no
blue selection, clicks do nothing); the grid stays editable, Lock Grid
Letters works as always, no Prominent Hint, no narrow toggle
([S9's correction](stories/17-S9-preview-hints.md#correction-2026-11-01-human-approved)).
With it, S1's missing mark fills only the input, not the row
([S1's correction](stories/17-S1-missing-hints.md#correction-2026-11-01-human-approved)).
Amended: `e2e/preview-hints.spec.ts`, `e2e/missing-hints.spec.ts` and
the EPIC. Independently reviewed the same day (no blockers; its four
should-fix items and nits were addressed and re-checked) and frozen on
`main` in 9845001 (specification only). The corrections were implemented
directly on `main` the same day (no risk path); the human's visual check
of them is pending.

## Verification

S9 and S1 corrections (precommit tree, committed unchanged; frozen
acceptance unchanged from 9845001): `npm run verify` exit 0 (Vitest
626/626) and full `npm run test:e2e` exit 0 (897 passed).

S9 implementation (precommit tree, committed unchanged; frozen
acceptance unchanged from be03d64): `npm run verify` exit 0 (Vitest
626/626) and full `npm run test:e2e` exit 0 (897 passed). Drafting: `main`
with the proposed test failed 11 of 12 cases (the one guard passed).

S8 implementation (precommit tree, committed unchanged; frozen
acceptance unchanged from 898bb5a): `npm run verify` exit 0 (Vitest
626/626) and full `npm run test:e2e` exit 0 (885 passed).

S7 correction, frozen in 86497f2 and implemented in 73ad3c0 (precommit
tree, committed unchanged): `npm run verify` exit 0 (Vitest 626/626) and
full `npm run test:e2e` exit 0 (875 passed).

Browser runs used the guarded harness under the standing reset grant
([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).

## Next action

Draft S10 (Rebus) from the EPIC's S10 section, after the human's visual
check of S9's correction.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md and the S10 section of docs/epics/17-polish/EPIC.md. Draft S10's specification and acceptance on main for the human's approval; do not implement it.
