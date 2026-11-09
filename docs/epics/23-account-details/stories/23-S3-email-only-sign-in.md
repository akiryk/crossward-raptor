# Story S3 — Email-only sign-in and the username step

The sign-in form asks for the email only, and the magic link no longer
carries a username. After the link, an account without a username sees
the username step at `/`, pre-filled with a generated name; until it
saves one it can reach no page and no server action. An account with a
username goes straight to `/puzzles`, its username unchanged.

**Status: Frozen 2026-11-09.** Approved and frozen by the orchestrating
session under the human's delegation ([history](../HISTORY.md#orchestration)),
after an independent specification review (no blockers; its non-blocking
points folded in, see Discrimination).

**Depends on S1 (frozen 826079d, delivered a7155dd) and S2 (done).**
The step's field uses S1's `caption` prop on `TextInput`: under the line, 4px
below it, above any error, `${data-testid}-caption`, `aria-hidden`, the
field named by the caption's text; `caption` and `aria-label` are
exclusive, so the step passes `caption="Username"` only. The acceptance
reads `username-input-caption` and the field's name "Username". S1 left
the caption beside an error to "S4, which first shows them"; the step
shows them first, so 23-S3-3 checks that pairing (the error under the
caption, the caption still `muted`). The pre-fill is S2's
`generateUsername()`.

