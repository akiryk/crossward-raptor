# Story D1b — Style guide refinements

A follow-up to D1, from looking at the rendered style guide. Three
corrections, all to D1's own output rather than new surface area.

Repo paths:
- `src/app/globals.css` — edited: remove the duplicate token, add hover
  values if any are missing
- `src/app/style-guide/page.tsx` — edited: hover section, richer grid
  samples, hairline fix
- `src/components/style-guide/TokenPanel.tsx` — edited: drop the removed
  token
- `e2e/shell.spec.ts` — edited (**authorized edit to a committed
  acceptance test**: one token removed from its list)
- `e2e/style-guide.spec.ts` — edited (**already provided — do not edit**)

## 1. Collapse `--color-complete` into `--color-accent`

Both are `#1F9D6B` — the same colour under two names, inherited from the
mock, which defined `--ok-ink` separately from `--accent` and then gave
them identical values. Two names for one value drift apart later for no
reason.

Remove `--color-complete`. Anything indicating hint completeness uses
`--color-accent`. `--color-incomplete` stays — it's a genuinely different
colour serving a different purpose.

This requires removing the token from `shell.spec.ts`'s assertion list
(P0's) and from `style-guide.spec.ts`'s. Both are mechanical single-line
removals; nothing else in either file changes.

## 2. Hover states

`--color-accent-hover` is declared but unused, and the style guide shows
no hover state for anything. Add real hover styling for buttons and links,
and a `data-testid="sg-hover"` section demonstrating them.

Hover is testable rather than purely aesthetic: Playwright can hover an
element and compare computed styles before and after, which is a
structural assertion in the same spirit as the rest of this epic's tests.

**Disabled buttons don't get a hover state** — they're not interactive,
and a hover response would imply otherwise.

**Anything conveyed on hover needs a non-hover path**, since hover doesn't
exist on touch devices. That matters for tooltips more than buttons, but
the principle applies wherever hover carries meaning rather than just
polish.

## 3. Grid cells: one hairline, one colour

Cells are currently separated by background showing through, which makes
the division vary in width and take its colour from whatever is behind it.

The correct technique, which the mock uses in preview: the grid container
is painted `--color-grid-line` and uses `gap: var(--grid-line-width)`
(1px). Cells paint their own fill over it. Every division is then exactly
one pixel of exactly one colour, regardless of what the adjacent cells
contain — including between two black cells, where the line must still be
visible.

Individual cells carry no borders of their own; the gap *is* the border.
Cells stay square: fixed equal width and height, never resized by content.

## 4. Grid samples show real states

The current samples are blank cells, which communicate little. Each grid
sample should show identifiable states:

- **Build phase**: an empty cell, a lettered cell, a numbered slot-start
  cell, the cursor cell, and a symmetric-hint cell (white, no outline).
- **Preview**: a black cell, a lettered white cell, a numbered cell, and a
  red required cell (an unfilled symmetric counterpart).

Still static markup — D3 and D4 build the real components. This story only
makes the palette judgable.

## Scope discipline

- **No changes to any app component or route outside `/style-guide`.** D2
  applies tokens to the real app.
- **No layout work.** D5.
- **No engine changes.**
- **No new tokens** beyond what's already declared.

## Acceptance examples

**D1b-1 — token removal (Playwright)**
- `--color-complete` no longer resolves on the document root.
- `--color-accent` and `--color-incomplete` still resolve.
- The token panel has no row for `--color-complete`.

**D1b-2 — hover (Playwright)**
- Hovering the primary button changes its background colour.
- Hovering a link changes at least one of colour, text-decoration, or
  background.
- Hovering the disabled button changes nothing.

**D1b-3 — grid hairline (Playwright)**
- Each grid container's computed `gap` equals the resolved
  `--grid-line-width`.
- Each grid container's computed background colour equals the resolved
  `--color-grid-line`.
- Grid cells report a border width of `0px` — the gap provides the
  division, not per-cell borders.
- Cells are square: computed width equals computed height.
- A lettered cell and an empty cell have identical dimensions.

**D1b-4 — grid samples (Playwright)**
- The build-phase sample contains a cell with a letter and a cell with a
  number.
- The preview sample contains a cell with a letter, a cell with a number,
  and a required (red) cell.

## Definition of done

1. `e2e/style-guide.spec.ts` passes: `npm run test:e2e`.
2. `e2e/shell.spec.ts` passes with its one-line removal.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Apart from the
authorized one-line removal in `shell.spec.ts`, do not edit the tests to
match your implementation — the tests are the specification.
