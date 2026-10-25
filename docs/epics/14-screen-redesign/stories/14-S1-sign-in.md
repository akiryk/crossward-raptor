# Story S1 — Sign-in and username

Redesign the front door (`/`) from the human's mockups. A sign-in now asks for a
**username** and an email. The first username an account gets is kept for good,
so the builder-name dialog before a first puzzle goes away.

**Status:** approved by the human (2026-10-25) and frozen on `main`
(2026-10-25). The approval covers the Decisions (*(agent)* items included), the proposed acceptance and
its acceptance choices, and the retired and amended acceptance.
**Blast radius: medium.** Sign-in's form and copy, one auth hook, and removing
the builder-name dialog with its two server actions. `src/app/puzzles/actions.ts`
is a CODE-REVIEW risk path, so the work goes on branch `story/14-S1-sign-in`
with a PR and an independent review. No schema change.

## Decisions

Inspected `src/app/page.tsx`, `SignInForm`, `TextInput`, `Button`, `Title`,
`src/lib/auth.ts`, better-auth 1.7.5's magic-link plugin, `prisma/schema.prisma`
(`User.displayName`), `NewPuzzleButton`, `DisplayNameDialog`,
`src/lib/display-name.ts`, the display-name actions, and every frozen test
touching `sign-in-*`, `display-name-*` or `front-door`. Also the human's three
mockups (form, error, sent) of 2026-10-25. Each mockup measurement below is
converted at about 1.75 mockup pixels to 1px, the scale at which the heading
reads as `title-1`. Choices marked *(agent)* are open for the human's review.

### Layout *(human)*

- **One container below the masthead**, at most 700px wide and centered on
  the page. Its content is left-aligned. A 1px `line-muted` vertical hairline
  runs down its left edge, the container's full height.
- **Spacing from the mockup** *(human: "generous spacing as indicated")*:
  - The container starts 90px below the masthead.
  - Content sits 20px to the right of the hairline.
  - The container is at least 630px tall, the height of the mockup's
    hairline.
  - The help line sits at the container's bottom in both the form and sent
    states, so it doesn't move when the link is sent.
- The heading, fields, button, messages and help line share one left edge.
  The mockup's slightly offset help line and button are drawing slop.

### Heading *(human)*

- A `title-1` `h1` (via `Title`), three lines: "Build a puzzle." and
  "Or play a puzzle." in `muted`, then "Log in to start." in `primary`.
  Each phrase starts its own line.
- The page no longer shows "Crossward" or "Build and solve crossword
  puzzles."; the masthead's logo carries the name.

### Form *(human)*

