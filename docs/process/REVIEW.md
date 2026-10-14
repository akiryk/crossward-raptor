Review the open PR in this repo.

Read docs/CODE-REVIEW.md first — it defines what to look for and, just as
importantly, what not to raise. Then read the story doc the PR body names
(in `docs/epics/<id>-<name>/stories/`), including its Decisions and Scope discipline sections,
and docs/LEARNINGS.md.

Then `gh pr diff` and review against that.

Record the reviewed head commit and check `gh pr checks <number>`. Required
verification is `npm run verify` plus the story's required E2E checks, on that
same commit. Use CI evidence when it covers those checks; otherwise obtain
the required local results. If no CI checks are configured, record that and
verify locally. Do not treat pending, failed, or missing required checks as
a successful result.

Do not comment on style, naming, or missing abstraction — this codebase
deliberately writes the minimum that solves the stated problem. Do not
re-raise anything the story already records as a deliberate decision.

Report findings with file:line references, ordered by significance, and
separate blocking from non-blocking. If nothing is worth raising, say so
in one line.

When no blocking findings remain and required verification and configured CI
pass, merge the reviewed PR using `gh pr merge <number> --merge`, under
`docs/CODE-REVIEW.md` → Merge after review. The reviewer must be independent
of the author. Confirm the head has not changed; review new changes before
merging if it has. Respect a user's report-only instruction and repository
protection. Otherwise, no additional merge confirmation is needed. Report the
merge result and any remaining manual Definition-of-Done steps. If the merge
is blocked, report the concrete reason instead of bypassing the requirement.
