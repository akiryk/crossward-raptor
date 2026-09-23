# Story A3 — Everything else requires a session

Final slice of the accounts epic, and the one the epic flagged as riskiest.
A1 gave Crossward identity; A2 built the front door. This story closes the
door behind it: every route except `/` now requires a session, and every
existing e2e spec — all ~276 of which navigate straight into a protected
route without signing in — has to keep passing.

The rule is one sentence: **`/` is public; everything else redirects a
signed-out visitor to `/`.** Applied in one place (middleware), so no page
below it has to branch on "is there a user?".

The work that makes this safe is not the middleware — it's making the suite
pass **without editing specs one at a time**. That happens two ways, both
below: a Playwright project split by auth need, and a session seeded once per
run into a shared `storageState`.

**Blast radius: low by the file rule** — this touches no `prisma/**`, engine,
`puzzle-storage.ts`, or `actions.ts`, so `/story` will push it to `main`
without a PR. But it changes the precondition of the entire e2e suite, which
no file-based rule captures. **Recommend a manual review anyway** (a different
agent), given the risk; that's the user's call, not something `/story` will
force.

## Repo paths

- `src/middleware.ts` — new: the protection. Matches every path except `/`,
  `/api/auth/*`, and Next internals/static assets; redirects a request with no
  session to `/`. Use Better Auth's lightweight middleware cookie check
  (`getSessionCookie`, an optimistic presence check — no DB call in
  middleware); full validation stays in the routes. Confirm the exact helper
  name against the installed version.
- `src/components/layout/Header.tsx` — edited: render a sign-out control **only
  when a session exists** (check server-side with `auth.api.getSession`). The
  Header renders on `/` too, where a signed-out visitor must not see it.
- `src/components/auth/SignOutButton.tsx` — new: a client component
  (`data-testid="sign-out"`) that calls `authClient.signOut()` and then sends
  the user to `/`. This is the sign-out affordance the epic said A3 must
  decide on.
- `playwright.config.ts` — edited: the project split (below).
- `e2e/auth.setup.ts` — new: seeds the shared signed-in session once per run
  and saves `storageState` (below). Infrastructure, implementer-owned.
- `scripts/reset-test-db.mjs` — edited: also clear the auth tables (`user`,
  `session`, `account`, `verification`) so seeded users don't accumulate
  across runs. Keep the existing non-localhost guard; it already refuses to
  run anywhere but the test database.
- `e2e/route-protection.spec.ts` — new (**already provided — do not edit**).
  The frozen acceptance spec.
- `e2e/helpers/seed-session.ts` — new (**already provided — plumbing,
  editable**). `signInSeededUser(page)`, used by the frozen spec's authed
  cases. See the seeding decision below.
- `e2e/helpers/auth.ts`, `e2e/helpers/wait-for-ready.ts`,
  `e2e/helpers/seed-puzzle.ts` — **not** edited; reused as-is.

## The Playwright project split

Two projects, assigned by file — **no spec file is edited or moved**:

- **`public`** (no `storageState`): the specs that must run signed out —
  `magic-link.spec.ts`, `front-door.spec.ts`, `route-protection.spec.ts`, and
  the two pure-shell specs `smoke.spec.ts` and `shell.spec.ts`. The last two
  only assert layout that renders on `/`'s front door (header, main landmark,
  design tokens, no overflow), so they pass signed out, unchanged — I checked
  each assertion against the front door.
- **`authenticated`** (`storageState` from the setup below, `dependencies:
  ['setup']`): everything else — every spec that visits `/puzzles`,
  `/style-guide` or `/puzzles/{id}`. They navigate straight in, exactly as
  written today, because the context already carries a session.

Assign by an explicit `testMatch`/`testIgnore` list of the five public specs
in `playwright.config.ts`. It's a small list; new auth-flow specs get added to
it. A `setup` project (matching `e2e/auth.setup.ts`) runs first and the
`authenticated` project depends on it.

## The shared session (`e2e/auth.setup.ts`)

