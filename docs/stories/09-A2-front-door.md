# Story A2 — The front door

Second slice of the accounts epic. A1 gave Crossward identity but no way in
that a person would recognise: sign-in happens over API routes only. This
story makes `/` a real front door — the app's name, a line of marketing copy,
an email field with a button that requests a magic link, a "check your email"
confirmation, and a quiet line promising the address won't be shared or
spammed. A visitor who is already signed in doesn't see any of it: they're
redirected to `/puzzles`.

Nothing else changes. Every other route stays exactly as open as it is now;
route protection is A3. This is additive UI on top of A1's working flow.

**Low blast radius.** No `prisma/**`, no engine, no `puzzle-storage.ts`, no
`actions.ts`. Pushes straight to `main` — no PR, no review gate. (If your
final diff somehow touches one of those four paths, `/story` will catch it and
escalate; it shouldn't need to.)

## Repo paths

- `src/app/page.tsx` — edited: becomes an async server component. It reads the
  session (Better Auth's server API, `auth.api.getSession({ headers: await
  headers() })`) and `redirect('/puzzles')` if one exists; otherwise it
  renders the front door. The interactive form is a separate client
  component — a server component can't hold the input state.
- `src/lib/auth-client.ts` — new: the Better Auth React client
  (`createAuthClient` with the magic-link client plugin), exposing
  `authClient` so the form can call `authClient.signIn.magicLink({ email,
  callbackURL: '/puzzles' })`. This is the browser-side counterpart to
  `src/lib/auth.ts`.
- `src/components/auth/SignInForm.tsx` — new: the client component — email
  input, submit button, the sent state, the privacy line, and the `data-ready`
  hydration signal. See the markup contract.
- `e2e/front-door.spec.ts` — new (**already provided — do not edit**). The
  frozen acceptance spec.
- `e2e/helpers/auth.ts` — **not** edited. The spec reuses A1's
  `requestMagicLink`, `readMagicLinkUrl` and `getSession` for the
  already-signed-in case; they're proven and unchanged.

## Markup contract

The frozen spec depends on these; keep them exactly. Copy (headings, marketing
sentence, privacy wording, button label) is the implementer's to write and is
free to change — the spec asserts structure and behaviour, not prose.

- `data-testid="front-door"` — a container around the whole front-door view,
  rendered only for signed-out visitors (signed-in ones are redirected before
  render).
- `data-testid="sign-in-form"` with `data-ready` flipping to `"true"` once the
  component hydrates — the same pattern as `NewPuzzleButton`
  (`data-testid="new-puzzle" data-ready={isReady}`), because the submit
  handler isn't live until hydration and a click before then is dropped.
- `data-testid="sign-in-email"` — the email input (pass it through
  `TextInput`'s `data-testid`).
- `data-testid="sign-in-submit"` — the request-link button.
- `data-testid="sign-in-sent"` — the "check your email" confirmation, shown
  **only after** the magic-link request resolves successfully (see the
  decision below — this ordering is what makes the spec's link-was-issued
  check reliable rather than flaky).
- `data-testid="sign-in-privacy"` — the quiet line about the address not being
  shared or spammed.

## Required behaviour

- **`/` is public and not redirected for a signed-out visitor.** They see the
  front door.
- **Submitting requests a real link and then confirms.** The form calls
  `authClient.signIn.magicLink` with the typed email and `callbackURL:
  '/puzzles'`, awaits it, and only then swaps to the sent state. The real
  browser fetch carries an `Origin` header, which `src/lib/auth.ts` already
  trusts for `:3000` and `:3100`, so no origin work is needed here.
- **A signed-in visitor at `/` is redirected to `/puzzles`**, server-side, in
  `page.tsx` — before the front door renders.

## Decisions

**The sent state appears only after the request succeeds, not optimistically.**
Two reasons. It's honest — "check your email" should mean an email path
actually ran. And it's what makes the acceptance test reliable: the spec reads
the freshly-issued token from the database right after the sent state appears,
so the token must already be stored by then. An optimistic toggle would race
the request and flake.

**The redirect lives in `page.tsx`, not middleware.** A2 is one page's
concern. Middleware that protects routes broadly is A3's deliberate,
suite-wide change; adding a narrower version here would be work A3 then has to
reconcile. One `getSession`-then-`redirect` in the server component is the
minimum that satisfies the epic's "signed-in visitor at `/` is redirected."

**A dedicated client for the browser.** `src/lib/auth.ts` is the server
instance and can't be imported into a client component. Better Auth's React
client (`src/lib/auth-client.ts`) is the supported browser surface; the form
uses it rather than hand-rolling a `fetch` to the auth route.

**No error UI beyond not-confirming.** A failed request simply doesn't show the
sent state. A visible error banner, retry affordance, or email-format
validation are more than the epic asks for (AGENTS.md rule 2) and nothing
tests them. Leave them out.

## Scope discipline

- **No route protection, no middleware.** (A3.) Only `/`'s own signed-in
  redirect.
- **No `Header` change.** It already links "Crossward" home and is harmless on
  the front door. A signed-out/​signed-in-aware header is not this story.
- **No sign-out UI.** (A3 decides the sign-out affordance.)
- **No `Puzzle` or ownership changes.** (Epic 10.)
- **No profile, OAuth, passwords, rate limiting.** (Epic non-goals.)
- **No existing spec changes.** Nothing protected changes; the suite should
  pass unmodified. If making `/` a server component with a redirect breaks an
  existing spec that visits `/`, that's a finding to report, not a spec to
  edit. (Worth a quick grep for specs that navigate to `/` before you start —
  `smoke.spec.ts` and `home-link` usage are the likely ones.)

## Acceptance examples

All in `e2e/front-door.spec.ts` (Playwright, frozen).

**A2-1 — public front door.** A signed-out `goto('/')` is not redirected and
shows the front-door container, email input, submit button and privacy line.

**A2-2 — request shows sent state and issues a link.** Filling the email and
submitting shows the sent confirmation, and the link is then readable from the
database (proving the request really ran, not just a UI toggle).

**A2-3 — signed-in redirect.** After signing in via the A1 helper flow, a
visit to `/` lands on `/puzzles`.

## Definition of done

1. `npm run verify` exits 0.
2. `npm run test:e2e` exits 0 — `e2e/front-door.spec.ts` passes, and every
   existing spec still passes **unmodified**.
3. `/` shows the front door signed-out and redirects to `/puzzles` signed-in,
   verified by the spec.
4. Pushed to `main` (low blast radius — no PR).

Report anything that doesn't work rather than adjusting the frozen spec to
fit.
