# Story S4 — Builder Hint Box

Below a 1000px window in the hints phase, the hint list under the grid
(S3's interim) gives way to the Hint Box: one hint at a time in a box
under the grid, with a 4px rule along its top and arrows that step
through the words in reading order. The box follows the grid's cursor,
and an arrow selects its word in the grid. From 1000px up, S2's hint
columns hold.

**Status: approved** (2026-10-29) *(human: "I approve S4")*. The human
supplied the Hint Box's mockup and colors (questions 1 and 2) and approved
the proposals for questions 3–5 as drafted. The spec file and unit test
are written and discriminate (below); frozen in the commit that adds
them.

**Blast radius: small.** The client components `PuzzleGridEditor` and a
new `HintBox`, a reading-order helper in `src/lib/`, three color styles
in `globals.css`, the style guide's catalog and a new sample. No server,
schema, engine or risk path, so delivery is direct on `main` under
CODE-REVIEW.

## Decisions

Inspected `PuzzleGridEditor` (S3's narrow column, `hints-region`,
`handleHintFocus`, the lock and published guards), `HintsPanel`,
`TextInput`, `hint-lookup`, the color styles and their frozen lists
(`globals-css.test.ts`, `color-tokens.spec.ts`), the style guide's
sections, and the frozen specs that open the hints phase below 1000px
(`editor-layout`'s phone case, `narrow-builder`).

### Where it shows _(human, the epic's Decisions)_

- In the hints phase below 952px of room in the editor (S3's
  `@container/editor` threshold, a 1000px window), the Hint Box takes the
  hint list's place under the grid, at the grid's width. The list
  doesn't show there; from 1000px up the box doesn't show and the list is
  as in S2.
- The build phase is unchanged (no skeleton, Preview's legend only, S3).
- Both are rendered and the container query hides one, as
  S3 does with the skeleton, so the switch needs no script and the
  window can be resized freely.

### The box _(human, the mockup, 2026-10-29)_

The human's mockup of the box (drawn at 2× over the old 526px grid) and
colors. Lengths are measured from it and rounded; the colors are the
human's.

- **The rule:** a 4px gray-700 bar (`hint-rule`, a new style) directly
  under the grid, 0px between them, the box's full width.
- **The outline:** the box's other three sides 1px gray-700
  (`hint-box-border`, a new style). The rule and outline are the box's
  own border. The box is the grid's width, 48px tall with the rule;
  the row is centered between the rule and the bottom outline.
- **Inside**, one row, vertically centered, 12px inside the outline:
  the left arrow, 12px, the word, 8px, the input, 12px, the right arrow.
  The word keeps its width; the input takes the room left.
- **The word** is the slot's answer, uppercase and letter-spaced, in the
  Hint Input's answer style (`label`, 0.1em), `muted` *(human)*.
- **The input** is filled blue-medium (`hint-box-input`, a new style)
  *(human)*, 30px tall, its text `body-normal` in `primary` *(human)*,
  10px from its left edge. No underline at rest (the mockup shows none);
  on focus, a 1px `line-highlight` underline as the Hint Input has, so
  focus shows *(approved, question 5)*. Its accessible name is the
  word's ("7 Across hint"), as in the list.

### The arrows _(human, 2026-10-29)_

- Left and right arrows (← →), "whatever is at hand" *(human)*. The app
  has no icon set, so they're inline SVG line arrows like the mockup's,
  in `primary`, in 24px buttons named "Previous word" and "Next word",
  with the focus ring like every other control.
- **Order** *(human)*: every Across word by number, then every Down word.
  Next wraps from the last Down to the first Across; Previous from the
  first Across to the last Down.
- The order comes from a pure helper in `src/lib/` (say
  `adjacentHintKey(lookup, key, step)`) over the slots `buildSlotLookup`
  already gives; the engine is untouched.

### Which word it shows _(approved, question 3)_

- **The cursor's word** in the cursor's direction (the active word the
  list marks today), whether focus is in the grid, the box or elsewhere.
  On load, nothing has focus (14-S6) and the box shows the word at the
  first active cell, Across (1 Across in a filled grid).
- When the cursor's cell has no word in its direction (an unchecked
  cell), the box keeps the word it showed last.
- **An arrow selects its word**: the cursor goes to the word's first cell
  in its direction, as focusing a list input does, and focus moves to the
  box's input, so the grid shows the hint's blue (14-S12) and typing
  edits the hint. *(The epic's one proposed detail.)*
- Typing in the grid moves the cursor and so the box's word, as the
  active hint follows it in the list today.

### Locked and published _(approved, question 4)_

- **Lock Grid Letters on:** the arrows and the input work as normal; only
  the grid's letters are locked (14-S12), as with the list.
- **Published:** the input is disabled, as the list's are; the arrows
  still step through the words, so the builder can read every hint.

### The style guide _(human)_

- A new `sg-hint-box` section: the Hint Box on a sample word, at 560px.
- The color catalog gains `hint-rule`, `hint-box-border` and
  `hint-box-input` *(names approved, question 5)*. `hint-rule` and
  blue-medium's fill are named for reuse by S5's play hint bar, which may
  take them or its own.

### Not changed

- The wide layout (S2), S3's narrow column, title, buttons and spacing;
  the grid's look and behavior; the hint list itself.
- Saving (a box edit saves as a list edit does), publishing, readiness,
  keyboard entry and the engine (`src/engine/**`).

## Non-goals

- Narrow play and its hint bar (S5).
- The grid shrinking below 608px, and the box's look below 608px beyond
  not overflowing (S6).
- Keyboard shortcuts for the arrows (Tab and Enter on the buttons only).

## Questions for the human

All answered *(human, 2026-10-29)*:

1. **The box's spacing:** the mockup; the values above are measured from
   it. The mockup's "44px under the rule (1 + 6 + 30 + 6 + 1)" counted a
   top outline the rule replaces; the acceptance pins 48px with the rule
   and the row centered in it.
2. **The arrows:** "whatever is at hand": inline SVG line arrows, 24px.
3. **What an arrow does:** approved as proposed; the box follows the
   cursor's word, and an arrow moves the cursor to its word and focuses
   the box's input.
4. **Locked and published:** approved as proposed; the arrows work in
   both, the input disabled once published.
5. **Focus and names:** approved as proposed; the 1px `line-highlight`
   underline on focus, and `hint-rule`, `hint-box-border` and
   `hint-box-input`.

## Retired and amended acceptance

Retired and amended in the freeze commit:

- **15-S3-7** "at 768px: the hint list 24px under the grid, at its width,
  unscrolled" (`e2e/narrow-builder.spec.ts`): the list no longer shows
  narrow. Replaced by 15-S4-1.
- **15-S3-1**, the hints phase at 999px: "the hints below the grid" reads
  `hints-region`. Amended to the Hint Box below the grid; the grid's
  width and centering assertions unchanged.
- **D5a-2** "hints stack below the grid on a phone"
  (`e2e/editor-layout.spec.ts`): amended to the Hint Box below the grid
  at 375px.
- `src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts`: the
  styles lists gain `hint-rule` (gray-700), `hint-box-border` (gray-700)
  and `hint-box-input` (blue-medium).

## Acceptance

`e2e/hint-box.spec.ts` (new), on a filled 5×5 (1–5 Across, 1–5 Down)
unless named:

- **15-S4-1 where it shows:** at 999 and 768px in the hints phase, the
  box under the grid at its width and the hint list hidden; at 1000px no
  box and the list beside the grid; in the build phase at 768px no box.
- **15-S4-2 the box:** the 4px `hint-rule` top at the grid's bottom, 1px
  `hint-box-border` sides and bottom, 44px under the rule; the arrows
  12px from its sides, 12px to the word, 8px from the word to the input
  and 12px from the input to the right arrow, all vertically centered.
- **15-S4-3 the word and the input:** the word in `label`, 0.1em,
  `muted`; the input 30px, `hint-box-input`-filled, its text
  `body-normal` `primary` 10px in, no underline at rest, named for its
  word.
- **15-S4-4 the order:** from 1 Across, Next ten times visits 2–5
  Across, 1–5 Down and wraps to 1 Across; Previous from 1 Across goes to
  5 Down. On a grid with a black square, the numbers skip as the
  numbering does.
- **15-S4-5 an arrow selects its word:** after Next, the cursor's word is
  the box's (the grid's hint-blue cells), and the box's input has focus.
- **15-S4-6 it follows the cursor:** clicking a cell of 3 Down (toggled
  to Down) shows 3 Down; on an unchecked cell the box keeps its word.
- **15-S4-7 editing saves:** typing in the box's input updates that
  word's hint, which survives a reload and shows in the list at 1440px.
- **15-S4-8 locked and published:** with Lock Grid Letters on, the arrows
  and input work; published, the input is disabled and the arrows step.
- **15-S4-9 the style guide:** `sg-hint-box` shows a box with both
  arrows, a word and a filled input; the catalog's three new swatches.
- **15-S4-10 no overflow:** at 640px and 375px, no horizontal overflow
  and the box within the window.

Unit: `src/lib/hint-order.test.ts` (new): the reading order, both wraps,
a single-word grid, and an unknown key.

**Discrimination** (2026-10-29, before implementation): the four browser
files ran 21 failed, 35 passed. Every 15-S4 case failed except "at 1000px
no box" and "build phase no box", which hold today by design. So did
amended 15-S3-1 (999px hints), D5a-2's phone case and F1-2/F1-4's
style lists. `hint-order.test.ts` fails (no module) and
`globals-css.test.ts` fails on `--color-hint-rule`.

## Repo paths

Runtime: `src/components/grid/PuzzleGridEditor.tsx`,
`src/components/grid/HintBox.tsx` (new), `src/lib/hint-order.ts` (new),
`src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`,
`src/app/style-guide/page.tsx`.

Acceptance: `e2e/hint-box.spec.ts` (new), `src/lib/hint-order.test.ts`
(new); amended `e2e/narrow-builder.spec.ts`, `e2e/editor-layout.spec.ts`,
`e2e/color-tokens.spec.ts`, `src/app/globals-css.test.ts`.

## Definition of Done

- The human answered the questions and approved this specification and
  its acceptance (2026-10-29), recorded here and in the handoff. The spec
  file was written and its discrimination observed before freeze. Freeze on `main`
  in a specification-only commit with the retirements and amendments.
- Implement on `main` (no risk path); the frozen acceptance is unchanged
  after freeze.
- `npm run verify` exits 0 and the full `npm run test:e2e` passes.
- The human's visual check passes: the hints phase at 999, 768 and 640px
  (the box, the arrows through a wrap, locked and published), the style
  guide's sample, and unchanged at 1000px.
