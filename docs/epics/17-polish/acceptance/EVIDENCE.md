# S12/S13 evidence — 2026-11-15

## Approval and freeze verification

Human approval received verbatim on 2026-11-15: **“I approve S12 and S13”.**
This approves both specifications, executable acceptance and exact patches;
it does not separately authorize runtime under the packet's explicit boundary.
The freeze session observed `main` at `61bb72a` with modified EPIC/HANDOFF/index,
untracked S11 closeout, both story drafts and acceptance packet. The unrelated
S11 archive was preserved and excluded from commits.

The freeze session directly observed:

- SHA-256 checks matched all four proposal identities below before mutations.
- `git apply --check` and exact application passed in S12 then S13 order.
  A Python temporary-tree check reconstructed all 11 amended files from
  `git show 61bb72a:<path>`, applied both retained patches and compared every
  byte to the worktree; all matched. The only changes to new suites are their
  administrative proposed-to-frozen header comments, verified by restoring the
  headers in memory and matching the approved SHA-256 identities.
- `npx tsc --noEmit` exited **0**. `npm run verify` exited **1** after successful
  TypeScript and lint (two existing warnings). Vitest: **95 files passed,
  19 failed; 1177 tests passed, 1 failed, 133 skipped**. The one assertion
  failure is the expected S13 red baseline: `globals-css.test.ts` cannot find
  `--color-prominent-hint-empty` before runtime implementation. The other
  18 suites failed during database setup because localhost:5433 was unavailable
  to the run. No database preparation/reset was performed in the freeze session.
  This is not a passing full verification gate or evidence of database behavior.
- Runtime-source diff against `61bb72a` is empty (the only changed `src/` file
  is approved acceptance `src/app/globals-css.test.ts`). Both frozen suites
  preserve every approved assertion. Local Markdown paths passed (38 links in
  seven active packet/story/epic documents). Source/document whitespace checks
  passed excluding retained `.patch` artifacts: their blank context lines carry
  the required patch-format space and are intentionally preserved byte-for-byte.
- No browser suites or visual checks were rerun for this acceptance freeze;
  the historical failure demonstrations and independent reviews below remain
  attributed to their original session. Runtime implementation, passing full
  gates, visual checks and delivery remain outstanding.

See [HANDOFF](../HANDOFF.md) for the separate frozen baseline commit IDs.
Nothing was pushed and no runtime/PR/deployment was created by the freeze.

## Historical draft evidence (before human approval)

The following sections preserve the drafting session's state and observations;
references to unapproved/unfrozen scope describe that earlier session.

## Scope and identity

Branch `main`, HEAD `61bb72a337fd4fe19db52a6ff2c227efc36b0aa0` throughout.
Starting worktree already contained modified EPIC/HANDOFF/epic-index documents
and untracked S11 closeout plus S12/S13 story drafts. Those drafts were
preserved and extended within this task. New scope: two proposed browser specs,
two unapplied supersession patches, case inventory, approval packet and evidence.
No runtime/configuration file or existing frozen acceptance changed; no commit,
push, PR, merge or freeze. No environment file was inspected or edited.

Final proposal SHA-256 identities (not commit IDs):

| Artifact | SHA-256 |
| --- | --- |
| `e2e/quiet-saved-state.spec.ts` | `3733b64e959e8b349cdcc5e122b031eb92debc99f1b949138b982cc6e2535a6f` |
| `e2e/prominent-hint-polish.spec.ts` | `324589515d1e7c30c4d3e4eab160ebf601b5a4f8d8de34fa4be1a05da1b526cb` |
| `docs/epics/17-polish/acceptance/17-S12-supersession.patch` | `a387207a89f696cba92988c9b6634266077ffe27bcfa966a9605c998f0c6ca9a` |
| `docs/epics/17-polish/acceptance/17-S13-supersession.patch` | `276a223aee6e36138db3a2f74436c2b9c890cd15a9fd011e136a719f5bd832ed` |

## Checks and expected browser failures

The root agent observed the following checks. `npm run pretest:e2e` passed
before each browser run under DEVELOPMENT's standing authorization for the
guarded local `localhost:5433/crossward_test` reset. Runs were serialized with
`/tmp/crossward-e2e.lock`, released afterward. The sandbox initially denied
Docker socket access; execution escalation was approved and preparation passed.
The guarded reset touched only the validated test target. No ad hoc deletion
or reset was performed.

