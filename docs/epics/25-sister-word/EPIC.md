# Epic: The sister word

**Approved with its one story's request (2026-11-12).** A one-story epic
for a build-phase refinement the human asked for while Epic 24
(collaboration) was being drafted. It is unrelated to Epic 24 and doesn't
change Epic 24's order.

## The human's request

Restated (2026-11-12):

- In the build phase, the **sister word** is the 180° image of the word
  the builder is typing, the word symmetry pairs it with. Today its cells
  turn white only where they are off; a sister that is already a word, or
  already white, shows no change.
- The sister word's cells show in a pale blue,
  `interactive-faint-hover`, whatever they are now: gray (off), white with
  a letter, or white without one (a symmetric hint).
- `interactive-faint` becomes #F1F8FC and `interactive-faint-hover`
  #E8F7FF. The puzzle rows and the toggle row, which use them, change
  with them.
- **Why:** seeing the sister word helps a builder decide whether to add
  or remove a letter, and shows which finished word they are
  complementing.

## Stories

1. [25-S1 The sister word](stories/25-S1-sister-word.md).

## Non-goals

- Any change to the cursor's word (21-S1, 22-S5), Preview, the hints
  phase, play or locks.
- Other palette changes.
