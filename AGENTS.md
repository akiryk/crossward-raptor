# AGENTS.md

Crossward builds and plays NYT-style crosswords. Pure grid-engine correctness
comes first, followed by a clean creation UX.

## Core rules

- Story/epic Decisions, Non-goals and acceptance define product scope. Prefer
  the relevant current specification over general conventions or old history.
- Implement only the authorized task; preserve unrelated work. Record the
  starting worktree and keep unrelated changes out of commits and delivery.
- Frozen acceptance must not change to fit implementation. If a frozen test
  appears wrong, stop the affected work and report it; follow the correction
  procedure in [STORY](docs/process/STORY.md). Proposed tests remain editable
  only during the explicitly separate drafting phase.
- A code change is not done until `npm run verify` exits 0. Required browser
  coverage and documentation checks follow [STORY](docs/process/STORY.md#verification).
- `src/engine/**` is pure: no React, DOM, database clients, input mutation or
  hidden retained state.
- Existing-data deletion/reset requires applicable explicit authorization.
  The user-approved standing grant for the guarded local test reset is recorded
  in [database safety](docs/DEVELOPMENT.md#e2e-environment); reuse it without
  repeated confirmation. Isolation alone grants no additional permission;
  do not inspect/edit `.env*` files or bypass execution permissions.

## Session start and autonomy

This section is the canonical session-start/autonomy policy.

1. Use this file if already supplied; do not reread it merely to start a task.
2. Read only the target epic handoff's operational top and the active story or
   task instructions. Check live git state before relying on recorded status.
3. Read the specification sections, affected code/tests and process document
   governing the next action. Expand when a dependency or actual problem needs
   it; do not load all past stories, handoff history or incident notes.

Carry the authorized task through its implementation, checks and authorized
delivery without routine confirmations. Decide ordinary reversible implementation
and UX details using the specification; record material tradeoffs. Ask only for
material unresolved product/architecture decisions, true blockers, irreversible
or unsafe operations, or missing access/authorization. Continue unaffected work
while a necessary decision is pending. Do not invoke grilling automatically;
use it when requested or when a substantive decision needs an interview.

Use separate implementation/testing agents when useful and authorized; preserve
required reviewer independence. Serialize browser suites sharing a database.
Run ordinary commands directly, with narrowly reusable approval prefixes where
needed; avoid shell wrappers and changing log redirection. Report explicitly
when waiting for approval, user input or another agent. A denied operation is
not permission to bypass the boundary.

Finishing a story does not authorize the next story. Continue only when that
next task is already explicitly within the user's authorized scope.

## Rule owners and conditional reading

| Need | Canonical source |
| --- | --- |
| Drafting, human approval/freeze, implementation, checks and delivery | [STORY](docs/process/STORY.md) |
| Risk paths, independent review criteria, evidence and merge policy | [CODE-REVIEW](docs/CODE-REVIEW.md) |
| Performing an independent PR review | [REVIEW](docs/process/REVIEW.md) |
| Writing a concise operational resume point | [HANDOFF](docs/process/HANDOFF.md) |
| Epic locations, skills and closeout routing | [Epic index](docs/epics/README.md) |
| Local commands, E2E harness and data safety | [DEVELOPMENT](docs/DEVELOPMENT.md) |
| Specific recurring failure patterns | Relevant [LEARNINGS](docs/LEARNINGS.md) entry |
| NYT construction/solving conventions | Relevant [reference](docs/NYT-CROSSWORD-REFERENCE.md) section |
| Independent audit/epic closeout | [AUDIT](docs/process/AUDIT.md) |

Shared user-wide skills are wrappers around repository policy, not another
project-specific authority. This task's user instructions take precedence over
skill guidelines. Do not edit shared skills without separately authorized scope.

## Mandatory completion report

At every completed story and substantial session handoff, including a stop with
work in progress, give these three clearly named parts:

1. **Summary / status:** Changes, checks passed/failed/not run, actual delivery
   state (local, committed, pushed, PR, merged), remaining work and handoff link.
   Attribute other agents' results; do not present unobserved checks as your own.
2. **Human action:** `None` if none is needed; otherwise the precise necessary
   decision, approval, manual check or unblock. Do not turn routine steps into
   requests or imply that a pending PR has merged.
3. **Next-session prompt:** Copy-ready instruction naming the live epic
   `HANDOFF.md`, exact next task and minimum reading. If review/merge remains,
   request it rather than next-story implementation. If no task is authorized,
   say to await one; do not invent permission to proceed.

Keep the report concise. Logs and useful historical evidence belong in linked
records, not the human-facing completion message.
