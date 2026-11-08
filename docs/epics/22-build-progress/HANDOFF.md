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
- **S2:** specification being drafted on `main` (uncommitted).

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

## Verification

S1 at 934efae (PR #34 head): `npm run verify` exit 0, 757 tests, run by
the independent reviewer; Vercel checks passed. No browser suite needed.

Tooltip rewording at 38cd96f: `npm run verify` exit 0 (733 tests);
`npm run test:e2e -- e2e/preview-tooltips.spec.ts
e2e/preview-tooltip-stays.spec.ts` 16 passed. The full browser suite
was not run for it.

## Next action

Finish S2's specification and acceptance (EPIC "Stories"), have it
reviewed, freeze, implement and deliver it under the orchestration
above.

## Resume prompt

Read docs/epics/22-build-progress/HANDOFF.md and docs/epics/22-build-progress/EPIC.md. Orchestrate the epic's next story (EPIC "Stories") per the handoff's Orchestration section, through spec, freeze, implementation, review and delivery.
