# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [S12](stories/21-S12-button-before-word.md) and
   [S13](stories/21-S13-tick-hover-button.md) (both frozen), and their
   acceptance files (named in each story's "Acceptance").
3. [EPIC](EPIC.md) "Changes from the human's visual testing (2026-11-07)"
   only if a decision is unclear.

**Only if needed:** [HISTORY](HISTORY.md) (the handoff as of 3d6952a:
S1–S11 delivery, verification, open items, audit notes).

## Current state (2026-11-07)

S1–S11 are done and on `main`. S12 and S13 are **approved by the human
and frozen, not implemented**:

- **Independent specification review** (2026-11-07, one report-only
  reviewer per story, neither the drafter): S12 three wording blockers
  (the new spec has 17 cases, not 18; 21-S10-4's move now takes 20 steps;
  in two columns the hints move 12px right and narrow by 12px), all
  fixed. S13 no blockers; its wording fixes were applied (Tab stop only
  for the cursor's own word, as S10; `tickTarget` decides on any ticked
  end cell; every word ending at the cell stays darker on the button;
  stale "on the tick" wording and an unmarked header change in
  `lock-tick-hover.spec.ts`). No behavior or assertion changed.
- **The human approved** both stories, the delegated decisions and the
  review's clarifications (2026-11-07).
- **Frozen baselines:** S12 `3660cbf` (story,
  `e2e/lock-button-side.spec.ts`, the 21-S12 amendments to 9 specs).
  S13 `a576f96` (story, `src/lib/tick-target.test.ts`,
  `e2e/lock-tick-button.spec.ts`, the 21-S13 amendments to
  `e2e/lock-tick-hover.spec.ts`). Compare acceptance against these.
- **Scratch runtimes** (reverted, outside the repo, for discrimination
  only): `../crossward-raptor-s12-scratch.patch` (S12) and
  `../crossward-raptor-s12-s13-scratch-v2.patch` (S12+S13). They may
  serve as a starting point; the implementation must still meet the
  frozen specs and be reviewed.
- Not started: the closeout audit (S7–S13 unaudited); epic not closed.
- Leftovers: branch `story/21-S2-lock-a-word` (local and remote), stale
  `../crossward-raptor-s6-draft/`.

## Verification (2026-11-07, observed by the drafting session)

- Scratch S12 on 3d6952a, full `npm run test:e2e` before amendments: 71
  failed, 1107 passed. These pinned down the amendments in S12.
- S12 scratch: the 9 amended specs 143/143, the new spec 17/17.
- On `main` code with the new and amended specs: 48 failed, 112 passed.
  Every failure was at an S12 check except 3 load flakes (21-S2-10 ×2,
  15-S3-2), which passed 9/9 when rerun alone.
- S13 on `main`: the unit test 8/8 fail (missing `tickTarget`); the two
  tick specs 13 of 23 cases failed, each at an S12/S13 check.
- S12+S13 v2 scratch: the unit test 8/8; the two tick specs 23/23 and
  69/69 with `--repeat-each=3`; mutations caught (S13-4, S13-5). The
  full `npm run test:e2e`: 1207 passed, 1 failed (`library-play`
  `ECONNRESET`, 3/3 rerun alone).
- `npm run verify` not run on the drafted specs (`tsc --noEmit` reports
  only the expected missing `tickTarget`; ESLint passes). After the
  review's fixes (comments and a test title only), ESLint on
  `lock-tick-hover.spec.ts` passes and `tsc` is unchanged; no browser
  run since.

## Next action

Implement S12 on `main` against its frozen acceptance: `npm run verify`
and the full `npm run test:e2e` exit 0, independent review, deliver,
then the human's visual check. Then S13 the same way. Then the closeout
audit covering S7–S13. Close the epic only with the human's agreement.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md,
docs/epics/21-locked-words/stories/21-S12-button-before-word.md and
docs/epics/21-locked-words/stories/21-S13-tick-hover-button.md. Implement
S12, then S13, against their frozen acceptance on `main`, each verified,
independently reviewed and delivered.
