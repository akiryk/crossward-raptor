# Local Infrastructure — Handoff

Current state of this repo's local-development-infrastructure track, for
an agent or collaborator picking it up fresh. Read alongside
`docs/epics/L-local-infrastructure-epic.md` and `AGENTS.md`, which remain
authoritative for scope and behavior. This document covers what has
actually happened and the decisions that live only in conversation.

Repo: `crossward-raptor`. Branch `main`, tracking `origin/main`.

This epic (and its handoff) were created retroactively, alongside Story
L1's implementation — see the epic doc's own note on why.

---

## Where things stand

**Story L1 (local Postgres for development and testing) is implemented,
verified, and opened as a PR (`story/L1-local-postgres`) rather than
merged to `main`** — high blast radius per `docs/CODE-REVIEW.md` and the
story's own explicit call, since it touches `prisma.config.ts`,
`playwright.config.ts`, and every local database connection in the app.

**The trigger was a real outage, not a preference.** Neon's 5 GB monthly
transfer allowance was exhausted by accumulated e2e traffic — every
query started erroring, blocking all local work. The structural cause:
every e2e run sent real traffic over the network to a shared branch that
accumulated rows indefinitely (no per-run cleanup existed before this
story), and since Story M3 `/puzzles` loads every puzzle's full `grid`
and `hints` JSON on every visit. Each run cost more than the last,
regardless of provider.

**Two Postgres containers, defined in the new `docker-compose.yml`**: a
dev database (`crossward`, port 5432) and a test database
(`crossward_test`, port 5433), each with its own named volume so wiping
one never touches the other, and a `pg_isready` healthcheck so
`docker compose up -d --wait` genuinely blocks until each accepts
connections. `.env.local` (already in place before this story started,
per its own Prerequisites — not read or written by any session working
this story) points `DATABASE_URL`/`DATABASE_URL_UNPOOLED` at the dev
container and `TEST_DATABASE_URL` at the test container.

**Two files not in the story's stated Repo paths turned out to be
required for its own Definition of Done to be achievable at all:**
`src/lib/prisma.ts` and `e2e/helpers/seed-puzzle.ts` both hardcoded
`PrismaNeon` (`@prisma/adapter-neon`), which speaks Neon's own
HTTP/WebSocket protocol — it cannot reach a plain local Postgres
container over raw TCP at all, not slowly, not with errors, just not at
all. Confirmed before assuming: `npm run dev` and `npm run test:e2e`
both need real Postgres connections, and neither DoD item is satisfiable
without swapping the driver. `e2e/helpers/seed-puzzle.ts` (test-only,
never runs on Vercel) now always uses `@prisma/adapter-pg`'s `PrismaPg`.
`src/lib/prisma.ts` (the app's runtime client, which does need to keep
working in production) branches on `process.env.VERCEL` — set by Vercel
in every environment it runs the app in, unset everywhere else — to pick
`PrismaNeon` there and `PrismaPg` for local dev and the e2e suite. This
keeps "Neon stays exactly as it is for the deployed app" true without
adding a new env var nobody asked for. Two new dependencies:
`@prisma/adapter-pg` and `pg` (plus `@types/pg`), version-matched to the
installed `prisma`/`@prisma/client` (7.10.0).

**`pretest:e2e` now does four things in order**, per the story's own
contract: bring both containers up and wait for health (`db:up`), apply
migrations to `TEST_DATABASE_URL` (new `scripts/migrate-test-db.mjs`,
which overrides `DATABASE_URL_UNPOOLED` for that one child process only
— `prisma.config.ts` otherwise points Migrate at the dev database, and
this must never touch the dev database's own migration state), wipe
every row from `TEST_DATABASE_URL`'s `Puzzle` table (new
`scripts/reset-test-db.mjs`), then the existing port/lock cleanup
(`scripts/free-e2e-port.mjs`, unchanged). Wipe is per-run, not per-test
— four parallel workers share one database within a run, so wiping
mid-run would destroy another worker's in-flight data; the unique-title
pattern the specs already use is what makes concurrent workers safe, and
this story didn't touch it.

**`reset-test-db.mjs`'s refusal is structural, not a config check.** It
reads `TEST_DATABASE_URL`, parses it as a URL, and refuses (non-zero
exit, clear message, no query attempted) unless the hostname is exactly
`localhost` or `127.0.0.1` — demonstrated directly: `TEST_DATABASE_URL`
overridden inline on the command line (never written to any `.env`
file) to a non-localhost URL, correctly refused with
`reset-test-db: TEST_DATABASE_URL does not point at localhost (host is
"example.com"). Refusing to run.` and exit code 1.

