# Story S7 — The lock button's second starts over on refocus

When the grid gets focus back, the button beside an unlocked word waits a
full second again.

**Status: approved and frozen** by the orchestrator under the handoff's
delegation (2026-11-06). A fix to S2, from the closeout audit's open item 2; the human
asked for it to be fixed (2026-11-06). Depends on S2.

**Blast radius: small, expected off the risk paths.**
`src/components/grid/PuzzleGridEditor.tsx`. Direct delivery to `main`.

## What the code does today

The second's timer (`PuzzleGridEditor.tsx`, the `setLockDwell` effect)
runs whether or not the grid has focus. Blurring clears the dwell, but the
timer re-arms on the focus change and marks the cursor as having waited a
second later. When focus returns more than a second later, with the cursor
unmoved, the button and outline show at once. This contradicts EPIC "The
button" ("after the cursor has stayed in that word for 1 second", gone
"when the grid loses focus") and the code's own comment ("the button's
second starts over on return").

## Decisions

- Only time with the grid focused counts. When focus returns, the second
  starts over, however long the grid was without focus.
- A locked word's button and outline still show at once (S2).
- Nothing else changes: moving within the grid, the toggle row's Lock Word
  (S5, enabled at once), the tooltip (S4).

## Non-goals

- Changing the 1-second rule or any other S2–S6 behavior.

## Acceptance (frozen)

### `e2e/lock-refocus.spec.ts` (new)

TANGENT across row 3 on a daily, at 1440px.

1. **21-S7-1 back in an unlocked word:** after 1.5s without focus,
   refocusing the grid with the cursor unmoved shows no button or outline
   half a second later, and then the button (Lock word) and its outline
   within the next 1.5s. After 0.2s without focus, the same.
2. **21-S7-2 back in a locked word:** the button (Unlock word) shows at
   once, and the outline stays throughout.

### Discrimination

Run on 6367f7f (2026-11-06), before any runtime change: 21-S7-1's 1.5s
case fails, the button visible half a second after focus returns (the
timer ran while the grid had no focus). 21-S7-1's 0.2s case and 21-S7-2
pass, as expected: they guard behavior that already holds.

## Repo paths

Acceptance: `e2e/lock-refocus.spec.ts`. Runtime:
`src/components/grid/PuzzleGridEditor.tsx`. Docs: this story,
`../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
