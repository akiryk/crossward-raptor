# Development

Local development, database setup, verification, and E2E-test behavior for Crossward.

Read this document when setting up the repo, running servers or tests, or diagnosing local-environment failures. It is not a source of product or domain requirements.

## Local environment

Crossward uses npm.

Local development and the E2E suite run against Postgres in Docker. Neon is deploy-only and is not used by local development or tests.

Docker defines separate databases:

- development: port `5432`
- test: port `5433`

A root `.env.local` must define:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `TEST_DATABASE_URL`

These should point to the Docker databases defined by `docker-compose.yml`.

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

Before Playwright starts, it:

1. brings up the Docker containers and waits for their health checks;
2. migrates the test database;
3. removes every row from the test database using `scripts/reset-test-db.mjs`;
4. clears stale dev-server state that would prevent Playwright from starting.

`scripts/reset-test-db.mjs` refuses to operate against anything except localhost.

The test database is wiped once per E2E run, not once per test. Playwright's parallel workers share that database during the run.

The Docker containers are intentionally left running afterward so subsequent test runs start quickly.

## Playwright server and Next.js lock

Playwright's web server runs on port `3100`, separate from the normal Next.js development server on port `3000`.

A different port is not sufficient to allow two `next dev` processes for this repository. Next.js also creates the project-scoped lock:

`.next/dev/lock`

A manually running `next dev` can therefore prevent the Playwright server from starting even when port `3100` itself is free.

The E2E preparation script handles both sources of conflict:

- the process holding this project's Next.js dev lock;
- anything already bound to port `3100`.

## Local process policy

This repository is normally used on a personal development machine rather than shared infrastructure.

If a stale local dev-server process or development port prevents the requested Crossward task from running, terminate it and proceed rather than stopping for permission. Restarting `npm run dev` is considered cheap and recoverable.

This permission does not override safeguards on destructive operations or remote/shared history. Those are enforced by the agent permission configuration.

## Deployment

Do not infer a deployment provider from this document. Inspect the current repository configuration or relevant deployment documentation when deployment behavior matters.
