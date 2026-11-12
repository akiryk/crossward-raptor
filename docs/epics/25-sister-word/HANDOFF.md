# The sister word — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [25-S1](stories/25-S1-sister-word.md).

## Current state (2026-11-12)

**25-S1 approved and frozen (2026-11-12); implementation next.** The
specification and acceptance baseline is committed on `main`.

- A throwaway prototype of the runtime is set aside in
  `git stash` ("25-S1 prototype runtime"). It may become the
  implementation after the freeze, once checked against the frozen
  acceptance.
- The story is off the risk paths: direct delivery to `main`.
- Epic 24 (collaboration) is unaffected; its next job is unchanged.

## Verification

See the story's Discrimination: the new tests fail without the runtime,
and the full suite passes with the prototype apart from the three
amended cases and three `ECONNRESET` infrastructure failures, which pass
on rerun. No check has run on a committed tree.

## Next action

The human approves the story and its proposed acceptance, or corrects it.
Then commit the specification and acceptance baseline on `main` (the
freeze). Implement from the stash or afresh, and run `npm run verify` and
the full `npm run test:e2e`. Deliver to `main`, then the human's visual
check.

## Resume prompt

Read docs/epics/25-sister-word/HANDOFF.md and docs/epics/25-sister-word/stories/25-S1-sister-word.md. Record the human's approval, freeze 25-S1's acceptance, then implement it on main.
