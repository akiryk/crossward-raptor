# Story S11 — Keyboard focus ring

Keyboard focus on a button, a link, the Preview toggle or a Radio option
shows a 2px cyan outline. Mouse focus shows none.

**Status: approved and frozen** (2026-10-26). The human asked for it at
S10's visual check and placed it as a small change before S5. The human
approved its Decisions and acceptance, including the amendments
("I read and approve s11"), and chose to implement it later, after S5 is
drafted. Frozen on `main` in a specification-only commit.

**Blast radius: low.** One stylesheet rule and one color, one attribute on
Puzzle Row, two style-guide catalog rows, and amendments to frozen tests.
No server, schema or risk path, so this is direct delivery on `main` under
CODE-REVIEW.

## Decisions

Inspected `Button`, `PreviewToggle`, `Radio`, `Modal`'s ×, `Masthead`,
`PuzzleRow` and its row controls, the library's Delete/Reset, Play's
Reset/Retry, `ColorSwatches`, `globals.css`, and every frozen test that
reads an outline or keyboard focus (`buttons`, `toggle-radio`, `masthead`,
`modal-design`, `inputs`, `controls`, `puzzle-library`, `play-entries`,
`color-tokens`, `globals-css.test.ts` and the component source tests).

### The ring *(human)*

- **`outline: 2px solid #00f0ff`** on keyboard focus (`:focus-visible`)
  only. Mouse focus shows no ring.
- **On every button, including the Preview toggle, and on links.**
- **On Radio options too** (asked 2026-10-26: "Yes, Radio too").
- **This supersedes "No focus rings"**, a decision in both epic 13 and this
  epic (carried over and listed under Non-goals). The rest of that decision
  holds: hover's look still shows on keyboard focus, and inputs and the
  grid keep their own focus look.

### How it's drawn *(agent)*

- **A new palette variable and color style.** `cyan` is `#00F0FF`, and the
  `focus-ring` style references it. That keeps F1's rule that components
  use styles, never raw values, and it adds a row to each of the style
  guide's color lists.
- **No offset** (`outline-offset: 0`). The human stated only the outline.
  Without an explicit 0, Tailwind's `outline-hidden` on Button would leave
  a 2px offset.
