# Code review policy

Canonical risk, review and merge policy. [STORY](process/STORY.md) owns the
lifecycle and verification requirements; [REVIEW](process/REVIEW.md) is the
execution checklist. Frozen acceptance checks behavior; independent review also
checks scope, unused/duplicated code and specification conflicts.

## When review applies

A change requires a branch, PR and independent review if it touches:

- `src/engine/**` — shared pure logic;
- `src/lib/puzzle-storage.ts` — stored serialization compatibility;
- `src/app/puzzles/actions.ts` — authenticated server write paths;
- `prisma/**` — schema and migrations.

Check declared Repo paths before implementation and actual changed/new paths
before committing. The actual diff controls; an omitted risky path still needs
review. Other changes retain direct delivery to main unless the user/task
requires review. Specification-only main baselines follow STORY's approval and
freeze procedure separately from runtime risk classification.

## Independence and criteria

The reviewer must be a different agent/session from the implementation author
and any agent that changed verification code for that implementation. A different
vendor is useful when available, not a new access requirement. A reviewer may
run checks without losing independence; reviewing does not authorize code edits.

Look for concrete issues tests can miss: orphaned/dead code, duplicated behavior,
unexplained scope additions, contradictions of Decisions/Non-goals, serialization
incompatibility, engine impurity and vacuous acceptance assertions. Cite file:line
evidence and practical consequences; separate blocking from non-blocking findings.

Do not raise style/naming preferences, missing abstraction, speculative scale
concerns, tests for out-of-scope behavior or objections to deliberate recorded
decisions. Say briefly when no findings remain. Report coverage limits honestly.

## Verification evidence

The reviewed head must satisfy STORY's applicable verification gates, the
story's required demonstrations and all configured CI checks. A deployment
success is not unit/E2E evidence unless it actually runs those gates.

Trustworthy CI artifacts or retained local tool output may be reused, including
an implementation/testing agent's results, when the reviewer can verify the
command, scope, exit status, provenance and exact reviewed head. Precommit runs
need a recorded tested tree/content identity and confirmation that the resulting
commit contains the same tested content. Older results or an unsupported
"passed" statement do not establish a new head's success.

The reviewer remains responsible for independently inspecting the diff and
evaluating that evidence. Run required checks when evidence is missing,
unverifiable, invalidated by relevant edits or when a finding warrants it;
do not repeat an identical suite just because the reviewer/session changed.
Record absent CI as absent and obtain applicable local evidence. Pending,
failed or missing required checks never count as passing. No test weakening,
protection bypass or unapproved reset is permitted for speed.

## Merge after review

Once no blockers remain and required verification and configured CI pass, the
independent reviewer merges the unchanged reviewed head with a normal merge
commit (`gh pr merge <number> --merge`), then reads back the result. Invoking
this workflow authorizes that merge without another confirmation unless the
user requested report-only review/manual merging. The author does not merge
their own PR. If the head changes, review new changes and their checks first.
Honor branch protection; report a blocked merge rather than bypassing it.
