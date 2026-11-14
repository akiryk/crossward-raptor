# Collaborative puzzle construction — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. For final verification, [STORY — Verification](../../process/STORY.md#verification)
   and [DEVELOPMENT — E2E environment](../../DEVELOPMENT.md#e2e-environment).
3. For closeout, [AUDIT](../../process/AUDIT.md) and
   [Close an epic](../README.md#close-an-epic), then the [EPIC](EPIC.md),
   all ten stories in `stories/`, and affected code/docs as the audit requires.

**Only if needed:** [historical handoff and evidence](HISTORY-2026-11-14.md).
The three external source drafts named there are not specifications.

## Current state (2026-11-14)

**Implementation complete on `epic/24-collaboration`; final closeout pending.**
All ten stories are merged. Live checkout before this handoff update:
`1444b91`, clean and synchronized with origin. The human accepted the latest
local result (“Looks good”) and asked about transitioning back to Claude.

Local-testing follow-ups are independently reviewed and merged:

- [S8](stories/24-S8-collaboration-ui-polish.md), [PR #47](https://github.com/akiryk/crossward-raptor/pull/47):
  toolbar position/14px controls, Add/Edit labels, owner-first library rows.
- [S9](stories/24-S9-collaboration-labels.md), [PR #48](https://github.com/akiryk/crossward-raptor/pull/48):
  “You” for the viewer, Current Collaborators heading; approved frozen-test
  correction and its separate baseline are recorded in the story/history.
- [S10](stories/24-S10-collaborators-spacing.md), [PR #49](https://github.com/akiryk/crossward-raptor/pull/49):
  36px form-to-heading gap, measured in the browser.

The earlier independent audit and clean full E2E covered S1–S7 at `0135adb`.
**Neither covers S8–S10. A fresh independent closeout audit and a clean full
E2E run on the final integrated branch remain required.** The epic index's
older “closeout audited” description refers to that historical audit.

[PR #46](https://github.com/akiryk/crossward-raptor/pull/46) into `main` is
confirmed OPEN, not merged. Production migrations, Vercel settings and main
remain outside agent authorization. Human cutover items remain:

1. Apply migrations in order: `20261112120000_add_puzzle_operations`,
   `20261113120000_add_puzzle_collaborators`, `20261114120000_add_puzzle_presence`.
2. Settle Vercel Skew Protection per EPIC “Retiring snapshot saves”.
3. Complete any outstanding original S3/S6/S7 visual checks listed in history.
4. Merge PR #46 only after verification, audit and human prerequisites are met.

## Verification and operating notes

Latest author gate at `1883fc5`: `npm run verify` exit 0, **113 files/1287 tests**;
S10 affected browser suite **7 passed**. S8 affected coverage passed **117**;
S9 passed **84**. Independent reviewer `review_polish` inspected the diffs,
verified source identity, reused author evidence, confirmed configured CI and
merged PRs #47–49. Exact heads, commands, review links and logs are preserved
in history and PRs. No new application checks ran for this documentation update.

Use a clean checkout for verify: root lint traverses historical nested
`.claude/worktrees` and generated output. Preserve those existing worktrees.
Serialize browser suites under `/tmp/crossward-e2e.lock`; guarded test resets
have the standing grant in DEVELOPMENT. Use two workers on this machine.
Stop local dev before browser runs sharing build output, and keep **git HEAD
fixed throughout build and run**: deployment identity changes trigger stale-tab
reloads. Restore `npm run dev` afterward; local inbox is `http://127.0.0.1:8025`.

## Next action

Claude can orchestrate final full E2E verification and a fresh independent,
report-only audit covering S1–S10 and affected docs/code. A Claude session that
authored S1–S7 must delegate the audit to a fresh agent that authored none of
the audited files. The auditor edits nothing; the non-auditing orchestrator
records findings/disposition. Resolve any blockers through reviewed story PRs
into the epic branch, then recheck affected findings. Do not deploy or merge main.

## Resume prompt

Read docs/epics/24-collaboration/HANDOFF.md. Complete final epic verification and arrange a fresh independent, report-only closeout audit on epic/24-collaboration; no production migrations, Vercel settings or `main`.
