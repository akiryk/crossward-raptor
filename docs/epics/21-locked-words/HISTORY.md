# Locked words — Handoff history

Historical: the operational handoff as it stood at 3d6952a (2026-11-07), before
the human's visual check of S8–S11. Kept for its evidence; not current state.


## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), then the active story.

## Current state (2026-11-07)

The EPIC's decisions came from an interview with the human 2026-11-06.
**The human approved the EPIC 2026-11-06.**

- [S1 The word highlight](stories/21-S1-word-highlight.md): **done**,
  delivered on `main` (frozen at 69407b0). Its `buildWord`
  (`src/lib/build-word.ts`) is the run S2 and S3 reuse.
- [S2 Lock and unlock a word](stories/21-S2-lock-a-word.md): **done**.
  Frozen at b45a4c6; [PR #33](https://github.com/akiryk/crossward-raptor/pull/33)
  independently reviewed (no blockers) and merged to `main` 2026-11-06 as
  693c02b. Its `src/lib/locked-words.ts` helpers and the stored
  `lockedWords` list are what S3–S6 build on.
- [S3 Locked cells hold](stories/21-S3-locked-cells-hold.md): **done**.
  Frozen at 3dc7c6b by the orchestrator (delegated); implemented in
  6e20297 on `main` (off the risk paths), independently reviewed with no
  blockers.
- [S4 The lock button's tooltip](stories/21-S4-lock-tooltip.md): **done**.
  Frozen at a8f4dff (delegated); implemented in a49795a on `main` (off
  the risk paths), independently reviewed with no blockers.
- [S5 Lock Word in the toggle row](stories/21-S5-toggle-row-lock.md):
  **done**. Frozen at 704161b, frozen test corrected in the spec-only
  f0e8900 (see the story's "Correction"); implemented in 9da90fb on
  `main` (off the risk paths), independently reviewed with no blockers.
- [S6 Reset Grid with locked words](stories/21-S6-reset-with-locks.md):
  **done**. Frozen at 3702710 (delegated); implemented in 220019b on
  `main` (off the risk paths), independently reviewed with no blockers.
  The draft folder `../crossward-raptor-s6-draft/` is a stale copy.
- [S7 The lock button's second starts over on refocus](stories/21-S7-refocus-wait.md):
  **done**. Frozen at 9430d01 (delegated); implemented in 9451952 on
  `main` (off the risk paths), independently reviewed with no blockers.

- [S8 The word is the run Preview keeps white](stories/21-S8-word-shape.md):
  **done**. Frozen at 4de5dd9 (delegated, after an independent spec
  review); implemented in 4d2084c on `main` (off the risk paths),
  independently reviewed with no blockers.

- [S9 The grid's size by puzzle](stories/21-S9-grid-size.md) (EPIC
  item 8): **done**. Frozen at 3cb79e6 (delegated, after an independent
  spec review; 11 frozen specs amended, listed in the story); implemented
  in 24c1b0e on `main` (off the risk paths), independently reviewed with
  no blockers.

- [S10 Mouse hover](stories/21-S10-mouse-hover.md) (EPIC item 2):
  **done**. Frozen at 2a1d3c4 (delegated, after an independent spec
  review); frozen 21-S10-4 corrected in the spec-only e5de023 (the line
  before the button is already under it; independently reviewed, see the
  story's "Correction"); implemented in e90d552 on `main` (off the risk
  paths), independently reviewed with no blockers.
- [S11 Tick hover](stories/21-S11-tick-hover.md) (EPIC item 6):
  **done**. Frozen at c621634 (delegated, after an independent spec
  review; discrimination observed, 10 of 12 failing as predicted);
  implemented in 93f3771 on `main` (off the risk paths), independently
  reviewed with no blockers.

**S1–S11 are done; every item of the EPIC's "Changes from the human's
visual testing" is carried. The independent closeout audit ran
(report-only, 2026-11-06, at 3f3a5f6) before S7; S7–S11 aren't audited. The epic is not closed:** it waits
for the human's visual testing and decisions on the open items below.

## Open items (the human decided 2026-11-06)

1. **20-S1-1 race: resolved.** Epic 20's 20-S1-1 failed whenever S2's
   lock button (a Tab stop while visible) showed before the test's Tab.
   The human approved correcting it. The test now first moves the cursor
   to an empty cell. It was independently reviewed: 20 of 20 repeats
   passed, and a control that keeps the race fails. It landed as the
   spec-only 2b75737.
2. **The button returns at once on refocus: fixed as
   [S7](stories/21-S7-refocus-wait.md)** (9451952). The dwell timer now
   runs only while the grid has focus.
3. **Sideways scroll at about 716–760px: accepted** by the human. An
   across word ending in the last column puts S2's button past the grid
   edge (up to 22px of overflow, measured).

Audit notes, no action needed unless the human wants it:
`slot-required` is now unreachable (`cell-appearance.ts:84`; since S8,
a Preview-red cell inside the cursor's word reaches it again);
`deserializeLockedWords` trusts stored JSON; a down word ending in the
last row puts the button over the Reset Grid line (accepted by S2's
"Overlap"); `duplicatePuzzle` copies locks (unspecified, reasonable).
Leftovers to tidy: the branch `story/21-S2-lock-a-word` (local and
remote), the stale `../crossward-raptor-s6-draft/`.

**Delegation (the human, 2026-11-06):** one orchestrating agent carries
S3–S6 to done without human checkpoints. For each story it may draft and
approve the specification and acceptance, then freeze them (STORY §2).
Decisions stay within the approved EPIC's Decisions and Non-goals. A
product detail the EPIC leaves open is decided by the agent and recorded in
the story under "Delegated decisions", for the human's visual check. A frozen
test found wrong may be corrected without the human, but only after an
independent agent reviews the correction and it lands in its own
spec-only commit on `main` (STORY §3). Implementation, review and audit go to
separate subagents. The author never reviews or audits its own work. A
risk-path PR is merged by its independent reviewer. At the end, an
independent report-only audit runs (AUDIT). The epic is **not** closed:
the human does visual testing first. Still stop for anything outside this
epic, data deletion beyond the guarded test reset, or a true blocker.

Epic 20 is closed (ba55af6). Epic 18's 18-S5-5 intermittent can fail a
full browser run; it's a recorded open item, unrelated to this epic.

## Verification (2026-11-06)

- **S5 (9da90fb):** `npm run verify` exit 0 (692 unit tests). Full
  `npm run test:e2e`: 1095 passed, 2 failed, both passing when rerun
  alone. One was `row-menu.spec.ts` 16-S2-2, a session fetch error in a
  helper. The other was `start-over.spec.ts` 20-S1-1 (Tab from the grid
  to Reset Grid), which also fails intermittently on `main` without S5
  (1 in 30 repeats at c0b81c6, which already had S2), so S5 didn't cause
  it. S2's lock button does (open item 1). The reviewer saw verify
  exit 0 and the S5 spec pass 18 of 18.
- **S6 (220019b):** the implementer saw verify exit 0 (696 tests) and
  the full suite 1104 passed, 1 failed (`library-play.spec.ts:479`,
  ECONNRESET on get-session), which passed when rerun alone. The reviewer
  saw verify exit 0 and the reset-with-locks and start-over specs pass 17
  of 17. The orchestrator's full `npm run test:e2e` on 220019b: 1104
  passed, 1 failed, 20-S1-1 (open item 1).
- S3 (6e20297) and S4 (a49795a): verify and full E2E exited 0 for their
  implementers. Each reviewer had one unrelated flake, which passed when
  rerun alone (`row-menu.spec.ts`, and `play-design.spec.ts` with
  ECONNRESET).

- **S7 (9451952):** the implementer saw verify exit 0 (696 tests); the
  full `npm run test:e2e` first had 1106 passed, 2 failed
  (`builder-controls.spec.ts:568` 14-S4-6 and `done-icon.spec.ts:398`
  18-S5-5), both passing when rerun alone; a second full run had 1108
  passed, exit 0. The reviewer saw verify exit 0, the S7 spec pass 15 of
  15 (`--repeat-each=5`) and the lock-word, toggle-row and tooltip specs
  39 passed; it did not rerun the full suite.

- **S8 (4d2084c):** the implementer saw verify exit 0 (710 tests), the
  lock and highlight specs 75 passed, and the full `npm run test:e2e`
  1113 passed, 1 failed (`narrow-builder.spec.ts:198` 15-S3-8), which
  passed when rerun alone. The reviewer saw verify exit 0 and seven lock
  and highlight specs 67 passed; it did not rerun the full suite.

- **S9 (24c1b0e):** the implementer saw verify exit 0 (710 tests); its
  full `npm run test:e2e` on a heavily loaded machine (load ~45) had 1111
  passed, 36 failed, all timeouts, all passing on `--last-failed`. The
  orchestrator's full `npm run test:e2e` on 24c1b0e afterwards: 1147
  passed, exit 0. The reviewer saw verify exit 0 and `git diff 3cb79e6
  -- e2e/` empty; it ran no browser tests.

- **S10 (e90d552) and S11 (93f3771):** observed results are in each
  story's "Delivery". In short: verify exit 0 both; full `npm run
  test:e2e` 1163 passed, 3 failed for S10 (18-S5-5 and two `ECONNRESET`,
  none S10's) and 1177 passed, 1 failed for S11 (`ECONNRESET`), each
  failure passing alone. Watch for under load: one earlier full S10 run
  on a loaded machine had 32 failures.

## For the human's visual check (collected so far)

- S3: the Rebus link greys out on a locked letter or end cell; typing over
  a locked word skips it silently.
- S4: hover the padlock about a second for the bubble. On a down word,
  it sits above the button, over the word's last letter.
- S2/S3: while the cursor is in a locked across word, the lock button sits
  over the end cell after it, so clicking that cell unlocks the word.
- S5: below a 700px grid, "Lock Word"/"Unlock Word" left of Rebus;
  keyboard focus shows an underline; Shift+Tab from the grid passes Rebus
  first.
- S6: with a locked word, Reset Grid offers Clear Every Cell / Keep
  Locked Words / Cancel. At 1440px they sit on one line; at 375px one per
  line. They stack by measured width. Keep Locked Words also turns black
  cells white. In Preview, where locks are hidden, the three-button
  dialog still appears if any word is locked.
- PR #33's note: the button stays when Tab moves past it to Reset Grid.
- S8: the cursor's word takes in Preview-red cells (blue-medium); the
  cursor on a red cell selects its word; no lock button or toggle-row
  Lock Word until every cell is lettered. Delegated: a run of only red
  cells is a word for the highlight; stored locks keep their extent if a
  later letter makes an end cell red. Reviewer's note, no action taken:
  each build-phase render now computes Preview's geometry three times
  (about 2ms each on a full 15×15, 7ms on a full 21×21); a `useMemo`
  would cut it if typing feels slow on a Sunday.
- S7: leave the grid (click outside) with the cursor in an unlocked
  word, come back: the button waits a full second again. In a locked
  word it shows at once.
- S9: a Mini, Midi and Daily grid is 620px at most, a Sunday 700px, in
  build, hints and play, wide and narrow; the toggle row, narrow column,
  Hint Box, Prominent Hint and play's hint bar match it. Delegated:
  "Sunday" is any 21-column grid; the two hint columns go side by side
  from a 1430px window for every size; wide, the freed room goes to the
  hints (grid stays left); the style guide's samples stay 700px; a
  published puzzle's empty toggle row is the grid's width.
- S10: rest the mouse a second on a complete word (cursor elsewhere):
  its button and outline show, replacing the cursor's; clicking toggles
  it without moving the cursor; off the word the cursor's button is
  back. Delegated: locked words wait the second too; a click in a cell
  ends the hover; the hover's button isn't a Tab stop; a focused button
  is never replaced; nothing below the puzzle's full width, in Preview or
  with a rebus entry open. Reviewer's notes: a fast move from the word
  straight onto the cursor's own button for another word doesn't end the
  hover; closing a rebus by keyboard or widening the window under a
  resting mouse shows a due hover button at once; typing into a
  Preview-black cell beside the run restarts the second.
- S11: hover a locked word's tick: that word's cells (not its end cells,
  not the grid lines) go 15% darker at once, every locked word ending
  there; also over the cursor's yellow and blues, without focus, and
  below full width. Delegated: the tick's whole top-right square counts
  (not only the triangle); a down word's button over the tick wins there.

## Next action

1. **The human's visual check** of S8–S11 (above). Record the results
   and any corrections as new stories.
2. Then the epic closeout per the [epic index](../README.md#close-an-epic):
   a fresh independent report-only audit covering S7–S11 (subagent),
   recorded here by a non-auditing session, and close only when the
   human agrees.

Browser suites share one test database: run them one at a time
(`pgrep -fl playwright` first). E2E preparation stops `npm run dev`;
restart it afterwards (dev servers started by subagents die with them).

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md. Record the human's visual
check of S8–S11, then run the independent closeout audit of Epic 21 on
`main`; close the epic only with the human's agreement.

## S12–S13 delivery (the handoff at 856db3a, 2026-11-07)

Kept for its evidence after 58b77b3 replaced it. S12 `86c4e7b`, S13
`76a6685`, S13's B1 fix `19e0dee`.

- **S12:** independent review found no code blockers. One undeclared
  path, `LockWordControl.tsx`, has a comment-only change (the stale "full
  width" wording), which the reviewer accepted. Two non-blocking notes
  for the human's visual check: on narrow windows the grid may jump 20px
  up on load (`hasLockRoom` starts true and the first measurement sets
  `mb-4`), and a classic, non-overlay vertical scrollbar appearing
  doesn't trigger a re-measure. The human's visual check (2026-11-07)
  passed with these notes in view.
- **S13, B1:** before the fix, the tick's word skipped S10's
  lockability check once unlocked. Now an unlocked tick word shows its
  button only while `lockTargetAt` at its first cell in its orientation
  returns the same word. An independent re-review found no blockers.
- **Verification (observed, `19e0dee`):** `npm run verify` exit 0
  (vitest 729/729); full `npm run test:e2e` 1208 passed, exit 0; `git
  diff 20957ed 19e0dee` touches only `src/` runtime files and the
  handoff.
