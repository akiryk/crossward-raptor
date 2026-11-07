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
  **frozen at 3702710** (delegated): `src/lib/locked-words-reset.test.ts`
  and `e2e/reset-with-locks.spec.ts`. Discrimination observed: unit 4 of 4
  fail; browser 5 fail, 4 pass (the passing ones guard today's dialog and
  Cancel). Until it's implemented, `tsc` and so `verify` fail on the
  missing `clearOutsideLockedWords`. The draft folder
  `../crossward-raptor-s6-draft/` is now a stale copy.

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
- PR #33's notes: the button stays when Tab moves past it to Reset Grid;
  a locked word and a longer run from the same start could share an
  outline key (now unreachable, since S3 blocks typing into end cells).

## Next action

Have a subagent implement S6 against its frozen acceptance, with
`clearOutsideLockedWords` in `src/lib/locked-words.ts`. Then run verify
and the full E2E suite, commit ("Epic 21 S6: Reset Grid with locked
words"), push, and have a separate subagent review it (report-only).
Then run the independent closeout audit (report-only) and stop for the
human's visual testing. Don't close the epic. Agents should leave the dev
server alone; the orchestrator restarts `npm run dev` once at the end.

## Resume prompt

Read docs/epics/21-locked-words/HANDOFF.md. As orchestrator, carry Epic 21's
S3–S6 to done under the handoff's delegation, then run the closeout audit and
stop for the human's visual testing; don't close the epic.
