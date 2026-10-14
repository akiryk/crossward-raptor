# Story P0 — Design tokens & app shell

First slice of the builder-UI epic. Establishes the Tailwind v4 token system
and a minimal page shell before anything functional (grid rendering,
persistence, editing) depends on either. Nothing here touches
`src/engine/`, Prisma, or any puzzle content — this story proves the "swap a
token, the whole app updates" property and a responsive base layout, and
stops there.

Repo paths:
- `app/globals.css` — replace create-next-app's default theme boilerplate
  with a `@theme` token block (existing file, edited)
- `app/layout.tsx` — root layout, composes `Header` + a `main` landmark
  (existing file, edited)
- `components/layout/Header.tsx` — new
- `app/page.tsx` — replaced with minimal placeholder content; the default
  create-next-app starter page is out of scope to keep (existing file,
  edited)
- `e2e/shell.spec.ts` — the acceptance tests (**already provided — do not
  edit**)

**Assumption, stated explicitly:** I haven't seen the current contents of
`app/layout.tsx`, `app/page.tsx`, or `app/globals.css` — they're presumed to
still be create-next-app's defaults (per `README.md`, untouched, with the
Geist font setup the README mentions). This story replaces that boilerplate
wholesale rather than patching around it. If any of the three has already
diverged from the default in a way that conflicts with what's specified
below, stop and say so rather than guessing how to merge them — the same
precondition spirit as `/story` step 0, even though this story isn't gated
by that skill.

## Required component/markup contract

The tests below depend on this exact contract. Match it.

```tsx
// components/layout/Header.tsx
export function Header(): JSX.Element;
```
Renders a `<header data-testid="app-header">` landmark. Contains the app
name, "Crossward", as visible text. Has a background using a theme color
token (not transparent) — even at this minimal stage, the header should
read as a distinct region from the page body, not just styled text floating
on the same background.

```tsx
// app/layout.tsx (root layout)
```
Wraps `children` with `<Header />` above a `<main data-testid="app-main">`
landmark that fills the remaining viewport height. Removes create-next-app's
default font-loading/theme boilerplate in favor of the tokens defined in
`globals.css`.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: /* ... */;
  --color-foreground: /* ... */;
  --color-selected: /* ... */;
  --color-complete: /* ... */;
  --color-incomplete: /* ... */;
  --color-grid-line: /* ... */;

  --font-display: /* ... */;
  --font-body: /* ... */;
  --font-data: /* ... */;

  --grid-line-width: /* ... */;
}
```

```tsx
// app/page.tsx
```
Minimal placeholder content proving the shell renders — a short line of
text is enough. The real home experience (puzzle list, "New Puzzle") is
Story Group P1's job, not this story's.

## Decisions

**Token values are explicitly provisional.** Pick reasonable, legible
defaults for the six colors and three font roles — nothing here is a
considered design decision worth deliberating over. The whole point of the
`@theme` architecture (per the epic's Conventions) is that these are cheap
to revise later. Do not treat the specific hex values or font names chosen
now as meaningful; treat the *token names* and the fact that everything
routes through them as the actual deliverable.

**Tests check that tokens are wired, not what they equal.** `shell.spec.ts`
asserts that each `--color-*`/`--font-*`/`--grid-line-width` custom property
resolves to a non-empty value on the root element, and that the header is
visibly styled rather than left with a transparent/unstyled background. It
deliberately does not assert exact colors — since those are explicitly
expected to change, a test pinned to a specific hex value would just be a
future annoyance to update, not a meaningful check.

**`--grid-line-width`'s exact utility-generation mechanism is left to
implementation.** Tailwind v4's `@theme` reliably generates matching
utilities for `--color-*` and `--font-*` namespaces. Whether a custom
`--grid-line-width` token gets its own generated utility class or is
consumed via an arbitrary-value reference (e.g. `border-[length:var(--grid-line-width)]`)
is a Tailwind v4 detail worth checking against current docs at
implementation time rather than assuming — either is fine; the test only
checks the CSS variable itself is defined and non-empty, not which syntax
consumes it.

## Scope discipline

- **No puzzle content, no engine wiring.** Nothing in this story imports
  from `src/engine/`. `Cell`, the grid, hints — all later groups.
- **No Prisma, no Neon, no Server Actions.** Persistence is Group P1.
- **No navigation beyond the single home route.** A real nav (puzzle list
  link, etc.) is P1's job once there's somewhere to navigate to.
- **No dark mode, no theme switching.** A single token set for now; nothing
  in the brief asked for more.
- **Layout is not tokenized**, per the epic's Conventions — the shell's
  structure is ordinary JSX/Tailwind utility classes, not something this
  story needs to make configurable.
- **Removing create-next-app's default page content is in scope**, not
  incidental — `app/page.tsx`'s starter content (logo, deploy links, etc.)
  is replaced, not preserved alongside the new placeholder.

## Acceptance examples

**P0-1 — shell renders**
- Visiting `/` shows a header containing the text "Crossward" and a
  `main` landmark.
- The header is visibly distinct from the page background (non-transparent
  background color).

**P0-2 — responsive**
- At a phone-width viewport (375×667), the header is visible and the page
  has no horizontal overflow (`document.documentElement.scrollWidth` does
  not exceed `clientWidth`).
- At a laptop-width viewport (1280×800), same: no horizontal overflow.

**P0-3 — tokens are wired**
- Every token declared in `@theme` (`--color-background`,
  `--color-foreground`, `--color-selected`, `--color-complete`,
  `--color-incomplete`, `--color-grid-line`, `--font-display`,
  `--font-body`, `--font-data`, `--grid-line-width`) resolves to a
  non-empty value via `getComputedStyle` on the document root.

## Definition of done

1. `e2e/shell.spec.ts` passes: `npm run test:e2e`.
2. `tsc --noEmit` is clean across the repo.
3. Lint is clean.
4. `npm run verify` exits 0 (unaffected — still doesn't invoke Playwright).

Write the implementation to make the provided tests green. Do not edit the
tests to match your implementation — the tests are the specification, per
the same convention Groups A–G used with Vitest.
