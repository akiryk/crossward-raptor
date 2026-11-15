# Story S1 — Recognized linked clues

**Historical decisions:** [S3](26-S3-linked-hints.md) supersedes With-only
recognition and individual word decoration after human visual review. S3 owns
the explicitly reviewed/refrozen acceptance amendments; other S1 behavior stays.

A hint that opens `With 28-Across,` or `With 7-Down,`, naming an entry the
puzzle has, is a linked clue. Its `With` is highlighted in
`interactive-faint-hover` wherever the hint appears: the builder's hint
fields as the builder types, and every solver-facing hint display.

**Status: Approved 2026-11-14** by the human, with case and the comma
relaxed and the
drafting decisions below accepted. Acceptance written and approved under the delegated freeze grant; see the handoff for its baseline commit.

**Blast radius: small, off the risk paths.** A new pure helper in
`src/lib`, one small display component, the hint fields and displays, and
a new style. Delivered on `epic/26-hint-refinements`.

## The human's request

See the [EPIC](../EPIC.md#the-humans-request), items 1–5 and 7.

## What the code does today

- **Hint text** lives in `hints: Record<string, string>`, keyed by
  `hintKey` (`"28-across"`). The current entries come from
  `buildSlotLookup(grid)` (`src/lib/hint-lookup.ts`), a map from that key
  to its `NumberedSlot`.
- **The builder edits hints in native textareas.** `WrappingField`
  (`src/components/ui/WrappingField.tsx`) is a one-line `<textarea>` that
  wraps and grows. It sits inside `TextInput` (wide layout, `HintsPanel`)
  and directly inside `HintBox` (narrow layout). Neither has a preview or
  render layer.
- **Solver-facing hints** are plain text in four places: `PlayerHints`
  (play's lists and the builder's hints-phase Preview), `ProminentHint`
  (above the wide play grid) and `PlayHintBar` (narrow play).
- **`interactive-faint-hover`** (#E8F7FF) reaches components only
  through styles (F1). Today the only grid-cell style using it is
  `build-cell-sister` (25-S1).

## The editor constraint

A native textarea can't style one substring. It doesn't need to here:
the recognized `With` is always the field's first four characters, on its
first line, starting at the content box's top-left corner. A decorative
layer can sit under or over just that word, using the field's own font,
size and padding: an `aria-hidden`, `pointer-events: none` span reading
`With`, with a transparent text color and the pale-blue background. No
mirroring of the rest of the text, no wrapping logic and no editor
rewrite are needed. The textarea, its value, focus, selection, caret and
`onChange` stay untouched.

## Decisions

From the human:

- Only `With <number>-Across,` and `With <number>-Down,` at the start of
  the hint are recognized. The entry must exist, in that direction.
- Letter case doesn't matter (`with 18-across` counts). The word
  `with`, the number, the hyphen and the direction must all be there.
  The comma is not required.
- `With` alone is highlighted (as typed, any case), in
  `interactive-faint-hover`.
- The text is the source of truth. Nothing new is stored.
- One helper serves the builder and the solver, with no second regex.

Drafting decisions (approved by the human 2026-11-14):

- **The exact pattern.** `^with ([1-9][0-9]*)-(across|down)\b`,
  case-insensitive: one space after `with`, a number with no leading
  zero, a hyphen, then `across` or `down` as a whole word. Anything may
  follow, including nothing, a comma or other punctuation. A leading
  space, `28 Across` and `With 28-Acrossword` are not recognized.
- **A self-reference isn't recognized.** `With 28-Across,` on 28-Across's
  own hint is not a linked clue. NYT never does it, and the grid
  highlight (S2) would coincide with the current word.
- **The helper.** In `src/lib/clue-reference.ts`, beside `hint-lookup`:

  ```ts
  parseClueReference(
    text: string,
    slots: ReadonlyMap<string, NumberedSlot>,
    ownKey?: string,
  ): { key: string; number: number; orientation: Orientation } | null
  ```

  Pure: it never changes its inputs. It's in `src/lib`, not
  `src/engine`, because it serves display and not grid correctness. That
  also keeps the epic off the risk paths.
- **A new style** `linked-clue` refers to `interactive-faint-hover`
  (components use styles, F1). S2's grid cells use the same style. The
  style guide lists it.
- **Solver displays.** A small `ClueText` component renders a hint: the
  highlighted `With` in a `data-testid="linked-clue-with"` span, then the
  rest of the text, unchanged. An ordinary hint renders exactly the text
  as today, with no extra element. `PlayerHints`, `ProminentHint` and
  `PlayHintBar` use it, and each needs the slot lookup and its row's key.
- **Builder fields.** `HintsPanel`'s and `HintBox`'s fields show the
  layer when their hint is recognized, at every render, so typing adds or
  removes it at once. It is under the text, so the letters keep their
  color and the caret and selection stay visible. Over the missing-hint
  pink and the cursor-word fill, the pale blue still marks `With`.
- **Always on.** Recognition doesn't depend on focus or the current clue.
  A recognized hint shows its `With` highlight everywhere it appears.
  Only S2's grid highlight follows the current clue.

## Non-goals

The EPIC's, and also: the grid (S2), the build phase, and any change to
`WrappingField`'s behavior for the title field.

## Acceptance (frozen)

Viewport 1440px unless stated. Colors written out (#E8F7FF).

### `src/lib/clue-reference.test.ts` (new)

`parseClueReference`, imported through the module's namespace so the
file type-checks before the function exists. A small grid with 1-Across,
4-Across, 1-Down, 2-Down, 3-Down (no 4-Down).

1. **26-S1-1 valid:** `With 4-Across, x` gives `{ key: '4-across',
   number: 4, orientation: 'across' }`; `With 2-Down, x` gives
   2-Down's. `With 4-Across,` and `With 4-Across` with nothing after
   them, `With 4-Across x` (no comma) and `With 4-Across: x` are
   recognized.
   `with 4-across,`, `With 4-across,`, `WITH 4-ACROSS,` and `with
   2-DOWN,` are all recognized.
2. **26-S1-2 no such entry:** `With 82-Across,` (no number), `With
   4-Down,` (wrong direction). Both null.
3. **26-S1-3 syntax:** null for `With 4 Across,` (no hyphen),
   `With4-Across,`, `With -Across,` (no number), `With 4 horizontal,`,
   `With 4-Acrosses,` (not a whole word),
   `See 4-Across,`, `4-Across has a partner`, ` With 4-Across,` (leading
   space), `With 04-Across,`, `With 1- and 4-Across,`, `With 4A,`.
4. **26-S1-4 self-reference:** `With 4-Across,` with `ownKey`
   `'4-across'` is null. With `'1-down'` it is recognized.
5. **26-S1-5 editing:** the same entry re-parsed as typed text changes:
   valid → `With 82-Across,` → null → `With 4-Across,` → valid again.
   The inputs are unchanged.

### `e2e/linked-clues.spec.ts` (new)

The highlight is found as `linked-clue-with`: its text the hint's
first four characters (`With` as typed, any case), its
background #E8F7FF, its box inside the field (builder) or the hint
element, at that element's text start.

6. **26-S1-6 builder, wide:** in the hints phase, typing `With 1-Across,
   a dish` into 1-Down's field shows the highlight on its first word.
   The field's value is exactly the typed text, and after a reload the
   saved hint is the same text.
7. **26-S1-7 builder, live:** changing `1` to `82` removes the highlight
   at once, and changing it back restores it. `With 1-Down,` (the field's
   own entry) has none. `with 1-across, x` is highlighted (its `with`).
   Ordinary hints and `With 1 Across,` have none, and their fields'
   backgrounds match an untouched field.
8. **26-S1-8 builder, narrow (390px):** `HintBox` shows the highlight
   for a recognized hint and none after it is broken.
9. **26-S1-9 play:** a published puzzle with one linked clue and one
   ordinary hint. The linked clue's `With` is highlighted in
   `PlayerHints` and, with its word selected, in `ProminentHint`. At
   390px, it is highlighted in `PlayHintBar`. The ordinary hint has no
   `linked-clue-with` anywhere, and its text is unchanged.
10. **26-S1-10 hints Preview:** the builder's hints-phase Preview shows
    the highlight in its `PlayerHints`.

### Amended acceptance (expected)

`src/app/globals-css.test.ts` and `e2e/color-tokens.spec.ts` (F1) list
every style. Each gains `linked-clue` → `interactive-faint-hover`, with a
note citing 26-S1. Nothing else in them changes.

### Discrimination

Observed 2026-11-14 before freeze: `npx vitest run
src/lib/clue-reference.test.ts` exited 1 because the helper module was
missing. The browser baseline (`linked-clues`, `--max-failures=1`)
exited 1 at S1-7's first highlight check (expected 1, received 0);
three concurrent cases were interrupted and two did not run. This is
limited missing-runtime discrimination, not evidence of every case failing.
With the throwaway prototype, all 99 tests in the story's seven required
browser specs passed. The handoff records the verification gate result.
No acceptance assertions were changed during prototype validation.

## Repo paths

Acceptance: `src/lib/clue-reference.test.ts`, `e2e/linked-clues.spec.ts`
(new); amended `src/app/globals-css.test.ts`, `e2e/color-tokens.spec.ts`.
Runtime: `src/lib/clue-reference.ts` (new), a `ClueText` component (new,
`src/components/play/`), `src/components/grid/HintsPanel.tsx`,
`src/components/grid/HintBox.tsx`, possibly `src/components/ui/TextInput.tsx`
(a slot for the layer), `src/components/play/PlayerHints.tsx`,
`ProminentHint.tsx`, `PlayHintBar.tsx`, `PlayPuzzle.tsx` and
`src/components/grid/PuzzleGridEditor.tsx` (passing the lookup),
`src/app/globals.css`, `src/components/style-guide/ColorSwatches.tsx`.
Docs: this story, `../EPIC.md`, `../HANDOFF.md`.

**CODE-REVIEW:** no risk path.

## Definition of done

- Frozen acceptance unchanged after freeze.
- `npm run verify` exits 0. The new spec, the amended F1 spec and the
  directly affected hint specs (`hints-panel`, `hint-box`,
  `preview-hints`, `play-design`, `narrow-play`) pass.
- Merged into `epic/26-hint-refinements`, with observed results in the
  handoff.
- The human's visual check happens at epic closeout.