1. `npx playwright test e2e/quiet-saved-state.spec.ts e2e/prominent-hint-polish.spec.ts --workers=2`
   exited **1**, intentionally: **29 failed, 4 passed** (33 total, including
   two passing auth setup tests; 31 story cases). All failures occurred at
   changed-behavior assertions: idle builder status width **48.734375px**,
   visible successful “Saved”, prefixed hints such as **1AFeline**, or empty
   fill **rgb(207, 238, 255)** instead of **rgb(241, 248, 252)**. Both narrow
   regression cases passed: S12 save/reload/no extra gap and S13 hint navigation.
   Editor failure/journal/retry and player pending/in-flight/error/Retry checks
   reached successful persistence before failing at the new silence assertion.
   Builder controls/alignment checks reached the new idle-silence assertion at
   every proposed viewport and phase. Later assertions blocked by an earlier
   intentional failure are not represented as passing.
2. After review, the S13 refocus action changed from same-cell click to grid
   focus (preserves orientation); a redundant style-guide request was removed.
   S12 wide cases check compact geometry before silence so the failure is
   demonstrated directly. No other test content changed after the first run.
3. `npx playwright test e2e/quiet-saved-state.spec.ts e2e/prominent-hint-polish.spec.ts --grep '17-S12-2 wide|17-S13-2 blur' --workers=2`
   exited **1**, intentionally, on the final spec identities above: **4 failed,
   2 passed** (setup). Fresh/resumed/reset title-to-hint geometry differed from
   the required gap by **59px** (current spacing is 91px; proposal is 32px).
   Blur still produced blue-medium instead of faint. The refocus assertion is
   after that expected failure, so its corrected action was statically reviewed
   rather than claimed as executed successfully.
4. `npx tsc --noEmit` and scoped ESLint on both new specs exited **0** on final
   content. Each proposed amended acceptance tree also typechecked and linted
   successfully using temporary source copies/TypeScript compiler-host overlays;
   no worktree frozen file was altered. An initial validation-script incremental
   option error was corrected in the temporary script before these passes.
5. `git apply --check` and application of S12 then S13 passed in a temporary
   copy of all affected files. Every original target was compared byte-for-byte
   to `git show HEAD:<path>` and remained identical. Case inventory was generated
   by matching changed source spans to TypeScript test declarations. Final
   documentation checks passed: 65 local Markdown path links across nine
   documents, draft sections/status, source/document whitespace and
   `git diff --check`. The original S11 handoff is preserved verbatim after
   its existing historical-archive preface; that archive was not edited.
   Final artifact hashes match the identities above.
6. `npm run verify` exited **0** on the final acceptance code: **114 unit
   files / 1311 tests passed**, TypeScript and lint passed (two pre-existing
   unused-variable warnings in `reset-with-locks.spec.ts` and
   `request-logger/render.ts`). Full `npm run test:e2e` was not run:
   this task demonstrates proposed behavior against unchanged runtime, so its new
   acceptance intentionally fails. A passing full suite and required visual
   checks remain implementation gates for each authorized story.

The first run predates only the small corrections in item 2; it is supporting
failure/guard evidence, not an exact-final-tree full browser pass. The focused
run binds the directly demonstrated geometry/fill failures to the final specs.
Test runner output was captured through tool output, without shell log wrappers.
Ignored `test-results/` artifacts are transient; this record preserves useful
failure observations after reruns replace them.

## Independent specification review

- `/root/s12_acceptance` authored S12's proposed suite and reported its own
  scoped lint/typecheck passes. Root observed the browser/check results above.
- `/root/draft_review` independently inspected S12, fixtures, later permissions,
  layout/save/journal/recovery assertions and exact amendments, read-only. No
  blocking executable defect or weakened acceptance was found. Its reset-case
  documentation correction (**19-S1-3**) is applied in the draft story.
- `/root` authored S13 and both amendment patches. `/root/s12_acceptance`
  independently reviewed S13 read-only: found the same-cell refocus defect,
  now corrected, and confirmed selectors/fixtures/link behavior and consumer
  coverage. Added opening **17-S2-1**, real-word **17-S6-7/8**, strict color
  map additions and corrected reset ID are all enumerated in the story/patch.
- Both review agents followed the repository finisher role. Its configured
  Sonnet model is unavailable in this environment, so the session's inherited
  model was used. Neither reviewer ran browser/database checks or edited the
  other author's acceptance. These are draft specification reviews, not runtime
  or PR approval, human scope approval, or epic closeout audits.

UI rules were not tested by disabling runtime behavior (UI-only). No runtime
implementation, manual visual approval or deployment is claimed. Human approval
of the concrete packets is still required before freeze; runtime authorization
has not been given.
