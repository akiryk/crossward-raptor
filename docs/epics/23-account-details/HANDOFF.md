# Account details — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. The [EPIC](EPIC.md).
3. [HISTORY, Orchestration](HISTORY.md#orchestration): the human's
   delegation for this epic.

## Current state (2026-11-09)

**EPIC approved by the human 2026-11-09.**

**Standing for every session of this epic:** the session is the
orchestrator (the human's words in HISTORY). Sub-agents draft, review,
implement and test; the orchestrator approves and freezes each story
after an independent review of the draft, decides open questions
itself (listed below), and asks the human nothing until every story is
delivered, then asks for the visual checks before closeout. Ask
earlier only if truly blocked.

- **S2 done** (frozen e90a745, implemented 37913ad direct to `main`,
  independently reviewed: no blockers).
- **S1 done** (frozen 826079d, implemented 6804021 direct to `main`,
  independently reviewed: no blockers, two nits left as is).
- **S3 is being drafted** by a sub-agent; its story, tests and edits
  were last seen uncommitted in the main checkout (worktree
  `/tmp/cw-s3` also exists). If present, finish and review them rather
  than starting over.
- Browser runs share the e2e database: every agent takes the lock
  `mkdir /tmp/crossward-e2e.lock` before a Playwright run and removes it
  after.

## Decisions for the visual check

1. **S2, "separate lists":** the username lists are their own but may
   share words with the puzzle-name lists, so the human's "Lil Orange
   Fox" can be generated. Shared: Cozy, Gentle, Happy, Jolly, Merry,
   Orange. "Happy Burly Harley" can't ("Harley" isn't a creature; nouns
   are creatures).
2. **S2, list shape:** slot 1 mood words (63), slot 2 look words:
   colours, patterns, textures (60), creature nouns (82); skin-tone
   colours and political/insult readings left out (story lists them).
3. **S1, hint rows:** stay 58px apart (the gap between rows grows from
   5px to 9px), so nothing moves at Create Hints; each hint answer sits
   closer to its line (capitals 7.77px under it, were 9.31px).
4. **S1, Hint Box word:** padding 8px top, 6px bottom, keeping its 30px
   box on the hint's baseline.
5. **S1, red Preview tooltip:** fits on one line at 12px (2.8px spare);
   the test allows one or two lines.
6. **S1, the caption:** `TextInput`'s caption names the field for
   screen readers (the caption itself hidden from them), so it isn't
   announced twice; it stays muted in every state.

## Verification

- S2 at 37913ad: `npm run verify` exit 0 (780 tests; 2 lint warnings
  outside the epic), run by the independent reviewer. No browser suite
  required.
- S1 at 6804021: `npm run verify` exit 0 (780 tests; 2 lint warnings
  outside the epic), run by the independent reviewer. Full
  `npm run test:e2e` by the implementer from a `git archive` copy of
  the same source tree (Turbopack can't build in a worktree nested in
  the checkout): 1288 passed, 1 failed, 18-S5-5 (`done-icon`, a corner
  pixel 3 off, recorded in the story as unrelated); its file reran
  8 of 8 passed.

## Next action

Finish S3's draft, review and freeze it; S3 is implemented on
`story/23-S3-email-only-sign-in` with a PR and independent review.

## Resume prompt

Read docs/epics/23-account-details/HANDOFF.md. Finish, review and freeze S3's draft, then implement S3 on its branch with a PR and independent review.
