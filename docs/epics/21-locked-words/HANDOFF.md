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
  **drafting, uncommitted in the worktree:** the story's Delegated
  decisions, Acceptance and Discrimination, plus
  `e2e/lock-word-toggle-row.spec.ts` (17 tests; on `main` 13 fail on the
  missing `lock-word-control`, 4 pass as guards). The 375px row fits.
  **Before freezing, add keyboard use** (the orchestrator's decision under
  the delegation; the EPIC's "Mouse, keyboard and touch all work"):
  moving focus from the grid to the toggle-row button keeps the cursor's
  word as its target, as S2's button does. It stays enabled, and Enter
  or Space toggles it; after that it keeps focus in its new state. Add
  21-S5-6 (375px): reach it by Tab or Shift+Tab from the grid (whichever
  the DOM order gives), Enter locks, Space unlocks. Replace the story's
  "Not decided here: keyboard use" note, rerun the discrimination check,
  then freeze. The drafting agent stalled before doing this.
- [S6 Reset Grid with locked words](stories/21-S6-reset-with-locks.md):
  drafted.

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

- **S4 at a49795a:** the implementer ran `npm run verify` (exit 0, 692
  tests) and the full E2E suite (exit 0, 1080 passed). The reviewer's
  `npm run verify` exited 0. The reviewer's full E2E run exited 1: 1076
  passed and 4 failed, all timeouts in `row-menu.spec.ts` (16-S2, the
  puzzle list, not touched). Rerun alone, it passed: 16 tests, exit 0.
- **S3 at 6e20297:** the implementer's full E2E run exited 0 with 1074
  passed. The reviewer's had 1 failure, an `ECONNRESET` in the auth helper
  of `play-design.spec.ts` while a dev server restarted. Rerun with
  `locked-cells`, that spec passed: 30 tests, exit 0. `npm run verify`
  exited 0 for both agents.
- The frozen acceptance for S3 and S4 is unchanged since each freeze.

## For the human's visual check (collected so far)

- S3: the Rebus link greys out on a locked letter or end cell; typing over
  a locked word skips it silently.
- S4: hover the padlock about a second for the bubble. On a down word,
  it sits above the button, over the word's last letter.
- S2/S3: while the cursor is in a locked across word, the lock button sits
  over the end cell after it, so clicking that cell unlocks the word.
- PR #33's notes: the button stays when Tab moves past it to Reset Grid;
  a locked word and a longer run from the same start could share an
  outline key (now unreachable, since S3 blocks typing into end cells).

## Next action

Finish S5's drafting (keyboard test, above), freeze it, then orchestrate
S5 and S6 under the delegation above, in order: draft,
self-approve and freeze each story, then implement it, independently
review it (and merge it if it's on a risk path) and verify it. Then run
the independent closeout audit and stop for the human's visual testing.
Keep this handoff current after each story. Drafting and implementing
agents should leave the dev server alone, since each E2E prep stops it. The
orchestrator restarts `npm run dev` once at the end.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md. As orchestrator, carry Epic 21's
S3–S6 to done under the handoff's delegation, then run the closeout audit and
stop for the human's visual testing; don't close the epic.