- **Two large Inputs** (F5's `TextInput`, `size="large"`, `body-large`), in
  this order:
  - Username: placeholder "Your username...", accessible name "Username",
    test id `sign-in-username`.
  - Email: placeholder "Your email address...", accessible name "Email",
    test id `sign-in-email` (kept).
- Spacing:
  - 40px between the heading and the username field.
  - 20px between the fields.
  - 40px from the email field (or its error message) to the button
    *(human)*.
- Each field is 400px wide *(human: "about 400px")*, or the container's
  width if narrower.
- **The large Button** "Send Sign-in Link", left-aligned. Test id
  `sign-in-submit` is kept.

### Validation *(human: "input validation", the error mockup)*

- Runs when the form is submitted, before anything is sent. Both fields are
  checked together; if either fails, nothing is sent.
- Errors use the Input's own error state: the line turns `error` and the
  message sits 8px below it in `body-normal` `error`.
- **Username** follows today's builder-name rules *(human)*: not blank once
  trimmed, at most 80 characters (code points). Messages:
  - Blank: "Oops! You need to add a username." *(human mockup)*
  - Too long: "Oops! Use 80 characters or fewer." *(agent)*
- **Email must be well formed** *(agent rule)*: once trimmed, no spaces,
  exactly one `@`, a non-empty part before it, and a part after it containing
  a dot that neither starts nor ends it. Messages *(agent copy, matching the
  mockup's voice)*:
  - Blank: "Oops! You need to add an email address."
  - Malformed: "Oops! That doesn't look like an email address."
- Editing a field clears that field's error *(agent)*. Focus moves to the
  first invalid field *(agent)*.
- The trimmed values are sent.

### Sent and failure messages

- **Sent** *(human mockup)*. The fields and button are replaced by two
  `body-large` lines, 40px below the heading:
  - "Check your email for the magic link that signs you in." in `primary`
    (test id `sign-in-sent`, kept);
  - "Pro-tip: check your spam folder, it's probably in there." in `muted`.
- **Failure** *(human: today's copy, the sent message's styles; agent:
  placement)*. The form stays, keeping the values, so the visitor can retry.
  20px below the button, a `role="alert"` block of two `body-large` lines:
  "Could not send the sign-in link." in `primary`, then "Please try again." in
  `muted`. It clears when the form is submitted again.

### Help line *(human)*

- "We’ll only use your email to send a sign-in link. It will not be shared or
  used for any other purpose." in `muted`, test id `sign-in-privacy` (kept).
  It's `body-small` *(mockup: about 12px)*.
- It doesn't wrap at desktop widths: one line inside the 700px container.

### Username *(human, 2026-10-25)*

- **Both fields every time.** A returning visitor enters a username too:
  before the link is clicked, nothing says whether the email has an account,
  and saying so would reveal which emails do.
- **The first username wins.** When a sign-in link is verified and the
  account has no username (null or blank), the account takes the username
  from that sign-in, trimmed. An account that already has one keeps it; a
  different username typed later is quietly ignored. This covers new
  accounts and existing accounts that never named themselves alike.
- **Not unique.** Two accounts can share a username.
- **Stored as today's builder name.** It's `User.displayName`, so there's no
  migration. better-auth also stores it as `User.name` for a new account,
  which nothing reads.
- **How it travels** *(agent)*. The form passes it as better-auth's
  magic-link `name`, which better-auth keeps with the link's token. better-auth
  itself only uses it for new accounts. So a hook in `src/lib/auth.ts` reads
  the token's username before verification consumes it. Once verification
  creates a session, it sets `displayName` if the account has none. The
  write is conditional on the stored value being blank, the same capture-once
  pattern as `saveDisplayName` today.
  - A username in the link that fails the rules (only possible by calling
    the API directly) is ignored.
- **The form is the only gate** *(agent)*. The sign-in API doesn't reject a
  request without a username. Such an account simply has no username until
  a later sign-in supplies one, as unnamed legacy accounts do now. Nothing in
  the app blocks on a missing username.
- **Pre-filled per browser** *(human)*. After a successful send, the browser
  stores the username in `localStorage` (key `crossward:username`). The form
  pre-fills it on the next visit, once hydrated. It stays editable. Nothing
  is stored after a failed send.

### The builder-name dialog is removed *(human)*

- **New Puzzle** opens the new-puzzle dialog directly for every account,
  named or not.
- Removed:
  - `DisplayNameDialog`;
  - `getDisplayName` and `saveDisplayName` from `actions.ts`;
  - the `displayName` prop of `NewPuzzleButton` and its read in
    `/puzzles`;
  - `src/lib/display-name.ts`. Its rules move to a new `src/lib/username.ts`
    (with the email check), shared by the form and the auth hook.

### Unchanged

- The magic link itself, the 15-minute single-use token, the redirect of a
  signed-in visitor to `/puzzles`, the `front-door` and `sign-in-form` test
  ids and `data-ready`, and the masthead (signed out: no Sign out).
- No old tokens on the page or the form. `src/app/page.tsx` drops its plain
  `p-6` markup.

### Retired and amended acceptance

Approving this story approves these changes to frozen tests. They land only
in the specification-only freeze commit on `main`:

1. **Delete `e2e/display-name.spec.ts`** (O2 builder-name capture) and
   **`src/app/puzzles/actions.display-name.test.ts`**. The dialog and its
   actions are removed. S1's username cases replace them: capture once,
   rules, and no step before the first puzzle.
2. **`e2e/inputs.spec.ts` F5-6:** delete the case "the builder-name field
   carries its name as a title-4 label above it" and its now-unused
   `signInDisplayNameUser` import. The sign-in email case stays.
3. **`src/components/ui/input-source.test.ts`** "sign-in is large and the two
   dialogs pass their names as labels":
   - sign-in has two `TextInput`s, both `size="large"`;
   - the `DisplayNameDialog` lines are removed;
   - the new-puzzle line stays.
4. **`e2e/modal-design.spec.ts`:** delete the `builder name` describe block
   and its now-unused `signInDisplayNameUser` import.
5. **`e2e/manual-login.spec.ts`** (every case, the failed-delivery retry
   included) and **`e2e/front-door.spec.ts`** ("requesting a link…"): fill
   `sign-in-username` before the email. No assertion changes. Without this
   the form's validation would block their submits.

`e2e/helpers/display-name.ts` has no users left after these changes and is
removed. It isn't acceptance.

## Acceptance

*Approved and frozen (2026-10-25).* Three new files:

- `e2e/sign-in.spec.ts`: browser tests, measured at 1280×800.
- `src/lib/username.test.ts`: Vitest tests of the rules.
- `src/components/auth/sign-in-source.test.ts`: a source test.

### e2e/sign-in.spec.ts

It runs signed out in the authenticated project via
`test.use({ storageState: … })`, as `manual-login.spec.ts` does, so
`playwright.config.ts` doesn't change. Cases:

1. **14-S1-1 layout**
   - The `front-door` container sits 90px below `app-header`. It's 700px
     wide, centered on the viewport and at least 630px tall. Its only border
     is a 1px solid `line-muted` left one.
   - Heading, username, email, button and help line, plus each heading line's
     text, start 20px right of the hairline (container x + 1 + 20).
   - Gaps: 40px heading to username, 20px between the fields, 40px email to
     button. Each field is 400px wide.
   - The help line's bottom is the container's bottom, and its text is one
     line.
2. **14-S1-2 text styles and copy**
   - The heading is the only `h1` in `front-door`, in `title-1`. Its rendered
     lines are exactly the three phrases, each on one line, in order. They are
     colored `muted`, `muted` and `primary`.
   - "Crossward" and the old tagline are gone from `front-door`.
   - The textboxes named "Username" and "Email" are `sign-in-username` and
     `sign-in-email`, in that order. Each has its placeholder and is
     `body-large`.
   - The submit button reads "Send Sign-in Link" in `button-large`.
   - The help line has the exact new copy, `body-small` `muted`.
3. **14-S1-3 validation**
   - **An empty submit:**
     - shows both blank messages;
     - focuses Username;
     - sets `aria-invalid` and turns each line `error`;
     - shows each message in `body-normal` `error`, 8px below its field;
     - keeps 40px from the email error to the button;
     - sends no request.
   - **Editing a field** clears only that field's error.
   - **A malformed email** shows only the email error, focuses Email and
     sends nothing. Tried: `ada@example`, a space, a double `@`, an empty
     local part. Fixing it sends exactly one request with the trimmed email
     and `name: "Ada"` (from "  Ada  ").
   - **81 astral code points** in the username are refused, the value kept.
     80 are sent.
4. **14-S1-4 sent**
   - `sign-in-sent` and the pro-tip line show the exact copy, `body-large`,
     in `primary` and `muted`, starting 40px below the heading.
   - Fields and button are gone. The help line hasn't moved.
   - The trimmed username is in `localStorage` under `crossward:username`.
     On the next visit it pre-fills an editable Username, and Email is empty.
5. **14-S1-5 failure**
   - A 503 on the first attempt shows the two-line `role="alert"` in
     `body-large`, `primary` then `muted`, 20px below the button and on the
     content edge.
   - No sent state, both values kept, button enabled, nothing stored.
   - Resubmitting really sends: the alert clears, a link is issued and the
     username is stored.
6. **14-S1-6 username capture**, read from `User.displayName`:
   - a new account takes the trimmed username from the form;
   - an account first created through the API without a name takes it on its
     next form sign-in;
   - a named account keeps "First" after signing in with "Second";
   - an API link whose name is blank or 81 characters gives the account
     none. This guard passes today too, since nothing captures yet; it rules
     out a hook that skips the rules.
7. **14-S1-7 no builder-name step:** for a form-created account and for an
   account without a username, New Puzzle opens `new-puzzle-dialog` with
   `new-puzzle-name` focused, and no `display-name-step`.

### src/lib/username.test.ts

It fixes the shared module's API, shared by the form and the hook:
`usernameError(value: unknown)` and `emailError(value: unknown)`. Each returns
the message to show, or `null`.

- **Username:** blank, whitespace and non-strings give the blank message. A
  trimmed 80 code points (astral included) pass; 81 give the length message.
- **Email:** trimmed well-formed addresses pass. Blank gives its message.
  Each malformed form gives the malformed message: no `@`, empty part on
  either side, no dot, two `@`, inner spaces, a leading or trailing dot after
  the `@`.

### src/components/auth/sign-in-source.test.ts

- `app/page.tsx` and `SignInForm.tsx` use only the redesign tokens, and the
  page drops `p-6`.
- They render exactly one `<Title size={1}>`.
- `SignInForm` and `lib/auth.ts` import `@/lib/username`.
- `DisplayNameDialog.tsx` and `lib/display-name.ts` are gone. `actions.ts`
  has no `getDisplayName` or `saveDisplayName`, and no source file imports
  either removed file.

### Acceptance choices *(agent, approved)*

- `front-door` is the 700px container itself, not a wrapper around it.
- The content edge is measured from the hairline's right edge.
- The pro-tip line has no test id; it's found by its exact text.
- Error messages are found by `TextInput`'s existing `<id>-error` test ids.

### Discrimination (2026-10-25, observed)

- **Current `main`, uncommitted tests:**
  - `src/lib/username.test.ts` fails, since the module is missing.
  - The source test fails 4 of 4.
  - `npm run test:e2e -- e2e/sign-in.spec.ts`: 21 of 22 S1 cases fail. Only
    the 14-S1-6 guard passes, as expected.
- **A throwaway implementation:** `lib/username.ts`, the form and page, an
  auth `before`/`after` hook on `/magic-link/verify`, and the name step
  removed. The four retired files were moved aside so the build typechecks.
  - `tsc` passed.
  - Both Vitest files passed, 12 of 12.
  - The browser spec exited 0, 22 of 22 plus setup.
- **Two mutations on top of it:**
  - With the hook overwriting any `displayName`, "keeps its first username"
    failed.
  - With the email sent untrimmed, the trimmed-values case failed.
- Everything was reverted. The worktree matches its starting state plus the
  three proposed test files. ESLint passes on them.
- `npm run verify` doesn't pass while these tests are uncommitted without
  runtime: the Vitest files fail by design until implementation.

## Repo paths

New acceptance, immutable after freeze: `e2e/sign-in.spec.ts`,
`src/lib/username.test.ts`, `src/components/auth/sign-in-source.test.ts`,
and the amendments under
[Retired and amended acceptance](#retired-and-amended-acceptance).

Runtime:

- `src/app/page.tsx` and `src/components/auth/SignInForm.tsx`: the redesign.
- `src/lib/username.ts`: new. `src/lib/display-name.ts`: removed.
- `src/lib/auth.ts`: the username hook.
- `src/app/puzzles/actions.ts` (risk path): remove `getDisplayName` and
  `saveDisplayName`.
- `src/app/puzzles/page.tsx` and `src/app/puzzles/NewPuzzleButton.tsx`: drop
  the name step.
- `src/components/puzzle/DisplayNameDialog.tsx`: removed.
- `e2e/helpers/display-name.ts`: removed (a helper, not acceptance).
- This story, `../EPIC.md` and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S1. No passwords, account page or username editing, no showing the
username anywhere new, no restyle of the new-puzzle dialog (S3), no
responsive work (epic 15) and no old-token deletion (S8).

## Definition of done

- The human approves this specification, its acceptance and the retirements,
  recorded here and in the handoff. Freeze on `main` in a specification-only
  commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visual check at desktop width against the three mockups.
- A PR from `story/14-S1-sign-in`, independently reviewed per CODE-REVIEW;
  the handoff updated with observed results.
