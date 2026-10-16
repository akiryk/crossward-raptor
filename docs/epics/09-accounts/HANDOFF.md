# Accounts — Handoff

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
Its required local checks passed, but Vercel's fresh install lacked a generated
Prisma client and failed TypeScript. The revised build prerequisite fix is now
verified locally, ready to commit/push to that PR and obtain final CI/review.
Branch: `story/09-A5-production-build-e2e`. A4/application and earlier handoff
edits remain excluded from A5 delivery.

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

The independent reviewer found no code issues on the initial or revised local
source. Final committed-head review and the new Vercel result remain pending;
the old failed CI result is not waived. Docker Desktop needed starting before
the first actual suite. Only the isolated test database was reset, with explicit
user authorization; all browser suites ran sequentially. Docker remains up.

Unresolved: streamed development library rendering can stall, and the library
renders every puzzle and cell thumbnail without bounds. Production E2E passes
do not establish a fix for those concerns. Manual login and real email delivery
remain unverified and need their separate follow-up story. Accounts stays open;
A4 stays undelivered. The old temporary bounded comparison artifact is missing;
do not restart the hydration instrumentation investigation to recreate it.

## Next action — A5

Commit/push only the revised A5 files to PR #14, then let the independent
reviewer confirm the final tested-file manifest, exact head, and Vercel check
before normal merge. Preserve unfinished A4/application and earlier handoff
edits outside A5 commits. Do not continue to another story automatically.

Copyable resume prompt:

> Read AGENTS.md and the A5 sections at the top of
> docs/epics/09-accounts/HANDOFF.md. Finish the scoped A5 CI/review/delivery gate
> while preserving frozen tests and unfinished A4. Keep manual login separate
> and do not begin Ownership or restart the hydration investigation.

---

## Read first

1. `AGENTS.md` — core rules, if not already loaded.
2. This handoff's `Current state`, `Next action`, and `Accounts closeout
   blocker — session renewal` — the resume point. The A3 investigation and
   September checkpoint below are evidence/history, not unfinished A3 work.
3. `docs/epics/09-accounts/EPIC.md` → Decisions and Non-goals;
   `docs/epics/09-accounts/stories/09-A1-magic-links.md` → session policy —
   the existing renewal requirement. No numbered follow-up story exists yet.
4. `src/lib/auth.ts`, `src/app/api/auth/[...all]/route.ts`,
   `src/app/page.tsx`, `src/components/layout/Header.tsx`, and
   `src/lib/require-session.ts` — configuration and actual session-read paths.
   Then inspect the installed Better Auth
   `node_modules/better-auth/dist/api/routes/session.mjs` and
   `node_modules/better-auth/dist/integrations/next-js.mjs` for refresh and
   cookie-write behavior; do not assume adding a plugin alone solves it.
5. `playwright.config.ts`, `e2e/auth.setup.ts`, `e2e/helpers/seed-session.ts`,
   and `e2e/helpers/auth.ts` — existing real-session test plumbing to reuse
   for a focused renewal reproduction.

Read `docs/DEVELOPMENT.md` before running browser tests and `docs/CODE-REVIEW.md`
before deciding delivery. Read `docs/process/STORY.md` before establishing a
follow-up baseline and `docs/LEARNINGS.md` if browser stalls recur. Read A3's
story and regression specs only if protection is implicated. Other historical
handoffs are unnecessary by default. After Accounts closes, switch to
`docs/epics/10-ownership/HANDOFF.md` for O1.

## Current state (2026-10-15)

**A3 complete and merged through [PR #13](https://github.com/akiryk/crossward-raptor/pull/13).**
The reviewed head was `3f02dcda8fa3b1d2f4b871b1cfa1686869895789`; the independent
reviewer merged it as `96ce0ec9352c7f51bd71e6dea31dbd00fed18200`. Local `main`
was fast-forwarded to that merge. Accounts remains open for the separate
renewal finding below. A1, A2, and A3 are delivered; the next work is the
session-renewal follow-up, not resuming A3.

The starting checkpoint for this handoff was local `main` and `origin/main` at
`5dbb66d` (`Record local puzzle deletion decision for Ownership O1`). The
working tree was clean before this handoff update. No implementation or test
process is active and no approval or user answer is pending. The only new
change for this handoff is this file. No application checks were rerun just
to write it.

Latest code verification is for reviewed A3 head `3f02dcd`: two consecutive
ordinary `npm run test:e2e` passes (296/296 each, four workers, normal reset),
then `npm run verify` exit 0 (24 files / 319 tests, one existing lint warning).
Subsequent commits through `5dbb66d`, and this handoff update, change
documentation only.

## Next action

Reproduce the renewal finding with a real browser session in the isolated test
database. Reuse existing sign-in plumbing, make that test session eligible for
refresh, visit a normal authenticated route, and check both database expiry
and the browser cookie's expiry. Distinguish API refresh from ordinary app
activity. This browser regression has not yet been run; source inspection is
the current evidence. Do not weaken the existing invalid/expired/revoked-session
guards or revive an already expired session to make renewal work.

Use the result to specify a focused follow-up under the existing 30-day
renewing-session Decision, establish its baseline under `docs/process/STORY.md`,
then implement, verify, and deliver it. No new numbered story or renewal fix
exists yet. A missing follow-up story is work to prepare, not by itself a
reason to stop for routine confirmation. Recheck the independent audit finding
before closing Accounts. Then specify and proceed through Ownership O1, O2,
and O3 under their own specifications and review gates.

The user authorized the orchestrator to continue through implementation,
verification/E2E, commits, PRs, independent review/merge, and subsequent stories.
Use separate implementation and verification agents for substantial work;
keep review independent and serialize suites sharing the test database. Do
not ask again for routine steps already authorized. Ask only for a substantive
unresolved decision or blocker. The earlier stop after A3 was an orchestration
choice, not a technical limit or missing permission for normal follow-up work.
The user has now explicitly requested this new-session handoff.

On October 15, the user explicitly authorized deleting existing
local-development puzzles for Ownership O1. This is also recorded in the
Ownership epic and handoff. Do not ask again. Deletion belongs to O1's migration
and has not run; it does not cover deployed data or account records.

Resume prompt:

> Read `AGENTS.md`, then `docs/epics/09-accounts/HANDOFF.md`, following its
> focused Read first list. A3 is merged. Continue from Next action: reproduce,
> specify, and fix session renewal, independently recheck the Accounts audit,
> then proceed to Ownership. Orchestrate separate implementation and testing
> agents, keep review independent, and carry each story through authorized
> verification and delivery without routine permission questions. Deleting
> existing local-development puzzles during O1 is already authorized. Preserve
> frozen tests and existing work; read historical handoffs only when needed.

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

## Accounts closeout blocker — session renewal

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

See the current Accounts closeout blocker above; earlier checkpoints predate
its discovery.

## Next steps

A1, A2, and A3 are delivered. After resolving and independently rechecking
the Accounts closeout blocker, continue with
`docs/epics/10-ownership/HANDOFF.md`. Its local-development puzzle deletion
decision is settled and authorized.
