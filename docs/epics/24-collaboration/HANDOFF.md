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

**Closed 2026-11-14; merged to `main` via [PR #46](https://github.com/akiryk/crossward-raptor/pull/46).**
S1–S11 merged into `epic/24-collaboration`, each after its own PR and
independent review (#39–#45, #47–#50). [S11](stories/24-S11-closeout-fixes.md)
(PR #50, merged as `4e68d5b`) fixed the four E2E failures and the audit's
privacy finding. Full E2E at `4e68d5b`: 1396 passed, 2 failed, both known
flakes ([LEARNINGS](../../LEARNINGS.md) entry 10). The human declared the
epic done and authorized the merge.

**Production cutover (human, 2026-11-14):** before-check `prisma migrate status`
listed exactly the three pending migrations; `prisma migrate deploy`
applied `20261112120000_add_puzzle_operations`,
`20261113120000_add_puzzle_collaborators` and
`20261114120000_add_puzzle_presence`; after-check status "up to date",
`Puzzle` count 4 before and after, all 4 at `version = 0`, `resetEpoch = 0`.
Vercel Skew Protection is disabled (Pro-only feature, not in use).
The original S3/S6/S7 visual checks were not separately recorded; the
human's done declaration accepts the epic as is.

**Pre-S11 final verification at `93943f8`** (clean detached worktree, Prisma Client
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

- Should-fix: PR #46 description stale → rewritten at merge.
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

None in this epic. After the merge the human rotated the production
`neondb_owner` password (it was exposed in a session transcript), updated
Vercel and redeployed; production loads (2026-11-14). Open follow-ups: fold the
DEVELOPMENT notes above (HEAD changes invalidate E2E runs; root lint scans
nested `.claude/worktrees`); Epic 18's 18-S5-5 flake correction awaits the
human's approval.

## Resume prompt

Read docs/epics/README.md. Choose the next epic with me; no specification or implementation without approval.
