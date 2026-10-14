# Story D1 — Token vocabulary and style guide

First slice of the visual-design epic, and the foundation for everything
after it. Expands `@theme` from P0's minimal set to a real design
vocabulary with concrete values, and adds a `/style-guide` route where
every component and state can be seen and compared in one place.

Repo paths:
- `src/app/globals.css` — edited: `@theme` block expanded
- `src/app/layout.tsx` — edited: loads the two typefaces
- `src/app/style-guide/page.tsx` — new
- `src/components/style-guide/TokenPanel.tsx` — new
- `e2e/style-guide.spec.ts` — Playwright acceptance tests (**already
  provided — do not edit**)

**`e2e/shell.spec.ts` is not touched.** It asserts that ten specific token
names resolve to non-empty values. This story keeps all ten and adds to
them rather than renaming, so that committed test continues to pass
unchanged.

## Token values

Taken from the bright direction in `crossward-directions.html`. These are
**starting values, not decisions** — the point of the style guide is that
you change them in devtools and hand back the new number.

```css
@theme {
  /* --- typefaces --- */
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-body: Inter, system-ui, sans-serif;
  --font-data: Inter, system-ui, sans-serif;   /* grid letters */

  /* --- surfaces and text (P0 names kept) --- */
  --color-background: #FFFFFF;
  --color-foreground: #14151B;

  /* --- text weights --- */
  --color-ink-2: #565B67;      /* secondary text, captions */
  --color-ink-3: #9BA1AD;      /* tertiary: cell numbers, eyebrows */

  /* --- structure --- */
  --color-rule: #ECEDF1;       /* hairline dividers */
  --color-rule-strong: #DEE0E6;
  --color-hover-tint: #F3F4F7;
  --color-panel-tint: #F6FAF8;

  /* --- accent --- */
  --color-accent: #1F9D6B;
  --color-accent-hover: #178257;
  --color-ok-tint: #E4F6EE;

  /* --- grid (P0 names kept where they existed) --- */
  --color-grid-empty: #DDE0E6;   /* unfilled cell, build phase */
  --color-grid-line: #C7CBD3;
  --color-cell-fill: #DFF3EA;    /* cell holding a letter */
  --color-selected: #35D0A0;     /* the cursor cell */
  --color-required: #B23B34;     /* preview: unfilled symmetric counterpart */

  /* --- hint status (P0 names kept) --- */
  --color-complete: #1F9D6B;
  --color-incomplete: #9BA1AD;

  /* --- shape --- */
  --radius-btn: 999px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-grid: 8px;

  /* --- misc --- */
  --grid-line-width: 1px;
  --text-eyebrow: 12px;
}
```

Space Grotesk and Inter both need loading via `next/font/google` in
`layout.tsx`. P0 removed the create-next-app font boilerplate, so this
adds it back deliberately rather than restoring what was deleted.

## Markup contract

`/style-guide` renders these sections, each with a `data-testid`:

`token-panel`, `sg-text`, `sg-buttons`, `sg-inputs`, `sg-links`,
`sg-hint-rows`, `sg-confirmation`, `sg-error`, `sg-tooltip`, `sg-stepper`,
`sg-grid-build`, `sg-grid-preview`.

The token panel renders one `data-testid="token-row"` per declared token,
each carrying `data-token-name` (e.g. `--color-accent`) and displaying
that name as visible text alongside a swatch or type sample — so the name
to edit in devtools is readable off the page.

Buttons section includes `data-testid="sg-button-primary"`,
`sg-button-quiet`, `sg-button-disabled`, and a pair rendered side by side.
Inputs section includes `sg-input` and a focused example.

## Decisions

**Extend P0's token names, don't rename them.** A cleaner vocabulary might
call `--color-background` `--color-paper`, but `shell.spec.ts` asserts the
existing ten by name. Renaming would mean editing a committed acceptance
test for purely cosmetic gain. The names stay; the values change.

**The grid sections in this story can be static markup.** D3 and D4 build
the real cell components; D1 only needs representative cells so the
palette can be judged. Don't import `PuzzleGrid` here — a style guide that
depends on the component it's meant to inform is circular, and this story
shouldn't be blocked on D3.

**No tests pin colour values.** Tests assert that states are
*distinguishable from each other* and that interactive things look
interactive. Pinning `#1F9D6B` would create friction against the exact
iteration loop this epic exists to enable.

**The style guide is a real route, not a dev-only page.** It costs nothing
to ship, and gating it behind an environment check adds a mechanism with
no benefit at this stage.

## Scope discipline

- **No changes to any existing component.** D2 applies the tokens; D1 only
  defines them and shows them.
- **No changes to `PuzzleGrid`, `GridCell`, `HintsPanel`, or any
  `/puzzles` route.**
- **No layout changes.** D5.
- **No engine changes.**
- **No dark mode, no theme switching.**

## Acceptance examples

**D1-1 — tokens (Playwright)**
- Every token declared in `@theme` resolves to a non-empty value on the
  document root.
- The token panel renders one row per declared token, each showing its
  name as visible text.

**D1-2 — sections (Playwright)**
- All twelve section test-ids render and are visible.

**D1-3 — states are distinguishable (Playwright)**
- The primary and quiet buttons have different background colours.
- The disabled button differs from the primary button (background,
  opacity, or both) and reports `cursor: not-allowed`.
- The primary button reports `cursor: pointer`.
- Links report `cursor: pointer`.
- The input has a visible border: non-zero border width and a border
  colour that isn't fully transparent.
- The focused input differs visually from the unfocused one.
- Complete and incomplete hint rows differ from each other.

**D1-4 — responsive (Playwright)**
- No horizontal overflow at 375×667 or at 1280×800.

## Definition of done

1. `e2e/style-guide.spec.ts` passes: `npm run test:e2e`.
2. `e2e/shell.spec.ts` still passes unmodified.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
