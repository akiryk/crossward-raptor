# Epic: Account details

**Approved by the human 2026-11-09**, including the Decisions
"proposed by the agent". Written from the human's notes and four
mockups; the human answered the agent's open questions the same day.

Signing in asks for an email only. A username is asked for once, after
the first magic link, pre-filled with a friendly generated name; a
returning user goes straight in. A signed-in user can see and change
their username and email from **Account** in the masthead. The `label`
text style shrinks to 12px across the app.

## The human's request

Restated from the human's notes (2026-11-09):

1. **Email-only sign-in.** Today the sign-in form asks for a username
   and an email every time; a returning user's second username is
   ignored, which wastes their effort and confuses them. Instead the form
   asks for the email only, for new and returning users alike. After the
   magic link, a returning user keeps their existing username; only a
   user without one is asked for it.
2. **The username step.** After the link, a new user sees a username
   field pre-filled with a generated "Adjective Adjective Noun" name
   (e.g. "Lil Orange Fox", "Happy Burly Harley"): friendly and warm, not
   over the top ("Fantastic Awesome Lion" is too much). Separate word
   lists from the puzzle names', 50–100 words each. The field carries a
   "Username" label in the `label` text style.
3. **`label` is 12px** (was 14px), everywhere it's used. Labels under
   the hint inputs may need to move up so the gap between label and line
   doesn't grow.
4. **Account in the masthead:** "Account | Sign out" at the upper right.
   Account is a link-style button in `gray-500`. Between the two, a 1px
   `line-muted` divider 18px high with 10px on each side (21px between
   the words).
5. **Account details modal.** Account opens the existing modal with a
   new, constrained header option (not an arbitrary color): here a
   `gray-200` header in place of the bright yellow; title type size and
   color unchanged. Title "Account details". Username and email fields,
   filled with the current values. Update and Cancel: Update is disabled
   until either value changes, then active and blue.

The human's answers to the agent's questions (2026-11-09):

- The username step is a **page step, required**, as in the mockup, not
  a popup; it shows to any signed-in account without a username.
- An **email change is confirmed** by a link sent to the new address;
  the email changes only once that link is clicked. A username change
  saves at once.
- Usernames stay **not unique**.
- The modal's title is **"Account details"** (sentence case, as mocked).

Mockups (2026-11-09):

- [Masthead](assets/masthead-mockup.png): the logo at left; at right
  "Account" in gray, a thin vertical divider, "Sign out" in light blue.
- [Sign-in, email](assets/sign-in-email-mockup.png): the front door's
  title ("Build a puzzle. / Or play a puzzle / Log in to start."), one
  field "Your email address...", the "Send Sign-in Link" button, the
  privacy line at the bottom.
- [Username step](assets/username-step-mockup.png): the same title with
  its last line "Create a username."; one field holding "Lil Orange
  Wing", "USERNAME" right-aligned under its line in small, spaced
  capitals; a "Get Started" button.
- [Account details](assets/account-details-mockup.png): the modal with a
  light gray header "Account details"; two fields ("MyUsername",
  "myemail@example.com"), each with a right-aligned caption under its
  line ("USERNAME", "EMAIL"); a disabled light gray "Update" and a gray
  "Cancel".

## What the code does today

- **Auth** is Better Auth with the magic-link plugin over Prisma
  (`src/lib/auth.ts`). Sessions last 30 days, sliding.
- **The front door** (`src/app/page.tsx`) shows the title and
  `SignInForm` (`src/components/auth/SignInForm.tsx`) to a signed-out
  visitor and redirects a signed-in one to `/puzzles`. The form has
  username and email fields, pre-fills the last username sent from this
  browser (`localStorage` `crossward:username`) and sends the username
  in the magic link's `name`, with `callbackURL: '/puzzles'`.
- **The username** is `User.displayName` (nullable;
  `prisma/schema.prisma`). Better Auth's own `User.name` is required but
  unread by the app. On link verification, hooks in `auth.ts` copy the
  link's name into `displayName` only while it's blank: the first
  username wins (14-S1).
- **Rules** (`src/lib/username.ts`): a username is 1–80 characters,
  trimmed; `emailError` checks an email's shape. No uniqueness.
- **Where the username shows:** the puzzles list's builder column
  (`builderName` in `src/app/puzzles/actions.ts`, `PuzzleRow.tsx`).
- **Route gating** (`src/middleware.ts`): every path but `/` and
  `/api/auth/*` needs a session cookie, else it redirects to `/`.
- **The masthead** (`Masthead`, `src/components/layout/Masthead.tsx`;
  `Header.tsx`) shows `SignOutButton` at the right when signed in:
  a `MastheadAction`, `text-button-normal`, `link-muted`, `button-hover`
  on hover and focus.
- **The modal** (`src/components/ui/Modal.tsx`) has one header look,
  `bg-modal-title-background` (`yellow-bright`); the title is `title-3`,
  `primary`. No header option.
- **`TextInput`** (`src/components/ui/TextInput.tsx`): its `label` prop
  renders a `title-4` heading *above* the field. The mocked caption
  under the line exists only in the hints (`HintBox.tsx`,
  `HintsPanel.tsx`: `text-label`, uppercase, `tracking-[0.1em]`).
- **`label`** is 14px / 20px line height (`globals.css`), used by the
  tooltip, the Preview, Rebus, Lock Word and Start Over controls, the
  hint labels and the style guide.
- **Puzzle names** (`src/lib/puzzle-name.ts`, 14-S3): "Adjective Noun
  Noun", 100 of each, the random source a parameter for tests.
- **Tokens** the notes name: palette `gray-200` #dde0e6, `gray-500`
  #8b909a; color `line-muted` (`gray-200`).

## Stories (proposed order)