- **One unlayered rule in `globals.css`**, rather than classes on each
  component. It covers every `button` and `a`, including the raw ones
  (Modal's ×, Sign out, the row's Delete/Reset, Play's Reset/Retry), and it
  wins over a component's `outline-none`. It also leaves the source tests
  that ban `outline-` classes in a component untouched.
- **The toggle and a Radio option are ringed as a whole,** on their
  `label`: the pill or circle, plus the text. Their inner parts (pill,
  knob, the Radio's circle and dot) stay ring-free. The toggle's checkbox
  is visually hidden, so it can't carry the ring itself.
- **A puzzle row is ringed as a whole** (its 10px corners) when its link
  has keyboard focus, because the link covers the row. The link itself
  isn't ringed. The row is marked `data-keyboard-focus-host`. The row's
  Delete or Reset is a button and is ringed on its own.
- **The ring color fades in** with the element's existing 150ms
  `transition-colors`, where it has one. Tests read the settled outline.
- **Not ringed:** text inputs (the title, TextInput, hint inputs) and the
  grid, which show focus their own way. Disabled buttons can't be focused.

### Not changed

- Hover's look, and its showing on keyboard focus.
- Mouse behavior, and every component's look when it isn't keyboard
  focused.

## Retired and amended acceptance

Approving this story approves these amendments, which land in the
specification-only freeze commit on `main`.

- **`e2e/buttons.spec.ts`:**
  - `look()`: its transparency check for an outline called the spec's
    `parseColor` inside the page, where it doesn't exist. That line had
    never run, because no button had shown an outline. It now tests for a
    transparent color in the page, with the same meaning.
  - F3-5 "keyboard focus shows exactly the hover look, with no focus
    ring" becomes "…the hover look plus the focus ring". The focused look
    equals the hovered look with `outline` set to the ring.
  - F3-6 "a selected button keeps its look under hover and keyboard
    focus": under keyboard focus, the selected look plus the ring.
  - The header comment notes the ring.
- **`e2e/masthead.spec.ts`:** F7-5's two cases expect the ring on the
  focused logo link and Sign out (were no ring), via a new
  `expectFocusRing`. Their titles and the header comment say so. The idle
  Sign out still has no ring.
- **`e2e/modal-design.spec.ts`:** F4-3's close-control case expects the
  ring on Tab focus (was no outline). Idle still has none.
- **`e2e/color-tokens.spec.ts` and `src/app/globals-css.test.ts`:** the
  `cyan` variable and the `focus-ring` style are added to their lists.
- **Retired:** none.

No other frozen test breaks. `toggle-radio.spec.ts`'s "no ring" checks
read the toggle's and the Radio's inner parts, which stay ring-free.

## Acceptance *(proposed)*

One new file, `e2e/focus-ring.spec.ts`: 13 browser cases at 1280×800, as
the suite's signed-in builder. Most use `/style-guide`'s samples. The real
screens are a seeded build-phase puzzle and `/puzzles`. "The ring" is
`outline: solid 2px rgb(0, 240, 255)` with a `0px` offset, read once the
element's transitions finish. Keyboard focus comes from Tab.

1. **14-S11-1 the color:** `--color-focus-ring` resolves to
   `rgb(0, 240, 255)`.
2. **14-S11-2 keyboard focus shows the ring (6 cases):**
   - each of the 8 catalog Buttons (four types, selected or not): none
     idle, the ring on keyboard focus, none once blurred;
   - the toggle, off and on: the ring on its label, none on the pill or
     knob, none once blurred;
   - a form and a nav Radio: the ring on the selected option's label, none
     on its circle; after an arrow key, the ring is on the newly selected
     option only;
   - the sample link, the masthead logo link and Sign out;
   - the dialog's ×, confirm and cancel, after opening it from the
     keyboard;
   - a puzzle row: the ring on the row, not on its link; Tab moves it to
     the row's control, and the row loses it.
3. **14-S11-3 mouse focus shows no ring (4 cases):**
   - clicking each catalog Button, the toggle, and a form and a nav Radio
     option: each is focused, with no ring;
   - pressing the sample link, the logo link, Sign out and a row's link
     (pressed and released off it, so nothing navigates): focused, with no
     ring;
   - after the dialog is opened by a click, its ×, confirm and cancel have
     no ring, and pressing the × shows none;
   - after a click, Tab shows the ring on the next control.
4. **14-S11-4 on the real screens (2 cases):**
   - the editor: 1 Edit the Grid and the Preview toggle have the ring on
     Tab; the toggle has none after a click; the title input and the grid
     have none on Tab;
   - the library: a row has the ring on Tab, and none once blurred;
     Build/Play has the ring on Tab, and none after a click.

### Observed *(drafting, 2026-10-26)*

- **Against `main`:** 10 of the 13 fail: the color, every keyboard case,
  "Tab after a click" and the two real screens. The other three mouse
  cases pass, as guards.
- **Against a throwaway** (the rule, `cyan` and `focus-ring` in
  `globals.css`; the row's attribute; the two catalog rows), kept outside
  the repo as `/tmp/crossward-drafts/14-S11-throwaway.patch` and reverted:
  all 13 pass.
- **A wrong variant,** `:focus` instead of `:focus-visible`, fails the four
  14-S11-3 cases and both 14-S11-4 cases.
- **Full `npm run test:e2e` with the throwaway and the amendments:**
  exit 0, 572 passed (559 before, plus these 13). Without the amendments,
  the six cases above fail.
- **`npm run verify`:** exits 0 on the drafting tree with the throwaway
  (608 Vitest tests). An earlier attribute name, `data-focus-ring-within`,
  failed `library-source.test.ts`'s `ring-` ban, so the attribute is
  `data-keyboard-focus-host`.

## Repo paths

Acceptance (immutable after freeze): `e2e/focus-ring.spec.ts` and the
amendments in `e2e/buttons.spec.ts`, `e2e/masthead.spec.ts`,
`e2e/modal-design.spec.ts`, `e2e/color-tokens.spec.ts` and
`src/app/globals-css.test.ts`.

Runtime:

- `src/app/globals.css`: `--palette-cyan`, `--color-focus-ring` and the
  rule.
- `src/components/puzzle/PuzzleRow.tsx`: `data-keyboard-focus-host`.
- `src/components/style-guide/ColorSwatches.tsx`: the two catalog rows.
- This story, `../EPIC.md` (S11, and the superseded "no focus rings"),
  `../../13-design-system/EPIC.md` (a pointer at its "No focus rings") and
  `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S11. Out of scope:

- changing hover looks or any component's unfocused look;
- focus looks for text inputs or the grid;
- focus order, focus trapping or dialogs' focus;
- S5's grid colors.

## Definition of done

- The human approves this specification and its acceptance, recorded here
  and in the handoff. Freeze on `main` in a specification-only commit
  before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- The human's visual check of the ring by keyboard and by mouse.
- Delivered on `main`, with the handoff updated with observed results.
