# The completed puzzle — Handoff

## Read first

1. This handoff; AGENTS only if not already supplied.
2. [S1](stories/19-S1-completed-puzzle.md) and
   [S2](stories/19-S2-library-touches.md): their verification sections.

## Current state (2026-11-03)

- [S1](stories/19-S1-completed-puzzle.md) and
  [S2](stories/19-S2-library-touches.md): delivered, pushed in 4fb3b5d.
  The human checked them on the dev server and asked for S3.
- [S3](stories/19-S3-reset-in-menu.md): added by the human, who
  delegated its approval and freeze. Frozen 17148c7. A frozen-test
  correction (the style-guide case signs in) was approved by the human,
  independently reviewed, and committed spec-only in 1423acd. Implemented
  in the commit after it. **S3 is not pushed**: `origin/main` is 4fb3b5d.

Neither story touches a CODE-REVIEW risk path: direct delivery to `main`.

## Verification

- S1/S2 final tree (645a25b): `npm run verify` exit 0; full e2e 1013
  passed.
- S3: see the story's "Implementation verification". `verify` exit 0;
  the focused e2e run was green apart from the since-corrected case. The
  full `npm run test:e2e` has not run.

## Next action

Run `npm run test:e2e -- e2e/menu-reset.spec.ts`, then the full
`npm run test:e2e` on local `main`. If both pass along with `npm run
verify`, push `main`, set S3's status to delivered, and update this
handoff. Then the human checks S3 on the dev server, and after that
comes the epic's independent closeout audit
([epic index](../README.md#close-an-epic)).

## Resume prompt

Read docs/epics/19-completed-puzzle/HANDOFF.md and docs/epics/19-completed-puzzle/stories/19-S3-reset-in-menu.md. Run S3's e2e checks on local main and, once they and verify pass, push main.
