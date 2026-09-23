# Accounts — Handoff

Current state of the crossword-builder project's ninth epic, for an agent
or collaborator picking it up fresh. Read alongside
`docs/epics/09-accounts-epic.md` and `AGENTS.md`, which remain
authoritative for scope and behavior.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

---

## Where things stand

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

Story files live under `docs/stories/` with the `09-` prefix; A1 is
`docs/stories/09-A1-magic-links.md`. A1 added:

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

Deferred to the epic (`docs/epics/09-accounts-epic.md`), which carries the
full set: magic links over passwords, Better Auth self-hosted, Resend for
delivery, 30-day renewing sessions, single-use 15-minute tokens, `/` the
only public route, tests that never send email, `role` and `displayName`
present from the first migration. Story-specific decisions are recorded in
each story doc as it lands.

## Known issues

None recorded yet.

## Next steps

A1, then A2, then A3, in that order (the epic explains why A3 is last).
