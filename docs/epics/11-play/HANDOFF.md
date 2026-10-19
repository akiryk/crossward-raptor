# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. [Frozen P3 specification](stories/11-P3-finishing.md), particularly recovery,
   Scope discipline and Definition of done.
3. DEVELOPMENT's [E2E environment](../../DEVELOPMENT.md#e2e-environment) before
   browser preparation; [REVIEW](../../process/REVIEW.md) before PR review/merge.

**Only if needed:** affected play runtime and frozen P3/P2 acceptance;
[STORY](../../process/STORY.md) for implementation or verification issues.
[History](HISTORY.md) retains earlier P1/P2 and drafting evidence; do not load
archived history for ordinary startup.

## Current state (2026-10-19)

P2 is complete. This session began on `main` at `075b36c`, matching local
`origin/main`, with the existing P3 EPIC changes and four untracked drafts.
The user authorized resuming P3, then approved its concrete specification /
acceptance and delegated freeze, implementation and delivery through required
PR/review gates. The user subsequently explicitly authorized test-row deletion
for test runs and requested a lasting repository policy change. DEVELOPMENT
now records the standing grant for this repository's guarded local test reset.

Independent read-only agent `p3_spec_review` reviewed the specification,
acceptance and targeted P2 contracts. Specification-only main baseline
**`d1570e0`**, pushed to origin/main, freezes the P3 story/EPIC and
**28 engine / 39 server / 23 browser** cases. All 75 original acceptance files
were preserved; all 78 files are now frozen against that baseline.

Runtime is implemented on **`story/11-P3-finishing`**: root authored the pure
engine and authenticated server guards; `p3_ui` authored initial inspection,
serialized save/check/recovery, dialogs, locking and CSS confetti. Independent
read-only full-code review by `p3_spec_review` has no remaining blockers after
fixing one reconciliation edge: a noncomplete Retry must write latest entries
even if they equal the stale previous acknowledgement. No frozen tests changed.

Runtime commit **`98b17f9`** is pushed and contains exactly the verifier's six
tested runtime hashes. [PR #22](https://github.com/akiryk/crossward-raptor/pull/22)
is **open and draft**. Vercel/Preview Comments passed at the previous-head
readback; neither is runtime verification evidence. The browser gate and
independent final-head review/merge remain pending; P3 is **not complete**.
The standing test-reset policy is delivered separately on main in **`976a037`**
and merged into the story branch, so future necessary guarded test resets
do not depend on the pending acceptance correction.
Check live git/PR state before relying on recorded delivery/check status.

**Permission boundary:** the user-approved standing grant covers this
repository's guarded test-harness deletion of all rows in the validated local
`localhost`/`127.0.0.1:5433/crossward_test` target for necessary test runs,
including future stories; do not ask again within that scope. No env-file access, live migration,
development/production database, inbox, P4 or P5 work is authorized.

## Verification

- Root: pre-freeze TypeScript, focused candidate ESLint, browser listing,
  staged diff checks and original acceptance hash preservation passed; focused
  runtime engine/P3-server/P2-server run passed all 107 tests.
- Separate `p3_verification` agent: final **`npm run verify` exit 0**, 32 files /
  **534 tests**, TypeScript clean; lint has only the existing
  `request-logger/render.ts:802` unused `reqJson` warning. This run follows the
  final autosave recovery fix.
- Verifier's disposable no-DB probe passed via
  `node --import tsx /private/tmp/crossward-p3-recovery-probe.ts`: full wrong
  save commits but loses response; edits return to old partial; Retry inspects,
  then writes partial before clearing draft.
- Verifier confirmed all 78 frozen files byte-identical to `d1570e0`, with no
  replacement acceptance. Six exact tested runtime hashes are in
  `/private/tmp/crossward-p3-verification-runtime.json` (manifest SHA256
  `81a09d1c7c268b1273dfc0f8a21fd653aecd621ac78501da6012ecbc19b51bb2`).
  Confirm delivered runtime matches these hashes to bind precommit evidence.
- Verifier's full `npm run test:e2e -- --workers=2` exited **1: 391 passed /
  2 failed**. Both failures are the full-draft close/recover cases: the new page
  inherits the paused context clock, but the tests never advance the required
  500 ms recovery debounce before awaiting Saved. Runtime remains unchanged;
  affected work is stopped under STORY's frozen-test correction procedure.
- Independent reviewer confirmed the proposed single-line correction at
  `/private/tmp/crossward-p3-recovery-clock.patch`: add
  `await returned.clock.runFor(500);` before `saved(returned)` in the shared
  test body. This preserves assertions, timeouts and specified behavior.
  Human approval is pending; then correction must be committed/refrozen
  separately on main before repeating the full browser gate. Original failure
  contexts: `/private/tmp/crossward-p3-first-e2e-failures/`.
- Verifier's separate visual/focus/reduced-motion demonstration **passed** on
  unchanged runtime: both dialogs, Tab/Shift+Tab/Escape/focus restoration,
  completed mark/grid/message, decorative confetti/pointer/ARIA behavior,
  automatic cleanup, reduced motion and silent locked reopen. Four screenshots
  were visually inspected under `/private/tmp/crossward-p3-visual/`.
  Final-head CI/review/merge remain pending. Disposable visual runner/config is
  prepared at `/private/tmp/crossward-p3-visual`; it reuses the built E2E server
  without a second reset. If unavailable, recreate the demonstration, not frozen
  acceptance. Serialize all browser use of the shared test database.

## Next action

Obtain human approval for the independently reviewed one-line frozen test
clock correction; commit/refreeze it separately on main under STORY, merge
that baseline into the story branch, and have the separate verifier repeat
the complete `npm run test:e2e -- --workers=2` suite. Keep runtime unchanged
for this test defect; preserve all other frozen acceptance.
Bind final evidence to the delivered head, update this handoff, then obtain
independent PR review and merge under REVIEW. Do not begin P4/P5.

**Next-session prompt:**

> Read docs/epics/11-play/HANDOFF.md and the frozen P3 specification. Check live
> story/11-P3-finishing and draft PR #22. Resolve pending human approval for the
> independently reviewed one-line frozen recovery-clock correction; refreeze
> separately on main, then repeat the complete browser suite using
> DEVELOPMENT's standing test-reset grant. Preserve other frozen acceptance
> against d1570e0 and reuse exact-runtime verification/visual evidence.
> Finish P3 through independent final-head PR review/merge. Do not begin P4/P5.
