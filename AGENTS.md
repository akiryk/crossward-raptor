# AGENTS.md

Crossward is a web app for building and playing NYT-style crossword puzzles. The primary user is the puzzle builder; correctness of the pure grid engine is the highest priority, followed by a clean creation UX.

## Core rules

- Story and epic docs are the specification. Respect their Decisions, Non-goals, acceptance criteria, and stated scope.
- Implement only what the task requires. Do not opportunistically refactor, reformat, generalize, or clean up adjacent code.
- Acceptance tests are frozen: never change them to make an implementation pass. If a test appears wrong, stop and report the problem.
- A code change is not done until `npm run verify` exits 0.
- `src/engine/**` is pure logic. It must not depend on React, the DOM, or database clients, and engine functions should not mutate their inputs or retain hidden state.

## Execution preferences

- For authorized story work, continue through implementation, verification/E2E, commits, PR, independent review/merge, and the next specified story. Ask when an unresolved decision, obstacle, or substantive issue requires the user; do not ask again for routine steps already covered by the task.
- Orchestrate separate implementation and testing agents when useful; keep review independent of both. Serialize E2E runs because they share the test database.
- Use direct commands and narrowly reusable approval prefixes for routine checks, especially `npm run test:e2e`. Avoid shell wrappers or log redirection that turn the same check into a new one-off approval. These preferences do not override the execution sandbox; when it requires approval, explain the boundary and request a reusable rule where supported.
- Make waiting for approval explicit in progress updates so the user knows work is paused.

## Read when relevant

- Epic layout, story skills, focused handoffs, grilling, or epic closeout → `docs/epics/README.md`
- Implementing a story → `docs/process/STORY.md`
- Writing or updating a handoff → `docs/process/HANDOFF.md`
- Auditing docs/code or closing an epic → `docs/process/AUDIT.md`
- Resuming an epic → its `docs/epics/<id>-<name>/HANDOFF.md`, starting with `Read first`
- Local setup, commands, databases, E2E tests, or dev-server problems → `docs/DEVELOPMENT.md`
- Intermittent failures, test-harness issues, visual bugs, or previously encountered failure patterns → `docs/LEARNINGS.md`
- NYT construction, clueing, numbering, or solving conventions → `docs/NYT-CROSSWORD-REFERENCE.md`
- Whether a change requires a PR/review, or how to review it → `docs/CODE-REVIEW.md`, `docs/process/REVIEW.md`

For current product behavior, prefer the relevant story/epic Decisions over general conventions or older documentation.
