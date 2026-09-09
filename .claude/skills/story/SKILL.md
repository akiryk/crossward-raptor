---
name: story
description: Implement a story file end to end against the verify gate. Relocates and commits its spec files first if they're still staged outside the repo (e.g. ~/Downloads), then implements and verifies in one pass. Low-blast-radius stories push straight to main; high-blast-radius ones (per docs/CODE-REVIEW.md) go to a branch and a PR instead. Invoke as /story <path-to-story-doc>.
---

# Implement a story

Story file: $ARGUMENTS

0. **Establish the specification baseline.**

   a. **Relocate staged spec files, if needed.** If the path in $ARGUMENTS
      is not already under `docs/stories/`, treat it as still staged
      outside the repo (e.g. `~/Downloads`) rather than as an error. Read
      it from wherever it is, then read its "Repo paths" section to find
      every file marked "already provided" — its acceptance tests, one or
      more of a Vitest `*.test.ts` file and a Playwright `e2e/*.spec.ts`
      file — along with the destination each entry names. Each of those
      files is expected to sit next to the story doc in the same source
      directory. Move (not copy) the story doc to `docs/stories/<name>.md`
      and each acceptance test file to the path its own "Repo paths" entry
      names. If any named file is missing from the source directory, stop
      and report which one rather than guessing or proceeding without it.
      This session must not draft or edit any acceptance test file's
      content — only relocate content already present from outside this
      session. If the story doc is already under `docs/stories/`, skip
      this step; the files are assumed already placed.

   b. **Verify and commit the baseline.** Read the story at its now-canonical
      path, then read its "Repo paths" section to identify every acceptance
      test file. Run `git status --porcelain` and `git ls-files` on the
      story file and on each acceptance test file. If any of them is
      untracked or has uncommitted changes, review the story and tests
      together. If they are coherent, commit only those specification files
      in a specification-only commit, excluding unrelated working-tree
      changes, and continue without asking. This commit is the immutable
      baseline used by step 4. If the story is materially ambiguous,
      contradicts the tests, or the tests appear erroneous, stop and report
      the specific issue instead of committing or implementing. This
      baseline commit always lands on `main`, regardless of blast radius
      (below) — it's the story doc and acceptance tests, which are the
      specification, not the implementation under review.

   c. **Determine blast radius.** Per `docs/CODE-REVIEW.md`: if any path in
      the story's "Repo paths" (already read in 0a/0b) touches
      `src/engine/**`, `src/lib/puzzle-storage.ts`,
      `src/app/puzzles/actions.ts`, or `prisma/**`, this is a
      high-blast-radius story. Create and check out a branch named
      `story/<story-file-basename-without-extension>` (e.g. a story at
      `docs/stories/05-D3-build-grid.md` gets `story/05-D3-build-grid`),
      branched from `main` right after the baseline commit above, before
      any implementation happens. Otherwise, stay on `main` — everything
      below is unchanged from a low-blast-radius story.

1. Implement the story. Do not pause for routine, safe local actions such as
   reading files, editing in-scope code, running tests, staging the story's
   files, or creating local commits. This includes step 0: relocating spec
   files, committing the baseline, implementing, and pushing at the end are
   one continuous pass — don't stop for a check-in between them.
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
   file, with a message naming the story. Once `npm run verify` (and
   `npm run test:e2e`, for any story whose Repo paths include an e2e spec
   file) has exited 0 per step 3:

   - **Low blast radius** (the common case): push to `main`, as always.
   - **High blast radius** (per step 0c): push the branch, then
     `gh pr create` with a body naming the story file and listing the
     files changed. Do not merge — a different agent reviews this PR
     against `docs/CODE-REVIEW.md` before it lands. Stop here and report
     the PR URL instead of a push confirmation.
7. Report: files moved into place (if step 0a applied), files created or
   changed, the verify result, the outcome of any Definition-of-Done item
   that requires demonstrating a failure rather than a pass, and — for a
   high-blast-radius story — the PR URL in place of a push confirmation.