**Blast radius: a risk story.** It changes `src/lib/auth.ts` (Better
Auth's configuration and hooks), the session guard every server action
and protected page uses (`src/lib/require-session.ts`), adds an
authenticated write (the username save) and amends frozen tests of
`src/app/puzzles/actions.ts`. Per [CODE-REVIEW](../../../CODE-REVIEW.md#when-review-applies)
(`auth.ts` and a new authenticated write path are treated as risk paths
in this epic): branch `story/23-S3-email-only-sign-in` from the frozen
baseline, a PR, and an independent review before merge.
`src/app/puzzles/actions.ts` itself should need no change; if it does,
that is in scope and reviewed. No `prisma/**` change (the column
exists). No `src/engine/**` change.

## The human's request

From the [EPIC](../EPIC.md#the-humans-request), items 1 and 2, and the
human's review (2026-11-09):

- The sign-in form asks for the email only, for new and returning users
  alike; a returning user's username never changes by signing in.
- After the link, a user without a username sees a username field
  pre-filled with a friendly generated name, with a "Username" caption in
  the `label` style, as a required page step (not a popup), shown to any
  signed-in account without a username and to no one else.
- No username, no privileges: until a username is saved the account
  can't see, play or create a puzzle or reach any page but the step; the
  server enforces it on every page, server action and route that today
  requires a session, not only by redirecting. Saving the username is the
  one thing such a session can do.

## What the code does today

- **Better Auth** (`src/lib/auth.ts`): magic link (15 minutes, single
  use), 30-day sliding sessions, `deferSessionRefresh`, no cookie cache
  (every `getSession` reads the session and user rows). Hooks on
  `/magic-link/verify`: `before` reads the link's stored `name` and
  checks it with `usernameError`; `after` copies it, trimmed, into
  `User.displayName` while that is blank (14-S1, "the first username
  wins"). `displayName` is not declared to Better Auth, so the session's
  user does not carry it; Better Auth's own `User.name` (required; the
  magic link stores the link's `name`, or `''`) is unread by the app.
- **The front door** (`src/app/page.tsx`): `getSession`; a session
  redirects to `/puzzles`; otherwise the title ("Build a puzzle." / "Or
  play a puzzle." in `muted`, "Log in to start." in `primary`) and
  `SignInForm`.
- **`SignInForm`** (`src/components/auth/SignInForm.tsx`): Username and
  Email fields (large, 400px, 20px apart), validated with `usernameError`
  and `emailError`; sends `{ email, name, callbackURL: '/puzzles' }` via
  `authClient.signIn.magicLink`; reads and writes `localStorage`
  `crossward:username`; sent, failure and privacy-line states.
- **The guard** (`src/lib/require-session.ts`): `requireSession()` is
  `getSession`, else `redirect('/')`. No username check anywhere.
- **Everything that requires a session today:**
  - *Middleware* (`src/middleware.ts`): every path but `/` and
    `/api/auth/*` needs a session **cookie** (presence only, no database);
    otherwise a redirect to `/`.
  - *Pages:* `/puzzles` (`page.tsx`: `listPuzzles()` and
    `requireSession()`); `/puzzles/[id]` (`loadPuzzle`, then
    `notFound()`); `/puzzles/[id]/play` (`loadPlayPuzzle`, then
    `notFound()`); `/style-guide` (its `layout.tsx` calls
    `requireSession()`). `/puzzles` has no layout.
  - *Server actions:* only `src/app/puzzles/actions.ts`, 16 exports, each
    calling `requireSession()` before any data access: `loadPlayPuzzle`,
    `startPlaySession`, `resetPlaySession`, `savePlayEntries`,
    `inspectPlayCompletion`, `createPuzzle`, `listPuzzles`, `saveGrid`,
    `saveHints`, `saveTitle`, `enterHints`, `publishPuzzle`,
    `setPuzzleVisibility`, `duplicatePuzzle`, `deletePuzzle`,
    `loadPuzzle`. (`actions.session.test.ts` checks nine of them without a
    session.)
  - *Route handlers:* only `src/app/api/auth/[...all]/route.ts`, Better
    Auth's. With this configuration a session can call `get-session`,
    `sign-out`, `update-user` (Better Auth's `name` and `image`, plus any
    declared user field not marked `input: false`), `list-sessions`,
    `revoke-session(s)`, `revoke-other-sessions`; `change-email` and
    `delete-user` are disabled. None reads or writes a puzzle.
  - *The masthead* (`Header.tsx`, `getSession`): any session shows
    `SessionRenewal` and Sign out.
- **Tests that pin the old behavior:** `e2e/sign-in.spec.ts` (14-S1: the
  Username field, the remembered username, capture on verification),
  `e2e/front-door.spec.ts` (A2: fills Username; a fresh, nameless account
  at `/` is sent to `/puzzles`), `e2e/manual-login.spec.ts` (A6: fills
  Username; a fresh account lands on `/puzzles`),
  `src/components/auth/sign-in-source.test.ts` (`auth.ts` imports
  `lib/username`), `src/components/ui/input-source.test.ts` (two sign-in
  fields), and seven `actions.*.test.ts` files whose mocked sessions have
  no `displayName`.

## Decisions

From the human and the EPIC:

- **The form asks for the email only:** one field, "Your email
  address...", "Send Sign-in Link"; the privacy line, the sent state and
  errors as today. Same form for new and returning users.
- **The link carries no username;** a returning user's username never
  changes by signing in. The hooks that copied the link's name into
  `displayName`, and the form's remembered username (`crossward:username`,
  no longer read or written), are removed.
- **The username step** shows after the link to any account whose
  username is blank, new or older, and to no one else, at `/`: the front
  door's title with "Create a username." as its last line, the field, a
  "Get Started" button. Saving goes on to `/puzzles`. The magic link's
  destination stays `/puzzles`; the gate sends a nameless account on to
  `/`.
- **Pre-filled** with `generateUsername()`, fresh each time the step
  loads; no "another name" control. The rules as today: 1–80 characters,
  trimmed; not unique.
- **No username, no privileges,** enforced by the server on every page,
  server action and route that requires a session; saving the username is
  the one thing such a session can do.
- **Saving** is a server action that changes only the signed-in user's
  own `displayName`, enforcing the username rules on the server.
- **The masthead on the step** shows Sign out (the way out for a wrong
  email) and no Account.

Delegated (orchestrating session, decided in drafting):

- **"Has a username"** means `displayName` is a string that is not empty
  after JavaScript's `trim()` (so whitespace-only, including no-break
  spaces, is blank, as `usernameError` already treats it). `null`, a
  missing field or a non-string is blank. One function decides it:
  `hasUsername(session)` in `src/lib/require-session.ts`.
- **The session carries the username.** `auth.ts` declares
  `user.additionalFields.displayName` as `{ type: 'string', required:
  false, input: false }`. `getSession` then returns it, read from the
  database with the session (no cookie cache is configured), so the
  guard costs no extra query. `input: false` makes Better Auth refuse
  `displayName` from any client input (`update-user`, sign-up) with
  `FIELD_NOT_ALLOWED`: the step's action is the only writer. **Constraint
  for later work:** enabling Better Auth's session cookie cache would make
  the username lag behind the database (a just-saved username would bounce
  the user back to the step); revisit the guard before enabling it.
- **One guard module, `src/lib/require-session.ts`:**
  - `currentSession()`: Better Auth's session for this request, or null.
    The only caller of `auth.api.getSession` in the app (the front door
    and `Header.tsx` switch to it).
  - `hasUsername(session)`: as above.
  - `requireSession()`: **keeps its name and every call site**, and now
    admits only a session that `hasUsername`; anything else
    `redirect('/')`. So all 16 actions, `/puzzles` and the style guide
    become username-gated with no change to `actions.ts`, and a new
    action or page that uses the existing guard is gated by default.
    Keeping the name also keeps the frozen tests that mock
    `@/lib/require-session` meaningful.
  - `requireAnySession()`: any valid session, named or not, else
    `redirect('/')`. Used **only** by the username save (a source test
    holds that).
- **A nameless account is refused like no session:** each page and
  action redirects to `/` before reading or writing anything; at `/` it
  sees the step. A server action called directly gets the same redirect.
- **Pages are guarded twice.** A new `src/app/puzzles/layout.tsx` calls
  `requireSession()`, like the style guide's layout, so any page added
  under `/puzzles` is gated before it renders; each existing page's data
  still comes through guarded actions (Next renders a layout and its page
  concurrently, so the layout alone is not relied on). A source test
  requires a guarding layout for every page outside `/`.
- **The middleware is unchanged:** it checks only for a cookie, has no
  database access, and is not the authority; pages and actions are.
- **Better Auth's routes stay as they are.** A nameless session can still
  read its session, sign out, list and revoke its sessions, and change
  Better Auth's `name`/`image` through `update-user` (unread by the app;
  existing behavior for every account). None of these touches a puzzle or
  sets a username. A link requested by hand with a `name` still sets
  Better Auth's `name` for a new account; the app ignores it. This narrows
  the EPIC's "every … route that today requires a session" to the app's own
  pages and actions; recorded for the human's check at the epic's end.
- **The save action:** `saveUsername(value)` in a new
  `src/app/account-actions.ts` (`'use server'`; S4's Account details can
  reuse it). `requireAnySession()` first (no session: `redirect('/')`,
  nothing written), then `usernameError(value)` (a non-string, blank or
  over 80 code points: returns `{ error: message }`, nothing written),
  then one write keyed by the session user's id alone, setting only
  `displayName` to the trimmed value, then `redirect('/puzzles')`. It
  takes no user id and ignores extra arguments.
- **The latest save wins.** Saving replaces any username, so two tabs on
  the step each save and move on, and the later click is kept (the user's
  latest explicit choice; a first-wins rule would silently ignore it,
  which is the confusion the human described). A named account calling it
  changes only its own username, which S4 will allow anyway.
- **The step's layout** (as mocked, in the front door's container, under
  the front door's one `Title`, whose last line changes; the frozen
  sign-in source test allows one `<Title size={1}>` across `app/page.tsx`
  and `SignInForm.tsx`): the title's third line "Create a username." in `primary`, the first two in
  `muted`; the field 40px under the title, large, 400px wide (as the email
  field), named "Username", placeholder "Your username..." (seen only
  when cleared), its "USERNAME" caption under the line; "Get Started", the
  large primary `Button`, 40px under the caption (or under the error,
  when shown); no privacy line (it is about the email).
- **The step's behavior:** Enter or Get Started submits; the client
  checks `usernameError` first (the field's error line with the rule's
  message, the field focused, nothing sent), and the server checks again.
  While saving, the field and button are disabled. A failed save (the
  action throws or the request fails) keeps the step and the value,
  re-enables both and shows a two-line alert 20px under the button,
  "Could not save your username." (`primary`) / "Please try again."
  (`muted`), as the sign-in form's failure; a retry saves. The generated
  name is made on the server when the page renders, so the first paint
  holds it and hydration matches. `data-ready` on the form, like the
  sign-in form, for tests.
- **Test ids:** `username-step` (the form), `username-input` (the
  field; `-caption`, `-error` from `TextInput`), `username-submit`. The
  sign-in form keeps its ids (`sign-in-form`, `sign-in-email`,
  `sign-in-submit`, `sign-in-sent`, `sign-in-privacy`).
- **The old `crossward:username` value** is neither read nor written; it
  may be left in place or cleared.

## Non-goals

- Account in the masthead, the Account details modal, changing a username
  or email from it (S4, S5).
- Unique usernames; changing the username rules or messages.
- Changing the middleware, session length, the link's lifetime, the
  sign-in email or Better Auth's other endpoints (`update-user` for
  `name`/`image`, session listing and revoking).
