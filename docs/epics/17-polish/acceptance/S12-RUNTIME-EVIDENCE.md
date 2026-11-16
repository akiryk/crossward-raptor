# S12 runtime evidence — updated 2026-11-16

The human subsequently authorized committing/pushing the handoff and supporting
documentation on 2026-11-16. Runtime remains excluded from that publication;
earlier uncommitted/unpushed statements describe the verification stop before
this documentation publication. No gate waiver was granted.

## DONE-icon approval and final verification

The human explicitly approved the exact independently reviewed DONE-icon
correction on 2026-11-15 by requesting its separate specification-only commit,
refreeze and completion of S12 verification and delivery on main. Commit
`b2d8ea1` refreezes the [retained patch](17-S12-done-icon-correction.patch),
SHA-256 `b0f4aec9ae762ace339e18f0fa4f15a2aaf67bd6cbfcd0233f05fdab5e40581e`.
Its only executable change is the final-color poll in `e2e/done-icon.spec.ts`;
it contains no runtime files. Independent proposal review is attributed below.
Earlier approval-pending statements below describe historical states only.

Final verification uses `/tmp/crossward-s12-verification`, original
S12 baseline `4fda6c9` plus the exact `0f110a8` and `b2d8ea1` corrections and the
three runtime files. SHA-256 of `git diff --binary -- e2e src` is
`a48797e0b41243818d15fdad10c912dd25f76c2fa8d7a7de0110155653cc88f5`.
All three runtime files and corrected acceptance match main byte-for-byte.
Main's S13 acceptance remains preserved; its runtime remains out of scope.

An initial concurrent `npm run verify` exited 2 in ESLint because Playwright
removed `test-results` during ESLint's directory scan (`ENOENT`). This was a
shared-artifact race before unit tests, not a passing gate. A serial rerun on
2026-11-16 **exited 0**: 114 files, 1,311 tests; two existing lint warnings.

The first full run after the DONE-icon refreeze **exited 1**: 1,408 passed,
44 failed, reported duration 2.4h. The corrected DONE-icon reset case passed.
An early failure in `live-sync.spec.ts:275` came from its asynchronous response
listener attempting `response.body()` after the page/context closed (line 282).
Later failures were widespread timeouts after the run's unusually long elapsed
time; the cause is unproven. All 44 error contexts and last-run metadata are
retained in `/tmp/crossward-s12-final-run1-failures`.
The full unchanged two-worker rerun was stopped with SIGINT at the human's
explicit request on 2026-11-16: **exit 130**, 795 passed, two interrupted,
655 not run, 8.9m. No test failure occurred before interruption; the two
interrupted modal-entrance cases are not product failures. DONE-icon and the
previously failing live-sync measurement both passed in that rerun. This is
not a passing full gate. No additional test, timeout or runtime edits were
made. A passing full browser gate remains required before runtime delivery.

The browser server and temporary `caffeinate -i` process stopped; the browser
lock was released. Final preservation checks confirmed all three runtime files
and the unrelated untracked `CLOSEOUT-S11.md` match the session-start hashes,
all seven S13 acceptance files match `d3a05cb`, and executable acceptance on
main is unchanged after `b2d8ea1`. Nothing was pushed. Runtime and updated
documentation remain local and uncommitted. Work is stopped at the human's
request; do not restart testing automatically.

The current orchestrator reopened the retained desktop idle-play and phone
hints-error screenshots and confirmed compact spacing and readable retry
feedback. Earlier 12-view visual coverage remains attributable to the earlier
session; runtime hashes are unchanged.

## Confirmed timeline and next-session direction (2026-11-16)

Retained file modification timestamps, in America/Denver (MST), clarify the
elapsed overnight session:

| Evidence | Timestamp | Meaning |
| --- | --- | --- |
| `/tmp/s12-delivery-start.json` | Nov 15, 19:59:19 | Session-start preservation snapshot |
| `/tmp/s12-final-tested-content.json` | Nov 15, 20:00:01 | Applicable content recorded immediately before checks |
| `/tmp/crossward-s12-final-run1-failures/live-sync-error-context.md` | Nov 15, 20:04:18 | Early live-sync failure artifact |
| `/tmp/crossward-s12-final-run1-failures/last-run.json` | Nov 15, 22:24:34 | First full run finished that evening; copy preserved the original mtime |
| Morning `npm run verify` tool output | Nov 16, about 07:45 | Agent resumed and observed a passing serial gate |
| `/tmp/crossward-s12-verification/test-results/.last-run.json` | Nov 16, 07:55:06 | Fresh 8.9-minute rerun stopped at the human's request |

The full run did not continue uninterrupted from evening until morning.
Neither the reason for the 2.4h outlier nor the cause of its widespread later
failures is established. Earlier full runs were about 14 minutes. Do not label
sleep/suspension, external network services or product behavior as the proven
cause without further evidence.

