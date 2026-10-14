# Story D2 — Core controls

Second slice of the visual-design epic. Applies D1's tokens to the real
app: buttons that read as buttons, interactive things that look
interactive, inputs with visible edges, and headings that read as
headings.

Repo paths:
- `src/components/ui/Button.tsx` — new
- `src/components/ui/TextInput.tsx` — new
- `src/app/style-guide/page.tsx` — edited: uses the real components
- `src/app/puzzles/page.tsx` — edited: heading, list rows, new-puzzle
  button
- `src/app/puzzles/[id]/page.tsx` — edited: danger zone placement
- `src/components/puzzle/PuzzleTitle.tsx` — edited
- `src/components/puzzle/DeletePuzzleButton.tsx` — edited
- `src/components/puzzle/NewPuzzleButton.tsx` — edited
- `src/components/grid/ClearLettersButton.tsx` — edited
- `src/components/grid/PhaseControls.tsx` — edited
- `src/components/grid/HintsPanel.tsx` — edited: hint inputs use
  `TextInput`
- `e2e/controls.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

`e2e/style-guide.spec.ts` should keep passing unmodified — the style guide
swaps static markup for real components while preserving every existing
test id. If that turns out not to be achievable, stop and say so rather
than editing it.

## Required contract

```tsx
// src/components/ui/Button.tsx
export type ButtonVariant = 'primary' | 'quiet' | 'danger';

export function Button(props: {
  variant?: ButtonVariant;        // defaults to 'primary'
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  'data-testid'?: string;
}): JSX.Element;
```

```tsx
// src/components/ui/TextInput.tsx
export function TextInput(props: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  'aria-label': string;           // required — these inputs have no visible label
  placeholder?: string;
  'data-testid'?: string;
}): JSX.Element;
```

## Markup contract

- `data-testid="page-heading"` on the puzzles-list heading, rendered as a
  real heading element.
- `data-testid="danger-zone"` — a region at the end of the puzzle detail
  page containing `delete-puzzle-button` and nothing else.
- `data-testid="editor-actions"` — the group holding the editor's ordinary
  controls (`clear-letters-button`, `enter-hints-button`). Delete is **not**
  in this group.

Existing test ids on all these controls are preserved exactly —
`delete-puzzle-button`, `clear-letters-button`, `enter-hints-button`,
`new-puzzle-button`, `puzzle-title`, `hint-input`, `puzzle-list`,
`puzzle-list-item`.

## Decisions

**Two shared components, not per-site styling.** `Button` and `TextInput`
exist so a styling decision is made once. Every existing control switches
to them rather than growing its own classes.

**The style guide uses the real components.** Otherwise it drifts from the
app it's meant to describe, and the divergence is invisible until someone
notices the guide is lying. Grid samples stay static markup — D3 and D4
own those.

**Delete moves to a danger zone at the end of the page.** It's currently
adjacent to ordinary editing controls, which is how mis-clicks happen. It
also gets the `danger` variant, so it doesn't look like the buttons you
press all the time.

**The title's edit affordance is always visible, not hover-only.** A
subtle border that strengthens on hover and focus. Hover-only affordances
don't exist on touch devices, and this is the one control whose editability
isn't discoverable any other way.

**`aria-label` is required on `TextInput`.** Both current uses — the puzzle
title and hint text fields — have no visible label, so without this they're
unlabelled for screen readers. Making it required in the type means that
can't be forgotten.

**Disabled buttons get `cursor: not-allowed` and no hover response.**
Established in D1/D1b; the shared component is where it becomes real.

## Scope discipline

- **No layout restructuring.** The grid still doesn't fit on screen and
  hints still aren't beside it — that's D5. This story styles controls
  where they already are, except delete moving to the danger zone.
- **No grid cell changes.** D3 and D4.
- **No new-puzzle dialog.** D6.
- **No new tokens.** D1's vocabulary is the palette; if something seems to
  need a new token, stop and ask rather than adding one.
- **No engine changes, no Server Action changes, no persistence changes.**
- **No behaviour changes at all** — every control does exactly what it did
  before.

## Acceptance examples

**D2-1 — buttons (Playwright)**
- Every button on `/puzzles` and `/puzzles/[id]` reports
  `cursor: pointer` and a non-transparent background.
- The delete button's background differs from the new-puzzle button's —
  danger reads differently from primary.
- Hovering the new-puzzle button changes its background.

**D2-2 — the puzzles list (Playwright)**
- `page-heading` renders as a heading element (`h1`/`h2`) and has a larger
  computed font size than a list row.
- List rows report `cursor: pointer` and change appearance on hover.

**D2-3 — inputs (Playwright)**
- The puzzle title input has a visible border when neither hovered nor
  focused — non-zero width, non-transparent colour.
- Focusing it changes its appearance.
- It has a non-empty accessible name.
- Hint inputs (in hints phase) have visible borders and non-empty
  accessible names.

**D2-4 — delete is separated (Playwright)**
- `danger-zone` exists and contains `delete-puzzle-button`.
- `editor-actions` exists, contains `clear-letters-button`, and does
  **not** contain `delete-puzzle-button`.
- Controls inside `editor-actions` don't touch: the container reports a
  non-zero `gap`.

**D2-5 — the style guide still matches (Playwright)**
- `e2e/style-guide.spec.ts` passes unmodified.

## Definition of done

1. `e2e/controls.spec.ts` passes: `npm run test:e2e`.
2. `e2e/style-guide.spec.ts` and every other existing spec pass
   unmodified.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