1. **S1 The 12px label:** `label` becomes 12px everywhere; the hint
   labels and any other caption close up to their lines. Off the risk
   paths; the human checks it visually.
2. **S2 Friendly usernames:** the word lists and a generator,
   "Adjective Adjective Noun". Off the risk paths; the human approves
   the lists with the story.
3. **S3 Email-only sign-in and the username step:** the form asks for
   the email only; after the link, an account without a username gets
   the username step and no privileges until it saves one. Touches
   `src/lib/auth.ts`, `src/app/puzzles/actions.ts` and an authenticated
   write: branch, PR and independent review.
4. **S4 Account in the masthead:** "Account | Sign out", the modal's
   gray header option and the Account details modal, saving a username
   change. The email field is shown, read-only, until S5. An
   authenticated write: branch, PR and independent review.
5. **S5 Changing the email:** the email field becomes editable; Update
   sends a confirmation link to the new address. Touches `auth.ts`:
   branch, PR and independent review.

S3 builds on S1 (the caption) and S2 (the generator); S4 on S1 and S3
(the caption, the username save); S5 on S4. Each checks its actual
paths against CODE-REVIEW; a change to `src/lib/auth.ts` or a new
authenticated write path is treated as a risk path either way.

## Decisions

From the human:

- **The sign-in form asks for the email only.** One field, "Your email
  address...", and "Send Sign-in Link"; the privacy line, the "check
  your email" state and errors as today. New and returning users see the
  same form.
- **The link no longer carries a username.** A returning user's
  username never changes by signing in.
- **The username step** shows after the magic link to any account
  whose username is blank, new or older, and to no one else. Layout as
  mocked: the front door's title with "Create a username." as its last
  line, the field, a "Get Started" button. Saving goes on to `/puzzles`.
- **No username, no privileges** (the human's review, 2026-11-09).
  Until a username is saved, the account isn't really signed in: it
  can't see, play or create a puzzle, or reach any page but the username
  step. The server enforces this on every page, server action and route
  that today requires a session (the puzzle pages and actions, play, the
  style guide), not only by redirecting; saving the username itself is
  the one thing such a session can do.
- **The field is pre-filled** with a generated name the user can keep
  or replace; the username rules are as today (1–80 characters).
- **Generated names** are "Adjective Adjective Noun", title case,
  spaces between ("Lil Orange Fox"): their own lists, 50–100 words each,
  friendly and gently positive, not superlative.
- **`label` is 12px** everywhere, its weight unchanged.
- **The masthead, signed in:** "Account", the divider, "Sign out", in
  that order at the right. Account in `gray-500`; the divider 1px wide,
  18px high, `line-muted`, 10px from each word. Sign out unchanged.
- **Account opens the Account details modal**, not a page.
- **The modal's header option** is a small named set (e.g.
  `headerVariant`: the default yellow, and a gray one), not a color
  value; existing modals don't change. Account details uses the gray
  one: `gray-200`, the title's size and color unchanged.
- **Account details:** title "Account details"; a username field and an
  email field, each with the current value; Update and Cancel.
- **Update is disabled** until a field's value differs from the value
  it opened with; it is then enabled, in the blue primary look; changing
  a value back disables it again.
- **Cancel** closes without saving; reopening shows the saved values.
- **Usernames are not unique.**
- **An email change is confirmed by the new address.** Update sends a
  confirmation link to the new email; the account's email changes only
  when that link is followed. Until then, sign-in uses the old email. A
  username change saves at once.

Proposed by the agent:

- **The caption.** `TextInput` gains a caption under its line, as
  mocked and as the hints already show: `label` style, uppercase,
  `tracking-[0.1em]`, `muted`, right-aligned. The username step and
  Account details use it. Its accessible name is the field's, so the
  caption isn't announced twice. The existing above-the-field `label`
  prop stays for its current uses.
- **`label`'s line height** goes to 16px with its size; S1 measures and
  sets the gap between each caption and its line, so the hint labels sit
  no farther from their lines than today.
- **The username step lives at `/`.** An account without a username
  sees the step there; with one, `/` redirects to `/puzzles` as today.
  Any other page redirects such an account to `/`, and its server
  actions refuse as they do for no session. The masthead there shows no
  Account; it keeps Sign out as the way out for someone who used the
  wrong email.
- **The magic link's destination** stays `/puzzles`; the gate above
  sends a new user on to the step.
- **Generated names** come from a generator in `src/lib/` like
  `generatePuzzleName`, with a random source as a parameter; the two
  adjectives always differ. A fresh name each time the step loads; no
  "another name" control.
- **Leftovers removed:** the form's remembered username
  (`crossward:username`: no longer read or written) and the hooks that
  copy the link's name into `displayName`.
- **Saving a username** goes through a server action that changes only
  the signed-in user's own `displayName`, enforcing the username rules
  on the server.
- **After Update:** a username-only change closes the modal. With an
  email change, the modal's body is replaced by "Check <new email> for a
  link to confirm your new email." and a Close button. An email already
  used by another account, or a failure, shows an error under the field
  and keeps the user's input.
- **Account details' errors** use `TextInput`'s error line and the
  existing username and email messages.
- **Buttons:** Update is the primary `Button`; Cancel is the
  alternate (gray) look, as mocked.

## Non-goals

- Passwords, social sign-in, account deletion, avatars, a profile page
  or an `/account` route.
- Unique usernames, username search or mentions.
- Showing the username anywhere new (the masthead stays "Account").
- A way to regenerate the suggested name.
- Changing the puzzle-name generator or its lists.
- Any modal header color beyond the default and the gray option.
- Changes to session length, the magic link's lifetime or the sign-in
  email's wording.
- Redesigning the masthead beyond Account and the divider.
