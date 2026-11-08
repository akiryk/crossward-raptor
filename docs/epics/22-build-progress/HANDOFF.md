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
  with five changes, recorded verbatim in S3/S4. They become two new
  stories under this orchestration: **S3 the bar's look** (16px high,
  20px rounded corners, a gray-500 fill, the fill animating in from 0
  and turning interactive-dark when it reaches the zone) and **S4 one
  tooltip behavior** (a single place controlling every tooltip's
  timing, and a tooltip over the bar). S3 first, then S4; then a second
  visual check, then closeout.

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

## Verification

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

The human's visual check of the progress bar (`npm run dev`, a daily
and a Sunday puzzle's build phase, Preview on): below and at 80%, the
wide row, and narrow windows (around 540px, 375px and 300px). Then
record the result and close the epic per the epic index (independent
closeout audit). A visual fix becomes a new story under the same
orchestration.

## Resume prompt

Read docs/epics/22-build-progress/HANDOFF.md and docs/epics/22-build-progress/stories/22-S2-progress-bar.md. Record the human's visual check of S2 and close out the epic per the handoff's Orchestration section on main.
