# Epic: The completed puzzle

**Approved by the human 2026-11-03**, who delegated the specification's
approval and freeze ("Delegate freeze"). Stories:
[19-S1](stories/19-S1-completed-puzzle.md) the completed puzzle in play;
[19-S2](stories/19-S2-library-touches.md) orange completed rows, room
below the puzzles and a smaller Sign out, added by the human the same day;
[19-S3](stories/19-S3-reset-in-menu.md) Reset in the row menu with Delete
set apart, added after the human checked S1 and S2.

When a player finishes a puzzle correctly, the confetti plays, the puzzle
locks, and a message says it's complete. This epic tidies that screen and
lets the player play it again from there.

## The human's request (2026-11-03)

Recorded as given (the screenshot shows the intended layout, without the
Reset link):

1. Remove the blue primary hint section (the blue rectangle above the
   grid on desktop). It's empty because there's no hint and looks weird.
2. Remove the Rebus button; it's useless.
3. Remove the row that has the "Saved" text in it.
4. Change "This puzzle is complete. Your entries are read-only" to "The
   puzzle is complete." Remove the checkmark. *(The screenshot reads
   "This puzzle is complete."; the human chose "The puzzle is complete.")*
5. Add a button to reset the puzzle, aligned right with the grid and base
   aligned with the "complete" message, the same text size as the
   message, looking like a link (not a button) in blue, consistent with
   other links. Clicking it opens a confirm dialog. If the player
   confirms, the puzzle becomes unplayed and they can play it again.
6. With those removed, there won't be so much space between the title and
   the message, or between the message and the grid.

## Decisions

- **Only the completed puzzle changes.** An unfinished puzzle keeps its
  Prominent Hint, Rebus control and save status, and has no Reset.
- **This supersedes 17-S3's "Reset is only in the library"** for a
  completed puzzle. An unfinished puzzle still has no Reset in play.

## Non-goals

- The library's Reset, the confirmation dialog's wording, and
  `resetPlaySession` (reused unchanged).
- The narrow hint bar under the grid (the request names the desktop
  rectangle above the grid).
- The completion dialog and confetti.
