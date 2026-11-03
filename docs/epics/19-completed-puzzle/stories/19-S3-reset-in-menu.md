# Story S3 — Reset in the row menu, Delete set apart

**Status: frozen; implementation pending.** The human added this story on
2026-11-03 after checking S1 and S2 on the dev server, and delegated its
approval and freeze ("Delegate freeze").

**Blast radius: small, no risk path.** Library components and the style
guide's sample; direct delivery to `main`.

## The human's request (2026-11-03)

1. The caller's own completed puzzle has both a Reset button and a
   three-dot menu. Reset belongs inside the menu, after "Make public":
   second to last, Delete last.
2. Reset and Delete are both red, so set Delete apart: when Delete is an
   option (only on the caller's own puzzles), a gray hairline separates
   it, with a 16px top margin (the human's mockup: Duplicate, Open in
   builder, Make public, Reset, a hairline, Delete).
3. Asked where another builder's completed puzzle (no menu) puts Reset:
   "If there is more than one link/button, it should go in a 3-dot menu.
   If there is only one link/button, it should go where the three-dot
   menu goes. The single reset button belongs where it goes today."

## Decisions

- **Own completed row:** no standalone Reset. Its menu reads Duplicate,
  Open in builder, Make public/unlisted, Reset, Delete. Reset is a
  `menuitem` in `error`, test ID `puzzle-menu-reset`, and opens the
  existing reset dialog (`PlayResetDialog`, `resetPlaySession`, both
  unchanged). Rows that aren't completed have no Reset in the menu.
- **Another builder's completed row:** unchanged: no menu, the Reset
  button 12px from the right (17-S3/18-S6).
- **Focus:** choosing Reset closes the menu onto its button, so
  dismissing the dialog returns focus to the menu button. A confirmed
  reset still focuses the row's Play link (14-S2).
- **The hairline:** a `role="separator"` before Delete, in every own
  menu (published or not): 1px of `line-muted` (the menu's own border),
  the menu's full inner width, 16px below the previous item, Delete
  directly under it. Not a menu item; arrow keys skip it.
- **The style guide's sample** (Make public, Delete) shows the hairline
  too.
- **Row room (18-S6):** an own completed row keeps only the menu's
  room on the right (`pr-12`); a foreign completed row keeps `pr-16`.

## Non-goals

- The reset dialog's wording and behavior; the play screen's Reset (S1).
- Menu item styling other than the hairline.

## Acceptance

*Frozen 2026-11-03 (17148c7).* Correction, same day: 19-S3-2's
style-guide case now signs in before visiting `/style-guide`, which
requires a session, so the sample never rendered. It was a fixture fix
only, with assertions unchanged, approved by the human and by an
independent reviewer, and committed spec-only.

- **New `e2e/menu-reset.spec.ts`:** 19-S3-1 the own completed row's
  menu and its Reset (order, color, no standalone button, no Reset on
  unfinished rows); 19-S3-2 the hairline (geometry, color, every own
  menu, arrow keys skip it, the style-guide sample); 19-S3-3 menu Reset
  opens the dialog, Escape returns to the menu button, confirming resets
  in place onto Play; 19-S3-4 the foreign completed row keeps its button.
- **Amended** (own completed rows reach Reset through the menu):

| File | Case | Was | Becomes |
| --- | --- | --- | --- |
| `e2e/library-play.spec.ts` (P5/14-S2) | `expectState`, `openReset`, focus after dismissal | Reset button on every completed row | own rows: no button, Reset from the menu, focus back on the menu button |
| `e2e/library-filters.spec.ts` (18-S4) | list case; own completed case | own completed row has Reset 12px left of its menu | no button; the menu reads … Make unlisted, Reset, Delete |
| `e2e/done-icon.spec.ts` (18-S5-3) | completed rows keep Reset | both rows show the button | the foreign row's button, the own row's menu Reset |
| `e2e/narrow-margin.spec.ts` (18-S6-4) | seeded rows | own completed: menu and Reset | menu only |
| `e2e/modal-design.spec.ts` (F4) | library reset footer | Reset button | the menu's Reset |
| `e2e/no-play-reset.spec.ts` (17-S3-1) | the library's Reset | Reset button | the menu's Reset |

### Discrimination (2026-11-03, observed)

On 4fb3b5d (no S3 runtime), the seven files ran 28 failed, 64 passed.
The failures are every amended case and 19-S3-1's first case, 19-S3-2 and
19-S3-3. 19-S3-1's second case (no Reset on unfinished rows) and 19-S3-4
(the foreign row keeps its button) pass because they guard unchanged
behavior. The amendment to `done-icon.spec.ts` also drops the unused
`PLAY_ROW_HOVER` (S2's lint nit).

## Repo paths

Acceptance (immutable after freeze): the new spec and the six amended
files. Runtime: `src/components/ui/Menu.tsx`,
`src/components/puzzle/PuzzleRow.tsx`,
`src/components/puzzle/PuzzleRowMenu.tsx`,
`src/components/puzzle/LibraryPlayControls.tsx`,
`src/app/style-guide/page.tsx`. Docs: this story, `../EPIC.md`,
`../HANDOFF.md`.

## Definition of done

- Frozen acceptance unchanged after freeze; `npm run verify` and the full
  `npm run test:e2e` exit 0; delivered on `main`.
