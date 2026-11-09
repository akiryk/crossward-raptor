# Build progress — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md) and its [mockup](assets/progress-mockup.png).

## Orchestration

The human's standing instruction for this epic (2026-11-08):

> I want to make you and future sessions that work on this epic the
> orchestrator. Use sub-agents to write stories and complete the work and
> test. Don't involve me until all stories are done. At that point, have
> me do a visual test before we close out the epic. If you run into a
> situation where you aren't sure what to do, make a decision that you
> think will work well given the rules of this repo -- then you can tell
> me about it when it's time for the final visual test

So the orchestrating session:

- has the human's delegation (STORY §2) to approve and freeze each
  story's specification and acceptance, after an independent sub-agent
  review of the draft;
- runs drafting, implementation, testing and independent PR review
  through separate sub-agents, keeping the author and reviewer distinct
  (CODE-REVIEW);
- decides open questions itself and records each under **Decisions for
  the visual check** below, to report to the human then;
- asks the human for nothing until every story is delivered, then asks
  for the visual check before closeout.

## Current state (2026-11-08)

The human approved the EPIC 2026-11-08.

- **S1 done:** frozen 33160ed after an independent spec review; PR #34
  merged 310bc94 by an independent reviewer (no blockers).
- **S2 delivered:** frozen b4d4741 after an independent spec review
  (all findings addressed); implemented d0b855b, direct to `main`;
  independent review of d0b855b found no blockers.
- **The human's visual check of S2 (2026-11-08):** "It looks good!",
  with five changes, recorded verbatim in the EPIC; they became S3 and S4.
- **S3 the bar's look done:** frozen 18afb53 after an independent spec
  review (no blockers, all findings addressed); implemented fd45a02,
  direct to `main`; independent review of fd45a02: no blockers.
- **S4 one tooltip behavior delivered:** frozen e7e3bf6 after an
  independent spec review (no blockers, all findings addressed);
  implemented fd57abd, direct to `main`. **Its independent review was
  started but its result was not recorded** (the session ended first):
  run it again.
- **S4 re-review (2026-11-08):** independent review of fd57abd: no
  blockers, no should-fix (three optional nits).
- **S5 Preview's fade and the would-be word delivered:** the human's two
  small changes (recorded verbatim in the EPIC). Frozen ffc510b after an
  independent spec review (no blockers; its should-fix and nits
  addressed); implemented 45627dc, direct to `main`; independent review
  of 45627dc: no blockers.
