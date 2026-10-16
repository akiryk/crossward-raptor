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

These should point to the Docker databases defined by `docker-compose.yml`.
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
- Build: `npm run build`
- Unit tests: `npm test`
- Unit tests directly: `npx vitest run`
- Lint: `npm run lint`
- Verification gate: `npm run verify`
- E2E tests: `npm run test:e2e`

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

1. brings up the Docker containers and waits for their health checks;
2. migrates the test database;
3. removes every row from the test database using `scripts/reset-test-db.mjs`;
4. clears this project's dev lock and anything listening on port `3100`.

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
other values. No email is sent. These settings belong to the harness;
manual local login and real email delivery are a separate follow-up story.

The test database is wiped once per E2E run, not once per test. Playwright's parallel workers share that database during the run.
This deletes all existing puzzle and authentication rows in the isolated test
database. Agents must obtain explicit authorization before running it when
existing-data deletion has not already been authorized.

The Docker containers are intentionally left running afterward so subsequent test runs start quickly.

## Playwright production server and Next.js build

Playwright runs `scripts/e2e-server.mjs`: a fresh `next build` followed by
`next start -p 3100`. A failed build never starts a server. Startup has a
three-minute budget for the build and server; browser and assertion timeouts,
workers, project selection, and retries retain their normal settings. An
existing server is never reused. Playwright owns the launcher, which forwards
termination signals to its build/server child and propagates failures.

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