The human requested the next session focus on test reliability and turnaround:
fix flaky tests where possible, consider quarantine or removal where justified,
and avoid an agent spending hours monitoring long runs the human can execute.
They want an alternative to rerunning the entire suite after incidental
failures. This authorizes triage and recommendations, not an exact unreviewed
frozen-test deletion, quarantine or gate waiver. No full-suite run is authorized
by the new handoff prompt. Use existing artifacts and focused investigation;
provide exact manual commands for long checks. S12 delivery remains incomplete
and S13 runtime remains out of scope.

## Authorization and scope

The human explicitly authorized S12 runtime implementation on main, using S12's
frozen baseline for verification while preserving S13 acceptance and excluding
S13 runtime. Starting main was `65d7804`, three commits ahead of `origin/main`
(`61bb72a`). The pre-existing untracked `../CLOSEOUT-S11.md` is untouched.

Runtime changes are confined to `src/components/grid/SaveStatus.tsx`,
`src/components/grid/BuilderSteps.tsx` and `src/components/play/PlayPuzzle.tsx`,
outside CODE-REVIEW risk paths. Idle
success hooks remain empty and hidden; real saving/error/retry feedback remains.
Wide idle play removes its empty controls row and extra top margin. Builder
composition gives the owner's actual collaboration link a stable narrow row,
preventing transient feedback from moving the toggle/progress row.

## Earlier correction and resumed verification (historical)

On 2026-11-15 the human explicitly requested the independently reviewed expanded
correction as a separate specification-only commit, refreeze, verification and
delivery on main, adding “I approve the story”. Commit `0f110a8` freezes the
exact [retained patch](17-S12-correction.patch); its SHA-256 matches the reviewed
`47cd8ab8cd782d4f86935b1fd64f876a33888594752af9f4e2b10889ab5618de`.
The commit contains no runtime files. S13 acceptance is unchanged.

After that commit, the exact correction was applied to the S12 verification
tree. Tested content is original S12 baseline `4fda6c9` plus the correction
and the three unchanged runtime files below. SHA-256 of
`git diff --binary -- e2e src` is
`edace6a5afb5ffb2be1b50ea0dcb2ef889eab532357fb42dda42d03030df8093`.
The only source difference between the S12 baseline and main before runtime
is S13’s frozen `src/app/globals-css.test.ts`; it remains preserved on main.

Initial sandboxed checks could not access Docker or the local database;
`npm run verify` exited 1 (18 database suites unavailable), and E2E preparation
exited 1 before browser execution. The checks were rerun with execution
permission using the same guarded harness and standing reset grant. No
environment files were inspected or edited by the agent.

- `npm run verify`: **exit 0**, 114 files and 1,311 tests passed; two existing
  lint warnings remain.
- `COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- e2e/quiet-saved-state.spec.ts e2e/narrow-play.spec.ts e2e/step-controls.spec.ts e2e/builder-controls.spec.ts e2e/collaboration-polish.spec.ts --workers=2`:
  **exit 0**, 92 passed (including both setup cases and all 23 S12 cases), 38.2s.
- `COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- --workers=2`:
  **exit 1**, 1,451 passed and one failed (13.9m). All S12 cases passed.
  Only failure: `done-icon.spec.ts:398`, the same pre-existing pixel race
  recorded previously: rounded-corner RGB `{243,244,229}` versus `#F0F5E5`,
  difference 3 with tolerance 2. The row background has a 150ms color transition;
  its reset test screenshots the icon after the state attribute changes without
  waiting for the row background to settle. Artifact retained at
  `/tmp/crossward-s12-resumed-full-failures/done-icon-error-context.md`.
- `COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- --workers=1 --reporter=dot`:
  the exact DONE-icon failure reproduced with one worker. The orchestrator
  stopped the doomed run with SIGINT: **exit 130**, 485 passed, one failed,
  one interrupted (`inputs.spec.ts:331`), 965 not run, 4.7m. This is not a
  passing full gate. No retry, skip, assertion, timeout or runtime change was
  used. The server stopped and browser lock was released.

A possible further correction is retained as an unapplied
[exact patch, subsequently approved](17-S12-done-icon-correction.patch), also at
`/tmp/s12-done-icon-proposed-correction.patch`, SHA-256
`b0f4aec9ae762ace339e18f0fa4f15a2aaf67bd6cbfcd0233f05fdab5e40581e`.
It adds one poll for the existing row background to equal `PLAY_ROW` after
reset and mouse-out, before the icon screenshot; every pixel assertion and
tolerance remains unchanged. It is not applied to frozen acceptance, approved
or committed. Independent read-only agent `/root/s12_done_icon_review` inspected
the exact patch, failing excerpt, relevant helpers, row/icon/reset implementation,
palette and applicable specifications/policy. It found no blocking defect in the
proposal and no product defect: the state attribute establishes logical state,
not transition completion; the poll adds a real final-color assertion and follows
the existing polling approach in this test file. It ran no browser checks and
did not edit files. The transition
explanation is an inference from the 150ms transition and observed intermediate
RGB; no browser trace has proved its timing. The proposal is untested.

