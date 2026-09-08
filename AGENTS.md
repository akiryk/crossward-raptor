# CLAUDE.md

Durable guidance for agents working in this repo. This file is behavioral + a thin factual layer only. Contingent domain rules live in `/docs`; irreversible-action protection lives in `.claude/settings.json`. Keep it short — prune it like code.

> Also used as `AGENTS.md` (symlink recommended: `ln -s CLAUDE.md AGENTS.md`) so Codex and Claude Code read the same rules. If you can't symlink, keep the two in sync.

---

## Project Overview

Crossward is a web app for **building** NYT-style crossword puzzles (and playing them). The primary user is the puzzle **builder**; the experience of creating a puzzle matters as much as playing one. The top priority is **correctness of the grid engine** — the pure logic core that owns words, numbering, hints, and phase rules — followed by a clean creation UX.

## Tech Stack

_(Confirm/adjust — these are the chosen defaults.)_

- Language: TypeScript
- Framework: Next.js (React)
- Database: Postgres via Prisma (SQLite locally to start)
- Package manager: npm
- Testing: Vitest
- Styling: Tailwind CSS _(placeholder — change if you decide otherwise)_
- Deployment: TBD _(Vercel is the default path; confirm before relying on it)_

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test` (or `npx vitest run`)
- Lint: `npm run lint`
- **Verify (the gate): `npm run verify`** → runs `tsc --noEmit`, lint, and tests. A change is not done until this exits 0.
- E2E: `npm run test:e2e` (Playwright) — separate, slower gate; not part of `verify`. Standing home for browser-driven builder tests once UI work begins.

**`npm run test:e2e` clears its own path automatically** (`pretest:e2e` →
`scripts/free-e2e-port.mjs`) before Playwright starts. Two things needed
clearing, not one: Playwright's webServer runs on its own dedicated port,
3100, distinct from `npm run dev`'s default 3000 (see
`playwright.config.ts`) — but a manually-running `next dev` for *this*
project blocks a second one even on a different port, since Next.js's
dev-server lock (`.next/dev/lock`) is scoped to the project directory, not
the port. The script clears both: it kills whatever holds that lock, and
whatever's bound to 3100 itself. No manual intervention needed.

**This is a personal dev machine, not shared infrastructure**, generally —
if a port or process is in the way of anything else, kill it and proceed
rather than stopping to ask. The worst case is restarting `npm run dev`,
not lost work.

---

## Behavioral rules

### 1. Think before coding

State assumptions explicitly; if uncertain, ask rather than guess. If multiple interpretations exist, surface them instead of silently picking one. If a simpler approach exists, say so. When something is unclear, stop and name what's confusing before writing code.

### 2. Simplicity first

Write the minimum code that solves the stated problem. No speculative features, no abstractions for single-use code, no configurability that wasn't requested, no error handling for impossible states. If 200 lines could be 50, rewrite it. A senior engineer should not call it overcomplicated.

### 3. Surgical changes

Touch only what the task requires. Don't "improve," reformat, or refactor adjacent code that isn't broken. Match existing style even where you'd choose differently. Remove imports/variables your own change orphaned; leave pre-existing dead code alone (mention it, don't delete it). Every changed line should trace directly to the request.

### 4. Goal-driven execution

Turn tasks into verifiable goals and loop until verified. For a grid-engine story, "done" is concrete: **its acceptance-criteria examples are encoded as tests and pass, and `npm run verify` exits 0.** Prefer writing the failing test first, then making it pass. For multi-step work, state a brief plan with a `verify:` check per step. Weak success criteria ("make it work") are a bug — push back and get a checkable one.

---

## Where the rules actually live

This file is the weakest enforcement layer — everything here is a suggestion the model may not honor. Stronger mechanisms own the important constraints; this file just points at them.

- **Success criteria** → the `verify` hook + each story's acceptance tests. Not prose here.
- **The tests are the specification** → acceptance test files are never edited
  to match an implementation. Enforced by `/story` step 4 and by review, not by
  this file. If a test looks wrong, stop and say so.
- **Engine purity** (no DOM/DB in the grid engine) → enforced by directory boundaries + lint, not by asking nicely. The engine module imports no React and no database client.
- **Domain / business rules** (e.g. current publish/unpublish behavior, phase-lock specifics) → `/docs`. Read `/docs` before touching the publish flow or the grid↔hints phase transition. These change; keep them out of baseline guidance.
- **Process knowledge from past incidents** (how bugs were actually found and fixed, not just what the fix was) → `docs/LEARNINGS.md`. Worth a look before debugging anything intermittent.
- **How the real NYT crossword is constructed and solved** (descriptive, not prescriptive — it records conventions, not requirements) → `docs/NYT-CROSSWORD-REFERENCE.md`. Worth a look before assuming or reinventing a convention.
- **Irreversible / dangerous actions** → `.claude/settings.json` permission gates, not prose. See below.

## Never do autonomously

Enforced in `.claude/settings.json` (this list is the human-readable
summary). Limited to actions that can't be undone — everything else
(routine pushes, dependency installs, `prisma migrate dev`, PR creation
and merges, deploys) runs without asking:

- Force-push, or anything else that rewrites shared/remote history.
- `prisma migrate reset`, `prisma db push --force-reset`, or any other
  command that drops data.
- `rm -rf`.
- Reading, writing, or editing `.env*` files — enforced both at the
  Read/Edit/Write tool level and by a PreToolUse hook that blocks any Bash
  command referencing them.

If a change to this list is warranted, it belongs here because the action
is irreversible, not because it's unfamiliar or high-effort.
