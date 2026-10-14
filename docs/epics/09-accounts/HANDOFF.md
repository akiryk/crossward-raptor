# Accounts — Handoff

## Read first

1. `AGENTS.md` — core rules, if not already loaded.
2. This handoff's `Current state` and `Next action` — the resume point;
   the older committed checkpoint below is historical.
3. `docs/epics/09-accounts/EPIC.md` → Decisions and A3;
   `docs/epics/09-accounts/stories/09-A3-route-protection.md` — scope and
   required verification, including two consecutive E2E runs.
4. `src/middleware.ts`, `src/components/layout/Header.tsx`, and
   `src/app/puzzles/actions.ts` — cookie presence versus actual session validation.
5. `e2e/route-protection.spec.ts` (frozen), `playwright.config.ts`,
   `e2e/auth.setup.ts`, and `e2e/helpers/seed-session.ts` — acceptance and auth setup.

Read `docs/DEVELOPMENT.md` before running browser tests and `docs/CODE-REVIEW.md`
before deciding delivery. Read A1/A2 stories or older handoffs only if their
auth behavior is implicated; they are not prerequisites for every A3 session.

## Current state (2026-10-13)

A1 and A2 are committed. The checked-out `main` is at `c227f51` (A3 spec);
the locally recorded `origin/main` is at `7f384b6` (A2 implementation),
without a remote refresh. A3 implementation is present but uncommitted:
middleware, sign-out button, Header session lookup, Playwright project split,
once-per-run auth setup, and auth-table reset. Existing acceptance specs are
unchanged. Documentation/workflow cleanup is tracked separately in epic 12.

Code inspection on intake found that middleware's optimistic cookie check is
not backed by rejection of invalid/expired sessions in the protected pages or
Server Actions. Header validates only to decide sign-out visibility. The A3
story assumes full validation already exists; resolve this scope/spec mismatch
before declaring it complete. This finding is from inspection, not a browser
exploit test. Keep middleware lightweight as specified.

The intake `npm run verify` passed with 308 tests; Playwright discovery listed
285 tests, including setup. The browser suite was not run on intake. The two
consecutive E2E passes required by A3 remain unverified. Accounts closeout
audit is pending.

## Next action

Reconcile A3's full-session-validation assumption with the actual routes/actions,
then finish the implementation and its required checks without changing frozen
acceptance specs. Changes to `actions.ts` require a branch/PR and independent
review under `docs/CODE-REVIEW.md`. Preserve existing uncommitted work.

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

None recorded yet.

## Next steps

Finish A3 as described in `Current state` above. A1 and A2 are already
committed. After A3's own Definition of Done and an independent accounts
closeout audit, continue with `docs/epics/10-ownership/HANDOFF.md`.
