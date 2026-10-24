# Design system — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [EPIC](EPIC.md), especially its Decisions.

**Only if needed:** [epic 05](../05-visual-design/EPIC.md) for the token
conventions this epic keeps; `src/app/globals.css` for the old tokens.

## Current state (2026-10-24)

The epic is **approved** by the human (2026-10-24), including its proposals,
with the changes recorded in the EPIC: Preview stays a one-label toggle,
Build/Play becomes a radio choice (new Radio component, story F6), the style
guide becomes a plain catalog, `label` replaces the old 12px label now,
default line heights, 10px radii and 1px strokes, and the accepted contrast.
Inputs came from a redesign backlog, a Figma export
(`~/Downloads/components-colors-text-styles.pdf`) and desktop mockups.
Epics 14, 15 and the username epic are outlined in the EPIC but not created.

The EPIC and this handoff are committed on `main`. No story, test or runtime
change exists yet.

## Verification

Documentation-only; no application or browser checks run or required.

## Next action

Draft the F1 story (color tokens and the style-guide catalog) with proposed
acceptance on `main`, naming any frozen tests it supersedes. Don't freeze or
commit the specification before human approval.

## Resume prompt

Read docs/epics/13-design-system/HANDOFF.md and the F1 section of docs/epics/13-design-system/EPIC.md. Write the F1 story specification and proposed acceptance on main; do not freeze or commit before human approval.
