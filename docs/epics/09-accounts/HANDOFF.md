# Accounts — Handoff

## Read first

1. `AGENTS.md` — core rules, if not already loaded.
2. This handoff's `Current state` and `Next action` — the resume point;
   the older committed checkpoint below is historical.
3. `docs/epics/09-accounts/EPIC.md` → Decisions and A3;
   `docs/epics/09-accounts/stories/09-A3-route-protection.md` — scope and
   required verification, including two consecutive E2E runs.
4. `src/middleware.ts`, `src/lib/require-session.ts`,
   `src/app/puzzles/actions.ts`, and `src/app/style-guide/layout.tsx` —
   optimistic middleware versus actual server-side session validation.
5. `e2e/route-protection.spec.ts` (frozen), `e2e/session-validation.spec.ts`,
   `src/app/puzzles/actions.session.test.ts`, `playwright.config.ts`,
   `e2e/auth.setup.ts`, and `e2e/helpers/seed-session.ts` — acceptance,
   supplemental regressions, and auth setup.

Read `docs/DEVELOPMENT.md` before running browser tests and `docs/CODE-REVIEW.md`
before deciding delivery. Read A1/A2 stories or older handoffs only if their
auth behavior is implicated; they are not prerequisites for every A3 session.

## Current state (2026-10-15)

**A3 implemented and locally verified; PR/review/merge pending.** The current session explicitly uses
`auto_review`; the approval-setup pause is over. Separate implementation and
verification agents completed the source work and required checks. User-wide
working preferences and direct npm E2E/Playwright allow rules are installed
and validated. Existing Codex settings/rules were preserved and backed up in
`~/.codex/backups/approval-setup-20261014T225023Z/`. The user is using iTerm2;
stored thread-origin metadata must not be treated as the current interface.

A1 and A2 are committed. Workflow cleanup is independently verified and
committed separately as `829bb95`; the corrected A3 specification baseline is
`7400d27`. Both are pushed to `origin/main`. A3 implementation is on
`story/09-A3-route-protection`, preserving its pre-existing middleware,
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

On October 15, the user requested continuation. The independent verifier is
ran two consecutive ordinary `npm run test:e2e` commands, using the normal
database reset and unmodified worker configuration (four workers). Both
exited 0: 296/296 tests passed in 4.0 minutes, then 296/296 in 3.2 minutes,
on unchanged implementation/config/test contents. Final `npm run verify`
also exited 0 after the browsers exited: 24 files, 319 tests; only the existing
`request-logger/render.ts:802` unused-variable lint warning. If failures recur, compare against a
controlled pre-A3 baseline before attributing the stall to authentication.
No remedy, timeout
increase, or worker cap was applied. Temporary instrumentation is out of the
repo. All 37 original browser specs were rechecked against intake hashes and
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
need recreating in a later session. Implementation is still uncommitted;
no A3 PR or merge has occurred.

Docker Desktop was started for the isolated test database. A generated ignored
`.next/dev/types/validator.ts` was malformed after the red-baseline server run;
regenerating types and removing that generated file restored verification.
No tracked source/config workaround or acceptance-spec change was needed.

Independent working-tree review found no A3 code blocker. Final PR/head/check
review and merge remain pending. Independent Accounts closeout audit identified
the separate renewal issue below; the epic cannot close while it remains open.

## Accounts closeout blocker — session renewal

The independent 2026-10-14 report-only audit found pre-existing A1 drift from
the epic's sliding 30-day-session policy. `src/lib/auth.ts` configures renewal
but only the magic-link plugin; the ordinary server-side `getSession` calls in
the front door, Header, and session guard discard response headers. Installed
Better Auth's session route updates database expiry and emits `Set-Cookie`,
but its Next cookie propagation integration is absent. The browser therefore
retains its original cookie expiry even when the database session renews.

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

## Next action

Commit the verified A3 implementation and deliver through a PR and independent
review/merge under `docs/CODE-REVIEW.md`, followed
by resolving the separate Accounts renewal blocker before epic closure.
Preserve frozen specs. Ownership O1 also awaits the user's answer about
disposing of existing local-development puzzles; that question was asked
while A3 verification ran, with no data deletion authorized by silence.

Resume prompt: "Read `AGENTS.md` and
`docs/epics/09-accounts/HANDOFF.md`, follow its Read first list, and continue A3
from Next action."

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

Finish A3 as described in `Current state` above. A1 and A2 are already
committed. After A3's Definition of Done and resolution of the independent
Accounts closeout blocker, continue with
`docs/epics/10-ownership/HANDOFF.md` and its outstanding data decision.
