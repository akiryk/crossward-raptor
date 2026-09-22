# Crossward

Crossward is a web app for building and playing NYT-style crossword puzzles.
The grid engine — the pure logic core that owns words, numbering, hints, and
phase rules — is complete; the builder UI has not been started yet.

## Getting started

Local development runs against Postgres in Docker, not a hosted database.
You'll need [Docker](https://www.docker.com/) running locally, and a
`.env.local` at the repo root defining three variables: `DATABASE_URL`
and `DATABASE_URL_UNPOOLED` (the dev database) and `TEST_DATABASE_URL`
(the e2e suite's own database — wiped on every run, never your working
data). All three should point at the containers `docker-compose.yml`
defines.

Accounts (magic-link sign-in via Better Auth and Resend) add three more
`.env.local` variables: `BETTER_AUTH_SECRET` (a signing secret),
`BETTER_AUTH_URL` (the app's base URL), and `RESEND_API_KEY` (the Resend
API key used to deliver sign-in links). Leave `RESEND_API_KEY` unset
locally and in the test environment — with no key, no email is sent (the
link is still issued and, in tests, read from the database), which is how
the suite avoids sending mail. Set it only where real delivery is wanted.
Real delivery also requires **one verified domain in Resend**: until a
domain is verified, Resend will only send to the account owner's own
address, which is enough for building but blocks a second person signing
in.

1. `npm install`
2. `npm run db:setup` — starts the containers and applies migrations
3. `npm run dev`

## Commands

- Install: `npm install`
- Database: `npm run db:setup` (first run / after a schema change)
- Dev: `npm run dev`
- Build: `npm run build`
- **Verify (the gate): `npm run verify`** → runs `tsc --noEmit`, lint, and tests. A change is not done until this exits 0.
- E2E: `npm run test:e2e` (Playwright) — separate, slower gate; not part of `verify`. Standing home for browser-driven builder tests once UI work begins. Prepares its own local test database automatically (migrated and wiped) before each run — see `AGENTS.md` for the details.

## More context

`AGENTS.md` is the source of truth for how this repo is worked in — project
overview, tech stack, commands, and behavioral rules for anyone (human or
agent) making changes here. `docs/` holds the grid engine epic, story-by-story
specs, and handoff notes on decisions made along the way that aren't written
down anywhere else. Read both before touching the engine or the phase-lock
flow.

## Learn More

This is a [Next.js](https://nextjs.org) app. See the
[Next.js documentation](https://nextjs.org/docs) for framework features and
API reference.
