# Historical S1/S2 closeout — before S3

This record applies to runtime `271b25c` and acceptance `6187a20`. The human
subsequently requested the S3 amendments; use the current HANDOFF/CLOSEOUT
for present status. The original record follows unchanged.

# Hint refinements — closeout evidence

## Delivery and provenance

- Starting branch/head: clean `epic/26-hint-refinements` at `957ddda`.
- S1 acceptance: `090d13f` on main; S1 runtime: `957ddda` on epic.
- S2 acceptance: `6187a20` on main, pushed before runtime restoration and
  merged into epic at `4b85162`.
- S2 runtime: `271b25cbf915e89a05b5b36754508853e1700f70`, four declared runtime
  files, no risk paths. Implementation agent authored runtime; orchestrator
  authored acceptance and handled freeze/delivery. A separate verification
  agent reviewed proposed tests and completed the final gates.
- Runtime implementation, prototype and final committed content are identical.
  Frozen tests compare cleanly to `6187a20`; the S1 unit file is an exact prefix
  of the extended file, and S1 browser acceptance is unchanged from `090d13f`.
- Main has specification/acceptance only for this epic. No runtime merge to
  main is authorized. Human visual check remains pending.

## S2 prefreeze demonstrations (orchestrator observed)

On S1 head `957ddda` plus proposed S2 acceptance and the throwaway prototype:

- `npm run verify`: exit 0, 114 files / 1,308 tests passed. Two existing lint
  warnings in `e2e/reset-with-locks.spec.ts` and `request-logger/render.ts`.
  An earlier sandboxed attempt failed 18 database suites for localhost access;
  the successful run used approved access, with no tests skipped.
- `npm run test:e2e -- e2e/linked-entry.spec.ts e2e/sister-word.spec.ts
  e2e/hints-grid-editing.spec.ts e2e/hint-phase-design.spec.ts
  e2e/play-design.spec.ts e2e/linked-clues.spec.ts`: exit 0, 76 passed. An
  earlier draft case clicked the current cell and toggled direction; fixed
  the draft setup before freeze (click a different cell, then ArrowUp).
- With the prototype removed, `npm test -- src/lib/clue-reference.test.ts`:
  exit 1, S2-1 failed for missing `linkedEntryCells`; all 19 S1 cases passed.
- With the prototype removed, `npm run test:e2e -- e2e/linked-entry.spec.ts
  --grep '26-S2-[2345]'`: exit 1, all four S2 cases failed at their first
  pale-cell assertion (expected `1,0` and `2,0`, observed none); two setup
  cases passed. The prototype was absent from the acceptance-only freeze.
- Independent proposed acceptance review: no blockers or vacuous assertions.
  Direct S2 browser scope is 1440px; finished play and narrow layout are not
  directly exercised by S2 cases. Existing play lock/focus gates are reused.

All browser preparation used DEVELOPMENT's standing authorization for guarded
local test resets and the shared-database lock. No ad hoc reset/deletion was
performed. S1's earlier verification/discrimination is in [HISTORY-S1](HISTORY-S1.md).

## Final gates

Independent verification agent on `271b25c`:

- `npm run verify`: exit 0, 114 files / 1,308 tests passed; two existing lint
  warnings. Approved localhost access; no tests skipped.
- First full `npm run test:e2e`: exit 1, 1,422 passed / 3 failed (12.0m),
  normal four workers. All three failed in fixture authentication before product
  assertions: `menu-reset.spec.ts:138` and `:215`, POST magic-link connection
  reset at `e2e/helpers/auth.ts:53`; `row-menu.spec.ts:411`, GET get-session
  connection reset at `e2e/helpers/auth.ts:110`. No S1/S2 failures. Matches
  LEARNINGS 10's recorded auth `ECONNRESET` pattern; no tests/helpers edited.
- `npm run test:e2e -- e2e/menu-reset.spec.ts e2e/row-menu.spec.ts`: exit 0,
  24/24 passed unchanged (21.0s), including all prior failed cases. No
  deterministic product bug reproduced. Sanitized first-run error evidence is
  retained at `/tmp/epic26-first-full-e2e-errors.md` for this session.
