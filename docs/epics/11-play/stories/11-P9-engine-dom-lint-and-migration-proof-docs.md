# Story P9 — Engine DOM-globals lint and migration-proof docs

Resolve follow-ups 11 and 12 from the
[closeout audit](../HISTORY.md#closeout-audit-2026-10-20), as one task at
the human's request (2026-10-21):

- **11.** The engine lint rule doesn't ban DOM globals.
- **12.** `scripts/check-play-migration.mjs` is undocumented in DEVELOPMENT.

**Status:** approved by the human on 2026-10-21, with both pending
decisions resolved as recommended, and frozen on `main`. Drafted at
`ec6769f`. **Blast radius: none at runtime.** One lint
config block and one DEVELOPMENT subsection. `eslint.config.mjs` and
`docs/DEVELOPMENT.md` aren't CODE-REVIEW risk paths, and nothing under
`src/engine/**` changes, so delivery goes directly to `main` after approval.

## Problem

Checked against the files during drafting.

**11.** AGENTS says `src/engine/**` is pure: "no React, DOM, database
clients, input mutation or hidden retained state". `eslint.config.mjs`
enforces only the import half. Its `src/engine/**/*.ts` block uses
`no-restricted-imports` for React/Next and Prisma. `tsconfig.json` includes
the `dom` lib, so `window.localStorage` or `document.querySelector` in an
engine file type-checks and lints cleanly today. Nothing catches it before
review.

A grep over `src/engine` (20 `.ts` files) finds no use of `window`,
`document`, `navigator`, `location`, `localStorage`, `sessionStorage`,
`fetch`, `globalThis` or `self` as a global. The only hit is the word "self"
inside a test name string. So the new rule should pass on the current code
with no engine edits.

**12.** `scripts/check-play-migration.mjs` is the P1 proof that
`20261018180000_add_play_sessions` is additive. Here's what it does:

- It connects to the validated E2E database (`e2eEnvironment()`).
- It creates a random `p1_proof_*` schema and copies the shape of five
  public tables into it with `LIKE … INCLUDING ALL`, without copying any
  data.
- It seeds synthetic rows there, applies the migration SQL, and checks
  three things: rows are preserved with no backfill, the constraints hold,
  and deletes cascade.
- It drops the schema afterward.

It never writes to public tables or replays old migrations. It's cited by the
P1 story (:246) and HISTORY (:284), but DEVELOPMENT doesn't mention it, and
it's not wired into `verify` or `test:e2e`. It's tied to one migration: it
asserts that exactly one migration directory matches `/play.*session/i`.

## Decisions

- **11: Add `no-restricted-globals` to the existing engine block.** Ban
  the browser globals that reach the DOM or the browser's I/O:
  - `window`, `document`, `navigator`, `location`, `history`
  - `localStorage`, `sessionStorage`
  - `fetch`, `XMLHttpRequest`
  - `globalThis` and `self`, which close the obvious
    `globalThis.document` bypass

  Every entry carries the message "The grid engine is headless: no DOM or
  browser globals in src/engine/." Test files under `src/engine` stay
  covered, as they are by the existing import rule.
- **12: Document the script; don't delete or change it.** Add a short
  **One-off migration proof** subsection at the end of DEVELOPMENT's E2E
  environment section. It says:
  - what the script proves;
  - how to run it (`node scripts/check-play-migration.mjs`, with the test
    database up via `npm run db:up`);
  - that it touches only its own temporary schema on the validated test
    target, so it deletes no existing rows and needs no reset grant;
  - that it's historical P1 evidence, not part of `verify` or `test:e2e`;
  - that it will refuse to run if a second `play…session` migration is
    added.

  It links to the P1 story for context.

**Resolved at approval (2026-10-21, both as recommended):**

1. **Ban the list above.** The alternatives were a
  narrower DOM-only list (no `fetch`, `XMLHttpRequest`, `globalThis` or
  `self`), or a wider one that also bans timers (`setTimeout` and similar)
  and `Math.random`/`Date`. The wider list moves into "hidden state and
  determinism", which is broader than follow-up 11. It would also need a
  check of engine tests, which may build `Date`s.
2. **Document the script rather than retire it.** It's cited as P1 evidence and can be rerun cheaply. The alternative was to
  delete it and point the citations at its last commit, as P7 did for the temporary
  manifests.

## Non-goals

- Any edit under `src/engine/**`, `scripts/**`, `package.json` or tests.
- Fixing the script's `ROLLBACK` with no open transaction. It's harmless:
  Postgres warns and continues. Recorded here as an observation.
- Generalizing the script for future migrations, or wiring it into `verify`
  or `test:e2e`.
- Follow-up 10 and any new epic, such as rebus input.

## Acceptance

1. **Rule discriminates.** Add a temporary probe
  `src/engine/__lint-probe.ts`:
  ```ts
  export const a = window.innerWidth;
  export const b = globalThis.document;
  export const c = localStorage.length;
  ```
  `npx eslint src/engine/__lint-probe.ts` must exit non-zero, report
  `no-restricted-globals` for `window`, `globalThis` and `localStorage`, and
  show the headless message. Run it before the config change too: that run
  must exit 0, which shows the gap is real. (Drafting run at `ec6769f`: exit
  0, no findings.) Delete the probe afterward, and `git status` must show no
  probe file.
2. **No false positives.** `npm run verify` exits 0 with the new rule, with
  no change to any engine file.
3. **Script doc is accurate.** With the test database up, `node
  scripts/check-play-migration.mjs` exits 0 and prints its three `PASS`
  lines, matching the subsection's description. If the test database can't
  be started, record that and verify the description against the source
  instead. The script creates and drops only its own schema, so this isn't
  a reset.
4. **Preservation.** The diff touches only `eslint.config.mjs` (the engine
  block only), `docs/DEVELOPMENT.md` (the new subsection only) and
  `docs/epics/11-play/`. `git diff --check` exits 0. New relative links
  resolve.
5. **Handoff.** HANDOFF marks follow-ups 11 and 12 resolved by P9. Its next
  action points at the remaining follow-up 10, or at whatever the human has
  chosen next, and the resume prompt matches.

Browser suites are not required. No runtime or browser-driven behavior
changes (STORY, Verification).

## Repo paths

- `eslint.config.mjs`: the `src/engine/**/*.ts` block.
- `docs/DEVELOPMENT.md`: new subsection at the end of `## E2E environment`.
- `docs/epics/11-play/stories/11-P9-engine-dom-lint-and-migration-proof-docs.md`:
  this story, status updates.
- `docs/epics/11-play/HANDOFF.md`: state, next action, resume prompt.

## Definition of Done

Acceptance 1–5 pass and are recorded here. It's committed to `main` as one
commit naming P9 and pushed. HANDOFF names the next job.