- Clearing Better Auth's `User.name` or migrating existing rows; older
  accounts with a blank username simply see the step.
- A "suggest another name" control.
- Showing the username anywhere new.

## Acceptance (frozen)

Viewport 1280×800 for the browser cases. The browser cases sign in by
database token (`e2e/helpers/auth.ts`, a new editable helper
`e2e/helpers/username-step.ts`); no email is sent.

### `src/lib/require-session.test.ts` (new)

1. **23-S3-R1 `requireSession`:** no session → `redirect('/')`; a username that is
   `null`, `''`, spaces, tabs and newlines, a no-break space, missing, a
   number, an object or an array → `redirect('/')`; "Ada", "  Lil Orange
   Fox  ", "🦖" → the session itself. `getSession` is called with the
   request's headers.
2. **23-S3-R2 `requireAnySession`:** no session → `redirect('/')`; blank or named
   → the session.
3. **23-S3-R3 `hasUsername`:** false for null, every blank and non-string
   value above (a missing field, a number, an object, an array); true for a
   named one.

### `src/app/account-actions.test.ts` (new)

1. **23-S3-U1** the module exports `saveUsername` and no other function.
2. **23-S3-U2** a nameless session saving "Lil Orange Fox" makes exactly
   one user write (`update` or `updateMany`), `where: { id: <session user
   id> }`, `data: { displayName: 'Lil Orange Fox' }`, then
   `redirect('/puzzles')`; the value is stored trimmed; 80 code points
   are saved; a named session's save replaces its username; extra
   arguments (another id, an object) never change the target.
