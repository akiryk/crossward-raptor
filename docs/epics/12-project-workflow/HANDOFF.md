# Project workflow — Handoff

## Read first

1. `AGENTS.md` — core rules, if not already loaded.
2. This handoff's Current state and Next action — both workflow stories are
   implemented, verified, and committed separately from Accounts A3.
3. For the next product task, `docs/epics/09-accounts/HANDOFF.md` → Read first,
   Current state, and Next action. No full history read is needed.

Read `docs/epics/README.md` when working with the documentation workflow.
Read this epic's `EPIC.md` and its relevant story only
when reviewing or changing the cleanup itself.

## Current state (2026-10-14)

Story 01 completed locally after verification and an independent closeout
audit on 2026-10-13. Story 02's installation and final validation completed on
2026-10-14: generic user-wide workflow skills are installed, and project policy
is retained in `docs/process/`. Its independent closeout review found no
blockers; the epic is complete locally. The cleanup was committed on `main`
in the standalone `Complete project workflow stories 01 and 02` commit,
separate from preserved pre-existing A3 work. Remote delivery is pending.
The user settled merge behavior on 2026-10-14: the independent reviewer merges
after no blockers remain and required verification/configured CI pass,
matching budget-app. Crossward's review docs and the installed shared review
skill reflect that decision.
All 74 existing epic,
story, and handoff documents were relocated into named epic folders. Story
IDs and historical decisions are preserved. Visual polish has a retrospective
epic index; ownership and play have planning handoffs. Existing handoffs now
begin with reading routes; accounts has a current A3 resume point above its
historical committed checkpoint.

The story/review/audit workflows use the new layout. The five workflows
(`story`, `handoff`, `audit`, `review-pr`, `grilling`) are actual files under
`~/.agents/skills/`, with matching `~/.claude/skills/` links to the same files.
This repo's five definitions and discovery links are removed. The existing
unrelated `~/.claude/skills/ready-to-exit` link is preserved. Crossward's
procedures remain in its process docs; shared skills do not depend on this
checkout. A fresh agent session can discover the user-wide skills; this
session's original catalog still describes the removed repo-local versions.
Pre-existing
A3 application/configuration work is outside this story and is preserved.

## Story 02 verification

- Installation preflight checked all five prepared/local hashes and all ten
  global destinations before mutation. The preparation files still existed
  and matched their manifest; no recreation or conflicting overwrite occurred.
- All five installed files match the prepared SHA256 manifest; metadata names
  and descriptions pass Ruby YAML validation. Codex destinations are actual
  files, Claude links resolve to them, and repo definitions/links are absent.
  All 165 protected application/test/script/config files still match the
  original intake hashes, including pre-existing A3 work.
  The bundled Python skill validator remains unavailable because PyYAML is
  missing; Ruby YAML validation was used without installing dependencies.
- `npm run verify` exited 0 after installation on 2026-10-14: 23 test files,
  308 tests passed. Type checking and lint passed with one pre-existing
  unused-variable warning in `request-logger/render.ts`.
- An independent portability review found and resolved a review-delivery
  mismatch with budget-app, then rechecked the user's automatic-merge decision
  across the prepared shared skill and Crossward's review/story docs. No
  blockers remain in the prepared policy. The review performed no external
  actions or installation.
- The final independent report-only closeout review found no blockers; see
  coverage below. No browser suite, database work, commit, push, or PR action
  ran for Story 02.
  Interactive skill invocation and a fresh-session discovery listing were
  not tested; discovery locations and metadata were checked directly.

## Story 02 closeout review

Completed 2026-10-14 by an independent report-only agent that authored none of
the installation or workflow changes. No blocking or non-blocking findings
in Story 02's installed state.

- Coverage: installer conflict preflight and exact removals; all five actual
  shared files and metadata; prepared hashes and both discovery locations;
  Claude link targets and unrelated skill preservation; portability and the
  settled reviewer-merges policy across shared/local workflows; 12 scoped
  documents' Markdown references; all 165 original protected-file hashes.
- The reviewer used this session's successful post-installation verify result
  and independently checked filesystem/preservation evidence. No external
  actions, browser or database work, interactive skill invocation, fresh-session
  discovery, or general product/historical audit formed part of this review.

## Story 01 verification

- `npm run verify` exited 0: 23 test files, 308 tests passed. Lint reported
  one pre-existing unused-variable warning in `request-logger/render.ts`.
- All 74 original documents have unique destinations. All 64 relocated
  epic/story specs preserve content except documentation-path updates.
- All 13 epic folders have `EPIC.md` and a `HANDOFF.md` beginning with
  `Read first`. Documentation references and Markdown links resolve;
  the removed duplicate story remains explicitly historical.
- All 165 application, test, script, and configuration files match their
  intake hashes, including pre-existing A3 edits. No acceptance test changed.
- All five skills passed YAML metadata/name/description/placeholder checks
  using Ruby's YAML parser. The bundled Python validator could not run because
  its PyYAML dependency is unavailable; no dependency was installed.
- No browser suite was run; this documentation-only story does not require it.

## Story 01 closeout audit

Completed 2026-10-13 by an independent report-only agent that authored none of
the cleanup. No blocking findings.

- A stale README pointer to E2E details and obsolete future-UI wording were
  corrected during review; the auditor rechecked the DEVELOPMENT.md link.
- Non-blocking, pre-existing drift: ownership and some older specifications
  cite "AGENTS.md rule 2" although the core rules are now unnumbered. The
  underlying scope decision is unchanged. Retained for later scoped doc work
  rather than rewriting preserved specifications in this layout cleanup.
- Coverage: all 74 destinations and 64 specifications; preserved historical
  handoff narrative; all 13 folder/reading-route structures; documentation
  references and Markdown links; five skills and shared links; all 165
  protected-file hashes; workflow consistency and representative active/planned
  handoffs. The auditor also corroborated the recorded accounts/play concerns
  by source inspection, without implementing them.
- Limits: no general product audit, no exhaustive audit of historical decisions
  or LEARNINGS, no browser tests, database work, or interactive skill execution.
  The auditor used this session's verify result and independently checked the
  preservation/layout evidence.

## Next action

Resume accounts A3 from `docs/epics/09-accounts/HANDOFF.md`. Keep the cleanup
changes separate from pre-existing A3 implementation when committing/delivering.
Story 02's shared-skill installation and validation are complete. After an
explanation of A3's session-validation gap, the user authorized resuming A3
with separate implementation/testing agents and independent review/merge.
No product implementation belongs in this epic.

Resume prompt: "Read `AGENTS.md` and
`docs/epics/09-accounts/HANDOFF.md`, follow its Read first list, and continue
A3 from Next action. The epic-12 cleanup is complete locally and committed
separately."
