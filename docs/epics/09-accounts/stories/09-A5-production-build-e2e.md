# Story A5 — Run the frozen E2E suite against a production build

The bounded library investigation recorded repeated streamed development
navigation stalls and successful production-build controls. Those probes did
not satisfy the full release gate or establish the development failure's cause.
Run the existing browser suite against the artifact users would run in
production, with explicit local test configuration.

## Decisions

- Ordinary `npm run test:e2e` prepares the isolated database, creates a fresh
  `next build`, then serves it with `next start` on port 3100. Fail the run if
  preparation, build, or startup fails; never reuse an existing server or a
  stale build. Allow build time in the server-startup budget only.
- Give preparation, build, server, and test helpers the same validated
  `TEST_DATABASE_URL`: only `localhost` or `127.0.0.1`, port `5433`, database
  `crossward_test`, using the driver's effective connection settings. Default
  to the public Docker Compose test credentials; reject unsafe overrides before
  any migration or reset. Override both application database URLs explicitly.
- Supply an explicit local auth origin and a test-only signing secret shared
  by the build/server. Force `RESEND_API_KEY` empty even if an ambient or
  Next-loaded environment file supplies a real key. Use the local pg adapter.
  Do not inspect or edit environment files.
- Preserve project selection, auth setup, worker counts, retries, browser test
  timeouts, assertion timeouts, navigation behavior, and all frozen specs.
  Production auth behavior remains enabled; do not bypass authentication.
- Preserve Better Auth's production rate limits. The editable auth helper
  assigns a stable simulated client IP to each fresh visitor context, including
  browser and API requests, so unrelated test users do not consume one shared
  magic-link rate-limit bucket. Do not change application auth configuration.
- Keep the existing once-per-run isolated reset and process cleanup. Existing
  data deletion still requires the user's explicit authorization. Document
  that preparation can stop the normal local dev server and replace `.next`.
- Obtain separate implementation, verification, and independent final review.
  Review this harness change even though it does not touch a high-blast-radius
  product path. Keep unfinished A4 and keyboard changes out of its commits.

## Non-goals

Manual local login and real email delivery require a separate follow-up story.
Do not deliver A4, change session policy, paginate the library, fix development
hydration, instrument React, alter dependencies, or begin Ownership. Keep the
development rendering issue and unbounded library growth concern visible.

## Repo paths

- `playwright.config.ts` — production server launch and explicit helper config.
- `package.json` — ordinary E2E preparation entry point.
- `scripts/e2e-env.mjs` — shared isolated configuration and validation.
- `scripts/prepare-e2e.mjs` — prepare with validated child environment.
- `scripts/e2e-server.mjs` — build, then start; propagate failures/signals.
- `e2e/helpers/auth.ts` — separate simulated visitors for production IP limits.
- Existing migration/reset/port scripts — reuse, changing only if necessary.
- `docs/DEVELOPMENT.md` — actual E2E command, configuration, and lifecycle.
- Accounts `EPIC.md` and `HANDOFF.md` — story order and observed delivery state.
- `e2e/*.spec.ts` and `e2e/auth.setup.ts` — existing frozen acceptance oracle;
  no new or modified acceptance-test content.

## Acceptance examples and verification

1. An ambient development database URL, hosted auth URL, or email key cannot
   redirect preparation/build/server/helpers away from their explicit test
   settings or enable email. Inspect the child environment without printing
   ambient secrets; exercise validation without connecting or resetting data.
2. Reject remote hosts, development port/database, and query-parameter host,
   port, database, or socket overrides that resolve outside the allowed target.
3. A failed build does not start a server; a nonzero server exit fails startup;
   stopping Playwright cleans up its launcher/server. Check these paths with
   controlled child-process checks where useful, without editing frozen specs.
4. `npm run verify` exits 0, and two consecutive ordinary full
   `npm run test:e2e` runs exit 0 using normal workers. Record exact counts and
   confirm frozen acceptance files and pre-existing app changes are unchanged.
   This verifies the combined local application, including unfinished A4;
   it does not deliver or independently approve A4.
5. Independent review checks the configuration boundary, build/start lifecycle,
   preserved test settings, scoped commit contents, and verification evidence.
   Record the development issue and library growth concern as unresolved.

These harness examples are concrete inspection/process checks; the existing
browser suite remains the behavioral acceptance specification. No acceptance
tests are authored or changed in this implementation session.
