# Development

Local development, database setup, verification, and E2E-test behavior for Crossward.

Read this document when setting up the repo, running servers or tests, or diagnosing local-environment failures. It is not a source of product or domain requirements.

## Local environment

Crossward uses npm.

Local development and the E2E suite run against Postgres in Docker. Neon is deploy-only and is not used by local development or tests.

Docker defines separate databases:

- development: port `5432`
- test: port `5433`

A root `.env.local` must define the development configuration:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `BETTER_AUTH_SECRET` — a private signing secret
- `BETTER_AUTH_URL=http://localhost:3000`

Both database URLs should point to the development database on port `5432`
defined by `docker-compose.yml`. Leave `VERCEL` unset so local development
uses the local Postgres adapter and inbox. A Resend key is unnecessary.
The E2E command supplies its own test configuration; it does not require an
environment file. An optional `TEST_DATABASE_URL` shell variable can override
the default test credentials within the isolated target described below.

Environment files are intentionally protected by the agent permission configuration. Do not attempt to read, write, or edit `.env*` files. If required environment configuration is missing, report what is missing rather than trying to inspect the file.

## Initial setup

Install dependencies:

`npm install`

Make sure Docker is running, then initialize the databases:

`npm run db:setup`

Run `db:setup` on first setup and after schema changes. It brings up the Docker containers and applies migrations to the development database.

The underlying commands are:

- `npm run db:up` — start the database containers
- `npm run db:migrate` — apply migrations to the development database

## Common commands

- Dev server: `npm run dev`
- Local inbox: `npm run inbox:up`
- Build: `npm run build`
- Unit tests: `npm test`
- Unit tests directly: `npx vitest run`
- Lint: `npm run lint`
- Verification gate: `npm run verify`
- E2E tests: `npm run test:e2e`

`npm run build` generates Prisma Client before running `next build`. Client
generation is an explicit build prerequisite so fresh installs do not depend
on dependency installation scripts having run.

## Local inbox sign-in

`npm run dev` first runs `npm run inbox:up`, starting and waiting for the
development-profile Mailpit service before Next starts on port `3000`.
Docker must be running. `inbox:up` starts only Mailpit; database setup remains
`npm run db:setup`. The pinned Mailpit image exposes only its HTTP inbox/API
on `127.0.0.1:8025`, with no SMTP host port or forwarding/relay configuration.
It uses its own persistent `crossward-mailpit-data` volume and database;
automatic message deletion is disabled. Stopping/restarting it preserves
messages and does not reset either Postgres database.

To sign in using your normal development database:

1. Run `npm run dev`, then open `http://localhost:3000` in your browser.
2. Enter a unique address such as `builder@example.test` and press Enter,
   click Send sign-in link, or Tab to the button and press Enter.
3. After the confirmation, open `http://127.0.0.1:8025` in another tab of
   that same browser. Find the sign-in message for your requested address.
4. Follow the delivered link, or copy it into the original app tab. Expect
   the link to use `http://localhost:3000`; check `BETTER_AUTH_URL` if it does
   not. Links expire in 15 minutes and can be used once.
5. Confirm `/puzzles` has Sign out and that New Puzzle opens and cancels.
   Revisit `/` to confirm the signed-in redirect, then sign out to return
   to the public form.