The orchestrator requested explicit human approval of this additional exact
correction, as required by STORY. That approval is pending. No source, frozen
acceptance or runtime changed after the original `0f110a8` refreeze. S12
runtime remains uncommitted; nothing has been pushed during this session.

The resumed orchestrator also reopened the retained desktop idle-play and phone
hints-error screenshots and confirmed compact spacing and readable feedback.
The prior session’s 12-view visual results and recovery proof below remain
applicable because all three runtime hashes are unchanged.

## Tested content (prior session)

Verification worktree: `/tmp/crossward-s12-verification`, detached at S12's
specification-only baseline `4fda6c96b08982672574f8cbd97ca896dda7e252`, with only
the three runtime files changed. All frozen acceptance matches that baseline.
Main retains S13's later acceptance unchanged from `65d7804`.

| Runtime file | SHA-256 |
| --- | --- |
| `src/components/grid/SaveStatus.tsx` | `4daf9a406b5a1b0552c925468e93b4ea72d31dc0bb42af597e861c7f737fa400` |
| `src/components/grid/BuilderSteps.tsx` | `d4d750a8cc8b8bbceee1d5fe7fec716f43d123fb13d9e66eef88d153068333aa` |
| `src/components/play/PlayPuzzle.tsx` | `5f1aba446b110f8b5d4dc8aca71fdba17dd5289e3d684f0c46bc5613bfb12aa6` |

The orchestrator directly compared all three files byte-for-byte with main. SHA-256
of the verification tree's `git diff --binary -- src` is
`8c3ba665a87998e3a7b5f5d705fa411a3344d9e90b1866baebb746d206b7699a`.
No unit or browser acceptance was changed for implementation.

## Checks directly observed by the orchestrator

- `npm run verify` in the S12 tree: **exit 0**, 114 test files and 1,311 tests
  passed. TypeScript and lint passed; two existing unused-variable warnings
  remain in `e2e/reset-with-locks.spec.ts` and `request-logger/render.ts`.
- `COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- e2e/quiet-saved-state.spec.ts --workers=2`:
  **exit 1**, 23 passed (two authentication setup cases plus 21 S12 cases),
  two S12 cases failed. Both failures are the frozen-test selection defect below.
- Full `COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- --workers=2`
  on the initial two-file runtime: **exit 1**, 1,443 passed, nine failed (14.5m).
  Failure contexts retained in `/tmp/crossward-s12-full-failures`. In addition
  to the two hints cases, wide `narrow-play` contradicts silent saved status.
  `build-progress` exposed a real saving-transition row shift, subsequently
  fixed in BuilderSteps. Other failures: live-sync idle payload (364 bytes,
  expected <100), DONE icon RGB tolerance (difference 3, tolerance 2), Rebus
  transition opacity (0.97, expected 1), and two auth-request ECONNRESETs.
- After the BuilderSteps fix, `npm run verify` again **exited 0**, 114 files /
  1,311 tests. The following isolated browser rerun **exited 1**, eight passed
  (two setup plus six previously failing cases), only the frozen narrow-play
  contradiction failed again:
  `COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- e2e/build-progress.spec.ts e2e/done-icon.spec.ts e2e/live-sync.spec.ts e2e/ownership.spec.ts e2e/rebus.spec.ts e2e/row-menu.spec.ts e2e/narrow-play.spec.ts --grep '22-S2-7 narrower|after Reset the row draws Play|a commit elsewhere shows within|O1 default puzzle fixtures|17-S10-9 play|made unlisted, a puzzle stays|at 1430px: the title' --workers=1`.
  This establishes the layout fix and isolates the five intermittent failures;
  it does not turn the failed full gate into a pass.
- Final `COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e -- e2e/quiet-saved-state.spec.ts e2e/step-controls.spec.ts e2e/builder-controls.spec.ts e2e/collaboration-polish.spec.ts --workers=2`:
  **exit 1**, 69 passed, only the two known phone hint-selection cases failed.
  Final runtime hashes are the three-file table above. A full passing browser
  run on final applicable content remains required.

Browser runs are serialized under `/tmp/crossward-e2e.lock`. Guarded preparation
uses DEVELOPMENT's standing authorization for the validated local test database;
no environment files were inspected or edited. Two initial startup failures
preceded the focused browser run: a separate Compose project conflicted with
existing ports; then Turbopack rejected a dependency symlink outside its root.
Using the existing Compose project and a local dependency copy resolved both.
The failed separate-project startup created unused Compose resources; none were
removed and no existing database was reset outside the guarded harness.

