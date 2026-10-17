# Story A6 — Complete local sign-in through a local inbox

A person running Crossward locally can request a magic link, but without a
Resend key the current delivery function deliberately does nothing. The UI
still says to check email. Reading a token from Postgres for the person did
not establish successful manual login. Enter in the email field also used
to do nothing; its unfinished native-form fix remains in the working tree.

Provide a complete development sign-in experience using a separate local
inbox, preserving the existing real magic-link protocol and production flow.

## Session boundary

This story and its acceptance files are prepared in a specification-only
session. A fresh session orchestrates implementation and independent testing,
then independent final review/merge. Do not treat writing or freezing these
specs as authorization to implement in the specification session.

## Decisions

- Use **Mailpit as a separate local inbox**, accessible at
  `http://127.0.0.1:8025`. The user chose a local inbox for development;
  this specification uses Mailpit to provide it.
  No inbox route, token viewer, or authentication bypass is added to Crossward.
- Local development (`NODE_ENV=development`, with `VERCEL` unset/empty)
  captures messages using Mailpit's documented JSON HTTP send endpoint at
  `http://127.0.0.1:8025/api/v1/send`. Keep this target fixed for this story;
  do not add a configurable remote capture endpoint or a new SMTP dependency.
- Local capture takes precedence over an inherited `RESEND_API_KEY`. A
  developer cannot accidentally send real mail by having a key in the
  environment. Mailpit forwarding/relay must not be configured.
- Outside local development, preserve production Resend delivery when a key
  exists and the existing keyless no-op used by A5. Unit-test mode performs
  no delivery even with a key. A hosted Vercel process must never contact the
  local inbox, even if its `NODE_ENV` is unexpectedly `development`.
- The captured message uses the requested address and the exact URL supplied
  by Better Auth. Do not reconstruct links from stored tokens, change auth
  origin policy, weaken session guards, or change token/session lifetimes.
- Start Mailpit from Docker Compose using a pinned stable image. Publish only
  its HTTP inbox/API on host loopback; an SMTP host port is unnecessary. Put
  the service behind a development-only Compose profile. Provide
  `npm run inbox:up`, and have `npm run dev` start/wait for that service before
  Next starts. Ordinary production E2E preparation must not require Mailpit.
  Give Mailpit its own persistent volume/database so stopping/restarting it
  preserves captured messages. Do not reset/prune it on startup. No database
  or existing-volume reset belongs to starting the inbox.
- Keep sign-in usable by mouse, Enter in the email field, and Tab then Enter
  on the button. One submission sends one request; disable duplicate
  submission while pending. Adopt/preserve the existing native-form and
  Button `type` work rather than discarding it.
- An unsuccessful delivery must not show the sent confirmation. Show a
  readable accessible error (`role=alert`), retain the address, and permit
  retry. Clear the error after a successful retry. No token or secret may
  appear in error messages or logs. A local transport failure must propagate
  to the auth request rather than silently succeeding or falling back to
  Resend. A request that throws must also release the pending state.
- Explain in README/development instructions how to open the inbox, find a
  message for a `.test` address, and follow its link in the same browser. A
  Crossward UI link to Mailpit is not required. Production copy need not
  mention development tooling.