The ~250 authenticated specs must not each run a sign-in — the epic is
explicit about that, and it would be slow. Instead, `auth.setup.ts` produces a
signed-in session **once per run** and saves it to a `storageState` file the
`authenticated` project loads. The seeded user persists in the test database
for the whole run (the wipe happens in `pretest:e2e`, before setup runs).

A single shared user across all authenticated tests is fine: puzzles aren't
owned yet (that's epic 10), `listPuzzles` returns them all regardless of user,
and the specs already use unique titles and avoid count assertions (Story L1).
Nothing asserts user-specific data.

## Seeding decision — flow-based, not forged (documented deviation)

The epic's decision reads: *"A helper writes a user and a session directly
into the test database and sets the cookie."* Taken literally, that means
forging Better Auth's session cookie — which it **signs by default**
(`token.signature`, HMAC with `BETTER_AUTH_SECRET`). Forge it even slightly
wrong and every authenticated spec redirects to `/`: the whole suite goes red
on one brittle detail.

The provided `signInSeededUser` and the recommended `auth.setup.ts` therefore
reuse A1's **proven** magic-link path: request a link, read the token from the
database, visit the verify URL. No email is sent (no `RESEND_API_KEY` in the
test env; Better Auth stores the token anyway), the token comes from the
database exactly as the epic wants, and the resulting cookie is real — so this
works whether or not the cookie is signed. It runs once per run for the shared
session, so the epic's performance concern (no per-test flows) still holds.

This is a **conscious deviation from the letter** of the epic's decision,
recorded here so it isn't silent. If you confirm the cookie is unsigned (just
the raw token), you may switch both the helper and the setup to a direct
row-write plus `context.addCookies` — faster, closer to the epic's wording,
and the frozen spec is agnostic to the choice.

## Required behaviour

- **`/` and `/api/auth/*` stay reachable signed out.** Sign-in must keep
  working, so the auth API must never be behind the redirect.
- **Every other route redirects a signed-out visitor to `/`.**
- **A signed-in visitor reaches every route as before** — the entire existing
  suite passes unmodified.
- **Sign-out** returns the user to `/` and clears the session.

## Scope discipline

- **No `Puzzle` or ownership changes.** (Epic 10 adds `builderId`; A3 does
  not.) A shared seeded user is correct precisely because nothing is owned yet.
- **No per-spec edits, no spec moves.** If some spec can't be made to pass by
  the project split alone, that's a finding to report — name it — not a spec to
  edit. The two frozen specs from A1/A2 especially must not be touched.
- **No authorization.** `role` still reads from nowhere. Protection is
  binary — session or not.
- **No new tokens, no design work** on the sign-out control beyond making it a
  real, reachable control. Match existing Header/Button conventions.
- **Middleware stays a cookie-presence check.** Don't add per-request DB
  validation in middleware; the routes already run server-side.

## Acceptance examples

All in `e2e/route-protection.spec.ts` (Playwright, frozen), running in the
`public` project so they start signed out.

**A3-1 — signed-out is redirected.** Visiting `/puzzles` (and `/style-guide`)
signed out lands on `/`, showing the front door.

**A3-2 — signed-in reaches the route.** After `signInSeededUser`, `/puzzles`
loads the list (`new-puzzle` present), no redirect.

**A3-3 — sign-out.** From a signed-in `/puzzles`, clicking the sign-out
control returns to `/` and leaves no session.

## Definition of done

1. `npm run verify` exits 0.
2. `npm run test:e2e` exits 0 — `route-protection.spec.ts` passes, **and every
   other spec passes unmodified**, across both projects. This is the real bar:
   the suite is green without a single existing spec edited or moved.
3. Signed out, only `/` and `/api/auth/*` are reachable; everything else
   redirects to `/`. Demonstrated by A3-1 plus the suite passing.
4. Running the suite twice in a row passes both times (proves the auth-table
   wipe and the once-per-run seed compose correctly).
5. Pushed to `main` (low blast radius). **Flag for manual review** given the
   suite-wide precondition change, and report that recommendation explicitly.

Report anything that doesn't work — especially any spec that the project split
alone couldn't rescue, or any place the seeding had to change — rather than
editing a frozen spec or an existing spec to fit.
