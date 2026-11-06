# Story S5 — Lock Word in the toggle row

When the grid has shrunk below its full width, a "Lock Word" / "Unlock
Word" text button beside Rebus replaces the button beside the word.

**Status: drafted 2026-11-06; acceptance tests not yet written; not
approved.** Depends on S2.

**Blast radius: small, expected off the risk paths.**
`src/components/grid/`. Direct delivery to `main`.

## What the code does today

The toggle row (`ToggleRow`, `BuilderSteps.tsx`) holds Preview at the
left and Rebus (`RebusControl`, `text-label`, `link-muted`) at the right
end. The grid is at most 700px wide and shrinks with a narrow window.

## Decisions

From the human (2026-11-06, EPIC "Small screens"):

- **When:** whenever the grid is narrower than its full 700px. At full
  width, S2's button beside the word is used instead, never both.
- **The button:** in the toggle row, left of Rebus with 20px between
  them, in Rebus's text style. It reads **"Lock Word"** or **"Unlock
  Word"** for the word under the cursor.
- **Enabled (blue, like Rebus)** as soon as the cursor is in a lockable
  or locked word, with no 1-second wait. Otherwise it's muted gray,
  disabled, and reads "Lock Word".
- **The outline** still follows S2's rule (1 second for an unlocked
  word, always for a locked one), as do the ticks and gray letters.
- **A tap** toggles the lock and doesn't take focus from the grid (like
  Rebus). There's no tooltip.
- **Preview on:** hidden. **Hints phase:** absent.

Delegated details, proposed:

- **"Muted gray"** is the `subtle` text colour (gray-600), as Reset Grid
  uses. It's the existing gray closest to what was asked for.
- **Measuring "shrunk"** from the grid's rendered width, not a window
  breakpoint, so it holds at every puzzle size and layout.
- **At 375px** the row fits Preview, Lock Word and Rebus without
  overflow. If the drafting phase finds it doesn't, the human decides.

## Non-goals

- Changing Preview's or Rebus's look or place.
- A tooltip here.

## Acceptance (proposed, to be written)

### `e2e/lock-word-toggle-row.spec.ts` (new)

1. **21-S5-1 which one (1440px vs 375px):** at 1440px, no toggle-row
   button. At 375px, no button beside the word, and the toggle-row button
   is 20px left of Rebus.
2. **21-S5-2 states (375px):** the cursor on an empty cell or a 2-letter
   run: disabled, gray, "Lock Word". In a 3+ letter word: enabled at
   once, blue, "Lock Word". In a locked word: "Unlock Word".
3. **21-S5-3 toggling:** a tap locks (gray letters, outline, ticks) and
   the grid keeps focus. Tapping again unlocks.
4. **21-S5-4 Preview:** hidden with Preview on.
5. **21-S5-5 no overflow** at 375px.

## Repo paths

Acceptance: the file above. Runtime:
`src/components/grid/PuzzleGridEditor.tsx`, a new small control (or a
`RebusControl` sibling) in `src/components/grid/`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
