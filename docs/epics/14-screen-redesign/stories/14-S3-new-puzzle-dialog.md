# Story S3 — New-puzzle dialog

Lay out the new-puzzle dialog's content from the human's mockup: a "Name
it!" Input and an "And pick a size!" Radio, each under its own `title-4`
heading, inside epic 13's Modal. The name field opens with a generated,
playful name ("Purple Crepe Bunny"), so a builder can create a puzzle
without typing one.

**Status: Decisions approved** by the human (2026-10-25). From their
Figma screenshot, they also set the title to "A New Puzzle!" and the gap
above "And pick a size!" to 32px, and confirmed `body-small` options. **Acceptance approved** by the human
(2026-10-25), with its amendments and the EPIC amendment, and frozen on
`main` in a specification-only commit.

**Blast radius: low-medium.** One dialog component, a new pure name
module, the shared `form` Radio's text size, a style-guide sample, and
amendments to frozen tests that pin today's copy, option size and empty
name. No server, schema or risk path: `createPuzzle` and
`NewPuzzleButton`'s create flow are unchanged, so this is direct delivery
on `main` under CODE-REVIEW.

## Decisions

Inspected `src/components/puzzle/NewPuzzleDialog.tsx`,
`src/app/puzzles/NewPuzzleButton.tsx`, `Modal`, `ModalActions`,
`TextInput`, `RadioGroup`, the `/style-guide` Inputs and Radio samples, and
every frozen test that opens the dialog: `new-puzzle`, `new-puzzle-resubmit`,
`modal-a11y`, `modal-design`, `inputs`, `toggle-radio`, `persistence`,
`session-validation`, `ownership`, `manual-login`, `sign-in`,
`puzzle-library`, `radio-source.test.ts` and `input-source.test.ts`.

**The human's mockup** (a Figma screenshot, 2026-10-25). The human gave
the panel as 302×375px. It measures 496×615 in the screenshot, so the
readings below divide by 1.64, not 2. The readings, rounded:

- header band about 51px tall;
- content inset about 14–18px;
- label to underline consistent with F5's 8px;
- underline to "And pick a size!" about 31px;
- heading to first option about 12px;
- options about 30px apart center to center (16px circles, 14px gaps);
- last option to the buttons about 30px;
- buttons to the panel's bottom about 26px.

Values the human states win over these readings: the gap is 32px, and
the options are `body-small`, which the human checked in Figma. The title
is the mockup's "A New Puzzle!". The mockup also shows no close ✕ and Mini
selected, but F4's close control (human) and Daily as the default (kept
behavior) stand. Epic 13's
F4 and F5 records of the same mockup gave the copy, confirmed by the
human's answers.

### Already in place (epic 13)

These stay unchanged:

- the Modal's panel, header, close button, content inset, footer and
  300–500px width (F4);
- Create (normal) then Cancel (alternate), via `ModalActions` (F4);
- the underline TextInput at regular size (F5);
- the `form` RadioGroup, with Daily selected by default (F6).

### Copy and headings *(human)*

- **Dialog title:** "A New Puzzle!" *(human, from the mockup)*, replacing
  "New puzzle". No frozen test pins the title.
- **Two headings,** both `title-4` `primary`:
  - "Name it!": the TextInput's visible label (`new-puzzle-name-label`,
    kept), replacing "Puzzle name".
  - "And pick a size!": a new line above the options (test id
    `new-puzzle-size-label`). It labels the radiogroup through
    `aria-labelledby`, replacing the invisible `aria-label="Puzzle size"`.
    `RadioGroup` gains an optional `labelledBy` prop, used instead of
    `label` when given *(agent)*.
- **Accessible names follow the visible text** *(agent)*. The field is
  named "Name it!" and the group "And pick a size!", so the names a screen
  reader speaks match the screen. `TextInput` requires an `aria-label`, so
  the dialog passes `aria-label="Name it!"`, matching its label, as the
  style guide's "Name it!" sample already does *(drafting)*.
- **Placeholder:** "Add name here...", replacing "e.g. Monday Puzzle". It
  shows once the field is emptied.
- **Size options:** "Mini (5×5)", "Midi (9×9)", "Daily (15×15)",
  "Sunday (21×21)" (kept).

