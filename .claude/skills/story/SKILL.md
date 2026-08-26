---
name: story
description: Implement a story file end to end against the verify gate. Invoke as /story <path-to-story.md>.
---

# Implement a story

Story file: $ARGUMENTS

0. **Precondition.** Run `git status --porcelain` and `git ls-files` on the
   story's test file. If it is untracked or has uncommitted changes, STOP and
   report that the specification is not committed. Do not implement. The human
   commits the reviewed test file before implementation begins — this is what
   gives step 4 something to compare against.
1. Read the story. If anything in it is ambiguous or contradicts the test file,
   stop and ask — do not guess.
2. Implement it. Acceptance test files are the specification: never edit them.
   Exception: an autoformatter may reflow a test file. If that happens, report
   it explicitly and confirm `git diff` on the file shows whitespace only.
3. Loop against `npm run verify` until it exits 0.
4. Confirm `git diff` shows no changes to any `*.test.ts` file, and that
   `git status` shows no untracked `*.test.ts` files. If either check fails,
   revert and fix the implementation instead.
5. Update `docs/handoffs/01-HANDOFF-crossward.md`: amend the "Where things
   stand" paragraph to reflect this story's completion and the current test
   count, and add this story's new files to the "What exists" tree. Change
   nothing else in that file — the decision log, known issues, and next steps
   need judgment this session does not have. If the handoff already describes
   this story as complete, say so and change nothing.
6. Commit the implementation files, the amended handoff, and any amended story
   file, with a message naming the story. Do not push.
7. Report: files created or changed, the verify result, and the outcome of any
   Definition-of-Done item that requires demonstrating a failure rather than a
   pass.
