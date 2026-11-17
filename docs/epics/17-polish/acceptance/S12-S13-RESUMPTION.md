# S12/S13 resumed implementation and harness reliability

**Current (2026-11-16):** both exact harness corrections are approved/refrozen
in `65c92af`. The human has now run the full browser gate: **1,460 passed**,
no failures/skips/flaky cases or report-level errors, Playwright final status
`passed`. All 443 applicable files still match the pre-run manifest. Implementation is delivered on main in `750289f`; independent epic closeout
and correction recheck are complete; see the final section. Earlier
pending-gate and local-runtime statements below describe their historical phase.

## Authorization and current delivery

On 2026-11-16 the human explicitly authorized resuming S12, implementing S13,
the smallest necessary harness repairs, and delivery/epic closeout after passing
evidence and required reviews. They retained the verification policy, required
the exact approval procedure for frozen corrections, prohibited unchanged full
suite diagnostic reruns, and reserved the full browser command for human execution.

Before harness refreeze, starting checkout: `main` at `3f80d4e` (also observed `origin/main`). The three
existing S12 runtime changes and unrelated untracked `../CLOSEOUT-S11.md` were
preserved. S13 now removes the standalone label, uses semantic
`prominent-hint-empty` for blank/whitespace hints, preserves authored real text,
and supplies populated/empty style-guide examples. The only addition to S12's
`PlayPuzzle.tsx` changes is removal of the obsolete S13 label prop/derived slot.
No runtime is committed, pushed or delivered. No full passing browser gate or
new epic closeout audit exists.

## Before harness refreeze: triage and bounded repairs

Independent read-only reviewer `/root/harness_review` inspected harness code and
the retained `/tmp/crossward-s12-final-run1-failures` contexts. The 44 unique
failures comprise one untracked response-body-after-close failure, 35 test
timeouts, seven assertion/action timeouts, and one local auth `ECONNRESET`.
Its counts exclude the duplicate live-sync context.

The retained unlisted snapshot has 1,241 list items and 691,300 bytes; the
small-screens library has 1,170 items and 653,372 bytes. Later row-menu snapshots
have 1,121–1,124 items. This proves excessive accumulated DOM, not the cause of
the 2.4-hour outlier. The harness uses local Next/Postgres and disables email;
external-service failure is not established.

Implemented editable configuration repair: ESLint ignores `test-results/**`
and `playwright-report/**`. Its API reports both generated probe paths ignored
and `src/components/play/ProminentHint.tsx` still included.