3. **23-S3-U3** `''`, spaces, tabs and newlines → `{ error: 'Oops! You
   need to add a username.' }`; 81 code points, or 81 letters inside
   spaces → `{ error: 'Oops! Use 80 characters or fewer.' }`; `undefined`,
   `null`, a number, an object, an array → the blank message; no write.
4. **23-S3-U4** without a session: `redirect('/')`, no write, the session
   checked before the value.

### `src/app/puzzles/actions.username-gate.test.ts` (new)

5. **23-S3-U5** every function exported by `actions.ts`, enumerated from
   the module (so a later action is covered) and including the 16 above,
   called directly with a valid session whose username is `null`, `''` or
   whitespace-only, rejects with `redirect('/')` before any Prisma call
   (every model, method and `$transaction` is one spy) and without
   `revalidatePath`.
6. **23-S3-U6** control: a named session's `createPuzzle` writes and
   `listPuzzles` reads.

### `src/app/route-guard-source.test.ts` (new)

7. **23-S3-U7** in the source (comments removed): the only `'use server'`
   modules are `app/account-actions.ts` and `app/puzzles/actions.ts`, and
   there are no inline server actions; `requireAnySession` appears only in
   `lib/require-session.ts` and `app/account-actions.ts`; `app/page.tsx`
   imports `hasUsername` from `@/lib/require-session` and calls it;
   `auth.api.getSession` appears only in `lib/require-session.ts`; the
   only route handler is `app/api/auth/[...all]/route.ts`; every page
   outside `/` has a top-level segment layout (`app/<segment>/layout.tsx`)
   that imports `@/lib/require-session` and calls `await
   requireSession()`; `puzzles` and `style-guide` have one; `@/lib/prisma`
   is imported only by `app/account-actions.ts`, `app/puzzles/actions.ts`
   and `lib/auth.ts`, so no page or component reaches the database past the
   guard.

