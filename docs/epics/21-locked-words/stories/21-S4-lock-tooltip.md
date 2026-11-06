# Story S4 — The lock button's tooltip

Hovering over the lock button for about a second explains it.

**Status: drafted 2026-11-06; acceptance tests not yet written; not
approved.** Depends on S2.

**Blast radius: small, expected off the risk paths.**
`src/components/grid/` (maybe a delay option in
`src/components/ui/Tooltip.tsx`). Direct delivery to `main`.

## What the code does today

`Tooltip` (20-S2) shows a dark bubble above its anchor, with no delay.
When it shows is up to the caller. Preview's cell tooltips are its only
use.

## Decisions

From the human (2026-11-06, EPIC "Tooltip"):

- **The text:** "Lock this word so you don't accidentally change it" on
  an unlocked word's button, "Enable changing this word" on a locked
  word's.
- **After about 1 second** of mouse hover over the button. It's mouse
  only, with no touch or keyboard tooltip, as for Preview's.

Delegated details, proposed:

- **The delay is 1000ms**, starting when the mouse enters the button. The
  tooltip hides at once when the mouse leaves or the button goes.
- **After a click**, an open tooltip switches to the new state's text in
  place.
- **Placement:** `Tooltip`'s own (above, or below when there's no room).
  It never covers the button.

## Non-goals

- A tooltip on the toggle-row button (S5) or anywhere else new.

## Acceptance (proposed, to be written)

### `e2e/lock-tooltip.spec.ts` (new, 1440px)

1. **21-S4-1 unlocked:** hovering over the open padlock shows nothing
   before ~1s, then shows the unlocked text.
2. **21-S4-2 locked:** on a locked word's button, the locked text.
3. **21-S4-3 leaving:** moving off hides it at once. A hover shorter than
   a second never shows it.
4. **21-S4-4 click:** clicking while it's shown changes it to the other
   text.

## Repo paths

Acceptance: the file above. Runtime: the lock button's component from S2
and maybe `src/components/ui/Tooltip.tsx`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
