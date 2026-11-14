# Collaborative puzzle construction — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md), especially Stories, "Retiring snapshot saves",
   "Multi-user testing" and Decisions.

**Only if needed:** the source material, which is outside the repo and is
not a specification. The EPIC supersedes all three:

- the human's draft epic (`~/Downloads/draft-epic-collaboration.md`);
- the agent's technical investigation
  (`~/Downloads/collaboration-technical-investigation.md`);
- the human's decisions (`~/Downloads/response-01.md`).

## Current state (2026-11-14)

**Local-testing follow-up S9: merged into `epic/24-collaboration`.**
[Personal and current collaborator labels](stories/24-S9-collaboration-labels.md)
changes only three puzzle components: the signed-in owner/member reads “You”
in library rows, and the dialog shows a bold 14px “Current Collaborators”
heading above existing members. Other people’s names and account settings
retain actual usernames. [PR #48](https://github.com/akiryk/crossward-raptor/pull/48)
merged normally as `67488ce`, reviewed at `e11ba0d` (runtime `b7b569c`,
integrated tested head `ac436a0`). Independent reviewer `review_polish`
approved the scope, frozen display amendments (`38c6329`) and final diff
with no findings. Vercel and Vercel Preview Comments passed.
[Review evidence](https://github.com/akiryk/crossward-raptor/pull/48#issuecomment-6882549996).
The local checkout is back on the epic branch for continuing human testing.

The human explicitly approved the additional frozen narrow-layout test
correction (“1. Yes”): measure the full owner line, rather than the intrinsic
width of “You”. Independent review confirmed the original 90px minimum and
all overflow/date/control assertions are preserved. This was separately
refrozen on the epic at `287cc85` before affected verification resumed.
The initial run passed 81 of 84 browser checks; its three measurement failures
are recorded in `/tmp/epic24-s9-browser.log`. Initial clean-checkout verify
passed 113 files/1287 tests. Final author checks at `ac436a0`, including the approved
correction: **npm run verify exit 0, 113 files/1287 tests passed**;
**seven-file browser run exit 0, 84 passed, 0 failed, 51.8 seconds, two workers**.
Files: `collaboration-polish`, `collaborator-management`, `puzzle-library`,
`muted-text`, `account-details`, `account-email`, `narrow-margin`. Source/config
identity compared across 435 tracked files with zero mismatches against
`/tmp/crossward-24-s9-verify`; the reviewer independently compared 443 tracked
source/config/test files with that checkout and also found no differences.
The reviewer reused author verification/browser evidence and ran no suites.
Only handoff documentation changed after the tested head. Logs and identities:
`/tmp/epic24-s9-final-{verify,browser}.log` and
`/tmp/epic24-s9-final-verification.json`. E2E resets use DEVELOPMENT’s standing
grant. The full epic E2E gate remains due before main after these follow-ups.


**Local-testing follow-up S8: merged into `epic/24-collaboration`.**
[UI polish](stories/24-S8-collaboration-ui-polish.md) implements the human’s
five requests: grid-aligned Add/Edit Collaborators link, 14px controls, Rebus
colors, and owner-first library rows with collaborator names. Specification
baselines `59ff0a8` and `741e686` amend only requested old label/size assertions;
independent agent `review_polish` approved them before refreeze.
[PR #47](https://github.com/akiryk/crossward-raptor/pull/47) merged normally
as `af25b31`, reviewed at `0939aa8` (runtime `ede7d82`). Independent reviewer
`review_polish` found no blockers; Vercel and Vercel Preview Comments passed.
[Review evidence](https://github.com/akiryk/crossward-raptor/pull/47#issuecomment-6881792451).
The local checkout is back on this epic branch for continuing human testing.

S8 author verification: clean temporary checkout `npm run verify` exit 0, **113 files,
1287 tests passed**, including database cases; two existing lint warnings.
Stable-HEAD affected E2E rerun: **60 passed**, exit 0. Final expanded affected
run at `ede7d82`: **117 passed**, exit 0, 49.7 seconds, two workers, ten files:
`collaboration-polish`, `collaborator-management`, `toggle-radio`, `rebus`,
`builder-controls`, `puzzle-library`, `row-menu`, `menu-reset`,
`delete-published`, and `duplicate`. Verified source identity (435 tracked
files, no mismatches) is in `/tmp/epic24-s8-verification.json`; the reviewer
independently compared 443 tracked source/config/test files with the verified
checkout, also with no mismatches. The reviewer reused the author
verification/browser evidence and reran no suites. Docs-only
commits after `ede7d82` do not change that tested content. The guarded test reset uses DEVELOPMENT’s standing authorization.
Root-checkout verification hit generated files in old nested agent worktrees;
no worktrees or lint rules changed. An earlier browser run was invalidated by
a mid-run commit changing Next’s deployment ID (stale-tab reloads); its failures
are not claimed as passing evidence. Logs: `/tmp/epic24-s8-verify.log` and
`/tmp/epic24-s8-stable-browser.log`; final run:
`/tmp/epic24-s8-final-browser.log`. The full epic E2E gate is owed again after
S8 before main; the historical clean run below predates this follow-up.


**Historical S1–S7 closeout, before S8:** epic complete on its branch;
PR to `main` open as #46, not merged. The full E2E on `0135adb` was clean
(Verification, "Historical final full run"). This audit and full run predate
S8; a fresh full suite is required before main. The PR still waits for the
human's items (Next action).

**Historical closeout audit (2026-11-14, before S8).** Independent, report-only (a Sonnet agent
that authored none of the epic), scoped to the seven stories against the
EPIC, the epic's diff from `main`, its docs and the repo-policy files changed
during the epic. Static inspection only, at `0135adb`. No blockers.
Findings and disposition:

- The epic index's line was stale (said "S4 next"): fixed.
- S1's frozen Definition of Done asks for a full `npm run test:e2e` exit
  0, which S1's own runs never met (rerun policy below). Accepted: the
  final clean full run on the integrated branch, which contains S1,
  meets it. S1's frozen text is left unchanged.
- The `isOthers` citation was off by one line: fixed (122).
- The 18-S5-5 correction's branch was unspecified. Moot for the gate,
  since the final run passed clean. Left as a recommendation for the
  human (carry-overs).

All seven stories are merged. One independent review covered S6 and S7:

- **S7 merged:** PR #45, merge `29982d0`.
  - Reviewed at `d091d62` (runtime `1d5df64`), no blockers. GitHub saw a
    criss-cross conflict, so the reviewer pushed a content-neutral merge
    `16dd3d9`; its tree is identical to `d091d62`.
  - [Frozen](stories/24-S7-presence-and-conflicts.md) at `f4a0225`,
    amended at `b8fd5e6` (23-S3-U7, 24-S5-8, lint only). The reviewer
    checked the amendment.
  - Its migration, `20261114120000_add_puzzle_presence` (additive), is
    applied to the local development and test databases only.
- **S6 merged:** PR #44, merge `edcb6fb`.
  - Reviewed at `ffdd44e` (runtime `c352d0f`), no blockers.
  - [Frozen](stories/24-S6-collaborator-management.md) at `30ed5b9`,
    corrected at `6158a8b` (24-S6-4 types DOGMA). The reviewer checked
    the correction.
  - It fixes both S5 carry-overs: the `claimInvitations` races, and
    `lose` now always drops.
- **Reviewer evidence:** `npm run verify` exit 0 at `ffdd44e` (1248
  tests) and at `d091d62` (1282 tests). The review comments on #44 and
  #45 have the details.

**Carry-overs from the S6/S7 review (non-blocking):**

- **The `e2e/done-icon.spec.ts` 18-S5-5 flake predates S6.**
  - With `--repeat-each=10 --workers=2`, it failed 1 of 10 at `6158a8b`
    (before S6) and 2 of 10 at `d091d62`
    (`/tmp/review-base-done-icon-repeat.log`,
    `/tmp/review-s7-done-icon-repeat.log`).
  - It reads the icon's pixels once, right after `data-play-state` flips,
    which can land inside the row's 150 ms colour transition.
  - S6's "render-path weight" diagnosis is unsupported: the tested row
    has no menu. The `next/dynamic` import in `c352d0f` is harmless but
    is not the fix.
  - It passed in the final clean full run. A correction (poll until the
    pixel settles, as `expectRowColors` does) is recommended, but it is
    an Epic 18 frozen test, so it is outside this epic. It needs the
    human's approval under STORY's procedure, on `main`.
- **`src/lib/collab/conflict.ts:122` (`isOthers`)** treats an operation
  with an unknown author (its log user deleted) as another account's.
  This can only happen in a batch that also has known authors. It is
  rare.
- **`PuzzleRowMenu.tsx`'s comment** says the dialog chunk loads only once
  Collaborators… is chosen. It actually loads when an own unpublished
  row's menu mounts.

**S5 merged** into `epic/24-collaboration` (PR #43, merge `421f258`;
reviewed independently at head `2e6ec05`, runtime `f514378`, no blockers).
[S5](stories/24-S5-collaborator-membership.md) was frozen at `e29e562`.
The freeze amended two earlier frozen tests:
- 24-S1-15: "is the newest" became "is among them", because 24-S5-8 now
  carries that check;
- O3: helper only.

**S5 migration** `20261113120000_add_puzzle_collaborators` (two new
tables): applied to the local development and test databases only. The
human applies it to production, with S1's, before `main`.

S4 is merged (PR #42, `3d88b4b`; reviewed at head `6c982e8`, runtime
`172c9d8`), frozen at `5abfd4f`. Its review's two non-blocking items for
S5 are done (above).

**Human note: polling cost** (story, "Measurements"; not a blocker, since
the EPIC sets no cost limit):

- one catch-up request a second per visible editor, about four database
  transactions per idle poll;
- about 3,600 invocations and 14,000 small queries per editor-hour;
- for example, 10 builders with an editor open 2 h a day make about
  2.2 M invocations a month;
- Neon's compute stays awake while any editor is open.

Latency meets "about a second": commit to shown has a median of 0.8 s and
a maximum of 1.3 s. Push transport would be a separately approved story,
only if cost at scale calls for it.

S3 is merged (PR #41, `61068e2`; head `aa2547a`, runtime `c08b412`),
frozen at `a3c9d72`, with the lint-only correction `215468d`.

**Pending for the human (before the epic merges to `main`):**

- **Production migrations, in order:** S1's
  `20261112120000_add_puzzle_operations`, then S5's
  `20261113120000_add_puzzle_collaborators`, then S7's
  `20261114120000_add_puzzle_presence`. All are additive; none has been
  applied to production.

- **Vercel Skew Protection is not determined** (S3 reviewer's finding,
  2026-11-13). This is a human item before `main`, not an epic-branch
  blocker. The CLI available here (37.4.2) can't show project settings,
  and fetching the production HTML wasn't permitted. Check it under
  Project Settings → Advanced. The deploy-order implication is in S3's
  decision 13:
  - if it is on, either turn it off for the cutover, or deploy S1's fence
    first and wait its maximum age;
  - if it is off, the epic can deploy at once, after the migration.
- **A visual check of S3's save status and refusal note** (S3's decisions
  6 and 7), and of S6's and S7's (their stories, "Visual checks").

S2 is merged (PR #40, `0ded6ae`). S1 is merged into `epic/24-collaboration` (PR #39, `f51f969`). It was
[frozen](stories/24-S1-operations-commit-path.md) at `a1a4db0`. The migration `20261112120000_add_puzzle_operations`
is applied to the local development and test databases only; production
must get it, from the human, before the epic merges to `main`.

- 2026-11-09: the human answered D1–D9 and the agent drafted the EPIC.
- 2026-11-12: the human approved the architecture, product decisions and
  general order. They asked for:
  - smaller stories (about seven was suggested, not required);
  - the settled decisions folded in and the stale open questions removed;
  - a plan for old browser tabs during the switch from snapshot saves;
  - explicit multi-user tests of overlapping edits, revocation and
    reconnecting.
- The revision makes seven stories, close to the human's suggestion. The
  boundary changes are explained in the EPIC's "Why not other boundaries".
- The four former open questions are resolved by the agent's
  suggestions (EPIC, "Resolved with the epic's approval").
- 2026-11-12: the human approved the revised EPIC, including the split
  and those resolutions.

- 2026-11-12 (later): the human delegated the whole epic. They asked the
  agent to orchestrate subagents and finish every story without checking
  in on each decision, and they will review the result at the end. This
  explicitly delegates approval and freezing of each story's
  specification and acceptance (STORY, "Obtain approval and freeze").

**Authorization.** All seven stories: drafting, freezing under that
delegation, implementation, PRs and independent review. Not authorized:
production migrations, Vercel settings, or merging into `main` (which
deploys automatically).

**Delivery plan (agent's decision, 2026-11-12).** S1's migration must be in
production before any code using it reaches `main`, and production
migrations are the human's. So the epic is integrated on
`epic/24-collaboration`, branched from `main`:

- each story's frozen specification and acceptance is a separate
  specification-only commit on `epic/24-collaboration` (in place of
  `main`, so `main` stays deployable);
- each story is implemented on `story/24-Sn-<name>` from that baseline,
  with a PR into `epic/24-collaboration`;
- an independent reviewer agent reviews and merges each PR into the epic
  branch;
- at the end, one PR from `epic/24-collaboration` to `main`, merged only
  after the human applies the epic's migrations to production. The
  Vercel Skew Protection check (EPIC, "Retiring snapshot saves") is
  settled before that merge.

**Constraint for every story.** Each one is on the risk paths: a branch,
a PR and independent review.

## Verification

**Historical final full run (2026-11-14, orchestrator; before S8).** `npm run test:e2e --
--workers=2` on `epic/24-collaboration` at `0135adb`, after `pretest:e2e`:
**1396 passed, 0 failed, 0 flaky**, exit 0, 13.4 min
(`/tmp/epic24-e2e-full-0135adb.log`). Commits between that run and S8
were docs only; S8 adds runtime changes and needs a fresh full run before main.

**E2E evidence policy.** From S6 on (2026-11-14, under the human's usage
constraints), stories run only their own and directly affected spec files
(STORY, "Verification"; [ORCHESTRATION](../../process/ORCHESTRATION.md)). The
earlier policy (agent's decision, 2026-11-13), which S1–S5 followed: this 8 GB
machine stalls under the full suite (1353 tests). S1's six author runs and two
review runs never came out clean; every failure was a stall timeout or
timing read, and every failing file passed rerun alone. For merges into
`epic/24-collaboration` only (which deploys nothing), a full run with
`--workers=2` plus a clean rerun of every failing file is accepted, with
the reviewer's judgment that no failure is on the story's paths. **A clean
full `npm run test:e2e` on the final epic branch is required before the
epic PR to `main`.**

S1 (PR #39, reviewed independently at `7bd90b8`, code identical to
`3def6bc`): `npm run verify` exit 0, 1078 tests; full E2E `--workers=2`
1337 passed, 16 failed (15 timeouts, one save-timing read in
`start-over.spec.ts` 20-S1-4); the 8 failing files rerun alone: 111
passed, exit 0. Details in the PR's review comment.

S2 (PR #40, merged): author's runs at `cf0cf19` were `npm run verify` exit
0 (1156 tests), and full E2E `--workers=2` 1352 passed with 1 failure, a
pixel read in `done-icon.spec.ts`. That file passed rerun alone.

S3 (PR #41, merged at `61068e2`; reviewed at head `aa2547a`, runtime
`c08b412`; `c08b412..aa2547a` is docs only):

- Reviewer's `npm run verify` on `aa2547a`, in a separate worktree: exit
  0, 94 files, 1135 tests (including the `*.db.test.ts` files).
- Author's full `npm run test:e2e -- --workers=2` at `c08b412`: **1364
  passed, 0 failed**, exit 0 (12.2 min). The reviewer verified its
  provenance: the log, the worktree's reflog, and tested content identical
  to `aa2547a`.
- Reviewer's full E2E `--workers=2` on `aa2547a`: 1346 passed, 18 failed,
  all stall timeouts (1.5 h, under heavy memory pressure).
  - 8 of the 9 failing files were clean when rerun alone, after
    `pretest:e2e`.
  - `lock-button-side.spec.ts` was never clean in 4 attempts. Each attempt
    had a different lock-dwell timeout, and every case passed in at least
    one run on this head.
  - `editor-operations.spec.ts` passed 11/11.
- CI: Vercel and Vercel Preview Comments passed. Frozen acceptance is
  unchanged since `215468d`. Details are in the PR's review comment.
S4 (PR #42, merged at `3d88b4b`; reviewed at head `6c982e8`, runtime
`172c9d8`; `172c9d8..6c982e8` is docs only):

- Author's `npm run verify`: exit 0, 98 files, 1175 tests
  (`/tmp/s4-verify-precommit.log`, the tree committed as `172c9d8`).
- Author's full `npm run test:e2e -- --workers=2`: **1372 passed, 0
  failed**, exit 0, 14.1 min (`/tmp/s4-e2e-full-172c9d8.log`). The
  reviewer verified its provenance and reused it rather than rerunning:
  - the log names worktree `agent-a06ada9c0b4767d8d`;
  - that worktree's reflog has HEAD at `172c9d8` for the whole run;
  - the runtime is identical to the PR head.
- Reviewer's `npm run verify` on `6c982e8`, in a separate worktree: exit
  0, 98 files, 1175 tests (the S4 database tests ran).
- Reviewer's run of `e2e/live-sync.spec.ts` and
  `e2e/editor-operations.spec.ts`, after `pretest:e2e`: 20 passed.
- CI: Vercel and Vercel Preview Comments passed. Frozen acceptance is
  unchanged since `5abfd4f`.
- Rules disabled one at a time, and the measurements: the story; logs
  `/tmp/s4-rules.log`, `/tmp/s4-browser-rules.log`, `/tmp/s4-measure.log`.
- **Harness note:** a worktree needs its own `node_modules` (`npm ci`);
  the build fetches Google Fonts and failed twice on a fetch error, passing
  on retry.

- **Harness note for worktrees:** run E2E with
  `COMPOSE_PROJECT_NAME=crossward-raptor`. Without it, preparation's
  `db:up` creates a second Compose project, fails on the shared ports and
  skips the reset.

S5 (PR #43, merged at `421f258`; reviewed at head `2e6ec05`, runtime
`f514378`; `f514378..2e6ec05` is docs only; frozen acceptance unchanged
since `e29e562`):

- Reviewer's `npm run verify` on `2e6ec05`, in a separate worktree: exit
  0, 103 files, 1234 tests (`/tmp/s5-review-verify-2e6ec05.log`).
- Reviewer's `e2e/collaborators.spec.ts` after `pretest:e2e`: 10 passed.
  `e2e/username-step.spec.ts` (23-S3-7, given the reload delay): 26
  passed.
- The reviewer reused the author's full E2E run below and verified its
  provenance:
  - the log names worktree `agent-a84592eb271dafedc` at `f514378`;
  - the reflog has HEAD at `f514378` from 19:48 to 20:22, and the run
    ended at 20:18 after 12.9 min;
  - its `prisma/`, `src/` and `e2e/` are identical to the PR head.

  The one failure (an `ECONNRESET` on a sign-in request) isn't on S5's
  paths.
- CI: Vercel and Vercel Preview Comments passed. Review comment on PR
  #43.
- **Harness note:** in a fresh worktree, run `npx prisma generate` after
  `npm ci`. Without it, `verify`'s `tsc` fails on the new models.

Author's evidence:

- Author's `npm run verify` on `f514378`: exit 0, 103 files, 1234 tests
  (`/tmp/s5-verify-f514378.log`).
- Author's full `npm run test:e2e -- --workers=2` on `f514378`: 1380 passed, 1 failed (`menu-reset.spec.ts` 19-S3-1, an `ECONNRESET` on its sign-in request; rerun alone after `pretest:e2e`, 9 passed: `/tmp/s5-e2e-rerun-menu-reset-f514378.log`)
  (`/tmp/s5-e2e-full-f514378.log`, which names the worktree
  `agent-a84592eb271dafedc` and the head). An earlier full run on
  `8d8c66e` (`/tmp/s5-e2e-full-8d8c66e.log`): 1380 passed, 1 failed
  (23-S3-7, fixed by `f514378`'s reload delay; story, "Implementation").
- Rules disabled one at a time: the story's "What the tests catch"
  (`/tmp/s5-rules.log`, `/tmp/s5-browser-rules.log`).

S6 (PR #44, not yet reviewed; runtime `c352d0f`; frozen
acceptance unchanged since `6158a8b`, confirmed by diff):

- Author's `npm run verify` on `c352d0f`: exit 0, 107 files, 1248 tests
  (`/tmp/s6-verify-postfix.log`; identical counts to `7cf5cf9`'s
  `/tmp/s6-verify-7cf5cf9.log`).
- Author's full `npm run test:e2e -- --workers=2` on `7cf5cf9` (before
  the fix): 1383 passed, 3 failed (`/tmp/s6-e2e-full-7cf5cf9.log`); the
  3 failing files rerun alone after `pretest:e2e`
  (`/tmp/s6-e2e-rerun-7cf5cf9.log`): `builder-controls` 14-S4-6 and
  `menu-reset` 19-S3-1 passed; `done-icon` 18-S5-5 failed again
  (`/tmp/s6-e2e-rerun2-done-icon-7cf5cf9.log`).
- A baseline check of `e2e/done-icon.spec.ts` at `6158a8b` (no S6
  runtime), in a temporary detached worktree removed afterward: passed
  cleanly 4 times (`--workers=1` and `--workers=4`), ruling out a
  pre-existing failure. Story, "Implementation", has the full
  root-cause narrowing and the fix (`c352d0f`, `PuzzleRowMenu.tsx`'s
  `CollaboratorsDialog` import made `next/dynamic`).
- After the fix, the five affected spec files together at `c352d0f`,
  after `pretest:e2e`: 64 passed, exit 0
  (`/tmp/s6-e2e-5files-postfix.log`). Per the epic's integration-branch
  exception (STORY, Verification), no full-suite rerun for this fix; one
  clean full run is still owed on the final epic branch before `main`.
- Rules disabled one at a time: the story's "What the tests catch"
  (`/tmp/s6-rules.log`, `/tmp/s6-browser-rules.log`).
- Reviewer's correction: 18-S5-5 is a flake that predates S6, not an S6
  regression. It failed 1 of 10 at `6158a8b` under
  `--repeat-each=10 --workers=2` (Current state, carry-overs).

## Next action

All nine stories, including local-testing follow-ups S8 and S9, are merged into the
epic branch. Continue local visual testing and fix any newly reported problems
through independently reviewed story PRs into this branch. A clean full E2E
run on the final integrated branch is still required before main. PR #46 from
`epic/24-collaboration` to `main` is open and must not merge until the human:

1. applies the production migrations in order: S1's
   `20261112120000_add_puzzle_operations`, S5's
   `20261113120000_add_puzzle_collaborators`, S7's
   `20261114120000_add_puzzle_presence`;
2. settles Vercel Skew Protection (Current state);
3. does the visual checks: S3's save status and refusal note, S6's
   Collaborators dialog and shared rows, S7's session panel and its
   entrance, and the conflict outline and hint highlight fading;
4. merges the PR.

Not authorized for agents: production migrations, Vercel settings, `main`.

## Resume prompt

Read docs/epics/24-collaboration/HANDOFF.md. Fix any problem the human reports from testing epic 24 locally on epic/24-collaboration, through a story branch and PR into it; no production migrations, Vercel settings or `main`.
