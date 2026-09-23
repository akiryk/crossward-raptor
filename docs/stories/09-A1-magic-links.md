# Story A1 — Users, sessions and magic links

First slice of the accounts epic. Crossward has no identity today: no user
table, no session, no way to tell one visitor from another. This story
installs Better Auth against the existing Prisma/Postgres setup, adds the
tables it needs plus a `displayName` and a `role` on the user, and wires the
magic-link flow — request a link, consume it, sign out — with Resend as the
delivery provider.

Nothing is protected yet. Every route stays open exactly as it is now; that
is A3. The front door at `/` with its email field is A2. This story is the
backend and configuration that both of those build on, plus the one
acceptance spec that proves the flow end to end.

**High blast radius.** Touches `prisma/**` (new models and a migration).
Branch and PR, don't merge — a different agent reviews it against
`docs/CODE-REVIEW.md`.

## Repo paths

- `package.json` — edited: add `better-auth` and `resend`; `@better-auth/cli`
  as a dev dependency if you use it to generate the schema.
- `prisma/schema.prisma` — edited: the models Better Auth requires (`User`,
  `Session`, `Account`, `Verification`, or whatever the version generates),
  plus `displayName String?` and `role String @default("user")` on the user.
- `prisma/migrations/<generated>/migration.sql` — new: from
  `prisma migrate dev`. Don't hand-author it.
- `src/lib/auth.ts` — new: the Better Auth server instance — Prisma adapter,
  magic-link plugin, session and token policy below, and the `sendMagicLink`
  sink.
- `src/app/api/auth/[...all]/route.ts` — new: mounts the Better Auth handler
  (GET and POST).
- `src/lib/email.ts` — new (or fold into `auth.ts` if it stays a few lines):
  the Resend send, guarded so it is a no-op when unconfigured — see decisions.
- `README.md` — edited: the new env-var names and the Resend verified-domain
  prerequisite, in the getting-started section (names only, never values —
  CC must not read or write any `.env*` file).
- `e2e/magic-link.spec.ts` — new (**already provided — do not edit**). The
  frozen acceptance spec.
- `e2e/helpers/auth.ts` — new (**already provided — plumbing, editable**).
  The spec imports `requestMagicLink`, `readMagicLinkUrl`, `getSession` and
  `signOut` from here. It is *not* a frozen acceptance file: it deliberately
  holds every Better-Auth-version-specific detail so the spec need not. The
  provided version is a best-effort starting point written without the
  library in hand — verify its queries and route strings against what you
  install and correct them. It must keep reading the token from the database
  (no inbox) and must not send email.
- `playwright.config.ts` — edited **only if needed**: the e2e server runs on
  `:3100`, so if Better Auth rejects the sign-in POST as an untrusted origin,
  make it trust that origin (see the implementation note below). If the
  existing env plumbing already covers it, leave this file alone.
- `src/lib/prisma.ts` — **not** edited. Better Auth's Prisma adapter takes the
  existing `prisma` client; no change to how it's constructed.

## Prerequisites (human)

