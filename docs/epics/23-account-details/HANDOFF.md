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
- **S1 is being drafted** by a sub-agent; its draft and proposed tests
  may exist uncommitted (`stories/23-S1-*`, `e2e/label-12px.spec.ts`,
  scratch measurement files and temporary runtime edits). If present,
  finish and review them rather than starting over.

## Decisions for the visual check

1. **S2, "separate lists":** the username lists are their own but may
   share words with the puzzle-name lists, so the human's "Lil Orange
   Fox" can be generated. Shared: Cozy, Gentle, Happy, Jolly, Merry,
   Orange. "Happy Burly Harley" can't ("Harley" isn't a creature; nouns
   are creatures).
2. **S2, list shape:** slot 1 mood words (63), slot 2 look words:
   colours, patterns, textures (60), creature nouns (82); skin-tone
   colours and political/insult readings left out (story lists them).

## Verification

- S2 at 37913ad: `npm run verify` exit 0 (780 tests; 2 lint warnings
  outside the epic), run by the independent reviewer. No browser suite
  required.

## Next action

Draft S1 (the 12px label) under `stories/`, have it independently
reviewed, approve and freeze it under the human's delegation, then
implement it direct to `main`.

## Resume prompt

Read docs/epics/23-account-details/HANDOFF.md. Draft S1 (The 12px label) from EPIC.md's Stories section on main; approve and freeze it under the human's delegation after an independent review.
