# Builder UI — Handoff

Current state of the crossword-builder project's second epic, for an agent or
collaborator picking it up fresh. Read alongside `02-builder-ui-epic.md` and
`AGENTS.md`, which remain authoritative for scope and behavior. This document
covers what has actually happened and the decisions that live only in
conversation. See `01-HANDOFF-crossward.md` for the first epic's handoff.

Repo: `crossward-raptor`. Branch `main`. Nothing pushed to a remote.

---

## Where things stand

**The grid-engine epic (Groups A–G) is complete and committed.** `src/engine/`
is a pure, headless module with no DOM and no database, per
`01-HANDOFF-crossward.md`.

**This is a new, second epic: the builder UI.** `docs/epics/02-builder-ui-epic.md`
covers the React/Next.js layer built on top of the engine, plus the
persistence needed to support more than one puzzle. It is scoped to the
builder (creating a puzzle) — the play/solve experience is a separate, later
epic.

**Story P0 (design tokens + app shell) is complete and committed.**
`e2e/shell.spec.ts` passes under `npm run test:e2e`, and `npm run verify`
exits 0.

**The `/story` skill was just generalized to support Playwright acceptance
tests.** `.claude/skills/story/SKILL.md` previously identified a story's
acceptance test by hardcoding `*.test.ts` in steps 0 and 4, which only
matched Vitest. It now reads the story file's own "Repo paths" section to
find every acceptance test file listed there — Vitest, Playwright, or both —
and step 3 loops against `npm run test:e2e` in addition to `npm run verify`
for any story whose Repo paths include an e2e spec file. This epic relies on
that change, since P0 (and likely other early stories in this epic) are
Playwright-only.

### What exists

```
docs/epics/
  02-builder-ui-epic.md       the builder-UI epic, tracked
docs/stories/
  02-P0-tokens-and-shell.md   Story P0's specification, tracked
e2e/
  shell.spec.ts               Story P0's acceptance test — do not edit
docs/handoffs/
  02-HANDOFF-builder-ui.md    this file, tracked
.claude/skills/story/
  SKILL.md                    generalized to read acceptance test files from
                               a story's Repo paths section, not a hardcoded
                               *.test.ts pattern
src/app/
  globals.css                 Story P0 — @theme token block (colors, fonts,
                               grid-line-width), replaces create-next-app
                               defaults
  layout.tsx                  Story P0 — root layout composing Header + main
                               landmark, Geist font boilerplate removed
  page.tsx                    Story P0 — minimal placeholder, create-next-app
                               starter content removed
src/components/layout/
  Header.tsx                  Story P0 — new
```

---

## Suggested next steps

1. **Story P1 (persistence)** — Prisma schema for `Puzzle`, Neon connection,
   and create/list/load/save Server Actions, per
   `docs/epics/02-builder-ui-epic.md`.
