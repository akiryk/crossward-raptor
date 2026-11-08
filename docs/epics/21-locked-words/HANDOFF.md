# Locked words — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).

**Only if needed:** [HISTORY](HISTORY.md) (the handoff as of 3d6952a:
S1–S11 delivery, verification, open items, audit notes; and S12–S13's
delivery evidence from 856db3a).

## Current state (2026-11-08)

**Closed 2026-11-08.** S1–S17 are done and on `main` (last: S17,
c5f67df), each with the human's visual check passed; S17's on
2026-11-08. The closeout audit of S7–S17 found no blockers;
dispositions below. The human delegated the dispositions and the
closing to the session that recorded them ("just fix what needs to be
fixed and get this epic done").

## Verification (observed 2026-11-08, on c5f67df)

- `npm run verify` exit 0 (733 unit tests; 2 lint warnings that predate
  S7).
- Full `npm run test:e2e`: 1213 passed, exit 0. This replaces S14–S17's
  "rerun alone" evidence (their full runs had `ECONNRESET`s and
  `done-icon` 18-S5-5, the intermittent failure recorded in
  [epic 18's handoff](../18-puzzles-page/HANDOFF.md#open-item-after-closeout)).
  The run used the standing guarded test-reset grant (DEVELOPMENT "E2E
  environment").
- Frozen acceptance unchanged since each story's freeze (audit).

Earlier per-story evidence: S14–S16 at 58b77b3 and S17 at c5f67df each
had `npm run verify` exit 0 and their failing specs passing when rerun
alone (in git history at 3594f9c and c5f67df); S12–S13 in HISTORY.

## Closeout audit (S7–S17, 2026-11-08)

Two independent, report-only audits on c5f67df, by sessions that wrote
none of the work. Both found no blockers. Neither ran the full browser
suite; it is above. A separate session recorded them and made the fixes
below, under the human's delegation.

Dispositions:

1. S12's "9 amended specs" (8 amended plus 1 new). *Fixed.*
2. The S14–S16 record's "those 5 specs rerun alone" (4 specs, and
   18-S5-5 not rerun). *Superseded* by the clean full run above.
3. S12–S13 delivery evidence lost from the handoff. *Restored* in
   HISTORY.
4. Story status lines behind (S7, S9–S13, S17), S12/S13 "Acceptance
   (proposed)", S13's "S12 (proposed)". *Fixed.*
5. EPIC's top paragraph and missing S7–S11 links. *Fixed.*
6. Epic index line. *Fixed.*
7. HISTORY's "`slot-required` is now unreachable". *Corrected.*
8. Earlier stories (S2, S7, S10, S11, S13) didn't point to their later
   amendments. *Fixed* with a pointer in each status; the EPIC's change
   sections hold the details.
9. S9's "33 cases" (now 35 after S12). *Fixed.*
10. No full browser run exited 0 for S14–S17. *Fixed*: 1213 passed,
    exit 0 above.
11. No test pins B1 (an unlocked tick word keeps its button only while
    lockable, `PuzzleGridEditor.tsx:757-768`). *Accepted*: the code is
    reviewed and the human checked it visually; a test would need a new
    approved story.
12. After a click on the tick's button, back on the same end cell
    without another cell in between, a turn of the cursor keeps the old
    word's button instead of picking again (S13), untested. *Accepted*
    as a minor edge case; a follow-up story if it ever bothers the
    builder.
13. `wordHoldsCell` (`locked-words.ts:93`) just wraps `holds`.
    *Accepted*: cosmetic.
14. Four `lock-tick-button.spec.ts` titles still say "darker" or
    "darkening" (S15 made it an outline). *Accepted*: frozen test names;
    renaming would follow STORY's correction procedure.
15. Leftovers: branch `story/21-S2-lock-a-word` (local and remote,
    merged), `../crossward-raptor-s6-draft/`, 5 scratch patches and the
    prunable worktree `/private/tmp/s8-rev2`. *Deleted.*

## Next action

None in this epic. No later epic is started.

## Resume prompt

Epic 21 (locked words) is closed per docs/epics/21-locked-words/HANDOFF.md; no next epic is defined. Ask the human what to work on next.
