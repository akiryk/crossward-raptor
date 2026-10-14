# Story D9 — Type scale and Fonts tab

Adds a real type scale and wires it into the Fonts tab D8 stubbed out, so
size and weight can be adjusted by eye the same way colours already can.

Today the only size token is `--text-eyebrow`; everything else is hardcoded
Tailwind classes on components, so there's nothing to adjust.

Repo paths:
- `src/app/globals.css` — edited: `--text-eyebrow` replaced by the scale
- `src/components/style-guide/TokenPane.tsx` — edited: Fonts tab controls
- `src/components/style-guide/SizeControl.tsx` — new
- `src/components/style-guide/WeightControl.tsx` — new
- Components rendering the four roles — edited (see below)
- `e2e/style-guide.spec.ts` — **edited** (**already provided — do not
  edit**)
- `e2e/typography.spec.ts` — new (**already provided — do not edit**)

## Required contract

```css
@theme {
  /* sizes */
  --text-headline: 1.75rem;
  --text-body: 1rem;
  --text-help: 0.875rem;
  --text-label: 0.75rem;

  /* weights */
  --weight-normal: 400;
  --weight-bold: 700;
}
```

`--text-eyebrow` is removed. It's the same role under a worse name — a
publishing term for a kicker above a headline — and it's demo-only: nothing
outside `/style-guide`'s own text sample uses it.

## The four roles

- **headline** — real heading elements (`h1`, `h2`). Bold.
- **body** — default prose, list rows, control text. Normal weight.
- **help** — the explanatory line under or beside a control: step reasons,
  confirmation warnings, the geometry-locked message. Smaller than body,
  and coloured `--color-ink-2` (which already exists for secondary text —
  no new colour token).
- **label** — small labels: hint-row keys, size options in the new-puzzle
  dialog, token names in the style guide.

**Report the mapping you arrive at.** I've named the roles from the
outside without reading every component, so which elements belong to which
role is a judgment you're better placed to make. If something doesn't
obviously fit one of the four, leave it on its current classes and say so
rather than forcing it.

## Decisions

**Only the four content roles convert.** Button, link, and nav text stay on
their current classes. Those are interface text, sized relative to the
control they sit in, and they don't participate in the reading hierarchy
the scale describes. Folding them in would mean adjusting `--text-body` to
fix a paragraph and changing every button as a side effect — which makes
the sliders worse at the job they exist for. If utility text later needs
tuning, that's one more token pair, not undoing this.

**Grid letters and cell numbers stay out.** Letters scale with cell size
rather than sitting at a fixed rem, so they don't fit a fixed scale
cleanly. Same for numbers.

**The puzzle title input stays as it is.** Story D2 noted it lost its
heading typography when it became a shared `TextInput`, and `TextInput`
deliberately has no styling escape hatch. Restoring it means a size variant
on that component, which is a real decision rather than a mechanical
conversion — out of scope here, and still an open item.

**Two weights.** Normal and bold cover what the design currently uses. A
medium is common for labels but nothing needs it yet.

**Sliders for sizes, not free text.** A slider with a numeric readout makes
comparison easy and stops a typo producing an unreadable page. Range 0.5rem
to 3rem in 0.05 steps covers every role with room either side.

## Markup contract

In the Fonts tab panel:

- `data-testid="size-control"` with `data-token-name`, containing a range
  input (`data-testid="size-input"`) and the current value as visible text.
- `data-testid="weight-control"` with `data-token-name`, containing a
  control (`data-testid="weight-input"`) offering at least 400 and 700.
- Both write to `document.documentElement.style`, exactly as the colour
  pickers do. Committed values on every load; no persistence.
- The tab's placeholder text is gone.

## Scope discipline

- **No font-family changes and no Google Fonts loading.** D10.
- **No radius or line-width controls.** D10.
- **No new colour tokens** — help text uses `--color-ink-2`.
- **No changes to `Button`, links, or nav text.**
- **No changes to grid rendering.**
- **No engine, persistence, or Server Action changes.**

## Acceptance examples

**D9-1 — tokens (Playwright)**
- All six new tokens resolve on the document root.
- `--text-eyebrow` no longer resolves.

**D9-2 — the Fonts tab (Playwright)**
- Selecting Fonts renders controls, not placeholder text.
- A `size-control` renders for each of the four size tokens, labelled by
  name, each starting at its committed value.
- A `weight-control` renders for each of the two weight tokens.
- Changing `--text-headline` changes the computed font size of a heading in
  the examples pane.
- Changing `--weight-bold` changes the computed font weight of an element
  using it.
- Reloading restores committed values.

**D9-3 — the app uses the scale (Playwright)**
- On `/puzzles`, the page heading's computed font size equals the resolved
  `--text-headline`, and its weight equals `--weight-bold`.
- A list row's computed font size equals `--text-body`.
- In the editor, help text — the step reason revealed by clicking an
  unavailable step — has a computed font size equal to `--text-help` and a
  colour equal to `--color-ink-2`.
- A hint-row label's computed font size equals `--text-label`.
- Changing `--text-body` on `/puzzles` changes list-row size, proving the
  app reads the token rather than a copied value.

## Definition of done

1. `e2e/style-guide.spec.ts` and `e2e/typography.spec.ts` pass.
2. Every other spec passes unmodified. **Check rather than assume** —
   changing text sizes moves elements, which can break layout assertions
   in `editor-layout.spec.ts`.
3. `tsc --noEmit` is clean across the repo.
4. Lint is clean.
5. `npm run verify` exits 0.
6. Report the role mapping: which components you assigned to each of the
   four roles, and anything you left alone.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
