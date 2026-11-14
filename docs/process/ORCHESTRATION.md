# Orchestrating with subagents

Canonical rules for an orchestrator that delegates story work to subagents, and
for those subagents. Story lifecycle, verification gates and review criteria stay
with [STORY](STORY.md) and [CODE-REVIEW](../CODE-REVIEW.md); this file governs
only how agents are chosen, briefed and run. Usage is the binding cost: every
agent step resends its whole context, so context size, agent count and run
length are what to minimize.

## Agents and models

Use the project agent definitions in `.claude/agents/`, not `general-purpose`,
for story work. Each definition fixes its model in its frontmatter.

| Role | Agent | Model |
| --- | --- | --- |
| Mechanical: run checks, finish already-implemented work, open PRs, draft docs and handoffs | `story-finisher` | Sonnet |
| Genuinely hard implementation (concurrency, sync, conflict, authorization logic) | `story-implementer` | Opus |
| Independent review of risk-path PRs | `pr-reviewer` | Opus |

Definitions load when a session starts. If one is missing in the current
session, use `general-purpose` with the same `model` override and tell it to
follow the definition file.

Do not start an agent for something the orchestrator can do in a few commands.
Prefer one agent per story; a reviewer may cover several stories' PRs at once.

## Context discipline

- Redirect every `npm run verify`, test and E2E run to a log under `/tmp`, and
  read only its summary (`tail -n 30`, or a grep for `passed|failed|Error`).
  Never read a whole log; open only the failing excerpt.
- Read AGENTS, the epic HANDOFF's top, the relevant EPIC story item and the
  immediately preceding story. Read other process documents only for the
  section governing the next step. Do not load past stories or history.
- Poll a long background run no more than about every 5 minutes.

## Runs and experiments

- Browser scope for stories integrated on an epic branch is in STORY,
  [Verification](STORY.md#verification): the story's own and directly affected
  spec files, with one clean full suite on the final epic branch.
- Experiments that disable one rule at a time to show what the tests catch
  cover only risk-path rules: authorization, sync and queue, and anything that
  could lose or corrupt data. List UI, layout and copy rules as "not tested by
  disabling (UI-only)".
- Reviewers reuse the author's verifiable evidence per CODE-REVIEW and never
  rerun a full suite.

## Waiting and limits

- No polling loops (`/loop`, cron, `ScheduleWakeup`) to check on agents;
  subagents report completion automatically.
- While waiting on agents, give no interim completion report or resume prompt.
- When an agent stops on a usage limit, resume that agent with `SendMessage`,
  stating the exact git state, rather than starting a new one. Do not repeat
  completed steps. If its context is very large and its work is committed or
  clearly staged, a fresh `story-finisher` in the same worktree is cheaper.
