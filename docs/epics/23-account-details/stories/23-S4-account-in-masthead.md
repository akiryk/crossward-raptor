# Story S4 — Account in the masthead

Signed in with a username, the masthead reads "Account | Sign out". Account
opens the Account details modal, in the Modal's new gray header option: the
username, editable, and the email, read-only until S5, each with its caption
under the line; Update and Cancel. Update is enabled only while the username
differs from the saved one; it saves the change at once and closes the
modal, leaving the user on the page they were on.

**Status: Frozen 2026-11-09.** Approved and frozen by the orchestrating
session under the human's delegation ([history](../HISTORY.md#orchestration)),
after an independent specification review (three blockers fixed; its
non-blocking points folded in), with the amended earlier acceptance below.

**Depends on S1 (delivered a7155dd) and S3 (frozen 2dcb6cb; merged
61c17d0, handoff f39ac07).** The fields use S1's `caption` prop on `TextInput`
(under the line, `${data-testid}-caption`, `aria-hidden`, the field named by
the caption's text). The save follows S3's username save and guard
(`src/app/account-actions.ts`, `src/lib/require-session.ts`). S4's branch
starts from `main` at S4's frozen baseline.

**Blast radius: a risk story.** It adds an authenticated write (a second
username save) to `src/app/account-actions.ts` and amends one frozen S3 unit
test (23-S3-U1). Per [CODE-REVIEW](../../../CODE-REVIEW.md#when-review-applies)
(a new authenticated write path is a risk path in this epic): branch
`story/23-S4-account-in-masthead` from the frozen baseline, a PR, and an
independent review before merge. No `src/lib/auth.ts`, `prisma/**`,
`src/middleware.ts` or `src/engine/**` change.

## The human's request

From the [EPIC](../EPIC.md#the-humans-request), items 4 and 5, and the
human's answers:

- "Account | Sign out" at the upper right; Account a link-style button in
  `gray-500`; between the two a 1px `line-muted` divider, 18px high, 10px
  each side (21px between the words).
- Account opens the existing modal with a new, constrained header option
  (not an arbitrary color): a `gray-200` header in place of the yellow,
  the title's size and color unchanged. Title "Account details"; username
  and email fields filled with the current values; Update and Cancel.
  Update is disabled until a value changes, then active and blue.
- A username change saves at once. (An email change, confirmed by a link to
  the new address, is S5.)

## What the code does today (`main`, S3 merged at 61c17d0)

- **The masthead** (`Header.tsx`, a server component): `currentSession()`;
  any session (named or not) shows `SessionRenewal` and `SignOutButton`, the
  masthead's `action`. `Masthead` (`Masthead.tsx`) lays the logo and `action`
  out with `justify-between`; `MastheadAction` is the link-looking button
  (`text-button-normal text-link-muted`, `button-hover` on hover and keyboard
  focus over 150ms). Frozen tests: `e2e/masthead.spec.ts` (F7: Sign out
  `link-muted`, 20px from the right, centred on the logo; the style guide's
  masthead samples) and 23-S3-2 (the step's masthead: Sign out, nothing named
  Account).
- **The Modal** (`Modal.tsx`): one header look, `bg-modal-title-background`
  (`yellow-bright`), the title `text-title-3 text-primary`, the ✕ close;
  Escape, the backdrop and ✕ call `onClose` unless `dismissalDisabled`;
  initial focus on a `data-modal-initial-focus` child's control, else the
  panel; 300–500px wide. `ModalActions` renders confirm (primary `Button`)
  then cancel (`alternate`); cancel has no disabled state.
- **`TextInput`**: `caption` (S1), `error` (its error line, `aria-invalid`,
  `${data-testid}-error`), `disabled` (50% opacity); no read-only state.
- **The username save** (`account-actions.ts`, S3): `saveUsername(value)`
  admits any session (`requireAnySession`), checks `usernameError`, writes
  only the caller's `displayName` (trimmed), then `redirect('/puzzles')`.
  23-S3-U1 pins it as the module's only export; 23-S3-U7 pins the two
  `'use server'` modules and `requireAnySession`'s two files.
- **The username is shown** in the library's builder column
  (`puzzle-builder-name`), read on the server when `/puzzles` renders. The
  session carries `displayName` (S3: no cookie cache, read with the session).
- **Tokens:** `gray-200` (#dde0e6) is `line-muted`, `fill-muted`; `gray-500`
  (#8b909a) is `button-alternate-border`, `button-alternate-hover`,
  `progress-fill`; no text style is `gray-500`. The token inventories are
  frozen in `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`
  (and the style guide's swatches).

## Decisions

From the human and the EPIC:

- **The masthead, signed in:** "Account", the divider, "Sign out", in that
  order at the right. Account in `gray-500`; the divider a filled element
  1px wide, 18px
  high, `line-muted`, 10px from each word. Sign out unchanged.
- **Account opens the Account details modal,** not a page.
- **The header option is a small named set:** `headerVariant`, `'default'`
  (the yellow, every existing modal) or `'gray'` (`gray-200`); not a color
  value. Existing modals don't change. The title's size and color are the
  same in both.
- **Account details:** title "Account details"; a username field and an
  email field, each with the current value and its caption under the line;
  Update (the primary `Button`) and Cancel (the alternate look).
- **Update is disabled** until a field's value differs from the value it
  opened with; then enabled, blue; changing it back disables it again.
- **Cancel** closes without saving; reopening shows the saved values.
- **A username change saves at once.** The email is shown read-only until
  S5. Errors use `TextInput`'s error line and the existing messages.
- **No Account on the username step** (S3): an account without a username
  sees Sign out only.

Delegated (decided in drafting):

- **A second action, `changeUsername(value)`,** in
  `src/app/account-actions.ts`, rather than reusing `saveUsername`.
  `saveUsername` is the step's: it admits a nameless session and ends with
  `redirect('/puzzles')`, which from the masthead would throw a user out of
  the editor or player they're in. `changeUsername`:
  `requireSession()` first (only an account with a username; anything else
  `redirect('/')`, nothing written, so a nameless account still has the
  step as its one way in); then `usernameError(value)` (a non-string, blank
  or over 80 code points returns `{ error: message }`, nothing written);
  then one write keyed by the session user's id alone, setting only
  `displayName` to the trimmed value; returns `{ ok: true }`; no redirect.
  It takes no user id and ignores extra arguments. It saves a value equal to
  the current one like any other (the client never sends one).
  `requireAnySession` stays `saveUsername`'s alone. 23-S3-U1 is amended to
  allow the two exports; 23-S3-U7 is unchanged and still holds.
- **"Has a username"** is S3's `hasUsername(session)`: the Header shows
  Account and the divider only when it is true. The modal opens with
  `session.user.displayName` and `session.user.email`, passed from the
  Header (no extra query).
- **The tokens:** two new color styles, as earlier stories added theirs:
  `masthead-account` → `gray-500` (Account's text) and
  `modal-title-background-gray` → `gray-200` (the gray header). The
  divider is `line-muted`. The frozen inventories gain both (amended, see
  below), and the style guide's color catalog shows them.
- **Account looks like Sign out but gray:** `button-normal`, no fill,
  border or underline; hover and keyboard focus turn it `button-hover` over
  150ms like Sign out, and keyboard focus shows the focus ring. A
  `<button>` named "Account". The divider is decorative (`aria-hidden`),
  centred on the logo with both words.
- **The ✕ stays** (the orchestrator's decision, 2026-11-09).
- **Cancel is the alternate look at rest** (the orchestrator's decision):
  the mock's darker gray is the alternate's hover look.
- **Disabled Update keeps the app-wide disabled look** (the primary at half
  opacity; the mock shows light gray). The orchestrator's decision; no test
  pins the look, and the human may overrule it at the visual check.
- **The modal's layout** (as mocked): regular fields (`body-normal`),
  360px wide (narrower only when the window is), on one left edge; the
  username field first, its "USERNAME" caption under the line; the email
  field 20px under that caption, its "EMAIL" caption under its line. The
  footer: Update then Cancel, left-aligned, as every modal's footer. The ✕
  close stays in the header (the Modal's; the mockup omits it): ✕, Escape
  and the backdrop close like Cancel. The username field is focused when
  the modal opens.
- **The email field is read-only** (`TextInput` gains `readOnly`: the
  native attribute, the field's normal look, focusable and selectable, not
  editable); in S4 its value never differs, so it never enables Update. S5
  makes it editable.
- **"Differs" is exact:** the field's text against the username it opened
  with, character for character, so "Ada " differs from "Ada" (the save
  stores it trimmed); an emptied field differs too (Update then shows the
  blank message).
- **Enter does what Update does,** and nothing while Update is disabled
  (no request). The client checks `usernameError` first: the
  message on the username field's error line, the field focused and
  invalid, the value kept, nothing sent. Editing the field clears its
  error. A save that returns `{ error }` shows that message the same way.
  A save that fails (the action throws or the request fails) shows "Could
  not save your username. Please try again." on the same line (the step's
  two lines as one, as the EPIC asks for the error line), keeps the value
  and re-enables everything, with focus on the username field; a retry
  saves.
- **While saving:** the username field, Update and Cancel are disabled and
  the modal can't be dismissed (`dismissalDisabled`, so ✕, Escape and the
  backdrop do nothing). `ModalActions` gains an optional `cancelDisabled`.
- **After a save** the modal closes, the page stays where it is (no
  navigation) and refreshes its server data (`router.refresh()`), so the
  masthead's next opening and the library's builder column show the new
  name without a full reload (client state, such as an editor's unsaved
  typing, survives).
- **Focus:** after Cancel, ✕, Escape or a successful save, focus returns
  to the Account button, also after the refresh.
- **Values and concurrency:** the modal opens with the values the page
  last rendered (no fetch on open). Two tabs saving: the later save wins,
  as for S3's step. Not tested.
- **Test ids:** `account` (the masthead button), `masthead-divider`;
  `account-details` (the dialog), `account-username`, `account-email`
  (`-caption`, `-error` from `TextInput`), `account-update`,
  `account-cancel`.
- **The style guide's masthead sample** stays as it is (F7-7 pins it).

## Non-goals

- Changing the email (S5): no email request, confirmation or message.
- Showing the username anywhere new (the masthead says "Account").
- Any header color beyond the default and gray; a header without ✕.
- Changing `Button`'s disabled look (the mockup's light gray disabled
  Update is the existing disabled primary look here) or the alternate look.
- Changing `saveUsername`, the username step, the guard, the middleware,
  `auth.ts` or Better Auth's endpoints.
- A profile page or `/account` route.

## Acceptance (proposed)

Viewport 1280×800 for the browser cases. Each case signs in its own account
by database token through S3's editable helper
`e2e/helpers/username-step.ts`; no email is sent.

### `src/app/account-actions.change-username.test.ts` (new)

1. **23-S4-U1** the module exports `changeUsername` and `saveUsername` and
   no other function [**amended by 23-S5**: and `changeEmail`].
2. **23-S4-U2** a named session changing to "Lil Orange Fox" makes exactly
   one user write (`update` or `updateMany`), `where: { id: <session user
   id> }`, `data: { displayName: 'Lil Orange Fox' }`, and resolves `{ ok:
   true }` with no redirect; the value is stored trimmed; 80 code points
   are saved; a value equal to the current one is saved; extra arguments
   (another id, an object) never change the target.
3. **23-S4-U3** `''`, spaces, tabs and newlines → `{ error: 'Oops! You need
   to add a username.' }`; 81 code points, or 81 letters inside spaces →
   `{ error: 'Oops! Use 80 characters or fewer.' }`; `undefined`, `null`, a
   number, an object, an array → the blank message; no write.
4. **23-S4-U4** without a session, or with a session whose username is
   `null`, `''`, whitespace or missing: `redirect('/')`, no write; the
   session checked before the value.

### `src/components/ui/modal-header-source.test.ts` (new)

5. **23-S4-U5** `Modal`'s `headerVariant` prop is typed exactly `'default'
   | 'gray' | undefined` (a type assertion, enforced by `tsc --noEmit`);
   `Modal.tsx` uses `bg-modal-title-background-gray` and
   `bg-modal-title-background` and keeps `text-title-3 text-primary`;
   `globals.css` declares `--color-modal-title-background-gray:
   var(--palette-gray-200)`; exactly one other source file passes
   `headerVariant`, as `"gray"`, with the title "Account details".

### `e2e/account-details.spec.ts` (new)

1. **23-S4-1 Account in the masthead:** on `/puzzles`, a button named
   "Account" reading "Account", in `button-normal` (Sign out's weight), in
   `masthead-account`, which is `gray-500`; no fill, border, underline or
   ring at rest. The divider a filled `line-muted` element, `aria-hidden`,
   1px wide and 18px high, 10px from
   Account's right edge and from Sign out's left edge; Account, the divider
   and Sign out centred on the logo (±1.5px); Sign out still `link-muted`
   and 20px from the right; the bar still 61px. Hover and keyboard focus
   turn Account `button-hover`, keyboard focus adds the focus ring. Account
   and the divider show on an editor too; at 375px the masthead doesn't
   overflow and both words are inside the window. The username step's
   masthead and the signed-out one show neither Account nor the divider.
2. **23-S4-2 the modal:** Account opens a dialog named "Account details";
   its header is `modal-title-background-gray`, which is `gray-200`; the
   title `title-3` in `primary`; ✕ shown. One textbox named exactly
   "Username", editable, focused, holding the saved username, caption
   "Username" rendered "USERNAME"; one textbox named exactly "Email",
   holding the account's email, read-only and not disabled (enabled, the
   `readonly` attribute, focusable, not editable; typing leaves it)
   [**amended by 23-S5**, approved by the orchestrating session under the
   human's delegation: enabled, focusable and editable; the `readonly` and
   typing checks are dropped; see [S5](23-S5-changing-the-email.md#amended-frozen-acceptance)],
   caption rendered "EMAIL". Both regular (`body-normal`), 360px, one left edge,
   the email field 20px under the username caption. Update disabled, the
   primary type; Cancel enabled, the alternate type; Update left of Cancel
   on one row, under the fields. Cancel closes it. At 375px the panel and
   fields fit the window, no overflow. The new-puzzle dialog's header is
   still `modal-title-background`.
3. **23-S4-3 Update follows the username:** a different name enables
   Update, filled `button-fill`; the original disables it; a trailing
   space, or an emptied field, enables it. With Update disabled, Enter in
   the field sends no server action and the modal stays.
4. **23-S4-4 closing without saving:** after an edit, each of Cancel, ✕ and
   Escape closes the modal, stays on `/puzzles`, sends no server action and
   leaves the username, and focus is back on Account; reopening shows the
   saved name with Update disabled.
5. **23-S4-5 saving:** on `/puzzles`, with a seeded puzzle of the account's
   showing its name in the builder column, "  Ada Lovelace  " and Update:
   the modal closes, the URL stays `/puzzles`, exactly one server action is
   sent, "Ada Lovelace" is stored, another account's username is untouched,
   the row's builder name becomes "Ada Lovelace", a marker set on `window`
   before the save is still there (no full reload), and focus is on
   Account;
   reopening shows "Ada Lovelace" with Update disabled, and again after a
   reload. In an editor, after a letter typed in a cell and a `window`
   marker set, Enter in the field saves "Grace Hopper", closes the modal
   and leaves the editor open at its URL, the marker and the letter still
   there and focus on Account; 80 code points save.
   While a save is held, the field, Update and Cancel are disabled and
   Escape leaves the modal open; once released the modal closes and the
   name is stored.
6. **23-S4-6 errors:** empty, spaces and 81 code points show their messages
   in `account-username-error` (in `error`), under the caption (still
   `muted`), focus the field, mark it invalid, keep the value and the
   modal, send no server action and store nothing; editing clears the
   error. A save whose request fails (500) shows "Could not save your
   username. Please try again." there, keeps the modal, the value and
   enabled controls, focuses the field, stores nothing; a retry saves and
   closes.
7. **23-S4-7 only a named account:** with the modal open and an edit made,
   the account's username is removed in the database; Update goes to the
   username step at `/` and stores nothing.

### Amended frozen acceptance

The EPIC's decisions (Account details saves a username change at once; the
gray header option; Account in `gray-500`) authorize these additive
amendments, approved by the orchestrating session under the human's
delegation ([history](../HISTORY.md#orchestration)) with this story's
freeze; each file gets a note citing 23-S4:

- **`src/app/account-actions.test.ts`** (23-S3, frozen 2dcb6cb): 23-S3-U1
  "exports saveUsername and no other action" becomes "exports saveUsername
  and changeUsername and no other action" (the names compared sorted).
  Nothing else changes.
- **`src/app/globals-css.test.ts`** and **`e2e/color-tokens.spec.ts`**
  (F1): the style inventory gains `modal-title-background-gray: gray-200`
  and `masthead-account: gray-500`, each with a 23-S4 comment. (The
  catalog count in F1-4 follows the inventory.)

Unchanged and still required: `e2e/masthead.spec.ts` (F7), 23-S3-2 (no
Account on the step), 23-S3-U7 (the `'use server'` modules,
`requireAnySession` only in `account-actions.ts` and the guard),
`e2e/modal-design.spec.ts` (F4, the default header).

### Discrimination (2026-11-09, observed)

In a throwaway worktree at S3's `story/23-S3-email-only-sign-in` 62a200a
(the same code as `main` after S3's merge; runtime untouched; the new and
amended tests as above):

- `npx vitest run` on the four files: 27 failed, 23 passed. Failing: all 22
  `changeUsername` cases ("account-actions exports no changeUsername"),
  23-S4-U1 and the amended 23-S3-U1 (`['saveUsername']`), the amended F1
  inventory, and three of four 23-S4-U5 cases. Passing as expected: the
  rest of S3's action tests and F1's other cases; 23-S4-U5's type case
  passes at run time and fails `tsc --noEmit` (`headerVariant` does not
  exist on Modal's props).
- `npm run test:e2e -- e2e/account-details.spec.ts e2e/color-tokens.spec.ts`:
  18 failed, 8 passed. Every 23-S4 case failed (no Account), except two
  regression guards that pass at S3: no Account on the step or signed out,
  and the new-puzzle dialog's yellow header. Three F1 cases failed on the
  two missing tokens (66 styles expected, 64 shown).
- **Throwaway prototype, not kept** (the two tokens and swatches,
  `headerVariant`, `TextInput` `readOnly`, `ModalActions` `cancelDisabled`,
  `MastheadAction` in a gray tone and a divider, `changeUsername`, an
  `AccountButton` with the modal, the Header gated on `hasUsername`): `tsc`
  and `eslint` clean (2 warnings outside the epic); `npx vitest run` 912
  passed; `account-details`, `color-tokens`, `masthead`, `modal-design`,
  `modal`, `modal-a11y` and `username-step` 94 passed. The full
  `npm run test:e2e` once: 1298 passed, 25 failed, in `library-play`,
  `tooltips`, `lock-button-side`, `no-play-reset`, `inputs`, `label-12px`,
  `row-menu` and `modal-design` (F4-6, play's dialogs), mostly `page.goto`
  timeouts and `ECONNRESET`s from the test server under load; none in
  files the prototype's behavior touches, and `modal-design` had passed in
  the focused run. Not rerun before the prototype was removed; the
  implementer's full run is the gate. The E2E lock was taken for each run.
- **After the specification review** (same day): the e2e additions (the
  `window` marker and the editor's letter, Enter while Update is disabled,
  the read-only-not-disabled email, focus back on Account and on the field
  after a failure) sit in cases that already fail at S3 on their first
  step (no Account); they were type-checked (`tsc --noEmit`: only the
  expected `headerVariant` error) but not run against an implementation.
  The unit files, unchanged by the review, were rerun at 62a200a (no
  `src`, `e2e` or `prisma` difference from `main` 61c17d0): 27 failed, 23
  passed, as above.

### Implementation (2026-11-09, observed)

On `story/23-S4-account-in-masthead` from the frozen baseline 40ce315.
Account and its modal are `src/components/auth/AccountDetails.tsx` (new).
`ModalActions` gained `cancelDisabled`, `TextInput` `readOnly`,
`MastheadAction` a `tone` and `Masthead.tsx` a `MastheadDivider`; the
style guide's color catalog shows the two new tokens. Enter in the modal's
form submits through `onKeyDown` (Update sits in the footer, outside the
form), doing nothing while Update is disabled. No scope additions beyond
the declared Repo paths.

- `npm run verify`: exit 0 (912 tests; 2 lint warnings outside the epic).
- Focused e2e (`account-details`, `color-tokens`, `masthead`,
  `modal-design`, `modal`, `modal-a11y`, `style-guide`, `username-step`):
  106 passed.
- Full `npm run test:e2e` (from `/tmp/cw-s4-impl`, the E2E lock held,
  `COMPOSE_PROJECT_NAME=crossward-raptor`): 1322 passed, 1 failed,
  `row-menu.spec.ts:475` (16-S2-7), an `ECONNRESET` on `get-session` in
  the sign-in helper, outside S4's paths; the file reran 16 of 16 passed.
  (A first attempt didn't start: the production build failed resolving
  `next/font/google`; the next build succeeded unchanged.)
- Frozen acceptance: `git diff 40ce315` on every acceptance path is empty.

## Repo paths

Acceptance (new): `src/app/account-actions.change-username.test.ts`,
`src/components/ui/modal-header-source.test.ts`,
`e2e/account-details.spec.ts`. Amended: `src/app/account-actions.test.ts`,
`src/app/globals-css.test.ts`, `e2e/color-tokens.spec.ts`. Test plumbing
(editable, reused unchanged): `e2e/helpers/username-step.ts`.

Runtime: `src/app/account-actions.ts`, `src/app/globals.css`,
`src/components/style-guide/ColorSwatches.tsx`,
`src/components/ui/Modal.tsx`, `src/components/ui/ModalActions.tsx`,
`src/components/ui/TextInput.tsx`, `src/components/layout/Masthead.tsx`,
`src/components/layout/Header.tsx`, and a new client component for Account
and its modal under `src/components/auth/` (name the implementer's).
Expected unchanged: `src/lib/auth.ts`, `src/lib/require-session.ts`,
`src/middleware.ts`, `prisma/**`, `src/app/puzzles/actions.ts`.

Docs: this story; `../HANDOFF.md`.

**CODE-REVIEW:** a risk story (see Blast radius): branch
`story/23-S4-account-in-masthead`, PR, independent review. The reviewer
checks in particular that `changeUsername` uses `requireSession()` (not
`requireAnySession`), writes only the caller's row and only `displayName`,
and that no path other than `saveUsername` and `changeUsername` writes a
username.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered by PR from `story/23-S4-account-in-masthead`, independently
  reviewed and merged; the handoff records observed results.
- The human's visual check at the epic's end: the masthead and Account
  details against the mockups. Decisions the human may overrule there: the
  kept ✕; the disabled Update's app-wide look (the primary at half opacity,
  mocked light gray); Cancel's alternate look at rest (the mock's darker
  gray is its hover look).