### `e2e/username-step.spec.ts` (new)

1. **23-S3-1 the form asks for the email only:** the sign-in title
   unchanged; one textbox in the form, named "Email", placeholder "Your
   email address..."; no `sign-in-username` and no textbox named
   Username; "Send Sign-in Link"; the privacy line; the field 40px under
   the title, 400px, the button 40px under it. Sending (Enter) posts
   exactly `{ email: <trimmed>, callbackURL: '/puzzles' }` and issues a
   link. With `crossward:username` already stored, the form has one input,
   empty, the request has only `email` and `callbackURL`, and the stored
   value is unchanged or cleared; without one, none is stored.
2. **23-S3-2 a new account sees the step:** the link from the form ends
   at `/` with `username-step` ready, no sign-in form and none of the
   library, New Puzzle, editor, player or style guide; the session is the
   account's and its `displayName` is still null. The title reads "Build
   a puzzle." / "Or play a puzzle." / "Create a username.", the last in
   `primary`, the first two in `muted`; one textbox, named exactly
   "Username", editable, holding a name whose three words come from S2's
   first, second and noun lists, placeholder "Your username..."; the
   caption's text "Username", rendered "USERNAME"; "Get Started", a submit button; no privacy line. The field
   on the content edge, 400px, 40px under the title; the caption under
   the line, its right edge on the field's; the button on the content
   edge, 40px under the caption. The masthead shows Sign out and nothing
   named Account. Five loads of the step all hold valid names, not all
   the same.
3. **23-S3-3 saving:** Get Started with the suggestion goes to
   `/puzzles` (the library shown), stores that name, New Puzzle opens its
   dialog, and `/` then redirects to `/puzzles`. "  Ada Lovelace  " with
   Enter stores "Ada Lovelace". Empty, spaces and 81 code points show
   their messages in `username-input-error`, focus the field, mark it
   invalid, keep the value, stay at `/`, send no save request, store
   nothing; the error sits
   under the caption, the caption stays `muted`, and the button is 40px
   under the error; 80 code points save. A save whose request fails (500) shows the two-line alert 20px
   under the button, stays at `/` with the value and both controls
   enabled, stores nothing; a retry saves. Two tabs on the step: the
   first saves "First Tab" and moves on; the second then saves "Second
   Tab" and moves on; "Second Tab" is stored.
4. **23-S3-4 a named account goes straight in:** an account named "Grace
   Maker" signing in through the form lands on `/puzzles`, never sees the
   step, and keeps "Grace Maker".
5. **23-S3-5 the link carries no username:** a new account whose link
   (requested by hand) carries "Sneaky Name" has no username, sees the
   step, and isn't offered "Sneaky Name"; a named account's link carrying
   another name leaves its username; an older account with a blank
   username and a Better Auth name sees the step with a generated name.
6. **23-S3-6 no username, no pages** (username `null`, `''`, `' \t '`):
   an account that owns a puzzle, signed in, is shown the step at `/` for
   `/puzzles`, its own `/puzzles/<id>`, another builder's published
   `/puzzles/<id>/play` and `/style-guide`; no play session is created;
   its username is untouched.
