# Crossward

Crossward is a web app for building and playing NYT-style crossword puzzles.
The grid engine — the pure logic core that owns words, numbering, hints, and
phase rules — is complete; the builder UI has not been started yet.

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- **Verify (the gate): `npm run verify`** → runs `tsc --noEmit`, lint, and tests. A change is not done until this exits 0.
- E2E: `npm run test:e2e` (Playwright) — separate, slower gate; not part of `verify`. Standing home for browser-driven builder tests once UI work begins. Runs against a dedicated Neon branch (`TEST_DATABASE_URL`), not the real database — that branch is not automatically cleaned up between runs.

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
