# Crossward

Crossward is a web app for building and playing NYT-style crossword puzzles.
The grid engine and builder UI are implemented, including clue authoring,
publishing, and a puzzle library. Accounts are in progress; ownership and
solver play are planned next. See the [epic index](docs/epics/README.md) for
the current handoffs and development workflow.

## Getting started

Local development runs against Postgres in Docker, not a hosted database.
You'll need [Docker](https://www.docker.com/) running locally, and a
`.env.local` at the repo root defining `DATABASE_URL` and
`DATABASE_URL_UNPOOLED` for the development database on port `5432`.
The E2E suite supplies its own isolated database configuration on port `5433`;
it does not require environment-file setup and wipes only that test database.

Accounts also require `BETTER_AUTH_SECRET` (a private signing secret) and
`BETTER_AUTH_URL=http://localhost:3000`. Leave `VERCEL` unset for local
development. No Resend key is needed: `npm run dev` starts and waits for the
local Mailpit inbox before starting Next. Development captures sign-in mail
there even if a `RESEND_API_KEY` was inherited; it never falls back to real
delivery when the inbox is unavailable.

Production delivery uses `RESEND_API_KEY` and **one verified domain in
Resend**. Until a domain is verified, Resend only sends to the account
owner's address. Check real email delivery separately before inviting others.
Production without a key does not deliver; tests never send email or use
the local inbox.

1. `npm install`
2. `npm run db:setup` — starts the containers and applies migrations
3. `npm run dev`

Open `http://localhost:3000` and request a link with an address such as
`builder@example.test` using Enter or the submit button. Open
`http://127.0.0.1:8025` in another tab of the same browser, find the message
addressed to that email, and follow its sign-in link (or copy it into the app
tab). It expires in 15 minutes and works once. The link opens your signed-in
library at `/puzzles`; try opening and cancelling New Puzzle, then sign out
to return to the public form. No database-token lookup is needed.

Mailpit stores messages in its own persistent Docker volume. Restarting the
inbox preserves them; startup never resets a database or prunes messages.
Its HTTP inbox/API is published only on host loopback, with no published
SMTP port and no forwarding or relay. See
[development troubleshooting](docs/DEVELOPMENT.md#local-inbox-sign-in) if a
request fails.

## Commands

- Install: `npm install`
- Database: `npm run db:setup` (first run / after a schema change)
- Dev: `npm run dev`
- Local inbox: `npm run inbox:up` — start/wait for Mailpit independently
- Build: `npm run build`
- **Verify (the gate): `npm run verify`** → runs `tsc --noEmit`, lint, and tests. A change is not done until this exits 0.
- E2E: `npm run test:e2e` (Playwright) — separate, slower gate; not part of `verify`. Prepares its own local test database automatically (migrated and wiped) before each run — see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the details.

## More context

`AGENTS.md` holds the core rules and points to task-specific references.
Each named directory under `docs/epics/` holds its `EPIC.md`, `stories/`, and
one maintained `HANDOFF.md`. Start with the target handoff's `Read first`
list; [docs/epics/README.md](docs/epics/README.md) describes the layout,
story skills, handoff format, and independent audit at epic closeout.

## Learn More

This is a [Next.js](https://nextjs.org) app. See the
[Next.js documentation](https://nextjs.org/docs) for framework features and
API reference.
