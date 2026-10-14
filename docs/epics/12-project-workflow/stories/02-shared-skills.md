# Story 02 — Share workflow skills across repositories

As a developer working in multiple repositories, I want user-wide workflow
skills that follow each project's own rules, so I can reuse the same commands
without maintaining project-specific copies or importing the wrong policy.

## Decisions

- Install generic `story`, `handoff`, `audit`, `review-pr`, and `grilling`
  skills in `~/.agents/skills/`, the documented Codex user-wide location.
- Link the same five skills from `~/.claude/skills/` for Claude. Preserve
  existing unrelated user skills and refuse to overwrite a conflicting name.
- Move Crossward's project-specific workflow instructions into
  `docs/process/{STORY,HANDOFF,AUDIT,REVIEW}.md`. Shared skills discover the
  current repository's policy through its `AGENTS.md` and process docs.
- Remove this repository's five skill definitions and Codex links after the
  shared versions are installed. Shared skills must be actual files under the
  user's home, not links back to this checkout.
- This supersedes Story 01's repository-local skill-location decision; its
  epic layout, focused handoffs, frozen tests, and audit rules still apply.
- Per the user's clarification, successful independent PR review includes
  merging after no blocking findings remain and required verification/CI pass.
  Align Crossward with budget-app's normal merge behavior. Honor explicit
  report-only requests, repo restrictions, and environment permissions.

## Scope

The five user-wide skill folders and Claude links; this repository's matching
skill files/links; its process docs, CODE-REVIEW.md, AGENTS.md, epic workflow README, and epic-12
status. No other repository, application/test file, database, or agent
permission/configuration file changes.

## Acceptance checks

1. Both user-wide skill locations resolve the five workflows. Codex's actual
   shared files have no dependency on the Crossward checkout.
2. The shared skills contain no Crossward-specific paths, commands, branch
   policy, or automatic push/migration authorization. Successful independent
   PR review merges under the current repo's policy and required gates;
   grilling remains the existing general planning interview.
3. Crossward retains its workflow rules in local process docs and references
   them through AGENTS.md. Existing handoff/epic conventions continue.
4. The five local skill definitions/links are removed without overwriting
   unrelated global skills. Installation preflights conflicts before mutation.
5. Validate skill metadata, destinations/links, local documentation references,
   and preservation of application/tests. `npm run verify` exits 0.
6. An independent report-only review checks portability and records coverage
   and findings in the epic handoff. No browser or database work is required.
