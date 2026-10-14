# Story D10 — Utility tab and font loading

Fills in the last tab D8 stubbed out, and adds font-family switching so the
whole token set is adjustable by eye. Closes out the style-guide work.

Repo paths:
- `src/lib/google-font.ts` — new
- `src/lib/google-font.test.ts` — Vitest acceptance tests (**already
  provided — do not edit**)
- `src/components/style-guide/UtilityControl.tsx` — new
- `src/components/style-guide/FontLoader.tsx` — new
- `src/components/style-guide/TokenPane.tsx` — edited: Utility tab
  controls, font-family controls in the Fonts tab
- `e2e/style-guide.spec.ts` — **edited** (**already provided — do not
  edit**)

## Required contract

```ts
// src/lib/google-font.ts

export interface GoogleFontLink {
  readonly href: string;
  readonly families: readonly string[];
}

/**
 * Parses a Google Fonts stylesheet URL into the families it provides.
 * Returns null for anything that isn't a fonts.googleapis.com URL, or that
 * names no families -- a style guide that injects an arbitrary stylesheet
 * from any host is a hole, not a feature.
 *
 * Handles the `+` encoding for spaces ("Space+Grotesk" -> "Space Grotesk")
 * and multiple `family=` parameters in one URL.
 */
export function parseGoogleFontUrl(url: string): GoogleFontLink | null;
```

## Decisions

**Font-family controls live in the Fonts tab, not Utility.** The original
split put font loading in D10 alongside radii, but that was about
sequencing, not grouping. A family selector belongs with size and weight.
Utility holds what's left: radii and line width.

**Only `fonts.googleapis.com` URLs are accepted.** Injecting a stylesheet
from an arbitrary host into the page is a real hole. Validating the host in
a pure function makes the rule testable rather than a comment someone can
drift from.

**Each utility control pairs a slider with an editable number.** The number
is authoritative; the slider is a convenience bounded at a sensible range
(0–64px for radii, 0–8px for line width, step 0.5). This matters because
`--radius-btn` is `999px` — a pill — which no usable slider range can
reach. Pegging the slider at its maximum while the field shows the real
value is honest; picking a slider range that excludes a committed value
would not be.

**Family selection is a list, not free text.** The three font tokens each
get a select listing the committed families plus any loaded from a pasted
URL. Free text would let you name a family that isn't loaded and see
nothing happen, with no way to tell whether the token or the font was the
problem.

**No persistence, same as D8 and D9.** Committed values on every load,
including any loaded font link. Paste it again next session, or tell me the
value to commit.

## Markup contract

Utility tab panel:
- `data-testid="utility-control"` with `data-token-name`, containing a
  range input (`data-testid="utility-range"`), an editable number
  (`data-testid="utility-number"`), and the token name as visible text.
- Covers `--radius-btn`, `--radius-md`, `--radius-lg`, `--radius-grid`,
  `--grid-line-width`.

Fonts tab panel (added to D9's controls):
- `data-testid="font-url-input"` — where a Google Fonts URL is pasted.
- `data-testid="font-url-apply"` — applies it.
- `data-testid="font-url-error"` — shown when the URL is rejected, with
  visible text saying why. Absent otherwise.
- `data-testid="font-family-control"` with `data-token-name` for each of
  `--font-display`, `--font-body`, `--font-data`, containing a select
  (`data-testid="font-family-select"`).

## Scope discipline

- **No new tokens.** Every token controlled here already exists.
- **No changes to any app route or component outside
  `src/components/style-guide/`.**
- **No persistence.**
- **No self-hosted or uploaded fonts** — Google Fonts URLs only.
- **No changes to the type scale or colour pickers.** D9 and D8.
- **No engine, persistence, or Server Action changes.**

## Acceptance examples

**D10-1 — `parseGoogleFontUrl` (Vitest)**
- A standard URL (`https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap`)
  → families `['Inter']`, href preserved.
- `+` decodes to a space: `family=Space+Grotesk` → `['Space Grotesk']`.
- Two `family=` parameters → both families, in order.
- A URL on any other host → `null`, including one whose path mimics
  Google's.
- `http://` on the Google host → `null`; only `https` is accepted.
- A Google URL with no `family=` → `null`.
- Empty string, whitespace, and obvious non-URLs → `null`.
- Purity: two calls on the same input are deep-equal.

**D10-2 — the Utility tab (Playwright)**
- Selecting Utility renders controls, not placeholder text.
- A `utility-control` renders for each of the five tokens, labelled by
  name, its number field starting at the committed value — including
  `--radius-btn` at its out-of-slider-range value.
- Changing `--radius-md` changes the computed border radius of an element
  using it.
- Changing `--grid-line-width` changes the measured distance between
  adjacent grid cells in the build sample.
- Reloading restores committed values.

**D10-3 — font loading (Playwright)**
- Pasting a valid Google Fonts URL and applying it adds a stylesheet link
  to the document head, and the loaded family appears as an option in each
  `font-family-select`.
- Selecting that family for `--font-body` changes the computed font family
  of body text in the examples pane.
- Pasting a non-Google URL shows `font-url-error` and adds no stylesheet
  link.
- Pasting nonsense shows the error too.
- Reloading clears loaded fonts and restores committed families.

## Definition of done

1. `npx vitest run src/lib/google-font.test.ts` passes (covered by
   `npm run verify`).
2. `e2e/style-guide.spec.ts` passes.
3. Every other spec passes unmodified. **Check rather than assume.**
4. `tsc --noEmit` is clean across the repo.
5. Lint is clean.
6. `npm run verify` exits 0.

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification.
