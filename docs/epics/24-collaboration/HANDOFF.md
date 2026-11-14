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

**S1–S11 merged; one clean full E2E outstanding.** [S11](stories/24-S11-closeout-fixes.md)
([PR #50](https://github.com/akiryk/crossward-raptor/pull/50), independently reviewed, merged as
`4e68d5b`) fixed the four E2E failures and the audit's privacy finding.
Full E2E at `4e68d5b`: 1396 passed, 2 failed, both known flakes (Epic 18's
18-S5-5 pixel read; `ECONNRESET` on sign-in under load). A second full run
was stopped at the human's request (610 passed, 2 failed so far). The human
considers the epic done. [PR #46](https://github.com/akiryk/crossward-raptor/pull/46)
into `main` is OPEN, not merged; its description predates S8–S10.

**Final verification at `93943f8`** (clean detached worktree, Prisma Client
generated, `COMPOSE_PROJECT_NAME=crossward-raptor` so the existing test
database is reused, two workers, HEAD fixed, lock held):

- `npm run verify` exit 0: 113 files/1287 tests; 2 lint warnings, no errors.
- Full `npm run test:e2e`: **4 failed, 1394 passed**. All four are older
  frozen tests that S8's 14px toolbar broke and its affected runs missed:
  23-S1-2 build phase (Preview/Rebus 14 vs 12), 20-S1-1 (Reset Grid 12 vs
  Preview 14), 21-S5-1 (Lock Word 12 vs Rebus 14) and 22-S2-7 (at 540px
  the first save status wraps S8's link, moving the bar 30px).

**Independent report-only closeout audit** (fresh agent, author of none of
the audited work; 2026-11-14; commit `93943f8`; covered EPIC, S8–S10 in
full, S1–S7 by targeted checks over the earlier `0135adb` audit, the
`main...93943f8` diff, engine purity and PR states). No blockers. Findings
and disposition:

- Should-fix: PR #46 description stale → rewrite after the final full E2E.
  Epic index "closeout audited" stale → updated. EPIC lacked S8–S10 →
  follow-up stories and supersession notes added.
- Should-fix (privacy): library collaboration metadata reached outsiders on
  public/played published puzzles → the human chose own/shared rows only;
  fixed in S11.
- Notes accepted as-is: owner without username renders ", (owner)" (frozen
  14-S2-4); invitations listed under Current Collaborators; no test for the
  36px gap or the "Edit Collaborators" menu label; presence route not named
  in CODE-REVIEW risk paths (thin wrapper over the `actions.ts` risk path);
  stale "Collaborators…" comments in frozen files; S9/S10 freeze and
  implementation commits share timestamps (review order recorded in their
  stories/PRs); STORY's "before the epic's PR" wording; Epic 18 carry-overs.
- Note to fold into DEVELOPMENT later: HEAD changes invalidate E2E runs
  (deployment ID), and root lint scans nested `.claude/worktrees`.

**Human decisions (2026-11-14):** all build-toolbar controls at 14px (Reset
Grid and Lock Word too; only 23-S1-2 amended); collaborator metadata only on
puzzles the caller owns or collaborates on. See [S11](stories/24-S11-closeout-fixes.md).

Human cutover items remain:

1. Apply migrations in order: `20261112120000_add_puzzle_operations`,
   `20261113120000_add_puzzle_collaborators`, `20261114120000_add_puzzle_presence`.
2. Settle Vercel Skew Protection per EPIC “Retiring snapshot saves”.
3. Complete any outstanding original S3/S6/S7 visual checks listed in history.
4. Merge PR #46 only after verification, audit and human prerequisites are met.

## Verification and operating notes

Use a clean checkout for verify: root lint traverses historical nested
`.claude/worktrees` and generated output. Preserve those existing worktrees.
In a fresh worktree run `npx prisma generate` first and export
`COMPOSE_PROJECT_NAME=crossward-raptor` for E2E. Serialize browser suites
under `/tmp/crossward-e2e.lock`; guarded test resets have the standing grant
in DEVELOPMENT. Use two workers on this machine. Stop local dev before
browser runs sharing build output, and keep **git HEAD fixed throughout
build and run**: deployment identity changes trigger stale-tab reloads.
Restore `npm run dev` afterward; local inbox is `http://127.0.0.1:8025`.

## Next action

If the human wants the gate formally closed: one clean full E2E on
`epic/24-collaboration`, then rewrite PR #46's description (it predates
S8–S11). Do not deploy or merge main.

## Resume prompt

Read docs/epics/24-collaboration/HANDOFF.md. Complete final epic verification and arrange a fresh independent, report-only closeout audit on epic/24-collaboration; no production migrations, Vercel settings or `main`.