- A subsequent full-run launch stopped during preparation with sandbox-denied
  Docker socket access; no browser tests ran. The verifier restarted with the
  approved plain command rather than the chained read-check/test invocation.
- Second actual full `npm run test:e2e`: exit 1, 1,424 passed / 1 failed
  (10.3m), normal settings. Sole failure: frozen `live-sync.spec.ts:275`
  (24-S4-E4), `response.body: Test ended.` at its async response listener,
  line 282, during teardown. All earlier authentication failures and S1/S2
  passed. Evidence: `/tmp/epic26-second-full-e2e-errors.md`.
- `npm run test:e2e -- e2e/live-sync.spec.ts --grep '24-S4-E4'`: exit 0,
  3 passed including both authentication setup cases (38.2s), unchanged.
  No deterministic failure reproduced.
- Third complete full `npm run test:e2e`: **exit 0, 1,425/1,425 passed**
  (10.0m) on unchanged `271b25c`, ordinary four workers, no cap/retry/assertion
  changes. This is the required clean full-suite gate. The machine's older
  two-worker guidance was identified but no cap was needed or applied.
- Verifier's final readback: HEAD remained
  `271b25cbf915e89a05b5b36754508853e1700f70`; runtime diff empty; S2 acceptance
  matches `6187a20`; S1 browser acceptance matches `090d13f`, original unit
  assertions preserved. Database lock released. Only closeout documentation
  differed, and those final docs do not change the tested application/tests.

## Independent audit

Independent `epic26_audit` agent, 2026-11-15, report-only; authored none of
this epic. Static review found no Wrong, Stale or Unenforced findings and no
runtime/specification/acceptance blockers. Final full-suite evidence clearance
was confirmed after the passing verifier report and final documentation/diff
recheck; no new blockers. Remote delivery readback remains the orchestrator's
responsibility. This record is written by the orchestrator, not the auditor.

Coverage: EPIC, both stories and freeze history; current handoff/index/closeout
and historical S1 handoff; complete runtime diff `6187a20..271b25c`; parser,
native-field decorative layer, ClueText callers, style/catalog; S2 cell helper,
editor/play focus and lock gates, grid mode/precedence/metadata; all epic
acceptance plus F1 amendments; relevant lifecycle/risk/audit/handoff/permissions
procedures and LEARNINGS. No engine/storage/server/schema/collaboration risk
paths changed.

Source evidence inspected: `src/lib/clue-reference.ts:10` and `:24`;
`PuzzleGridEditor.tsx:753`; `PlayPuzzle.tsx:170`; `PuzzleGrid.tsx:299` and `:328`.
The auditor independently confirmed S1's three other acceptance files are
byte-identical to `090d13f`, S1 unit content is preserved with S2-only addition,
and S2 acceptance matches `6187a20`. Runtime/test content remains unchanged
from tested `271b25c`; `git diff --check` passed. No `.github` CI configuration
was present; no external CI success is claimed.

Pruning: no handoff deletion candidates. LEARNINGS 1–6 remain judgment/process
guidance, 7's paint/geometry advice is implemented here by S1's screenshot/box
assertions but remains useful beyond this epic, 8 remains general Strict Mode
guidance, 9's masthead regression is tested while open redirect paths keep its
guidance load-bearing, and 10's full-suite caution remains load-bearing. No
unrelated process/learning entries were changed.

Limits: auditor reran no suites and reused the separate verifier's evidence;
no human visual check or production/deployed UI review. Direct S2 acceptance
is 1440px; narrow and finished play rely on shared source gates/existing suites
rather than a new direct S2 case. Delivery readback is the orchestrator's task.

## Human visual check

Local app restored with `npm run dev`: ready at `http://localhost:3000`; local
Mailpit healthy. No visual approval is inferred from server startup.

Pending. Check recognized `With` in builder fields and solver displays; select
linked clues in hints (including Lock Grid Letters) and play; confirm pale
referenced cells, current-word/cursor precedence, movement to another clue,
live valid/invalid edits and focus loss. This check precedes any separately
authorized merge to main.
