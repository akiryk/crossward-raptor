# Epic: Hint refinements

**Approved 2026-11-14.** Written from the human's request for recognized
linked clues. The human then relaxed case (any case counts) and the comma (not
required), and approved the drafting decisions. Each story's specification and
acceptance are approved and frozen on their own
([STORY](../../process/STORY.md)).

## The human's request

Restated (2026-11-14):

1. **Linked clues.** A builder can write an NYT-style cross-referencing
   hint, `With 28-Across, a Chinese dish with pancakes`. When Crossward
   recognizes the hint as a valid reference to another entry, the word
   `With` is highlighted in `interactive-faint-hover`.
   - **Why:** the highlight shows the builder that Crossward recognized
     the linked clue and that the house syntax is right. Recognition is
     strict in form so the highlight teaches that syntax.
2. **Strict form, any case.** Only the opening form `With
   <number>-Across` or `With <number>-Down` counts, in any letter case:
   `with 18-across` counts as much as `With 18-Across,`. The word `with`,
   the number, the hyphen and the direction must be there; a following
   comma is customary but not required. `28
   across`, `horizontal`, `See 28-Across`, `28-Across has a partner…`,
   multiple references and bare `28A` are ordinary text.
3. **Validated.** The referenced entry must exist in the current puzzle,
   in that direction. Highlighted `With` means a syntactically valid
   reference to an actual entry.
4. **The text is the source of truth.** No linked-clue field, table or
   stored metadata, and no rewriting of the hint. One pure recognition
   helper serves the builder and the solver alike.
5. **Builder and solver.** The highlight updates as the builder types,
   and solver-facing hints show it too.
6. **The referenced entry in the grid.** While a linked clue is the
   current clue, in the builder or in play, the referenced entry's cells
   take the same pale blue (`interactive-faint-hover`) as the sister word,
   a secondary highlight. The current word and cursor keep their look.
   Moving to another clue moves or removes it. No click, navigation,
   tooltip or cursor movement.
7. **No rich-text editor.** Hints stay native text fields. If inline
   highlighting while typing proved disproportionately invasive, the work
   would stop for the human. Inspection shows it isn't: see 26-S1.

## Stories

1. [26-S1 Recognized linked clues](stories/26-S1-linked-clues.md): the
   helper and `With`'s highlight in every hint field and hint display.
2. [26-S2 The linked entry in the grid](stories/26-S2-linked-entry.md):
   the referenced entry's cells while its linked clue is current.

S2 depends on S1's helper.

## Delivery

Neither story touches a CODE-REVIEW risk path (the helper lives in
`src/lib`, not `src/engine`). The stories are delivered on an epic branch,
`epic/26-hint-refinements`, so the human can test the whole epic before
it reaches `main`:

- Each story's specification and acceptance are frozen on `main`, then
  merged into the epic branch.
- An orchestrator runs the stories in order with subagents, per
  [ORCHESTRATION](../../process/ORCHESTRATION.md). Each story runs
  `npm run verify` and its own and directly affected E2E specs.
- After the last story come one full `npm run test:e2e` on the epic
  branch, the closeout audit, and then the human's visual check. Only
  then does the epic branch merge to `main`.

## Non-goals

- A linked-clue field, relationship table or any stored metadata.
- A rich-text hint editor, or rewriting hint text.
- Loose or alternate syntax, multiple references (`With 22- and
  28-Across`), bare `28A`.
- Navigating to, clicking or previewing the referenced entry
  (hovercards, tooltips).
- Changes to numbering, hint persistence, the build phase's sister word or
  the build-phase Preview.
