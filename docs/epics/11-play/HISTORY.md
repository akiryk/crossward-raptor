# Historical handoff record

Archived on 2026-10-19 before the workflow consolidation. The snapshot below
is preserved verbatim, including then-current statuses, permissions and next
steps. It is historical evidence, not current instructions or required startup
reading. Use [HANDOFF.md](HANDOFF.md) for current state and authorization.

# Play — Handoff

## Read first

1. `AGENTS.md`, if not loaded; this handoff's Current state and Next action.
2. `docs/epics/11-play/EPIC.md` — Decisions, Non-goals and story order.
3. `docs/epics/11-play/stories/11-P3-finishing.md`,
   `src/engine/play.test.ts`, `src/app/puzzles/actions.play-completion.test.ts`
   and `e2e/play-completion.spec.ts` — new P3 specification/acceptance candidates,
   not frozen; resolve the pending input/failure decision before implementation.
4. `docs/epics/11-play/stories/11-P2-typing-and-resuming.md` and new
   `src/app/puzzles/actions.play-entries.test.ts`, `e2e/play-entries.spec.ts`
   — frozen P2 contract and acceptance; preserve them during implementation.
5. `docs/epics/11-play/stories/11-P1-play-route.md` — frozen P1 contract,
   acceptance paths, scope and manual checks.
6. `src/app/puzzles/actions.play-route.test.ts` and `e2e/play-route.spec.ts`
   — immutable acceptance; `e2e/helpers/play-route.ts` is editable plumbing.
7. `src/components/play/PlayPuzzle.tsx`,
   `src/components/play/play-autosave.ts`, `src/lib/play-entries.ts`,
   `src/app/puzzles/actions.ts` and `src/components/grid/PuzzleGrid.tsx`
   — P2 runtime input, recovery, validation and rendering seams.

Conditionally read `docs/process/STORY.md` and `docs/CODE-REVIEW.md` before
implementation/delivery; `docs/DEVELOPMENT.md` before schema/E2E operations;
`docs/LEARNINGS.md` for timing/fixture failures. Ownership is closed; its
handoff is prerequisite history, not work to replay.

## Current state (2026-10-19) — P3 specification in progress

The user explicitly authorized starting P3 on 2026-10-19. P3 is in its separate
specification phase: draft story and **28 engine / 39 server / 17 browser**
acceptance cases are authored; **no runtime implementation has started**.
Current checkout remains `main` at `6034299`, matching `origin/main` before
this task. The starting tree was clean. Uncommitted changes are the P3 story,
three new acceptance files, EPIC authorization/status and this handoff. No
commit, push, branch, PR or acceptance freeze has occurred.

Separate agents inspected server/client and authored acceptance. A third,
independent read-only reviewer inspected the actual story and all 84 new
cases. Its conditional review found no blocking defects in the current tests,
but **did not approve freeze**: a meaningful UX/failure decision remains.

Pending user replies:

- Briefly pause input while a full grid saves and checks (recommended), or
  allow typing during that request. The original asynchronous question also
  offered resumed editing on failure. Independent review identified that
  once correct entries are saved, the server already protects the solved grid,
  so a failed inspection cannot safely offer unrestricted editing. Recommended
  distinction: a failed save permits Retry/resumed editing; a successful save
  followed by failed inspection keeps input paused with Retry verification.
  Resolve with the user, record the decision, add/review pending-input and
  failure/resume acceptance, then independently approve the actual final spec.
- Explicit authorization for P3 harness-validated isolated local test database
  resets (`localhost:5433/crossward_test`). DEVELOPMENT requires it because
  every E2E harness invocation deletes existing isolated test rows. Prior P2
  reset permission was scoped to P2. **No reset or browser run occurred.**

Observed specification checks, before runtime:

