# Story S5 — Changing the email

The Account details email field becomes editable. Update with a new email
sends a confirmation link to that address through Better Auth's change-email
flow; the modal then says where the link went. The account's email changes
only when the link is followed, and from then on the new email is the one it
signs in with. A username change still saves at once.

**Status: Done 2026-11-09:** implemented afcb670, PR #37 independently
reviewed (no blockers), merged 47342b6. Frozen 2026-11-09 (e8b5f6b). Approved and frozen by the orchestrating
session under the human's delegation, after an independent specification
review (no security holes; the Better Auth findings confirmed; its points
folded in). The freeze condition held: S4 (PR #36) merged, and S5's browser
cases (`e2e/account-email.spec.ts`, and the amended 23-S4-2) discriminate
against S4's merged code (see Discrimination). The amendments to
S3's and S4's frozen acceptance below were approved by the orchestrating
session under the human's delegation ([history](../HISTORY.md#orchestration))
on 2026-11-09, to take effect with this story's freeze.

**Depends on S4 (frozen 40ce315; PR #36 merged f556774; handoff 768a60e).** S5 is written against S4's frozen
specification: the Account details modal (`account-details`,
`account-username`, `account-email` with `-caption`/`-error`,
`account-update`, `account-cancel`), `changeUsername(value)`, `TextInput`'s
`readOnly`, `ModalActions`' `cancelDisabled`, the save's disabled and
non-dismissable state, `router.refresh()` after a save and focus back on
Account. S4's merged modal is `src/components/auth/AccountDetails.tsx` (the
email a `readOnly` `TextInput`). S5's branch starts from `main` at S5's frozen
baseline.

**Blast radius: a risk story.** It changes `src/lib/auth.ts` (enables Better
Auth's change-email and email-verification, closes two of its routes, adds a
wrapper) and adds an authenticated server action that starts an email change.
Per [CODE-REVIEW](../../../CODE-REVIEW.md#when-review-applies) (`auth.ts` and a
new authenticated write path are risk paths in this epic): branch
`story/23-S5-changing-the-email` from the frozen baseline, a PR, and an
independent review before merge. No `prisma/**` change (the `email` column and
`verification` table exist; the token is not stored), no
`src/middleware.ts`, `src/lib/require-session.ts` or `src/engine/**` change.

## The human's request

From the [EPIC](../EPIC.md#the-humans-request), item 5, and the human's
answers (2026-11-09):

- Account details shows the username and the email, each editable; Update is
  disabled until either value changes, then active and blue.
- An email change is confirmed by a link sent to the new address; the email
  changes only once that link is clicked. A username change saves at once.

## What the code does today

`main` at 40ce315, with S4's frozen specification for the modal.

- **Better Auth 1.7.5** (`src/lib/auth.ts`): magic link only (15 minutes,
  single use; a new account is created `emailVerified: true`), `displayName`
  declared `input: false`, 30-day sliding sessions, no cookie cache (every
  `getSession` reads the user row, email included). No `user.changeEmail`,
  no `emailVerification` options, no `disabledPaths`. So `POST
  /api/auth/change-email` answers 400 `CHANGE_EMAIL_DISABLED` and
  `/send-verification-email` 400 (no sender). `GET /api/auth/verify-email` is
  always mounted. Emails are stored lowercased (Better Auth's internal
  adapter lowercases on create, update and lookup).
- **Better Auth's change-email, as installed** (`api/routes/update-user.mjs`,
  `email-verification.mjs`), read for this story:
  - `changeEmail({ newEmail, callbackURL })` needs a fresh read of the
    session; lowercases `newEmail`; refuses the same email (400). If **any
    account already has** `newEmail` it silently returns `{ status: true }`
    and sends nothing (anti-enumeration). With neither
    `sendChangeEmailConfirmation` (a first link to the *old* address) nor
    `updateEmailWithoutVerification` set, it signs a JWT `{ email: <old>,
    updateTo: <new>, requestType: 'change-email-verification' }` with the
    auth secret, lasting `emailVerification.expiresIn` (default 1 hour), and
    calls `emailVerification.sendVerificationEmail({ user: { …, email: <new>
    }, url, token })` with `url = <base>/api/auth/verify-email?token=…&callbackURL=…`.
  - The send runs through `runInBackgroundOrAwait`, which **awaits but
    swallows errors** (logs "Failed to run background task") and still
    returns `{ status: true }`: a failed delivery is invisible to the caller.
  - `GET /verify-email` with that token: finds the account by the old email
    (none: redirect `callbackURL?error=USER_NOT_FOUND`); a session in that
    browser for a different email: `?error=INVALID_USER`; otherwise, with no
    session it **creates one for the account**; it sets `email: <new>,
    emailVerified: true`, sets the session cookie and redirects to
    `callbackURL`. Expired or tampered: `?error=TOKEN_EXPIRED` /
    `INVALID_TOKEN`. The token is stateless; once the email has changed the
    old email no longer matches, so a link works once in practice.
  - `disabledPaths` closes a route to HTTP (404) in the router only;
    `auth.api.*` calls on the server still work.
  - Configuring `sendVerificationEmail` also arms `POST
    /send-verification-email` (anyone may ask it to mail an *unverified*
    account) and the email-and-password/social sign-up paths (not enabled
    here).
- **Email delivery** (`src/lib/email.ts`): `sendMagicLink(email, url)` only:
  Mailpit's send API in local development (`NODE_ENV=development`, no
  `VERCEL`), Resend with a key in production, nothing in unit tests or keyless
  production (the E2E harness: `NODE_ENV=production`, `RESEND_API_KEY=''`,
  fixed test-only `BETTER_AUTH_SECRET`; [DEVELOPMENT](../../../DEVELOPMENT.md#e2e-environment)).
  Failures throw without the link. Frozen: `src/lib/email.test.ts` (A6).
- **Email rules** (`src/lib/username.ts`): `emailError(value)`: blank (or not
  a string) → "Oops! You need to add an email address."; no single `@`, an
  empty local part, a domain without an inner dot, or whitespace → "Oops!
  That doesn't look like an email address."
- **Account details (S4, frozen):** the email field is shown read-only
  (`readOnly`), never differs, never enables Update; Update saves a username
  change through `changeUsername` and closes. Frozen tests pin the read-only
  field (23-S4-2) and the action module's exports (23-S3-U1, 23-S4-U1).
- **The guard** (`require-session.ts`): `requireSession()` admits only an
  account with a username; Better Auth's own routes are reachable by any
  session (23-S3's recorded narrowing).

## Decisions

From the human and the EPIC:

- **The email field is editable;** Update is enabled while either field
  differs from the value it opened with, then blue; changing both back
  disables it.
- **An email change is confirmed by the new address.** Update sends a
  confirmation link to the new email; the account's email changes only when
  that link is followed. Until then, sign-in uses the old email.
- **A username change saves at once** (S4).
- **After Update with an email change** the modal's body is replaced by
  "Check <new email> for a link to confirm your new email." and a Close
  button. An email already used by another account, or a failure, shows an
  error under the field and keeps the user's input. Errors use `TextInput`'s
  error line and the existing email messages.

Delegated (decided in drafting):

- **Better Auth's change-email, new-address flow only.** `auth.ts` sets
  `user.changeEmail: { enabled: true }` with neither
  `sendChangeEmailConfirmation` (that would mail the *old* address first,
  which the human did not ask for) nor `updateEmailWithoutVerification`, and
  `emailVerification: { expiresIn: 15 * 60, sendVerificationEmail }`, whose
  sender mails `user.email` (the new address, as Better Auth passes it) with
  a new `sendEmailChangeLink(email, url)` in `src/lib/email.ts`. The token
  and the verify route are Better Auth's; nothing is stored.
- **The link lasts 15 minutes,** like the sign-in link: following it can
  sign a browser in (below), so it is as short-lived as a sign-in link.
- **Better Auth's own routes stay closed.** `disabledPaths: ['/change-email',
  '/send-verification-email']`: the HTTP routes answer 404, so the server
  action below is the only way to start a change (it is username-gated and
  checks for an email in use, which the raw route doesn't), and no one can
  ask the app to mail an arbitrary unverified account. `/verify-email` stays
  open (the link needs it).
- **A failed delivery is reported.** Because Better Auth swallows send errors,
  `auth.ts` exports `startEmailChange(headers, newEmail)`: it calls
  `auth.api.changeEmail({ headers, body: { newEmail, callbackURL: '/puzzles'
  } })` and **resolves with nothing** once the link was handed to the
  sender and delivered. It **rejects** if delivery failed, and also **unless
  the sender was actually called**: Better Auth answers success without
  sending when the address already has an account, so an account that takes
  the address after the action's in-use check (a race) is a rejection, not
  a false "Check …". An address Better Auth's own validation refuses (its
  `z.email()`, stricter than `emailError`, e.g. `a..b@x.co`) rejects with
  Better Auth's 400 `APIError`, passed through. (E.g. the sender marks a
  request-scoped `AsyncLocalStorage` record "called" and "failed", which the
  wrapper checks; the mechanism is the implementer's, the behavior is pinned
  by 23-S5-A1.)
- **The server action, `changeEmail(value)`,** in
  `src/app/account-actions.ts` (`'use server'`, beside `changeUsername`):
  `requireSession()` first (only an account with a username; anything else
  `redirect('/')`, nothing looked up or sent); then `emailError(value)`
  (returns `{ error }`); then the value trimmed and lowercased; the account's
  own email (compared lowercased) returns `{ error: "Oops! That's already
  your email." }`; an email another account has returns `{ error: "Oops!
  Another account already uses that email." }` (one Prisma lookup; the
  caller's own row counts as "the same", not "in use"); then
  `startEmailChange(await headers(), email)`; a rejection with Better Auth's
  400 `APIError` (an address its validation refuses) returns `{ error:
  "Oops! That doesn't look like an email address." }` (the existing shape
  message); any other rejection returns `{ error: 'Could not send the
  confirmation link. Please try again.' }`; success
  returns `{ ok: true }`, no redirect. It writes nothing itself, takes no user
  id and ignores extra arguments. `@/lib/prisma` stays imported only where
  23-S3-U7 allows.
- **"In use" is shown, not hidden** (accepted, untested beyond the message
  itself; for the human's check). The EPIC asks for the error. This tells a
  signed-in, named user whether an email has an account, which Better Auth's
  route deliberately hides.
- **No rate limit on the action** (accepted risk, untested; for the human's
  check). A signed-in, named user can call `changeEmail` repeatedly: each
  call does one lookup and may send one email. Better Auth's rate limiter
  covers its HTTP routes, not `auth.api` calls from a server action.
- **A stolen session can move the account** (accepted, untested; for the
  human's check). With confirmation by the new address only (the human's
  choice), whoever holds a session can move the account to an address they
  control. Notifying, or asking, the old address first (Better Auth's
  `sendChangeEmailConfirmation`) is a possible follow-up.
- **Following the link** lands on `/puzzles` (`callbackURL`). In the browser
  that asked, the session continues with the new email. In a browser with no
  session, Better Auth signs that browser in to the account (the new address
  has just proved itself, as a sign-in link would). In a browser signed in to
  another account, nothing changes. An expired, used or tampered link changes
  nothing. **Signing a signed-out browser in** is accepted (Better Auth's
  behavior; pinned by 23-S5-A2; for the human's check). **No page or message
  reports any of these** (accepted, untested; for the human's check): an
  expired or invalid link lands silently on the library, and Account
  details shows the email as it is.
- **"Differs" is exact** for the email too (S4's rule): a trailing space or
  another case enables Update. **Whether an email is sent** compares the
  trimmed, lowercased value with the current email: equal is no email change,
  nothing is sent for it (if the username also didn't change, Update just
  closes the modal, sending nothing).
- **The client checks the rules first:** `usernameError` for a changed
  username, `emailError` for a changed email. Each failure shows its message
  on its own field's error line and marks it invalid; focus goes to the first
  invalid field (username first); the values are kept; nothing is sent.
  Editing a field clears its error.
- **Both fields changed:** the username saves first (`changeUsername`, as in
  S4); if that returns an error or fails, it shows as in S4 and the email is
  not sent. Then `changeEmail`. If the email is refused or fails, the
  username stays saved (the modal now treats the saved username as its
  opened value; the page refreshes as in S4) and the email's error shows; the
  email value is kept, Update stays enabled, focus on the email field; a
  retry sends only the email. Two server actions in that order (not merged
  into one).
- **Errors from the email request:** a returned `{ error }` shows that
  message; a request that fails (the action throws or the request fails)
  shows "Could not send the confirmation link. Please try again." Both on
  `account-email-error`, the field focused and invalid, the value kept,
  everything re-enabled.
- **While sending,** both fields, Update and Cancel are disabled and the
  modal can't be dismissed (S4's saving state, extended to the email field).
- **The sent state:** the same dialog ("Account details", gray header, ✕);
  the fields, Update and Cancel are replaced by the message, `body-normal`,
  `primary`, the address trimmed and lowercased (as it will be stored),
  wrapping inside the panel however long the address; and a Close button, the
  primary `Button` in the footer, focused. Close, ✕ and Escape close the modal
  with focus back on Account; the page stays (no navigation). Reopening shows
  the fields again with the current (old) email and Update disabled. After a
  username save in the same Update, the page has already refreshed.
- **The confirmation message** (`sendEmailChangeLink`): to the new address;
  subject "Confirm your new Crossward email"; text "Confirm your new email for
  Crossward by opening this link:\n\n<url>\n\nIt expires in 15 minutes. Until
  then, sign in with your current email.\n\nIf you didn't ask for this, ignore
  this email." Same senders and routes as the
  sign-in link; a failure throws without the link. The sign-in message is
  unchanged.
- **Test ids (new):** `account-email-sent` (the message), `account-close`
  (Close). S4's ids are unchanged.
- **Concurrency:** two requests before confirming each send a link; whichever
  is followed first wins and the other then finds no account with the old
  email (no change). An address that gains an account between the request
  and the click makes the click fail without a change (Better Auth's update
  hits the unique email); one that gains it between the check and the send
  is a send failure (the wrapper's "sender called" rule). **A stale second
  link** (accepted, untested; for the human's check): the token names the
  old email, not the account, so if, within its 15 minutes, a new account is
  created at the old address (by whoever controls that inbox), following the
  other link moves *that new* account to the other link's address (if still
  free) and, in a signed-out browser, signs the follower in to it. It needs
  the holder of the second new address to act within 15 minutes; the
  holder of the old inbox started that account themselves.

## Non-goals

- Confirming from, or notifying, the old address; a page or message after
  following the link (success or failure); resending or cancelling a pending
  change; showing a pending change.
- Changing the sign-in link, its wording or lifetime, the session length, the
  username rules or messages, the email rules or their messages.
- Ending other sessions when the email changes.
- Opening Better Auth's other email features (email-and-password, OTP,
  social sign-in) or `update-user` changes.
- Unique usernames; showing the username or email anywhere new.
- A profile page or `/account` route.

## Acceptance (frozen 2026-11-09)

Viewport 1280×800 for the browser cases. Each case signs in its own account
by database token through S3's editable helper `e2e/helpers/username-step.ts`;
no email is sent. The link a browser case follows is built by the new editable
helper `e2e/helpers/email-change.ts` exactly as Better Auth builds it, with the
harness's test-only secret (the harness sends no email and Better Auth keeps
no copy); that the app really mails that link, to the new address only, is
proven in-process by 23-S5-A1.

### `src/lib/auth.change-email.test.ts` (new)

The app's real `auth.ts`, in-process, over Better Auth's memory adapter in
place of Prisma (the only replacement), mail captured at Mailpit's transport
(`fetch` stubbed, development mode):

1. **23-S5-A1** `startEmailChange(session headers, 'new@example.test')`
   resolves, posts exactly one message, to the new address only, subject
   naming confirming the email, holding `<origin>/api/auth/verify-email` with
   a token and `callbackURL=/puzzles`; the account's email is unchanged; the
   token lasts 15 minutes; when delivery fails it rejects (the send was
   attempted, to the new address) and nothing changes; for an address another
   account has (Better Auth's silent success) it rejects and sends nothing;
   for `a..b@x.co` (which `emailError` accepts) it rejects with a 400 and
   sends nothing.
2. **23-S5-A2** following the link: in the asking browser, 302 to `/puzzles`,
   the account (same id) has the new email, verified, and the session
   continues with it; with no session, the email changes and that browser is
   signed in to the account; again: `/puzzles?error=…`, no change; afterwards
   a sign-in link to the new email reaches the account and one to the old
   email does not; until followed, the old email still signs in to the
   account; a browser signed in to another account: `?error=…`, no change; a
   link re-signed with another secret, or 16 minutes old: `?error=…`, no
   change.
3. **23-S5-A3** `POST /api/auth/change-email` with a session sends nothing and
   changes nothing (not 2xx); `POST /api/auth/send-verification-email` for an
   unverified account sends nothing (not 200); `user.changeEmail.enabled` is
   true, no `sendChangeEmailConfirmation`, `updateEmailWithoutVerification`
   not true.

### `src/lib/email.change-email.test.ts` (new)

4. **23-S5-E1** `sendEmailChangeLink(newEmail, url)`: in local development one
   Mailpit message from `login@crossward.app` to the new address, subject
   naming confirming the email (not "sign-in link"), text holding the link,
   "15 minutes" and "If you didn't ask for this, ignore this email.", Resend untouched even with a key; in production with a key,
   Resend to the new address with the link; nothing in keyless production or
   unit tests; an inbox or provider failure rejects (after trying) without the
   link in the error.

### `src/app/account-actions.change-email.test.ts` (new)

5. **23-S5-U1** the module exports `changeEmail`, `changeUsername` and
   `saveUsername` and no other function.
6. **23-S5-U2** a named session asking for "new@example.test" calls
   `startEmailChange(<request headers>, 'new@example.test')` once and resolves
   `{ ok: true }`, no redirect, no write; the value is trimmed and lowercased;
   extra arguments never change who it acts for.
7. **23-S5-U3** `''`, spaces, tabs and newlines → the blank email message;
   no `@`, no dot in the domain, two `@`, an inner space → the shape message;
   `undefined`, `null`, a number, an object, an array → the blank message;
   nothing sent or written.
8. **23-S5-U4** the account's own email (exactly, in another case, with
   spaces; the lookup finding the caller's own row) → "Oops! That's already
   your email."; an email another account has, in any case → "Oops! Another
   account already uses that email."; nothing sent; a free email is sent.
9. **23-S5-U5** `startEmailChange` rejecting with an `Error`, or with Better
   Auth's 500 `APIError` → "Could not send the confirmation link. Please try
   again.", no write; rejecting with Better Auth's 400 `APIError` (for
   `a..b@x.co`) → "Oops! That doesn't look like an email address."
10. **23-S5-U6** no session, or a username `null`, `''`, whitespace or
    missing: `redirect('/')`, no lookup, nothing sent; the session checked
    before the value.

### `e2e/account-email.spec.ts` (new)

1. **23-S5-1 the email field is editable:** one textbox named exactly
   "Email", holding the account's email, editable, no `readonly`; the username
   field still focused on open. A different email enables Update, filled
   `button-fill`; the original disables it; a trailing space, another case or
   an emptied field enables it. With Update disabled, Enter in the email field
   sends no server action and the modal stays. Cancel after an edit sends
   nothing, the email is unchanged, and reopening shows it with Update
   disabled.
2. **23-S5-2 asking:** "  <NEW EMAIL IN CAPITALS> " and Update: exactly one
   server action; the dialog (still "Account details") shows
   `account-email-sent` "Check <new email, lowercased> for a link to confirm
   your new email." and Close (`account-close`, focused); no fields, Update
   or Cancel; the stored email unchanged and no account for the new one.
   Close: the modal closes, focus on Account, still `/puzzles`, a `window`
   marker survives; reopening shows the old email, Update disabled. ✕ and
   Escape close the message too, focus on Account. At 375px a 100-character
   address wraps inside the panel, no overflow. Enter in the email field does
   what Update does. The own email in capitals with spaces: the modal closes,
   no server action, nothing changes. While a request is held, both fields,
   Update and Cancel are disabled and Escape doesn't close the modal; once released
   the message shows.
3. **23-S5-3 following the link:** after asking in the UI, the link (built by
   the helper) in the same browser lands on `/puzzles`; the account (same id)
   has the new email and its username; its seeded puzzle is still listed;
   Account details shows the new email. Afterwards a sign-in link to the new
   email reaches the account, one to the old email starts a new, nameless
   account (the username step). Of two links (two requests made in the UI),
   the one followed
   first wins and the other then changes nothing.
4. **23-S5-4 both fields changed:** "Ada Lovelace" and a new email, Update:
   the message shows; exactly two server actions; "Ada Lovelace" is stored,
   the email unchanged; the builder column shows "Ada Lovelace"; Close, focus
   on Account; reopening shows "Ada Lovelace", the old email, Update disabled.
5. **23-S5-5 errors:** empty, spaces, "ada.example.test" and "ada@example"
   show their messages in `account-email-error` (in `error`, under the
   caption), focus the email field, mark it invalid, keep the value, send no
   server action, change nothing; editing clears the error. An empty username
   and a malformed email together show both errors, focus the username field
   and send nothing. Another account's email, in capitals: "Oops! Another
   account already uses that email." there, the field focused, the value kept,
   Update enabled, no message, nothing changed for either account. With a new
   username and an email in use: the username is stored, the email error
   shows, the username has no error. A request that fails (500): "Could not
   send the confirmation link. Please try again." there, the value kept,
   everything enabled, the email field focused, nothing changed; a retry shows
   the message.
6. **23-S5-6 only a named account:** with an email edited, the account's
   username is removed in the database; Update goes to the username step at
   `/`; nothing changes.

### Amended frozen acceptance

The EPIC's decision (the email is editable and an email change is confirmed
by the new address) and S4's own note ("read-only until S5") authorize these
minimal amendments, approved by the orchestrating session under the human's
delegation ([history](../HISTORY.md#orchestration)) on 2026-11-09, to take
effect with this story's freeze. Each file gets a note citing 23-S5, and the
S4 story's acceptance text notes them at 23-S4-U1 and 23-S4-2:

- **`src/app/account-actions.test.ts`** (23-S3, amended by 23-S4): 23-S3-U1
  "exports saveUsername and changeUsername and no other action" becomes
  "exports saveUsername, changeUsername and changeEmail and no other action";
  the sorted list gains `'changeEmail'`. Nothing else changes.
- **`src/app/account-actions.change-username.test.ts`** (23-S4): 23-S4-U1 the
  same: the list becomes `['changeEmail', 'changeUsername', 'saveUsername']`.
- **`e2e/account-details.spec.ts`** (23-S4): the header comment's "read-only
  until S5" becomes "editable (23-S5)". In 23-S4-2, the block
  "Read-only, not disabled: enabled, focusable, not editable" (`toBeEnabled`,
  `toHaveAttribute('readonly', '')`, `not.toBeEditable()`) and the later
  focus-and-type check (`focus`, `toBeFocused`, `keyboard.type('x')`,
  `toHaveValue(email)`) become `toBeEnabled()` and `toBeEditable()`, keeping
  `focus()` and `toBeFocused()`; only the `readonly`, not-editable and
  typing-leaves-it lines go (the editing itself is 23-S5-1). Nothing else
  changes.

Unchanged and still required: every other 23-S4 case (a username-only Update
still sends exactly one action and closes), 23-S3-U7 (the `'use server'`
modules, `@/lib/prisma` importers, `requireAnySession`), `src/lib/email.test.ts`
(A6, the sign-in message), `e2e/username-step.spec.ts` and the sign-in specs.

### Discrimination (2026-11-09, observed)

In a throwaway worktree at `main` 40ce315 (S4 frozen, not implemented),
after the specification review's revisions:

- `npx vitest run` on the three new unit files: **47 failed, 2 passed.**
  Failing: every 23-S5-U case ("account-actions exports no changeEmail"),
  all four 23-S5-E1 cases ("lib/email exports no sendEmailChangeLink"; the
  failure case also requires the send to be attempted), every 23-S5-A1 and
  A2 case ("lib/auth exports no startEmailChange"; the silent-success case
  first requires a free address to resolve, the invalid-address case a 400),
  and A3's configuration case. Passing as regression guards: A3's two
  closed-route cases (at `main` both routes are closed: 400).
- The amended files `account-actions.test.ts` and
  `account-actions.change-username.test.ts`: **23 failed, 17 passed**; the
  failures are the two amended U1 cases (no `changeEmail`) and S4's pending
  `changeUsername` cases; S3's other cases pass.
- **Throwaway prototype, not kept** (`auth.ts`: `changeEmail.enabled`,
  `emailVerification` with a 15-minute `expiresIn` and a sender marking a
  request-scoped `AsyncLocalStorage` record "called"/"failed",
  `disabledPaths`, `startEmailChange` rejecting on failure or no call;
  `email.ts`: `sendEmailChangeLink`; `account-actions.ts`: `changeEmail`
  mapping a 400 to the shape message, and a stub `changeUsername`): the three
  new files and the amended `account-actions.test.ts` **67 passed**, three
  runs. The whole unit suite with the first prototype: 930 passed, 27 failed,
  all S4's pending cases, none in S5's files or in `email.test.ts`,
  `sign-in-source.test.ts`, `route-guard-source.test.ts` or
  `require-session.test.ts`.
- Mutations of the prototype: **without `disabledPaths`**, both A3 route
  cases fail; **without the "sender called" rule**, the silent-success A1
  case fails; **without the 400 mapping**, the U5 invalid-address case fails.
- `tsc --noEmit`: only S4's expected `headerVariant` error. `eslint` on the
  new and amended test files: clean.

**Browser discrimination, on S4's merged code** (2026-11-09, `main` 768a60e
in the same throwaway worktree, the draft carried over without conflicts;
`COMPOSE_PROJECT_NAME=crossward-raptor`, the E2E lock held;
`npm run test:e2e -- e2e/account-email.spec.ts e2e/account-details.spec.ts
--project=setup --project=authenticated`):

- **At 768a60e: 17 failed, 19 passed.** Failing for the right reason: the
  amended 23-S4-2 and 23-S5-1's first case at `toBeEditable()` (the email is
  read-only); every other 23-S5-2, -4, -5, -6 case and 23-S5-3's first at
  `locator.fill` on the read-only email (timeout). Passing: S4's other 17
  cases, and two 23-S5-3 cases that followed a helper-built link without
  asking in the UI (Better Auth's verify route is always mounted, so they
  tested only it).
- **Spec change from this:** those two cases now ask in the UI first (a
  local `askFor` helper; the two-links case asks twice), so the confirmation
  path is reached only after the app's request. Rerun at 768a60e: all three
  23-S5-3 cases fail at `locator.fill` (3 failed, setup passed).
- **Throwaway prototype, not kept** (the server prototype above, without the
  stub, and an `AccountDetails.tsx` with an editable email, both fields'
  errors, username-then-email sequencing, the sent state and Close): the two
  files **36 passed** (exit 0), first run; 23-S5-3 after the spec change 3
  passed. `tsc --noEmit` clean; the five unit files 89 passed.
- **Unit files at 768a60e:** the three new files **47 failed, 2 passed** (as
  at 40ce315: the two A3 closed-route guards pass); the amended
  `account-actions.test.ts` and `account-actions.change-username.test.ts`
  **2 failed, 38 passed** (only the two amended U1 export lists, which lack
  `changeEmail`).
- Runtime reverted after each prototype run (`git status`: only the draft's
  tests, helper and story docs). The worktree uses an APFS clone of the
  checkout's `node_modules` (Turbopack refuses a symlink pointing outside the
  project); it is ignored by git.

## Repo paths

Acceptance (new): `src/lib/auth.change-email.test.ts`,
`src/lib/email.change-email.test.ts`,
`src/app/account-actions.change-email.test.ts`, `e2e/account-email.spec.ts`.
Amended: `src/app/account-actions.test.ts`,
`src/app/account-actions.change-username.test.ts`,
`e2e/account-details.spec.ts`. Test plumbing (editable, new):
`e2e/helpers/email-change.ts`; reused unchanged:
`e2e/helpers/username-step.ts`.

Runtime: `src/lib/auth.ts`, `src/lib/email.ts`, `src/app/account-actions.ts`,
`src/components/auth/AccountDetails.tsx` (S4's modal). `src/components/ui/TextInput.tsx` only if S4's field needs a
change to become editable. Expected unchanged:
`src/lib/require-session.ts`, `src/middleware.ts`, `prisma/**`,
`src/app/puzzles/actions.ts`, `src/lib/username.ts`.

Docs: this story; `../HANDOFF.md`; `docs/DEVELOPMENT.md` (the local inbox
section: an email-change confirmation is also captured in Mailpit).

**CODE-REVIEW:** a risk story (see Blast radius): branch
`story/23-S5-changing-the-email`, PR, independent review. The reviewer checks
in particular: no `sendChangeEmailConfirmation`/`updateEmailWithoutVerification`;
`/change-email` and `/send-verification-email` closed over HTTP;
`changeEmail` uses `requireSession()` and never writes the email itself; the
only writer of `User.email` is Better Auth's verify route; the link's lifetime
is 15 minutes; a delivery failure surfaces; no link or address is logged.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- A manual check in development: Update with a new email puts the message in
  Mailpit, addressed to the new email; following it changes the email and the
  next sign-in link to the new address reaches the account.
- Delivered by PR from `story/23-S5-changing-the-email`, independently
  reviewed and merged; the handoff records observed results.
- The human's visual check at the epic's end: the sent state against the
  modal's look, and the accepted decisions below, which the human may
  overrule.

## Accepted decisions for the human's check (untested unless noted)

Accepted by the orchestrating session after the specification review; each
is listed for the human's check at the epic's end:

1. **"Already in use" is shown,** as the EPIC asks, though it tells a
   signed-in, named user that an account has that email (Better Auth's route
   hides it). The message is tested; the disclosure is the accepted part.
2. **No rate limit on `changeEmail`:** an accepted risk.
3. **A stale second link** can move an account newly created at the old
   address within the link's 15 minutes (see Concurrency).
4. **An expired or invalid link lands silently** on the library, with no
   message.
5. **Following the link in a signed-out browser signs that browser in**
   (Better Auth's behavior; pinned by 23-S5-A2).
6. **A stolen session can move the account,** since only the new address
   confirms. Notifying or asking the old address is a possible follow-up.

## Implementation verification (2026-11-09, observed)

On `story/23-S5-changing-the-email` from the frozen baseline e8b5f6b, the
implementation's tree before commit (frozen acceptance unchanged: `git diff
e8b5f6b` over every acceptance path empty):

- `npm run verify`: exit 0 (`tsc`, lint with the 2 known warnings outside the
  epic, 961 unit tests in 76 files).
- Full `npm run test:e2e` (E2E lock held, `COMPOSE_PROJECT_NAME=crossward-raptor`):
  1338 passed, 3 failed, none in S5's paths: 18-S5-5 (`done-icon.spec.ts:398`,
  the rounded-corner pixel, as recorded at S1) and two `ECONNRESET`s in API
  requests (`row-menu.spec.ts:439`, `status-icons.spec.ts:310`). The three
  files rerun: `row-menu` and `status-icons` passed, `done-icon` 18-S5-5 failed
  again on the same pixel (244,244,229); `done-icon.spec.ts` alone then passed
  8 of 8 twice. Every `account-email` and `account-details` case passed.
- Changed paths: `src/lib/auth.ts`, `src/lib/email.ts`,
  `src/app/account-actions.ts`, `src/components/auth/AccountDetails.tsx`,
  `docs/DEVELOPMENT.md` (the local inbox note), this section. None of
  CODE-REVIEW's listed paths; `auth.ts` and the new authenticated action are
  this epic's risk paths, so the branch, PR and independent review apply as
  declared. No scope additions: `email.ts` shares one delivery routine between
  the sign-in and confirmation messages (the sign-in message unchanged, A6
  passes); `TextInput`'s `readOnly` (S4) is now unused and left in place.
