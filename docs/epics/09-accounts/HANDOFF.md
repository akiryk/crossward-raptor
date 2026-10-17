# Accounts — Handoff

## Read first — A6 delivered; Accounts closeout audit pending

1. `AGENTS.md`, this current-state section, and Accounts `EPIC.md` Decisions/A6.
2. [A6 story](stories/09-A6-local-inbox-login.md), `src/lib/email.ts`, `src/components/auth/SignInForm.tsx`, `src/components/ui/Button.tsx`, and its `src/lib/email.test.ts` / `e2e/manual-login.spec.ts` contracts.
3. `README.md` and `docs/DEVELOPMENT.md` for ordinary port-3000 sign-in through the separate Mailpit inbox; `docker-compose.yml` and `package.json` define startup/persistence.
4. For delivery review, `docs/CODE-REVIEW.md`, `docs/process/REVIEW.md`, and `docs/LEARNINGS.md`. Do not inspect or edit `.env*` files.

## Current state — A6 delivered (2026-10-16)

A1–A6 are delivered. [PR #16](https://github.com/akiryk/crossward-raptor/pull/16) was independently reviewed with no findings and normally merged as `a07d77139f0ba173c88b91804eff947e3075077e` at `2026-10-17T03:46:03Z` (October 16 locally). Reviewed implementation head: `279dda6cf668bbaf47c37590447ae31b3fa34b35`; specification baseline: `fe4a78a`; authorized selector correction: `7bf12e3`. Local `main` has been fast-forwarded to the merge; this documentation-only followup records delivery. Accounts remains **open pending its independent closeout audit**. Do not begin Ownership or restart hydration investigation.

The implementation captures local-development mail through the fixed loopback Mailpit HTTP API, overrides ambient Resend keys, and preserves production Resend/keyless behavior and A5 test isolation. The unfinished native-form/Button keyboard edits are adopted in A6; original intake copies remain at `/private/tmp/crossward-a6-intake/`. Sign-in adds accessible retry errors, thrown-request pending cleanup, and duplicate-submission protection. Mailpit uses pinned `v1.31.6`, a development-only profile, loopback-only HTTP publication, and its own persistent volume with automatic message deletion disabled. `npm run dev` starts/waits for it; ordinary production E2E remains email-free.

### Frozen-test exception and prior failure

The previous independent E2E run passed 306/307; its sole failure was a global alert locator also matching Next's normal empty route announcer. The user explicitly authorized **only scoping the three A6 retry-test alert assertions to the sign-in form, preserving every behavior assertion**. That exact three-selector correction is committed separately as `7bf12e3`. There is no application workaround. The email acceptance file and every other acceptance test/harness setting remain unchanged from baseline. Earlier evidence is retained at `/private/tmp/crossward-a6-independent-verification.md` and `/private/tmp/crossward-a6-verified-tree-sha256.json` as historical failed-gate evidence.

### Current independent verification

A separate verification agent, with no source/test edits, observed:

- `npm run verify`: exit 0, **25 files / 328 tests**; only the existing `request-logger/render.ts:802` unused `reqJson` lint warning.
- Ordinary `npm run test:e2e`: exit 0, **307/307 in 52.8 seconds**, standard four workers and fresh production build. It used the unchanged A5 email-free harness and authorized isolated `localhost:5433/crossward_test` reset. This includes all three submission/session/library cases and the corrected retry case.
- Separate real development walkthrough after E2E: start Mailpit with `npm run inbox:up`; launch `node /private/tmp/crossward-a6-dev-server.mjs`, which spawns `npm run dev -- -p 3100` using the validated `e2eEnvironment` with `NODE_ENV=development`, explicit local auth origin, empty `RESEND_API_KEY`/`VERCEL`, and isolated test database. No `.env*` file was inspected or edited. Rendered Compose settings confirmed loopback-only HTTP, no SMTP host port, no relay/forwarding, persistent storage, and no automatic message pruning.
- Real **Mailpit UI → delivered message link → same-context authentication** passed: unique `.test` recipient, exactly one matching message, correct app origin, requested session email, `/puzzles` and Sign out, New Puzzle open/cancel without writes (224 library rows unchanged), signed-in `/` redirect, and UI sign-out. Links came from the delivered message DOM, never an auth-database token query.
- Stopping only Mailpit caused a real auth HTTP 500 with a readable form alert, retained email, enabled retry, and no false sent state. Restart/retry delivered exactly one matching message in the real inbox UI; its link authenticated the requested identity into a usable library. Earlier messages survived stop/restart.
- Supplemental delayed-request control disabled both inputs and rejected duplicate native submissions with one request; aborted-request control released pending state and permitted retry.
- Temporary verifier probes needed readiness-locator corrections; these were probe-only changes, with no application or acceptance edits and no claimed hydration fix. All required walkthrough milestones subsequently passed.
- Cleanup closed the task browser/dev process; no Crossward listener remained on 3000/3100. Mailpit remained healthy with all four walkthrough messages preserved. The unrelated budget-app process, development database, and both existing database volumes were untouched. Docker/browser sandbox escalations were approved; they did not authorize data deletion.

Final evidence: `/private/tmp/crossward-a6-final-verification.md`; exact tested runtime/config/test manifest: `/private/tmp/crossward-a6-final-verified-tree-sha256.json`. Temporary artifacts may not survive cleanup. Browser/build checks were serialized. The independent final reviewer compared all **185 committed runtime/config/test blobs** with zero manifest mismatches and all **42 frozen acceptance spec/setup/email files** against baseline, confirming only the three authorized selector scopes differ. Both configured checks, Vercel deployment and Vercel Preview Comments, passed. The reviewer rechecked the unchanged head and used a normal merge with `--match-head-commit`; PR state was confirmed MERGED. No additional source/test changes or browser/build runs occurred during review.

The agent's real-inbox walkthrough is complete. **On 2026-10-17 the user confirmed that the local sign-in worked and they successfully created a new puzzle.** This is user-reported confirmation, separate from the agent's isolated walkthrough. Real Resend/domain delivery remains unverified. Ordinary user steps are documented in `README.md` / `docs/DEVELOPMENT.md`: run `npm run dev`, open `http://localhost:3000`, submit a `.test` address, open `http://127.0.0.1:8025` in the same browser, and follow the delivered link. This uses the normal development database; no token lookup is needed.

## Next action — independent Accounts closeout audit (pending)

A6 verification, real-inbox walkthrough, PR delivery, and independent merge are complete. The next separate task is the independent Accounts closeout audit; it must account for the earlier renewal finding's A4 resolution and the actual A6 manual-login evidence. Keep Accounts open until that audit is recorded and its blockers resolved. The user has now confirmed successful local sign-in and puzzle creation; include that confirmation in the closeout audit alongside the agent evidence. No Ownership or hydration work is authorized by this checkpoint.

Copyable resume prompt:

> Read AGENTS.md and the top A6 sections of docs/epics/09-accounts/HANDOFF.md. A6 merged independently in PR #16 as a07d771 after verify, production E2E, and the real Mailpit UI delivered-link/retry walkthrough passed. The next separate task is an independent Accounts closeout audit, including A4 renewal resolution and A6 evidence; Accounts remains open until it is recorded. Preserve A5 isolation, existing data/messages, and frozen acceptance content except the three authorized selector scopes in 7bf12e3. On 2026-10-17 the user confirmed successful local sign-in and new-puzzle creation. Do not begin Ownership or restart hydration work.

---

## Read first — A6 specification ready for a fresh implementation session

1. `AGENTS.md`, then **Current state — A6 specification** and **Next action — implement A6 in a fresh session** below.
2. [A6 story](stories/09-A6-local-inbox-login.md), `src/lib/email.test.ts`, `e2e/manual-login.spec.ts`, and editable helper `e2e/helpers/sign-in-ui.ts`: the story, frozen acceptance contracts, required real-inbox walkthrough, and exact session boundary.
3. Accounts epic Decisions/A6, `docs/DEVELOPMENT.md`, `README.md`, `src/lib/email.ts`, `src/components/auth/SignInForm.tsx`, `src/components/ui/Button.tsx`, `docker-compose.yml`, and `package.json` for actual delivery/startup and preserved keyboard work. Inspect no `.env*` files.
4. For testing/delivery: `docs/process/STORY.md`, `docs/CODE-REVIEW.md`, `docs/process/REVIEW.md`, `docs/LEARNINGS.md`, `scripts/e2e-env.mjs`, and `playwright.config.ts`. The ordinary browser suite stays production-build and email-free.

## Current state — A6 specification (2026-10-16)

A1–A5 are delivered; A4's final state/evidence are preserved below. The user asked about preparing the story/specs here and using a fresh session to orchestrate implementation/testing. This session created **A6 specifications and test plumbing only**. No A6 application, inbox service, package-script, configuration, or dependency implementation has begun.

The specification uses a separate **Mailpit inbox**, loopback-only, started as part of local development, to provide the user's chosen local-inbox experience. Local capture uses Mailpit's documented HTTP API, overrides ambient real-email keys in development, and remains disabled in tests/production/hosted execution. Production Resend behavior is preserved. Any change to the story's delivery choice must be settled before implementation rather than silently changing frozen tests.

New acceptance files:

- `src/lib/email.test.ts`: nine frozen transport-selection/delivery-isolation examples, mocking network/provider boundaries only.
- `e2e/manual-login.spec.ts`: four frozen UI examples covering three submission methods, exactly one request, real session identity/usable library, and retryable delivery failure. These explicitly do not prove inbox delivery.
- `e2e/helpers/sign-in-ui.ts`: editable starting plumbing for readiness and independent simulated visitor IPs; no app behavior is mocked there.

A6 also requires a real Mailpit UI → delivered link → authenticated usable library walkthrough, with a stopped-inbox error/retry control. This is mandatory and separate from automated database-token sign-in. The next session must give the user ordinary local instructions and distinguish agent walkthrough from the user's own confirmed sign-in.

Specification validation, before implementation:

- `npx tsc --noEmit`: exit 0.
- `npx eslint src/lib/email.test.ts e2e/manual-login.spec.ts e2e/helpers/sign-in-ui.ts`: exit 0.
- `npx playwright test e2e/manual-login.spec.ts --list`: exit 0, discovers four A6 cases plus the existing setup dependency; no browser/server/database preparation ran.
- `npx vitest run src/lib/email.test.ts`: **exit 1, 5 failed / 4 passed**, as expected on the unimplemented delivery function. Failures cover missing local capture, capture failure propagation, and test-mode delivery isolation. All transport calls were mocked; no real email, inbox contact, or database operations occurred.
- Full `npm run verify`, full E2E, real-inbox walkthrough, independent specification review, and A6 implementation review were **not run** in this specification session. The new baseline intentionally fails its unimplemented unit criteria; no current green A6 release gate is claimed.

Existing `SignInForm.tsx`/`Button.tsx` keyboard changes remain byte-for-byte unchanged and uncommitted, excluded from the spec-only baseline. Existing acceptance files remain unchanged. Freeze the two new acceptance files at the specification commit; the next implementer must not edit them. A6 requires a PR and independent final review/merge despite its otherwise low blast radius.

## Next action — implement A6 in a fresh session

Read the story and committed acceptance baseline, inspect/preserve the two unfinished keyboard source files, and use separate implementation and verification agents. Run the required automated gates and real-inbox walkthrough sequentially, then obtain independent final PR review/merge. Do not try to make the production E2E server deliver to the local inbox. No existing development database or inbox-message deletion is authorized by A6 startup/checks; isolated E2E reset authorization remains recorded in the A5/A4 history.

This session stops after specification delivery. Keep Accounts open until A6's actual manual-login status and the eventual independent closeout audit are accounted for. Do not start Ownership or restart hydration instrumentation.

Copyable next-session prompt:

> Use the story skill to implement docs/epics/09-accounts/stories/09-A6-local-inbox-login.md. First read AGENTS.md and the A6 sections at the top of docs/epics/09-accounts/HANDOFF.md. The specification-only baseline is committed; preserve its frozen unit/browser tests and the unfinished SignInForm/Button keyboard work. Orchestrate separate implementation and verification agents and independent final PR review/merge. Complete both ordinary automated gates and the real local-inbox walkthrough; do not substitute database-token login for inbox evidence. Preserve A5 production-test isolation and all existing data. Keep Accounts open pending its closeout audit, and do not begin Ownership.

---

## Read first — A4 delivered; manual login next

1. `AGENTS.md`, then **Current state — A4 delivered** and **Next action — manual-login specification** below. These supersede the older A4 pause, usage-limit, and A5 next-action instructions.
2. `docs/epics/09-accounts/EPIC.md` Decisions and its separate manual-login follow-up, plus `docs/DEVELOPMENT.md`, `README.md` authentication setup, `src/components/auth/SignInForm.tsx`, `src/components/ui/Button.tsx`, and `src/lib/email.ts` to scope local inbox delivery. Do not inspect or edit `.env*`.
3. Only to recheck renewal: [A4 specification](stories/09-A4-session-renewal.md), `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/components/auth/SessionRenewal.tsx`, `src/components/layout/Header.tsx`, and the frozen renewal/validation/protection specs. Do not begin Ownership or restart hydration instrumentation.

## Current state — A4 delivered (2026-10-16)

A1–A5 are delivered. A4's existing implementation was finalized without source changes in an isolated checkout that excluded the unfinished sign-in keyboard edits. [PR #15](https://github.com/akiryk/crossward-raptor/pull/15) was independently reviewed with no findings and normally merged as `3c95e91a088619f9343820d82d0de29a9ade8d8c` at `2026-10-17T01:00:48Z` (October 16 locally). Reviewed implementation head: `eb0ec19da072d420f91244dff94dc8fb73c966bb`. Both Vercel and Vercel Preview Comments passed before merge. Main has been fast-forwarded to that merge; this delivery record is a documentation follow-up.

A4 defers renewal during server reads and performs database/cookie renewal through the browser's cookie-capable Better Auth GET/POST flow. Entry, tab return/reconnect, navigation, and throttled visible input permit renewal; no idle polling was added. The original Accounts renewal audit finding was independently rechecked and resolved. No schema, engine, dependency, ownership, or frozen acceptance-test changes were made.

Independent verification of the scoped A4 implementation:

- `npm run verify`: exit 0, **24 files / 319 tests**; only the existing `request-logger/render.ts:802` lint warning.
- `env COMPOSE_PROJECT_NAME=crossward-raptor npm run test:e2e`: exit 0, **303/303 in 59.0 seconds**, with the normal four workers, fresh production build, all seven frozen A4 cases, and existing invalid/expired/revoked-session/sign-out guards. The explicit Compose identity reused canonical containers from the temporary worktree; browser settings and assertions stayed frozen.
- Seven supplemental checks passed: eligible server/auth GET reads preserve expiry; two simulated browser minutes idle cause no reads/renewal; hidden input causes no reads; a visible-tab event drives GET/POST and renews both expiries; repeated input is throttled; expired/revoked refresh POSTs cannot revive sessions. Visibility was a synthetic document event, not real headful tab switching; idle time used the browser clock.
- Independent final review matched all **183 committed runtime/config/test blobs** to the tested manifest and all **40 frozen browser specs/setup files** to baseline `5140c2d`, with zero mismatches. The earlier exact-spec red run remains recorded under **A4 renewal evidence**: five ordinary-activity failures on old code, with protocol/fresh-session controls passing.
- Evidence: `/private/tmp/crossward-a4-independent-verification.md` (independently endorsed), `/private/tmp/crossward-a4-verified-tree-sha256.json`, `/private/tmp/crossward-a4-supplement-results.json`, and exact supplemental probe `/private/tmp/crossward-a4-supplement.cjs`. These local temporary artifacts may not survive cleanup.

The first worktree-default Compose attempt stopped before tests/reset because a second project collided with port 5433; a sandbox-limited retry also stopped before tests/reset. The successful run used the canonical isolated test database with the user's existing reset authorization. Only newly created, never-started containers and their empty task network were removed afterward; all volumes and canonical healthy database containers were preserved. Port 3100 has no listener. Dependency integrity checks confirmed the historical React DOM hash refers to Next's bundled source, which matches; the separately installed package also matched its integrity-addressed cache. No instrumentation remains.

Both independent agents briefly stopped at an account usage limit after the checks. Their resumed turns completed evidence endorsement, exact-head final review, CI checks, and merge; that limit no longer blocks A4.

Preserved local work: `src/components/auth/SignInForm.tsx` and `src/components/ui/Button.tsx` still contain the uncommitted Enter-key/native-form fix, byte-for-byte unchanged from intake. They were excluded from A4 verification/delivery. The original A4 files and entire pre-existing handoff body are preserved in the merged implementation/history and in `/private/tmp/crossward-a4-original-preserved/`; a safety stash named `Preserve original A4 work before updating to independently merged PR 15` also remains. Do not reapply its old handoff over this newer record.

### Settled manual-login direction

The user chose a **local inbox for local development**, with real email delivery checked separately before inviting other users. This follow-up needs its own story and acceptance examples for request-link → local-inbox → signed-in-library behavior. Preserve the keyboard fix for that story. Automated database-token retrieval is not evidence of usable manual login; real email and successful manual sign-in remain unverified.

Accounts remains **open** for usable manual login and its eventual independent closeout audit. A4's targeted finding recheck is not a full Accounts closeout audit. Streamed development library rendering can still stall, and the library still renders every puzzle/cell thumbnail without bounds; production E2E success does not establish a fix for either concern.

## Next action — manual-login specification

Discuss and specify the separate local-inbox manual-login story before implementation, including how a developer finds and opens the link, configuration isolation from tests/production, and a person's successful arrival at `/puzzles`. A4 is complete; no more A4 investigation or delivery is pending. Keep Accounts open and do not begin Ownership or local-inbox implementation automatically.

Copyable resume prompt:

> Read AGENTS.md and the current A4-delivered sections at the top of docs/epics/09-accounts/HANDOFF.md. A4 merged in PR #15; preserve the unfinished keyboard fix. Help specify the separate manual-login story using the user's chosen local inbox for development. Keep Accounts open; do not begin Ownership or restart hydration instrumentation.

---

## Read first — production-build E2E story A5

1. `AGENTS.md`, then **Current state — A5** and **Next action — A5** below.
   These supersede older investigation and manual-testing instructions.
2. [A5 specification](stories/09-A5-production-build-e2e.md),
   `playwright.config.ts`, `scripts/e2e-env.mjs`, `scripts/prepare-e2e.mjs`,
   `scripts/e2e-server.mjs`, and `docs/DEVELOPMENT.md` for the harness boundary.
3. Only when separately resuming A4: the epic Decisions and
   [A4 story](stories/09-A4-session-renewal.md). Preserve its unfinished work.
   Manual login is a separate follow-up; do not begin Ownership.

## Current state — A5 (2026-10-16)

The user authorized A5 and explicitly approved isolated test-data resets.
Specification baseline: `22a301b`, clarified by `b2fdc91`. Initial implementation
`e7391cb` is pushed in [PR #14](https://github.com/akiryk/crossward-raptor/pull/14).
Its first Vercel preview lacked a generated Prisma client and failed
TypeScript; the build prerequisite fix is committed as `56113b2`. Independent
review found no issues, confirmed the final tested-file manifest, and merged
PR #14 normally after both Vercel checks passed. Merge:
`7b3e2ec034c50d692753b7f2308061ffbab6e95e` (2026-10-16).
The checkout is back on `main` with that merge. A5 is delivered. A4/application
and earlier handoff edits remain local and excluded from A5 delivery.

The harness generates Prisma Client explicitly before preparation imports it
and before compiling through the ordinary `npm run build` path. It serves the
fresh production build on port 3100 with shared validated local database/auth
settings and email forcibly disabled. Production auth limits remain enabled;
editable auth plumbing gives independent visitors stable distinct IPs. Browser
settings/assertions stay frozen. Launcher process groups and Playwright's
shutdown grace cover npm's shell/build descendants. No schema/dependency,
application/session-policy, or engine changes were made.

Final independent verification of the revised harness:

- Two consecutive ordinary full `npm run test:e2e` runs exited 0, with the
  normal four workers: **303/303 in 2.0 minutes**, then **303/303 in 1.2 minutes**.
  No library navigation timeouts or production rate-limit failures occurred.
  Logs: `/private/tmp/crossward-a5-e2e-full-3.log` and `-full-4.log`.
- Final `npm run verify` exited 0: 24 files / 319 tests; only the existing
  request-logger lint warning. Log: `/private/tmp/crossward-a5-final-verify-2.log`.
- Configuration checks rejected unsafe targets, canonicalized effective-safe
  targets, round-tripped percent-escaped credentials, and overrode hostile
  inherited database/auth/email settings. The first credential-normalization
  bug was fixed before the original full runs.
- Failure/signal controls passed, including a real npm leader exiting while a
  descendant ignored SIGTERM: the launcher force-stopped it after 10,074 ms
  without starting the server. Both full runs left no launcher/server process
  and no listener on port 3100.
- Final 170-file manifest:
  `/private/tmp/crossward-a5-verified-tree-sha256-final.json`. All 40 frozen
  E2E spec/setup files and six unfinished A4/keyboard source files retain
  their hashes. The original pre-existing handoff body and A4 story edits
  are intact. Six source files are tested combined-checkout context only,
  excluded from A5 delivery; this is not a clean scoped-commit application pass.
- Evidence summary: `/private/tmp/crossward-a5-independent-verification.md`.
  Earlier logs `-full-1.log` / `-full-2.log` and the original manifest preserve
  the passing local pair before the fresh-install generation fix; the final
  pair above supersedes them for the revised harness.

The independent reviewer found no code or handoff issues and checked exact
head `56113b230a8a5b853d104adf88666f6f586fa404` immediately before merge.
All 164 non-A4 runtime/configuration/test manifest blobs matched that commit;
Vercel and Preview Comments both passed. The earlier failed CI head was fixed,
not waived. Docker Desktop needed starting before
the first actual suite. Only the isolated test database was reset, with explicit
user authorization; all browser suites ran sequentially. Docker remains up.

Unresolved: streamed development library rendering can stall, and the library
renders every puzzle and cell thumbnail without bounds. Production E2E passes
do not establish a fix for those concerns. Manual login and real email delivery
remain unverified and need their separate follow-up story. Accounts stays open;
A4 stays undelivered. The old temporary bounded comparison artifact is missing;
do not restart the hydration instrumentation investigation to recreate it.

## Next action — A5

A5 is complete. Wait for the user's next story instruction: unfinished A4
still needs its scoped delivery/review and Accounts closeout audit; usable
manual login needs a separate specification. Preserve all unfinished work.
Do not begin Ownership, deliver A4, or restart hydration investigation as part
of A5. The historical handoff changes remain uncommitted by design.

Copyable resume prompt:

> Read AGENTS.md and the A5 sections at the top of
> docs/epics/09-accounts/HANDOFF.md. A5 is delivered. Preserve frozen tests and
> unfinished A4. Help scope the next authorized Accounts story, keeping manual
> login separate; do not begin Ownership or restart the hydration investigation.

---

## Read first — bounded library investigation completed

1. `AGENTS.md`, then **Current state — bounded investigation** and **Next
   action — discuss a focused testing story** below. These supersede the older
   pause/manual-testing instructions preserved farther down.
2. `playwright.config.ts`, `docs/DEVELOPMENT.md`, `src/app/puzzles/page.tsx`,
   and `src/app/puzzles/actions.ts` for the actual server/test arrangement and
   unbounded library rendering. Do not inspect or edit `.env*`.
3. Only when resuming implementation: the Accounts epic Decisions and A4 story.
   Preserve the existing uncommitted implementation and frozen acceptance tests.

## Current state — bounded investigation (2026-10-16)

The user authorized a bounded investigation and deferred manual testing. They
also explicitly want a usable manual login addressed in a future user story;
that story has not been specified or implemented. No feature development,
delivery, or Ownership work resumed in this investigation.

Investigation started at 20:46:41 UTC with a 30-minute ceiling; browser
experiments ended by 20:59:55 UTC. The unchanged application can reproduce the
library timeout outside the acceptance-test runner, without puzzle writes.
Evidence points toward a timing-sensitive streamed development hydration
problem; it does **not** establish its exact mechanism or a fundamental
architecture failure.

All comparisons used the existing isolated database at `localhost:5433`,
containing 192 puzzles / 7,136 grid cells. No database reset or puzzle deletion
ran. Fresh real magic-link sessions were established through API requests and
database token retrieval, without email; this does not verify manual login.
The diagnostic launcher used public Docker database settings, an ephemeral
auth secret for the final dev/production comparisons, and explicitly disabled
email. No environment-file contents were displayed or edited.

| Server and response | Browser arrangement | Observed result |
| --- | --- | --- |
| Development, streamed | Four separate browser processes | First round: 4/4 ready in 8.51–8.76 seconds; all opened/cancelled New Puzzle. Next run: 4/4 navigation timeouts at 30 seconds, followed by five-second readiness timeouts. |
| Same warm development server, buffered document | Four separate browser processes | 4/4 ready in 3.36–3.41 seconds; all opened/cancelled New Puzzle. |
| Production build, streamed | Four separate browser processes, three rounds | 12/12 ready in 1.39–3.78 seconds. Another four-browser round passed real open/cancel interactions, ready in 2.14–2.21 seconds. |
| Production build, streamed | Four contexts in one browser, three rounds | 12/12 ready in 2.00–2.75 seconds. |

Supporting shared-browser controls: streamed development had 4/4 timeouts;
buffered development had 8/8 ready in 3.21–4.80 seconds. A single streamed dev
context was ready in 3.01 seconds. These are diagnostic checks, not acceptance
passes. The final independent-browser failure run was configured for three
rounds, recorded four first-round failures, then hit its 90-second watchdog
while browser operations/cleanup stalled; later rounds did not run.

Buffering waited for the complete HTML response before serving it to the
browser; it did not remove puzzle rows or replace application markup. Both
matched controls granted local-network access. Earlier buffered probes without
that permission blocked the development WebSocket and failed hydration; those
results are invalid controls and are excluded above. Initial overlapping/stalled
exploratory probes were stopped before the final separate-browser comparisons.

Limits: this does not isolate streaming from every effect of request
interception, identify the blocking promise, prove production is failure-free,
or explain every historical suite failure. The library still renders all
puzzles and per-cell thumbnails on every visit: roughly 9,000 DOM nodes and
1.89 MB decoded development HTML / 1.59 MB production HTML for this dataset.
That is a concrete growth concern, not proof that pagination alone fixes the
timeouts. No basis was found for rewriting frozen acceptance assertions.

Verification/state: final diagnostic production build exited 0, including
TypeScript. `npm run verify` and the full E2E suite were **not run** during this
investigation. Installed React DOM matches the saved original SHA256
`5166f0026794ec099a8074292644c4b463bed40632c84b7c14ad78f836fda293`.
Branch remains `main` at `5140c2d`; all pre-existing app/story changes remain
untouched. Only this handoff was edited. No commits/pushes. Diagnostic browsers
and port-3100 servers were stopped; ordinary `npm run dev` was restored on
port 3000. Accounts remains open and A4 undelivered.

Evidence/replay artifacts are local and temporary under
`/private/tmp/crossward-bounded-20261016/`:

- `comparison.json`: compact collected measurements (the failed run's `.json`
  and `.ndjson` contain the same four samples; do not double-count them).
- `server.cjs`: diagnostic launcher; modes `dev`, `build`, `start`.
- `probe.cjs`: standalone navigation/interaction probe. Exact final commands:
  `node /private/tmp/crossward-bounded-20261016/probe.cjs stream 4 1 dev-independent separate`,
  then `stream 4 3 dev-independent-repeat separate` (four failures, watchdog),
  then `buffer 4 1 dev-independent-buffer separate`. Production comparison:
  launcher `build`, then `start`, probe `stream 4 3 production-independent separate`
  and `stream 4 1 production-interaction separate`.

## Next action — discuss a focused testing story

Recommended next step: specify a small story to run the existing frozen E2E
suite against a production build, with explicit isolated test-database/auth
configuration and email forcibly disabled. Preserve normal worker counts,
timeouts, assertions, and required independent review. Then require the full
suite to pass; these navigation probes do not waive the release gate. Keep the
reproduced development rendering issue and unbounded-library concern visible.
This recommendation is not an implemented or verified harness fix.

Copyable resume prompt:

> Read AGENTS.md and the bounded-investigation sections at the top of
> docs/epics/09-accounts/HANDOFF.md. Review the saved measurements, then help
> scope the proposed production-build E2E story before implementation. Preserve
> frozen acceptance tests and unfinished A4 changes. Manual login still needs
> its own story. Do not restart the old hydration instrumentation investigation.

## Previous checkpoint — local manual testing was blocked

1. `AGENTS.md`, then **Current state** and **Next action** below. The user
   stopped development and wants to decide what happens next after manual testing.
2. `docs/DEVELOPMENT.md` and `README.md` → authentication setup. Do not inspect
   or edit `.env*`. Development uses port 5432; E2E uses a separate database
   on 5433. Ordinary E2E preparation resets its database and stops dev servers.
3. For sign-in only: `src/components/auth/SignInForm.tsx`,
   `src/components/ui/Button.tsx`, `src/lib/email.ts`, and `src/lib/auth.ts`.
4. Only if separately authorized to resume A4: its
   [story](stories/09-A4-session-renewal.md), [epic](EPIC.md), and the historical
   diagnostic evidence below. Do not restart the old reviewer assignment.

### Historical state (2026-10-16 — paused after failed manual sign-in)

**The user's immediate goal was to try the app themselves, not continue
development. They remain unable to sign in locally. Stop after this handoff;
do not resume implementation, automated tests, agents, delivery, or Ownership
without explicit new instructions.** The agent made a keyboard fix while
the user intended manual testing only; the user objected to that scope expansion.

- Checkout: `main`, HEAD `5140c2d` (`Specify Story 09-A4 session renewal
  regression`). A1–A3 are delivered. A4 is locally implemented, uncommitted,
  undelivered, and blocked by the ordinary full E2E gate. Accounts stays open.
- `npm run dev` was started at the user's request. Port 3000 is still listening
  (PID 31188, checked at 20:25 UTC); URL: `http://localhost:3000`. No process was
  stopped for this handoff. No sub-agents were spawned in this session; the
  agent roster check showed only the primary agent.
- The user reported that Enter did nothing in the email field, clicking the
  button showed “Check your email,” and no email arrived. `sendMagicLink` is
  a deliberate no-op without `RESEND_API_KEY`; local setup documents leaving
  it absent. Actual key presence and real email delivery were not verified.
  Server logs showed the request returning 200, which does not prove delivery.
  This is a clickable magic-link flow, not an email-code flow.
- At the user's request, a read-only query of the development database found
  the latest unexpired link and it was given to them. They reported clicking
  it, entering their email, and still not reaching the library. The reason
  was not investigated. **Providing the link did not establish successful
  login.** Do not reuse or record that short-lived token; obtain a fresh link
  if manual testing resumes. Production sign-in/email delivery is also unverified.

Preserve these uncommitted changes:

- A4: `src/lib/auth.ts`, `src/lib/auth-client.ts`,
  `src/components/layout/Header.tsx`, new `src/components/auth/SessionRenewal.tsx`,
  and `stories/09-A4-session-renewal.md`.
- Keyboard fix: `src/components/auth/SignInForm.tsx` now uses a native form
  with `onSubmit`; `src/components/ui/Button.tsx` accepts a `type` prop while
  retaining `button` as its default. The sign-in button uses `submit`.
- This handoff. No frozen acceptance tests, email configuration, dependencies,
  or authentication protocol were changed in this session. No commits or pushes.

Latest verification: after the keyboard fix, `npm run verify` exited 0
(24 Vitest files / 319 tests; existing `request-logger/render.ts:802` lint warning).
A temporary browser check confirmed the Enter bug before the fix, then verified
Enter in the input, mouse submission, and Tab + Enter each sent one request and
showed confirmation. It intercepted the email API: **it did not verify actual
authentication or email delivery**. Source: `/private/tmp/crossward-sign-in-keyboard-check.mjs`.
No full E2E run followed this fix; no tests were rerun to write this handoff.

The report-only hydration review is complete. All four saved probes identify
the document's `hydrateRoot()` root. Suspensions are `reason=3`
(`SuspendedOnImmediate`), with zero recorded store-consistency failures;
`rootRestarts` counts fresh-stack calls, and `actualCommits` counts root-tree
swaps rather than visible updates. The lane pattern supports a Suspense/deferred
retry cycle while content is pending, but the blocking promise and cause of the
full-suite timeouts remain unknown. Observer-off results retain excessive work.
A proposed capped promise/owner/deferred-lane trace was **not executed**.

### Historical next action — user decides; no automatic continuation

If asked to resume manual testing, help the user complete normal local sign-in
in their own browser and confirm the library actually opens. First establish
what happened to the link and relevant server response; do not start another
hydration investigation or assume a code change is authorized. Explain any
needed configuration/code change before making it. Preserve existing work.

Suggested next-session prompt:

> Read AGENTS.md and docs/epics/09-accounts/HANDOFF.md, starting with Read first
> and Current state. I want to manually test the existing app, but local sign-in
> still fails. Help me get into the library in my browser. Do not resume A4,
> automated testing, delivery, or Ownership; discuss any needed changes first.

Historical evidence and decisions follow. They do not authorize further work.

## Historical fresh reviewer brief — completed

### Assignment and boundary

The user is concerned about hours of investigation without a delivered
result. Work was paused, and the user chose a fresh independent reviewer.
The assignment below was subsequently performed as a report-only review;
its result is summarized in Current state above. Retain this brief as the
scope and artifact inventory for that review, not a new assignment.

Use this existing checkout on this Mac. The product fix is uncommitted and
the diagnostic evidence lives in `/private/tmp`; a fresh clone or GitHub PR
will not contain either. All artifact paths below were checked while preparing
this handoff on October 16. They are temporary/local, not tracked or guaranteed
to survive cleanup. If a key artifact is missing, report the gap instead of
silently recreating the entire investigation.

The question is: **What is the best-supported explanation for the repeated
library hydration work, and what is the smallest justified next action?**
Specifically, determine whether the final per-root results identify the
application root or development overlay, and what restart/suspension/store
consistency reason is recorded. Check how the instrumentation defines those
measurements before trusting their names.

This pass is read-only/report-only: no new test runs, product edits,
dependency edits/upgrades, instrumentation reinstallation, acceptance-test
changes, commits, pushes, or Ownership work. Use one reviewer, without
parallel investigative agents. Note the start time, give brief progress
updates (including a halfway check-in), and stop at 30 minutes even if the
cause is still unknown. Do not extend the pass automatically. If a new
experiment is necessary, describe it as the proposed next step for the user
to assess; do not execute it in this pass.

### Evidence to inspect first

**1. Final per-root/reason probe — interpreted in the completed review.**

Under `/private/tmp/a4-hydration-root-reason-results/`, read each of:

- `renewal-counter-probe-hydration-counters-0-authenticated/summary.json`
- `renewal-counter-probe-hydration-counters-1-authenticated/summary.json`
- `renewal-counter-probe-hydration-counters-2-authenticated/summary.json`
- `renewal-counter-probe-hydration-counters-3-authenticated/summary.json`

The relevant fields are under `state.counters`: `roots`, `prepareReasons`,
`suspendReasons`, `storeFailures`, `actualCommits`, and `exemplars`. Other
fields include `calls`, `scans`, `maxScan`, `tags`, `rootRestarts`, and
`commits`. Each directory also has `hydration-events.ndjson`. Stdout is saved
at `/private/tmp/a4-root-reason-probe.log`. This was a **diagnostic** run:
5 passed in 22.4 seconds, not a full-suite or Accounts acceptance pass.

Counter definitions/measurement provenance:

- `/private/tmp/a4-react-dom-client.root-instrumented.js` — exact augmented
  installed-React diagnostic source; inspect without reinstalling it.
- `/private/tmp/a4-react-dom-client.original.js` — original dependency blob.
- `/private/tmp/a4-react-dom-instrumentation.json` — paths/hashes and global
  counter name (`window.__CROSSWARD_HYDRATION_PROBE__`).
- `/private/tmp/a4-counter-probe-source.ts` — exact temporary probe source,
  removed from the repository after the run.

**2. Matched observer-on/off comparison — attribution limits.**

`/private/tmp/a4-hydration-observer-comparison.json` and
`/private/tmp/a4-hydration-counter-comparison.json` summarize the same
populated test database and four-worker probe with only the renewal observer
mount removed. Removing it did not eliminate excessive hydration counts;
restart counts and timings changed. These are one matched pair, not proof
that the observer is harmless, the sole cause, or unrelated. Earlier counters
aggregate multiple React roots; commitRoot entries are not necessarily
successful application commits.

**3. Actual full-suite failures and environmental confound.**

- `/private/tmp/a4-active-host-full.log` and
  `/private/tmp/a4-active-host-full-test-results/` — normal four-worker run
  failed without large observed wall-clock gaps; interrupted at 208 passed,
  13 failed, 4 interrupted, 78 not run (4.4 minutes).
- `/private/tmp/a4-pre-a4-baseline.log` and its `-test-results/` directory —
  controlled old application replay also hit library navigation failures.
  This establishes an earlier symptom, not identical cause/severity.
- `/private/tmp/a4-host-power-events.txt` — confirmed macOS Sleep/DarkWake
  during other runs. Sleep confounds timing and some failures but does not
  explain the active-host failures by itself.

**4. Supporting evidence only if needed.**

`/private/tmp/a4-profile-analysis.json` and
`/private/tmp/a4-profiled-library-saved-results/` contain qualified V8 profile
analysis/raw profiles. `/private/tmp/a4-candidate-tree-sha256.json` records
166 candidate source/test/config hashes; `/private/tmp/accounts-renewal-intake-sha256.json`
records the 62 pre-existing test hashes. No frozen tests were changed.
Installed versions checked for this handoff: Next 16.2.12, React 19.2.4,
Better Auth 1.7.5, Playwright 1.62.1.

### Required report at the stopping point

Start in plain product language: what appears broken, likely user impact,
and what remains unknown about ordinary/production use. Then provide:

1. Confirmed findings with exact artifact fields or source references;
   separate hypotheses and confidence from observed facts.
2. The smallest repeatable failure already demonstrated, or proposed exact
   reproduction steps explicitly labeled **not yet verified**.
3. If the cause is supported: the smallest proposed fix, affected paths,
   risks, and how to verify it. Do not implement it in this pass.
4. If still unresolved: one next experiment, the hypothesis it tests, what
   its possible outcomes would establish, and a bounded effort estimate.
5. A recommendation to fix, investigate separately, or stop/escalate, with
   the implications for Accounts completion. Do not waive the release gate
   or mark Accounts closed.

A useful negative result is acceptable. Another open-ended debugging session
is not the intended outcome.

## Prior checkpoint — before fresh review and manual testing

This records the earlier pause. The Current state at the top supersedes its
pending-review instructions, worktree inventory, and server/cleanup status.

A1, A2, and A3 are delivered; A3 merged through
[PR #13](https://github.com/akiryk/crossward-raptor/pull/13) as `96ce0ec`.
A4 is implemented locally on `main`, following specification baseline
`5140c2d`, which is committed and pushed and remains both local and remote
HEAD. The implementation is uncommitted and undelivered. Accounts remains
open; Ownership has not started.

Preserved working-tree changes: four app files (`src/lib/auth.ts`,
`src/lib/auth-client.ts`, `src/components/layout/Header.tsx`, and the new
`src/components/auth/SessionRenewal.tsx`), this handoff, and A4's story doc.
No frozen acceptance spec or helper changed from its committed baseline.
Separate implementation/verification agents and an independent reviewer were
used; no substantive source review finding remains, but final clearance is
blocked by the full E2E gate.

Completed checks on the preserved implementation:

- Focused renewal/protection E2E: 22/22 passed, including all seven new renewal
  cases and the existing invalid/expired/revoked-session guards.
- `npm run verify`: exit 0, TypeScript passes, 24 Vitest files / 319 tests
  pass; only the existing `request-logger/render.ts:802` lint warning.
- Full ordinary E2E: **not passing**. Multiple runs failed or were interrupted
  after library-load failures, including a controlled pre-A4 replay. A later
  active-host run failed without a large wall-clock gap, so sleep alone does
  not account for the failures. See evidence below.

Pause cleanup is complete: all test/browser/server sessions and agents are
stopped; temporary e2e probe files are removed; installed React was restored
byte-for-byte (SHA256
`5166f0026794ec099a8074292644c4b463bed40632c84b7c14ad78f836fda293`).
Final Header SHA256 is
`bc98d13e9d7b8fb75b73f44ce4e67d7cb1a3a200699d847d7a604ca0d85d2c73`.
The root's temporary keep-awake processes (`74027` and `92121`) were stopped;
no permanent power setting was changed. Diagnostic artifacts remain in
`/private/tmp`. No application checks were rerun just to write this checkpoint.

## Historical delivery boundary

The fresh report-only review is complete. Its proposed experiment was not
authorized or run. The user's latest pause and manual-testing goal are
recorded at the top; they govern the next session.

A4 cannot be delivered or Accounts closed under the current rules until the
required full E2E gate and final independent audit clearance pass. No
high-blast-radius path has changed. Keep acceptance tests frozen and preserve
all uncommitted work. Original authorization covered later delivery and
Ownership O1–O3, but the present pause supersedes automatic continuation.
The October 15 local-development puzzle deletion authorization remains
recorded; no ownership work or deletion has run.

## A4 renewal evidence

The independent Accounts audit's pre-existing A1 renewal finding was
reproduced with a real magic-link browser session in the isolated test
Postgres database. On old code, visiting `/puzzles` advanced database expiry
from `2026-11-12T19:39:22.288Z` to `2026-11-14T19:39:22.383Z` while the browser
cookie kept the original expiry. Re-aging the still-valid session and calling
the auth endpoint renewed both. The temporary probe was removed before the
A4 specification baseline; expired sessions were never revived.

The exact frozen A4 spec at `5140c2d` then demonstrated five ordinary-activity
failures, with API and fresh-session controls passing (3 passed including
setup, 5 failed, 40.9 seconds). No app code changed before that red run ended.

A4 sets Better Auth's `deferSessionRefresh` so authoritative server reads do
not silently renew only the database. An invisible authenticated browser
observer uses the installed client's GET→POST protocol to renew both expiry
values. It checks entry, visible-tab return/reconnect, and throttled visible
keyboard/pointer/navigation activity, without idle polling. Existing
invalid/expired/revoked-session guards and their call signatures remain intact.

The first implementation's focused run caught an installed-library mismatch:
GET returned `needsRefresh: true`, but the client's automatic empty POST was
rejected with 415 for missing JSON content type. A narrowly scoped
`auth-client.ts` request hook supplies JSON `{}` only for that empty session
refresh POST. No dependency upgrade or frozen-spec change was needed. The
subsequent focused renewal/protection run passed 22/22 in 20.5 seconds.

The first ordinary full A4 run hit the documented intermittent library-load
symptom and was stopped once it could no longer pass: exit 130, 208 passed,
29 failed, 4 interrupted, 62 not run (9.0 minutes). A controlled pre-A4 replay
temporarily restored the three tracked app files from `5140c2d` and excluded
the seven A4 cases, using the same default four workers and normal reset.
It also reproduced `/puzzles` load timeouts (`puzzle-list.spec.ts:73`, `:87`,
and `rename.spec.ts:48`), plus one style-guide color assertion failure. It was
stopped with 285 passed, 4 failed, 4 interrupted, 3 not run (4.1 minutes).
This demonstrates the load symptom without A4, not its cause or equal failure
rates. All four final implementation files were restored byte-for-byte and
hash-checked before a fresh ordinary A4 run. No timeout, worker, or frozen-test
change was applied.

A second unchanged A4 full run also hit library-load failures and was stopped:
exit 130, 160 passed, 9 failed, 4 interrupted, 130 not run (3.1 minutes).
Artifacts are `/private/tmp/a4-second-full.log` and
`/private/tmp/a4-second-full-test-results/`. A temporary four-worker navigation
probe on the preserved populated test database completed with 5/5 tests
passing (setup plus four workers doing eight navigations) in 37.4 seconds.
It measured 5,696 DOM nodes and approximately 1.20 MB decoded document size;
loads took 12.98–16.71 seconds, commits 0.85–2.23 seconds. Document response end
immediately preceded load; no pending resource other than one normal auth
GET after load was found. No actual stall or CPU profile was captured. The
temporary spec was removed. Summary:
`/private/tmp/a4-populated-probe-summary.json`; traces/results:
`/private/tmp/a4-populated-probe-results/`. No library-performance fix has been
selected or applied.

Diagnostic artifacts: `/private/tmp/a4-first-full.log`,
`/private/tmp/a4-first-full-test-results/`,
`/private/tmp/a4-first-full-process-snapshot.txt`,
`/private/tmp/a4-pre-a4-baseline.log`, and
`/private/tmp/a4-pre-a4-baseline-test-results/`. CPU snapshots showed changing
Chromium/Next activity; they did not establish a cause.

### October 16 investigation and pause evidence

The first resumed ordinary run was interrupted after 215 passed, 6 failed,
3 interrupted, and 79 not run (4.1 minutes). Artifacts:
`/private/tmp/a4-resumed-full.log` and its `-test-results/` directory.

CPU profiles on populated `/puzzles` showed substantial React
`canHydrateInstance` / `completeWork` samples, but long wall gaps also delayed
2.5-second Node timers by roughly ten minutes. macOS power logs confirmed
repeated Maintenance Sleep/DarkWake cycles. Filtered evidence is in
`/private/tmp/a4-host-power-events.txt`; profiles in
`/private/tmp/a4-profiled-library-saved-results/`; qualified analysis in
`/private/tmp/a4-profile-analysis.json`. No product fix follows from CPU
samples alone.

A normal run with a temporary idle-sleep assertion still overlapped host
sleep and failed: 282 passed / 21 failed, reported 28.3 minutes (UTC start
15:35:50, end observed 16:10:59). The seven A4 cases timed out during initial
sign-in/library navigation before renewal assertions. Logs/results:
`/private/tmp/a4-idle-assertion-full.log` and its `-test-results/` directory.

A later ordinary active-host run advanced without large wall-clock gaps but
also failed; it was stopped with 208 passed, 13 failed, 4 interrupted, and
78 not run (4.4 minutes, UTC 16:13:08–16:17:36). Logs/results:
`/private/tmp/a4-active-host-full.log` and its `-test-results/` directory.
This rules out a complete sleep-only explanation; no worker/timeout/spec
relaxation was made.

Temporary installed-React counters then measured approximately 741k–818k
hydration matches, 33k–36k fresh-stack calls and 16k–18k commitRoot entries
for 9,047 DOM nodes / 1.89 MB document. Maximum sibling scan was one, with
no tag mismatch. Removing only the renewal observer on the same populated
DB still produced 1.00m–1.08m matches, 5.8k–8k fresh-stack calls and
2.9k–4k commitRoot entries. Observer-on loads were about 11.9 seconds;
observer-off loads about 8.1 seconds. One pair does not establish the timing
cause; the observer is not the sole source of repeated work. Counts aggregate
all React roots (including possible Next development overlay roots), and
commitRoot entry counts must not be called successful application commits.
Comparison artifacts: `/private/tmp/a4-hydration-observer-comparison.json`
and `/private/tmp/a4-hydration-counter-comparison.json`.

The final diagnostic added per-root IDs, lanes/dehydration and restart/
suspension/consistency-failure reasons. It completed 5/5 before the user
paused, but analysis was intentionally stopped. All temporary dependency and
Header changes were restored exactly; no library rendering change or new
performance story was created.

## A3 delivery and investigation record

The current session explicitly uses
`auto_review`; the approval-setup pause is over. Separate implementation and
verification agents completed the source work and required checks. User-wide
working preferences and direct npm E2E/Playwright allow rules are installed
and validated. Existing Codex settings/rules were preserved and backed up in
`~/.codex/backups/approval-setup-20261014T225023Z/`. The user is using iTerm2;
stored thread-origin metadata must not be treated as the current interface.

A1 and A2 are committed. Workflow cleanup is independently verified and
committed separately as `829bb95`; the corrected A3 specification baseline is
`7400d27`. Both are pushed to `origin/main`. A3 was implemented on
`story/09-A3-route-protection` and is now on `main`, preserving its pre-existing middleware,
sign-out button, Header session lookup, Playwright project split,
once-per-run auth setup, and auth-table reset. Existing acceptance specs stay
frozen. The user authorized separate implementation and verification agents,
with independent review/merge and continuation to subsequent stories.

The scope mismatch is resolved in the story's 2026-10-14 correction: add actual
session validation before every exported puzzle action and at the style-guide
server boundary, while keeping middleware lightweight. No ownership, role,
schema, or engine changes belong here. Supplemental regressions are authored
by the verification agent separately from implementation.

The independent verifier demonstrated the missing guard before implementation:
a malformed cookie reached the style guide, and a database-expired session
could still create a puzzle from a loaded page. After the guards,
`npm run verify` exited 0 (24 files, 319 tests; only the existing request-logger
lint warning), and all 11 supplemental browser regressions passed. The first
full E2E attempt exited 1: 286 passed and 10 timed out in 6.4 minutes. Every
failure was `page.goto('/puzzles')` waiting for the load event in existing
new-puzzle, persistence, publish-status, or typography tests. Other editor
tests continued passing. No timeout increase or frozen-spec change was made.
The later October 15 verification below supersedes this failed checkpoint
without establishing a cause or fix. All 37 pre-existing browser specs match
their intake hashes exactly.

Preserved-state follow-up: 220 puzzles and 8,873 DOM nodes produced roughly
1.895 MB of library HTML; a fresh server with one worker completed document
load in about 1.2 seconds, but `data-ready` was still false: that probe did
not establish fast hydration. A four-worker replay of the failing existing files on
the same populated database reproduced eight navigation timeouts (21 passed,
8 failed in 2.5 minutes). Dataset size alone is not established as the cause;
parallel or long-lived server behavior remains a hypothesis to investigate.
After resuming, a plain two-worker replay of the same frozen files passed
27 tests and failed two dialog cancel/Escape cases waiting for the library's
`data-ready` hydration marker after navigation had returned. Later creation
cases passed. A two-worker cap is therefore not established as a fix, and
creation/revalidation is not required to trigger the stall. Chromium processes
showed high CPU while Next was mostly idle. Eight bounded CPU-profile probes
reached usable library pages in 2.2–2.9 seconds without console errors, but
did not reproduce or explain the stall. A temporary Header/Suspense experiment
then passed 27 tests and failed two navigation cases at four workers. It was
reverted byte-for-byte; no speculative fix remains. Trace-on and trace-off
failure counts are not a controlled comparison.

On October 15, the user requested continuation. The independent verifier
ran two consecutive ordinary `npm run test:e2e` commands, using the normal
database reset and unmodified worker configuration (four workers). Both
exited 0: 296/296 tests passed in 4.0 minutes, then 296/296 in 3.2 minutes,
on unchanged implementation/config/test contents. Final `npm run verify`
also exited 0 after the browsers exited: 24 files, 319 tests; only the existing
`request-logger/render.ts:802` unused-variable lint warning. If failures recur,
compare against a controlled pre-A3 baseline before attributing the stall to
authentication. No remedy, timeout increase, or worker cap was applied.
Temporary instrumentation is out of the repo. All 37 original browser specs were rechecked against intake hashes and
remain unchanged. Final logs: `/private/tmp/a3-resumed-full-1.log`,
`/private/tmp/a3-resumed-full-2.log`, and
`/private/tmp/a3-resumed-final-verify.log`. The verifier's 164-file
source/config/test SHA256 manifest is
`/private/tmp/a3-verified-tree-sha256.json`; no contents changed after checking.
Logs and traces remain under `/private/tmp/a3-e2e-full-1.log`,
`/private/tmp/a3-full1-test-results`, `/private/tmp/a3-populated-probe.log`,
`/private/tmp/a3-populated-probe-results`,
`/private/tmp/a3-populated-four-worker.log`, and
`/private/tmp/a3-populated-four-worker-results`. These temporary artifacts may
need recreating in a later session. The final three logs, the verified-tree
manifest, and `/private/tmp/crossward-a3-intake.json` were confirmed present
while writing this handoff.

Docker Desktop was started for the isolated test database. A generated ignored
`.next/dev/types/validator.ts` was malformed after the red-baseline server run;
regenerating types and removing that generated file restored verification.
No tracked source/config workaround or acceptance-spec change was needed.

Independent final PR review found no A3 blocker and verified the actual
committed blobs against all 164 manifest entries, with zero mismatches.
`gh pr checks 13` reported no checks; GitHub has no Actions workflows configured.
The reviewer confirmed the two E2E passes and final verification, rechecked
the head, and merged. Independent Accounts closeout audit identified
the separate renewal issue below; the epic cannot close while it remains open.

## Historical audit finding — session renewal

The following is the pre-A4 audit evidence. The live follow-up and its
verification state are recorded above; these paragraphs describe the old code.

The independent 2026-10-14 report-only audit found pre-existing A1 drift from
the epic's sliding 30-day-session policy. `src/lib/auth.ts` configures renewal
but only the magic-link plugin; the ordinary server-side `getSession` calls in
the front door, Header, and session guard discard response headers. Installed
Better Auth's session route updates database expiry and emits `Set-Cookie`,
but its Next cookie propagation integration is absent. The audit's conclusion
is that the browser can retain its original cookie expiry even when the
database session renews; a focused browser regression must confirm the exact
behavior before selecting a fix.

Evidence is source inspection, including installed Better Auth's
`dist/api/routes/session.mjs` and `dist/integrations/next-js.mjs`; a time-shift
browser reproduction has not run. This predates A3 and does not block its scoped
merge. Specify a focused renewal regression/fix before closing Accounts or
continuing to ownership; do not silently add it to A3.

Audit coverage: Accounts epic and all three stories, relevant workflows and
LEARNINGS, affected routes/actions/auth components, schema/migration,
tests/helpers/config, and installed refresh implementation. No other substantive
drift was found. External email/domain setup and A1's historical cold-start
migration evidence were not independently reproduced. No general historical
audit or decision pruning was performed.

Current state of the crossword-builder project's ninth epic, for an agent
or collaborator picking it up fresh. Read alongside
`docs/epics/09-accounts/EPIC.md` and `AGENTS.md`, which remain
authoritative for scope and behavior.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

---

## Last committed checkpoint (2026-09-22)

**A1 and A2 are complete** (A1 merged to `main` via PR — high blast
radius, it touched `prisma/**`; A2 pushed straight to `main` — low blast
radius). Better Auth is installed and configured against the existing
Prisma/Postgres, with `User`, `Session`, `Account` and `Verification`
tables plus `displayName` (nullable) and `role` (defaults to `'user'`,
deliberate unused dead weight) on the user. The magic-link flow — request
a link, consume it, sign out — works end to end, driven by
`e2e/magic-link.spec.ts` reading the token from the database rather than
an inbox. `/` is now a real front door: a signed-out visitor sees the
app name, marketing copy, a sign-in form and a privacy line; a signed-in
visitor is redirected server-side to `/puzzles`, driven by
`e2e/front-door.spec.ts`. `npm run verify` is green (308 vitest tests) and
`npm run test:e2e` is green (281 tests — the 2 magic-link tests plus the 3
new front-door tests, every prior spec unmodified — nothing is protected
yet).

Still to do: A3 (route protection plus the signed-in-user test helper).
It is the riskiest — it changes the precondition of the entire e2e suite —
and lands last. See the epic for the reasoning.

## What exists

Story files live under `docs/epics/09-accounts/stories/` with the `09-` prefix; A1 is
`docs/epics/09-accounts/stories/09-A1-magic-links.md`. A1 added:

```
src/lib/auth.ts                        Better Auth server instance — Prisma
                                       adapter, magic-link plugin, 30-day
                                       renewing sessions, 15-min tokens,
                                       trusted origins for :3000 and :3100
src/lib/email.ts                       sendMagicLink — Resend send, a no-op
                                       when RESEND_API_KEY is unset
src/app/api/auth/[...all]/route.ts     mounts the Better Auth GET/POST handler
prisma/schema.prisma                   + User, Session, Account, Verification
                                       models; displayName + role on user
prisma/migrations/20260922211911_add_auth_models/
                                       the generated migration for the above
e2e/magic-link.spec.ts                 frozen acceptance spec (the flow)
e2e/helpers/auth.ts                    editable plumbing the spec imports
```

A2 added:

```
src/app/page.tsx                       async server component — redirects a
                                       signed-in visitor to /puzzles, else
                                       renders the front door
src/lib/auth-client.ts                 Better Auth's React client
                                       (createAuthClient + magicLinkClient),
                                       the browser-side counterpart to
                                       src/lib/auth.ts
src/components/auth/SignInForm.tsx     client component — email input, submit
                                       button, sent state, privacy line
e2e/front-door.spec.ts                 frozen acceptance spec (the front door)
```

## Decision log

Deferred to the epic (`docs/epics/09-accounts/EPIC.md`), which carries the
full set: magic links over passwords, Better Auth self-hosted, Resend for
delivery, 30-day renewing sessions, single-use 15-minute tokens, `/` the
only public route, tests that never send email, `role` and `displayName`
present from the first migration. Story-specific decisions are recorded in
each story doc as it lands.

## Known issues

See Current state and A4 renewal evidence above; this checkpoint predates
the renewal finding and its follow-up.

## Next steps

A1, A2, and A3 are delivered. After verifying A4 and independently rechecking
the Accounts closeout finding, continue with
`docs/epics/10-ownership/HANDOFF.md`. Its local-development puzzle deletion
decision is settled and authorized.
