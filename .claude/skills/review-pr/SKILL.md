---
name: review-pr
description: Review the open PR in this repo against docs/CODE-REVIEW.md, the story it implements, and docs/LEARNINGS.md. Intended to be run by a different agent than the one that wrote the code. Invoke as /review-pr.
---

Review the open PR in this repo.

Read docs/CODE-REVIEW.md first — it defines what to look for and, just as
importantly, what not to raise. Then read the story doc the PR body names
(in docs/stories/), including its Decisions and Scope discipline sections,
and docs/LEARNINGS.md.

Then `gh pr diff` and review against that.

Do not comment on style, naming, or missing abstraction — this codebase
deliberately writes the minimum that solves the stated problem. Do not
re-raise anything the story already records as a deliberate decision.

Report findings with file:line references, ordered by significance, and
separate blocking from non-blocking. If nothing is worth raising, say so
in one line.
