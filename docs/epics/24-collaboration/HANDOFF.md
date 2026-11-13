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

## Current state (2026-11-12)

**S1 is implemented; its PR awaits independent review (2026-11-13).**
[S1](stories/24-S1-operations-commit-path.md) was frozen at `a1a4db0` on
`epic/24-collaboration` (specification-only, under the delegation below,
with the amendments to three earlier frozen files listed in S1). The
implementation is `5ae6393` on `story/24-S1-operations-commit-path`
(pushed), with a PR into `epic/24-collaboration` (see Next action). Not
merged. The migration `20261112120000_add_puzzle_operations` is applied to
the local development and test databases only; production has not changed
and must get it, from the human, before the epic merges to `main`.

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

All on `5ae6393` (the frozen acceptance is unchanged from `a1a4db0`):

- `npm run verify`: exit 0, 1078 tests (two lint warnings already on
  `main`, in `e2e/reset-with-locks.spec.ts` and `request-logger/render.ts`).
  It now includes the `*.db.test.ts` files (DEVELOPMENT, "Database tests").
- Discrimination: S1, "Discrimination" (each rule removed fails a case;
  the baseline alone fails every new file).
- `npm run test:e2e`, full, under the standing E2E reset grant, on a heavily
  loaded machine (load averages 10–31, multi-minute stalls):
  - run 2: 1351 passed, 2 failed, both `ECONNRESET` in the auth helper
    (`duplicate.spec.ts` 16-S4-3, `menu-reset.spec.ts` 19-S3-1); those two
    files rerun alone after `npm run pretest:e2e`: 13 passed, exit 0;
  - run 4: 1342 passed, 11 failed (timeouts during stalls, including
    14-S4-5/6 Publish, which passed in run 2); the five failing files rerun
    alone: 76 passed, exit 0;
  - runs 1, 3, 5: stalls, a 180 s web-server startup timeout, and 33
    timeout or transition-timing failures at 1.7 h;
  - run 6, with `--workers=2` (a disclosed cap): stopped by the author
    after about 1.5 h at 598 passed, 10 failed: nine 12–16 min stall
    timeouts and `done-icon` 18-S5-5, a pixel read mid-transition after a
    play reset (also in runs 4 and 5; it passed in run 2 and alone).
  - **No full run was clean.** No failure was on a path S1 changes, and
    every failing file passed when rerun alone. The reviewer should get a
    clean full run on a quiet machine before merging.
- No `src/engine/**` change.

## Next action

Independent review of the S1 PR into `epic/24-collaboration` (REVIEW);
the reviewer merges it if no blockers remain. A clean full `npm run
test:e2e` on a quiet machine is still needed as evidence. Not authorized: production migration, Vercel settings, `main`.

## Resume prompt

Read docs/epics/24-collaboration/HANDOFF.md and docs/epics/24-collaboration/stories/24-S1-operations-commit-path.md. Review S1's PR into epic/24-collaboration; merge only into the epic branch, no production migration, nothing into main.