- `npx tsc --noEmit`: exit 0 (authors and browser final candidate).
- Targeted ESLint on all three new acceptance files: exit 0.
- `npx vitest run src/engine/play.test.ts src/app/puzzles/actions.play-completion.test.ts --reporter=dot`:
  exit 1, **64 fail / 3 pass of 67**, as expected for missing engine module,
  completion export, solved-write guards and idempotent solved save. Three
  existing auth/publication/malformed-input guards already pass. This is a red
  specification checkpoint, not a passing implementation gate.
- `npx playwright test e2e/play-completion.spec.ts --list`: exit 0,
  **17 P3 cases plus setup**; no server, DB or browser executed.
- `git diff --check`: exit 0 at the candidate checkpoint.
- `npm run verify` and full E2E have **not** run for P3. No claims from P2 below
  are current P3 gate evidence.

All 75 pre-existing acceptance-file hashes were captured before authoring in
`/private/tmp/crossward-p3-preexisting-acceptance-sha256.json`; compare again
before freeze/delivery. Existing acceptance is frozen and must remain intact.
P3 acceptance is still a candidate and may be completed during this spec phase.

Important implementation findings are recorded in the P3 story: preserve exact
P1/P2 view and save return contracts and partial action counts; inspect only
full saved grids at start; correctness, not timestamp, controls the lock;
actual solved server entries override stale local drafts; serialize full save
and inspection, keep local draft through verification failure; Retry must
handle already-saved solved entries; re-arm wrong feedback after erase/refill
even if debounce returns to the identical saved full snapshot. No schema or
migration is needed. No P4/P5, env/inbox, development/production data operation
is authorized by this P3 task.

## P2 completed checkpoint (2026-10-19)