### Size options' text *(human)*

`body-small` `primary`, as in the mockup. The change is to the shared
`form` Radio variant, so the style guide's `sg-radio-form` follows. The
new-puzzle dialog is the only other `form` Radio. F6's frozen
`body-normal` reads are amended (below).

### Layout

Inside the Modal's content (16px below the header, 16px side insets):

- The "Name it!" label, then the field 8px below it (F5's own gap).
- **More space below the field** *(human: "too tight in the existing app,
  … more space as in the mockup")*. Today the field's underline and the
  options are 12px apart, with no heading between. The "And pick a size!"
  heading now sits **32px** below the underline *(human)*.
- The options sit 12px below that heading, and 12px apart (F6's `form`
  spacing, kept).
- The footer stays 24px below the content (F4).
- The field fills the content width. The panel keeps F4's fit-to-content
  width, 300px to 500px.

### Generated default name *(human)*

- **The words:** a new pure module, `src/lib/puzzle-name.ts`, with
  hand-picked word lists of our own and no dependency *(human)*:
  - about 100 adjectives and about 100 nouns, all one word each, in title
    case, and nothing unpleasant;
  - `generatePuzzleName(random = Math.random)` returns "Adjective Noun
    Noun", e.g. "Purple Crepe Bunny", with two different nouns;
  - the random source is injectable, so unit tests are deterministic;
  - every name is well within the 80-character title limit.
  - The npm options (`unique-names-generator`, `random-word-slugs`) were
    considered and declined. Both are unmaintained, and their large word
    lists are uncurated.
- **When:** each time the dialog opens, it gets a fresh name. Cancelling
  and reopening gives a new one. There's no shuffle control *(human: "not
  now")*.
- **Create is enabled at open,** because the name isn't blank. The blank
  rule is kept: emptying the field, or leaving only spaces, disables
  Create, and typing a name re-enables it.
- **Selecting the name** *(human: select-all while untouched)*:
  - At open, the field has focus and the whole name is selected, so typing
    replaces it and Backspace empties it.
  - While the name is still the generated one, untouched, every click in
    the field selects all of it.
  - After the first edit, clicks place the caret normally.
- Creating with the untouched name saves it as the title, exactly as a
  typed name is saved.

### Behavior *(kept)*

These are unchanged:

- the dialog opens from Create A Puzzle, with the name field focused;
- Daily is the default size;
- the double-submit guard;
- Cancel, Escape, the close button and the backdrop dismiss the dialog,
  and focus returns to Create A Puzzle;
- creating navigates to the new puzzle's editor.

The test ids are unchanged: `new-puzzle-dialog`, `new-puzzle-name`,
`new-puzzle-name-label`, `new-puzzle-size` (with `data-size` and
`data-selected` on each input), `new-puzzle-create` and
`new-puzzle-cancel`.

### Style guide *(agent)*

- A new `sg-new-puzzle-dialog` sample: a button that opens the real
  dialog content, generated name included, in a Modal. Its Create and
  Cancel only close it, with no `createPuzzle` call.
- The Inputs section's "Name it!" sample stays, as the general example of
  a labelled Input.
- `sg-radio-form` turns `body-small` along with the variant.

### Carried observations

- **Modal clips content taller than the viewport:** this dialog is far
  under 800px tall, so the observation stays open.
- **Modal close button transition:** not touched, so it stays open.

### EPIC amendment

The generated default name is new puzzle-creation behavior, which the
EPIC's Non-goals exclude. With the human's approval, the freeze commit
makes three changes to the EPIC:

- The Non-goal "No new puzzle, publishing or play behavior beyond the
  named control moves (stepper, delete dialog, Build/Play's list filter)"
  adds "and the new-puzzle dialog's generated default name (S3)".
- "Behavior is kept unless a story says otherwise" adds the generated name
  to its list of departures.
- The S3 entry adds the two headings and the generated name.

### Retired and amended acceptance

Approving this story approves these amendments. They land only in the
specification-only freeze commit:

1. **`e2e/new-puzzle.spec.ts`** (D6-3) "create is disabled until a name is
   typed" becomes "create is enabled with the generated name, disabled
   once it is cleared, and enabled again by typing". The other D6-3 cases
   stay: `fill()` replaces the generated name.
2. **`e2e/modal-a11y.spec.ts`** "a disabled button is never a Tab stop"
   clears the name first, so Create is disabled before tabbing. Its
   assertions stay.
3. **`e2e/inputs.spec.ts`** (F5) "the new-puzzle name carries its name as
   a title-4 label above a regular field": the label text and the
   textbox's accessible name become "Name it!". The style, position, size
   and focus assertions stay.
4. **`src/components/ui/input-source.test.ts`** "sign-in is large and the
   two dialogs pass their names as labels": `label="Puzzle name"` becomes
   `label="Name it!"`.
5. **`e2e/toggle-radio.spec.ts`**:
   - F6-3 "stacked options … labels are body-normal primary" becomes
     "… labels are body-small primary" (12px/400).
   - F6-5 "the size picker is a form Radio with daily selected": the
     group's accessible name becomes "And pick a size!" (checked with
     `toHaveAccessibleName` instead of `aria-label`), and the option labels
     read `body-small`.
   - The file's header comment describing `form` labels is updated to
     match.
6. **`src/components/ui/radio-source.test.ts`**: the `text-body-normal`
   entry in `Radio.tsx`'s utility list becomes `text-body-small`.

Every other dialog test selects by test id, and fills the name with
`fill()`, which replaces the generated one. The discrimination run will
confirm this against a throwaway implementation.

## Acceptance *(approved, frozen)*

Three new files, plus the amendments above:

- `e2e/new-puzzle-dialog.spec.ts`: 9 browser cases at 1280×800, as the
  suite's signed-in builder;
- `src/lib/puzzle-name.test.ts`: 5 unit cases;
- `src/components/puzzle/new-puzzle-source.test.ts`: 3 source cases.

### e2e/new-puzzle-dialog.spec.ts

1. **14-S3-1 copy and semantics**
   - The dialog is named "A New Puzzle!", and `modal-title` reads it.
   - "Name it!" (`new-puzzle-name-label`) and "And pick a size!"
     (`new-puzzle-size-label`) are `title-4` `primary` Inter.
   - The focused textbox is named "Name it!".
   - The radiogroup's `aria-labelledby` is the size heading's id, it has no
     `aria-label`, and it's named "And pick a size!".
   - The four option labels, in order, are `body-small` `primary`.
   - Once the field is cleared, its placeholder is "Add name here...".
2. **14-S3-2 layout**, each within 1px:
   - 8px from the name label to the field;
   - 32px from the field's underline (its box bottom) to the size heading;
   - 12px from the heading to the first option, and between options;
   - 24px from the last option to Create;
   - the field spans the content box, and the label, heading, options and
     Create start on its left edge, 16px inside `modal-content`.
3. **14-S3-3 generated name** (5 cases)
   - At open: three title-case words with two different nouns, at most 80
     characters, wholly selected, and Create enabled.
   - Three openings give more than one name. There's no mocked random:
     three equal draws from about a million names is a one-in-10¹² event.
   - Typing replaces the name. Backspace then empties it and disables
     Create, and typing enables it again. Backspace at open empties the
     whole name.
   - While untouched, a click in the middle of the drawn name selects all
     of it, both while the field is focused and after focus has moved to
     the panel. After an edit, a click there leaves a collapsed caret inside
     the name.
   - Creating a Mini with the untouched name opens a 25-cell editor titled
     with it.
4. **14-S3-4 style guide:** `sg-new-puzzle-dialog`'s button opens a dialog
   named "A New Puzzle!", with both headings, a group named "And pick a
   size!" and a generated name. Its Create closes it, with no non-GET
   request and no navigation.

### src/lib/puzzle-name.test.ts

The module exports `PUZZLE_NAME_ADJECTIVES`, `PUZZLE_NAME_NOUNS` and
`generatePuzzleName(random?)`. The test checks that:

- each list has at least 80 unique `^[A-Z][a-z]+$` words;
- 2000 seeded names are "adjective noun noun" from the lists, with
  different nouns, at most 80 characters;
- the nouns differ even when the random source always returns 0, 0.5 or
  0.999999;
- the same seed gives the same names;
- 200 seeded draws give more than 190 distinct names.

### src/components/puzzle/new-puzzle-source.test.ts

- `NewPuzzleDialog` uses only the redesign tokens (S2's check).
- Its one `TextInput` has `label`, `aria-label` "Name it!" and the
  placeholder. Its one `RadioGroup` has `labelledBy` and no `label`. The
  source contains "And pick a size!" and `title="A New Puzzle!"`.
- `src/lib/puzzle-name.ts` has no imports, and `package.json` doesn't list
  `unique-names-generator` or `random-word-slugs`.

### Acceptance choices *(drafting)*

- New test ids: `new-puzzle-size-label`. The size options reuse F6's
  `new-puzzle-size-option`.
- The style-guide sample is found by its section and a role query, so its
  inner test ids are free.
- `tsc` can't pass until `src/lib/puzzle-name.ts` exists, because the
  unit test imports it. So `npm run verify` fails until implementation,
  by design.

### Discrimination (2026-10-25, observed)

- **Current `main`, uncommitted tests:**
  - Vitest: `puzzle-name.test.ts` fails to load. 2 of the 3 source cases
    fail, as do the amended input-source and radio-source cases. The
    tokens-only case passes, as a guard.
  - Browser, the new spec and the amended specs: all 9 S3 cases and 4
    amended cases fail (D6-3, F5-6, F6-3, F6-5); the others pass. The
    modal-a11y amendment passes before and after, as it should.
  - The two typing cases first passed on `main`, where an empty field
    satisfies them trivially. They now check the generated name before
    typing, and fail on `main`.
- **A throwaway implementation** of the Decisions (`puzzle-name.ts`, the
  dialog, `Radio`'s `labelledBy` and `body-small`, and the style-guide
  sample). It was then reverted, and a copy is kept outside the repo.
  - `npm run verify` passed: 46 files, 610 tests.
  - The full `npm run test:e2e` suite exited 0: 548 passed. That run came
    before the two typing cases gained their opening check. The spec, with
    the check, then passed 9 of 9 on the same implementation.
  - Two details it surfaced for the implementer:
    - `autoFocus` runs before the value is in the field, so the name is
      selected in an effect after mount.
    - Chrome collapses the selection when a click lands inside it, so
      while the name is untouched, the field's `mousedown` is prevented
      and the input is focused and selected by hand.
- **Five mutations on top of it,** each caught:
  - No size heading: 14-S3-1, 14-S3-2, 14-S3-3's click case and 14-S3-4
    failed.
  - A 24px gap: 14-S3-2 failed.
  - `aria-label` instead of `aria-labelledby`: 14-S3-1 failed.
  - An empty default name: 4 of 14-S3-3's cases and 14-S3-4 failed.
  - No select-all on click: 14-S3-3's click case failed.

## Repo paths

Acceptance (immutable after freeze): the new spec and unit/source tests
above, and the amendments under
[Retired and amended acceptance](#retired-and-amended-acceptance).

Runtime:

- `src/components/puzzle/NewPuzzleDialog.tsx`: the copy, the headings,
  the layout, the generated name and its selection behavior.
- `src/lib/puzzle-name.ts`: new, the word lists and generator.
- `src/components/ui/Radio.tsx`: `form` labels at `body-small`, and the
  optional `labelledBy` prop.
- `src/app/style-guide/page.tsx`: the `sg-new-puzzle-dialog` sample.
- This story, `../EPIC.md` (the amendment) and `../HANDOFF.md`.

Declare any other path before editing it.

## Scope discipline

Only S3. Out of scope:

- `createPuzzle` and the server;
- a shuffle control;
- generated names anywhere else;
- Create A Puzzle itself (S2);
- the Modal component's frame;
- other dialogs (S4, S7);
- responsive work (epic 15);
- old-token deletion (S8).

## Definition of done

- The human approves this specification, its acceptance, the amendments
  and the EPIC amendment, recorded here and in the handoff. Freeze on
  `main` in a specification-only commit before any runtime change.
- Frozen acceptance is unchanged after freeze.
- `npm run verify` exits 0, and the full `npm run test:e2e` suite exits 0.
- Visual check at desktop width against the mockup.
- Delivered on `main`, with the handoff updated with observed results.
