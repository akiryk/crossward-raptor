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

## Current state (2026-11-13)

**S5 implemented; PR #43 pending independent review** (into
`epic/24-collaboration`). [S5](stories/24-S5-collaborator-membership.md)
was frozen at `e29e562` (a specification-only commit on
`epic/24-collaboration`, under the human's delegation). Runtime head
`f514378` on `story/24-S5-collaborator-membership`; the later commits are
docs only. The freeze amends two earlier frozen tests (24-S1-15: S1's
migration is no longer the newest; O3's in-memory store learns the
collaborator relation filter); no assertion changed. S4's two carried
review items are covered: 24-S5-9 pins saving the half-typed word before a
remote Start Over or Enter Hints, and the catch-up's log read carries the
predicate itself (24-S5-5).

**S5 migration** `20261113120000_add_puzzle_collaborators` (two new
tables): applied to the local development and test databases only. The
human applies it to production, with S1's, before `main`.

**Next:** independent review and merge of the S5 PR; then S6, with the
same draft, freeze, implement and PR procedure.

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
  `20261113120000_add_puzzle_collaborators`. Both are additive; neither has
  been applied to production.

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
  6 and 7).

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

**E2E evidence policy (agent's decision, 2026-11-13).** This 8 GB machine
stalls under the full suite (1353 tests). S1's six author runs and two
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

S5 (PR #43, pending review; runtime head `f514378`):

- Author's `npm run verify` on `f514378`: exit 0, 103 files, 1234 tests
  (`/tmp/s5-verify-f514378.log`).
- Author's full `npm run test:e2e -- --workers=2` on `f514378`: 1380 passed, 1 failed (`menu-reset.spec.ts` 19-S3-1, an `ECONNRESET` on its sign-in request; rerun alone after `pretest:e2e`, 9 passed: `/tmp/s5-e2e-rerun-menu-reset-f514378.log`)
  (`/tmp/s5-e2e-full-f514378.log`, which names the worktree
  `agent-a84592eb271dafedc` and the head). An earlier full run on
  `8d8c66e` (`/tmp/s5-e2e-full-8d8c66e.log`): 1380 passed, 1 failed
  (23-S3-7, fixed by `f514378`'s reload delay; story, "Implementation").
- Rules disabled one at a time: the story's "What the tests catch"
  (`/tmp/s5-rules.log`, `/tmp/s5-browser-rules.log`).

## Next action

1. An independent reviewer reviews S5's PR #43 against
   [S5](stories/24-S5-collaborator-membership.md) and merges it into
   `epic/24-collaboration`.
2. Then S6, Collaborator management and the library (EPIC, Stories item
   6): draft, freeze as a specification-only commit on
   `epic/24-collaboration`, implement on `story/24-S6-<name>` with a PR.
   No migration is expected.

Not authorized: production migrations, Vercel settings, `main`.

## Resume prompt

Read docs/epics/24-collaboration/HANDOFF.md. Have S5's PR #43 independently reviewed and merged into epic/24-collaboration; then draft, freeze and implement S6 (EPIC, Stories item 6) on a story branch with a PR into epic/24-collaboration; no production migration, nothing into main.