Better Auth and Resend both need configuration that lives in `.env*`, which CC
must not touch. Before this story can pass, the following must exist in
`.env.local` (and in Vercel's env for production), by these names:

- `BETTER_AUTH_SECRET` — signing secret.
- `BETTER_AUTH_URL` — the app's base URL.
- `RESEND_API_KEY` — Resend API key. **Absent locally and in the test env on
  purpose** (see decisions): its absence is what stops tests from sending
  email. Present only where real delivery is wanted.

`.env.local` is loaded into `process.env` by `playwright.config.ts` already
(`config({ path: '.env.local' })`), so anything added there is inherited by
the e2e web server. `.gitignore` covers `.env*`.

**Resend needs one verified domain before a second person can sign in.** Until
a domain is verified with Resend, sending is effectively limited to the
account owner's own address — fine while building, but it blocks the second
real user. This is a real prerequisite, called out here so it isn't
discovered later; it is not a code task in this story.

## Required policy

Configure the magic-link and session behaviour to match the epic's decisions:

- **Sessions last 30 days and renew on activity** — a 30-day expiry with an
  update-age short enough that any active use slides it forward.
- **Magic-link tokens are single-use and expire in 15 minutes.**
- **`displayName` is nullable.** Magic-link sign-in has no moment to ask for a
  name; epic 10 asks when one is first needed.
- **`role` defaults to `'user'` and nothing reads it.** It exists so that
  adding it later — the expensive change on a populated table — isn't needed.
  This is deliberate, documented dead weight: **say so in a schema comment on
  the column**, or the next audit reads it as an oversight.

## Decisions

**Better Auth, self-hosted, against the existing Postgres.** Chosen in the
epic for keeping users and sessions in *this* app's database, so a test can
create a signed-in user by writing rows — which A3 will rely on. Use its
Prisma adapter and the magic-link plugin; let it generate the schema, then add
`displayName` and `role`.

**Resend for delivery, guarded so tests never send email.** The epic's rule is
that tests never send email. The mechanism is simple and needs no test-only
table: `sendMagicLink` sends through Resend **only when `RESEND_API_KEY` is
set**, and is otherwise a no-op. Local dev and the e2e server have no key, so
no email is ever sent there. Crucially, Better Auth stores the verification
token regardless of whether the email goes out, so the spec can still read the
token from the database and complete the flow. Don't gate the no-op on
`NODE_ENV` — key-presence is the honest signal and keeps a keyless local dev
run from silently trying to send.

**The token is read from the database, not an inbox.** `readMagicLinkUrl` in
the helper does this. Whether it reads Better Auth's own verification row and
rebuilds the verify URL, or reads a URL your `sendMagicLink` persisted, is
your call — but it reads from the database and sends no email.

**Nothing is protected in this story.** No middleware, no redirects, no gated
routes. Adding protection here would break every existing spec at once; that
is A3's job, deliberately last. Because nothing is protected, the spec proves
"signed in" through Better Auth's own `get-session`, not by reaching a page.

**No sign-out UI, no front-door UI.** Sign-out and the `/` email form are
observable features of A3 and A2. This story wires the *capability* — the
Better Auth handler exposes sign-in, verify, get-session and sign-out routes
the moment it's mounted — and the spec exercises them directly.

## Implementation note — trusted origin on :3100

The e2e web server runs on `:3100` (`playwright.config.ts`), while dev runs on
`:3000`. Better Auth validates the origin of state-changing requests, so the
sign-in POST from a `:3100` page can be rejected if only `:3000` is trusted.
If that happens, configure Better Auth's trusted origins to include the e2e
origin (derive from env, or list both). This is the most likely rough edge in
the whole story — the epic flagged Better Auth as newer and less-worn than the
alternative — so expect to spend time here, not in the happy path.

## Scope discipline

- **No route protection, no middleware.** (A3.)
- **No `/` changes, no email-field UI, no sign-out button.** (A2/A3.)
- **No `Puzzle` changes, no `builderId`.** (Epic 10.)
- **No profile page, no OAuth, no passwords, no account deletion, no email
  change, no rate limiting** beyond Better Auth's defaults. (Epic non-goals.)
- **No existing spec changes.** Nothing is protected, so nothing existing
  should need touching. If a change to Better Auth's mount or the auth routes
  makes an existing spec fail, that's a finding to report, not a spec to edit.
- **`role` reads from nowhere.** Don't build authorization to use it. Its
  whole point is to exist unused.

## Acceptance examples

Both live in `e2e/magic-link.spec.ts` (Playwright, frozen).

**A1-1 — request → read token → follow → signed in.** A fresh, unique email
requests a magic link. The link is read out of the database and visited in the
browser. Better Auth's `get-session` then reports that browser as signed in as
that email.

**A1-2 — signing out clears the session.** After signing in the same way,
`get-session` shows the user; after signing out, it returns no session.

## Definition of done

1. `npm run verify` exits 0.
2. `npm run test:e2e` exits 0 — `e2e/magic-link.spec.ts` passes, and every
   existing spec still passes **unmodified** (nothing is protected yet).
3. `npm run db:setup` applies the new migration from a cold start (drop the
   containers first and bring them back), and the schema has `User`,
   `Session`, `Account` and `Verification` (or the version's equivalents),
   with `displayName` nullable and `role` defaulting to `'user'` and carrying
   the dead-weight comment.
4. **No email is sent during the test run** — demonstrate it (the run passes
   with no `RESEND_API_KEY` set, and `sendMagicLink` is a no-op without one).
   This is the one safety property a green suite alone doesn't prove.
5. `README.md` names the new env vars and the Resend verified-domain
   prerequisite (names, not values).
6. Opened as a PR, not merged.

Report anything that doesn't work — especially any place the provided helper's
guessed queries or routes had to change — rather than adjusting the frozen
spec to fit.