**`prisma.config.ts` and `playwright.config.ts` both now load
`.env.local`** instead of `.env.development.local` (the latter renamed
to `.env.development.local.bak` before this story started, per its
Prerequisites, so Next.js no longer loads it). `.env.development.local`
was the Vercel-pulled file; with Neon now deploy-only, local development
has no reason to load anything Vercel-managed.

### Verification

Cold start proven both ways, not assumed: `docker compose down -v`
first, then `npm run db:setup` — both containers came up healthy and the
one existing migration (`20260828190406_init`) applied cleanly (~17s,
mostly image pull). `npm run dev` against the resulting dev database:
created a puzzle through the real UI, typed a letter, reloaded, letter
and title both persisted. `npm run test:e2e` from a state where the
containers were stopped (not just idle): **147/147 tests passed in
36.2s** — compare Story D8's entry in `05-HANDOFF-visual-design.md`,
where the same suite against loaded Neon took 35 minutes with timeouts.
Run a second time immediately, no manual cleanup between runs: **147/147
again, 35.6s**, and the `reset-test-db` step logged `deleted 113 row(s)
from Puzzle` before that second run started — proof the wipe actually
ran and actually worked, not that the database happened to start empty.
`npm run verify` exits 0 throughout (`tsc --noEmit`, lint, 208 Vitest
tests, unchanged — this story added no Vitest coverage of its own, per
its own "no new acceptance tests" call).

### What exists

```
docs/epics/
  L-local-infrastructure-epic.md   this epic, tracked; written
                                     retroactively alongside L1
docs/stories/
  L1-local-postgres.md              Story L1's specification, tracked
docs/handoffs/
  L-HANDOFF-local-infrastructure.md this file, tracked
docker-compose.yml                  new; db (5432) and test-db (5433)
                                     services, named volumes, pg_isready
                                     healthchecks
scripts/
  migrate-test-db.mjs                new; prisma migrate deploy against
                                      TEST_DATABASE_URL only
  reset-test-db.mjs                  new; deleteMany on Puzzle, refuses
                                      any non-localhost TEST_DATABASE_URL
  free-e2e-port.mjs                  unchanged; still the last step in
                                      pretest:e2e
package.json                        adds db:up / db:migrate / db:setup;
                                      pretest:e2e now chains db:up ->
                                      migrate-test-db -> reset-test-db ->
                                      free-e2e-port; new dependencies
                                      @prisma/adapter-pg, pg, @types/pg
prisma.config.ts                    loads .env.local, not
                                     .env.development.local
playwright.config.ts                loads .env.local, not
                                     .env.development.local
src/lib/prisma.ts                   not in the story's own Repo paths,
                                     but required for its DoD — see
                                     "Where things stand" above; picks
                                     PrismaNeon under process.env.VERCEL,
                                     PrismaPg otherwise
e2e/helpers/seed-puzzle.ts           same reason, not in Repo paths;
                                     always PrismaPg now (test-only,
                                     never runs on Vercel)
AGENTS.md                            new Setup section; Commands section
                                      documents db:setup and what
                                      pretest:e2e now does
README.md                            new Getting started section
                                      (Docker + .env.local + db:setup)
```

### The gate

`npm run verify` exits 0: `tsc --noEmit` clean, lint clean, 208 Vitest
tests passing across 17 files (unchanged from before this story).
`npm run test:e2e` exits 0: 147 Playwright tests passing across 21 spec
files, confirmed on two consecutive full runs from a cold container
state, in 36.2s and 35.6s respectively.

---

## Current status

Story L1 is implemented and its PR is open, not merged — a different
agent should review it against `docs/CODE-REVIEW.md` before it lands.
Once merged, `docs/LEARNINGS.md`'s existing flakiness entries that
attributed symptoms to "Neon connection contention" or "parallel worker
DB load" are worth revisiting: this story's own before/after numbers
(35 minutes with timeouts, down to 36 seconds clean) suggest at least
some of that history was the shared hosted database, not the app or the
test suite. Not rewritten here — this session lacks the authority to
prune another epic's learnings, and the two prior incidents may still
have their own independent causes worth keeping on record.