7. **23-S3-7 no username, no actions** (a named account on an already
   loaded page loses its username in the database): Create in the
   new-puzzle dialog goes to the step and creates nothing; a letter typed
   in an open editor goes to the step and the stored grid is unchanged; a
   letter typed in an open player goes to the step and the stored entries
   are unchanged.
8. **23-S3-8 only the step sets a username:** from a nameless session,
   Better Auth's `update-user` with `{ displayName }`, `{ name }` or both
   leaves `displayName` null, and `/puzzles` still shows the step.
9. **23-S3-9 sign out from the step:** Sign out shows the ready sign-in
   form, no step, and no session.

### Amended frozen acceptance

The EPIC's decisions (email-only form, no name in the link, the hooks
and the remembered username removed, no privileges without a username)
authorize amending the frozen tests that fixed the old behavior; each
file gets a note citing 23-S3:

- **`e2e/sign-in.spec.ts`** (14-S1, frozen a225e88): header updated.
  14-S1-1: the Username field leaves the shared-edge list; "40px heading
  to username, 20px between the fields…" becomes "40px heading to email,
  40px email to button; the field 400px". 14-S1-2: "two large fields
  named Username and Email…" becomes "one large field named Email, with
  its placeholder". 14-S1-3: the empty submit shows only the email error
  and focuses Email; "editing a field clears only that field's error"
  becomes "editing the field clears its error"; the malformed-email case
  fills no username and expects exactly `{ email, callbackURL:
  '/puzzles' }`; "an 81-code-point username is refused and 80 is sent" is
  removed (23-S3-3). 14-S1-4: fills no username; "a successful send
  stores the trimmed username…" is removed (23-S3-1). 14-S1-5: no
  username and no storage checks. 14-S1-6 (username capture) is removed
  (23-S3-5). 14-S1-7: the fresh account saves its suggested username on
  the step before New Puzzle; "an account without a username also goes
  straight to the new-puzzle dialog" is removed (23-S3-6). The
  `signInThroughApi` and `storedUsername` helpers and the unused imports
  go.
- **`e2e/front-door.spec.ts`** (A2): the request case fills no username;
  the signed-in redirect case gives its account a username before
  visiting `/`.
- **`e2e/manual-login.spec.ts`** (A6): no username filled; after the link
  each submission mode saves the suggested username on the step, then
  checks the library as before.
- **`src/components/auth/sign-in-source.test.ts`** (14-S1): "the form and
  the auth hook share the rules in lib/username" becomes "the form and
  the username save share…", checking `app/account-actions.ts` instead of
  `lib/auth.ts`.
- **`src/components/ui/input-source.test.ts`** (F5): the sign-in form
  has one `TextInput` (was two), still large.
- **`src/app/puzzles/actions.{session,library-play,play-route,
  play-completion,play-entries,play-reset,unlisted}.test.ts`:** each
  signed-in mocked session's user gains a `displayName` (one line, plus a
  comment citing 23-S3). No assertion changes.

### Discrimination (2026-11-09, observed)

In a throwaway git worktree at `main` 12b3828 (runtime untouched; the new
and amended tests as above; S1's later freeze touches none of these
files):

- `npx vitest run`: 81 failed, 786 passed. Failing: `account-actions.test.ts`
  (no module); 48 of 51 in `actions.username-gate.test.ts` (every action,
  for each blank username, is served); 25 in `require-session.test.ts` (no
  username check, no `requireAnySession`, no `hasUsername`); 6 of 7 in
  `route-guard-source.test.ts`; the amended `sign-in-source` and
  `input-source` cases. Passing, as expected: the 16-action inventory, the
  two named controls, the route-handler rule, `requireSession`'s
  no-session and named cases, and the seven amended action tests (a
  `displayName` on a mocked user changes nothing on `main`). `tsc
  --noEmit` fails on `main` only because the new tests import what S3
  adds (`account-actions`, `hasUsername`, `requireAnySession`). The same
  run in the main checkout at a7155dd (S1 delivered): 81 failed, 786
  passed, the same cases. After the specification review (same day),
  the review's additions (`hasUsername` with an object, the second title
  line `muted`, the placeholder, no save request for a refused name, the
  `@/lib/prisma` import rule, the URL checks by pathname) were rerun at
  a7155dd: `npx vitest run` 82 failed, 786 passed (the import rule fails:
  no `account-actions.ts`); the three gate files 80 failed, 8 passed. The
  e2e additions sit in cases that already fail at their first step.