Mailpit supports both the browser inbox and HTTP capture without a new Node
dependency. References checked during specification:
[sending messages](https://mailpit.axllent.org/docs/usage/sending-messages/),
[Docker](https://mailpit.axllent.org/docs/install/docker/), and
[API schema](https://raw.githubusercontent.com/axllent/mailpit/master/server/ui/api/v1/swagger.json).

## Test boundary

The existing Decisions that tests never send email and A5 forces email off
remain intact. Unit tests mock the HTTP/Resend transport boundaries; they
make no delivery/network calls. The ordinary production-build browser suite
continues using database-token plumbing and never uses the inbox. New browser
specs prove submission, retry, session identity, and a usable library; **they
do not prove inbox delivery**.

Consequently, the real local-inbox walkthrough below is a separate mandatory
acceptance gate. An agent may drive it with a browser and record evidence;
the user must also receive clear instructions to try it themselves. Do not
replace it with a database query, a mock, or a production-build E2E pass.

## Repo paths

Already provided specification files:

- `src/lib/email.test.ts` — **frozen** delivery-selection/transport contract.
- `e2e/manual-login.spec.ts` — **frozen** submission/session/retry contract.
- `e2e/helpers/sign-in-ui.ts` — provided, **editable** UI-test readiness/IP
  plumbing. Existing auth and readiness helpers remain editable plumbing.

Implementation paths:

- `src/lib/email.ts` — local capture, delivery isolation, failure propagation.
- `src/components/auth/SignInForm.tsx` — existing keyboard work and retryable
  errors; preserve frozen A2 structure/test IDs/privacy line.
- `src/components/ui/Button.tsx` — preserve existing optional native `type`
  prop with `button` default.
- `docker-compose.yml`, `package.json` — development-only inbox service and
  startup commands. Do not alter database services/volumes.
- `README.md`, `docs/DEVELOPMENT.md` — actual startup/inbox instructions,
  correct dev auth prerequisites, tests staying email-free, troubleshooting.
- Accounts `EPIC.md` and `HANDOFF.md` — actual checks and delivery state.

If production E2E isolation needs an additional explicit forced-off value,
`scripts/e2e-env.mjs` is editable; preserve A5's configuration guarantees.
No browser-project/assertion/worker/timeout changes are needed: the new spec
explicitly starts with empty storage even in the authenticated project.

No schema, engine, puzzle storage, Server Action, middleware, session policy,
ownership, or real-email-provider setup changes belong here. Do not restart
the development hydration investigation or paginate the library.

## Acceptance examples

### Frozen automated contracts

1. Keyless local development captures the requested recipient and exact
   supplied link through Mailpit's JSON API; an ambient Resend key still
   cannot cause real delivery.
2. Unreachable/rejecting capture produces an error and never falls back to
   real mail. Production Resend/no-key behavior stays intact, hosted
   execution never uses loopback capture, and unit-test execution sends none.
3. Mouse, email Enter, and Tab + Enter each submit exactly once. The real
   issued link authenticates the requested identity, reaches `/puzzles`, and
   permits opening/cancelling New Puzzle without writing a puzzle.
4. A failed auth delivery response shows a nonempty accessible error, keeps
   the email and enabled retry control, and never shows confirmation.
   Retrying successfully clears the error and shows confirmation.

### Required real local-inbox walkthrough

Run after ordinary E2E has finished; the suites share a database/build output.
Use the isolated test database on `localhost:5433/crossward_test` with explicit
local auth settings and no Resend key for the verification dev server. Do not
read/edit environment files. This creates only fresh verification users and
messages; it does not authorize deleting existing dev data or inbox messages.
Use the existing safe harness configuration as a starting point, override
`NODE_ENV=development` for this separate dev check, retain local database and
email isolation, and use the trusted port 3100. Do not change ordinary E2E.

1. Start the development-only inbox service and a fresh development app.
   Record the actual commands/origins/settings by variable name, with no
   signing secret, token, or environment-file contents in evidence. Confirm
   Compose exposes the inbox on loopback with no relay/forwarding.
2. In a fresh signed-out browser context, open Crossward and submit a unique
   `.test` email using Enter. Confirm the sent state and exactly one matching
   captured message in the **real Mailpit UI**, with correct recipient and a
   link pointing to the dev app. Obtain the link only from that delivered
   message, not the auth database. Do not persist its live token in evidence.
3. Follow/copy the message link into the same app browser context. Confirm
   the real session's email is the requested address, `/puzzles` opens with
   sign-out visible, and New Puzzle opens/cancels without creating a puzzle.
   A page URL alone is insufficient. Revisit `/` and confirm signed-in
   redirect. Sign out and confirm the public sign-in form returns.
4. Temporarily stop only the task's inbox service without deleting data;
   request another link. Confirm a retryable error, no false sent state, and
   no Resend fallback. Restart it and retry successfully. Verify delivery in
   the inbox again. Cleanup must preserve database/inbox volumes and restore
   any ordinary development server stopped by these checks.
5. Provide the user the ordinary port-3000 instructions to repeat this flow
   with their development database, without agent token retrieval. Report
   agent walkthrough and user walkthrough separately; do not claim the user
   has signed in unless they confirm it.

## Definition of done

1. Commit the coherent story/spec-only baseline on main before implementation;
   freeze both acceptance test files. Preserve the two existing keyboard
   source edits, and record which baseline cases fail before implementation.
   The existing keyboard work may already satisfy some new cases: that is
   not evidence the committed pre-fix UI passes.
2. Use separate implementation and verification agents, with independent
   final review. `npm run verify` and ordinary `npm run test:e2e` must exit 0
   after implementation; frozen tests and existing guards stay unchanged.
3. Complete and record the real inbox walkthrough. Keep its limitations and
   actual state separate from mocked/unit and production-browser evidence.
   Real Resend/domain delivery remains a separate prerequisite before inviting
   others, not a claimed outcome of this story.
4. Deliver through a PR with independent review/merge even if no standard
   high-blast-radius path changes. Review development/production separation,
   loopback service exposure, error behavior, and exact tested commit/CI.
5. Update this handoff with verified, committed, merged, and manual-test
   states. Keep Accounts open until its independent closeout audit; do not
   automatically start Ownership. The audit must account for the earlier
   renewal finding's independent A4 resolution and actual manual-login status.