- **The human's visual check of S3, S4 and S5 (2026-11-08):** "I did
  the visual check and it looks good"; no changes, Decisions 1–13
  accepted as reported. Then three more changes (EPIC, "after the
  visual check of S3–S5"), which became S6.
- **S6 the lock button's word:** frozen (this commit) after an
  independent spec review (no blockers; its should-fix and nits
  addressed); amends seven frozen Epic 21 / 22-S4 specs, listed in the
  story.
- **Next:** implement S6, independent review, the human's visual check
  of S6, then closeout.

Also on 2026-11-08, at the human's request, the red Preview tooltip
(Epic 20 S2) was reworded to "Fill in these cells so the puzzle is
symmetrical." (38cd96f), its frozen acceptance strings included; the
human waived the correction procedure for it.

## Decisions for the visual check

1. The human's tooltip edit came with their editor's reformatting of
   all four files (quotes, line wraps; about 580 lines). Only the
   wording was committed; the original diff is saved at
   `.git/user-tooltip-wording-backup.diff`. The human's own quotation in
   Epic 20's EPIC (the request as given) keeps the old wording.
2. **Frozen Epic 21 test amended:** 21-S5-4 expected Rebus to stay with
   Preview on in a daily; the approved EPIC hides it, so the S2 freeze
   flips that one assertion (independently reviewed; no other change).
3. **Narrow layout (below a 490px window):** two right-aligned lines —
   Preview and the message on line 1, the bar and "N% complete" on
   line 2. The message is above the bar's line but sits over the
   percentage, not over the bar ("Keep building." clears the bar's end);
   the stacked alternative couldn't keep the bar's 80px minimum at
   320px. Below a 304px window the message drops to 12px. Look at this
   at 375px.
4. Rebus and Lock Word are removed from the row (not just hidden)
   wherever the progress shows; the message and percentage sit in
   fixed boxes so the bar doesn't move when the text changes at 80%.
5. **No full browser run exited 0** (four runs on d0b855b; see
   Verification). Each had 1–2 failures, each a different test, each
   passing in the other runs: connection resets on
   `/api/auth/get-session` and colors read mid-transition. None is in a
   view S2 changes; 18-S5-5 fails 2/5 alone both with and without S2.
   Accepted as existing test-harness flakiness rather than rerunning
   until green; worth a hardening story (transition reads, session
   requests) later.
6. Non-blocking review note accepted: `PuzzleGridEditor.tsx:729` checks
   15/21 sizes directly instead of reusing `sizeFor()`; small
   duplication, behavior correct.

7. **Tooltip timing (S4):** a 500ms hover delay for every tooltip,
   set in one place (common libraries use about 500–700ms); the red and
   orange cell tooltips were immediate and the lock button's waited 1s.
   Once one is showing, moving straight to another target shows it at
   once (the usual "skip delay"), so crossing grid cells doesn't wait
   again.
8. **The bar's tooltip text:** "80–85%" kept: it matches the zone and the
   NYT convention of about 16% black squares (about 84% white).

9. **S3 review note accepted:** if the reduced-motion preference turns
   off while the bar shows, one frame may paint a stale width
   (`BuildProgress.tsx`, the reduced-motion branch doesn't update the
   drawn state). Rare and not covered by acceptance; fix if convenient.
10. **S4 known gap (as before S4):** a lock button replaced under a
   resting mouse shows its tooltip only on the next mouse move.

11. **S5 the would-be word:** in the build phase with Preview off, the
   cursor's word is the run its cell would join if it held a letter
   (counting the symmetric cell that would turn white); an empty cell in
   it shows blue-medium. A run of just the cursor keeps 21-S14's dull-blue
   line. Hints phase and Preview unchanged.
12. **S5 next to a locked word:** where typing is blocked (a protected
   cell), the would-be word doesn't apply, since no letter can go there;
   the old rule shows. The frozen 21-S11-6/7 stay unamended.
13. **S5 fade:** 500ms CSS ease-in-out on cell backgrounds, grid lines
   and letter color; lock outlines, ticks, button, legend and toggle row
   don't fade. None under reduced motion. Cursor moves or typing inside
   the 500ms window may ease too (accepted). Every Preview change fades,
   including the automatic one at Enter Hints; confirming Enter Hints may
   ease into the hints colors (review nit: look at it).

## Verification

S5 at 45627dc: implementer `npm run verify` exit 0 (771 tests); S5 and
amended specs `--repeat-each 3` 73/73; full `npm run test:e2e` 1261 passed
/ 2 failed (18-S5-5 done-icon, 16-S2-6 row-menu get-session), each passing
alone (Decision 5). Reviewer: `npm run verify` exit 0 (771); S5 plus
word-highlight-only, selection-colors, lock-tick-hover, build-progress
57/57. S4 re-review at fd57abd: `npm run verify` exit 0 (760); tooltip
and lock specs 54/54 and 50/50.

S4 at fd57abd (implementer): `npm run verify` exit 0 (760 tests);
tooltip specs 160/160 with `--repeat-each 3`; full `npm run test:e2e`
1241 passed / 2 failed (18-S5-5 pixel mid-transition, library-play P5
ECONNRESET), each passing alone: no full run exited 0 (Decision 5).

S3 at fd45a02: implementer `npm run verify` exit 0 with S4's then-unbuilt
source test set aside; full e2e 1232 / 11 (8 unbuilt S4 tests, 3 flakes
passing alone). Reviewer: S3 specs 51/51 with `--repeat-each 2`.


S2 at d0b855b (all on the same commit, clean tree):

- `npm run verify` exit 0 (757 tests), by the implementer and again by
  the independent reviewer.
- Full `npm run test:e2e`, four runs (standing guarded reset grant):
  implementer 1220 passed / 2 failed (14-S4-6 transition color,
  18-S5-5); reviewer 1221 / 1 (16-S2-7 ECONNRESET); orchestrator
  1221 / 1 (library-play P5 modal, ECONNRESET) and 1220 / 2 (17-S10-9
  pill color at alpha 0.933 mid-transition, 18-S3-2 icon clip). All
  22-S2 and amended 21-S5-4 cases passed in every run.
- 18-S5-5 alone ×5: d0b855b 2 failed, parent b4d4741 2 failed (same
  pixel) — not S2.

S1 at 934efae (PR #34 head): `npm run verify` exit 0, 757 tests, run by
the independent reviewer; Vercel checks passed. No browser suite needed.

Tooltip rewording at 38cd96f: `npm run verify` exit 0 (733 tests);
`npm run test:e2e -- e2e/preview-tooltips.spec.ts
e2e/preview-tooltip-stays.spec.ts` 16 passed. The full browser suite
was not run for it.

## Next action

Implement S6 and review it independently (same orchestration); then the
human's visual check of S6; then close the epic per the epic index
(independent closeout audit).

## Resume prompt

Read docs/epics/22-build-progress/HANDOFF.md. Get the human's visual check of S3, S4 and S5, make any changes it brings, then close out the epic per the handoff's Orchestration section on main.
