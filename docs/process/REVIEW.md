# Perform an independent PR review

[CODE-REVIEW](../CODE-REVIEW.md) owns risk triggers, reviewer independence,
review criteria, verification evidence and merge policy. Read it once for this
review, plus the named story's Decisions/Scope and the relevant epic decisions.
Use the [AGENTS](../../AGENTS.md) startup/report rules; open incident notes only
when the diff or a failure makes them relevant.

1. Identify the requested PR (or infer it unambiguously). Confirm you authored
   neither its implementation nor verification changes under review; otherwise
   arrange an independent reviewer or report the limitation.
2. Inspect the actual PR diff and affected callers against the specification.
   Record the exact head commit, frozen baseline and any unexpected scope.
3. Check configured CI (`gh pr checks <number>`) and verify required gate
   evidence under CODE-REVIEW. Reuse trustworthy results bound to this head;
   obtain missing/unverifiable results instead of assuming success. Do not
   rerun an identical expensive suite merely because you are a new agent.
4. Report findings with file:line evidence and consequence, separating blockers
   from non-blocking observations. If none, say so briefly; identify coverage
   limits and remaining manual checks.
5. When merge policy is satisfied, reconfirm the unchanged reviewed head and
   merge normally with `gh pr merge <number> --merge`. If it changed, review
   the new diff and checks first. Read back the merged state and merge commit.
   Report blockers rather than bypassing protections or asking again for an
   already-authorized merge. Honor report-only/manual-merge instructions.

Do not edit the implementation as its independent reviewer. Record outcome in
the active handoff when within scope and give the mandatory three-part report;
do not claim the next story is authorized by a successful merge.
