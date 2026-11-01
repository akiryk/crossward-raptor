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

**S7 is implemented, awaiting the human's visual check** (2026-11-01):
the human approved
[17-S7-larger-grid.md](stories/17-S7-larger-grid.md), its acceptance
`e2e/larger-grid.spec.ts`, the amendments to nine frozen specs, the
retirement of 14-S5-4's shorter-screen case and 15-S6-2 and 15-S6-3 (all
listed in the story), and both pending questions as proposed (numbers
with no floor or cap; the EPIC's "smaller relative to the cell"
corrected to the measurement). Frozen on `main` in 3152562
(specification only); the implementation (700px grid, thresholds moved
by 140px, pitch-based letters and numbers in `PuzzleGrid`, `LetterCell`
and `CellNumber`, the style guide's `sg-grid-corner` and 700px samples)
was delivered directly on `main` (no risk path).

## Verification

S7, on the implementation (precommit tree, committed unchanged), frozen
acceptance unchanged from 3152562: `npm run verify` exit 0 (Vitest
626/626) and full `npm run test:e2e` exit 0 (862 passed).

S7 drafting (story's Discrimination): with a throwaway implementation
(since reverted; patch at `/tmp/s7/throwaway.patch`, not in the repo) and
the amendments, the full `npm run test:e2e` had 861 passed and 1 failed
(`session-renewal` A4, `ECONNRESET`; passed 8 of 8 on rerun). Current
`main` with the proposed tests: 67 failed, 131 passed across the ten
files. `tsc` and ESLint pass on the tests. `npm run verify` was not run
(no runtime change).

S6, on the implementation (precommit tree, committed unchanged), frozen
acceptance unchanged from 1269487: `npm run verify` exit 0 (Vitest
626/626) and full `npm run test:e2e` exit 0 (848 passed). An earlier
full run had one transient failure (16-S1-1, `ECONNRESET` on
`/api/auth/get-session`), which passed in isolation and on the rerun.
Browser runs used the guarded harness under the standing reset grant
([DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment)).

## Next action

The human's visual check of S7 (its Definition of Done): a Sunday at
700px and on a phone. Once confirmed, mark S7 done here and draft S8,
Step controls (EPIC "S8 — Step controls"), per
[STORY](../../process/STORY.md), for the human's approval.

## Resume prompt

Read docs/epics/17-polish/HANDOFF.md. Once the human confirms S7's visual check, mark S7 done and draft S8 (Step controls) on main; stop for the human's approval before freezing or implementing.
