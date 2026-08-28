---
name: story
description: Implement a story file end to end against the verify gate. Invoke as /story <path-to-story.md>.
---

# Implement a story

Story file: $ARGUMENTS

0. **Establish the specification baseline.** Read the story, then read its
   "Repo paths" section to identify every acceptance test file listed there —
   there may be more than one (a Vitest `*.test.ts` file, a Playwright
   `e2e/*.spec.ts` file, or both). Run `git status --porcelain` and
   `git ls-files` on the story file and on each acceptance test file. If any
   of them is untracked or has uncommitted changes, review the story and
   tests together. If they are coherent, commit only those specification files
   in a specification-only commit, excluding unrelated working-tree changes,
   and continue without asking. This commit is the immutable baseline used by
   step 4. If the story is materially ambiguous, contradicts the tests, or the
   tests appear erroneous, stop and report the specific issue instead of
   committing or implementing. This session must not draft or edit any
   acceptance test file's content — only commit and implement against content
   already present from outside this session.
1. Implement the story. Do not pause for routine, safe local actions such as
   reading files, editing in-scope code, running tests, staging the story's
   files, or creating local commits.
2. Acceptance test files are the specification: never edit them.
   Exception: an autoformatter may reflow a test file. If that happens, report
   it explicitly and confirm `git diff` on the file shows whitespace only.
3. Loop against `npm run verify` until it exits 0. Additionally, for any
   story whose Repo paths include an e2e spec file, loop against
   `npm run test:e2e` until it exits 0.
4. Confirm `git diff` shows no changes to any acceptance test file identified
   in step 0, and that `git status` shows no untracked acceptance test files.
   If either check fails, revert and fix the implementation instead.
5. Identify the epic this story belongs to from its numeric prefix (e.g. a
   story file named `02-P1-persistence.md` belongs to epic `02`), then update
   the handoff file in `docs/handoffs/` sharing that same numeric prefix (e.g.
   `02-HANDOFF-builder-ui.md`). If no handoff file with that prefix exists,
   stop and ask rather than guessing which file to update. Amend the "Where
   things stand" paragraph to reflect this story's completion and the current
   test count, and add this story's new files to the "What exists" tree.
   Change nothing else in that file — the decision log, known issues, and
   next steps need judgment this session does not have. If the handoff
   already describes this story as complete, say so and change nothing.
6. Commit the implementation files, the amended handoff, and any amended story
   file, with a message naming the story. Do not push.
7. Report: files created or changed, the verify result, and the outcome of any
   Definition-of-Done item that requires demonstrating a failure rather than a
   pass.