- `npm run test:e2e -- e2e/username-step.spec.ts e2e/sign-in.spec.ts
  e2e/front-door.spec.ts e2e/manual-login.spec.ts`: 35 failed, 12
  passed. Every new case failed except 23-S3-5's named account (main's
  first-wins hook also keeps that name); many fail at their first step
  (no email-only form, no step), and 23-S3-8 is a regression guard (on
  `main` Better Auth already drops an undeclared `displayName`). The
  amended cases failed where they meet the Username field or the step;
  setup, A2's first and amended third case and the unchanged 14-S1
  layout, copy and edit-clears cases passed.
- **Throwaway prototype, not kept** (as the Decisions: `displayName`
  declared with `input: false` and the hooks removed, the guard module,
  `account-actions.ts`, `puzzles/layout.tsx`, the email-only form, a
  `UsernameStep`, the front door and `Header` through `currentSession`,
  a minimal `caption` in `TextInput`): `tsc` and `eslint` clean; `npx
  vitest run` 885 passed; the four e2e files 47 passed; the full
  `npm run test:e2e` (before the failure-alert, caption-with-error and
  session-reader checks were added) 1290 passed, 3 failed: two
  `ECONNRESET`s from the test server and a timeout, in
  `library-play.spec.ts` and `menu-reset.spec.ts`, which then passed
  with `username-step`, `masthead`, `sign-in`, `session-validation` and
  `route-protection` (89 passed). The worktree and prototype were
  removed; the E2E lock was taken for each run.

## Repo paths

Acceptance (new): `src/lib/require-session.test.ts`,
`src/app/account-actions.test.ts`,
`src/app/puzzles/actions.username-gate.test.ts`,
`src/app/route-guard-source.test.ts`, `e2e/username-step.spec.ts`.
Amended: `e2e/sign-in.spec.ts`, `e2e/front-door.spec.ts`,
`e2e/manual-login.spec.ts`, `src/components/auth/sign-in-source.test.ts`,
`src/components/ui/input-source.test.ts`, and
`src/app/puzzles/actions.{session,library-play,play-route,play-completion,play-entries,play-reset,unlisted}.test.ts`.
Test plumbing (editable): `e2e/helpers/username-step.ts`.

Runtime: `src/lib/auth.ts`, `src/lib/require-session.ts`,
`src/app/account-actions.ts` (new), `src/app/page.tsx`,
`src/app/puzzles/layout.tsx` (new),
`src/components/auth/SignInForm.tsx`,
`src/components/auth/UsernameStep.tsx` (new),
`src/components/layout/Header.tsx`. Expected unchanged:
`src/app/puzzles/actions.ts`, `src/middleware.ts`, `prisma/**`.

Docs: this story; `../../14-screen-redesign/stories/14-S1-sign-in.md` (a
superseded-by-23-S3 note on the username field, the remembered username
and capture); `../HANDOFF.md`.

**CODE-REVIEW:** a risk story (see Blast radius): branch
`story/23-S3-email-only-sign-in`, PR, independent review. The reviewer
checks in particular that no privileged path bypasses `requireSession()`,
that `displayName` is `input: false`, and that the save writes only the
caller's row.

## Definition of done

- Frozen acceptance unchanged after freeze; S1 frozen first (its caption).
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered by PR from `story/23-S3-email-only-sign-in`, independently
  reviewed and merged; the handoff records observed results.
- The human's visual check at the epic's end: the email-only form and the
  username step against the mockups.
