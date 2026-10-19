# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not already supplied.
2. [P3 draft](stories/11-P3-finishing.md), especially the pending input/failure
   decision, Scope discipline and Definition of done. This is proposed, not frozen.
3. For finalizing/reviewing that decision, the new candidates
   `src/engine/play.test.ts`, `src/app/puzzles/actions.play-completion.test.ts`
   and `e2e/play-completion.spec.ts`; [STORY](../../process/STORY.md), phases 1–2.

**Only if needed:** EPIC Decisions/Non-goals; affected P2 save/input code in
`src/components/play/{PlayPuzzle.tsx,play-autosave.ts}` and
`src/app/puzzles/actions.ts`; frozen P1/P2 acceptance when a specific inherited
contract matters; DEVELOPMENT's E2E environment before any browser run.
[History](HISTORY.md) preserves prior decisions, failure analysis and gate evidence;
do not load it for ordinary startup.

## Current state (2026-10-19)

P2 is complete. Local git history contains PR #21's merge `a67ff61` and its
closeout `6034299`. This update observed checkout `main` at `6034299` with the
matching local `origin/main` tracking ref; no remote PR/CI readback was needed
or performed for this documentation task.

The user authorized starting P3, but runtime has not started. The uncommitted
P3 draft and **28 engine / 39 server / 17 browser** acceptance candidates remain
unfrozen. Prior independent review was conditional, with no blocking defects in
the candidate tests but no freeze approval. The workflow-documentation task does
not approve P3, change its tests, or authorize P4/P5.

Pending P3 decisions/permissions:

- Full-grid pending input/failure behavior: briefly pause while saving/checking
  (proposed), or allow typing. Review identified that correct saved entries
  already lock on the server, so a failed subsequent inspection cannot safely
  promise unrestricted resumed editing. The proposed distinction is resumed
  editing on save failure, Retry verification after save success. No answer or
  final specification approval/delegation is recorded; dependent acceptance
  still needs completion and independent review before human approval/freeze.
- Isolated test DB resets for P3 (`localhost:5433/crossward_test`) are **not
  authorized**. P2's prior grant was scoped to P2. No standing grant exists.
  No P3 reset/browser run occurred; no live migration/env/inbox work is in scope.

## Verification

These are prior **draft-worktree** results, not new implementation evidence:
TypeScript/focused lint and browser listing passed; new unit acceptance was red
(**64 failed / 3 passed of 67**) against missing runtime. The 17 browser cases
were listed only. No P3 `npm run verify` or browser suite has run. Exact commands
and earlier P1/P2 evidence remain in HISTORY; no rerun is needed merely to resume.

All 75 original acceptance files remain frozen. Their pre-drafting hashes are
`/private/tmp/crossward-p3-preexisting-acceptance-sha256.json`; if unavailable,
compare tracked tests against the frozen git baselines recorded in the stories.

## Next action

When the user resumes P3, resolve the pending product decision, complete/review
its proposed acceptance and obtain human approval or explicit freeze delegation.
Then freeze only specification/acceptance on main before creating the runtime
branch. Obtain reset authorization before E2E; continue unaffected work without
inventing data permissions. Until then, preserve the draft and await direction.

**Next-session prompt:**

> Read docs/epics/11-play/HANDOFF.md's operational sections and the P3 draft's
> pending decision/scope. P3 is authorized but unimplemented and unfrozen.
> Finalize its pending input/failure behavior and dependent acceptance, obtain
> approval and required independent review, then freeze under STORY phases 1–2.
> Do not infer test DB reset permission or begin P4/P5. Expand reading only for
> the specific contract being resolved.
