# Story S4 — The lock button's tooltip

Hovering over the lock button for about a second explains it.

**Status: approved and frozen 2026-11-06** by the orchestrating agent,
under the human's delegation (HANDOFF). Depends on S2.

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

### Delegated decisions

Proposed by the drafting agent, for the human's visual check:

- **The delay is 1000ms**, starting when the mouse enters the button, and
  restarting on each new entry. A hover that leaves sooner shows nothing,
  then or later.
- **It hides at once** when the mouse leaves the button or the button
  goes (the cursor leaves the word or the grid loses focus).
- **After a click**, an open tooltip stays and switches to the new
  state's text in place.
- **Placement:** `Tooltip`'s own (above the button, 4px off, centered on
  it, or below when there's no room). It never covers the button.
- **Mouse only:** keyboard focus on the button and a touch tap show none.
- **Hook:** the existing `Tooltip` with `testId="lock-tooltip"` (it
  already carries `role="tooltip"`); the button is S2's "Lock word" /
  "Unlock word".

## Non-goals

- A tooltip on the toggle-row button (S5) or anywhere else new.

## Acceptance (frozen 2026-11-06)

The tests fix these names and hooks (delegated details): the tooltip is
`data-testid="lock-tooltip"`, `role="tooltip"`; the button is found by
its accessible name, as in S2. Timing: "not yet" is checked at once
after 500ms of hover (a timer can fire late under load, never early);
"shown" allows up to 1500ms more; "at once" is within 300ms.

### `e2e/lock-tooltip.spec.ts` (new, 1440px)

TANGENT across row 3 of a daily.

1. **21-S4-1 unlocked:** hovering over the open padlock shows nothing at
   500ms, then the unlocked text, Tooltip-placed above the button and
   not covering it.
2. **21-S4-2 locked:** on a locked word's button (shown at once on
   returning to the word), the locked text after the same delay.
3. **21-S4-3 leaving:** moving off hides it at once. A 500ms hover never
   shows it, even later; two 600ms hovers in a row don't either (the
   delay restarts). Shown, then the grid losing focus removes the button
   and the tooltip at once.
4. **21-S4-4 click:** clicking while it's shown changes it to the other
   text in place, and back.
5. **21-S4-5a keyboard / 21-S4-5b touch (guards):** Tab focus on the
   button, and a tap on it (`hasTouch`), show none after 1.5s.

### Discrimination (2026-11-06, observed on `main` at 63426f7)

- 21-S4-1 to 21-S4-4 fail: no `lock-tooltip` appears within 1500ms of
  hover.
- 21-S4-5a and 21-S4-5b pass, as guards against a tooltip shown on focus
  or on a tap. The 500ms "not yet" checks guard against a tooltip with
  no delay.

## Repo paths

Acceptance: the file above. Runtime: the lock button's component from S2
and maybe `src/components/ui/Tooltip.tsx`. Docs: this story,
`../EPIC.md`, `../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` exits 0.
- Delivered on `main`; the handoff records observed results.