At the earlier session’s stop, two exact frozen corrections were **unapplied
proposals awaiting human approval** under [STORY](../../../process/STORY.md#3-implement-the-frozen-scope):

- [Live-sync correction](17-S12-live-sync-correction.patch), SHA-256
  `b36bc674f927ff9d2ba7a6fba177fdc274ff66783687d1b70743b1d2a526a159`:
  measure bodies only for requests starting during idle, handle/drain reads,
  detach the listener in `finally`, require a nonempty sample, and retain all
  existing thresholds/windows and read errors as failures.
- [Library-isolation correction](17-S12-library-isolation-correction.patch),
  SHA-256 `f0bdcd5d028469d0b9355e68540c039e7a88324f56baf7cfd8fcca1be139b91b`:
  add existing fresh-user sign-in before each test in row-menu, puzzle-groups,
  small-screens and unlisted. Fixtures remain inside test bodies; explicit
  owners/current-builder reads and implicit fixture binding follow the new
  identity. No assertions, cases, timeouts or data deletion change. Public
  fixtures remain visible and can still accumulate; sign-in adds bounded work.

The independent reviewer checked both exact hashes, `git apply --check` exit 0,
listener lifecycle, phase boundaries, test ownership/hook order and additional
users; no blockers remained. This is source review, not browser evidence for
either unapplied patch. It also reviewed S13/configuration; obsolete derived
slot declarations identified during review were removed. Earlier S12 runtime
reviews remain attributable to reviewers in [S12 evidence](S12-RUNTIME-EVIDENCE.md).

After approval: commit the exact corrections separately from runtime and
refreeze; run focused live-sync and four-spec library coverage. Use an
accumulated-fixture experiment if needed to establish isolation effectiveness.
Do not delete/quarantine cases or waive the full gate.

## Before harness refreeze: directly observed checks on combined runtime

The orchestrator observed these on current `main` plus local runtime/config:

- Initial sandboxed `npm run verify`: exit 1 because 18 database suites could
  not connect; 96 files/1,178 tests passed. This was not passing evidence.
- After ordinary execution permission and local Docker startup,
  `npm run verify`: **exit 0**, 114 files / 1,311 tests. Two pre-existing lint
  warnings only (`reset-with-locks.spec.ts`, `request-logger/render.ts`).
- `COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- e2e/quiet-saved-state.spec.ts e2e/prominent-hint-polish.spec.ts e2e/play-design.spec.ts e2e/play-opening.spec.ts e2e/completed-play.spec.ts e2e/real-words.spec.ts e2e/color-tokens.spec.ts --workers=2`:
  **exit 0**, 91 passed, 32.9s. All S12/S13 cases included. This focused run
  does not satisfy the full browser gate.
- `git diff --check`: exit 0. Executable frozen acceptance remains unchanged
  (`git diff -- e2e src/app/globals-css.test.ts` empty).

The focused browser run held `/tmp/crossward-e2e.lock`; it stopped its server
and the orchestrator released the lock. Preparation used DEVELOPMENT's standing
guarded local reset grant. No environment files were inspected/edited.

Tested-content manifest: `/tmp/crossward-s12-s13-tested-content.json`; SHA-256
of its sorted compact `files` map is
`546ff117efa90aae9bb6f83e909f9e22a0d169a03a2d52168bf7d5afc17c47f8`.
It covers tracked `src`, `e2e`, `scripts`, `prisma`, package/lock, ESLint,
Playwright, Vitest and TypeScript configuration. It binds the observed checks
to applicable content, independent of subsequent documentation-only edits.

S12 `SaveStatus.tsx`/`BuilderSteps.tsx` retain their recorded hashes
`4daf9a406b5a1b0552c925468e93b4ea72d31dc0bb42af597e861c7f737fa400` /
`d4d750a8cc8b8bbceee1d5fe7fec716f43d123fb13d9e66eef88d153068333aa`.
Combined S12/S13 `PlayPuzzle.tsx` is
`efef7e487d9236f133ad94194f8bc0c9fb72bc6e259e28556e43e9fe38d5c94e`.
Unrelated `CLOSEOUT-S11.md` is unchanged at
`6396e4d812fb071b3fed470f72d557c076c559157008ae5bedb424d6b014c1b2`.

## Before harness refreeze: remaining gates

Independent testing agent `/root/visual_verification` ran
`npx tsx /tmp/s13-visual-verification.mts` (exit 0) against the combined runtime,
captured and inspected six images in `/tmp/crossward-s13-visual`, and reported:
wide selected blue/hint-only and unselected faint/empty bars both 52px with stable
grid position; long authored numeric/With text wraps without overlap (216px bar);
390px narrow bar/navigation and both style-guide samples remain correct. Page
width equals scroll width at 1440px and 390px. Idle play shows no Saved text or
blank row. Observations are retained in `observations.json` there. These are
Chromium emulated viewports, not physical-device checks. This delegated result
does not repeat the earlier S12 builder/error visual coverage, which remains
attributable to the earlier session. The agent stopped its server, confirmed
port 3100 had no listener, and released the lock; no reset/full suite occurred.

At that stop, harness focused checks awaited exact correction approval. After those checks,
give the human the exact final checkout
and full-suite command; do not start that suite as an agent. Bind passing human
evidence to the unchanged tested content, then perform applicable delivery and
the separate independent report-only epic closeout audit. Stories remain open
until their Definitions of Done are met.

## Approved corrections: final focused verification (2026-11-16)

The human approved both pending exact corrections in the resumption request,
adding that future patch approval requests must explain the change and reason
directly rather than asking them to read patch code. Both exact hashes and clean
apply checks were confirmed, then specification-only commit
`65c92af72f2fb2c2f5a4ed0e14b4917129eead66` refroze the five corrected specs
with their exact proposals and [approval record](S12-HARNESS-REFREEZE.md).
Runtime/configuration and all unrelated work were excluded. No push occurred.

The current orchestrator directly observed:

- `npm run verify`: **exit 0**, 114 files / 1,311 tests passed; the same two
  existing lint warnings. The initial sandboxed attempt exited 1 because its
  18 database suites could not connect. The successful rerun had ordinary
  execution permission for the local database.
- `COMPOSE_PROJECT_NAME=crossward-raptor PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/crossward-s12-harness-focused.json npm run test:e2e -- e2e/live-sync.spec.ts e2e/row-menu.spec.ts e2e/puzzle-groups.spec.ts e2e/small-screens.spec.ts e2e/unlisted.spec.ts --workers=2 --reporter=list,json`:
  **exit 0**, 68 passed, 57.9s; no skipped, flaky or unexpected cases and no
  report-level errors. The idle annotation records 10 requests in 10 seconds.
  The first sandboxed attempt stopped at Docker access before browser execution.
- The same command with
  `--config=/tmp/crossward-s12-accumulation.config.ts` and JSON output
  `/tmp/crossward-s12-harness-accumulated.json`: **exit 0**, 68 passed, 54.1s;
  no skipped, flaky or unexpected cases and no report-level errors. The idle
  annotation again records 10 requests in 10 seconds.
- `PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/crossward-s12-s13-full-inventory.json npx playwright test --list --reporter=json`:
  **exit 0**, collection only, 1,460 tests / 136 files; no browser gate ran.
- `git diff --exit-code 65c92af -- e2e src/app/globals-css.test.ts`, both
  exact patches' reverse apply checks, and `git diff --check`: **exit 0**.

The accumulation config lives outside the repository and preserves the normal
projects, server and acceptance. Its additive global setup seeded 1,200 private
5×5 puzzles for the shared suite builder, one published public control and one
unpublished fresh-user control. It authenticated through existing magic-link
helpers and confirmed identities before inspecting each library. The shared
session saw **1,201 rows**, including all 1,200 accumulated private fixtures;
the fresh session saw **two rows**, its own fixture and the public control,
with zero accumulated fixtures. All 1,200 remained stored afterward. Navigation
observations were 800ms shared and 53ms fresh; these are one-run measurements,
not general latency guarantees. The unchanged five-spec coverage then passed
against that populated database. Public-fixture accumulation remains possible;
this experiment proves isolation of prior owned fixtures only.

The diagnostic's first temporary config omitted the repository working directory
for its server, so that attempt exited 1 before global setup or tests
(`Cannot find module /private/tmp/scripts/e2e-server.mjs`). The corrected
temporary config sets absolute server/auth paths; no repository configuration
or frozen acceptance was changed for the experiment.

Both browser runs held `/tmp/crossward-e2e.lock`, used DEVELOPMENT's standing
guarded local reset grant and ran serially. The server stopped, port 3100 had
no listener, and the lock was released. No ad hoc data deletion or environment
file inspection/edit occurred. Runtime files and the unrelated
`CLOSEOUT-S11.md` retain their session-start hashes.

Machine-readable provenance is retained in
`/tmp/crossward-s12-s13-post-refreeze-evidence.json`, including both report
hashes, stats, exit statuses, idle annotations and experiment artifact hashes.
The controls are in `/tmp/crossward-s12-accumulation-observations.json`;
setup/config sources remain beside it. Prior S12/S13 acceptance and visual
evidence above remains attributed to its original agents; current applicable
content differs from that manifest only in the five approved corrected specs.

## Human-run full browser gate and remaining delivery

Run in the existing checkout at
`/Users/adamkiryk/Documents/codebase/crossward-raptor`, on main at `65c92af`
**with the current local runtime/configuration edits retained**. Do not use a
clean checkout of the specification-only commit: it lacks the implementation.
The final 443-file applicable-content manifest is
`/tmp/crossward-s12-s13-human-gate-content.json`; SHA-256 of its sorted compact
`files` map is
`dafaa319af63581ba9553bcf6f7dbb97ffaf1def00e6914e762ae0ecf108cb10`.
This covers tracked source, acceptance, scripts, Prisma and relevant configs.
No subsequent executable edits are permitted without reassessing evidence.

Take the browser lock; if acquisition fails, stop rather than overlapping
another run or removing its lock:

```sh
mkdir /tmp/crossward-e2e.lock && \
COMPOSE_PROJECT_NAME=crossward-raptor PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/crossward-s12-s13-human-full.json npm run test:e2e -- --workers=2 --reporter=list,json
```

After this run ends, release its lock with `rmdir /tmp/crossward-e2e.lock`
and report its browser result/exit status. The two-worker cap is disclosed;
all default projects, cases and original assertion/time budgets remain active.
The JSON report retains machine-readable scope/results for all 1,460 cases.
Do not rerun a failed full gate unchanged diagnostically or treat an interrupted
run as passing. Preserve its artifacts before any further browser preparation.

After human passing evidence: verify report scope/status/provenance and unchanged
applicable content; finish authorized direct delivery of the runtime/docs on main
and confirm the resulting commit matches tested content. Then obtain the separate
independent report-only epic closeout audit from an agent/session that authored
none of this work, record its findings/disposition as the non-auditing orchestrator,
and close only after all remaining gates pass. No full gate, runtime delivery or
new closeout audit has occurred yet.

## Human browser evidence validated; delivery resumed (2026-11-16)

The human confirmed executing the supplied full command and releasing the lock.
The orchestrator directly read `/tmp/crossward-s12-s13-human-full.json`:
**1,460 expected passes**, zero skipped/unexpected/flaky cases, and zero
report-level errors. Duration: **806,880.589ms (13m 26.9s)**, starting
`2026-11-17T00:01:12.234Z` (2026-11-16 locally).
`test-results/.last-run.json` independently records `status: passed` and an
empty `failedTests` list. The human shell exit code was not retained; these
complete machine reports establish Playwright's final passing result.

The report SHA-256 is
`b8e4f0ee1c72d46726eed3a8d36d72dec657c26ebc4ecbcea0646b1eb218bc39`.
Every `(spec.id, projectName)` pair exactly matches the retained 1,460-case
full-suite collection inventory. The reported two-worker run used all default
projects without filtering, retries or test weakening. Every file in the
443-file human-gate manifest is unchanged; its content-map SHA-256 remains
`dafaa319af63581ba9553bcf6f7dbb97ffaf1def00e6914e762ae0ecf108cb10`.
This binds the human full pass, the orchestrator's final verify pass and focused
checks to the implementation being committed. No suite was rerun just to
resume delivery. The user need not locate or read the report manually.

The remaining direct-delivery work is to commit/push only authorized runtime,
configuration and documentation on main, confirm the resulting commit's
applicable content, then obtain a separate independent report-only epic audit.
The auditor must author none of the audited work; the orchestrator records
findings/disposition and closes the epic only after blockers are resolved.
Unrelated `CLOSEOUT-S11.md` remains untouched and excluded from delivery.

## Main delivery (before closeout audit)

Implementation commit `750289fa9fe37087d6371c4f9df96ef2579ebed8` was committed
and pushed to origin/main on 2026-11-16, including the separately refrozen
`65c92af` ancestor. The orchestrator read back GitHub's main ref at that exact
SHA and compared each of the 443 committed applicable files against the human
gate manifest: all match. Frozen acceptance remains unchanged after refreeze;
no actual changed path falls under CODE-REVIEW's risk paths. Direct main
delivery therefore applies; no PR or merge gate is required. Unrelated
untracked `CLOSEOUT-S11.md` was preserved and excluded.

GitHub reported zero check runs, with no `.github` Actions configuration in
the repository. Its separate Vercel deployment status was pending at the
initial read; deployment does not substitute for the completed local/human
verification. The separate independent report-only epic audit remains before
closure. Current closure-status documentation is being prepared separately
from the delivered runtime.

## Independent epic closeout completed (2026-11-16)

The independent report-only agent `/root/polish_closeout_audit`, author of none
of the work, audited the delivered implementation and epic-wide specifications,
affected source/tests and relevant workflow records. It found no runtime or
acceptance blocker and independently validated the 1,460-case human pass,
443-file committed-content identity, frozen acceptance preservation, focused
reports and visual artifacts. The root corrected its three nonblocking
documentation findings; the auditor independently rechecked those exact
corrections and the root-authored [closeout record](../CLOSEOUT-S12-S13.md),
confirmed all findings resolved and no remaining blocker/drift in that scope.
The record preserves full coverage, evidence attribution, pruning and limits.

The orchestrator observed GitHub's Vercel status for `750289f` change to
`success` / “Deployment has completed”, with zero check runs; no hosted
interaction test is claimed. The root then marked S12/S13 and the reopened
epic closed and prepared the documentation-only closeout commit/push. All
application, configuration and frozen acceptance content remains unchanged
from the passing run. No full browser rerun, new reset or environment-file
access occurred during delivery/closeout. Unrelated `CLOSEOUT-S11.md` remains
untouched and untracked.