## Visual inspection

`node scripts/e2e-server.mjs` built and served the same final S12 tree;
`npx tsx /tmp/s12-visual.mts` **exited 0**, seeding synthetic fixtures through
validated helpers. The orchestrator opened and inspected all 12 screenshots
in `/tmp/crossward-s12-visual`: 1440px and 390px, builder grid/hints and play,
idle and failed saves. Idle states were silent, wide title/hint/grid spacing
was compact, real builder controls and right alignment remained intact, and
retry/error feedback was readable without overlap. All 12 captures reported no
horizontal overflow. Builder automatic retry and player Retry recovered to
acknowledged, hidden idle hooks. These are Chromium emulated desktop/phone
viewports, not physical-device checks. The test server was stopped and the
browser lock released afterward.

## Frozen-test blockers and independently reviewed proposed correction

Both `17-S12-1` hints/390px cases (owner and collaborator) fail at the database
check in `e2e/quiet-saved-state.spec.ts:102`. Existing hints startup selects
`0,0` Across; clicking that selected cell switches to Down. The phone input
therefore edits `1-down`, but the test checks `hints['1-across']`. The failure
snapshot directly showed textbox **“1 Down hint”** with **“A quiet hint”**, while
`1-across` remained **“A clue”**. The reload branch repeats the selection error.
The wide cases directly target the Across input and pass.

First correction: add `await editor.keyboard.press('ArrowRight');` immediately after the `0,0`
click in the initial hints-edit and reload hints branches. This explicitly
selects Across and preserves every assertion, timeout, case and S13 test.
No runtime selection behavior should change to accommodate the defective tests.

Second correction: the wide threshold case at `e2e/narrow-play.spec.ts:149`
requires every WIDE_PARTS hook, including idle `play-save-status`, to be visible.
S12's zero-footprint silent hook must instead be acknowledged, empty and hidden.
Replace only that hook's wide expectation, retaining every other wide visibility
check, the narrow cases and the hidden hint-bar assertion.

Expanded exact patch: `/tmp/s12-acceptance-correction.patch`, SHA-256
`47cd8ab8cd782d4f86935b1fd64f876a33888594752af9f4e2b10889ab5618de`.
It superseded the initial two-line-only proposal. Human approval and application
are recorded in the resumed-verification section above.

Independent agent `/root/s12_acceptance_review` approved this exact correction
through read-only source inspection. It independently confirmed the existing
cursor behavior and unchanged frozen acceptance; it did not rerun browser tests
or inspect the failure artifact, which the subsequent full run had cleared.
Subsequent read-only reviews by the same agent approved the expanded patch,
found no concrete bugs in all three runtime edits, and confirmed S13 behavior
unchanged. These reviews are separate from the parent's
directly observed test results; no PR or merge was involved.

### Exact reviewed patch (historical proposal; now applied in `0f110a8`)

```diff
--- a/e2e/quiet-saved-state.spec.ts
+++ b/e2e/quiet-saved-state.spec.ts
@@ -94,6 +94,7 @@
               .toEqual({ kind: 'active', letter: 'Z' });
           } else {
             await cell(editor, '0,0').click();
+            await editor.keyboard.press('ArrowRight');
             const input = width >= 1140
               ? editor.locator('[data-hint-key="1-across"] [data-testid="hint-input"]')
               : editor.getByTestId('hint-box-input');
@@ -116,6 +117,7 @@
             await expect.poll(() => shownLetter(editor, '0,0')).toBe('Z');
           } else {
             await cell(editor, '0,0').click();
+            await editor.keyboard.press('ArrowRight');
             const input = width >= 1140
               ? editor.locator('[data-hint-key="1-across"] [data-testid="hint-input"]')
               : editor.getByTestId('hint-box-input');
--- a/e2e/narrow-play.spec.ts
+++ b/e2e/narrow-play.spec.ts
@@ -148,7 +148,13 @@
 
   test('at 1430px: the title, controls, Prominent Hint and Player Hints, and no bar', async ({ page }) => {
     await open(page, 1430);
-    for (const id of WIDE_PARTS) await expect(page.getByTestId(id), id).toBeVisible();
+    for (const id of WIDE_PARTS.filter((id) => id !== 'play-save-status')) {
+      await expect(page.getByTestId(id), id).toBeVisible();
+    }
+    const status = page.getByTestId('play-save-status');
+    await expect(status).toHaveAttribute('data-save-state', 'saved');
+    await expect(status).toHaveText('');
+    await expect(status).toBeHidden();
     await expect(hintBar(page)).toBeHidden();
   });
 });
```
