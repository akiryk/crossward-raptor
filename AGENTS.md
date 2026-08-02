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
- **Engine purity** (no DOM/DB in the grid engine) → enforced by directory boundaries + lint, not by asking nicely. The engine module imports no React and no database client.
- **Domain / business rules** (e.g. current publish/unpublish behavior, phase-lock specifics) → `/docs`. Read `/docs` before touching the publish flow or the grid↔hints phase transition. These change; keep them out of baseline guidance.
- **Irreversible / dangerous actions** → `.claude/settings.json` permission gates, not prose. See below.

## Never do autonomously

Enforced in `.claude/settings.json` (this list is just the human-readable summary):

- No `git push`, deploy, or PR merge without confirmation.
- No database migrations or schema pushes without confirmation.
- No adding dependencies without asking.
- Never read or edit `.env*`.
- Never force-push or `rm -rf`.
