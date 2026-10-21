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

The [story lifecycle](process/STORY.md#verification) defines when checks are
required; [code review policy](CODE-REVIEW.md#verification-evidence) defines
when exact-head results may be reused. This section documents the commands.

`npm run verify` runs:

1. `tsc --noEmit`
2. lint
3. unit tests

`npm run test:e2e` is a separate full browser suite with the preparation below.
Focused runs help iteration; use the lifecycle's applicable final gate.

## E2E environment

`npm run test:e2e` prepares its own database and server environment through `pretest:e2e`; no manual test-database reset should normally be necessary.

Before Playwright starts, `scripts/prepare-e2e.mjs`:

1. generates Prisma Client, which the reset script imports;
2. brings up the Docker containers and waits for their health checks;
3. removes only legacy `Puzzle` rows if the isolated test database still has
   the pre-Ownership schema, then migrates it;
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
database.

**Standing authorization (user-approved 2026-10-19):** agents may run this
repository's guarded E2E preparation/reset harness for necessary test runs,
including future stories, without asking again. This covers deletion of all
existing rows only in the validated local test target: `localhost` or
`127.0.0.1`, port `5433`, database `crossward_test`. Keep the harness's target
validation and other safety guards intact; serialize runs sharing this database.

Reference this standing grant in the active handoff rather than requesting a
new grant per run, session or story. Other deletion/reset targets or operations
still require applicable explicit authorization. This grant does not authorize
ad hoc data deletion, environment-file access, development/production database
operations or bypassing execution permissions.

The Docker containers are intentionally left running afterward so subsequent test runs start quickly.

Ownership fixtures normally use one deterministic test-only builder shared by
`seedPuzzle` and the setup project's real magic-link sign-in. Both upsert that
user before using it, so public specs can seed before setup finishes. Sign-ins
inside individual public specs still create distinct users. After
`signInSeededUser` validates a sign-in in the same test attempt, implicit
`seedPuzzle` calls use that authenticated fixture builder instead. This binding
does not carry across tests or retries. An explicit third argument to
`seedPuzzle(puzzle, title, builderId)` always takes precedence; otherwise the
shared suite builder remains the fallback.

### One-off migration proof

`scripts/check-play-migration.mjs` is the
[Play P1](epics/11-play/stories/11-P1-play-route.md) proof that the
`add_play_sessions` migration is additive. With the test database up
(`npm run db:up`), run `node scripts/check-play-migration.mjs`. It connects
to the validated test target from `scripts/e2e-env.mjs` and creates a random
`p1_proof_*` schema. It copies the shape (not the data) of the public
`user`, `Puzzle`, `session`, `account` and `verification` tables, then
seeds synthetic rows and applies the migration SQL. It then checks three
things, printing one `PASS` line for each:

- existing rows are preserved, with no backfill;
- `PlaySession` constraints hold;
- puzzle and user deletes cascade only to matching sessions.

It drops the schema afterward. It never writes to public tables or replays
other migrations, so it deletes no existing rows and needs no reset grant.

It's historical evidence, not part of `npm run verify` or
`npm run test:e2e`. It's tied to that one migration: it refuses to run if
more than one migration directory matches `play…session`.

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

Production runs at [https://crossward-raptor.vercel.app/](https://crossward-raptor.vercel.app/)
on Vercel, using Neon Postgres. The local `.vercel/project.json` links this
checkout to that project. Local Docker databases and Mailpit are separate.

In the Vercel project's Settings → Environment Variables, configure Production:

- `BETTER_AUTH_SECRET` — a stable random signing secret, stored as Secret.
- `BETTER_AUTH_URL` — `https://crossward-raptor.vercel.app`.
- `RESEND_API_KEY` — your Resend API key, stored as Secret.
- `RESEND_FROM_EMAIL` — `Crossward <onboarding@resend.dev>` for personal
  sign-in using Resend's testing sender. It can deliver only to the address
  associated with your Resend account. For other recipients, verify a sending
  domain and use a sender on that domain. Without this variable the app uses
  `Crossward <login@crossward.app>`, requiring verification of `crossward.app`.

Redeploy after changing these settings; existing deployments retain their
previous settings. Local `.env.local` edits do not configure Vercel, and local
development needs no Resend key or sender override: Mailpit still captures
messages with its existing local sender. Tests remain email-free.

Production database migrations are a separate deployment step. `npm run build`
generates Prisma Client but does not apply migration SQL. Apply reviewed pending
migrations with `prisma migrate deploy` against the explicitly selected production
database, with authorization for the live schema change and before/after checks
that preserve existing puzzle data. Local `db:setup` and E2E reset scripts are
not production migration commands. On 2026-10-17, the deployed sign-in request
failed because `public.verification` was absent while three committed migrations
were still pending; rebuilding alone could not create those tables.

### Ownership O1 migration and coordinated release

The required `Puzzle.builderId` migration is
`20261017220000_add_puzzle_builders`. It never deletes existing data. An empty
table needs no assignment; a populated table requires an explicit existing
builder ID and the exact existing puzzle-ID set. Missing or mismatched inputs
abort its transaction, including its column addition. Its exclusive puzzle
table lock keeps that set stable until the backfill and constraints finish.
SQL writes only `builderId`, preserving all original fields and timestamps.
The foreign key prevents deleting a builder who still has puzzles.

Reproduce the safety checks against synthetic schemas in the validated local
test database, separately from any browser suite:

```
node scripts/check-ownership-migration.mjs
node scripts/prove-ownership-deploy.mjs
```

The second command uses the installed Prisma `migrate deploy`, first applying
historical migrations in a random schema, then adding four synthetic puzzles
and a user, then deploying O1 with both inputs on the migrator's own connection.
It checks preserved original rows and user, assigned builder, and completed
migration ledger. Both commands remove only their own synthetic schemas; the
proof also removes its own temporary configuration/migration copies. Neither
loads dotenv, changes public tables, or contacts development/production.

Production application is a separate reviewed operation. Do not merge O1 into
automatically deployed `main` while production still lacks `builderId`. Prepare
and review the operation before requesting live-change authorization:

1. Identify the direct production database target without reading `.env*`
   files. Match the exact existing user to the user's confirmed sign-in
   identity, and record the exact four existing puzzle IDs. No first-user,
   newest-user, or sole-user inference is permitted. The preservation policy
   does not itself identify those IDs or authorize an unreviewed live change.
2. Verify the applied migration names/checksums, with only O1 pending. Capture
   reproducible hashes of every original puzzle column, including timestamps,
   and every auth table before application. Retain a target fingerprint and
   sanitized evidence; do not print credentials, live tokens, or puzzle content.
   Confirm the committed implementation/review and coordinate deployment so
   no new code reaches the old schema.
3. Supply the explicit account and exact puzzle set through PostgreSQL startup
   options in the direct URL passed to Prisma's temporary, dotenv-free config.
   A `SET` or `set_config` on a separate client connection cannot configure the
   migrator. The proven construction is:

   ```js
   const migrationURL = new URL(directURL); // held only in memory
   if (![builderId, ...puzzleIds].every((id) => /^[A-Za-z0-9_-]+$/.test(id))) {
     throw new Error('Stop and review transport for IDs needing startup-option escaping');
   }
   migrationURL.searchParams.set('options',
     `-c crossward.legacy_builder_id=${builderId} ` +
     `-c crossward.legacy_puzzle_ids=${JSON.stringify(puzzleIds)}`);
   ```

   This uses compact JSON without whitespace. The safety check is part of
   this transport choice; do not substitute arbitrary strings or hand-encoded
   query parameters. Reject any pre-existing URL `options` rather than silently
   discarding operational settings. The temporary Prisma config must point to
   the reviewed committed schema/migration paths and read its URL only from
   the child process environment. Run the installed Prisma CLI with
   `migrate deploy --config <temporary-config>` from an empty temporary working
   directory. Do not write the URL or inputs into a file. The isolated proof
   shows this exact mechanism with synthetic values and copied migrations.
4. After the concrete operation is reviewed and live authorization is obtained,
   refresh the target/account/set and preservation snapshots immediately before
   applying. The SQL validates and locks the exact puzzle set itself. Stop on
   a failure; do not resolve a failed migration as successful or rerun blindly.
5. Independently verify all four assigned owners, all original puzzle hashes,
   unchanged auth rows, required column/no default, FK behavior, and the finished
   migration checksum before releasing O1. Then merge/deploy the reviewed code
   and check the hosted sign-in/library with the user's session. Keep schema
   application, deployed-code status, and user-reported success separate.

The prior app can run during the brief schema transition, but its old puzzle
insert lacks `builderId` and will fail after migration. Coordinate a quiet
creation window through deployment; do not add a nullable owner or fallback
default. No production reset/deletion or inbox operation is part of this plan.
Any authorized local-development cleanup deletes only local `Puzzle` rows on
the explicitly verified development target, preserving accounts and inbox
messages, before applying the migration to its then-empty puzzle table.

If the deployed homepage returns HTTP 500, check runtime logs. The observed
2026-10-17 failure was Better Auth rejecting its default signing secret;
adding the production auth settings and redeploying restored the login screen.
Reaching that screen does not prove email delivery. Request a link for your
Resend account email, check the real mailbox, and follow it in the same browser
to confirm the session and usable library. Never publish live links or secrets.
