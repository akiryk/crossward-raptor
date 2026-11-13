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

**S3 is implemented; PR #41 into `epic/24-collaboration` awaits independent
review.** [S3](stories/24-S3-editor-operations.md) was frozen at `a3c9d72`
(specification-only, on `epic/24-collaboration`), with one post-freeze
correction at `215468d`: a lint-only fix (`prefer-const`) to the frozen
`outbox.test.ts`, with no semantic change. The story records it, and the
reviewer should review it with the PR. S3 is implemented on
`story/24-S3-editor-operations`, runtime at `c08b412`; later commits are
docs only. It has no migration.

**Pending for the human (before the epic merges to `main`):**

- **Vercel Skew Protection is not determined.** The CLI available here
  (37.4.2) can't show project settings, and fetching the production HTML
  wasn't permitted. Check it under Project Settings → Advanced. The
  deploy-order implication is in S3's decision 13:
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

S3 (PR #41, author's runs at runtime commit `c08b412`):

- `npm run verify`: exit 0, 94 files, 1135 tests. There are fewer tests
  than S2's because the amendments deleted two superseded files.
- Full `npm run test:e2e -- --workers=2`: **1364 passed, 0 failed**, exit 0
  (12.2 min). Nothing needed a rerun.
- Frozen acceptance is unchanged since `215468d`.
- The story records which rules the tests discriminate.
- **Harness note for worktrees:** run E2E with
  `COMPOSE_PROJECT_NAME=crossward-raptor`. Without it, preparation's
  `db:up` creates a second Compose project, fails on the shared ports and
  skips the reset.

## Next action

Independent review of PR #41 (`story/24-S3-editor-operations` into
`epic/24-collaboration`) by an agent other than its author, including the
post-freeze correction `215468d`. The reviewer merges if there are no
blockers; S4 comes after. Not authorized: production migration, Vercel
settings, `main`.

## Resume prompt

Read docs/epics/24-collaboration/HANDOFF.md and docs/epics/24-collaboration/stories/24-S3-editor-operations.md. Independently review PR #41 into epic/24-collaboration and merge it if no blockers remain; no production migration, nothing into main.
