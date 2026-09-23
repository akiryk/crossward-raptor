# Epic: Accounts

Crossward has no idea who anyone is. Every puzzle belongs to nobody,
every route is open, and the two things the Play epic needs to
track — which puzzles you built, and which you've solved — have nothing
to hang off.

This epic introduces identity: a user, a session, a way to sign in, and
a line between the one public page and everything behind it.

---

## Why this comes first

Both halves of the workflow are keyed by user id. Shipping Play against
a cookie or a single implicit user would fill `PlaySession` with rows
owned by nothing and leave `Puzzle` without an owner — and the migration
to fix that would land exactly when there is real data worth keeping.
Accounts first costs a slower start and means every row ever written has
a real owner.

## Decisions

**Magic links, no passwords.** Nothing to store, nothing to reset,
nothing to leak. A user supplies only an email; the id is generated.

**Better Auth, self-hosted.** TypeScript-first, MIT-licensed, works with
Prisma and Postgres, and supports magic links. The deciding factor is
the test suite: Better Auth keeps users and sessions in *this* app's
Postgres, so a test can create a signed-in user by writing rows the same
way `seedPuzzle` already writes puzzles. A hosted service (Supabase
Auth, Clerk) owns the user table elsewhere, which would put a network
call in the path of every one of 250+ e2e tests, from a container whose
egress is restricted.

The honest caveat: Better Auth is newer than Auth.js and may have rough
edges the older library has already hit. Auth.js was the alternative
considered; Better Auth won on types and on keeping the schema local.

**Resend for delivery.** Free tier is 3,000 emails a month capped at 100
a day, one verified domain, permanent rather than a trial — far more
than a handful of users requesting sign-in links. Better Auth ships no
email infrastructure, so some provider is required regardless.

**One verified domain is a real prerequisite.** Until a domain is
verified with Resend, sending is effectively limited to the account's
own address. That is fine while building; it blocks the second person
signing in. The story that wires email must say so rather than
discovering it later.

**Sessions last 30 days and renew on activity.** An active user
effectively never signs in again; an abandoned device expires within a
month. Indefinite sessions were rejected: the magic link sits in an
inbox forever, so a session that never expires means anyone who reaches
that inbox later gets in.

**Magic-link tokens are single-use and expire in 15 minutes.** The link
is the sensitive artifact, not the session.

**`/` is the only public route.** Everything else requires a session.
One rule, applied in one place, so every page below it can assume a user
exists without branching on "is there one?".

**Tests never send email.** A helper writes a user and a session
directly into the test database and sets the cookie. The magic-link flow
gets one real spec that reads its token out of the database rather than
an inbox — in the story that builds it, because otherwise that story has
no acceptance test for its own feature.

**`role` exists from the first migration and nothing reads it.** A
string defaulting to `'user'`. Adding a column to a populated table
later is the expensive change; authorization machinery is the cheap one,
and building it before a second role exists would be speculative. This
is deliberate, documented dead weight — the story must say so in the
schema comment, or the next audit will read it as an oversight.

**`displayName` is nullable.** Magic-link sign-in has no natural moment
to ask for a name, and most people will only ever play. Epic 10 asks for
one when it is first needed — when someone without a name creates a
puzzle.

## Non-goals

- **No authorization.** No permission checks, no roles doing anything,
  no admin UI. The only rule that exists — "you can edit what you
  built" — arrives with ownership in epic 10.
- **No ownership.** `Puzzle` is untouched here. Epic 10 adds
  `builderId`.
- **No profile page.** Editing a display name, bio or avatar is later
  work.
- **No OAuth**, no passwords, no account deletion, no email change.
- **No rate limiting** on link requests beyond whatever Better Auth
  provides by default. Worth revisiting before the app is public.

---

## Stories

### A1 — Users, sessions and magic links

Better Auth installed and configured against Prisma, with whatever
tables it generates, plus `displayName` (nullable) and `role`
(defaulting to `'user'`) on the user. Requesting a link, consuming it,
and signing out. Resend wired for delivery, with the verified-domain
prerequisite documented.

Its own spec drives the real flow end to end — request a link, read the
token from the database, visit it, assert a session exists — so the
feature has an acceptance test that exercises what a person actually
does.

Nothing is protected yet, so no existing spec changes.

*Prisma — high blast radius.*

### A2 — The front door

`/` becomes public: the app's name, short marketing copy, an email field
with a button that requests a magic link, and a quiet line stating the
address won't be shared or used for spam. A signed-in visitor at `/` is
redirected to `/puzzles`.

Needs a state for "link sent — check your email", since nothing visible
happens otherwise.

### A3 — Everything else requires a session

Route protection, plus the test helper that seeds a signed-in user.

**This is the riskiest story in the plan.** Every existing spec visits a
route that is about to require a session, so all of them need a
signed-in user before their first navigation. The work is mechanical but
touches everything, and it should land through the shared helpers —
`seedPuzzle` and `wait-for-ready` — rather than by editing specs one at
a time. It deserves its own scoping pass before it is written, including
a full inventory of which specs navigate where.

Also decides what a signed-in user's sign-out affordance is, since
without one there is no way to test the redirect in A2.

---

## Suggested order

A1, A2, A3. A1 and A2 are additive and break nothing. A3 changes the
precondition of the entire suite and should land last, when the thing it
protects already works.

## Definition of done (epic-level)

Per story: acceptance examples encoded as tests and passing,
`npm run verify` exits 0, and `npm run test:e2e` exits 0.

A person with no account can reach `/`, request a link, follow it, land
on `/puzzles` signed in, and stay signed in across browser restarts for
30 days.