**P2 is complete: implemented, verified, committed, independently reviewed and
merged in [PR #21](https://github.com/akiryk/crossward-raptor/pull/21).**

The independently reviewed runtime head is
`c2c964d73fc9356bd691d4ae5275286a78730fb6`. Normal merge completed on
2026-10-19 at 14:10:15 UTC as `a67ff61bacf23c9a1cb0ec37cf1004ff058c03fd`.
The reviewer confirmed unchanged head before merging and read back GitHub's
merged state; the parent independently read it back and fast-forwarded local
main to that merge. This documentation-only closeout follows. There are no
remaining P2 gates/blockers, and no runtime edits followed independent review.
The Play epic remains open for P3–P5; P3 is not authorized or started.

Specification-only main baseline `29a63aa` was independently reviewed, committed
and pushed before runtime edits. The user explicitly authorized the one-line
locator correction on 2026-10-19; it passed independent review of the proposal
and actual applied diff, then was committed/pushed alone on main in `4e53740`.
A clean temporary main worktree preserved the local runtime; it was removed
after fast-forwarding the corrected baseline into the implementation branch.

The runtime branch was `story/11-P2-typing-and-resuming`; current checkout is
main at the verified merge before this closeout. The runtime PR touched only
its nine declared runtime/fixture/docs paths. All 75 acceptance files match
corrected baseline `4e53740`; no acceptance change belonged to the runtime PR.
Hashes are in
`/private/tmp/crossward-p2-refrozen-acceptance-sha256.json`.

User decisions: open/reopen unselected with no cursor, and retain pending edits
in the same browser so immediate closing does not lose them, retrying server
saves on return without a close warning. Input uses the existing engine; saves
validate geometry and update only the authenticated pair's existing entries.
Session-scoped local recovery waits for successful authenticated start, clears
only an acknowledged matching snapshot, and reports storage/save failures.

Separate agents implemented and verified runtime. A third independently
reviewed specification/acceptance before freeze, the actual approved locator
correction, and the final actual PR diff/head, with no findings. That reviewer
repeated verify and the entire two-worker browser suite on the exact committed
head, confirmed all 75 acceptance hashes and a clean worktree, visually checked
focused/blurred screenshots, checked Vercel and Vercel Preview Comments were
successful, then merged normally. The parent authored no independent review.
No P3, schema/migration, environment-file inspection/edit, inbox operation,
development/production data change or migration was performed. Only validated
isolated test DB resets and synthetic test fixture operations were used.

### P2 verification at the final runtime checkpoint

- Independent `npm run verify`: exit 0, **467/467 tests in 30 files**, TypeScript
  and lint pass. Only the pre-existing request-logger/render.ts:802 unused
  variable warning remains. Focused P1+P2 server acceptance also passed 65/65.
  The independent final reviewer repeated this gate on `c2c964d`: exit 0,
  the same 467/467 in 30 files.
- **`npm run test:e2e -- --workers=2`: exit 0, 370/370 pass (1.2 minutes).**
  All cases run through the normal reset/build/server harness: no filters,
  skips, retries, timeout, source or permanent configuration changes. Includes
  all 27 P2, 18 P1, 7 A4 and explicit concurrent-open cases. This is a two-worker
  pass, not a default-concurrency plain pass. Independent review confirmed
  worker count is not frozen and the cap satisfies the full-suite gate.
  The independent final reviewer repeated it on `c2c964d`: exit 0, **370/370**
  (1.1 minutes). Thus the final runtime passed two consecutive complete suites
  with the same resource cap and separate validated isolated resets.
- Full diagnostic `npm run test:e2e -- --trace on`: exit 0, **370/370 pass**
  with default four workers (2.8 minutes). Traces retained at
  `/private/tmp/crossward-p2-full-pass-traces` and sanitized A4 timings at
  `/private/tmp/crossward-p2-full-pass-a4-trace-summary.json`.
- Temporary `node /private/tmp/crossward-p2-checkpoint.mjs`: exit 0 following
  narrow sandbox escalation for isolated DB access. Verified pending-successful-
  start input read-only, then accepted click selects/focuses without blur; full
  correct/incorrect grids remain editable without P3 dialog/timestamp; overtype
  and Backspace persist; complete puzzle/session metadata preserved. Only its
  two synthetic fixtures were created/cleaned; no reset/migration in the driver.
- Four screenshots visually inspected: current-cell/word outlines preserve
  white backgrounds; blur removes indicators; Saving/Saved status is legible.
  Files: `/private/tmp/crossward-p2-{unfocused,focused-saving,focused-saved,
  blurred-saved}.png`.
- Both configured PR checks passed on the reviewed head: Vercel deployment
  and Vercel Preview Comments. No CI/protection bypass was used.
- All 75 acceptance hashes match `4e53740`; `git diff --check` passes. The
  independent reviewer repeated these checks before/after merge.

### P2 verification history and diagnosed boundaries

The first ordinary full run was **368 pass / 2 fail**: all 343 prior cases
passed; new Retry acceptance had an unscoped alert locator, and editable
same-browser sign-in plumbing omitted Origin. The fixture fix preserves
forwarded-IP headers and derives trusted Origin from the isolated harness URL,
leaving application auth/CSRF untouched. Its path was declared before editing;
independent review found no issue. Five repeated same-browser isolation cases
plus setup passed after that repair.

The user-approved correction preserves the role/visibility assertion, scoped
to the existing player root so Next's hidden route announcer cannot collide:

```diff
-    await expect(page.getByRole('alert')).toBeVisible();
+    await expect(page.getByTestId('play-puzzle').getByRole('alert')).toBeVisible();
```

After refreeze, plain default-worker runs had **365 pass / 5 existing A4
navigation/auth-setup timeouts**, then **366 pass / 4 existing A6/modal wait
timeouts**. All P2/P1 cases passed in both. No renewal assertion failed in the
A4 run. Unchanged targeted A4 with tracing passed all 35 executions plus setup;
the later full traced run passed all 370. No application/test/timeout workaround
was made for these stalls.

Read-only host measurements during the plain failures: 8 CPUs, 8 GB RAM,
load averages 52–81, under 1% CPU idle, 156–169 MB unused memory, roughly 3 GB
compressed memory and active swap-ins. These establish resource pressure,
not a definitive cause for each timeout. Two workers reduced our test footprint
without closing user applications or changing the test contract; every case
then passed in 1.2 minutes. Preserve this distinction when reporting results.
Failure contexts and sanitized diagnostic traces remain under
`/private/tmp/crossward-p2-{refrozen-full-failures,plain-repeat-failures,
a4-repeat-traces}`. No tokens or fixture contents were published.

### P1 completed checkpoint

**P1 is complete: implemented, verified, independently reviewed and merged.**
[PR #20](https://github.com/akiryk/crossward-raptor/pull/20) merged normally on
2026-10-18 at `cea9ea05c81513fdd7aa86dc8fd0b76b85da4679`. The reviewed runtime
head is `0988b5287494604d1c321fb89500e654fa1f8471`; corrected frozen acceptance
is `6520aaf`. Local main was fast-forwarded to the merge before this
documentation-only closeout. No runtime changes followed independent review.
The original checkout was clean; no unrelated work was included. P2 was not
authorized at that completed P1 checkpoint; the authorization above supersedes
that boundary for P2 only. The Play epic remains open for P2–P5.

The user authorized implementation, then explicitly authorized the minimal
frozen-test await-order correction and isolated test-database resets. The
unit correction passed independent review and was refrozen in specification-only
commit `936422c`. The later user-authorized browser capture-only correction
passed separate independent review and was refrozen on main in `6520aaf`.
All acceptance is immutable from that corrected baseline onward.

Runtime adds the additive `PlaySession` migration, authenticated passive loader
and conflict-safe start, play route/client lifecycle, static numbered clues,
and fixed-geometry play rendering. Separate implementation and verification
agents worked on this story; a third agent reviewed the actual PR/head and
reported no findings. That reviewer independently reran verification, ordinary
full E2E and the synthetic migration proof on the exact reviewed head,
confirmed unchanged acceptance and a clean worktree, checked both Vercel and
Vercel Preview Comments were successful, then merged with a normal merge commit.
GitHub's merged state, head and merge commit were independently read back.

The migration was applied **only to the validated isolated test database** by
the authorized E2E harness. The synthetic migration proof preserves all
original seeded puzzle/auth columns and timestamps, verifies no backfill,
required identity/entries, defaults, pair uniqueness, foreign keys and both
cascades, retaining an unrelated puzzle/session. No historical migrations
were replayed for that proof. No development/production schema or data changes,
inbox operations, or environment-file inspections/edits were performed.

## P1 verification at the final runtime checkpoint

- `npm run verify`: **exit 0**, **427/427 tests**, 29 files; TypeScript and
  lint pass. One pre-existing unused-variable warning remains in
  `request-logger/render.ts:802`, no lint errors. The independent reviewer
  repeated this gate on `0988b52`: **exit 0**, same 427/29 counts.
- Ordinary `npm run test:e2e`: **exit 0**, **343/343 pass** (1.3 minutes),
  including all 18 P1 browser cases, existing auth/ownership and builder cases.
  The final run includes the independently reviewed fixture race repair.
  Independent review repeated ordinary full E2E on runtime commit `0988b52`:
  **exit 0, 343/343 pass** (1.7 minutes). Thus the final runtime passed two
  consecutive complete browser runs, with separate fresh isolated resets.
- `npm run test:e2e -- e2e/play-route.spec.ts --grep "answer strings" --repeat-each=5`:
  **exit 0**, five consecutive exact frozen redaction cases plus setup pass.
- `npm run test:e2e -- e2e/play-route.spec.ts --grep "HTTP GET and prefetch" --repeat-each=5`:
  **exit 0**, five consecutive prefetch cases plus setup pass.
- `node scripts/check-play-migration.mjs`: **exit 0**, all three preservation,
  constraint/default and cascade proof groups pass on synthetic schemas only.
  Independent review repeated the proof on `0988b52`: **exit 0**.
- Temporary browser checkpoint driver
  `node /private/tmp/crossward-p1-checkpoint.mjs`: **exit 0**. A deliberately
  aborted start showed the visible error and Retry without creating a session;
  Retry reached ready with one session. Cell clicks, letter typing,
  Backspace/Delete and all arrows left rendered grid, stored entries, session
  timestamps and puzzle fields unchanged. This is a P1 checkpoint, not a
  permanent assertion forbidding later P2 input. Both error/ready screenshots
  were visually inspected at `/private/tmp/crossward-p1-{error,ready}.png`.
- Temporary header probe: plain HTML, Purpose-only HTML, router-hint-only
  HTML and both hints all complete, while real RSC prefetch remains RSC.
  All return 200 and create no session. Corrected both-hint HTML completed
  in 10 ms versus a repeatable 3-second aborted probe before the fix.
- All 73 tracked acceptance files match `6520aaf`; the 71 pre-existing files
  also match `/private/tmp/crossward-p1-preexisting-acceptance-sha256.json`.
  Both author and independent reviewer refreshed this comparison before
  delivery; `git diff --check` passes. Both acceptance corrections were explicitly
  authorized and separately refrozen; neither belongs to the runtime PR diff.

## Next action

Resolve the two pending P3 replies above. Finalize and independently review the
pending-input/failure acceptance; compare the 75 original hashes, then freeze
only P3 specification/acceptance on main. Begin runtime on
`story/11-P3-finishing` only after that independent freeze. Continue through
verification, authorized E2E, PR and independent review/merge under repository
rules. P4/P5 require new authorization.

Resume prompt:

> Read AGENTS.md and docs/epics/11-play/HANDOFF.md beginning with Read first.
> P3 was authorized and its specification plus 28 engine/39 server/17 browser
> acceptance candidates are drafted but uncommitted/unfrozen. No runtime work
> started. Resolve pending full-grid input/failure behavior and explicit P3
> isolated test DB reset permission, complete/review dependent acceptance, then
> independently freeze the specification on main before implementation. Preserve
> all 75 pre-existing frozen acceptance files. P2 is complete and independently
> merged through PR #21. No P4, live migration/env/inbox operation is authorized.

## Implementation findings and resolved blockers

The original isolation assertion at unit line 342 constructed its expected
session before asynchronous authentication/creation finished. The user
approved the two-statement await-order correction; an independent agent
confirmed unchanged assertion and product scope before refreeze in `936422c`.
The earlier **426 pass / 1 fail** verification result is historical, superseded
by the successful gate above.

The first browser run found missing literal whitespace between clue spans;
that markup is corrected. It also found header-only HTML prefetch stalled.
A focused retained trace and header-variant probe reproduced the latter:
Next 16 reads the router-prefetch hint independently of RSC and omits the
page subtree, leaving the HTML response pending. Next's middleware adapter
normally strips Flight headers before invoking middleware and restores them
afterward, so header normalization alone was ineffective.

The declared `next.config.ts` flag `skipProxyUrlNormalize: true` exposes the
actual headers. The declared `src/middleware.ts` handler, after the unchanged
cookie guard, drops only the router-prefetch hint for HTML GETs to the play
route with no RSC header. It preserves real RSC prefetch and existing trusted
loader/start authentication. The app has no Pages Router data routes,
basePath or locales affected by the flag; full auth/ownership E2E remains
part of the gate. No auth redesign or timeout relaxation was introduced.

The initial full browser run had **329 pass / 14 fail** (the two P1 issues
and 12 existing library/auth navigation timeouts). After the clue correction,
a traced P1 run had **18 pass / 1 fail**, isolating header-only prefetch. A
later ordinary full run had **342 pass / 1 fail**, with all prior library/auth
navigation cases passing and only prefetch still blocked. The latest run above
includes the supported flag and resolves prefetch. An initial
verify/E2E overlap also hit an ESLint directory-scan race while E2E recreated
`test-results`; the successful verify was rerun with preparation serialized.

### Chromium response-capture blocker

Primary upstream evidence: Chromium issue
https://issues.chromium.org/issues/568852319 and merged change
https://chromium-review.googlesource.com/c/chromium/src/+/8508456 describe
fully read no-store fetch bodies reported to DevTools as canceled. Its fix
landed in Chromium 157.0.8090.0; the installed Playwright 1.62.1 browser is
151.0.7922.34. Independent read-only research confirmed even stable Playwright
1.64.1 and its current prerelease bundle Chromium 156 without the fix; no
dependency update or permanent machine-specific Chrome channel was made.

Temporary probes reached ready/persisted sessions while CDP body reads failed
in all 12 direct visits; a separate Chrome 155 probe reproduced it. Native
response-clone reads completed, and uncompressed responses still sometimes
failed in CDP, ruling out a justified compression/runtime workaround.

Before application, the proposed upstream-body capture passed **12/12 browser visits**, asserting
nonempty original HTML and action bodies, absence of a unique solution sentinel
in both bodies and client HTML, and successful ready state. One of those
visits still failed the parallel diagnostic CDP read, demonstrating why the
upstream capture is needed. These temporary probes changed no acceptance or
application files. A third reviewer approved the precise capture proposal;
the user then explicitly authorized it. The actual frozen-test diff passed
independent review and was committed separately on main in `6520aaf`.
All original assertions remain unchanged.

The subsequent full gate passed every P1 case but exposed a shared-user
fixture race: an upsert targeting email could lose on the fixed primary key
when several public tests first seeded together. The declared editable
`e2e/helpers/ownership.ts` fix uses `createMany(skipDuplicates)` then the
original update-by-email, preserving fields and identity. Independent review
found no blockers; no frozen acceptance changed for this fixture repair. The subsequent ordinary full run passed all 343 cases.

## Specification history

The P1 specification and **25 unit/18 browser cases** were independently
reviewed and frozen in `b6f357a`. Before implementation, all 25 unit cases
failed for the missing action exports and TypeScript had exactly two expected
missing-export errors. Existing **71** acceptance files matched
`/private/tmp/crossward-p1-preexisting-acceptance-sha256.json`. Browser listing
succeeded without executing setup, server or database work. No reset was
authorized or performed during specification.

The user confirmed browser opening counts as started even if empty (GET and
prefetch do not), static numbered Across/Down clues belong in P1, and puzzle
deletion cascades to sessions. Route/auth/access, player isolation, numbering
and answer redaction are frozen in the story. Unpublish/edit/republish lifecycle
remains explicitly deferred. Ownership is closed and is prerequisite history,
not work to replay.

Separate agents inspected renderer/engine and persistence/auth, then authored
acceptance. A third agent statically reviewed the specification and acceptance
before freeze, with no blockers reported then. That review strengthened actual
database uniqueness, response redaction, visible headings, black-cell paint,
both cascade relations and database-error propagation. The await-order defect
above was discovered only when implementation made runtime execution possible.

## Inspection history

The initial 2026-10-13 handoff identified the numbering hazard: `PuzzleGrid`
converts empty cells to black before numbering. Current inspection confirmed
engine numbering ignores letters and `clearLetters` preserves geometry. Play
can number entries geometry directly without sending answers. Existing builder
conversion semantics must remain intact. `HintsPanel` exposes answers even
when disabled, so play needs static clues. Existing cursor functions need
wiring in P2, not a new engine implementation in P1.

## Historical P3 completion handoff (archived during P4 drafting, 2026-10-19)

This is the prior operational handoff, retained for its unique verification and
permission provenance. Its P4/P5 authorization statements describe that earlier
state; the current handoff governs the P4 drafting phase.

# Play — Handoff

## Read first

1. This handoff's Current state and Next action; use AGENTS if not supplied.
2. [EPIC](EPIC.md)'s P4 section, for writing the P4 specification. P3 needs
   no further implementation or review.

**Only if needed:** [P3 specification](stories/11-P3-finishing.md) for a specific
regression; [STORY](../../process/STORY.md) for the applicable lifecycle;
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) before browser preparation.
[History](HISTORY.md) retains older evidence; do not load it for routine startup.

## Current state (2026-10-19)

**P1, P2 and P3 are complete.** P3 was independently reviewed and merged in
[PR #22](https://github.com/akiryk/crossward-raptor/pull/22). Reviewed head:
**`3e0a4d5`**; normal merge commit **`4cfa4d7`** at 2026-10-19 21:26:43 UTC.
Reviewer and root both read back the MERGED state. Main was fast-forwarded to
that merge; this documentation-only completion record follows it. No runtime,
verification, review or merge work remains for P3. The epic remains open for
P4/P5, neither of which is authorized.

Root authored the pure comparison engine and authenticated completion/save
guards; `p3_ui` authored the client save/check/recovery, dialogs, locking and
CSS confetti. Independent reviewer `p3_spec_review` found no remaining
runtime/scope/documentation findings, confirmed exact-content evidence and
configured CI, then merged the unchanged reviewed head normally.

Initial human-approved specification/acceptance freeze: **`d1570e0`**. The
initial browser run passed 391 cases and failed two recovery cases because
new pages inherited a paused context clock without advancing the specified
500 ms debounce. Runtime was preserved. The user explicitly approved the
independently reviewed one-line `await returned.clock.runFor(500);` correction;
test-only main commit **`dbc3ee8`** refroze it before merging into P3. All
**78 acceptance files** match that corrected baseline; every other test remains
unchanged from the original freeze. No assertions/timeouts were weakened.

**Standing authorization:** the user's guarded local test-reset grant is
recorded in DEVELOPMENT, AGENTS and STORY, delivered on main in **`976a037`**.
Reuse it for necessary harness runs across sessions/stories without asking
again. Only validated `localhost`/`127.0.0.1`, port `5433`, database
`crossward_test` is covered. No env-file access, ad hoc deletion, development /
production database, inbox, P4 or P5 work is authorized.

## Verification

Separate verifier **`p3_verification`** observed after refreeze:

- **`npm run verify` exit 0:** 32 files / **534 tests**; TypeScript clean, with
  only the pre-existing `request-logger/render.ts:802` lint warning.
- **`npm run test:e2e -- --workers=2` exit 0: 393/393**, including both corrected
  recovery cases. Suites were serialized; no retries/assertions/timeouts changed.
- Visual/focus/reduced-motion demonstration **passed** on identical runtime:
  both dialogs, Tab/Shift+Tab/Escape/focus restoration, completed mark/grid /
  message, confetti pointer/ARIA/cleanup, reduced motion and silent locked
  reopen. Four screenshots were visually inspected in
  `/private/tmp/crossward-p3-visual/`.
- Disposable no-DB lost-acknowledgement recovery probe passed; all 78 frozen
  files match `dbc3ee8`. The six runtime hashes and 206-file source/config/test
  manifest match the final reviewed/merged content. Later edits are status,
  permission and evidence documentation only.

Reviewer confirmed Vercel and Preview Comments both passed on `3e0a4d5` before
merge. Retained command provenance, exits, tool output IDs and exact-content
bindings are in `/private/tmp/crossward-p3-verification-provenance.md`,
`/private/tmp/crossward-p3-verification-runtime.json` and
`/private/tmp/crossward-p3-verified-source-sha256.json`. Verify session `62416`,
completion `615a2a`; browser `38802` / `1c7139`; visual `35055` / `cd79e9`.
The 206-file content digest is
`d977d4bbff6ffca03f9a752daa46c19a9fd73f6391e348218e7636496ed0c857`.

## Next action

Write the P4 (Reset) story specification and its proposed acceptance tests,
per STORY's drafting phase. Work on main and commit nothing until the user
approves and freezes them. P5 and epic closeout follow P4.

## Resume prompt

Read docs/epics/11-play/HANDOFF.md and docs/epics/11-play/EPIC.md (P4 — Reset). Write the P4 story specification and its proposed acceptance tests on main; don't commit until I approve and freeze them.

## Historical P5-freeze handoff (archived at P5 implementation, 2026-10-20)

Preserved verbatim from `HANDOFF.md` at `affa322`; historical, not current instructions.

### Current state (2026-10-20)

**P1–P4 are complete.** P4 was independently reviewed (separate session from
its author) and merged in
[PR #23](https://github.com/akiryk/crossward-raptor/pull/23). Reviewed head
**`c73cde7`** (implementation `5e62dc4` plus a handoff-only commit); normal
merge commit **`740d569`** at 2026-10-20 14:30 UTC, read back as MERGED.
This documentation-only closeout follows it on `main`. Frozen acceptance
(`src/app/puzzles/actions.play-reset.test.ts`,
`e2e/play-reset.spec.ts`) is byte-identical to baseline `14bb217`.

The review found no blockers. Non-blocking note: when a reset returns a full
(stale-ID) attempt, `confirmReset` closes the dialog before `beginSession`
finishes its completion inspection; keystrokes in that brief window are
dropped, since no save workflow is bound. This doesn't affect the ordinary
blank-reset path.

Known accepted limit (human decision): saves are keyed by user and puzzle,
so an old open tab can save into the fresh attempt. The library reset control
is deferred to P5.

**P5 is approved and frozen (2026-10-20).** On `main`: the [P5 story](stories/11-P5-library-play.md) and frozen
acceptance, namely `src/app/puzzles/actions.library-play.test.ts` (13),
`src/lib/puzzle-groups.play.test.ts` (6) and `e2e/library-play.spec.ts` (18).
The human approved every drafter recommendation, plus a clickable row (a
stretched primary link: Play when published, Edit when a draft) and an
interim **Manage** link on own published rows until a later "⋯" menu story.

P5 also needs a **correction to frozen O3 acceptance**
(`e2e/builder-edits.spec.ts` and the
[O3 story](../10-ownership/stories/10-O3-builder-edits.md)). Another
builder's published rows may now offer Play and Reset, but never an editor
link; their drafts keep no controls. The human approved it on 2026-10-20. A
separate read-only reviewer agent then reviewed it independently: APPROVE.
Its nits and its P5 test findings were applied: scroll-in and real pointer
clicks for the stretched-link test, the caller-filter enforced at the query
mock, a discriminating stale-ID refresh, Manage hover/cursor, and the dialog
copy contract.

Runtime is not authorized. The standing guarded local test-reset grant in
[DEVELOPMENT](../../DEVELOPMENT.md#e2e-environment) still applies to necessary
harness runs; nothing else is authorized.

Draft checks (author):
- `tsc --noEmit` and eslint on the changed tests exit 0.
- The new unit tests on unchanged runtime: 14 fail on missing behavior and
  5 guards pass.
- A throwaway `listPuzzles`/`groupPuzzles` prototype, reverted and never
  committed, passed all 35 files / 579 unit tests, frozen ones included. That
  run predates the caller-filter tightening, which the prototype met.
- An E2E red run on unchanged runtime under the standing grant: 18/18 P5
  cases fail at P5 assertions. Every corrected `builder-edits.spec.ts` case
  passes.
- The P5 browser spec has not passed against any implementation.

### Verification

Reviewer-observed on `c73cde7` (code identical to `5e62dc4`):
`npm run verify` exit 0, 33 files / 560 tests (only the pre-existing
`request-logger/render.ts:802` lint warning); full
`npm run test:e2e -- --workers=2` exit 0, **417 passed**, under the standing
grant. Configured CI (Vercel deployment and Preview Comments; deploy only, no
test gates) passed on that head before merge.

The author separately reported the same verify result, focused P4 E2E 25/25,
and a visual check of the builder shortcut, options disclosure, confirmation,
pending, error, completed-to-blank reset and non-builder view (throwaway
script, not committed). The reviewer did not repeat the visual check.