Local capture uses Mailpit's
[JSON send API](https://mailpit.axllent.org/docs/usage/sending-messages/)
at the fixed address `http://127.0.0.1:8025/api/v1/send`, only when
`NODE_ENV=development` and `VERCEL` is unset/empty. An inherited
`RESEND_API_KEY` cannot enable real email delivery in that mode. Test mode
contacts neither service. Production/hosted execution never contacts the
local inbox; it uses Resend when a key exists, otherwise delivery is a no-op.
Real Resend/domain delivery must be checked separately before inviting users.

If the inbox cannot start, check Docker and whether another process owns
port `8025`. If delivery fails after the app starts, the form shows an error,
retains the address, and permits retry without claiming a link was sent.
Run `npm run inbox:up`, then retry. You can check this failure path by running
`docker compose --profile development stop mailpit`, requesting a link, then
restarting with `npm run inbox:up` and retrying. Stop preserves messages;
do not remove volumes or clear messages to troubleshoot startup. Never share
live sign-in URLs, tokens, or signing secrets in logs or bug reports.

## Verification

`npm run verify` is the normal completion gate for code changes.

It runs:

1. `tsc --noEmit`
2. lint
3. unit tests

A code change is not complete until this command exits successfully.

E2E tests are deliberately separate because they are slower. Run `npm run test:e2e` when the task affects browser-driven behavior or when its acceptance criteria require E2E coverage.

## E2E environment

`npm run test:e2e` prepares its own database and server environment through `pretest:e2e`; no manual test-database reset should normally be necessary.

Before Playwright starts, `scripts/prepare-e2e.mjs`:

1. generates Prisma Client, which the reset script imports;
2. brings up the Docker containers and waits for their health checks;
3. migrates the test database;
4. removes every row from the test database using `scripts/reset-test-db.mjs`;
5. clears this project's dev lock and anything listening on port `3100`.

Preparation, the build, the server, and test helpers all use the environment
from `scripts/e2e-env.mjs`. It defaults to the public Docker Compose test URL
`postgresql://crossward:crossward@localhost:5433/crossward_test`. An explicit
`TEST_DATABASE_URL` must resolve, using the pg driver's effective settings, to
`localhost` or `127.0.0.1`, port `5433`, database `crossward_test`. Unsafe
overrides are rejected before migration or reset. The validated URL is
normalized before use so query options cannot redirect another database
client. Both application database URLs are overridden with that same URL.

The build and server use `NODE_ENV=production`, the local pg adapter,
`http://localhost:3100` as the auth origin, and a fixed test-only signing
secret. `RESEND_API_KEY`, `BETTER_AUTH_SECRETS`, and `VERCEL` are explicitly
empty, including when an inherited or Next-loaded environment file supplies
other values. No email is sent and Mailpit is not required or started by
ordinary E2E preparation. These settings belong to the harness; the local
inbox walkthrough above runs separately in development after E2E finishes.
Serialize those browser checks because they share the database/build output.
Automated database-token sign-in proves auth behavior, not inbox delivery or
a person's successful manual login.

The test database is wiped once per E2E run, not once per test. Playwright's parallel workers share that database during the run.
This deletes all existing puzzle and authentication rows in the isolated test
database. Agents must obtain explicit authorization before running it when
existing-data deletion has not already been authorized.

The Docker containers are intentionally left running afterward so subsequent test runs start quickly.

## Playwright production server and Next.js build

Playwright runs `scripts/e2e-server.mjs`: `npm run build` generates Prisma
Client and creates a fresh Next.js build, followed by `next start -p 3100`.
A failed generation or build never starts a server. Startup has a
three-minute budget for the build and server; browser and assertion timeouts,
workers, project selection, and retries retain their normal settings. An
existing server is never reused. Playwright owns the launcher, which forwards
termination signals to its build/server process group and propagates failures.
Playwright allows fifteen seconds for graceful launcher shutdown; the launcher
force-stops a remaining child group after ten seconds.

The production build replaces the ordinary `.next` output. Preparation may
stop the normal local development server: sharing that build directory during
a build is unsafe. Next.js records the dev process in the project-scoped lock:

`.next/dev/lock`

The preparation script handles both sources of conflict:

- the process holding this project's Next.js dev lock;
- anything already bound to port `3100`.

## Local process policy

This repository is normally used on a personal development machine rather than shared infrastructure.

If a stale local dev-server process or development port prevents the requested Crossward task from running, terminate it and proceed rather than stopping for permission. Restarting `npm run dev` is considered cheap and recoverable.

This permission does not override safeguards on destructive operations or remote/shared history. Those are enforced by the agent permission configuration.

## Deployment

Do not infer a deployment provider from this document. Inspect the current repository configuration or relevant deployment documentation when deployment behavior matters.
