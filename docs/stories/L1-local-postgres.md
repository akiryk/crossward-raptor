# Story L1 — Local Postgres for development and testing

Moves local development and the e2e suite off Neon and onto Postgres
running in Docker. Neon stays exactly as it is for the deployed app.

This is a response to a real failure: the Neon project exhausted its 5 GB
monthly transfer allowance, so every query now errors and no local work is
possible. The cause is structural rather than accidental — every e2e run
sends real database traffic over the network, the test branch accumulates
rows indefinitely with no cleanup, and since Story M3 the `/puzzles` list
loads every puzzle's full `grid` and `hints` JSON on every visit. So each
run costs more than the last. Any hosted provider meters transfer the same
way; the fix is to stop sending test traffic over the wire at all.

It should also make the suite faster and remove the connection-contention
flakiness that has dogged parallel runs since epic 2 — a full run recently
degraded to 35 minutes with timeouts.

**High blast radius.** This changes where every local query goes. Branch and
PR, don't merge.

Repo paths:
- `docker-compose.yml` — new
- `scripts/reset-test-db.mjs` — new
- `package.json` — edited: scripts
- `prisma.config.ts` — edited: loads `.env.local`
- `playwright.config.ts` — edited: loads `.env.local`
- `AGENTS.md` — edited: setup and commands
- `README.md` — edited: getting started

**No new acceptance tests.** Like the original Playwright setup, this is
infrastructure — its verification is that the existing suite passes against
the new database. Don't invent tests for the container.

## Prerequisites (human, already done)

`.env.local` exists at the repo root with:

```
DATABASE_URL=postgresql://crossward:crossward@localhost:5432/crossward
DATABASE_URL_UNPOOLED=postgresql://crossward:crossward@localhost:5432/crossward
TEST_DATABASE_URL=postgresql://crossward:crossward@localhost:5433/crossward_test
```

`.env.development.local` has been renamed to `.env.development.local.bak`,
so Next.js no longer loads it. `.gitignore` covers `.env*`. CC must not
read or write any `.env*` file.

## Required contract

```yaml
# docker-compose.yml — two services, credentials matching .env.local
# dev database on 5432, test database on 5433, each with its own named
# volume so wiping one never touches the other.
# Both need a healthcheck (pg_isready) so `docker compose up -d --wait`
# blocks until they actually accept connections.
```

```
# package.json scripts
db:up      -> docker compose up -d --wait
db:migrate -> prisma migrate deploy against DATABASE_URL
db:setup   -> db:up, then db:migrate          (one-time / after a schema change)
```

`pretest:e2e` must, in this order: bring the containers up and wait for
health, apply migrations to `TEST_DATABASE_URL`, then wipe it. Keep
whatever port/lock cleanup that hook already does.

```js
// scripts/reset-test-db.mjs
// Deletes every row from the Puzzle table in TEST_DATABASE_URL.
// Refuses to run if TEST_DATABASE_URL is unset or does not point at
// localhost -- a wipe script that can reach a hosted database is a
// liability, and this one should be structurally unable to.
```

## Decisions

**Two databases, not one with a shared schema.** The dev database holds
puzzles you're working on; the test database is wiped on every run. One
database would mean either not wiping (the accumulation problem returns) or
destroying your own work.

**Wipe per run, not per test.** Four parallel workers share one database
within a run, so a test wiping mid-run would destroy another test's data.
Per-run is the granularity that fits. The unique-title pattern the specs
already use stays — it's what makes concurrent workers safe, and that's
unchanged by this story.

**Don't restore count-based assertions.** A clean database per run makes
them tempting again. They're still wrong: workers run concurrently, so any
"the list grew by exactly one" assertion is a race. This was removed once
already; it stays removed.

**`deleteMany`, not `prisma migrate reset`.** Reset is hard-denied in
`.claude/settings.json`, correctly — the deny is pattern-based and can't
tell a throwaway local database from a real one. One table means
`deleteMany` is simpler anyway, and the guard against non-localhost URLs
does the protective work.

**The container stays running after the suite.** `docker compose up -d`
reuses the same named container rather than creating new ones, so nothing
accumulates no matter how many times it runs. Leaving it up means instant
startup next time at negligible idle cost.

**`.env.local` replaces `.env.development.local`.** Next.js loads
`.env.development.local` at higher precedence, so a local override in
`.env.local` would silently lose to the Vercel-pulled file. With Neon now
deployment-only, local development doesn't need Vercel's env at all — and
production is unaffected, since Vercel injects its own at build time.
`prisma.config.ts` and `playwright.config.ts` both currently load
`.env.development.local` and must both point at `.env.local`.

**The `e2e-test` Neon branch is left dormant**, not deleted. It costs
nothing and remains available if cloud e2e is ever wanted.

## Scope discipline

- **No schema changes, no migrations authored.** Existing migrations are
  applied to a new database; that's all.
- **No changes to the `/puzzles` list query.** Its payload contributed to
  the transfer burn, but it's a separate concern and harmless locally.
- **No changes to any spec file.** If the suite doesn't pass against local
  Postgres, that's a finding to report, not a reason to edit tests.
- **No changes to Vercel or production configuration.**
- **No seeding.** An empty database is the correct starting state.
- **No CI configuration.** None exists; this story doesn't add it.

## Definition of done

1. `npm run db:setup` brings both databases up and migrates them from a
   cold start (verify by stopping and removing the containers first).
2. `npm run dev` works against the local dev database: a puzzle can be
   created, edited, and reloaded.
3. `npm run test:e2e` passes in full, from a state where the containers
   were not already running.
4. Running it twice in a row passes both times, proving the wipe works and
   nothing accumulates.
5. `scripts/reset-test-db.mjs` refuses to run against a non-localhost URL —
   demonstrate this, since it's the one safety property here that a passing
   suite doesn't prove.
6. `npm run verify` exits 0.
7. `AGENTS.md` and `README.md` describe the new setup: Docker required,
   `npm run db:setup` before first run, and what `.env.local` must contain
   (naming the variables, not their values).
8. Report the full-suite runtime, for comparison against the 35 minutes
   observed on Neon.
9. Opened as a PR, not merged.

Report anything that doesn't work rather than adjusting tests to fit.
