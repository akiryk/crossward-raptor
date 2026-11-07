# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), then the active story.

## Current state (2026-11-06)

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

**All six stories are done. The closeout audit is next, then the human's
visual testing. The epic is not closed.**

**Open item for the human (outside this epic's delegation):** Epic 20's
frozen `e2e/start-over.spec.ts` 20-S1-1 says Reset Grid is "the next Tab
stop after the grid". Epic 21 made S2's lock button "the next Tab stop
after the grid while visible" (EPIC "Using it"). The test focuses a
lettered grid with the cursor in a lockable word, so it passes only if
Tab comes before the 1-second rule shows the button. Under load it fails:
2 of 3 full runs here, and 1 in 30 repeats at c0b81c6, which already had
S2. A fix would correct a closed epic's frozen test, so it needs the
human. Examples: Tab before the button can show (a frozen clock), or put
the cursor where no word is lockable.

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
  (1 in 30 repeats), so it's an existing flake. The reviewer saw verify
  exit 0 and the S5 spec pass 18 of 18.
- **S6 (220019b):** the implementer saw verify exit 0 (696 tests) and
  the full suite 1104 passed, 1 failed (`library-play.spec.ts:479`,
  ECONNRESET on get-session), which passed when rerun alone. The reviewer
  saw verify exit 0 and the reset-with-locks and start-over specs pass 17
  of 17. The orchestrator's full `npm run test:e2e` on 220019b: 1104
  passed, 1 failed, 20-S1-1 (the open item above).
- S3 (6e20297) and S4 (a49795a): verify and full E2E exited 0 for their
  implementers. Each reviewer had one unrelated flake, which passed when
  rerun alone (`row-menu.spec.ts`, and `play-design.spec.ts` with
  ECONNRESET).

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
- PR #33's notes: the button stays when Tab moves past it to Reset Grid;
  a locked word and a longer run from the same start could share an
  outline key (now unreachable, since S3 blocks typing into end cells).

## Next action

Run the independent closeout audit (report-only, AUDIT) if it hasn't
run, and record its findings here. Then the human does visual testing and
decides the 20-S1-1 open item. Don't close the epic until the human says
so. Agents should leave the dev server alone; the orchestrator restarts
`npm run dev` once at the end.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md. As orchestrator, carry Epic 21's
S3–S6 to done under the handoff's delegation, then run the closeout audit and
stop for the human's visual testing; don't close the epic.
